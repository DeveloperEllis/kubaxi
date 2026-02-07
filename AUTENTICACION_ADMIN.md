# 🔐 Sistema de Autenticación - Panel de Administración

## 📋 Descripción

El panel de administración de precios personalizados ahora está protegido con autenticación. Solo los usuarios registrados en Supabase pueden acceder y modificar los precios.

## ✅ Características Implementadas

### 1. **Autenticación Requerida**
- ✅ Login con correo y contraseña
- ✅ Validación contra `auth.users` de Supabase
- ✅ Sesión persistente
- ✅ Botón de cerrar sesión

### 2. **Seguridad RLS (Row Level Security)**
- ✅ Lectura pública de precios (para calcular en la app)
- ✅ Solo usuarios autenticados pueden INSERT/UPDATE/DELETE
- ✅ Políticas separadas por operación

### 3. **Protección de Rutas**
- ✅ Página protegida con autenticación client-side
- ✅ Redirección automática a login si no autenticado
- ✅ Loading state mientras verifica sesión

## 🚀 Cómo Crear Usuarios Administradores

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. **Abre tu proyecto en Supabase**
2. Ve a **Authentication** → **Users**
3. Haz clic en **"Add user"** → **"Create new user"**
4. Ingresa:
   - Email: `admin@eytaxi.com` (o el que prefieras)
   - Password: Una contraseña segura
   - Auto Confirm User: **✅ Marcado** (para que no requiera confirmación por email)
5. Clic en **"Create user"**
6. ¡Listo! El usuario puede iniciar sesión

### Opción 2: Desde SQL (Para crear múltiples usuarios)

```sql
-- Crear usuario admin directamente
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@eytaxi.com',
  crypt('tu_contraseña_segura', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

### Opción 3: Usando la API de Supabase

```javascript
// Desde un script de Node.js o navegador (requiere service_role key)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-service-role-key' // ⚠️ CUIDADO: Solo usar en backend
);

const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@eytaxi.com',
  password: 'contraseña_segura',
  email_confirm: true
});
```

## 🔑 Iniciar Sesión

1. Ve a: `https://tu-dominio.com/admin/precios-custom`
2. Ingresa tu correo y contraseña
3. Haz clic en **"Iniciar Sesión"**
4. Si las credenciales son correctas, accederás al panel

## 🛡️ Seguridad Implementada

### Base de Datos (RLS Policies)

```sql
-- Lectura pública (para que la app calcule precios)
CREATE POLICY "Permitir lectura pública de precios custom"
  ON precios_transfer_custom
  FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden insertar
CREATE POLICY "Permitir inserción a usuarios autenticados"
  ON precios_transfer_custom
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Permitir actualización a usuarios autenticados"
  ON precios_transfer_custom
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "Permitir eliminación a usuarios autenticados"
  ON precios_transfer_custom
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
```

### Frontend (React)

- **Hook `useAuth`**: Maneja el estado de autenticación
- **Componente `AdminLogin`**: Pantalla de login protegida
- **Página protegida**: Verifica autenticación antes de mostrar contenido
- **Cerrar sesión**: Botón para salir de forma segura

## 📝 Flujo de Autenticación

```
Usuario intenta acceder a /admin/precios-custom
         ↓
¿Está autenticado?
         ↓
    NO → Muestra AdminLogin
         ↓
    Ingresa credenciales
         ↓
    Supabase valida contra auth.users
         ↓
    ✅ Correcto → Crea sesión
         ↓
    Muestra GestionPreciosCustom
         ↓
    Usuario puede modificar precios
         ↓
    RLS valida que auth.uid() IS NOT NULL
         ↓
    ✅ Permitido → Guarda cambios
```

## 🔄 Actualizar el Script SQL

Ejecuta el archivo actualizado en Supabase:

```bash
# Archivo: database/precios_transfer_custom.sql
# Ejecuta TODO el contenido en Supabase SQL Editor
```

Las nuevas políticas RLS requerirán autenticación para modificar datos.

## 🧪 Probar el Sistema

### 1. Sin autenticación:
```bash
# Intenta acceder a /admin/precios-custom
# Resultado: Muestra pantalla de login ✅
```

### 2. Con credenciales incorrectas:
```bash
# Intenta login con email/password inválidos
# Resultado: Error "Invalid login credentials" ❌
```

### 3. Con credenciales correctas:
```bash
# Login con usuario de auth.users
# Resultado: Acceso al panel completo ✅
```

### 4. Intentar modificar sin autenticación (desde API):
```javascript
// Sin token de autenticación
const { error } = await supabase.from('precios_transfer_custom').insert({...});
// Resultado: Error RLS - new row violates row-level security policy ❌
```

### 5. Modificar con autenticación:
```javascript
// Con usuario autenticado
const { data, error } = await supabase.from('precios_transfer_custom').insert({...});
// Resultado: Inserción exitosa ✅
```

## 📧 Gestión de Usuarios

### Ver usuarios existentes:

```sql
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

### Eliminar un usuario:

```sql
-- Desde Supabase Dashboard:
-- Authentication → Users → Select user → Delete

-- O desde SQL (con service_role):
DELETE FROM auth.users WHERE email = 'usuario@ejemplo.com';
```

### Cambiar contraseña:

```sql
-- Desde Supabase Dashboard:
-- Authentication → Users → Select user → Reset Password

-- El usuario recibirá un email para cambiar su contraseña
```

## ⚠️ Notas Importantes

1. **Service Role Key**: Nunca expongas tu `service_role` key en el frontend
2. **Confirmación de Email**: Usa `Auto Confirm User` para desarrollo
3. **HTTPS**: En producción, asegúrate de usar HTTPS
4. **Passwords**: Usa contraseñas seguras para administradores
5. **Backup**: Mantén un backup de los usuarios administradores

## 🚨 Solución de Problemas

### Error: "Row violates row-level security policy"

**Causa**: Intentas modificar sin estar autenticado

**Solución**:
1. Verifica que estás logueado en `/admin/precios-custom`
2. Revisa que las políticas RLS estén actualizadas (ejecuta el SQL)
3. Verifica en DevTools que `auth.uid()` retorna un valor

### Error: "Invalid login credentials"

**Causa**: Email o contraseña incorrectos

**Solución**:
1. Verifica el usuario en Supabase Dashboard → Authentication
2. Confirma que el email está correcto
3. Si olvidaste la contraseña, usa "Reset Password"

### No se muestra la pantalla de login

**Causa**: Problema con el hook `useAuth`

**Solución**:
1. Verifica que `src/hooks/useAuth.ts` existe
2. Revisa la consola del navegador por errores
3. Verifica que `@supabase/supabase-js` está instalado

## 📚 Archivos Relacionados

- `database/precios_transfer_custom.sql` - Políticas RLS actualizadas
- `src/hooks/useAuth.ts` - Hook de autenticación
- `src/components/AdminLogin.tsx` - Componente de login
- `src/app/[locale]/admin/precios-custom/page.tsx` - Página protegida

## ✅ Checklist de Implementación

- [ ] Ejecutar SQL actualizado con políticas RLS
- [ ] Crear al menos un usuario administrador en Supabase
- [ ] Probar login en `/admin/precios-custom`
- [ ] Verificar que sin login no se puede modificar
- [ ] Confirmar que con login funciona correctamente
- [ ] Probar cerrar sesión
- [ ] ✨ ¡Sistema de autenticación funcionando!

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) y los logs de Supabase para más detalles.
