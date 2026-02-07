-- ============================================
-- SISTEMA DE PRECIOS PERSONALIZADOS PARA TRANSFERS
-- EyTaxi Web - Supabase Database
-- ============================================
-- Propósito: Permitir ajustes manuales de precios para rutas específicas
--           sin afectar el cálculo automático de otras rutas

-- ============================================
-- 1. TABLA: precios_transfer_custom
-- ============================================
-- Almacena precios personalizados/ajustados para rutas específicas
-- Solo contiene rutas con precios modificados manualmente

-- Eliminar tabla si existe (para re-instalación limpia)
DROP TABLE IF EXISTS precios_transfer_custom CASCADE;

CREATE TABLE precios_transfer_custom (
  -- IDs de origen y destino (clave primaria compuesta)
  id_origen INTEGER NOT NULL REFERENCES ubicaciones_cuba(id) ON DELETE CASCADE,
  id_destino INTEGER NOT NULL REFERENCES ubicaciones_cuba(id) ON DELETE CASCADE,
  
  -- Datos de la ruta
  distancia_km FLOAT NOT NULL,
  tiempo_min FLOAT NOT NULL,
  
  -- Precio personalizado (este reemplaza el calculado)
  precio_base FLOAT NOT NULL,
  
  -- Metadatos
  notas TEXT, -- Razón del ajuste manual
  ajustado_por TEXT, -- Usuario/admin que hizo el ajuste
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (id_origen, id_destino),
  
  -- Restricciones
  CONSTRAINT check_origen_destino_diferentes CHECK (id_origen != id_destino),
  CONSTRAINT check_distancia_positiva CHECK (distancia_km > 0),
  CONSTRAINT check_tiempo_positivo CHECK (tiempo_min > 0),
  CONSTRAINT check_precio_positivo CHECK (precio_base > 0)
);

-- Índices para búsquedas rápidas
-- Eliminar índices si existen
DROP INDEX IF EXISTS idx_precios_custom_origen;
DROP INDEX IF EXISTS idx_precios_custom_destino;

CREATE INDEX idx_precios_custom_origen ON precios_transfer_custom(id_origen);
CREATE INDEX idx_precios_custom_destino ON precios_transfer_custom(id_destino);

-- Comentarios
COMMENT ON TABLE precios_transfer_custom IS 
'Almacena precios personalizados para rutas específicas que requieren ajuste manual';

COMMENT ON COLUMN precios_transfer_custom.precio_base IS 
'Precio base personalizado que reemplaza el cálculo automático';

COMMENT ON COLUMN precios_transfer_custom.notas IS 
'Documentación de por qué se ajustó este precio manualmente';

-- ============================================
-- 2. FUNCIÓN: calculate_reservation_details_v2
-- ============================================
-- Versión mejorada que consulta primero precios personalizados
-- Si no existe precio custom, usa la fórmula automática

