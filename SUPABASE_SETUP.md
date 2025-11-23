# Configuración de Supabase para Kubaxi

## 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y la clave anon/public

## 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-key-aqui
```

## 3. Crear Tablas Necesarias

### Tabla: ubicaciones_cuba

```sql
CREATE TABLE ubicaciones_cuba (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  region VARCHAR(100),
  tipo VARCHAR(50),
  provincia VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida
CREATE INDEX idx_ubicaciones_nombre ON ubicaciones_cuba(nombre);
CREATE INDEX idx_ubicaciones_provincia ON ubicaciones_cuba(provincia);
```

### Tabla: trip_requests

```sql
CREATE TABLE trip_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255),
  origen_id BIGINT REFERENCES ubicaciones_cuba(id),
  destino_id BIGINT REFERENCES ubicaciones_cuba(id),
  taxi_type VARCHAR(20) CHECK (taxi_type IN ('colectivo', 'privado')),
  cantidad_personas INTEGER NOT NULL CHECK (cantidad_personas > 0),
  trip_date TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_address TEXT NOT NULL,
  extra_info TEXT,
  price NUMERIC(10, 2),
  distance_km NUMERIC(10, 2),
  estimated_time_minutes INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas frecuentes
CREATE INDEX idx_trip_requests_status ON trip_requests(status);
CREATE INDEX idx_trip_requests_trip_date ON trip_requests(trip_date);
CREATE INDEX idx_trip_requests_user_id ON trip_requests(user_id);
```

## 4. Poblar Datos de Ubicaciones

### Ejemplo de INSERT para ubicaciones_cuba:

```sql
INSERT INTO ubicaciones_cuba (nombre, codigo, region, tipo, provincia) VALUES
  ('La Habana', 'HAV', 'Occidente', 'Capital', 'La Habana'),
  ('Santiago de Cuba', 'SCU', 'Oriente', 'Ciudad', 'Santiago de Cuba'),
  ('Varadero', 'VAR', 'Occidente', 'Ciudad', 'Matanzas'),
  ('Viñales', 'VIN', 'Occidente', 'Pueblo', 'Pinar del Río'),
  ('Trinidad', 'TRI', 'Centro', 'Ciudad', 'Sancti Spíritus'),
  ('Santa Clara', 'SCL', 'Centro', 'Ciudad', 'Villa Clara'),
  ('Camagüey', 'CMW', 'Centro', 'Ciudad', 'Camagüey'),
  ('Holguín', 'HOG', 'Oriente', 'Ciudad', 'Holguín'),
  ('Cienfuegos', 'CFG', 'Centro', 'Ciudad', 'Cienfuegos'),
  ('Pinar del Río', 'PR', 'Occidente', 'Ciudad', 'Pinar del Río');
```

## 5. Configurar Políticas de Seguridad (RLS)

### Para ubicaciones_cuba (solo lectura pública):

```sql
ALTER TABLE ubicaciones_cuba ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON ubicaciones_cuba FOR SELECT 
TO public 
USING (true);
```

### Para trip_requests (lectura/escritura controlada):

```sql
ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquiera cree una solicitud
CREATE POLICY "Allow public insert" 
ON trip_requests FOR INSERT 
TO public 
WITH CHECK (true);

-- Solo el usuario puede ver sus propias solicitudes (o admin)
CREATE POLICY "Allow user read own requests" 
ON trip_requests FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id OR user_id = 'guest');
```

## 6. Verificar Conexión

Ejecuta este código en tu consola del navegador después de iniciar el proyecto:

```javascript
// En la consola del navegador
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

## 7. Probar la Integración

1. Inicia el servidor: `npm run dev`
2. Ve a http://localhost:3000
3. Haz clic en "Reservar Viaje"
4. Intenta buscar una ubicación
5. Si aparecen sugerencias, ¡la integración funciona! ✅

## Notas Importantes

- **No compartas tus claves**: Nunca subas el archivo `.env.local` a Git
- **Usa la clave anon**: Es segura para el frontend con RLS configurado
- **Backups regulares**: Configura backups automáticos en Supabase
- **Monitoreo**: Revisa el dashboard de Supabase para ver las consultas

## Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: "CORS policy"
Verifica que la URL en `.env.local` sea correcta y no tenga espacios.

### Error: "Failed to fetch"
Revisa tu conexión a internet y que Supabase esté accesible.
