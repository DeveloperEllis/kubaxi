-- ============================================
-- VISTAS ESTÁNDAR PARA OPTIMIZACIÓN
-- EyTaxi Web - Supabase Database
-- ============================================
-- NOTA: Vistas estándar que se actualizan automáticamente
--       con cada cambio en las tablas base

-- ============================================
-- 1. VISTA ESTÁNDAR: Ubicaciones Optimizadas
-- ============================================
-- Propósito: Vista de ubicaciones con información pre-calculada
-- Mejora: Reduce joins y cálculos repetitivos
-- Uso: Reemplazar consultas a ubicaciones_cuba en el frontend
-- Nota: Vista estándar - se actualiza automáticamente

CREATE OR REPLACE VIEW ubicaciones_optimizadas AS
SELECT 
  u.id,
  u.nombre,
  u.codigo,
  u.region,
  u.tipo,
  u.provincia,
  u.latitud,
  u.longitud,
  u.created_at,
  -- Contadores pre-calculados
  (SELECT COUNT(*) 
   FROM excursiones e 
   WHERE e.ubicacion = u.nombre) as total_excursiones,
  (SELECT COUNT(*) 
   FROM distancias_carretera d 
   WHERE d.id_origen = u.id OR d.id_destino = u.id) as total_rutas
FROM ubicaciones_cuba u
ORDER BY u.nombre;

-- Comentario
COMMENT ON VIEW ubicaciones_optimizadas IS 
'Vista estándar con ubicaciones y estadísticas pre-calculadas. Se actualiza automáticamente.';

-- ============================================
-- 2. VISTA ESTÁNDAR: Excursiones Populares
-- ============================================
-- Propósito: Vista de excursiones con información enriquecida
-- Mejora: Evita joins repetitivos y carga más rápida
-- Uso: Pantalla de excursiones (ExcursionesSection)
-- Nota: Vista estándar - se actualiza automáticamente

CREATE OR REPLACE VIEW excursiones_populares AS
SELECT 
  e.id,
  e.titulo_es,
  e.titulo_en,
  e.titulo_fr,
  e.descripcion_es,
  e.descripcion_en,
  e.descripcion_fr,
  e.ubicacion,
  e.precio,
  e.imagen_url,
  e.precio_por_pax,
  e.min_pax,
  e.max_pax,
  e.precio_por_pax_nivel2,
  e.umbral_nivel2,
  -- Información de ubicación enriquecida
  u.provincia,
  u.region,
  u.tipo as tipo_ubicacion,
  u.latitud,
  u.longitud,
  -- Contador de disponibilidad de rutas
  (SELECT COUNT(*) 
   FROM distancias_carretera d 
   WHERE d.id_destino = u.id) as rutas_disponibles
FROM excursiones e
LEFT JOIN ubicaciones_cuba u ON e.ubicacion = u.nombre
ORDER BY e.precio ASC, e.titulo_es ASC;

-- Comentario
COMMENT ON VIEW excursiones_populares IS 
'Vista estándar con excursiones y datos enriquecidos. Se actualiza automáticamente.';

-- ============================================
-- 3. VISTA ESTÁNDAR: Paquetes Activos
-- ============================================
-- Propósito: Vista de paquetes de viaje con información lista para mostrar
-- Mejora: Carga instantánea de paquetes en homepage
-- Uso: Pantalla principal (PaquetesSection)
-- Nota: Vista estándar - se actualiza automáticamente

CREATE OR REPLACE VIEW paquetes_activos AS
SELECT 
  p.id,
  p.nombre_es,
  p.nombre_en,
  p.nombre_fr,
  p.descripcion_es,
  p.descripcion_en,
  p.descripcion_fr,
  p.region,
  p.precio,
  p.duracion_dias,
  p.duracion_noches,
  p.imagen_url,
  p.incluye_es,
  p.incluye_en,
  p.incluye_fr,
  p.destinos_es,
  p.destinos_en,
  p.destinos_fr,
  p.activo,
  p.orden,
  p.created_at,
  p.updated_at
FROM paquetes_viaje p
WHERE p.activo = true
ORDER BY p.orden ASC, p.precio ASC;

-- Comentario
COMMENT ON VIEW paquetes_activos IS 
'Vista estándar con paquetes activos y listos para mostrar. Se actualiza automáticamente.';

-- ============================================
-- 4. VISTA ESTÁNDAR: Distancias Frecuentes
-- ============================================
-- Propósito: Pre-calcular distancias más consultadas
-- Mejora: Reduce carga en función RPC calculate_reservation_details
-- Uso: Autocompletar y sugerencias de rutas
-- Nota: Vista estándar - se actualiza automáticamente

