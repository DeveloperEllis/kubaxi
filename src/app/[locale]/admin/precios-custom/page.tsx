/**
 * Página de administración para gestionar precios personalizados
 * Protegida por autenticación - Solo usuarios autenticados pueden acceder
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminLogin from '@/components/AdminLogin';
import GestionPreciosCustom from '@/components/GestionPreciosCustom';

export default function PreciosCustomPage() {
  const { user, loading, signOut } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar pantalla de login
  if (!user) {
    return <AdminLogin />;
  }

  // Usuario autenticado - mostrar panel de administración
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con info del usuario */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Panel de Administración</h1>
              <p className="text-xs sm:text-sm text-gray-600">Gestión de Precios de Transfers</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="text-left sm:text-right flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500">Usuario autenticado</p>
              </div>
              <button
                onClick={signOut}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Componente principal */}
      <main>
        <GestionPreciosCustom />
      </main>
    </div>
  );
}
