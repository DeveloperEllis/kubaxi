-- ============================================
-- EJEMPLOS PRÁCTICOS DE USO
-- Sistema de Precios Personalizados
-- ============================================

-- ============================================
-- 1. CONSULTAS ÚTILES
-- ============================================

-- Obtener todos los precios custom con detalles
SELECT 
  origen_nombre,
  destino_nombre,
  precio_custom,
  precio_automatico,
  diferencia_precio,
  notas
FROM precios_transfer_con_nombres
ORDER BY diferencia_precio DESC;

-- Rutas con mayor ajuste positivo (precio custom > automático)
SELECT 
  origen_nombre || ' → ' || destino_nombre as ruta,
  precio_custom,
  precio_automatico,
  diferencia_precio,
  notas
FROM precios_transfer_con_nombres
WHERE diferencia_precio > 0
ORDER BY diferencia_precio DESC
LIMIT 10;

-- Rutas con mayor descuento (precio custom < automático)
SELECT 
  origen_nombre || ' → ' || destino_nombre as ruta,
  precio_custom,
  precio_automatico,
  diferencia_precio,
  notas
FROM precios_transfer_con_nombres
WHERE diferencia_precio < 0
ORDER BY diferencia_precio ASC
LIMIT 10;

-- Buscar precios custom por provincia
SELECT * FROM precios_transfer_con_nombres
WHERE origen_provincia ILIKE '%Habana%'
OR destino_provincia ILIKE '%Habana%';

-- Estadísticas generales
SELECT 
  COUNT(*) as total_precios_custom,
  ROUND(AVG(precio_custom), 2) as precio_custom_promedio,
  ROUND(AVG(precio_automatico), 2) as precio_auto_promedio,
  ROUND(AVG(diferencia_precio), 2) as diferencia_promedio,
  COUNT(*) FILTER (WHERE diferencia_precio > 0) as con_ajuste_positivo,
  COUNT(*) FILTER (WHERE diferencia_precio < 0) as con_descuento
FROM precios_transfer_con_nombres;

-- ============================================
-- 2. AGREGAR PRECIOS CUSTOM - CASOS COMUNES
-- ============================================

-- Ejemplo 1: Ruta con peaje adicional
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 150.0,
  p_tiempo_min := 120.0,
  p_precio_base := 135.0,
  p_notas := 'Ruta incluye peaje de autopista no contemplado en fórmula',
  p_ajustado_por := 'admin'
);

-- Ejemplo 2: Ruta turística popular (precio incrementado)
SELECT upsert_precio_custom(
  p_id_origen := 3,
  p_id_destino := 5,
  p_distancia_km := 280.0,
  p_tiempo_min := 240.0,
  p_precio_base := 200.0,
  p_notas := 'Ruta turística muy demandada - Varadero a Viñales',
  p_ajustado_por := 'admin'
);

-- Ejemplo 3: Ruta con condiciones difíciles (carretera en mal estado)
SELECT upsert_precio_custom(
  p_id_origen := 7,
  p_id_destino := 9,
  p_distancia_km := 180.0,
  p_tiempo_min := 180.0,
  p_precio_base := 160.0,
  p_notas := 'Carretera en condiciones difíciles, desgaste vehicular mayor',
  p_ajustado_por := 'admin'
);

-- Ejemplo 4: Promoción temporal (precio reducido)
SELECT upsert_precio_custom(
  p_id_origen := 10,
  p_id_destino := 12,
  p_distancia_km := 200.0,
  p_tiempo_min := 150.0,
  p_precio_base := 100.0,
  p_notas := 'Promoción temporada baja hasta marzo 2026',
  p_ajustado_por := 'admin'
);

-- ============================================
-- 3. ACTUALIZAR PRECIOS CUSTOM EXISTENTES
-- ============================================

-- El mismo comando upsert_precio_custom actualiza si existe
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 150.0,
  p_tiempo_min := 120.0,
  p_precio_base := 140.0, -- Nuevo precio
  p_notas := 'Precio actualizado - Peaje incrementado en 2026',
  p_ajustado_por := 'admin'
);

-- ============================================
-- 4. ELIMINAR PRECIOS CUSTOM
-- ============================================

-- Eliminar un precio custom específico (vuelve a usar fórmula automática)
SELECT eliminar_precio_custom(1, 2);

-- Eliminar múltiples precios custom
DO $$
BEGIN
  PERFORM eliminar_precio_custom(1, 2);
  PERFORM eliminar_precio_custom(3, 5);
  PERFORM eliminar_precio_custom(7, 9);
END $$;

-- ============================================
-- 5. MANTENIMIENTO
-- ============================================

-- Ver precios que no se han actualizado en 6 meses
SELECT 
  origen_nombre || ' → ' || destino_nombre as ruta,
  precio_custom,
  updated_at,
  notas
FROM precios_transfer_con_nombres
WHERE updated_at < NOW() - INTERVAL '6 months'
ORDER BY updated_at ASC;

