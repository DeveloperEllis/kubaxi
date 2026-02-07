-- ============================================
-- SCRIPT DE VERIFICACIÓN Y TROUBLESHOOTING
-- Sistema de Precios Personalizados
-- ============================================

-- ============================================
-- 1. VERIFICAR QUE LAS TABLAS EXISTEN
-- ============================================

-- Verificar tabla precios_transfer_custom
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'precios_transfer_custom'
) as tabla_existe;

-- Ver estructura de la tabla (columnas, tipos, constraints)
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'precios_transfer_custom'
ORDER BY ordinal_position;

-- Ver constraints de la tabla
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'precios_transfer_custom'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ============================================
-- 2. VERIFICAR QUE LAS FUNCIONES EXISTEN
-- ============================================

-- Listar funciones relacionadas con precios custom
SELECT 
  p.proname as nombre_funcion,
  pg_get_function_arguments(p.oid) as argumentos,
  pg_get_function_result(p.oid) as tipo_retorno
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%precio%custom%'
OR p.proname LIKE 'calculate_reservation_details%';

-- ============================================
-- 3. VERIFICAR POLÍTICAS RLS
-- ============================================

-- Ver políticas de la tabla
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'precios_transfer_custom';

-- ============================================
-- 4. TEST BÁSICO DE FUNCIONALIDAD
-- ============================================

-- Test 1: Insertar un precio de prueba
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 100.0,
  p_tiempo_min := 90.0,
  p_precio_base := 99.99,
  p_notas := 'TEST - Verificación de funcionamiento',
  p_ajustado_por := 'test_admin'
);

-- Resultado esperado: JSON con success: true

-- Test 2: Verificar que se insertó
SELECT * FROM precios_transfer_custom 
WHERE id_origen = 1 AND id_destino = 2;

-- Test 3: Verificar que la función v2 usa el precio custom
SELECT * FROM calculate_reservation_details_v2(1, 2);
-- Debe retornar precio = 99.99

-- Test 4: Actualizar el precio
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 100.0,
  p_tiempo_min := 90.0,
  p_precio_base := 110.00,
  p_notas := 'TEST - Precio actualizado',
  p_ajustado_por := 'test_admin'
);

-- Verificar que se actualizó
SELECT * FROM precios_transfer_custom 
WHERE id_origen = 1 AND id_destino = 2;
-- precio_base debe ser 110.00 ahora

-- Test 5: Eliminar el precio
SELECT eliminar_precio_custom(1, 2);
-- Debe retornar true

-- Verificar que se eliminó
SELECT * FROM precios_transfer_custom 
WHERE id_origen = 1 AND id_destino = 2;
-- No debe retornar nada

-- Test 6: Verificar que ahora usa precio automático
SELECT * FROM calculate_reservation_details_v2(1, 2);
-- Debe retornar precio calculado por fórmula

-- ============================================
-- 5. TEST DE ERRORES COMUNES
-- ============================================

-- Error: Origen y destino iguales (debe fallar)
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 1,
  p_distancia_km := 100.0,
  p_tiempo_min := 90.0,
  p_precio_base := 99.99,
  p_notas := 'TEST - Debe fallar',
  p_ajustado_por := 'test'
);
-- Debe dar error por constraint check_origen_destino_diferentes

-- Error: Distancia negativa (debe fallar)
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := -100.0,
  p_tiempo_min := 90.0,
  p_precio_base := 99.99,
  p_notas := 'TEST - Debe fallar',
  p_ajustado_por := 'test'
);
-- Debe dar error por constraint check_distancia_positiva

-- ============================================
-- 6. TEST DE VISTA precios_transfer_con_nombres
-- ============================================

-- Insertar algunos precios de prueba
INSERT INTO precios_transfer_custom (
  id_origen, id_destino, distancia_km, tiempo_min, precio_base, notas, ajustado_por
) VALUES
  (1, 2, 150, 120, 130.00, 'TEST 1', 'admin'),
  (3, 5, 280, 240, 180.00, 'TEST 2', 'admin')
ON CONFLICT (id_origen, id_destino) DO UPDATE SET
  distancia_km = EXCLUDED.distancia_km,
  precio_base = EXCLUDED.precio_base,
  notas = EXCLUDED.notas,
  updated_at = NOW();

-- Ver la vista enriquecida
SELECT * FROM precios_transfer_con_nombres;

-- Limpiar datos de prueba
DELETE FROM precios_transfer_custom WHERE notas LIKE 'TEST%';

-- ============================================
-- 7. VERIFICAR PERMISOS
-- ============================================

-- Ver permisos en la tabla
SELECT 
  grantee, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'precios_transfer_custom';

-- Ver permisos en las funciones
SELECT 
  p.proname,
  array_agg(a.rolname) as puede_ejecutar
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_proc_acl a ON p.oid = a.objoid
WHERE n.nspname = 'public'
AND p.proname IN ('upsert_precio_custom', 'eliminar_precio_custom', 'calculate_reservation_details_v2')
GROUP BY p.proname;

-- ============================================
-- 8. DIAGNÓSTICO DE PROBLEMAS
-- ============================================

-- Si hay problemas, verifica:

-- A) ¿Existen ubicaciones con esos IDs?
SELECT id, nombre FROM ubicaciones_cuba WHERE id IN (1, 2);

-- B) ¿Existen distancias entre esas ubicaciones?
SELECT * FROM distancias_carretera WHERE id_origen = 1 AND id_destino = 2;

-- C) ¿La función redondeo_personalizado existe?
SELECT EXISTS (
  SELECT FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
  AND p.proname = 'redondeo_personalizado'
) as funcion_existe;

-- D) ¿Hay errores en los logs?
-- (Esto se debe verificar en el Dashboard de Supabase -> Logs)

-- ============================================
-- 9. LIMPIEZA COMPLETA (USAR CON CUIDADO)
-- ============================================

-- Si necesitas empezar de cero:
-- DROP TABLE IF EXISTS precios_transfer_custom CASCADE;
-- DROP FUNCTION IF EXISTS upsert_precio_custom CASCADE;
-- DROP FUNCTION IF EXISTS eliminar_precio_custom CASCADE;
-- DROP FUNCTION IF EXISTS calculate_reservation_details_v2 CASCADE;
-- DROP VIEW IF EXISTS precios_transfer_con_nombres CASCADE;

-- Luego vuelve a ejecutar precios_transfer_custom.sql

-- ============================================
-- 10. ESTADÍSTICAS DE USO
-- ============================================

-- Contar cuántos precios custom hay
SELECT COUNT(*) as total_precios_custom FROM precios_transfer_custom;

-- Ver últimas modificaciones
SELECT 
  origen_nombre || ' → ' || destino_nombre as ruta,
  precio_custom,
  ajustado_por,
  updated_at
FROM precios_transfer_con_nombres
ORDER BY updated_at DESC
LIMIT 10;

-- Ver precios custom por usuario que los creó
SELECT 
  ajustado_por,
  COUNT(*) as cantidad,
  ROUND(AVG(precio_custom), 2) as precio_promedio
FROM precios_transfer_con_nombres
WHERE ajustado_por IS NOT NULL
GROUP BY ajustado_por
ORDER BY cantidad DESC;

-- ============================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- ============================================

/*
NOTAS:
- Ejecuta cada sección por separado
- Verifica los resultados después de cada test
- Si algo falla, revisa los mensajes de error
- Consulta la documentación en SISTEMA_PRECIOS_CUSTOM.md
*/
