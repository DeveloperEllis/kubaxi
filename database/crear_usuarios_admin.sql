-- ============================================
-- CREAR USUARIOS ADMINISTRADORES
-- Sistema de Autenticación Supabase
-- ============================================

-- ============================================
-- OPCIÓN 1: CREAR USUARIO MANUALMENTE (RECOMENDADO)
-- ============================================
/*
La forma más fácil es desde Supabase Dashboard:

1. Abre Supabase Dashboard
2. Ve a Authentication → Users
3. Click "Add user" → "Create new user"
4. Ingresa:
   - Email: admin@eytaxi.com
   - Password: Tu contraseña segura
   - ✅ Auto Confirm User (marcado)
5. Click "Create user"

¡Listo! El usuario puede iniciar sesión inmediatamente.
*/

-- ============================================
-- OPCIÓN 2: CREAR USUARIO DESDE SQL (AVANZADO)
-- ============================================
-- ⚠️ NOTA: Requiere privilegios de superusuario
-- Solo funciona si ejecutas desde Supabase SQL Editor

-- Ejemplo: Crear usuario admin
-- IMPORTANTE: Cambia el email y la contraseña

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generar un UUID para el usuario
  new_user_id := gen_random_uuid();
  
  -- Insertar en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id
    new_user_id,                             -- id (UUID generado)
    'authenticated',                         -- aud
    'authenticated',                         -- role
    'admin@eytaxi.com',                     -- 🔧 CAMBIA ESTE EMAIL
    crypt('tu_contraseña_segura_aqui', gen_salt('bf')), -- 🔧 CAMBIA ESTA CONTRASEÑA
    NOW(),                                   -- email_confirmed_at (auto-confirmado)
    NOW(),                                   -- recovery_sent_at
    NOW(),                                   -- last_sign_in_at
    '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
    '{"role":"admin"}',                      -- raw_user_meta_data (opcional)
    NOW(),                                   -- created_at
    NOW(),                                   -- updated_at
    '',                                      -- confirmation_token
    '',                                      -- email_change
    '',                                      -- email_change_token_new
    ''                                       -- recovery_token
  );
  
  -- Insertar en auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@eytaxi.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Usuario creado exitosamente: admin@eytaxi.com';
END $$;

-- ============================================
-- CREAR MÚLTIPLES USUARIOS
-- ============================================
-- Ejecuta este bloque para crear varios admins a la vez

DO $$
DECLARE
  usuarios TEXT[][] := ARRAY[
    ARRAY['admin@eytaxi.com', 'password123'],      -- 🔧 Usuario 1
    ARRAY['manager@eytaxi.com', 'password456'],    -- 🔧 Usuario 2
    ARRAY['support@eytaxi.com', 'password789']     -- 🔧 Usuario 3
  ];
  usuario TEXT[];
  new_user_id uuid;
BEGIN
  FOREACH usuario SLICE 1 IN ARRAY usuarios
  LOOP
    new_user_id := gen_random_uuid();
    
    -- Insertar usuario
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
      new_user_id,
      'authenticated',
      'authenticated',
      usuario[1],                                          -- Email
      crypt(usuario[2], gen_salt('bf')),                  -- Password
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Insertar identity
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, usuario[1])::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Usuario creado: %', usuario[1];
  END LOOP;
END $$;

-- ============================================
-- VERIFICAR USUARIOS CREADOS
-- ============================================

-- Ver todos los usuarios
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC;

-- Ver usuarios creados hoy
SELECT 
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- Contar usuarios
SELECT COUNT(*) as total_usuarios FROM auth.users;

-- ============================================
-- GESTIÓN DE USUARIOS
-- ============================================

