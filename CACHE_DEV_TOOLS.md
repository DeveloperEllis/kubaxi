# 🛠️ Herramientas de Desarrollo - Caché

## Problema Resuelto

Cuando haces cambios en la base de datos de Supabase, los datos no se actualizan inmediatamente en la página debido al **sistema de caché** implementado en la Fase 2.

## ✅ Soluciones Implementadas

### 1. **Tiempos de Caché Adaptativos**

- **Desarrollo**: 1 minuto (actualización rápida)
- **Producción**: 10-30 minutos (mejor rendimiento)

El sistema detecta automáticamente si estás en desarrollo y reduce los tiempos de caché.

### 2. **Panel de DevTools (Recomendado)**

Un botón flotante en la esquina inferior derecha te permite:

- ✅ Ver estadísticas del caché en tiempo real
- ✅ Limpiar todo el caché con un clic
- ✅ Limpiar caché específico (ubicaciones, precios)
- ✅ Actualizar estadísticas

**Cómo usar:**
1. Haz tus cambios en Supabase
2. Haz clic en el botón 🛠️ en la esquina inferior derecha
3. Presiona "🗑️ Limpiar Todo el Caché"
4. Actualiza la página (F5)

### 3. **Desde la Consola del Navegador**

Abre las DevTools de Chrome/Firefox (F12) y ejecuta:

```javascript
// Limpiar todo el caché
window.clearCache()

// Limpiar solo ubicaciones
window.clearUbicacionesCache()

// Limpiar solo precios
window.clearPreciosCache()

// Ver estadísticas
window.getCacheStats()
```

### 4. **Recarga Forzada del Navegador**

En Chrome/Edge:
- **Ctrl + F5** (Windows)
- **Cmd + Shift + R** (Mac)

Esto borra el caché del navegador además del caché de la app.

## 📋 Flujo Recomendado para Desarrollo

1. **Haces cambio en Supabase** (agregar excursión, modificar ubicación, etc.)
2. **Abres el panel DevTools** (botón 🛠️)
3. **Clic en "Limpiar Todo el Caché"**
4. **F5 para recargar** la página
5. ✅ **Datos actualizados**

## ⏱️ Tiempos de Caché Actuales

| Tipo de Dato | Desarrollo | Producción |
|--------------|------------|------------|
| Ubicaciones  | 1 minuto   | 10 minutos |
| Precios      | 1 minuto   | 30 minutos |
| Excursiones  | Sin caché* | Sin caché* |
| Paquetes     | Sin caché* | Sin caché* |

*Actualmente estas consultas no usan caché, se obtienen directamente de las vistas materializadas.

## 🎯 Archivos Modificados

- `src/lib/services.ts` - Funciones de limpieza de caché y tiempos adaptativos
- `src/components/DevTools.tsx` - Panel de herramientas de desarrollo (NUEVO)
- `src/app/[locale]/layout.tsx` - DevTools agregado al layout

## 💡 Notas

- El panel DevTools **solo aparece en modo desarrollo**
- En producción, el caché mantiene tiempos más largos para mejor rendimiento
- El caché se almacena en memoria (se limpia al recargar la app)
- Las vistas materializadas deben refrescarse manualmente en Supabase

## 🔄 Refresh de Vistas Materializadas

Si modificas muchos datos, también debes refrescar las vistas materializadas en Supabase:

```sql
-- Ejecutar en el SQL Editor de Supabase
SELECT refresh_all_materialized_views();
```

O individual:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY ubicaciones_optimizadas;
REFRESH MATERIALIZED VIEW CONCURRENTLY excursiones_populares;
REFRESH MATERIALIZED VIEW CONCURRENTLY paquetes_activos;
REFRESH MATERIALIZED VIEW CONCURRENTLY distancias_frecuentes;
```
