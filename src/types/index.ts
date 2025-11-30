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
