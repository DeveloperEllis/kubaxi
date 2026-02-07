# Sistema de Precios Personalizados para Transfers

## 📋 Descripción

Este sistema permite ajustar manualmente los precios de rutas específicas de transfer, reemplazando el cálculo automático por fórmula cuando sea necesario. Solo almacena las rutas con precios custom, manteniendo el cálculo automático para el resto.

## ✅ Ventajas del Sistema

- **Eficiente**: Solo almacena excepciones (rutas con precios ajustados)
- **Flexible**: Rutas normales siguen usando la fórmula automática
- **Auditable**: Campos `notas` y `ajustado_por` para documentar cambios
- **Transparente**: Vista que muestra diferencia entre precio custom y automático
- **Fácil de usar**: Funciones UPSERT y DELETE para gestionar precios
- **Compatible**: Totalmente integrado con el sistema existente

## 🏗️ Arquitectura

### Base de Datos (Supabase)

```
┌─────────────────────────────────────┐
│ precios_transfer_custom             │
├─────────────────────────────────────┤
│ id_origen (PK)                      │
│ id_destino (PK)                     │
│ distancia_km                        │
│ tiempo_min                          │
│ precio_base (precio personalizado) │
│ notas                               │
│ ajustado_por                        │
│ created_at                          │
│ updated_at                          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ calculate_reservation_details_v2    │
│ 1. Consulta precios_transfer_custom │
│ 2. Si existe → retorna precio custom│
│ 3. Si no → calcula con fórmula      │
└─────────────────────────────────────┘
```

### Frontend (Next.js + TypeScript)

```
src/
├── types/index.ts                    # Tipos TypeScript
│   ├── PrecioTransferCustom
│   ├── PrecioTransferConNombres
│   └── UpsertPrecioCustomParams
│
├── lib/
│   ├── services.ts                   # Actualizado para usar v2
│   └── preciosCustomService.ts       # Servicios para precios custom
│       ├── getPreciosCustom()
│       ├── upsertPrecioCustom()
│       ├── eliminarPrecioCustom()
│       ├── compararPrecios()
│       └── getEstadisticasPreciosCustom()
│
└── components/
    └── GestionPreciosCustom.tsx      # Componente de administración
```

## 🚀 Guía de Implementación

### Paso 1: Ejecutar el SQL en Supabase

1. Abre el **SQL Editor** en tu proyecto de Supabase
2. Ejecuta el archivo completo: `database/precios_transfer_custom.sql`
3. Verifica que se crearon:
   - Tabla `precios_transfer_custom`
   - Función `calculate_reservation_details_v2`
   - Vista `precios_transfer_con_nombres`
   - Funciones `upsert_precio_custom` y `eliminar_precio_custom`

### Paso 2: Verificar la Integración

El frontend ya está configurado para usar `calculate_reservation_details_v2`. Los cambios incluyen:

- ✅ `src/lib/services.ts` → Actualizado para usar la función v2
- ✅ `src/types/index.ts` → Tipos agregados
- ✅ `src/lib/preciosCustomService.ts` → Servicios creados
- ✅ `src/components/GestionPreciosCustom.tsx` → Componente creado

### Paso 3: Crear Página de Administración

Crea una página para gestionar precios (ejemplo: página de admin):

```typescript
// src/app/[locale]/admin/precios/page.tsx
import GestionPreciosCustom from '@/components/GestionPreciosCustom';

export default function PreciosPage() {
  return <GestionPreciosCustom />;
}
```

O simplemente usa el componente donde necesites:

```typescript
import GestionPreciosCustom from '@/components/GestionPreciosCustom';

// En tu componente
<GestionPreciosCustom />
```

### Paso 4: Probar el Sistema

#### A) Agregar un precio personalizado:

```sql
SELECT upsert_precio_custom(
  p_id_origen := 1,
  p_id_destino := 2,
  p_distancia_km := 150.0,
  p_tiempo_min := 120.0,
  p_precio_base := 130.0,
  p_notas := 'Ruta con peaje adicional',
  p_ajustado_por := 'admin'
);
```

#### B) Verificar que funciona:

```sql
-- Debería retornar el precio custom (130.0)
SELECT * FROM calculate_reservation_details_v2(1, 2);
```

#### C) Consultar todos los precios custom:

```sql
SELECT * FROM precios_transfer_con_nombres;
```

#### D) Eliminar precio custom (volver a automático):

```sql
SELECT eliminar_precio_custom(1, 2);
```

## 📊 Uso desde el Frontend

### Consultar precios personalizados:

```typescript
import { getPreciosCustom } from '@/lib/preciosCustomService';

const precios = await getPreciosCustom();
console.log(precios);
```

### Agregar/Actualizar precio custom:

```typescript
import { upsertPrecioCustom } from '@/lib/preciosCustomService';

await upsertPrecioCustom({
  p_id_origen: 1,
  p_id_destino: 2,
  p_distancia_km: 150.0,
  p_tiempo_min: 120.0,
  p_precio_base: 130.0,
  p_notas: 'Precio ajustado por condiciones especiales',
  p_ajustado_por: 'admin',
});
```

### Eliminar precio custom:

```typescript
import { eliminarPrecioCustom } from '@/lib/preciosCustomService';

await eliminarPrecioCustom(1, 2);
```

### Comparar precio custom vs automático:

