'use client'

import { useState, useEffect, FormEvent, useCallback, memo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { fetchUbicacionesExcursiones, fetchExcursiones } from '@/lib/services'
import { abrirWhatsApp } from '@/lib/whatsapp'
import { getTranslatedField } from '@/lib/i18n-helpers'
import type { Excursion } from '@/types'

export default function ExcursionesSection() {
  const t = useTranslations('excursions')
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

  // ✅ useCallback: Evita recrear funciones en cada render
  const cargarUbicaciones = useCallback(async () => {
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
  }, []);

  const cargarExcursiones = useCallback(async (ubicacion: string) => {
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
  }, []);

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
            {t('title')}
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* Dropdown de ubicaciones */}
          <div className="max-w-md mx-auto">
            <label htmlFor="ubicacion" className="block text-left text-sm font-semibold text-slate-700 mb-3">
              {t('selectLocation')}
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
              {t('noExcursions')} {ubicacionSeleccionada}
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

// ✅ memo: Componente para cada tarjeta de excursión - solo re-renderiza si cambia el ID
const ExcursionCard = memo(({ excursion }: { excursion: Excursion }) => {
  const t = useTranslations('excursions')
  const [showDetails, setShowDetails] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [numPersonas, setNumPersonas] = useState(excursion.min_pax || 1)
  const locale = useLocale() as 'es' | 'en' | 'fr'
  
  // Get translated fields
  const titulo = getTranslatedField(excursion, 'titulo', locale)
  const descripcion = getTranslatedField(excursion, 'descripcion', locale)
  
  // Calculate dynamic price based on number of people
  const calculatePrice = (personas: number): number => {
    const minPax = excursion.min_pax || 1
    const precioPorPax = excursion.precio_por_pax || 0
    const umbralNivel2 = excursion.umbral_nivel2
    const precioPorPaxNivel2 = excursion.precio_por_pax_nivel2
    
    // If no precio_por_pax is set, return base price
    if (!precioPorPax) {
      return excursion.precio
    }
    
    // Base price covers min_pax
    if (personas <= minPax) {
      return excursion.precio
    }
    
    const personasExtra = personas - minPax
    
    // Si no hay segundo nivel de precio, usar precio normal
    if (!umbralNivel2 || !precioPorPaxNivel2) {
      return excursion.precio + (personasExtra * precioPorPax)
    }
    
    // Si no alcanza el umbral del nivel 2, usar precio normal
    if (personas <= umbralNivel2) {
      return excursion.precio + (personasExtra * precioPorPax)
    }
    
    // Calcular con dos niveles de precio
    // Primero: desde min_pax hasta umbral_nivel2 con precio_por_pax
    const personasNivel1 = umbralNivel2 - minPax
    const precioNivel1 = personasNivel1 * precioPorPax
    
    // Segundo: desde umbral_nivel2 hasta personas con precio_por_pax_nivel2
    const personasNivel2 = personas - umbralNivel2
    const precioNivel2 = personasNivel2 * precioPorPaxNivel2
    
    return excursion.precio + precioNivel1 + precioNivel2
  }
  
  const precioCalculado = calculatePrice(numPersonas)

  const handleBooking = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    abrirWhatsApp({
      tipo: 'excursion',
      datos: {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        excursion: titulo,
        fecha: formData.get('fecha'),
        personas: formData.get('personas'),
        precio: precioCalculado,
        comentarios: formData.get('comentarios') || 'Sin comentarios'
      }
    })
    
    setShowBookingModal(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-200">
      {/* Imagen */}
      <div className="relative h-52 bg-gradient-to-br from-blue-500 to-indigo-600">
        {excursion.imagen_url ? (
          <Image
            src={excursion.imagen_url}
            alt={titulo}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">
            🏖️
          </div>
        )}
     
      </div>

      {/* Contenido */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-3">
          {titulo}
        </h3>

        {descripcion && (
          <div className={`overflow-hidden transition-all duration-500 ease-in-out mb-4 ${showDetails ? 'max-h-[1000px]' : 'max-h-[72px]'}`}>
            <p className={`text-slate-600 text-sm leading-relaxed whitespace-pre-line transition-all duration-300 ${!showDetails ? 'line-clamp-3' : ''}`}>
              {descripcion}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            {showDetails ? t('lessInfo') : t('moreInfo')}
          </button>
          
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            
            {t('reserve')}
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
                  <h3 className="text-2xl font-bold mb-1">{titulo}</h3>
                  <p className="text-blue-100 text-sm">{t('completeData')}</p>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('fullName')}</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder={t('namePlaceholder')}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('email')}</label>
                <input
                  type="email"
                  name="email"
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('phone')}</label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder={t('phonePlaceholder')}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 pointer-events-none z-10" style={{ fontSize: '16px' }} id="excursion-fecha-placeholder">
                    {t('dateLabel')}
                  </span>
                  <input
                    type="date"
                    name="fecha"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 [color-scheme:light] relative z-20"
                    style={{ colorScheme: 'light', fontSize: '16px', background: 'transparent' }}
                    onFocus={(e) => {
                      e.currentTarget.showPicker?.();
                      const placeholder = document.getElementById('excursion-fecha-placeholder');
                      if (placeholder) placeholder.style.opacity = '0';
                    }}
                    onChange={(e) => {
                      const placeholder = document.getElementById('excursion-fecha-placeholder');
                      if (placeholder && e.currentTarget.value) {
                        placeholder.style.display = 'none';
                      }
                    }}
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type="number"
                    name="personas"
                    min="1"
                    max={excursion.max_pax || 99}
                    value={numPersonas || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      setNumPersonas(value || 0)
                    }}
                    placeholder=" "
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 peer"
                    style={{ fontSize: '16px' }}
                    required
                  />
                  <label className="absolute left-4 top-3 text-slate-500 transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 pointer-events-none">
                    👥 {t('peopleCount')}
                  </label>
                </div>
              </div>

              {excursion.max_pax && numPersonas > excursion.max_pax && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-800">
                    ⚠️ Máximo {excursion.max_pax} personas por vehículo
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('comments')}</label>
                <textarea
                  name="comentarios"
                  rows={3}
                  placeholder={t('commentsPlaceholder')}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                {excursion.precio_por_pax ? (
                  <div className="space-y-2">
                    <p className="text-xs text-blue-700">
                      Precio base ({excursion.min_pax || 1} pax): ${excursion.precio}
                    </p>
                    {numPersonas > (excursion.min_pax || 1) && (
                      <>
                        {excursion.umbral_nivel2 && excursion.precio_por_pax_nivel2 && numPersonas > excursion.umbral_nivel2 ? (
                          <>
                            <p className="text-xs text-blue-700">
                              + {excursion.umbral_nivel2 - (excursion.min_pax || 1)} personas × ${excursion.precio_por_pax}
                            </p>
                            <p className="text-xs text-blue-700">
                              + {numPersonas - excursion.umbral_nivel2} personas × ${excursion.precio_por_pax_nivel2}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-blue-700">
                            + {numPersonas - (excursion.min_pax || 1)} personas extra × ${excursion.precio_por_pax}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-blue-800 font-medium pt-2 border-t border-blue-200">
                      💰 {t('price')} <span className="text-lg font-bold">${precioCalculado}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-blue-800 font-medium">
                    💰 {t('price')} <span className="text-lg font-bold">${excursion.precio}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('sendWhatsApp')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Solo re-renderiza si el ID de la excursión cambia
  return prevProps.excursion.id === nextProps.excursion.id;
});

ExcursionCard.displayName = 'ExcursionCard';