-- Auditoría: Ver quién ha hecho más ajustes
SELECT 
  ajustado_por,
  COUNT(*) as cantidad_ajustes,
  ROUND(AVG(diferencia_precio), 2) as diferencia_promedio
FROM precios_transfer_con_nombres
WHERE ajustado_por IS NOT NULL
GROUP BY ajustado_por
ORDER BY cantidad_ajustes DESC;

-- ============================================
-- 6. COMPARACIONES ÚTILES
-- ============================================

-- Rutas donde el precio custom es más del 20% superior al automático
SELECT 
  origen_nombre || ' → ' || destino_nombre as ruta,
  precio_automatico,
  precio_custom,
  ROUND((diferencia_precio / precio_automatico * 100)::numeric, 1) as porcentaje_incremento,
  notas
FROM precios_transfer_con_nombres
WHERE diferencia_precio / precio_automatico > 0.20
ORDER BY porcentaje_incremento DESC;

-- Rutas con mayor diferencia absoluta
SELECT 
  origen_nombre || ' → ' || destino_nombre as ruta,
  precio_custom,
  precio_automatico,
  ABS(diferencia_precio) as diferencia_absoluta,
  notas
FROM precios_transfer_con_nombres
ORDER BY diferencia_absoluta DESC
LIMIT 10;

-- ============================================
-- 7. TESTING - Verificar que funciona
-- ============================================

-- Insertar precio de prueba
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 100.0,
  p_tiempo_min := 90.0,
  p_precio_base := 99.99,
  p_notas := 'PRUEBA - Eliminar después',
  p_ajustado_por := 'test'
);

-- Verificar que se retorna el precio custom
SELECT * FROM calculate_reservation_details_v2(1, 2);
-- Debe retornar precio = 99.99

-- Eliminar precio de prueba
SELECT eliminar_precio_custom(1, 2);

-- Verificar que ahora usa precio automático
SELECT * FROM calculate_reservation_details_v2(1, 2);
-- Debe retornar precio calculado por fórmula

-- ============================================
-- 8. IMPORTACIÓN MASIVA
-- ============================================

-- Si tienes múltiples precios para insertar de una vez
INSERT INTO precios_transfer_custom (
  id_origen, 
  id_destino, 
  distancia_km, 
  tiempo_min, 
  precio_base, 
  notas, 
  ajustado_por
) VALUES
  (1, 2, 150, 120, 130.00, 'Peaje adicional', 'admin'),
  (3, 5, 280, 240, 190.00, 'Ruta turística popular', 'admin'),
  (7, 9, 320, 270, 165.00, 'Condiciones especiales', 'admin'),
  (10, 12, 200, 150, 105.00, 'Promoción temporada baja', 'admin'),
  (15, 20, 400, 360, 200.00, 'Ruta larga con descuento', 'admin')
ON CONFLICT (id_origen, id_destino) 
DO UPDATE SET
  distancia_km = EXCLUDED.distancia_km,
  tiempo_min = EXCLUDED.tiempo_min,
  precio_base = EXCLUDED.precio_base,
  notas = EXCLUDED.notas,
  ajustado_por = EXCLUDED.ajustado_por,
  updated_at = NOW();

-- ============================================
-- 9. REPORTES
-- ============================================

-- Reporte mensual de precios custom
SELECT 
  DATE_TRUNC('month', updated_at) as mes,
  COUNT(*) as nuevos_precios_custom,
  ROUND(AVG(precio_custom), 2) as precio_promedio,
  ROUND(AVG(diferencia_precio), 2) as diferencia_promedio
FROM precios_transfer_con_nombres
GROUP BY mes
ORDER BY mes DESC;

-- Distribución por provincias
SELECT 
  origen_provincia,
  COUNT(*) as cantidad_rutas,
  ROUND(AVG(precio_custom), 2) as precio_promedio,
  ROUND(AVG(diferencia_precio), 2) as diferencia_promedio
FROM precios_transfer_con_nombres
GROUP BY origen_provincia
ORDER BY cantidad_rutas DESC;

-- ============================================
-- 10. BACKUP Y RESTORE
-- ============================================

-- Exportar todos los precios custom (para backup)
COPY (
  SELECT 
    id_origen,
    id_destino,
    distancia_km,
    tiempo_min,
    precio_base,
    notas,
    ajustado_por
  FROM precios_transfer_custom
) TO '/tmp/precios_custom_backup.csv' WITH CSV HEADER;

-- Importar desde backup (después de crear tabla)
-- COPY precios_transfer_custom (
--   id_origen,
--   id_destino,
--   distancia_km,
--   tiempo_min,
--   precio_base,
--   notas,
--   ajustado_por
-- ) FROM '/tmp/precios_custom_backup.csv' WITH CSV HEADER;

-- ============================================
-- NOTAS FINALES
-- ============================================

/*
- Todos estos ejemplos son prácticos y listos para usar
- Ajusta los IDs de origen/destino según tu base de datos
- Los precios son ejemplos, ajusta según tus necesidades
- Recuerda que los precios están cacheados 30 min en el frontend
- Usa las consultas de testing para verificar cambios
*/
