'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { getUbicaciones, calculatePrice } from '@/lib/services'
import { abrirWhatsApp } from '@/lib/whatsapp'
import type { Ubicacion } from '@/types'

interface AlojamientoCiudad {
  ciudadId: number
  habitaciones: number
  dias: number
}

export default function CircuitoPersonalizadoSection() {
  const t = useTranslations('customCircuit')
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<number[]>([])
  const [cantidadPersonas, setCantidadPersonas] = useState(1)
  const [alojamientos, setAlojamientos] = useState<AlojamientoCiudad[]>([])
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [precioTransporte, setPrecioTransporte] = useState(0)
  const [distanciaTotal, setDistanciaTotal] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    cargarUbicaciones()
  }, [])

  useEffect(() => {
    aplicarFiltro()
  }, [ubicaciones, filtroTipo])

  useEffect(() => {
    if (ciudadesSeleccionadas.length >= 2) {
      calcularRuta()
    } else {
      setPrecioTransporte(0)
      setDistanciaTotal(0)
    }
  }, [ciudadesSeleccionadas, cantidadPersonas])

  const cargarUbicaciones = async () => {
    try {
      setLoading(true)
      const data = await getUbicaciones()
      setUbicaciones(data)
      setUbicacionesFiltradas(data)
    } catch (error) {
      console.error('Error cargando ubicaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltro = () => {
    if (filtroTipo === 'todos') {
      setUbicacionesFiltradas(ubicaciones)
    } else {
      const filtradas = ubicaciones.filter(u => u.tipo?.toLowerCase() === filtroTipo.toLowerCase())
      setUbicacionesFiltradas(filtradas)
    }
  }

  const calcularRuta = async () => {
    if (ciudadesSeleccionadas.length < 2) return

    try {
      setCalculando(true)
      let precioTotal = 0
      let distanciaTotal = 0

      // Calcular la ruta entre cada par de ciudades consecutivas
      for (let i = 0; i < ciudadesSeleccionadas.length - 1; i++) {
        const origen = ciudadesSeleccionadas[i]
        const destino = ciudadesSeleccionadas[i + 1]

        const resultado = await calculatePrice(origen, destino, 'privado', cantidadPersonas)
        precioTotal += resultado.price
        distanciaTotal += resultado.distance_km
      }

      setPrecioTransporte(Math.round(precioTotal))
      setDistanciaTotal(Math.round(distanciaTotal * 10) / 10)
    } catch (error) {
      console.error('Error calculando ruta:', error)
      setPrecioTransporte(0)
      setDistanciaTotal(0)
    } finally {
      setCalculando(false)
    }
  }

  const calcularPrecioAlojamiento = (): number => {
    return alojamientos.reduce((total, aloj) => {
      return total + (aloj.habitaciones * aloj.dias * 30)
    }, 0)
  }

  const calcularPrecioTotal = (): number => {
    return precioTransporte + calcularPrecioAlojamiento()
  }

  const toggleCiudad = (ciudadId: number) => {
    setCiudadesSeleccionadas(prev => {
      if (prev.includes(ciudadId)) {
        // Remover ciudad y su alojamiento
        setAlojamientos(prevAloj => prevAloj.filter(a => a.ciudadId !== ciudadId))
        return prev.filter(id => id !== ciudadId)
      } else {
        return [...prev, ciudadId]
      }
    })
  }

  const agregarAlojamiento = (ciudadId: number) => {
    setAlojamientos(prev => [...prev, { ciudadId, habitaciones: 1, dias: 1 }])
  }

  const removerAlojamiento = (ciudadId: number) => {
    setAlojamientos(prev => prev.filter(a => a.ciudadId !== ciudadId))
  }

  const actualizarAlojamiento = (ciudadId: number, campo: 'habitaciones' | 'dias', valor: number) => {
    setAlojamientos(prev => prev.map(a => 
      a.ciudadId === ciudadId ? { ...a, [campo]: valor } : a
    ))
  }

  const tieneAlojamiento = (ciudadId: number): boolean => {
    return alojamientos.some(a => a.ciudadId === ciudadId)
  }

  const eliminarCiudad = (index: number) => {
    setCiudadesSeleccionadas(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const ciudadesNombres = ciudadesSeleccionadas.map(id => {
      const ubicacion = ubicaciones.find(u => u.id === id)
      return ubicacion?.nombre || `Ciudad ${id}`
    }).join(' → ')

    const detalleAlojamiento = alojamientos.map(aloj => {
      const ubicacion = ubicaciones.find(u => u.id === aloj.ciudadId)
      return `${ubicacion?.nombre}: ${aloj.habitaciones} hab × ${aloj.dias} días`
    }).join(', ')

    abrirWhatsApp({
      tipo: 'circuito_personalizado',
      datos: {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        ruta: ciudadesNombres,
        personas: cantidadPersonas,
        distancia: distanciaTotal,
        precioTransporte: precioTransporte,
        alojamiento: alojamientos.length > 0 ? 'Sí' : 'No',
        detalleAlojamiento: detalleAlojamiento || 'No requiere',
        precioAlojamiento: calcularPrecioAlojamiento(),
        precioTotal: calcularPrecioTotal(),
        comentarios: formData.get('comentarios') || 'Sin comentarios'
      }
    })
    
    setShowBookingModal(false)
  }

  if (loading) {
    return (
      <section id="circuito" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="circuito" className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            🗺️ Circuito Personalizado
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Diseña tu ruta perfecta por Cuba. Taxi disponible 24 horas durante todo tu viaje.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Panel de selección */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Configura tu circuito</h3>

            {/* Cantidad de personas */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                👥 Cantidad de personas
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={cantidadPersonas || ''}
                onChange={(e) => setCantidadPersonas(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                🔍 Filtrar por tipo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtroTipo === 'todos'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🌎 Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('municipio')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtroTipo === 'municipio'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🏙️ Municipios
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('municipio turistico')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtroTipo === 'municipio turistico'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🏛️ Turísticos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('cayo')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtroTipo === 'cayo'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🏝️ Cayos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('aeropuerto')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtroTipo === 'aeropuerto'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ✈️ Aeropuertos
                </button>
              </div>
            </div>

            {/* Selector de ciudades */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                📍 Selecciona las ciudades (en orden de visita)
              </label>
              {ubicacionesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-slate-200 rounded-xl">
                  <p>No hay ubicaciones de este tipo</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-xl p-3 space-y-2">
                  {ubicacionesFiltradas.map((ubicacion) => (
                    <button
                      key={ubicacion.id}
                      type="button"
                      onClick={() => toggleCiudad(ubicacion.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        ciudadesSeleccionadas.includes(ubicacion.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {ubicacion.nombre} - {ubicacion.provincia}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ruta seleccionada con alojamiento */}
            {ciudadesSeleccionadas.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-3">Ruta seleccionada:</p>
                <div className="space-y-3">
                  {ciudadesSeleccionadas.map((ciudadId, index) => {
                    const ubicacion = ubicaciones.find(u => u.id === ciudadId)
                    const alojamiento = alojamientos.find(a => a.ciudadId === ciudadId)
                    return (
                      <div key={index} className="bg-white rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-sm font-medium text-slate-700">
                            {index + 1}. {ubicacion?.nombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => eliminarCiudad(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Opciones de alojamiento por ciudad */}
                        <div className="px-3 pb-3 border-t border-slate-100">
                          {!alojamiento ? (
                            <button
                              type="button"
                              onClick={() => agregarAlojamiento(ciudadId)}
                              className="w-full mt-2 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              + Agregar alojamiento
                            </button>
                          ) : (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600 w-20">Habitaciones:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={alojamiento.habitaciones}
                                  onChange={(e) => actualizarAlojamiento(ciudadId, 'habitaciones', parseInt(e.target.value) || 1)}
                                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600 w-20">Días:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={alojamiento.dias}
                                  onChange={(e) => actualizarAlojamiento(ciudadId, 'dias', parseInt(e.target.value) || 1)}
                                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-semibold text-indigo-700">
                                  ${alojamiento.habitaciones * alojamiento.dias * 30}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removerAlojamiento(ciudadId)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Quitar alojamiento
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}


          </div>

          {/* Panel de resumen */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Resumen del circuito</h3>

            {ciudadesSeleccionadas.length < 2 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg mb-2">📍</p>
                <p>Selecciona al menos 2 ciudades para calcular tu circuito</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información de la ruta */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Ciudades a visitar:</span>
                    <span className="font-semibold text-slate-800">{ciudadesSeleccionadas.length}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Distancia total:</span>
                    <span className="font-semibold text-slate-800">
                      {calculando ? '...' : `${distanciaTotal} km`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Personas:</span>
                    <span className="font-semibold text-slate-800">{cantidadPersonas}</span>
                  </div>
                </div>

                {/* Desglose de precios */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-800">🚕 Transporte (24hrs)</span>
                    <span className="font-bold text-blue-900">
                      {calculando ? '...' : `$${precioTransporte}`}
                    </span>
                  </div>

                  {alojamientos.length > 0 && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-indigo-800">🏨 Alojamiento</p>
                        <span className="font-bold text-indigo-900">${calcularPrecioAlojamiento()}</span>
                      </div>
                      <div className="space-y-1">
                        {alojamientos.map((aloj) => {
                          const ubicacion = ubicaciones.find(u => u.id === aloj.ciudadId)
                          return (
                            <div key={aloj.ciudadId} className="flex items-center justify-between text-xs text-indigo-700">
                              <span>{ubicacion?.nombre}</span>
                              <span>{aloj.habitaciones} hab × {aloj.dias} días = ${aloj.habitaciones * aloj.dias * 30}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl">
                    <span className="text-lg font-semibold">💰 Total</span>
                    <span className="text-2xl font-bold">
                      {calculando ? '...' : `$${calcularPrecioTotal()}`}
                    </span>
                  </div>
                </div>

                {/* Botón de reserva */}
                <button
                  onClick={() => setShowBookingModal(true)}
                  disabled={calculando}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {calculando ? 'Calculando...' : 'Solicitar circuito'}
                </button>

                <p className="text-xs text-center text-slate-500 mt-4">
                  ℹ️ Incluye taxi disponible las 24 horas durante todo el circuito
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de reserva */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Circuito Personalizado</h3>
                  <p className="text-blue-100 text-sm">Completa tus datos para continuar</p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="+53 5123 4567"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Comentarios adicionales</label>
                <textarea
                  name="comentarios"
                  rows={3}
                  placeholder="Alguna preferencia especial..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💰 Precio Total: <span className="text-lg font-bold">${calcularPrecioTotal()}</span>
                </p>
                <p className="text-xs text-blue-700">
                  Transporte: ${precioTransporte} • Alojamiento: ${calcularPrecioAlojamiento()}
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