-- Eliminar función si existe
DROP FUNCTION IF EXISTS calculate_reservation_details_v2(INTEGER, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION calculate_reservation_details_v2(
  p_id_origen INTEGER,
  p_id_destino INTEGER
)
RETURNS TABLE(distancia_km FLOAT, tiempo_min FLOAT, precio FLOAT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_distancia_km FLOAT;
  v_tiempo_min FLOAT;
  v_precio_base FLOAT;
  v_costo_por_km FLOAT;
  v_precio_custom FLOAT;
BEGIN
  -- ============================================
  -- PASO 1: Buscar precio personalizado
  -- ============================================
  SELECT 
    pc.distancia_km,
    pc.tiempo_min,
    pc.precio_base
  INTO v_distancia_km, v_tiempo_min, v_precio_custom
  FROM precios_transfer_custom pc
  WHERE 
    (pc.id_origen = p_id_origen AND pc.id_destino = p_id_destino)
    OR (pc.id_origen = p_id_destino AND pc.id_destino = p_id_origen)
  LIMIT 1;
  
  -- Si encontramos precio personalizado, lo retornamos
  IF v_precio_custom IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      ROUND(v_distancia_km::NUMERIC, 2)::FLOAT,
      ROUND(v_tiempo_min::NUMERIC, 2)::FLOAT,
      v_precio_custom::FLOAT;
    RETURN;
  END IF;
  
  -- ============================================
  -- PASO 2: Buscar distancia en tabla estándar
  -- ============================================
  SELECT
    d.distancia_km,
    d.tiempo_min
  INTO v_distancia_km, v_tiempo_min
  FROM distancias_carretera d
  WHERE
    (d.id_origen = p_id_origen AND d.id_destino = p_id_destino)
    OR (d.id_origen = p_id_destino AND d.id_destino = p_id_origen)
  LIMIT 1;

  -- Verificar si se encontró la distancia
  IF v_distancia_km IS NULL OR v_tiempo_min IS NULL THEN
    -- Retornar valores nulos si no se encuentra la ruta
    RETURN QUERY
    SELECT NULL::FLOAT, NULL::FLOAT, NULL::FLOAT;
    RETURN;
  END IF;

  -- ============================================
  -- PASO 3: Calcular precio con fórmula automática
  -- ============================================
  -- Aplicar reglas de precios por rangos de distancia
  IF v_distancia_km < 155 THEN
    v_costo_por_km := 0.81;
  ELSIF v_distancia_km >= 155 AND v_distancia_km <= 300 THEN
    v_costo_por_km := 0.59;
  ELSE
    v_costo_por_km := 0.48;
  END IF;

  -- Calcular precio total con redondeo personalizado
  RETURN QUERY
  SELECT
    ROUND(v_distancia_km::NUMERIC, 2)::FLOAT,
    ROUND(v_tiempo_min::NUMERIC, 2)::FLOAT,
    redondeo_personalizado(v_costo_por_km * v_distancia_km)::FLOAT AS precio;
END;
$$;

-- Comentario
COMMENT ON FUNCTION calculate_reservation_details_v2 IS 
'Calcula detalles de reserva consultando primero precios personalizados, luego fórmula automática';

-- ============================================
-- 3. VISTA: precios_transfer_con_nombres
-- ============================================
-- Vista enriquecida para facilitar gestión de precios custom

-- Eliminar vista si existe
DROP VIEW IF EXISTS precios_transfer_con_nombres CASCADE;

CREATE OR REPLACE VIEW precios_transfer_con_nombres AS
SELECT 
  pc.id_origen,
  pc.id_destino,
  pc.distancia_km,
  pc.tiempo_min,
  pc.precio_base as precio_custom,
  pc.notas,
  pc.ajustado_por,
  pc.created_at,
  pc.updated_at,
  -- Información de origen
  o.nombre as origen_nombre,
  o.provincia as origen_provincia,
  -- Información de destino
  d.nombre as destino_nombre,
  d.provincia as destino_provincia,
  -- Calcular qué precio tendría con fórmula automática
  CASE 
    WHEN pc.distancia_km < 155 THEN ROUND((0.81 * pc.distancia_km)::NUMERIC, 2)
    WHEN pc.distancia_km >= 155 AND pc.distancia_km <= 300 THEN ROUND((0.59 * pc.distancia_km)::NUMERIC, 2)
    ELSE ROUND((0.48 * pc.distancia_km)::NUMERIC, 2)
  END as precio_automatico,
  -- Diferencia entre precio custom y automático
  ROUND(
    (pc.precio_base - 
      CASE 
        WHEN pc.distancia_km < 155 THEN (0.81 * pc.distancia_km)
        WHEN pc.distancia_km >= 155 AND pc.distancia_km <= 300 THEN (0.59 * pc.distancia_km)
        ELSE (0.48 * pc.distancia_km)
      END
    )::NUMERIC, 
    2
  ) as diferencia_precio
FROM precios_transfer_custom pc
INNER JOIN ubicaciones_cuba o ON pc.id_origen = o.id
INNER JOIN ubicaciones_cuba d ON pc.id_destino = d.id
ORDER BY pc.updated_at DESC;

-- Comentario
COMMENT ON VIEW precios_transfer_con_nombres IS 
'Vista enriquecida de precios personalizados con nombres de ubicaciones y comparación con precio automático';

-- ============================================
-- 4. FUNCIÓN: Insertar/Actualizar precio custom
-- ============================================
-- Eliminar función anterior si existe (necesario para cambiar tipo de retorno)
DROP FUNCTION IF EXISTS upsert_precio_custom(INTEGER, INTEGER, FLOAT, FLOAT, FLOAT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION upsert_precio_custom(
  p_id_origen INTEGER,
  p_id_destino INTEGER,
  p_distancia_km FLOAT,
  p_tiempo_min FLOAT,
  p_precio_base FLOAT,
  p_notas TEXT DEFAULT NULL,
  p_ajustado_por TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result RECORD;
BEGIN
  INSERT INTO precios_transfer_custom (
    id_origen,
    id_destino,
    distancia_km,
    tiempo_min,
    precio_base,
    notas,
    ajustado_por
  )
  VALUES (
    p_id_origen,
    p_id_destino,
    p_distancia_km,
    p_tiempo_min,
    p_precio_base,
    p_notas,
    p_ajustado_por
  )
  ON CONFLICT (id_origen, id_destino)
  DO UPDATE SET
    distancia_km = EXCLUDED.distancia_km,
    tiempo_min = EXCLUDED.tiempo_min,
    precio_base = EXCLUDED.precio_base,
    notas = EXCLUDED.notas,
    ajustado_por = EXCLUDED.ajustado_por,
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN jsonb_build_object(
    'id_origen', v_result.id_origen,
    'id_destino', v_result.id_destino,
    'distancia_km', v_result.distancia_km,
    'tiempo_min', v_result.tiempo_min,
    'precio_base', v_result.precio_base,
    'notas', v_result.notas,
    'ajustado_por', v_result.ajustado_por,
    'created_at', v_result.created_at,
    'updated_at', v_result.updated_at,
    'success', true
  );
END;
$$;

-- Comentario
COMMENT ON FUNCTION upsert_precio_custom IS 
'Inserta o actualiza un precio personalizado para una ruta específica';

-- ============================================
-- 5. FUNCIÓN: Eliminar precio custom (volver a automático)
-- ============================================
-- Eliminar función si existe
DROP FUNCTION IF EXISTS eliminar_precio_custom(INTEGER, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION eliminar_precio_custom(
  p_id_origen INTEGER,
  p_id_destino INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  DELETE FROM precios_transfer_custom
  WHERE 
    (id_origen = p_id_origen AND id_destino = p_id_destino)
    OR (id_origen = p_id_destino AND id_destino = p_id_origen);
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$;

-- Comentario
COMMENT ON FUNCTION eliminar_precio_custom IS 
'Elimina un precio personalizado, volviendo al cálculo automático';

-- ============================================
-- 6. POLÍTICAS RLS
-- ============================================
-- Eliminar políticas si existen
DROP POLICY IF EXISTS "Permitir lectura pública de precios custom" ON precios_transfer_custom;
DROP POLICY IF EXISTS "Permitir modificación a usuarios autenticados" ON precios_transfer_custom;

-- Habilitar RLS
ALTER TABLE precios_transfer_custom ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (para calcular precios en la app)
CREATE POLICY "Permitir lectura pública de precios custom"
  ON precios_transfer_custom
  FOR SELECT
  USING (true);

-- Permitir modificación SOLO a usuarios autenticados
CREATE POLICY "Permitir modificación a usuarios autenticados"
  ON precios_transfer_custom
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir actualización a usuarios autenticados"
  ON precios_transfer_custom
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir eliminación a usuarios autenticados"
  ON precios_transfer_custom
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. TRIGGER: Actualizar updated_at automáticamente
-- ============================================
-- Eliminar trigger y función si existen
DROP TRIGGER IF EXISTS trigger_actualizar_updated_at ON precios_transfer_custom;
DROP FUNCTION IF EXISTS actualizar_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at
  BEFORE UPDATE ON precios_transfer_custom
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- 8. MIGRACIÓN: Actualizar función existente
-- ============================================
-- Opción 1: Reemplazar calculate_reservation_details con la nueva versión
-- (descomentar si quieres que la app use automáticamente los precios custom)

-- DROP FUNCTION IF EXISTS calculate_reservation_details(INTEGER, INTEGER);
-- CREATE OR REPLACE FUNCTION calculate_reservation_details(
--   p_id_origen INTEGER,
--   p_id_destino INTEGER
-- )
-- RETURNS TABLE(distancia_km FLOAT, tiempo_min FLOAT, precio FLOAT)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN QUERY SELECT * FROM calculate_reservation_details_v2(p_id_origen, p_id_destino);
-- END;
-- $$;

-- ============================================
-- 9. PERMISOS
-- ============================================
-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION calculate_reservation_details_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_precio_custom TO authenticated;
GRANT EXECUTE ON FUNCTION eliminar_precio_custom TO authenticated;

-- Permisos sobre la vista
GRANT SELECT ON precios_transfer_con_nombres TO anon, authenticated;

-- Permisos sobre la tabla (lectura para todos, escritura solo autenticados)
GRANT SELECT ON precios_transfer_custom TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON precios_transfer_custom TO authenticated;

-- ============================================
-- 10. DATOS DE EJEMPLO (OPCIONAL)
-- ============================================
-- Descomentar para insertar datos de prueba

-- INSERT INTO precios_transfer_custom (
--   id_origen, id_destino, distancia_km, tiempo_min, precio_base, notas, ajustado_por
-- ) VALUES
--   (1, 2, 150, 120, 130.00, 'Precio ajustado por condiciones especiales de la ruta', 'admin'),
--   (3, 5, 280, 240, 180.00, 'Ruta con peaje adicional no considerado en fórmula', 'admin')
-- ON CONFLICT (id_origen, id_destino) DO NOTHING;

-- ============================================
-- ⚠️ NOTA DE SEGURIDAD IMPORTANTE
-- ============================================
/*
CONFIGURACIÓN ACTUAL: Las políticas RLS permiten acceso público (anon) para desarrollo.

PARA PRODUCCIÓN, recomendamos:
1. Crear una función service_role o usar autenticación
2. Modificar las políticas para requerir autenticación:

   -- Política más segura para producción:
   CREATE POLICY "Permitir modificación solo a admins"
     ON precios_transfer_custom
     FOR ALL
     USING (
       EXISTS (
         SELECT 1 FROM auth.users 
         WHERE auth.uid() = id 
         AND raw_user_meta_data->>'role' = 'admin'
       )
     );

3. O desactivar RLS y gestionar permisos a nivel de aplicación
*/

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
/*

## PARA ACTIVAR EL SISTEMA DE PRECIOS PERSONALIZADOS:

### 1. Ejecutar este archivo SQL completo en Supabase SQL Editor

### 2. Actualizar la función en tu frontend (services.ts) para usar la nueva versión:
   - Cambiar el RPC call de 'calculate_reservation_details' a 'calculate_reservation_details_v2'
   - O descomentar la sección de migración arriba para reemplazar la función original

### 3. Gestionar precios personalizados:

   A) Consultar precios custom existentes:
   ```sql
   SELECT * FROM precios_transfer_con_nombres;
   ```

   B) Agregar/actualizar un precio custom:
   ```sql
   SELECT upsert_precio_custom(
     p_id_origen := 1,
     p_id_destino := 2,
     p_distancia_km := 150.0,
     p_tiempo_min := 120.0,
     p_precio_base := 130.0,
     p_notas := 'Ruta con condiciones especiales',
     p_ajustado_por := 'admin'
   );
   ```

   C) Eliminar precio custom (volver a automático):
   ```sql
   SELECT eliminar_precio_custom(1, 2);
   ```

### 4. Verificar comportamiento:
   ```sql
   -- Consultar con precio custom (si existe)
   SELECT * FROM calculate_reservation_details_v2(1, 2);
   
   -- Consultar con precio automático
   SELECT * FROM calculate_reservation_details_v2(3, 4);
   ```

## VENTAJAS DE ESTE SISTEMA:

✅ Solo almacena excepciones (rutas con precios ajustados)
✅ Rutas normales siguen usando la fórmula automática
✅ Fácil de auditar (con campos notas y ajustado_por)
✅ La vista precios_transfer_con_nombres muestra la diferencia entre precio custom y automático
✅ Función upsert permite agregar/actualizar fácilmente
✅ Función eliminar permite volver al precio automático
✅ Totalmente compatible con el sistema existente

*/
