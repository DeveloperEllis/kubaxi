-- Script para agregar soporte multiidioma a las tablas existentes
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar columnas multiidioma a la tabla excursiones
ALTER TABLE excursiones 
ADD COLUMN IF NOT EXISTS nombre_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS nombre_fr VARCHAR(255),
ADD COLUMN IF NOT EXISTS descripcion_en TEXT,
ADD COLUMN IF NOT EXISTS descripcion_fr TEXT;

-- 2. Agregar columnas multiidioma a la tabla paquetes_viaje
ALTER TABLE paquetes_viaje
ADD COLUMN IF NOT EXISTS nombre_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS nombre_fr VARCHAR(255),
ADD COLUMN IF NOT EXISTS descripcion_en TEXT,
ADD COLUMN IF NOT EXISTS descripcion_fr TEXT;

-- 3. Opcional: Si tienes una tabla de "incluye" para paquetes, también necesitas traducirla
-- Puedes crear una tabla separada para las traducciones de los items incluidos

CREATE TABLE IF NOT EXISTS traducciones_items (
  id BIGSERIAL PRIMARY KEY,
  item_es TEXT NOT NULL,
  item_en TEXT NOT NULL,
  item_fr TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'paquete', 'excursion', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comentarios sobre el esquema
COMMENT ON COLUMN excursiones.nombre_en IS 'Nombre de la excursión en inglés';
COMMENT ON COLUMN excursiones.nombre_fr IS 'Nombre de la excursión en francés';
COMMENT ON COLUMN excursiones.descripcion_en IS 'Descripción de la excursión en inglés';
COMMENT ON COLUMN excursiones.descripcion_fr IS 'Descripción de la excursión en francés';

COMMENT ON COLUMN paquetes_viaje.nombre_en IS 'Nombre del paquete en inglés';
COMMENT ON COLUMN paquetes_viaje.nombre_fr IS 'Nombre del paquete en francés';
COMMENT ON COLUMN paquetes_viaje.descripcion_en IS 'Descripción del paquete en inglés';
COMMENT ON COLUMN paquetes_viaje.descripcion_fr IS 'Descripción del paquete en francés';

-- Ejemplo de datos de prueba con traducciones
-- UPDATE excursiones 
-- SET nombre_en = 'Havana City Tour',
--     nombre_fr = 'Visite de La Havane',
--     descripcion_en = 'Discover the beauty of Old Havana...',
--     descripcion_fr = 'Découvrez la beauté de la vieille Havane...'
-- WHERE id = 1;
