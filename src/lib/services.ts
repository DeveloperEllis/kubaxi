import { supabase } from './supabase'
import { Ubicacion, PriceCalculation } from '@/types'

/**
 * Obtiene todas las ubicaciones disponibles desde Supabase
 */
export async function getUbicaciones(): Promise<Ubicacion[]> {
  const { data, error } = await supabase
    .from('ubicaciones_cuba')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching ubicaciones:', error)
    throw error
  }

  return data || []
}

/**
 * Busca ubicaciones por nombre
 */
export async function searchUbicaciones(query: string): Promise<Ubicacion[]> {
  const { data, error } = await supabase
    .from('ubicaciones_cuba')
    .select('*')
    .ilike('nombre', `%${query}%`)
    .order('nombre', { ascending: true })
    .limit(10)

  if (error) {
    console.error('Error searching ubicaciones:', error)
    throw error
  }

  return data || []
}

/**
 * Calcula el precio, distancia y tiempo estimado entre dos ubicaciones
 * Usa la funcion RPC de Supabase 'calculate_reservation_details' igual que Flutter
 */
export async function calculatePrice(
  origenId: number,
  destinoId: number,
  taxiType: 'colectivo' | 'privado',
  cantidadPersonas: number
): Promise<PriceCalculation> {
  try {
    // Llamar a la funcion RPC de Supabase
    const { data, error } = await supabase.rpc('calculate_reservation_details', {
      p_id_origen: origenId,
      p_id_destino: destinoId
    })

    if (error) {
      console.error('Error calling calculate_reservation_details:', error)
      throw error
    }

    if (!data) {
      throw new Error('No se pudo calcular la ruta')
    }

    // La funcion RPC retorna un objeto o un array con un elemento
    const result = Array.isArray(data) ? data[0] : data

    // Extraer los valores de la respuesta (igual que Flutter)
    const distance_km = parseFloat(result.distancia_km?.toString() || '0')
    const estimated_time_minutes = parseFloat(result.tiempo_min?.toString() || '0')
    const base_price = parseFloat(result.precio?.toString() || '0')

    // Calcular precio segun tipo de taxi (misma logica que Flutter)
    let price = 0

    if (taxiType === 'colectivo') {
      // Para colectivo: (precio_base / 4) * cantidad_personas
      price = (base_price / 4) * cantidadPersonas
    } else {
      // Para privado: si <= 4 personas usar precio base, si no (precio_base / 4) * personas
      if (cantidadPersonas <= 4) {
        price = base_price
      } else {
        price = (base_price / 4) * cantidadPersonas
      }
    }

    // Redondear precio a 2 decimales
    price = Math.round(price * 100) / 100

    return {
      price,
      distance_km: Math.round(distance_km * 10) / 10, // Redondear a 1 decimal
      estimated_time_minutes: Math.round(estimated_time_minutes)
    }
  } catch (error) {
    console.error('Error calculating price:', error)
    throw error
  }
}

/**
 * Crea una nueva solicitud de viaje
 */
export async function createTripRequest(tripData: Omit<any, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('trip_requests')
    .insert([tripData])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating trip request:', error)
    throw error
  }

  return data.id
}

/**
 * Obtiene las ubicaciones unicas disponibles en la tabla excursiones
 */
export async function fetchUbicacionesExcursiones(): Promise<string[]> {
  const { data, error } = await supabase
    .from('excursiones')
    .select('ubicacion')

  if (error) {
    return []
  }

  // Extraer ubicaciones unicas
  const ubicaciones = [...new Set(data.map((item: any) => item.ubicacion))]
  return ubicaciones as string[]
}

/**
 * Obtiene las excursiones disponibles filtradas por ubicacion
 */
export async function fetchExcursiones(ubicacion: string): Promise<import('@/types').Excursion[]> {
  const { data, error } = await supabase
    .from('excursiones')
    .select('*')
    .eq('ubicacion', ubicacion.trim())
    .order('titulo_es')

  if (error) {
    return []
  }

  return data || []
}

/**
 * Obtiene todos los paquetes de viaje activos ordenados
 */
export async function fetchPaquetesViaje(): Promise<import('@/types').PaqueteViaje[]> {
  const { data, error } = await supabase
    .from('paquetes_viaje')
    .select('*')
    .eq('activo', true)
    .order('orden')

  if (error) {
    return []
  }

  return data || []
}
