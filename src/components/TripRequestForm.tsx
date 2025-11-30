'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { calculatePrice } from '@/lib/services'
import { abrirWhatsApp } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'
import { Ubicacion } from '@/types'

interface TripRequestFormProps {
  onBack: () => void
}

export default function TripRequestForm({ onBack }: TripRequestFormProps) {
  const t = useTranslations('tripForm')
  
  // Form state
  const [todasUbicaciones, setTodasUbicaciones] = useState<Ubicacion[]>([])
  const [origenSearch, setOrigenSearch] = useState('')
  const [destinoSearch, setDestinoSearch] = useState('')
  const [origenSuggestions, setOrigenSuggestions] = useState<Ubicacion[]>([])
  const [destinoSuggestions, setDestinoSuggestions] = useState<Ubicacion[]>([])
  const [showOrigenDropdown, setShowOrigenDropdown] = useState(false)
  const [showDestinoDropdown, setShowDestinoDropdown] = useState(false)
  const [selectedOrigen, setSelectedOrigen] = useState<Ubicacion | null>(null)
  const [selectedDestino, setSelectedDestino] = useState<Ubicacion | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('municipios')
  
  const [taxiType, setTaxiType] = useState<'colectivo' | 'privado'>('colectivo')
  const [cantidadPersonas, setCantidadPersonas] = useState(0)
  const [tripDate, setTripDate] = useState('')
  const [tripTime, setTripTime] = useState('')
  const [horarioColectivo, setHorarioColectivo] = useState<'mañana' | 'tarde' | null>(null)
  const [isOrienteRoute, setIsOrienteRoute] = useState(false)
  
  const [price, setPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todas las ubicaciones al inicio
  useEffect(() => {
    const cargarUbicaciones = async () => {
      const { data } = await supabase
        .from('ubicaciones_cuba')
        .select('*')
        .order('nombre', { ascending: true })
      
      if (data) {
        setTodasUbicaciones(data)
      }
    }
    
    cargarUbicaciones()
  }, [])

  // Actualizar sugerencias de origen cuando cambia el filtro o la búsqueda
  useEffect(() => {
    let ubicacionesFiltradas = todasUbicaciones
    
    // Aplicar filtro de tipo
    if (filtroTipo === 'municipios') {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.tipo?.toLowerCase() === 'municipio' || u.tipo?.toLowerCase() === 'municipio turistico'
      )
    } else if (filtroTipo === 'cayo') {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.tipo?.toLowerCase() === 'cayo'
      )
    } else if (filtroTipo === 'aeropuerto') {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.tipo?.toLowerCase() === 'aeropuerto'
      )
    }
    
    // Aplicar búsqueda
    if (origenSearch.trim()) {
      const searchLower = origenSearch.toLowerCase()
      ubicacionesFiltradas = ubicacionesFiltradas.filter(u =>
        u.nombre.toLowerCase().includes(searchLower) ||
        u.provincia?.toLowerCase().includes(searchLower)
      )
    }
    
    setOrigenSuggestions(ubicacionesFiltradas)
  }, [todasUbicaciones, filtroTipo, origenSearch])

  // Actualizar sugerencias de destino cuando cambia el filtro o la búsqueda
  useEffect(() => {
    let ubicacionesFiltradas = todasUbicaciones
    
    // Aplicar filtro de tipo
    if (filtroTipo === 'municipios') {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.tipo?.toLowerCase() === 'municipio' || u.tipo?.toLowerCase() === 'municipio turistico'
      )
    } else if (filtroTipo === 'cayo') {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.tipo?.toLowerCase() === 'cayo'
      )
    } else if (filtroTipo === 'aeropuerto') {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.tipo?.toLowerCase() === 'aeropuerto'
      )
    }
    
    // Aplicar búsqueda
    if (destinoSearch.trim()) {
      const searchLower = destinoSearch.toLowerCase()
      ubicacionesFiltradas = ubicacionesFiltradas.filter(u =>
        u.nombre.toLowerCase().includes(searchLower) ||
        u.provincia?.toLowerCase().includes(searchLower)
      )
    }
    
    setDestinoSuggestions(ubicacionesFiltradas)
  }, [todasUbicaciones, filtroTipo, destinoSearch])

  // Detectar si origen o destino son de Oriente usando el campo region
  useEffect(() => {
    
    const esOriente = Boolean(
      (selectedOrigen && selectedOrigen.region?.toLowerCase() === 'oriente') ||
      (selectedDestino && selectedDestino.region?.toLowerCase() === 'oriente')
    )
    
    setIsOrienteRoute(esOriente)
    
    if (esOriente && taxiType === 'colectivo') {
      setTaxiType('privado')
      setHorarioColectivo(null)
    }
  }, [selectedOrigen, selectedDestino, taxiType])

  // Calculate price when all required fields are filled
  useEffect(() => {
    if (selectedOrigen && selectedDestino && cantidadPersonas > 0) {
      calculatePrice(
        selectedOrigen.id,
        selectedDestino.id,
        taxiType,
        cantidadPersonas
      ).then(result => {
        setPrice(result.price)
        setDistance(result.distance_km)
        setEstimatedTime(result.estimated_time_minutes)
      }).catch(err => {
        console.error('Error calculating price:', err)
      })
    }
  }, [selectedOrigen, selectedDestino, taxiType, cantidadPersonas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOrigen || !selectedDestino) {
      setError(t('selectOrigin'))
      return
    }

    if (!tripDate) {
      setError(t('selectDate'))
      return
    }

    if (!cantidadPersonas || cantidadPersonas < 1) {
      setError(t('selectPassengers'))
      return
    }

    if (taxiType === 'colectivo' && !horarioColectivo) {
      setError(t('selectScheduleError'))
      return
    }

    if (taxiType === 'privado' && !tripTime) {
      setError(t('selectTimeError'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Preparar la hora de forma legible
      let horaLegible = '';
      if (taxiType === 'colectivo' && horarioColectivo) {
        horaLegible = horarioColectivo === 'mañana' ? 'Mañana (6:00 AM - 12:00 PM)' : 'Tarde (12:00 PM - 6:00 PM)';
      } else if (taxiType === 'privado' && tripTime) {
        horaLegible = tripTime;
      }

      // Abrir WhatsApp con la información de la reserva
      abrirWhatsApp({
        tipo: 'reserva_taxi',
        datos: {
          nombre: 'Nuevo Cliente',
          origen: selectedOrigen.nombre,
          destino: selectedDestino.nombre,
          fecha: new Date(tripDate).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          hora: horaLegible,
          pasajeros: cantidadPersonas,
          tipoTaxi: taxiType === 'colectivo' ? 'Taxi Colectivo' : 'Taxi Privado',
          precioEstimado: price ? `$${price} CUP` : 'Por calcular',
          distancia: distance ? `${distance} km` : 'Por calcular',
          tiempoEstimado: estimatedTime ? `${estimatedTime} minutos` : 'Por calcular'
        }
      })

      // Resetear el formulario después de enviar
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Error al enviar la solicitud. Por favor intenta de nuevo.')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Filtros de Tipo de Ubicación */}
          <div className="mb-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFiltroTipo('municipios')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroTipo === 'municipios'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Toda Cuba
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('cayo')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroTipo === 'cayo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                 Cayos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('aeropuerto')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroTipo === 'aeropuerto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Aeropuertos
              </button>
            </div>
          </div>

          {/* Origen */}
          <div className="mb-3 relative">
            <input
              type="text"
              value={selectedOrigen ? selectedOrigen.nombre : origenSearch}
              onChange={(e) => {
                setOrigenSearch(e.target.value)
                setSelectedOrigen(null)
                setShowOrigenDropdown(true)
              }}
              onFocus={() => setShowOrigenDropdown(true)}
              onBlur={() => setTimeout(() => setShowOrigenDropdown(false), 200)}
              placeholder={`📍 ${t('origin')}`}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {(selectedOrigen || origenSearch) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOrigen(null)
                  setOrigenSearch('')
                  setShowOrigenDropdown(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {showOrigenDropdown && origenSuggestions.length > 0 && !selectedOrigen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {origenSuggestions.map((ubicacion) => (
                  <button
                    key={ubicacion.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrigen(ubicacion)
                      setOrigenSearch('')
                      setShowOrigenDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{ubicacion.nombre}</div>
                    <div className="text-xs text-gray-500">{ubicacion.provincia}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destino */}
          <div className="mb-3 relative">
            <input
              type="text"
              value={selectedDestino ? selectedDestino.nombre : destinoSearch}
              onChange={(e) => {
                setDestinoSearch(e.target.value)
                setSelectedDestino(null)
                setShowDestinoDropdown(true)
              }}
              onFocus={() => setShowDestinoDropdown(true)}
              onBlur={() => setTimeout(() => setShowDestinoDropdown(false), 200)}
              placeholder={`🎯 ${t('destination')}`}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {(selectedDestino || destinoSearch) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDestino(null)
                  setDestinoSearch('')
                  setShowDestinoDropdown(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {showDestinoDropdown && destinoSuggestions.length > 0 && !selectedDestino && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {destinoSuggestions.map((ubicacion) => (
                  <button
                    key={ubicacion.id}
                    type="button"
                    onClick={() => {
                      setSelectedDestino(ubicacion)
                      setDestinoSearch('')
                      setShowDestinoDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{ubicacion.nombre}</div>
                    <div className="text-xs text-gray-500">{ubicacion.provincia}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mensaje de advertencia para rutas de Oriente */}
          {isOrienteRoute && (
            <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span className="font-medium">Solo taxis privados disponibles para rutas de Oriente</span>
            </div>
          )}

          {/* Grid para campos compactos */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Tipo de Taxi */}
            <select
              value={taxiType}
              onChange={(e) => {
                const newType = e.target.value as 'colectivo' | 'privado'
                setTaxiType(newType)
                setTripTime('')
                setHorarioColectivo(null)
              }}
              disabled={isOrienteRoute}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="colectivo" disabled={isOrienteRoute}>🚕 {t('collective')}</option>
              <option value="privado">🚗 {t('private')}</option>
            </select>
           

            {/* Cantidad de Personas */}
            <input
              type="number"
              min="1"
              max="15"
              value={cantidadPersonas || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setCantidadPersonas(value || 0);
              }}
              placeholder={`👥 ${t('passengers')}`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontSize: '16px' }}
              required
            />
          </div>

          {/* Fecha */}
          <div className="mb-3">
            <div className="relative">
              <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                tripDate 
                  ? 'top-0 -translate-y-1/2 text-xs bg-white px-1 text-blue-600' 
                  : 'top-3 text-gray-400'
              }`} style={{ fontSize: tripDate ? '12px' : '16px' }}>
                📅 {t('tripDate')}
              </label>
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                onFocus={(e) => e.target.showPicker?.()}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 [color-scheme:light]"
                style={{ colorScheme: 'light', fontSize: '16px' }}
                required
              />
            </div>
          </div>

          {/* Horario para Colectivo o Hora para Privado */}
          {taxiType === 'colectivo' ? (
            <div className="mb-3">
              <select
                value={horarioColectivo || ''}
                onChange={(e) => setHorarioColectivo(e.target.value as 'mañana' | 'tarde')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">⏰ {t('selectSchedule')}</option>
                <option value="mañana">🌅 {t('morning')}</option>
                <option value="tarde">🌇 {t('afternoon')}</option>
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <div className="relative">
                <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                  tripTime 
                    ? 'top-0 -translate-y-1/2 text-xs bg-white px-1 text-blue-600' 
                    : 'top-3 text-gray-400'
                }`} style={{ fontSize: tripTime ? '12px' : '16px' }}>
                  ⏰ {t('tripTime')}
                </label>
                <input
                  type="time"
                  value={tripTime}
                  onChange={(e) => setTripTime(e.target.value)}
                  onFocus={(e) => e.target.showPicker?.()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 [color-scheme:light]"
                  style={{ colorScheme: 'light', fontSize: '16px' }}
                  required
                />
              </div>
            </div>
          )}

          {/* Price Summary - Diseño simple */}
          {price !== null && distance !== null && estimatedTime !== null && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <div className="text-gray-600 text-xs mb-1">{t('distance')}</div>
                  <div className="font-bold text-gray-900">{distance} km</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs mb-1">{t('time')}</div>
                  <div className="font-bold text-gray-900">{estimatedTime} min</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs mb-1">{t('price')}</div>
                  <div className="font-bold text-blue-600 text-lg">${price}</div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedOrigen || !selectedDestino}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('sendWhatsApp')}
              </span>
            )}
          </button>
        </form>
    </div>
  )
}
