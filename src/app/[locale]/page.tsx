'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { abrirWhatsApp } from '@/lib/whatsapp';
import { CONTACT_INFO, SOCIAL_MEDIA, COMPANY_INFO, APP_NAME } from '@/lib/constants';

// ✅ Lazy loading de componentes pesados
const TripRequestForm = dynamic(() => import('@/components/TripRequestForm'), {
  loading: () => <div className="animate-pulse h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl"></div>,
  ssr: true
});

const ExcursionesSection = dynamic(() => import('@/components/ExcursionesSection'), {
  loading: () => <div className="animate-pulse h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl"></div>,
  ssr: false // No renderizar en servidor (se carga al scrollear)
});

const CircuitoPersonalizadoSection = dynamic(() => import('@/components/CircuitoPersonalizadoSection'), {
  loading: () => <div className="animate-pulse h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl"></div>,
  ssr: false
});

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const [reservaMode, setReservaMode] = useState<'transfer' | 'circuito'>('transfer');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Detectar scroll para mostrar navbar
  useEffect(() => {
    const handleScroll = () => {
      setShowNavbar(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navbar Flotante - Aparece con Scroll */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-lg transition-transform duration-300 ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-3">
              <img
                src="/icono_apk.png"
                alt={`${APP_NAME} Logo`}
                className="w-10 h-10 drop-shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-xl md:text-2xl font-bold text-blue-600">{APP_NAME}</span>
            </div>

            {/* Language Switcher y Botón Hamburguesa */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Menú"
              >
                <svg
                  className="w-6 h-6 text-slate-700"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Menú Desplegable */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              mobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-2 py-2">
              <button
                onClick={() => scrollToSection('reservas')}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'reservas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🚕 {t('hero.taxiService')}
              </button>
              <button
                onClick={() => scrollToSection('excursiones')}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'excursiones'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🏝️ {t('hero.excursions')}
              </button>
              <button
                onClick={() => {
                  setReservaMode('circuito')
                  scrollToSection('reservas')
                }}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'reservas' && reservaMode === 'circuito'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🗺️ {t('hero.customCircuit', { defaultValue: 'Circuito Personalizado' })}
              </button>
              <button
                onClick={() => scrollToSection('personalizado')}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'personalizado'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✨ Otros Servicios
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Navigation */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white pb-20 md:pb-32">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        
        {/* Iconos decorativos flotantes */}
        <div className="absolute top-20 left-10 opacity-20 hidden lg:block">
          <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
          </svg>
        </div>
        <div className="absolute bottom-32 right-16 opacity-20 hidden lg:block">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="absolute top-1/3 right-24 opacity-10 hidden lg:block">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="max-w-6xl mx-auto text-center space-y-10">
            {/* Logo y Nombre Horizontal */}
            <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in">
              <img
                src="/logo_icono.png"
                alt={`${APP_NAME} Logo`}
                className="w-20 h-20 md:w-28 md:h-28 drop-shadow-2xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight drop-shadow-lg">
                {APP_NAME}
              </h1>
            </div>

            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 max-w-3xl mx-auto font-light leading-relaxed px-4">
              {t('hero.subtitle')}
            </p>

            {/* Características destacadas - Solo en escritorio */}
            <div className="hidden md:flex flex-wrap justify-center gap-6 md:gap-8 py-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-medium">{t('hero.feature1')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-medium">{t('hero.feature2')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-medium">{t('hero.feature3')}</span>
              </div>
            </div>

            {/* Navigation - Optimizado para móvil y escritorio */}
            <nav className="pt-4">
              <div className="grid grid-cols-2 md:flex md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
                <button
                  onClick={() => {
                    setReservaMode('transfer')
                    scrollToSection('reservas')
                  }}
                  className={`px-5 md:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'reservas' && reservaMode === 'transfer'
                      ? 'bg-white text-blue-600 shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">🚕</span>
                    <span className="text-sm md:text-base whitespace-nowrap">{t('hero.taxiService')}</span>
                  </span>
                </button>
                <button
                  onClick={() => scrollToSection('excursiones')}
                  className={`px-5 md:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'excursiones'
                      ? 'bg-white text-blue-600 shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">🏝️</span>
                    <span className="text-sm md:text-base">{t('hero.excursions')}</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setReservaMode('circuito')
                    scrollToSection('reservas')
                  }}
                  className={`px-5 md:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'reservas' && reservaMode === 'circuito'
                      ? 'bg-white text-blue-600 shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">🗺️</span>
                    <span className="text-sm md:text-base">{t('hero.customCircuit', { defaultValue: 'Circuito Personalizado' })}</span>
                  </span>
                </button>
                <button
                  onClick={() => scrollToSection('personalizado')}
                  className={`px-5 md:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'personalizado'
                      ? 'bg-white text-blue-600 shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">✨</span>
                    <span className="text-sm md:text-base">Otros Servicios</span>
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Diseño ondulado moderno */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ lineHeight: 0 }}>
          <svg 
            className="relative block w-full" 
            style={{ height: '50px' }}
            viewBox="0 0 1440 60" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 L1440,60 L1440,0 L0,0 Z" 
              fill="#ffffff"
            />
            <path 
              d="M0,30 C240,10 480,10 720,30 C960,50 1200,50 1440,30 L1440,0 L0,0 Z" 
              className="fill-blue-700"
            />
          </svg>
        </div>
      </section>

      {/* Características en iconos - Solo móvil */}
      <section className="md:hidden py-8 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl">
              <svg className="w-10 h-10 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs font-semibold text-slate-700">Servicio 24/7</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl">
              <svg className="w-10 h-10 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <p className="text-xs font-semibold text-slate-700">Conductores Pro</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl">
              <svg className="w-10 h-10 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs font-semibold text-slate-700">Mejor Precio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reservas Section */}
      <section id="reservas" className="py-16 md:py-20 px-4 scroll-mt-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              {reservaMode === 'transfer' ? t('tripForm.title') : '🗺️ Circuito Personalizado'}
            </h2>
            <p className="text-slate-600 text-lg">
              {reservaMode === 'transfer' ? t('hero.subtitle') : 'Selecciona las ciudades que visitarás en orden. Taxi disponible 24 horas.'}
            </p>
          </div>

          {/* Selector de modo */}
          <div className="flex gap-3 mb-8 max-w-md mx-auto">
            <button
              onClick={() => setReservaMode('transfer')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                reservaMode === 'transfer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🚕 Transfer
            </button>
            <button
              onClick={() => setReservaMode('circuito')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                reservaMode === 'circuito'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🗺️ Circuito
            </button>
          </div>

          {reservaMode === 'transfer' ? (
            <TripRequestForm onBack={() => {}} />
          ) : (
            <CircuitoPersonalizadoSection />
          )}
        </div>
      </section>

      {/* Excursiones Section - Dinámico */}
      <ExcursionesSection />

      {/* Otros Servicios Section */}
      <section id="personalizado" className="py-16 md:py-20 px-4 bg-gradient-to-br from-slate-50 to-slate-100 scroll-mt-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              ✨ Otros Servicios
            </h2>
            <p className="text-slate-600 text-lg">
              Servicios adicionales para hacer tu experiencia en Cuba inolvidable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Alojamiento */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-200 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🏨</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Alojamiento</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Casas particulares y hoteles en las mejores ubicaciones de Cuba
                </p>
                <button
                  onClick={() => {
                    abrirWhatsApp({
                      tipo: 'otros_servicios',
                      datos: {
                        servicio: 'Alojamiento',
                        mensaje: 'Hola, estoy interesado en servicios de alojamiento en Cuba'
                      }
                    });
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  Consultar
                </button>
              </div>
            </div>

            {/* Guía Turístico */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-200 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">👨‍🏫</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Guía Turístico</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Guías locales expertos para tours personalizados por la ciudad
                </p>
                <button
                  onClick={() => {
                    abrirWhatsApp({
                      tipo: 'otros_servicios',
                      datos: {
                        servicio: 'Guía Turístico',
                        mensaje: 'Hola, estoy interesado en contratar un guía turístico'
                      }
                    });
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                  Consultar
                </button>
              </div>
            </div>

            {/* Clases de Baile */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-200 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💃</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Clases de Baile</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Aprende salsa, son cubano y más ritmos caribeños con profesionales
                </p>
                <button
                  onClick={() => {
                    abrirWhatsApp({
                      tipo: 'otros_servicios',
                      datos: {
                        servicio: 'Clases de Baile',
                        mensaje: 'Hola, estoy interesado en tomar clases de baile cubano'
                      }
                    });
                  }}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-2.5 rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
                >
                  Consultar
                </button>
              </div>
            </div>

            {/* Excursiones a Caballo */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-200 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🐴</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Excursiones a Caballo</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Recorre paisajes naturales y zonas rurales en caballo
                </p>
                <button
                  onClick={() => {
                    abrirWhatsApp({
                      tipo: 'otros_servicios',
                      datos: {
                        servicio: 'Excursiones a Caballo',
                        mensaje: 'Hola, estoy interesado en excursiones a caballo'
                      }
                    });
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-2.5 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                  Consultar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-4">
                <img
                  src={COMPANY_INFO.logoPath}
                  alt={`${APP_NAME} Logo`}
                  className="w-12 h-12 drop-shadow-lg"
                />
                <h3 className="text-2xl md:text-3xl font-bold">{APP_NAME}</h3>
              </div>
              <p className="text-slate-300 text-lg">{t('footer.description')}</p>
              
              {/* Agency Info Link */}
              <Link 
                href={`/${locale}/about`}
                className="inline-block text-blue-400 hover:text-blue-300 font-medium transition-colors text-lg underline"
              >
                {t('footer.agencyInfo')}
              </Link>
            </div>

            {/* Contact and Social Media */}
            <div className="text-center md:text-right space-y-4">
              <h4 className="text-xl font-semibold text-white mb-4">{t('footer.followUs')}</h4>
              
              {/* Location */}
              <div className="flex items-center justify-center md:justify-end gap-2 text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{CONTACT_INFO.location[locale as 'es' | 'en' | 'fr']}</span>
              </div>

              {/* Social Media Icons */}
              <div className="flex items-center justify-center md:justify-end gap-4">
                {/* Facebook */}
                <a
                  href={SOCIAL_MEDIA.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.facebook')}
                  className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-all hover:scale-110 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={SOCIAL_MEDIA.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.instagram')}
                  className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 p-3 rounded-full transition-all hover:scale-110 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href={SOCIAL_MEDIA.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.whatsapp')}
                  className="bg-green-600 hover:bg-green-700 p-3 rounded-full transition-all hover:scale-110 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-slate-700 text-center">
            <p className="text-sm text-slate-400">
              &copy; 2025 {COMPANY_INFO.name}. {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>

      
    </div>
  );
}
