# 🔧 Troubleshooting - Sistema de Precios Personalizados

## ❌ Error: "Error al crear/actualizar precio custom"

### Síntomas
- Error en la consola del navegador al intentar guardar un precio custom
- Mensaje: "Error al crear/actualizar precio custom"
- El formulario no guarda el precio

### Causa Principal
La función `upsert_precio_custom` no existe en Supabase o no se ejecutó correctamente.

### ✅ Solución Paso a Paso

#### 1. Verificar que ejecutaste el SQL en Supabase

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Ejecuta este comando para verificar:

```sql
-- Verificar que la función existe
SELECT EXISTS (
  SELECT FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
  AND p.proname = 'upsert_precio_custom'
) as funcion_existe;
```

**Resultado esperado:** `funcion_existe: true`

**Si retorna `false`:**
- Ejecuta **TODO** el contenido de `database/precios_transfer_custom.sql`
- Verifica que no haya errores en la ejecución

#### 2. Probar la función manualmente

En Supabase SQL Editor, ejecuta:

```sql
-- Test básico
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 150.0,
  p_tiempo_min := 120.0,
  p_precio_base := 130.0,
  p_notas := 'TEST',
  p_ajustado_por := 'admin'
);
```

**Resultado esperado:**
```json
{
  "id_origen": 1,
  "id_destino": 2,
  "distancia_km": 150,
  "tiempo_min": 120,
  "precio_base": 130,
  "notas": "TEST",
  "ajustado_por": "admin",
  "success": true,
  ...
}
```

**Si obtienes un error:**
- Copia el mensaje de error
- Verifica que las ubicaciones con ID 1 y 2 existen: `SELECT * FROM ubicaciones_cuba WHERE id IN (1, 2);`
- Verifica que la tabla existe: `SELECT * FROM precios_transfer_custom LIMIT 1;`

#### 3. Verificar permisos

```sql
-- Verificar que la función tiene permisos
SELECT proname, proacl 
FROM pg_proc 
WHERE proname = 'upsert_precio_custom';

-- Si no tiene permisos, ejecuta:
GRANT EXECUTE ON FUNCTION upsert_precio_custom TO anon, authenticated;
```

#### 4. Limpiar y volver a instalar

Si nada funciona, ejecuta esto en Supabase SQL Editor:

```sql
-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS upsert_precio_custom CASCADE;

-- Volver a crear (copia todo el bloque desde precios_transfer_custom.sql)
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

-- Dar permisos
GRANT EXECUTE ON FUNCTION upsert_precio_custom TO anon, authenticated;
```

#### 5. Verificar desde el frontend

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Test de conexión
const { data, error } = await window.supabase.rpc('upsert_precio_custom', {
  p_id_origen: 1,
  p_id_destino: 2,
  p_distancia_km: 150.0,
  p_tiempo_min: 120.0,
  p_precio_base: 130.0,
  p_notas: 'TEST desde browser',
  p_ajustado_por: 'test'
});

console.log('Data:', data);
console.log('Error:', error);
```

---

## 🔍 Otros Problemas Comunes

### Error: "La vista precios_transfer_con_nombres no existe"

**Solución:**
```sql
-- Verificar
SELECT * FROM information_schema.views WHERE table_name = 'precios_transfer_con_nombres';

-- Si no existe, ejecuta todo el archivo precios_transfer_custom.sql
```

### Error: "calculate_reservation_details_v2 does not exist"

**Solución:**
```sql
-- Verificar
SELECT proname FROM pg_proc WHERE proname LIKE 'calculate_reservation_details%';

-- Debe mostrar ambas versiones: calculate_reservation_details y calculate_reservation_details_v2
-- Si no existe v2, ejecuta precios_transfer_custom.sql
```

### Los precios custom no se aplican

**Causa:** Cache del frontend (30 minutos)

**Solución:**
1. Abre DevTools (F12)
2. Application → Clear storage → Clear site data
3. O espera 30 minutos
4. O modifica `src/lib/cache.ts` para reducir el tiempo de cache

### Error: "No data returned"

**Causa:** La tabla `precios_transfer_custom` no existe

**Solución:**
```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS precios_transfer_custom (
  id_origen INTEGER NOT NULL REFERENCES ubicaciones_cuba(id) ON DELETE CASCADE,
  id_destino INTEGER NOT NULL REFERENCES ubicaciones_cuba(id) ON DELETE CASCADE,
  distancia_km FLOAT NOT NULL,
  tiempo_min FLOAT NOT NULL,
  precio_base FLOAT NOT NULL,
  notas TEXT,
  ajustado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id_origen, id_destino),
  CONSTRAINT check_origen_destino_diferentes CHECK (id_origen != id_destino),
  CONSTRAINT check_distancia_positiva CHECK (distancia_km > 0),
  CONSTRAINT check_tiempo_positivo CHECK (tiempo_min > 0),
  CONSTRAINT check_precio_positivo CHECK (precio_base > 0)
);
```

---

## 📝 Script Completo de Verificación

Usa el archivo `database/test_precios_custom.sql` para verificar todo el sistema:

```bash
# Ejecuta en Supabase SQL Editor
1. Abre database/test_precios_custom.sql
2. Ejecuta sección por sección
3. Verifica los resultados
```

---

## 🆘 Si Nada Funciona

1. **Elimina todo y vuelve a empezar:**

```sql
-- CUIDADO: Esto borrará todos los precios custom guardados
DROP TABLE IF EXISTS precios_transfer_custom CASCADE;
DROP FUNCTION IF EXISTS upsert_precio_custom CASCADE;
DROP FUNCTION IF EXISTS eliminar_precio_custom CASCADE;
DROP FUNCTION IF EXISTS calculate_reservation_details_v2 CASCADE;
DROP VIEW IF EXISTS precios_transfer_con_nombres CASCADE;
```

2. **Vuelve a ejecutar el archivo completo:**
   - Copia TODO el contenido de `database/precios_transfer_custom.sql`
   - Pégalo en Supabase SQL Editor
   - Ejecuta

3. **Verifica los logs de Supabase:**
   - Dashboard → Logs → Database
   - Busca errores en el momento que intentas guardar

4. **Contacta soporte:**
   - Provee los mensajes de error completos
   - Indica qué query estás ejecutando
   - Adjunta screenshots

---

## ✅ Checklist de Verificación

Usa este checklist para asegurarte que todo está correcto:

- [ ] Tabla `precios_transfer_custom` existe
- [ ] Función `upsert_precio_custom` existe y retorna JSONB
- [ ] Función `eliminar_precio_custom` existe
- [ ] Función `calculate_reservation_details_v2` existe
- [ ] Vista `precios_transfer_con_nombres` existe
- [ ] Permisos GRANT ejecutados correctamente
- [ ] Políticas RLS creadas
- [ ] Test manual en SQL funciona
- [ ] Frontend puede llamar a las funciones
- [ ] No hay errores en consola del navegador

---

## 📞 Ayuda Adicional

**Documentación:**
- `SISTEMA_PRECIOS_CUSTOM.md` - Documentación completa
- `QUICK_START_PRECIOS_CUSTOM.md` - Guía rápida
- `database/ejemplos_precios_custom.sql` - Ejemplos de uso

**Archivos de test:**
- `database/test_precios_custom.sql` - Scripts de verificación

**Logs útiles:**
- Supabase Dashboard → Logs → Database
- Supabase Dashboard → Logs → Edge Functions
- Consola del navegador (F12)