-- Cambiar contraseña de un usuario
UPDATE auth.users
SET 
  encrypted_password = crypt('nueva_contraseña_segura', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@eytaxi.com';

-- Confirmar email de un usuario (si no está auto-confirmado)
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@eytaxi.com' AND email_confirmed_at IS NULL;

-- Desactivar un usuario (marcar como eliminado)
-- ⚠️ CUIDADO: Esto no elimina el usuario, solo lo desactiva
UPDATE auth.users
SET 
  deleted_at = NOW(),
  updated_at = NOW()
WHERE email = 'usuario-a-desactivar@eytaxi.com';

-- Reactivar un usuario desactivado
UPDATE auth.users
SET 
  deleted_at = NULL,
  updated_at = NOW()
WHERE email = 'usuario-a-reactivar@eytaxi.com';

-- Eliminar usuario completamente
-- ⚠️ CUIDADO: Esta acción es PERMANENTE
DELETE FROM auth.users WHERE email = 'usuario-a-eliminar@eytaxi.com';

-- ============================================
-- AGREGAR METADATA A USUARIOS
-- ============================================

-- Agregar rol de admin en metadata
UPDATE auth.users
SET 
  raw_user_meta_data = raw_user_meta_data || '{"role":"admin","permissions":["manage_prices"]}'::jsonb,
  updated_at = NOW()
WHERE email = 'admin@eytaxi.com';

-- Agregar información adicional
UPDATE auth.users
SET 
  raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
      'full_name', 'Administrator',
      'department', 'IT',
      'created_by', 'system'
    ),
  updated_at = NOW()
WHERE email = 'admin@eytaxi.com';

-- Ver metadata de usuarios
SELECT 
  email,
  raw_user_meta_data
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL;

-- ============================================
-- AUDITORÍA DE USUARIOS
-- ============================================

-- Usuarios que nunca han iniciado sesión
SELECT 
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE last_sign_in_at IS NULL
ORDER BY created_at DESC;

-- Usuarios activos (iniciaron sesión en los últimos 30 días)
SELECT 
  email,
  last_sign_in_at,
  AGE(NOW(), last_sign_in_at) as tiempo_desde_ultimo_login
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
ORDER BY last_sign_in_at DESC;

-- Usuarios inactivos (no han iniciado sesión en 90 días)
SELECT 
  email,
  last_sign_in_at,
  AGE(NOW(), last_sign_in_at) as tiempo_inactivo
FROM auth.users
WHERE last_sign_in_at < NOW() - INTERVAL '90 days'
  OR last_sign_in_at IS NULL
ORDER BY last_sign_in_at ASC NULLS FIRST;

-- ============================================
-- BACKUP DE USUARIOS
-- ============================================

-- Exportar lista de usuarios (solo emails)
COPY (
  SELECT 
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
  FROM auth.users
  ORDER BY created_at
) TO '/tmp/usuarios_backup.csv' WITH CSV HEADER;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
/*

1. SEGURIDAD:
   - Usa contraseñas fuertes (mínimo 8 caracteres, mayúsculas, números, símbolos)
   - No compartas las contraseñas por medios inseguros
   - Cambia las contraseñas periódicamente

2. AUTO-CONFIRMACIÓN:
   - email_confirmed_at = NOW() → Usuario auto-confirmado
   - No necesita verificar email para iniciar sesión

3. METADATA:
   - raw_user_meta_data: Datos personalizados del usuario
   - Útil para roles, permisos, información adicional

4. ELIMINACIÓN:
   - deleted_at: Soft delete (se puede reactivar)
   - DELETE: Hard delete (permanente)

5. IDENTITIES:
   - auth.identities: Necesario para autenticación
   - Debe existir un registro por cada usuario

6. TESTING:
   - Prueba siempre después de crear usuarios
   - Verifica que pueden iniciar sesión
   - Revisa que tienen los permisos correctos

7. PRODUCCIÓN:
   - Usa Supabase Dashboard para crear usuarios (más seguro)
   - Documenta qué usuarios tienen acceso
   - Mantén backup de credenciales en lugar seguro

*/
