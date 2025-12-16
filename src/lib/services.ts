import { supabase } from "./supabase";
import { Ubicacion, PriceCalculation } from "@/types";
import { cacheManager, createCacheKey } from "./cache";

/**
 * ============================================
 * SERVICIOS DE DATOS - EyTaxi Web
 * ============================================
 * 
 * Este módulo utiliza VISTAS ESTÁNDAR de Supabase para optimizar
 * el rendimiento de las consultas más frecuentes:
 * 
 * 📊 Vistas Estándar Disponibles:
 * - ubicaciones_optimizadas: Ubicaciones con contadores pre-calculados
 * - excursiones_populares: Excursiones con datos de ubicación enriquecidos
 * - paquetes_activos: Paquetes de viaje activos ordenados
 * - distancias_frecuentes: Distancias con información de origen/destino
 * 
 * 🚀 Ventajas:
 * - Reducción de JOINs en tiempo real
 * - Datos pre-calculados (contadores, agregaciones)
 * - Actualización automática con cada cambio en las tablas
 * - Consultas más rápidas sin necesidad de refresh manual
 * 
 * 🔄 Sistema de Fallback:
 * Todas las funciones intentan usar las vistas primero.
 * Si no existen (primera instalación), automáticamente usan las tablas originales.
 * 
 * 📝 Nota: Para crear las vistas, ejecutar database/materialized_views.sql
 * 
 * 💾 Sistema de Caché:
 * - Desarrollo: 1 minuto (actualización rápida)
 * - Producción: 10-30 minutos (mejor rendimiento)
 * - Limpieza manual: clearAllCache() o desde consola con window.clearCache()
 */

// Detectar entorno de desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

// Tiempos de caché adaptativos
const CACHE_TIME = {
  ubicaciones: isDevelopment ? 1 * 60 * 1000 : 10 * 60 * 1000,  // 1 min dev / 10 min prod
  precios: isDevelopment ? 1 * 60 * 1000 : 30 * 60 * 1000,      // 1 min dev / 30 min prod
};

/**
 * Limpia todo el caché de datos
 * Útil después de actualizar la base de datos en desarrollo
 */
export function clearAllCache(): void {
  cacheManager.clear();
  console.log('✅ Caché limpiado completamente');
}

/**
 * Limpia el caché de ubicaciones
 */
export function clearUbicacionesCache(): void {
  const stats = cacheManager.getStats();
  stats.keys.forEach(key => {
    if (key.includes('ubicaciones')) {
      cacheManager.delete(key);
    }
  });
  console.log('✅ Caché de ubicaciones limpiado');
}

/**
 * Limpia el caché de precios
 */
export function clearPreciosCache(): void {
  const stats = cacheManager.getStats();
  stats.keys.forEach(key => {
    if (key.includes('price')) {
      cacheManager.delete(key);
    }
  });
  console.log('✅ Caché de precios limpiado');
}

// Hacer las funciones accesibles desde la consola del navegador en desarrollo
if (typeof window !== 'undefined' && isDevelopment) {
  (window as any).clearCache = clearAllCache;
  (window as any).clearUbicacionesCache = clearUbicacionesCache;
  (window as any).clearPreciosCache = clearPreciosCache;
  (window as any).getCacheStats = () => cacheManager.getStats();
}

/**
 * Función de redondeo personalizado (misma lógica que Supabase)
 * - Si termina en 5 → deja el número tal cual
 * - Si termina en 6,7,8,9 → sube a la decena siguiente
 * - Si termina en 0-4 → baja a la decena inferior
 */
function redondeoPersonalizado(valor: number): number {
  const entero = Math.floor(valor);
  const unidad = entero % 10;

  if (unidad === 5) {
    return entero;
  } else if (unidad >= 6) {
    return Math.floor(entero / 10 + 1) * 10;
  } else {
    return Math.floor(entero / 10) * 10;
  }
}

/**
 * Obtiene todas las ubicaciones disponibles desde Supabase
 * ✅ Con caché adaptativo (1 min dev / 10 min prod)
 * ✅ Usar vista estándar si está disponible (fallback a tabla original)
 */
export async function getUbicaciones(): Promise<Ubicacion[]> {
  return cacheManager.getOrFetch(
    'ubicaciones_all',
    async () => {
      // ✅ Intentar primero con vista materializada
      let { data, error } = await supabase
        .from("ubicaciones_optimizadas")
        .select("*");

      // Si la vista no existe, usar tabla original
      if (error && error.message.includes('does not exist')) {
        const result = await supabase
          .from("ubicaciones_cuba")
          .select("*")
          .order("nombre", { ascending: true });
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error fetching ubicaciones:", error);
        throw error;
      }

      return data || [];
    },
    CACHE_TIME.ubicaciones
  );
}

/**
 * Busca ubicaciones por nombre
 * ✅ Usar vista estándar si está disponible (fallback a tabla original)
 */
export async function searchUbicaciones(query: string): Promise<Ubicacion[]> {
  // ✅ Intentar primero con vista materializada
  let { data, error } = await supabase
    .from("ubicaciones_optimizadas")
    .select("*")
    .ilike("nombre", `%${query}%`)
    .order("nombre", { ascending: true })
    .limit(10);

  // Si la vista no existe, usar tabla original
  if (error && error.message.includes('does not exist')) {
    const result = await supabase
      .from("ubicaciones_cuba")
      .select("*")
      .ilike("nombre", `%${query}%`)
      .order("nombre", { ascending: true })
      .limit(10);
    
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Error searching ubicaciones:", error);
    throw error;
  }

  return data || [];
}

