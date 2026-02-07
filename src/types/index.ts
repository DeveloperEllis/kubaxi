export interface Ubicacion {
  id: number
  nombre: string
  codigo: string
  region: string
  tipo: string
  provincia: string
}

export interface TripRequest {
  id?: string
  origen_id: number
  destino_id: number
  taxi_type: 'colectivo' | 'privado'
  cantidad_personas: number
  trip_date: string
  contact_name: string
  contact_phone: string
  contact_address: string
  extra_info?: string
  price?: number
  distance_km?: number
  estimated_time_minutes?: number
}

export interface PriceCalculation {
  price: number
  distance_km: number
  estimated_time_minutes: number
}


export interface Excursion {
  id: string
  titulo_es: string
  titulo_en?: string
  titulo_fr?: string
  descripcion_es?: string
  descripcion_en?: string
  descripcion_fr?: string
  ubicacion: string
  precio: number
  precio_por_pax?: number
  min_pax?: number
  max_pax?: number
  precio_por_pax_nivel2?: number
  umbral_nivel2?: number
  imagen_url?: string
}

export interface PaqueteViaje {
  id: string
  nombre_es: string
  nombre_en?: string
  nombre_fr?: string
  descripcion_es?: string
  descripcion_en?: string
  descripcion_fr?: string
  region: string
  precio: number
  duracion_dias: number
  duracion_noches: number
  imagen_url?: string
  incluye_es?: string
  incluye_en?: string
  incluye_fr?: string
  destinos_es?: string
  destinos_en?: string
  destinos_fr?: string
  activo?: boolean
  orden?: number
}

export interface CircuitoPersonalizado {
  ciudades: number[] // IDs de ubicaciones
  cantidadPersonas: number
  necesitaAlojamiento: boolean
  cantidadHabitaciones?: number
  diasAlojamiento?: number
  precioTransporte: number
  precioAlojamiento: number
  precioTotal: number
  distanciaTotal: number
}

// ============================================
// TIPOS PARA SISTEMA DE PRECIOS PERSONALIZADOS
// ============================================

export interface PrecioTransferCustom {
  id_origen: number
  id_destino: number
  distancia_km: number
  tiempo_min: number
  precio_base: number
  notas?: string
  ajustado_por?: string
  created_at?: string
  updated_at?: string
}

export interface PrecioTransferConNombres extends PrecioTransferCustom {
  origen_nombre: string
  origen_provincia: string
  destino_nombre: string
  destino_provincia: string
  precio_custom: number
  precio_automatico: number
  diferencia_precio: number
}

export interface UpsertPrecioCustomParams {
  p_id_origen: number
  p_id_destino: number
  p_distancia_km: number
  p_tiempo_min: number
  p_precio_base: number
  p_notas?: string
  p_ajustado_por?: string
}
