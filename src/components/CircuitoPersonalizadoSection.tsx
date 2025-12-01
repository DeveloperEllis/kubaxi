'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { getUbicaciones, calculatePrice } from '@/lib/services'
import { abrirWhatsApp } from '@/lib/whatsapp'
import type { Ubicacion } from '@/types'

interface CiudadCircuito {
  ciudadId: number
  alojamiento?: {
    habitaciones: number
    noches: number
  }
}

export default function CircuitoPersonalizadoSection() {
  const t = useTranslations('customCircuit')
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [cantidadPersonas, setCantidadPersonas] = useState(1)
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<CiudadCircuito[]>([])
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [precioTransporte, setPrecioTransporte] = useState(0)
  const [distanciaTotal, setDistanciaTotal] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [busquedaCiudad, setBusquedaCiudad] = useState('')
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false)
  const [ciudadesFiltradas, setCiudadesFiltradas] = useState<Ubicacion[]>([])

  useEffect(() => {
    cargarUbicaciones()
  }, [])

  useEffect(() => {
    aplicarFiltro()
  }, [ubicaciones, filtroTipo])

  useEffect(() => {
    calcularRuta()
  }, [ciudadesSeleccionadas, cantidadPersonas])

  // Actualizar ciudades filtradas cuando cambia el filtro o la búsqueda
  useEffect(() => {
    let resultado = ubicacionesFiltradas
    
    if (busquedaCiudad.trim()) {
      const searchLower = busquedaCiudad.toLowerCase()
      resultado = resultado.filter(u =>
        u.nombre.toLowerCase().includes(searchLower) ||
        u.provincia?.toLowerCase().includes(searchLower)
      )
    }
    
    setCiudadesFiltradas(resultado)
  }, [ubicacionesFiltradas, busquedaCiudad])

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
    if (ciudadesSeleccionadas.length < 2) {
      setPrecioTransporte(0)
      setDistanciaTotal(0)
      return
    }

    try {
      setCalculando(true)
      let precioTotal = 0
      let distanciaTotal = 0

      for (let i = 0; i < ciudadesSeleccionadas.length - 1; i++) {
        const origen = ciudadesSeleccionadas[i].ciudadId
        const destino = ciudadesSeleccionadas[i + 1].ciudadId

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

  const agregarCiudad = (ciudadId: number) => {
    setCiudadesSeleccionadas(prev => [...prev, { ciudadId }])
  }

  const eliminarCiudad = (index: number) => {
    setCiudadesSeleccionadas(prev => prev.filter((_, i) => i !== index))
  }

  const moverCiudad = (index: number, direccion: 'arriba' | 'abajo') => {
    const nuevasCiudades = [...ciudadesSeleccionadas]
    if (direccion === 'arriba' && index > 0) {
      [nuevasCiudades[index], nuevasCiudades[index - 1]] = [nuevasCiudades[index - 1], nuevasCiudades[index]]
    } else if (direccion === 'abajo' && index < ciudadesSeleccionadas.length - 1) {
      [nuevasCiudades[index], nuevasCiudades[index + 1]] = [nuevasCiudades[index + 1], nuevasCiudades[index]]
    }
    setCiudadesSeleccionadas(nuevasCiudades)
  }

  const toggleAlojamiento = (index: number) => {
    setCiudadesSeleccionadas(prev => prev.map((ciudad, i) => {
      if (i === index) {
        if (ciudad.alojamiento) {
          const { alojamiento, ...rest } = ciudad
          return rest
        } else {
          return { ...ciudad, alojamiento: { habitaciones: 1, noches: 1 } }
        }
      }
      return ciudad
    }))
  }

  const actualizarAlojamiento = (index: number, campo: 'habitaciones' | 'noches', valor: number) => {
    setCiudadesSeleccionadas(prev => prev.map((ciudad, i) => {
      if (i === index && ciudad.alojamiento) {
        return {
          ...ciudad,
          alojamiento: { ...ciudad.alojamiento, [campo]: valor }
        }
      }
      return ciudad
    }))
  }

  const puedeAgregarAlojamiento = (ciudadId: number): boolean => {
    const ubicacion = ubicaciones.find(u => u.id === ciudadId)
    const tipo = ubicacion?.tipo?.toLowerCase()
    return tipo === 'municipio' || tipo === 'municipio turistico'
  }

  const calcularPrecioAlojamiento = (): number => {
    return ciudadesSeleccionadas.reduce((total, ciudad) => {
      if (ciudad.alojamiento) {
        return total + (ciudad.alojamiento.habitaciones * ciudad.alojamiento.noches * 30)
      }
      return total
    }, 0)
  }

  const calcularDiasTotales = (): number => {
    const nochesTotales = ciudadesSeleccionadas.reduce((total, ciudad) => {
      return total + (ciudad.alojamiento?.noches || 0)
    }, 0)
    return nochesTotales + 1
  }

  const calcularPrecioTotal = (): number => {
    const diasCircuito = calcularDiasTotales()
    return (precioTransporte * diasCircuito) + calcularPrecioAlojamiento()
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const ruta = ciudadesSeleccionadas.map((ciudad, index) => {
      const ubicacion = ubicaciones.find(u => u.id === ciudad.ciudadId)
      let texto = `${index + 1}. ${ubicacion?.nombre}`
      
      if (ciudad.alojamiento) {
        texto += ` (🏨 ${ciudad.alojamiento.noches} ${ciudad.alojamiento.noches === 1 ? 'noche' : 'noches'}, ${ciudad.alojamiento.habitaciones} hab)`
      }
      
      return texto
    }).join('\n')

    const totalNoches = ciudadesSeleccionadas.reduce((total, c) => total + (c.alojamiento?.noches || 0), 0)
    const diasCircuito = calcularDiasTotales()

    abrirWhatsApp({
      tipo: 'circuito_personalizado',
      datos: {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        ruta,
        personas: cantidadPersonas,
        dias: diasCircuito,
        distancia: distanciaTotal,
        precioTransporte: precioTransporte * diasCircuito,
        alojamiento: totalNoches > 0 ? 'Sí' : 'No',
        detalleAlojamiento: totalNoches > 0 ? `${totalNoches} ${totalNoches === 1 ? 'noche' : 'noches'}` : 'No requiere',
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            🗺️ Circuito Personalizado
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Selecciona las ciudades que visitarás en orden. Taxi disponible 24 horas.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Cantidad de personas */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="number"
                min="1"
                max="8"
                value={cantidadPersonas || ''}
                onChange={(e) => {
                  const valor = e.target.value
                  if (valor === '') {
                    setCantidadPersonas(0)
                  } else {
                    setCantidadPersonas(parseInt(valor) || 0)
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value || parseInt(e.target.value) < 1) {
                    setCantidadPersonas(1)
                  }
                }}
                placeholder=" "
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent peer"
              />
              <label className="absolute left-4 top-3 text-slate-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
                👥 Personas
              </label>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              🔍 Filtrar por tipo
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                  filtroTipo === 'todos'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌎 Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('municipio turistico')}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
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
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
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
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                  filtroTipo === 'aeropuerto'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✈️ Aeropuertos
              </button>
            </div>
          </div>

          {/* Buscador de ciudades */}
          <div className="mb-6 relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📍 Agregar a tu ruta
            </label>
            <input
              type="text"
              value={busquedaCiudad}
              onChange={(e) => {
                setBusquedaCiudad(e.target.value)
                setShowCiudadDropdown(true)
              }}
              onFocus={() => setShowCiudadDropdown(true)}
              onBlur={() => setTimeout(() => setShowCiudadDropdown(false), 200)}
              placeholder="Busca una ciudad..."
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {showCiudadDropdown && ciudadesFiltradas.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                {ciudadesFiltradas.map((ub) => (
                  <button
                    key={ub.id}
                    type="button"
                    onClick={() => {
                      agregarCiudad(ub.id)
                      setBusquedaCiudad('')
                      setShowCiudadDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium text-sm text-slate-900">{ub.nombre}</div>
                    <div className="text-xs text-slate-500">{ub.provincia}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ciudades seleccionadas */}
          {ciudadesSeleccionadas.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-700 mb-3">Tu ruta:</p>
              <div className="space-y-2">
                {ciudadesSeleccionadas.map((ciudad, index) => {
                  const ubicacion = ubicaciones.find(u => u.id === ciudad.ciudadId)
                  const puedeAlojarse = puedeAgregarAlojamiento(ciudad.ciudadId)
                  
                  return (
                    <div key={index} className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">{index + 1}.</span>
                          <span className="font-medium text-slate-800">{ubicacion?.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => moverCiudad(index, 'arriba')}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Mover arriba"
                            >
                              ↑
                            </button>
                          )}
                          {index < ciudadesSeleccionadas.length - 1 && (
                            <button
                              onClick={() => moverCiudad(index, 'abajo')}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Mover abajo"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            onClick={() => eliminarCiudad(index)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Alojamiento */}
                      {puedeAlojarse && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          {!ciudad.alojamiento ? (
                            <button
                              onClick={() => toggleAlojamiento(index)}
                              className="w-full px-3 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              + Agregar alojamiento
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-indigo-700">🏨 Alojamiento</span>
                                <button
                                  onClick={() => toggleAlojamiento(index)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Quitar
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={ciudad.alojamiento.habitaciones || ''}
                                    onChange={(e) => {
                                      const valor = e.target.value
                                      actualizarAlojamiento(index, 'habitaciones', valor === '' ? 0 : parseInt(valor) || 0)
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value || parseInt(e.target.value) < 1) {
                                        actualizarAlojamiento(index, 'habitaciones', 1)
                                      }
                                    }}
                                    placeholder=" "
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm peer"
                                  />
                                  <label className="absolute left-3 top-2 text-slate-500 text-xs transition-all duration-200 peer-placeholder-shown:top-2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
                                    Habitaciones
                                  </label>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={ciudad.alojamiento.noches || ''}
                                    onChange={(e) => {
                                      const valor = e.target.value
                                      actualizarAlojamiento(index, 'noches', valor === '' ? 0 : parseInt(valor) || 0)
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value || parseInt(e.target.value) < 1) {
                                        actualizarAlojamiento(index, 'noches', 1)
                                      }
                                    }}
                                    placeholder=" "
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm peer"
                                  />
                                  <label className="absolute left-3 top-2 text-slate-500 text-xs transition-all duration-200 peer-placeholder-shown:top-2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
                                    Noches
                                  </label>
                                </div>
                              </div>
                              <p className="text-xs text-indigo-700 text-right">
                                ${ciudad.alojamiento.habitaciones * ciudad.alojamiento.noches * 30}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Resumen */}
          {ciudadesSeleccionadas.length >= 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Distancia:</span>
                  <span className="font-semibold">{calculando ? '...' : `${distanciaTotal} km`}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Días:</span>
                  <span className="font-semibold">{calcularDiasTotales()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Personas:</span>
                  <span className="font-semibold">{cantidadPersonas}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-800">🚕 Transporte</span>
                  <span className="font-bold text-blue-900">
                    ${calculando ? '...' : precioTransporte * calcularDiasTotales()}
                  </span>
                </div>

                {calcularPrecioAlojamiento() > 0 && (
                  <div className="flex justify-between p-3 bg-indigo-50 rounded-lg">
                    <span className="text-sm text-indigo-800">🏨 Alojamiento</span>
                    <span className="font-bold text-indigo-900">${calcularPrecioAlojamiento()}</span>
                  </div>
                )}

                <div className="flex justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl">
                  <span className="font-semibold">💰 Total</span>
                  <span className="text-xl font-bold">
                    ${calculando ? '...' : calcularPrecioTotal()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                disabled={calculando}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calculando ? 'Calculando...' : 'Solicitar circuito'}
              </button>

              <p className="text-xs text-center text-slate-500">
                ℹ️ Taxi disponible 24 horas durante todo el circuito
              </p>
            </div>
          )}

          {ciudadesSeleccionadas.length < 2 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-4xl mb-2">📍</p>
              <p>Selecciona al menos 2 ciudades para comenzar</p>
            </div>
          )}
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
                  <p className="text-blue-100 text-sm">Completa tus datos</p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Comentarios</label>
                <textarea
                  name="comentarios"
                  rows={3}
                  placeholder="Preferencias especiales..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💰 Total: <span className="text-lg font-bold">${calcularPrecioTotal()}</span>
                </p>
                <p className="text-xs text-blue-700">
                  {calcularDiasTotales()} días • {ciudadesSeleccionadas.reduce((t, c) => t + (c.alojamiento?.noches || 0), 0)} noches
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>📱</span>
                Enviar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
