'use client'

import { useState, useEffect } from 'react'
import { searchUbicaciones, calculatePrice, createTripRequest } from '@/lib/services'
import { Ubicacion } from '@/types'

interface TripRequestFormProps {
  onBack: () => void
}

export default function TripRequestForm({ onBack }: TripRequestFormProps) {
  // Form state
  const [origenSearch, setOrigenSearch] = useState('')
  const [destinoSearch, setDestinoSearch] = useState('')
  const [origenSuggestions, setOrigenSuggestions] = useState<Ubicacion[]>([])
  const [destinoSuggestions, setDestinoSuggestions] = useState<Ubicacion[]>([])
  const [selectedOrigen, setSelectedOrigen] = useState<Ubicacion | null>(null)
  const [selectedDestino, setSelectedDestino] = useState<Ubicacion | null>(null)
  
  const [taxiType, setTaxiType] = useState<'colectivo' | 'privado'>('colectivo')
  const [cantidadPersonas, setCantidadPersonas] = useState(1)
  const [tripDate, setTripDate] = useState('')
  const [tripTime, setTripTime] = useState('')
  const [horarioColectivo, setHorarioColectivo] = useState<'mañana' | 'tarde' | null>(null)
  
  const [price, setPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search origen
  useEffect(() => {
    if (origenSearch.length >= 2) {
      searchUbicaciones(origenSearch).then(setOrigenSuggestions)
    } else {
      setOrigenSuggestions([])
    }
  }, [origenSearch])

  // Search destino
  useEffect(() => {
    if (destinoSearch.length >= 2) {
      searchUbicaciones(destinoSearch).then(setDestinoSuggestions)
    } else {
      setDestinoSuggestions([])
    }
  }, [destinoSearch])

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
      setError('Por favor selecciona origen y destino')
      return
    }

    if (!tripDate) {
      setError('Por favor selecciona una fecha')
      return
    }

    if (taxiType === 'colectivo' && !horarioColectivo) {
      setError('Por favor selecciona el horario (mañana o tarde)')
      return
    }

    if (taxiType === 'privado' && !tripTime) {
      setError('Por favor selecciona una hora para el taxi privado')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Construir fecha/hora según el tipo de taxi
      let tripDateTime = ''
      if (taxiType === 'colectivo' && horarioColectivo) {
        // Para colectivo: mañana = 00:00, tarde = 12:00
        const hour = horarioColectivo === 'mañana' ? '00:00' : '12:00'
        tripDateTime = `${tripDate}T${hour}:00`
      } else if (taxiType === 'privado') {
        tripDateTime = `${tripDate}T${tripTime}:00`
      }
      
      await createTripRequest({
        origen_id: selectedOrigen.id,
        destino_id: selectedDestino.id,
        taxi_type: taxiType,
        cantidad_personas: cantidadPersonas,
        trip_date: tripDateTime,
        price: price,
        distance_km: distance,
        estimated_time_minutes: estimatedTime,
        status: 'pending',
        user_id: 'guest' // Para usuarios invitados
      })

      setSuccess(true)
    } catch (err) {
      setError('Error al crear la solicitud. Por favor intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Reserva Registrada!
        </h2>
        <p className="text-gray-600 mb-4 text-lg">
          Tu viaje ha sido registrado exitosamente.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Detalles del viaje:</strong><br/>
            {selectedOrigen?.nombre} → {selectedDestino?.nombre}<br/>
            {taxiType === 'colectivo' ? '🚕 Colectivo' : '🚗 Privado'} • {cantidadPersonas} {cantidadPersonas === 1 ? 'persona' : 'personas'}<br/>
            💰 Precio estimado: ${price} CUP
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          Hacer otra reserva
        </button>
      </div>
    )
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

          {/* Origen */}
          <div className="mb-3 relative">
            <input
              type="text"
              value={selectedOrigen ? selectedOrigen.nombre : origenSearch}
              onChange={(e) => {
                setOrigenSearch(e.target.value)
                setSelectedOrigen(null)
              }}
              placeholder="📍 Origen - ¿Desde dónde viajas?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {origenSuggestions.length > 0 && !selectedOrigen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {origenSuggestions.map((ubicacion) => (
                  <button
                    key={ubicacion.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrigen(ubicacion)
                      setOrigenSearch('')
                      setOrigenSuggestions([])
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
              }}
              placeholder="🎯 Destino - ¿A dónde vas?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {destinoSuggestions.length > 0 && !selectedDestino && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {destinoSuggestions.map((ubicacion) => (
                  <button
                    key={ubicacion.id}
                    type="button"
                    onClick={() => {
                      setSelectedDestino(ubicacion)
                      setDestinoSearch('')
                      setDestinoSuggestions([])
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="colectivo">🚕 Colectivo</option>
              <option value="privado">🚗 Privado</option>
            </select>

            {/* Cantidad de Personas */}
            <input
              type="number"
              min="1"
              max="15"
              value={cantidadPersonas}
              onChange={(e) => setCantidadPersonas(parseInt(e.target.value))}
              placeholder="👥 Personas"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Fecha */}
          <div className="mb-3">
            <input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
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
                <option value="">⏰ Selecciona horario</option>
                <option value="mañana">🌅 Mañana (antes del mediodía)</option>
                <option value="tarde">🌇 Tarde (después del mediodía)</option>
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <input
                type="time"
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
                placeholder="⏰ Hora"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Price Summary - Compacto */}
          {price !== null && distance !== null && estimatedTime !== null && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="text-gray-600 text-xs">Distancia</div>
                  <div className="font-bold text-gray-900">{distance} km</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Tiempo</div>
                  <div className="font-bold text-gray-900">{estimatedTime} min</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Precio</div>
                  <div className="font-bold text-blue-600">${price}</div>
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
                Procesando...
              </span>
            ) : '✅ Confirmar Reserva'}
          </button>
        </form>
    </div>
  )
}