CREATE OR REPLACE VIEW distancias_frecuentes AS
SELECT 
  d.id_origen,
  d.id_destino,
  d.distancia_km,
  d.tiempo_min,
  -- Nombres legibles de origen
  o.nombre as origen_nombre,
  o.provincia as origen_provincia,
  o.region as origen_region,
  o.tipo as origen_tipo,
  -- Nombres legibles de destino
  dest.nombre as destino_nombre,
  dest.provincia as destino_provincia,
  dest.region as destino_region,
  dest.tipo as destino_tipo,
  -- Clasificación por región
  CASE 
    WHEN o.region = 'occidente' AND dest.region = 'occidente' THEN 'intra-occidente'
    WHEN o.region = 'centro' AND dest.region = 'centro' THEN 'intra-centro'
    WHEN o.region = 'oriente' AND dest.region = 'oriente' THEN 'intra-oriente'
    ELSE 'inter-regional'
  END as tipo_ruta,
  -- Tiempo estimado en horas
  ROUND((d.tiempo_min / 60.0)::numeric, 2) as tiempo_horas
FROM distancias_carretera d
INNER JOIN ubicaciones_cuba o ON d.id_origen = o.id
INNER JOIN ubicaciones_cuba dest ON d.id_destino = dest.id
ORDER BY d.distancia_km ASC;

-- Comentario
COMMENT ON VIEW distancias_frecuentes IS 
'Vista estándar con distancias enriquecidas para búsquedas rápidas. Se actualiza automáticamente.';

-- ============================================
-- 5. NOTA: VISTAS ESTÁNDAR - NO REQUIEREN REFRESH
-- ============================================
-- Las vistas estándar se actualizan automáticamente con cada cambio
-- en las tablas base. No es necesario ejecutar REFRESH manualmente.

-- ============================================
-- 6. CONFIGURACIÓN - NO REQUERIDA
-- ============================================
-- Las vistas estándar no requieren configuración adicional.
-- Se actualizan automáticamente con cada INSERT/UPDATE/DELETE.

-- ============================================
-- 7. POLÍTICAS RLS PARA VISTAS ESTÁNDAR
-- ============================================
-- Propósito: Habilitar acceso público de lectura a las vistas
-- Las vistas heredan los permisos de las tablas base

-- Ubicaciones optimizadas
ALTER VIEW ubicaciones_optimizadas OWNER TO postgres;

-- Excursiones populares
ALTER VIEW excursiones_populares OWNER TO postgres;

-- Paquetes activos
ALTER VIEW paquetes_activos OWNER TO postgres;

-- Distancias frecuentes
ALTER VIEW distancias_frecuentes OWNER TO postgres;

-- ============================================
-- 8. INSTRUCCIONES DE USO EN FRONTEND
-- ============================================
/*

PASO 1: Actualizar servicios para usar vistas estándar

// Antes:
const { data } = await supabase
  .from('ubicaciones_cuba')
  .select('*')
  .order('nombre');

// Después:
const { data } = await supabase
  .from('ubicaciones_optimizadas')
  .select('*');

PASO 2: Actualizar queries de excursiones

// Antes:
const { data } = await supabase
  .from('excursiones')
  .select(`
    *,
    ubicaciones_cuba(provincia, region)
  `)
  .eq('activa', true);

// Después (ya incluye join):
const { data } = await supabase
  .from('excursiones_populares')
  .select('*');

PASO 3: Actualizar queries de paquetes

// Antes:
const { data } = await supabase
  .from('paquetes_viaje')
  .select('*')
  .eq('activo', true)
  .order('orden', { ascending: true });

// Después:
const { data } = await supabase
  .from('paquetes_activos')
  .select('*');

PASO 4: Usar distancias pre-calculadas (opcional)

// Consultar distancias con nombres incluidos
const { data } = await supabase
  .from('distancias_frecuentes')
  .select('*')
  .eq('id_origen', origenId)
  .eq('id_destino', destinoId)
  .single();

PASO 5: Las vistas se actualizan automáticamente

// No es necesario hacer refresh manual.
// Los cambios en las tablas base se reflejan inmediatamente en las vistas.

*/

-- ============================================
-- 9. VERIFICACIÓN Y MONITOREO
-- ============================================

-- Ver vistas creadas
-- SELECT 
--   schemaname,
--   viewname,
--   definition
-- FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname IN ('ubicaciones_optimizadas', 'excursiones_populares', 'paquetes_activos', 'distancias_frecuentes');

-- Probar consulta a una vista
-- SELECT * FROM ubicaciones_optimizadas LIMIT 5;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
