# 🚀 Guía Rápida de Implementación

## ⚡ Pasos para Activar el Sistema

### 1️⃣ Ejecutar SQL en Supabase (5 minutos)

1. Abre **Supabase Dashboard** → SQL Editor
2. Copia y pega el contenido de: `database/precios_transfer_custom.sql`
3. Ejecuta todo el script
4. Verifica que se crearon las tablas y funciones correctamente

### 2️⃣ Crear Usuario Administrador en Supabase

Para poder acceder al panel de administración necesitas crear un usuario:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Clic en **"Add user"** → **"Create new user"**
3. Ingresa:
   - Email: `admin@eytaxi.com`
   - Password: Tu contraseña segura
   - ✅ Marca **"Auto Confirm User"**
4. Clic en **"Create user"**

### 3️⃣ El código ya está listo ✅

Los siguientes archivos ya fueron creados/actualizados:

- ✅ `src/types/index.ts` - Tipos agregados
- ✅ `src/lib/services.ts` - Actualizado para usar v2
- ✅ `src/lib/preciosCustomService.ts` - Servicios creados
- ✅ `src/hooks/useAuth.ts` - Hook de autenticación
- ✅ `src/components/AdminLogin.tsx` - Pantalla de login
- ✅ `src/components/GestionPreciosCustom.tsx` - Componente listo
- ✅ `src/app/[locale]/admin/precios-custom/page.tsx` - Página protegida con auth

### 4️⃣ Acceder al Panel de Admin

**Primero debes iniciar sesión:**

```
1. Visita: http://tu-dominio.com/admin/precios-custom
2. Ingresa tu correo y contraseña
3. Inicia sesión
4. ¡Accede al panel de administración!
```

**🔐 Importante**: Solo usuarios autenticados en Supabase pueden acceder y modificar precios.

#### Desde SQL (Supabase SQL Editor):

```sql
-- Agregar un precio custom de prueba
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 150.0,
  p_tiempo_min := 120.0,
  p_precio_base := 130.0,
  p_notas := 'Precio de prueba',
  p_ajustado_por := 'admin'
);

-- Verificar que funciona
SELECT * FROM calculate_reservation_details_v2(1, 2);
-- Debe retornar precio = 130.0

-- Ver todos los precios custom
SELECT * FROM precios_transfer_con_nombres;
```

#### Desde la aplicación web:

1.  5️⃣ Probar el Sistema

#### Desde la aplicación web (Con autenticación):

1. Ve a `/admin/precios-custom`
2. **Inicia sesión** con tu usuario
3. Haz clic en "+ Nuevo Precio"
4. Selecciona origen y destino
5. Ingresa el precio personalizado
6. Guarda
7. ¡Listo! El precio se aplicará inmediatamente

## 🔐 Sistema de Autenticación

### Acceder al Panel:
- ✅ **Login requerido**: Correo y contraseña
- ✅ **Validación**: Contra `auth.users` de Supabase
- ✅ **Sesión persistente**: No necesitas login cada vez
- ✅ **Cerrar sesión**: Botón disponible en el panel

### Seguridad RLS:
- ✅ **Lectura pública**: Cualquiera puede consultar precios (para calcular en la app)
- ✅ **Escritura protegida**: Solo usuarios autenticados pueden modificar

**Documentación completa**: Ver [AUTENTICACION_ADMIN.md](AUTENTICACION_ADMIN.md)

### Panel Web (GestionPreciosCustom)

- ✅ Ver todos los precios personalizados
- ✅ Buscar por ubicación o provincia
- ✅ Crear nuevo precio custom
- ✅ Editar precio existente
- ✅ Eliminar precio (vuelve a automático)
- ✅ Comparar precio custom vs automático
- ✅ Ver estadísticas generales
- ✅ Documentar cambios con notas

### Desde SQL

- ✅ Consultas avanzadas
- ✅ Reportes y estadísticas
- ✅ Importación masiva
- ✅ Backup/restore

Ver: `database/ejemplos_precios_custom.sql`