/**
 * Calcula el precio, distancia y tiempo estimado entre dos ubicaciones
 * Usa la funcion RPC de Supabase 'calculate_reservation_details' igual que Flutter
 * ✅ Con caché de 30 minutos (los precios no cambian frecuentemente)
 */
export async function calculatePrice(
  origenId: number,
  destinoId: number,
  taxiType: "colectivo" | "privado",
  cantidadPersonas: number
): Promise<PriceCalculation> {
  const cacheKey = createCacheKey('price', origenId, destinoId, taxiType, cantidadPersonas);
  
  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      try {
        // Llamar a la funcion RPC de Supabase
        const { data, error } = await supabase.rpc(
          "calculate_reservation_details",
          {
            p_id_origen: origenId,
            p_id_destino: destinoId,
          }
        );

        if (error) {
          console.error("Error calling calculate_reservation_details:", error);
          throw error;
        }

    if (!data) {
      throw new Error("No se pudo calcular la ruta");
    }

    // La funcion RPC retorna un objeto o un array con un elemento
    const result = Array.isArray(data) ? data[0] : data;

    // Extraer los valores de la respuesta (igual que Flutter)
    const distance_km = parseFloat(result.distancia_km?.toString() || "0");
    const estimated_time_minutes = parseFloat(
      result.tiempo_min?.toString() || "0"
    );
    const base_price = parseFloat(result.precio?.toString() || "0");

    // Calcular precio segun tipo de taxi (misma logica que Flutter)
    let price = 0;
    const precioxpersona = redondeoPersonalizado(base_price / 4);
    if (taxiType === "colectivo") {
      // Para colectivo: (precio_base / 4) * cantidad_personas

      const precioColectivo = precioxpersona * cantidadPersonas;
      // Aplicar redondeo personalizado
      price = redondeoPersonalizado(precioColectivo);
    } else {
      // Para privado: si <= 4 personas usar precio base, si no (precio_base / 4) * personas
      if (cantidadPersonas <= 4) {
        price = base_price;
      } else {
        price = precioxpersona * cantidadPersonas;
      }
      // Redondear precio privado a 2 decimales
      price = Math.round(price * 100) / 100;
    }

    return {
      price,
      distance_km: Math.round(distance_km * 10) / 10, // Redondear a 1 decimal
      estimated_time_minutes: Math.round(estimated_time_minutes),
    };
      } catch (error) {
        console.error("Error calculating price:", error);
        throw error;
      }
    },
    CACHE_TIME.precios
  );
}

/**
 * Crea una nueva solicitud de viaje
 */
export async function createTripRequest(
  tripData: Omit<any, "id">
): Promise<string> {
  const { data, error } = await supabase
    .from("trip_requests")
    .insert([tripData])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating trip request:", error);
    throw error;
  }

  return data.id;
}

/**
 * Obtiene las ubicaciones unicas disponibles en la tabla excursiones
 * ✅ Usar vista estándar si está disponible (fallback a tabla original)
 */
export async function fetchUbicacionesExcursiones(): Promise<string[]> {
  // ✅ Intentar primero con vista materializada
  let { data, error } = await supabase
    .from("excursiones_populares")
    .select("ubicacion")
    .order("orden", { ascending: true });

  // Si la vista no existe, usar tabla original
  if (error && error.message.includes('does not exist')) {
    const result = await supabase
      .from("excursiones")
      .select("ubicacion")
      .order("orden", { ascending: true });
    
    data = result.data;
    error = result.error;
  }

  if (error || !data) {
    return [];
  }

  // Extraer ubicaciones unicas
  const ubicaciones = [...new Set(data.map((item: any) => item.ubicacion))];
  return ubicaciones as string[];
}

/**
 * Obtiene las excursiones disponibles filtradas por ubicacion
 * ✅ Usar vista estándar si está disponible (fallback a tabla original)
 */
export async function fetchExcursiones(
  ubicacion: string
): Promise<import("@/types").Excursion[]> {
  // ✅ Intentar primero con vista materializada
  let { data, error } = await supabase
    .from("excursiones_populares")
    .select("*")
    .eq("ubicacion", ubicacion.trim())
    .order("orden", { ascending: true });

  // Si la vista no existe, usar tabla original
  if (error && error.message.includes('does not exist')) {
    const result = await supabase
      .from("excursiones")
      .select("*")
      .eq("ubicacion", ubicacion.trim())
      .order("orden", { ascending: true });
    
    data = result.data;
    error = result.error;
  }

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * Obtiene todos los paquetes de viaje activos ordenados
 * ✅ Usar vista estándar si está disponible (fallback a tabla original)
 */
export async function fetchPaquetesViaje(): Promise<
  import("@/types").PaqueteViaje[]
> {
  // ✅ Intentar primero con vista materializada
  let { data, error } = await supabase
    .from("paquetes_activos")
    .select("*");

  // Si la vista no existe, usar tabla original
  if (error && error.message.includes('does not exist')) {
    const result = await supabase
      .from("paquetes_viaje")
      .select("*")
      .eq("activo", true)
      .order("orden");
    
    data = result.data;
    error = result.error;
  }

  if (error) {
    return [];
  }

  return data || [];
}
