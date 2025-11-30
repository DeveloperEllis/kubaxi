import { APP_NAME } from './constants';

// Configuración para envío de WhatsApp
const WHATSAPP_NUMBER = '5352375007'; // Sin el signo +

interface WhatsAppMessage {
  tipo: string;
  datos: any;
}

export function abrirWhatsApp(mensaje: WhatsAppMessage) {
  // Formatear el mensaje según el tipo
  let textoMensaje = '';
  
  switch (mensaje.tipo) {
    case 'reserva_taxi':
      textoMensaje = formatearReservaTaxi(mensaje.datos);
      break;
    case 'excursion':
      textoMensaje = formatearExcursion(mensaje.datos);
      break;
    case 'paquete':
      textoMensaje = formatearPaquete(mensaje.datos);
      break;
    case 'personalizado':
      textoMensaje = formatearPersonalizado(mensaje.datos);
      break;
    case 'circuito_personalizado':
      textoMensaje = formatearCircuitoPersonalizado(mensaje.datos);
      break;
    default:
      textoMensaje = JSON.stringify(mensaje.datos, null, 2);
  }

  // Codificar el mensaje para URL
  const mensajeCodificado = encodeURIComponent(textoMensaje);
  
  // Crear el enlace de WhatsApp
  const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCodificado}`;
  
  // Abrir WhatsApp en una nueva ventana
  window.open(urlWhatsApp, '_blank');
}

function formatearReservaTaxi(datos: any): string {
  return `🚕 *RESERVA DE TAXI - ${APP_NAME.toUpperCase()}*

🗺️ *Detalles del Viaje:*
📍 Origen: ${datos.origen || 'N/A'}
📍 Destino: ${datos.destino || 'N/A'}
📅 Fecha: ${datos.fecha || 'N/A'}
⏰ Hora: ${datos.hora || 'N/A'}
👥 Pasajeros: ${datos.pasajeros || 'N/A'}
💰 Precio Total: $${datos.precio || 'N/A'}

`;
}

function formatearExcursion(datos: any): string {
  return `🏝️ *RESERVA DE EXCURSIÓN - ${APP_NAME.toUpperCase()}*

📋 *Información del Cliente:*
👤 Nombre: ${datos.nombre || 'N/A'}
📧 Email: ${datos.email || 'N/A'}
📱 Teléfono: ${datos.telefono || 'N/A'}

🎯 *Detalles de la Excursión:*
🏝️ Excursión: ${datos.excursion || 'N/A'}
📅 Fecha: ${datos.fecha || 'N/A'}
👥 Personas: ${datos.personas || 'N/A'}
💰 Precio Total: $${datos.precio || 'N/A'}

💬 *Comentarios:*
${datos.comentarios || 'Sin comentarios'}`;
}

function formatearPaquete(datos: any): string {
  return `📦 *RESERVA DE PAQUETE - ${APP_NAME.toUpperCase()}*

📋 *Información del Cliente:*
👤 Nombre: ${datos.nombre || 'N/A'}
📧 Email: ${datos.email || 'N/A'}
📱 Teléfono: ${datos.telefono || 'N/A'}

📦 *Detalles del Paquete:*
🎁 Paquete: ${datos.paquete || 'N/A'}
📅 Fecha: ${datos.fecha || 'N/A'}
👥 Personas: ${datos.personas || 'N/A'}
💰 Precio Total: $${datos.precio || 'N/A'}

💬 *Comentarios:*
${datos.comentarios || 'Sin comentarios'}`;
}

function formatearPersonalizado(datos: any): string {
  return `✨ *SOLICITUD PERSONALIZADA - ${APP_NAME.toUpperCase()}*

📋 *Información del Cliente:*
👤 Nombre: ${datos.nombre || 'N/A'}
📧 Email: ${datos.email || 'N/A'}
📱 Teléfono: ${datos.telefono || 'N/A'}
👥 Viajeros: ${datos.viajeros || 'N/A'}


🗓️ *Detalles del Viaje:*
📅 Fecha: ${datos.fecha || 'N/A'}
⏱️ Duración: ${datos.duracion || 'N/A'}

📝 *Descripción:*
${datos.descripcion || 'Sin descripción'}`;
}

function formatearCircuitoPersonalizado(datos: any): string {
  return `🗺️ *CIRCUITO PERSONALIZADO - ${APP_NAME.toUpperCase()}*

📋 *Información del Cliente:*
👤 Nombre: ${datos.nombre || 'N/A'}
📧 Email: ${datos.email || 'N/A'}
📱 Teléfono: ${datos.telefono || 'N/A'}

🚗 *Detalles del Circuito:*
🚕 Punto de Recogida: ${datos.puntoRecogida || 'N/A'}
🏁 Destino Final: ${datos.destinoFinal || 'N/A'}
👥 Personas: ${datos.personas || 'N/A'}
📅 Duración: ${datos.dias} días
📏 Distancia Total: ${datos.distancia} km

📍 *Itinerario:*
${datos.ruta || 'N/A'}

🏨 *Alojamiento:*
¿Necesita alojamiento?: ${datos.alojamiento}
${datos.alojamiento === 'Sí' ? `🛏️ Detalle: ${datos.detalleAlojamiento}` : ''}

💰 *Precios:*
🚕 Transporte (24hrs): $${datos.precioTransporte}
🏨 Alojamiento: $${datos.precioAlojamiento}
💵 *TOTAL: $${datos.precioTotal}*

💬 *Comentarios:*
${datos.comentarios || 'Sin comentarios'}

ℹ️ _Incluye taxi disponible las 24 horas durante todo el circuito_`;
}