```typescript
import { compararPrecios } from '@/lib/preciosCustomService';

const comparacion = await compararPrecios(1, 2);
console.log('Precio custom:', comparacion.custom?.precio_base);
console.log('Precio automático:', comparacion.automatico?.precio);
console.log('Diferencia:', comparacion.diferencia);
```

## 🎯 Flujo de Trabajo

### Para Ajustar un Precio:

1. **Accede al panel de administración** con el componente `GestionPreciosCustom`
2. **Haz clic en "+ Nuevo Precio"**
3. **Selecciona origen y destino**
4. **Haz clic en "Calcular"** para ver el precio automático actual
5. **Ingresa el precio personalizado** que deseas
6. **Añade notas** explicando por qué se ajusta (opcional)
7. **Guarda** → El precio custom se aplicará inmediatamente

### Para Volver al Precio Automático:

1. **Encuentra la ruta** en la tabla
2. **Haz clic en "Eliminar"**
3. **Confirma** → La ruta volverá a usar el cálculo automático

## 📈 Estadísticas Disponibles

El sistema proporciona estadísticas útiles:

```typescript
import { getEstadisticasPreciosCustom } from '@/lib/preciosCustomService';

const stats = await getEstadisticasPreciosCustom();
// {
//   total: 10,
//   conAjustePositivo: 6,
//   conAjusteNegativo: 4,
//   diferenciaPromedio: 5.25
// }
```

## 🔍 Vista Enriquecida `precios_transfer_con_nombres`

Esta vista muestra:

- Nombres de ubicaciones (origen y destino)
- Provincias
- Precio custom vs precio automático
- **Diferencia** entre ambos precios
- Notas y quién ajustó el precio
- Fechas de creación y actualización

```sql
SELECT * FROM precios_transfer_con_nombres
ORDER BY diferencia_precio DESC;
```

## 🛡️ Seguridad (RLS)

Las políticas de Row Level Security están configuradas:

- ✅ **Lectura pública**: Cualquiera puede ver los precios custom (necesario para calcular en la app)
- ✅ **Modificación autenticada**: Solo usuarios autenticados pueden crear/editar/eliminar precios

```sql
-- Lectura para todos
CREATE POLICY "Permitir lectura pública de precios custom"
  ON precios_transfer_custom
  FOR SELECT
  USING (true);

-- Inserción solo para autenticados
CREATE POLICY "Permitir inserción a usuarios autenticados"
  ON precios_transfer_custom
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Actualización solo para autenticados
CREATE POLICY "Permitir actualización a usuarios autenticados"
  ON precios_transfer_custom
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Eliminación solo para autenticados
CREATE POLICY "Permitir eliminación a usuarios autenticados"
  ON precios_transfer_custom
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
```

### 🔐 Autenticación del Panel de Admin

El panel de administración está protegido con autenticación:

1. **Crear usuarios**: Supabase Dashboard → Authentication → Users
2. **Login requerido**: Pantalla de login antes de acceder al panel
3. **Sesión persistente**: No necesitas login cada vez
4. **Cerrar sesión**: Botón disponible en el panel

**Ver guía completa**: [AUTENTICACION_ADMIN.md](AUTENTICACION_ADMIN.md)

## 🔄 Migración de Datos

Si tienes rutas que ya sabes que necesitan precios custom, puedes insertarlas en lote:

```sql
INSERT INTO precios_transfer_custom (
  id_origen, id_destino, distancia_km, tiempo_min, precio_base, notas, ajustado_por
) VALUES
  (1, 2, 150, 120, 130.00, 'Peaje adicional', 'admin'),
  (3, 5, 280, 240, 180.00, 'Condiciones especiales', 'admin'),
  (7, 9, 320, 270, 160.00, 'Ruta más corta disponible', 'admin')
ON CONFLICT (id_origen, id_destino) DO NOTHING;
```

## 🐛 Troubleshooting

### La función v2 no existe

Asegúrate de haber ejecutado todo el archivo SQL `precios_transfer_custom.sql`

### Los precios custom no se aplican

1. Verifica que la ruta existe en `precios_transfer_custom`:
   ```sql
   SELECT * FROM precios_transfer_custom WHERE id_origen = 1 AND id_destino = 2;
   ```

2. Verifica que `services.ts` esté usando `calculate_reservation_details_v2`

3. Limpia el cache del navegador (los precios están cacheados por 30 minutos)

### Error de permisos

Verifica que las políticas RLS estén creadas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'precios_transfer_custom';
```

## 📝 Notas Importantes

- Los precios se cachean por **30 minutos** en el frontend
- La comparación con precio automático se hace en **tiempo real**
- Los precios custom son **bidireccionales** (funcionan en ambas direcciones)
- Al eliminar un precio custom, **se pierde permanentemente** (vuelve al cálculo automático)

## 🎨 Mejoras Futuras

- [ ] Panel de aprobación de precios custom
- [ ] Historial de cambios de precios
- [ ] Importación masiva desde CSV
- [ ] Notificaciones cuando un precio custom difiere mucho del automático
- [ ] Sistema de roles (ver quién puede modificar precios)

## 📞 Soporte

Si encuentras problemas o necesitas ayuda:
1. Revisa los logs de la consola del navegador
2. Verifica los logs de Supabase Edge Functions
3. Consulta esta documentación

---

**✅ Sistema implementado y listo para usar**