## 🎯 Casos de Uso Comunes

### Ajustar precio de una ruta específica:

**Por qué:** Ruta con peaje no contemplado en fórmula

**Cómo:**
1. Panel web → "+ Nuevo Precio"
2. Selecciona origen/destino
3. Clic "Calcular" para ver precio automático
4. Ingresa nuevo precio
5. Notas: "Incluye peaje de $10"
6. Guardar

### Volver al precio automático:

**Por qué:** Ya no necesitas precio custom

**Cómo:**
1. Panel web → Encuentra la ruta
2. Clic "Eliminar"
3. Confirmar
4. ¡Listo! Vuelve a usar fórmula automática

### Actualizar precio existente:

**Por qué:** El precio custom debe cambiar

**Cómo:**
1. Panel web → Clic "Editar" en la ruta
2. Modifica el precio
3. Actualiza notas si es necesario
4. Guardar

## 🔍 Verificar que Todo Funciona

### Test 1: Precio Custom se Aplica

```sql
-- Agregar precio custom
SELECT upsert_precio_custom(1, 2, 150.0, 120.0, 99.99, 'TEST', 'admin');

-- Consultar - debe retornar 99.99
SELECT * FROM calculate_reservation_details_v2(1, 2);
```

### Test 2: Eliminar Precio Custom

```sql
-- Eliminar
SELECT eliminar_precio_custom(1, 2);

-- Consultar - debe retornar precio calculado por fórmula
SELECT * FROM calculate_reservation_details_v2(1, 2);
```

### Test 3: Desde el Frontend

```typescript
// En la consola del navegador:
import { calculatePrice } from '@/lib/services';

// Si agregaste precio custom para ruta 1→2 de $99.99:
const result = await calculatePrice(1, 2, 'privado', 4);
console.log(result.price); // Debe usar el precio custom ($99.99 * 4)
```
 / RLS
**Solución:** 
1. Asegúrate de estar **autenticado** (iniciar sesión)
2. Verifica políticas RLS en Supabase
3. Verifica que ejecutaste el SQL completo

### No puedo acceder al panel
**Solución:**
1. Crea un usuario en Supabase Dashboard → Authentication → Users
2. IniCrear usuario administrador en Supabase → Authentication → Users
- [ ] Verificar que tabla `precios_transfer_custom` existe
- [ ] Verificar que función `calculate_reservation_details_v2` existe
- [ ] Verificar que políticas RLS están activas
- [ ] Acceder a `/admin/precios-custom` e iniciar sesión
- [ ] Agregar un precio custom de prueba
- [ ] Verificar que el precio se aplica en la aplicación
- [ ] Probar cerrar sesión y volver a entrar

### "Function calculate_reservation_details_v2 does not exist"
**Solución:** Ejecuta el archivo `database/precios_transfer_custom.sql` completo

### Los precios custom no se aplican
**Solución:** 
1. Verifica que la ruta existe: `SELECT * FROM precios_transfer_custom;`
2. Limpia cache del navegador (precios se cachean 30 min)

### Error de permisos
**Solución:** Verifica políticas RLS en Supabase

### No veo el panel de admin
**Solución:** Visita `/admin/precios-custom` o integra el componente manualmente

## ✅ Checklist de Implementación

- [ ] Ejecutar `database/precios_transfer_custom.sql` en Supabase
- [ ] Verificar que tabla `precios_transfer_custom` existe
- [ ] Verificar que función `calculate_reservation_details_v2` existe
- [ ] Acceder a `/admin/precios-custom` y ver el panel
- [ ] Agregar un precio custom de prueba
- [ ] Verificar que el precio se aplica en la aplicación
- [ ] Eliminar el precio de prueba
- [ ] ✨ ¡Listo para producción!

## 💡 Siguiente Paso

**Accede al panel de administración y prueba agregar tu primer precio personalizado:**

```
/admin/precios-custom
```

---

**¿Necesitas ayuda?** Consulta la documentación completa en `SISTEMA_PRECIOS_CUSTOM.md`
