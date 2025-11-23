'use client'

import { useState, useEffect } from 'react'
import { fetchPaquetesViaje } from '@/lib/services'
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

  // Parsear los items incluidos (separados por saltos de línea)
  const itemsIncluidos = paquete.incluye_es?.split('\n').filter(item => item.trim()) || []

  return (
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
          className={`${itemsIncluidos.length > 4 ? 'flex-1' : 'w-full'} ${buttonColor} text-white py-3 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 duration-300`}
        >
          Reservar Ahora
        </button>
      </div>
    </div>
  )
}
