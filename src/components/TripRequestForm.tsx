'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { abrirWhatsApp } from '@/lib/whatsapp'
import { useData } from '@/contexts/DataContext'
import { useDebounce } from '@/hooks/useDebounce'
import { usePriceCalculator } from '@/hooks/usePriceCalculator'
import { useFormValidation } from '@/hooks/useFormValidation'
import { tripRequestSchema } from '@/lib/validationSchemas'
import { Ubicacion } from '@/types'

interface TripRequestFormProps {
  onBack: () => void
}

export default function TripRequestForm({ onBack }: TripRequestFormProps) {
  const t = useTranslations('tripForm')
  const { ubicaciones: todasUbicaciones, loading: loadingUbicaciones } = useData(); // ✅ Context API
  
  // Form state
  const [origenSearch, setOrigenSearch] = useState('')
  const [destinoSearch, setDestinoSearch] = useState('')
  const [showOrigenDropdown, setShowOrigenDropdown] = useState(false)
  const [showDestinoDropdown, setShowDestinoDropdown] = useState(false)
  const [selectedOrigen, setSelectedOrigen] = useState<Ubicacion | null>(null)
  const [selectedDestino, setSelectedDestino] = useState<Ubicacion | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [filtroOrigenTipo, setFiltroOrigenTipo] = useState<string>('todos')
  const [filtroDestinoTipo, setFiltroDestinoTipo] = useState<string>('todos')
  
  const [taxiType, setTaxiType] = useState<'colectivo' | 'privado'>('colectivo')
  const [cantidadPersonas, setCantidadPersonas] = useState(0)
  const [tripDate, setTripDate] = useState('')
  const [tripTime, setTripTime] = useState('')
  const [horarioColectivo, setHorarioColectivo] = useState<'mañana' | 'tarde' | undefined>(undefined)
  const [isOrienteRoute, setIsOrienteRoute] = useState(false)
  
  // ✅ Custom hook para cálculos de precio
  const {
    price,
    distance,
    estimatedTime,
    loading: calculandoPrecio,
    error: errorPrecio,
    calcular: calcularPrecio,
  } = usePriceCalculator();
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Validación con Zod
  const { errors: validationErrors, validate, clearErrors } = useFormValidation(tripRequestSchema);

  // ✅ Debounce para búsquedas
  const debouncedOrigenSearch = useDebounce(origenSearch, 300);
  const debouncedDestinoSearch = useDebounce(destinoSearch, 300);

  // ✅ useMemo: Optimizar sugerencias de origen
  const origenSuggestions = useMemo(() => {
    let ubicacionesFiltradas = todasUbicaciones;
    
    // Excluir el destino seleccionado y ubicaciones de la misma provincia
    if (selectedDestino) {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.id !== selectedDestino.id && u.provincia !== selectedDestino.provincia
      );
    }
    
    // Aplicar filtro de tipo solo si mostrarFiltros está activo
    if (mostrarFiltros) {
      if (filtroOrigenTipo === 'municipio turistico') {
        ubicacionesFiltradas = ubicacionesFiltradas.filter(
          u => u.tipo?.toLowerCase() === 'municipio turistico'
        );
      } else if (filtroOrigenTipo === 'cayo') {
        ubicacionesFiltradas = ubicacionesFiltradas.filter(
          u => u.tipo?.toLowerCase() === 'cayo'
        );
      } else if (filtroOrigenTipo === 'aeropuerto') {
        ubicacionesFiltradas = ubicacionesFiltradas.filter(
          u => u.tipo?.toLowerCase() === 'aeropuerto'
        );
      }
    }
    
    // Usar debouncedOrigenSearch
    if (debouncedOrigenSearch.trim()) {
      const searchLower = debouncedOrigenSearch.toLowerCase();
      ubicacionesFiltradas = ubicacionesFiltradas.filter(u =>
        u.nombre.toLowerCase().includes(searchLower) ||
        u.provincia?.toLowerCase().includes(searchLower)
      );
    }
    
    return ubicacionesFiltradas;
  }, [todasUbicaciones, filtroOrigenTipo, debouncedOrigenSearch, mostrarFiltros, selectedDestino]);

  // ✅ useMemo: Optimizar sugerencias de destino
  const destinoSuggestions = useMemo(() => {
    let ubicacionesFiltradas = todasUbicaciones;
    
    // Excluir el origen seleccionado y ubicaciones de la misma provincia
    if (selectedOrigen) {
      ubicacionesFiltradas = ubicacionesFiltradas.filter(
        u => u.id !== selectedOrigen.id && u.provincia !== selectedOrigen.provincia
      );
    }
    
    // Aplicar filtro de tipo solo si mostrarFiltros está activo
    if (mostrarFiltros) {
      if (filtroDestinoTipo === 'municipio turistico') {
        ubicacionesFiltradas = ubicacionesFiltradas.filter(
          u => u.tipo?.toLowerCase() === 'municipio turistico'
        );
      } else if (filtroDestinoTipo === 'cayo') {
        ubicacionesFiltradas = ubicacionesFiltradas.filter(
          u => u.tipo?.toLowerCase() === 'cayo'
        );
      } else if (filtroDestinoTipo === 'aeropuerto') {
        ubicacionesFiltradas = ubicacionesFiltradas.filter(
          u => u.tipo?.toLowerCase() === 'aeropuerto'
        );
      }
    }
    
    // Usar debouncedDestinoSearch
    if (debouncedDestinoSearch.trim()) {
      const searchLower = debouncedDestinoSearch.toLowerCase();
      ubicacionesFiltradas = ubicacionesFiltradas.filter(u =>
        u.nombre.toLowerCase().includes(searchLower) ||
        u.provincia?.toLowerCase().includes(searchLower)
      );
    }
    
    return ubicacionesFiltradas;
  }, [todasUbicaciones, filtroDestinoTipo, debouncedDestinoSearch, mostrarFiltros, selectedOrigen]);

  // Detectar si origen o destino son de Oriente usando el campo region
  useEffect(() => {
    
    const esOriente = Boolean(
      (selectedOrigen && selectedOrigen.region?.toLowerCase() === 'oriente') ||
      (selectedDestino && selectedDestino.region?.toLowerCase() === 'oriente')
    )
    
    setIsOrienteRoute(esOriente)
    
    if (esOriente && taxiType === 'colectivo') {
      setTaxiType('privado')
      setHorarioColectivo(undefined)
    }
  }, [selectedOrigen, selectedDestino, taxiType])

  // ✅ Calcular precio automáticamente cuando cambien los campos requeridos
  useEffect(() => {
    if (selectedOrigen && selectedDestino && cantidadPersonas > 0) {
      calcularPrecio(
        selectedOrigen.id,
        selectedDestino.id,
        taxiType,
        cantidadPersonas
      );
    }
  }, [selectedOrigen, selectedDestino, taxiType, cantidadPersonas, calcularPrecio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ Validar con Zod
    const isValid = validate({
      origen: selectedOrigen || undefined,
      destino: selectedDestino || undefined,
      taxiType,
      cantidadPersonas,
      tripDate,
      tripTime,
      horarioColectivo,
    });

    if (!isValid) {
      // Mostrar el primer error encontrado
      const firstError = Object.values(validationErrors)[0];
      setError(firstError || 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true)
    setError(null)
    clearErrors();

    try {
      // Preparar la hora de forma legible
      let horaLegible = '';
      if (taxiType === 'colectivo' && horarioColectivo) {
        horaLegible = horarioColectivo === 'mañana' ? 'Mañana (6:00 AM - 12:00 PM)' : 'Tarde (12:00 PM - 6:00 PM)';
      } else if (taxiType === 'privado' && tripTime) {
        horaLegible = tripTime;
      }

      // Abrir WhatsApp con la información de la reserva
      if (!selectedOrigen || !selectedDestino) {
        setError('Debes seleccionar origen y destino');
        setLoading(false);
        return;
      }
      
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
          precio: price || 0,
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

          {/* Checkbox para mostrar filtros */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarFiltros}
                onChange={(e) => setMostrarFiltros(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 font-medium">Mostrar filtros de ubicación</span>
            </label>
          </div>

          {/* Origen con filtros compactos */}
          <div className="mb-3">
            {mostrarFiltros && (
              <div className="flex gap-1 mb-1.5">
              <button
                type="button"
                onClick={() => setFiltroOrigenTipo('todos')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroOrigenTipo === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => setFiltroOrigenTipo('municipio turistico')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroOrigenTipo === 'municipio turistico'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Turístico
              </button>
              <button
                type="button"
                onClick={() => setFiltroOrigenTipo('cayo')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroOrigenTipo === 'cayo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cayos
              </button>
              <button
                type="button"
                onClick={() => setFiltroOrigenTipo('aeropuerto')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroOrigenTipo === 'aeropuerto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aeropuertos
              </button>
            </div>
            )}
            <div className="relative">
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
          </div>

          {/* Destino con filtros compactos */}
          <div className="mb-3">
            {mostrarFiltros && (
              <div className="flex gap-1 mb-1.5">
              <button
                type="button"
                onClick={() => setFiltroDestinoTipo('todos')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroDestinoTipo === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => setFiltroDestinoTipo('municipio turistico')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroDestinoTipo === 'municipio turistico'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Turístico
              </button>
              <button
                type="button"
                onClick={() => setFiltroDestinoTipo('cayo')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroDestinoTipo === 'cayo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cayos
              </button>
              <button
                type="button"
                onClick={() => setFiltroDestinoTipo('aeropuerto')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroDestinoTipo === 'aeropuerto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aeropuertos
              </button>
            </div>
            )}
            <div className="relative">
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
                setHorarioColectivo(undefined)
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
                onFocus={(e) => {
                  try {
                    e.target.showPicker?.();
                  } catch (error) {
                    // showPicker requires user gesture, ignore if not available
                  }
                }}
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
