# 🚀 Checklist de Producción - EyTaxi Web

## ✅ Archivos y Configuración

### 1. Variables de Entorno
- [ ] Crear `.env.local` en el servidor con valores de producción
- [ ] Verificar `NEXT_PUBLIC_SUPABASE_URL` apunta a proyecto correcto
- [ ] Verificar `NEXT_PUBLIC_SUPABASE_ANON_KEY` es correcta
- [ ] Configurar `NODE_ENV=production`
- [ ] **NO** incluir `.env.local` en Git (ya está en .gitignore)

### 2. Base de Datos Supabase
- [ ] Ejecutar script de vistas estándar: `database/materialized_views.sql`
- [ ] Verificar que las vistas fueron creadas:
  ```sql
  SELECT * FROM ubicaciones_optimizadas LIMIT 1;
  SELECT * FROM excursiones_populares LIMIT 1;
  SELECT * FROM paquetes_activos LIMIT 1;
  SELECT * FROM distancias_frecuentes LIMIT 1;
  ```
- [ ] Configurar políticas RLS (Row Level Security) si es necesario
- [ ] Verificar que las tablas tienen datos

### 3. Archivos a Excluir de Git
Los siguientes archivos están en `.gitignore` y NO se subirán:
- ✅ `.env.local` (credenciales sensibles)
- ✅ `node_modules/` (dependencias)
- ✅ `.next/` (build temporal)
- ✅ `coverage/` (reportes de tests)
- ✅ `*.log` (logs de desarrollo)
- ✅ `git_commit.bat` (script local)
- ✅ `.DS_Store`, `Thumbs.db` (archivos del SO)

### 4. Archivos de Documentación (Opcional)
Estos archivos son útiles para el equipo pero opcionales en producción:
- `PROGRESS.md` - Progreso del desarrollo
- `FASE_3_COMPLETADA.md` - Documentación de optimizaciones
- `CACHE_DEV_TOOLS.md` - Guía de herramientas de desarrollo
- `MEJORAS_RECOMENDADAS.md` - Mejoras futuras

**Recomendación:** Mantener `README.md` y `SUPABASE_SETUP.md` para documentación del proyecto.

### 5. Next.js y Build
- [ ] Ejecutar `npm run build` localmente para verificar que compila sin errores
- [ ] Verificar que no hay errores de TypeScript
- [ ] Optimizar imágenes en `/public` y `/assets`
- [ ] Revisar que todas las rutas funcionan

### 6. Seguridad
- [ ] Revisar que no hay API keys hardcodeadas en el código
- [ ] Verificar que las políticas RLS están activas en Supabase
- [ ] Configurar CORS si es necesario
- [ ] Habilitar HTTPS en producción

## 📦 Despliegue

### Opción 1: Vercel (Recomendado)
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variables de entorno en Vercel Dashboard
# Settings > Environment Variables
```

### Opción 2: Netlify
```bash
# 1. Instalar Netlify CLI
npm i -g netlify-cli

# 2. Deploy
netlify deploy --prod

# 3. Configurar variables de entorno en Netlify Dashboard
```

### Opción 3: Servidor Propio (VPS)
```bash
# 1. Build
npm run build

# 2. Start con PM2
pm2 start npm --name "eytaxi-web" -- start

# 3. Configurar Nginx como reverse proxy
```

## 🔍 Verificación Post-Deploy

- [ ] La página principal carga correctamente
- [ ] Las imágenes .webp se visualizan
- [ ] El formulario de solicitud funciona
- [ ] Las excursiones se cargan desde Supabase
- [ ] Los paquetes se muestran correctamente
- [ ] El cambio de idioma funciona (ES/EN/FR)
- [ ] WhatsApp redirect funciona
- [ ] No hay errores en la consola del navegador
- [ ] El sitio es responsive (móvil, tablet, desktop)

## 🎯 Configuración de Dominio

- [ ] Configurar DNS apuntando a Vercel/Netlify
- [ ] Configurar SSL/HTTPS
- [ ] Actualizar `NEXT_PUBLIC_SITE_URL` si es necesario
- [ ] Configurar redirects (www → no-www o viceversa)

## 📊 Monitoreo (Opcional)

- [ ] Configurar Google Analytics
- [ ] Configurar Sentry para error tracking
- [ ] Configurar Vercel Analytics
- [ ] Monitorear métricas de Supabase

## ⚡ Performance

- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1

## 🛠️ Comandos Útiles

```bash
# Build local
npm run build

# Preview del build
npm start

# Verificar errores de TypeScript
npx tsc --noEmit

# Ejecutar tests
npm test

# Limpiar caché
rm -rf .next node_modules package-lock.json
npm install
```

## 📝 Notas Importantes

1. **DevTools Component:** El componente `DevTools.tsx` solo se muestra en desarrollo (`NODE_ENV=development`), no afectará producción.

2. **Caché:** En producción, los tiempos de caché son más largos (10-30 min) para mejor rendimiento.

3. **Vistas de Base de Datos:** Las vistas estándar se actualizan automáticamente, no requieren refresh manual.

4. **Imágenes:** Asegúrate que las URLs de imágenes en Supabase Storage sean públicas.

5. **WhatsApp:** Verifica que el número de WhatsApp esté configurado correctamente en las variables de entorno.
