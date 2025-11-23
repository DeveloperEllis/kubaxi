'use client'

import { useState, useEffect } from 'react'
import { fetchUbicacionesExcursiones, fetchExcursiones } from '@/lib/services'
import type { Excursion } from '@/types'

export default function ExcursionesSection() {
  const [ubicaciones, setUbicaciones] = useState<string[]>([])
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string>('')
  const [excursiones, setExcursiones] = useState<Excursion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExcursiones, setLoadingExcursiones] = useState(false)

  // Cargar ubicaciones al montar el componente
  useEffect(() => {
    cargarUbicaciones()
  }, [])

  // Cargar excursiones cuando cambia la ubicación
  useEffect(() => {
    if (ubicacionSeleccionada) {
      cargarExcursiones(ubicacionSeleccionada)
    }
  }, [ubicacionSeleccionada])

  const cargarUbicaciones = async () => {
    try {
      setLoading(true)
      const data = await fetchUbicacionesExcursiones()
      setUbicaciones(data)
      
      // Seleccionar la primera ubicación automáticamente
      if (data.length > 0) {
        setUbicacionSeleccionada(data[0])
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarExcursiones = async (ubicacion: string) => {
    try {
      setLoadingExcursiones(true)
      const data = await fetchExcursiones(ubicacion)
      setExcursiones(data)
    } catch (error) {
      console.error('Error cargando excursiones:', error)
      setExcursiones([])
    } finally {
      setLoadingExcursiones(false)
    }
  }

  if (loading) {
    return (
      <section id="excursiones" className="py-16 px-4 bg-gray-50 scroll-mt-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="excursiones" className="py-16 md:py-20 px-4 bg-white scroll-mt-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Excursiones en Cuba
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
            Descubre los lugares más hermosos de Cuba con nuestras excursiones guiadas
          </p>

          {/* Dropdown de ubicaciones */}
          <div className="max-w-md mx-auto">
            <label htmlFor="ubicacion" className="block text-left text-sm font-semibold text-slate-700 mb-3">
              Selecciona tu ubicación:
            </label>
            <select
              id="ubicacion"
              value={ubicacionSeleccionada}
              onChange={(e) => setUbicacionSeleccionada(e.target.value)}
              className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 font-medium shadow-sm transition-all outline-none"
            >
              {ubicaciones.map((ubicacion) => (
                <option key={ubicacion} value={ubicacion}>
                  {ubicacion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de excursiones */}
        {loadingExcursiones ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : excursiones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay excursiones disponibles en {ubicacionSeleccionada}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {excursiones.map((excursion) => (
              <ExcursionCard key={excursion.id} excursion={excursion} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// Componente para cada tarjeta de excursión
function ExcursionCard({ excursion }: { excursion: Excursion }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-200">
      {/* Imagen */}
      <div className="relative h-52 bg-gradient-to-br from-blue-500 to-indigo-600">
        {excursion.imagen_url ? (
          <img
            src={excursion.imagen_url}
            alt={excursion.titulo_es}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            🏖️
          </div>
        )}
        
        {/* Badge de precio */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-xl backdrop-blur-sm">
          ${excursion.precio}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-3">
          {excursion.titulo_es}
        </h3>

        <div className="space-y-2 text-sm text-slate-600 mb-4">
          {excursion.duracion && (
            <div className="flex items-center">
              <span className="mr-2">⏱️</span>
              <span>Duración: {excursion.duracion}</span>
            </div>
          )}
          
          {excursion.hr_salida && (
            <div className="flex items-center">
              <span className="mr-2">🕐</span>
              <span>Salida: {excursion.hr_salida}</span>
            </div>
          )}
        </div>

        {excursion.descripcion_es && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {excursion.descripcion_es}
          </p>
        )}

        {excursion.descripcion_es && showDetails && (
          <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
            <h4 className="font-semibold text-slate-800 mb-2">Descripción completa:</h4>
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {excursion.descripcion_es}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            {showDetails ? 'Menos info' : 'Más info'}
          </button>
          
          <button
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  )
}
