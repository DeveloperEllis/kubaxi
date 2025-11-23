# Kubaxi - Tu Taxi en Cuba 🚕

Sitio web oficial de Kubaxi - Plataforma de reserva de taxis en Cuba.

## 🌟 Características

- **Hero Moderno**: Página de inicio atractiva con animaciones
- **Formulario de Reserva**: Sistema completo para solicitar viajes
- **Integración con Supabase**: Base de datos en tiempo real
- **Cálculo Automático**: Precio, distancia y tiempo estimado
- **Búsqueda Inteligente**: Autocompletado de ubicaciones
- **Responsive Design**: Funciona en móviles, tablets y desktop
- **SEO Optimizado**: Meta tags y estructura semántica

## 🛠️ Tecnologías

- **Next.js 15** - Framework de React con excelente SEO
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Framework CSS utility-first
- **Supabase** - Backend as a Service
- **React 18** - Biblioteca UI moderna

## 📦 Instalación

```bash
npm install
```

## 🔧 Configuración

1. Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
```

2. Asegúrate de tener las siguientes tablas en Supabase:
   - `ubicaciones_cuba` (id, nombre, codigo, region, tipo, provincia)
   - `trip_requests` (origen_id, destino_id, taxi_type, cantidad_personas, etc.)

## 🚀 Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del proyecto

```
eytaxi-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Layout principal con SEO
│   │   ├── page.tsx          # Página de inicio (Hero + Form)
│   │   └── globals.css       # Estilos globales
│   ├── components/
│   │   └── TripRequestForm.tsx  # Formulario de reserva
│   ├── lib/
│   │   ├── supabase.ts       # Cliente de Supabase
│   │   └── services.ts       # Servicios (ubicaciones, cálculo precio)
│   └── types/
│       └── index.ts          # Tipos TypeScript
├── .env.local                # Variables de entorno
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Funcionalidades Implementadas

### ✅ Hero Section
- Diseño atractivo con gradiente azul
- Animación del emoji de taxi
- Botón principal "Reservar Viaje"
- Cards de características (Rápido, Mejor Precio, Seguro)

### ✅ Formulario de Reserva
- **Selección de Ruta**: Autocompletado para origen y destino
- **Tipo de Taxi**: Colectivo o Privado
- **Cantidad de Personas**: Selector numérico
- **Fecha y Hora**: Date/time pickers
- **Información de Contacto**: Nombre, teléfono, dirección
- **Cálculo Automático**: Precio, distancia y tiempo estimado
- **Validación**: Campos requeridos y feedback visual

### ✅ Integración Supabase
- Búsqueda de ubicaciones en tiempo real
- Cálculo de precio basado en distancia y tipo de taxi
- Guardado de solicitudes en la base de datos

## 🔜 Próximas Características

- [ ] Sistema de autenticación para usuarios
- [ ] Panel de administración para gestionar solicitudes
- [ ] Notificaciones push
- [ ] Mapa interactivo con Google Maps
- [ ] Sistema de calificaciones
- [ ] Historial de viajes
- [ ] Pagos en línea

## 📝 Build para Producción

```bash
npm run build
npm start
```

## 🤝 Contribuir

Este es un proyecto privado. Contacta al equipo para más información.

## 📄 Licencia

© 2025 Kubaxi. Todos los derechos reservados.
