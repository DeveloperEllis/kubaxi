'use client'

import { useState, useEffect, FormEvent } from 'react'
import { fetchPaquetesViaje } from '@/lib/services'
import { abrirWhatsApp } from '@/lib/whatsapp'
import type { PaqueteViaje } from '@/types'

export default function PaquetesSection() {
  const [paquetes, setPaquetes] = useState<PaqueteViaje[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarPaquetes()
  }, [])

  const cargarPaquetes = async () => {
    try {
      setLoading(true)
      const data = await fetchPaquetesViaje()
      setPaquetes(data)
    } catch (error) {
      setPaquetes([])
    } finally {
      setLoading(false)
    }
  }

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'Occidente':
        return 'from-blue-50 to-indigo-50 border-blue-200'
      case 'Centro':
        return 'from-indigo-50 to-blue-50 border-indigo-200'
      case 'Oriente':
        return 'from-blue-50 to-cyan-50 border-blue-200'
      case 'Toda Cuba':
        return 'from-indigo-50 to-blue-100 border-indigo-200'
      default:
        return 'from-slate-50 to-slate-100 border-slate-200'
    }
  }

  const getRegionButtonColor = (region: string) => {
    return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
  }



  if (loading) {
    return (
      <section id="paquetes" className="py-16 px-4 scroll-mt-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="paquetes" className="py-16 md:py-20 px-4 bg-gradient-to-br from-slate-50 to-slate-100 scroll-mt-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Paquetes de Viaje
          </h2>
          <p className="text-slate-600 text-lg">
            Tours completos con todo incluido para tu comodidad
          </p>
        </div>

        {paquetes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay paquetes disponibles en este momento
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {paquetes.map((paquete) => (
              <PaqueteCard
                key={paquete.id}
                paquete={paquete}
                colorClass={getRegionColor(paquete.region)}
                buttonColor={getRegionButtonColor(paquete.region)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface PaqueteCardProps {
  paquete: PaqueteViaje
  colorClass: string
  buttonColor: string
}

function PaqueteCard({ paquete, colorClass, buttonColor }: PaqueteCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  // Parsear los items incluidos (separados por saltos de línea)
  const itemsIncluidos = paquete.incluye_es?.split('\n').filter(item => item.trim()) || []

  const handleBooking = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    abrirWhatsApp({
      tipo: 'paquete',
      datos: {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        paquete: paquete.nombre_es,
        fecha: formData.get('fecha'),
        personas: formData.get('personas'),
        comentarios: formData.get('comentarios') || 'Sin comentarios'
      }
    })
    
    setShowBookingModal(false)
  }

  return (
    <>
      <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 md:p-8 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-2xl font-bold text-slate-800">
              {paquete.nombre_es}
            </h3>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ${paquete.precio}
            </span>
          </div>
          <p className="text-slate-600 text-sm font-medium">
            {paquete.duracion_dias} días / {paquete.duracion_noches} noches
          </p>
        </div>

        {/* Descripción */}
        {paquete.descripcion_es && (
          <p className="text-slate-700 text-sm mb-4 leading-relaxed">
            {paquete.descripcion_es}
          </p>
        )}

        {/* Destinos */}
        {paquete.destinos_es && (
          <div className="mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white">
            <h4 className="font-semibold text-slate-800 text-sm mb-2">Destinos:</h4>
            <p className="text-slate-700 text-sm leading-relaxed">
              {paquete.destinos_es}
            </p>
          </div>
        )}

        {/* Lista de incluidos */}
        {itemsIncluidos.length > 0 && (
          <ul className="space-y-2.5 mb-6">
            {itemsIncluidos.slice(0, showDetails ? itemsIncluidos.length : 4).map((item, index) => (
              <li key={index} className="flex items-start text-slate-700">
                <span className="mr-3 mt-0.5">✅</span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          {itemsIncluidos.length > 4 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-white/80 transition-all text-sm font-medium shadow-sm"
            >
              {showDetails ? 'Menos info' : 'Ver todo'}
            </button>
          )}
          
          <button
            onClick={() => setShowBookingModal(true)}
            className={`${itemsIncluidos.length > 4 ? 'flex-1' : 'w-full'} ${buttonColor} text-white py-3 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 flex items-center justify-center gap-2`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Reservar Ahora
          </button>
        </div>
      </div>

      {/* Modal de Reserva */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{paquete.nombre_es}</h3>
                  <p className="text-blue-100 text-sm">{paquete.duracion_dias} días / {paquete.duracion_noches} noches</p>
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

            <form onSubmit={handleBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="+53 5234 5678"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    name="fecha"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 [color-scheme:light]"
                    style={{ colorScheme: 'light', fontSize: '16px' }}
                    placeholder="Fecha"
                    onFocus={(e) => e.currentTarget.showPicker?.()}
                    required
                  />
                </div>

                <div>
                  <input
                    type="number"
                    name="personas"
                    min="1"
                    defaultValue="1"
                    placeholder="Cant. personas"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900"
                    style={{ fontSize: '16px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Comentarios (opcional)</label>
                <textarea
                  name="comentarios"
                  rows={3}
                  placeholder="Algún detalle especial..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-medium">
                  💰 Precio: <span className="text-lg font-bold">${paquete.precio}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">{paquete.duracion_dias} días / {paquete.duracion_noches} noches</p>
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
    </>
  )
}
