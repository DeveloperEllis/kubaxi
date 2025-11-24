'use client';

import { useState, useEffect, FormEvent } from 'react';
import TripRequestForm from '@/components/TripRequestForm';
import ExcursionesSection from '@/components/ExcursionesSection';
import PaquetesSection from '@/components/PaquetesSection';
import { abrirWhatsApp } from '@/lib/whatsapp';

export default function Home() {
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);

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
                alt="Kubaxi Logo"
                className="w-10 h-10 drop-shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-xl md:text-2xl font-bold text-blue-600">Kubaxi</span>
            </div>

            {/* Botón Hamburguesa */}
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
                🚕 Reservar Taxi
              </button>
              <button
                onClick={() => scrollToSection('excursiones')}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'excursiones'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🏝️ Excursiones
              </button>
              <button
                onClick={() => scrollToSection('paquetes')}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'paquetes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📦 Paquetes
              </button>
              <button
                onClick={() => scrollToSection('personalizado')}
                className={`px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                  activeSection === 'personalizado'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✨ Personalizar
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
                alt="Kubaxi Logo"
                className="w-20 h-20 md:w-28 md:h-28 drop-shadow-2xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight drop-shadow-lg">
                Kubaxi
              </h1>
            </div>

            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 max-w-3xl mx-auto font-light leading-relaxed px-4">
              Tu transporte de confianza en Cuba. Viaja seguro, cómodo y al mejor precio.
            </p>

            {/* Características destacadas - Solo en escritorio */}
            <div className="hidden md:flex flex-wrap justify-center gap-6 md:gap-8 py-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-medium">Servicio 24/7</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-medium">Conductores Profesionales</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-medium">Precios Competitivos</span>
              </div>
            </div>

            {/* Navigation - Optimizado para móvil y escritorio */}
            <nav className="pt-4">
              <div className="grid grid-cols-2 md:flex md:flex-row justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
                <button
                  onClick={() => scrollToSection('reservas')}
                  className={`px-5 md:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'reservas'
                      ? 'bg-white text-blue-600 shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">🚕</span>
                    <span className="text-sm md:text-base whitespace-nowrap">Reservar Taxi</span>
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
                    <span className="text-sm md:text-base">Excursiones</span>
                  </span>
                </button>
                <button
                  onClick={() => scrollToSection('paquetes')}
                  className={`px-5 md:px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'paquetes'
                      ? 'bg-white text-blue-600 shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">📦</span>
                    <span className="text-sm md:text-base">Paquetes</span>
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
                    <span className="text-sm md:text-base">Personalizar</span>
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
              Reserva tu Taxi
            </h2>
            <p className="text-slate-600 text-lg">
              Viaja de forma rápida y segura por toda Cuba
            </p>
          </div>

          <TripRequestForm onBack={() => {}} />
        </div>
      </section>

      {/* Excursiones Section - Dinámico */}
      <ExcursionesSection />

      {/* Paquetes Section - Dinámico */}
      <PaquetesSection />

      {/* Personalizado Section */}
      <section id="personalizado" className="py-16 md:py-20 px-4 bg-gradient-to-br from-slate-50 to-slate-100 scroll-mt-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
              Personaliza tu Viaje
            </h2>
            <p className="text-slate-600 text-lg">
              Crea tu itinerario perfecto según tus preferencias
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-slate-200">
            <form className="space-y-6" onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              abrirWhatsApp({
                tipo: 'personalizado',
                datos: {
                  nombre: formData.get('nombre'),
                  email: formData.get('email'),
                  telefono: formData.get('telefono'),
                  viajeros: formData.get('viajeros'),
                  fecha: formData.get('fecha'),
                  duracion: formData.get('duracion'),
                  descripcion: formData.get('descripcion')
                }
              });
            }}>
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  className="px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono"
                  className="px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
                <input
                  type="number"
                  name="viajeros"
                  placeholder="Número de viajeros"
                  min="1"
                  className="px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="date"
                  name="fecha"
                  className="px-4 py-4 md:px-5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 [color-scheme:light]"
                  style={{ colorScheme: 'light' }}
                  required
                />
                <select
                  name="duracion"
                  className="px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="">Duración del viaje</option>
                  <option value="1-3">1-3 días</option>
                  <option value="4-7">4-7 días</option>
                  <option value="8-14">8-14 días</option>
                  <option value="15+">15+ días</option>
                </select>
              </div>

              <textarea
                name="descripcion"
                placeholder="Cuéntanos qué lugares te gustaría visitar y qué experiencias te interesan..."
                rows={5}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                required
              ></textarea>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <img
                src="/logo_icono.png"
                alt="Kubaxi Logo"
                className="w-12 h-12 drop-shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <h3 className="text-2xl md:text-3xl font-bold">Kubaxi</h3>
            </div>
            <p className="text-slate-300 text-lg">Tu transporte de confianza en Cuba</p>
            <div className="pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                &copy; 2025 Kubaxi. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
