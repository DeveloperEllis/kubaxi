/**
 * Componente para gestionar precios personalizados de transfers
 * Permite ver, crear, editar y eliminar precios custom
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getPreciosCustom,
  upsertPrecioCustom,
  eliminarPrecioCustom,
  compararPrecios,
  buscarPreciosCustom,
  getEstadisticasPreciosCustom,
} from '@/lib/preciosCustomService';
import { getUbicaciones } from '@/lib/services';
import type { PrecioTransferConNombres, Ubicacion } from '@/types';

export default function GestionPreciosCustom() {
  const [preciosCustom, setPreciosCustom] = useState<PrecioTransferConNombres[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    conAjustePositivo: 0,
    conAjusteNegativo: 0,
    diferenciaPromedio: 0,
  });

  // Estado para formulario de crear/editar
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    id_origen: 0,
    id_destino: 0,
    distancia_km: 0,
    tiempo_min: 0,
    precio_base: 0,
    notas: '',
    ajustado_por: '',
  });

  // Estado para comparación de precio
  const [comparacion, setComparacion] = useState<{
    automatico: number | null;
    diferencia: number | null;
  }>({ automatico: null, diferencia: null });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [preciosData, ubicacionesData, stats] = await Promise.all([
        getPreciosCustom(),
        getUbicaciones(),
        getEstadisticasPreciosCustom(),
      ]);

      setPreciosCustom(preciosData);
      setUbicaciones(ubicacionesData);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = async () => {
    if (!searchText.trim()) {
      cargarDatos();
      return;
    }

    setLoading(true);
    try {
      const resultados = await buscarPreciosCustom(searchText);
      setPreciosCustom(resultados);
    } catch (error) {
      console.error('Error al buscar:', error);
      alert('Error al buscar. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompararPrecios = async () => {
    if (!formData.id_origen || !formData.id_destino) {
      return;
    }

    try {
      const resultado = await compararPrecios(formData.id_origen, formData.id_destino);

      if (resultado.automatico) {
        setComparacion({
          automatico: resultado.automatico.precio,
          diferencia: formData.precio_base
            ? formData.precio_base - resultado.automatico.precio
            : null,
        });

        // Autocompletar distancia y tiempo si no están definidos
        if (!formData.distancia_km || !formData.tiempo_min) {
          setFormData((prev) => ({
            ...prev,
            distancia_km: resultado.automatico!.distancia_km,
            tiempo_min: resultado.automatico!.tiempo_min,
          }));
        }
      }
    } catch (error) {
      console.error('Error al comparar precios:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.id_origen ||
      !formData.id_destino ||
      !formData.precio_base ||
      !formData.distancia_km ||
      !formData.tiempo_min
    ) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (formData.id_origen === formData.id_destino) {
      alert('El origen y destino deben ser diferentes.');
      return;
    }

    try {
      await upsertPrecioCustom({
        p_id_origen: formData.id_origen,
        p_id_destino: formData.id_destino,
        p_distancia_km: formData.distancia_km,
        p_tiempo_min: formData.tiempo_min,
        p_precio_base: formData.precio_base,
        p_notas: formData.notas || undefined,
        p_ajustado_por: formData.ajustado_por || undefined,
      });

      alert('✅ Precio personalizado guardado correctamente');
      setMostrarFormulario(false);
      resetFormulario();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      // Verificar si es error de autenticación
      if (errorMsg.includes('row-level security') || errorMsg.includes('RLS') || errorMsg.includes('policy')) {
        alert(`❌ Error de permisos: No tienes autorización para modificar precios.\n\n` +
              `Posibles causas:\n` +
              `• No has iniciado sesión correctamente\n` +
              `• Tu sesión expiró\n` +
              `• Las políticas RLS no están configuradas\n\n` +
              `Solución: Cierra sesión y vuelve a iniciar sesión.`);
      } else {
        alert(`❌ Error al guardar el precio personalizado:\n\n${errorMsg}\n\n` +
              `Por favor, verifica:\n` +
              `• Que estás autenticado (deberías ver tu email arriba)\n` +
              `• Que la función upsert_precio_custom existe en Supabase\n` +
              `• Que has ejecutado el script SQL completo\n` +
              `• Los logs en la consola del navegador`);
      }
    }
  };

  const handleEliminar = async (idOrigen: number, idDestino: number) => {
    if (!confirm('¿Estás seguro de eliminar este precio personalizado? Se volverá al cálculo automático.')) {
      return;
    }

    try {
      await eliminarPrecioCustom(idOrigen, idDestino);
      alert('✅ Precio personalizado eliminado. Se usará el cálculo automático.');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('❌ Error al eliminar el precio personalizado');
    }
  };

  const resetFormulario = () => {
    setFormData({
      id_origen: 0,
      id_destino: 0,
      distancia_km: 0,
      tiempo_min: 0,
      precio_base: 0,
      notas: '',
      ajustado_por: '',
    });
    setComparacion({ automatico: null, diferencia: null });
  };

  const handleEditar = (precio: PrecioTransferConNombres) => {
    setFormData({
      id_origen: precio.id_origen,
      id_destino: precio.id_destino,
      distancia_km: precio.distancia_km,
      tiempo_min: precio.tiempo_min,
      precio_base: precio.precio_custom,
      notas: precio.notas || '',
      ajustado_por: precio.ajustado_por || '',
    });
    setComparacion({
      automatico: precio.precio_automatico,
      diferencia: precio.diferencia_precio,
    });
    setMostrarFormulario(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-7xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        Gestión de Precios Personalizados
      </h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-100 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-blue-800">{estadisticas.total}</div>
          <div className="text-xs sm:text-sm text-blue-600">Total precios</div>
        </div>
        <div className="bg-green-100 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-green-800">
            {estadisticas.conAjustePositivo}
          </div>
          <div className="text-xs sm:text-sm text-green-600">Ajuste +</div>
        </div>
        <div className="bg-red-100 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-red-800">
            {estadisticas.conAjusteNegativo}
          </div>
          <div className="text-xs sm:text-sm text-red-600">Ajuste -</div>
        </div>
        <div className="bg-purple-100 p-3 sm:p-4 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-purple-800">
            ${estadisticas.diferenciaPromedio.toFixed(2)}
          </div>
          <div className="text-xs sm:text-sm text-purple-600">Diferencia prom.</div>
        </div>
      </div>

      {/* Búsqueda y Acciones */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Buscar ubicación..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={handleBuscar}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Buscar
          </button>
          <button
            onClick={() => {
              resetFormulario();
              setMostrarFormulario(!mostrarFormulario);
            }}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base whitespace-nowrap"
          >
            {mostrarFormulario ? 'Cancelar' : '+ Nuevo'}
          </button>
        </div>
      </div>

      {/* Formulario de Crear/Editar */}
      {mostrarFormulario && (
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 border-2 border-gray-300">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            {formData.id_origen && formData.id_destino ? 'Editar' : 'Crear'} Precio
            Personalizado
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Origen *</label>
                <select
                  value={formData.id_origen}
                  onChange={(e) =>
                    setFormData({ ...formData, id_origen: parseInt(e.target.value) })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  required
                >
                  <option value="0">Selecciona origen</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.provincia})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Destino *</label>
                <select
                  value={formData.id_destino}
                  onChange={(e) =>
                    setFormData({ ...formData, id_destino: parseInt(e.target.value) })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  required
                >
                  <option value="0">Selecciona destino</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.provincia})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Distancia (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.distancia_km || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, distancia_km: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tiempo (min) *</label>
                <input
                  type="number"
                  step="1"
                  value={formData.tiempo_min || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, tiempo_min: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Precio Base Personalizado ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_base || ''}
                  onChange={(e) => {
                    const newPrecio = parseFloat(e.target.value);
                    setFormData({ ...formData, precio_base: newPrecio });

                    // Actualizar diferencia si hay precio automático
                    if (comparacion.automatico !== null) {
                      setComparacion({
                        ...comparacion,
                        diferencia: newPrecio - comparacion.automatico,
                      });
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ajustado por</label>
                <input
                  type="text"
                  value={formData.ajustado_por}
                  onChange={(e) =>
                    setFormData({ ...formData, ajustado_por: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                  placeholder="Nombre del admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notas (por qué se ajustó)
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
                rows={3}
                placeholder="Ejemplo: Ruta con peaje adicional, condiciones especiales..."
              />
            </div>

            {/* Comparación con precio automático */}
            {formData.id_origen && formData.id_destino && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm sm:text-base">Comparación con precio automático</h3>
                  <button
                    type="button"
                    onClick={handleCompararPrecios}
                    className="w-full sm:w-auto px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Calcular
                  </button>
                </div>

                {comparacion.automatico !== null && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Precio automático:</span>
                      <span className="font-bold">${comparacion.automatico.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio personalizado:</span>
                      <span className="font-bold">${formData.precio_base.toFixed(2)}</span>
                    </div>
                    {comparacion.diferencia !== null && (
                      <div
                        className={`flex justify-between font-bold ${
                          comparacion.diferencia > 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        <span>Diferencia:</span>
                        <span>
                          {comparacion.diferencia > 0 ? '+' : ''}$
                          {comparacion.diferencia.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
              >
                Guardar Precio
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  resetFormulario();
                }}
                className="w-full sm:w-auto px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm sm:text-base"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vista móvil: Cards */}
      <div className="sm:hidden space-y-3 mb-4">
        {preciosCustom.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500 text-sm">
            No hay precios personalizados.
          </div>
        ) : (
          preciosCustom.map((precio) => (
            <div
              key={`card-${precio.id_origen}-${precio.id_destino}`}
              className="bg-white rounded-lg shadow p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {precio.origen_nombre} → {precio.destino_nombre}
                  </div>
                  <div className="text-xs text-gray-500">
                    {precio.origen_provincia} - {precio.destino_provincia}
                  </div>
                </div>
                <div className="flex space-x-3 ml-2">
                  <button
                    onClick={() => handleEditar(precio)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(precio.id_origen, precio.id_destino)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Distancia</span>
                  <div className="font-medium text-gray-900">{precio.distancia_km.toFixed(1)} km</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Tiempo</span>
                  <div className="font-medium text-gray-900">{Math.round(precio.tiempo_min)} min</div>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <span className="text-blue-600">Precio Custom</span>
                  <div className="font-bold text-blue-900">${precio.precio_custom.toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Precio Auto</span>
                  <div className="font-medium text-gray-900">${precio.precio_automatico.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500">Diferencia</span>
                <span
                  className={`text-sm font-bold ${
                    precio.diferencia_precio > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {precio.diferencia_precio > 0 ? '+' : ''}${precio.diferencia_precio.toFixed(2)}
                </span>
              </div>

              {precio.notas && (
                <div className="text-xs text-gray-400 italic">{precio.notas}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vista desktop: Tabla */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Distancia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Precio Custom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  Precio Auto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  Diferencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {preciosCustom.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No hay precios personalizados. Crea uno nuevo para ajustar el precio de una ruta específica.
                  </td>
                </tr>
              ) : (
                preciosCustom.map((precio) => (
                  <tr key={`${precio.id_origen}-${precio.id_destino}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {precio.origen_nombre} → {precio.destino_nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {precio.origen_provincia} - {precio.destino_provincia}
                      </div>
                      {precio.notas && (
                        <div className="text-xs text-gray-400 mt-1">{precio.notas}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {precio.distancia_km.toFixed(1)} km
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {Math.round(precio.tiempo_min)} min
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        ${precio.precio_custom.toFixed(2)}
                      </div>
                      {/* Mostrar precio auto y diferencia en pantallas medianas */}
                      <div className="lg:hidden">
                        <div className="text-xs text-gray-600">
                          Auto: ${precio.precio_automatico.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs font-semibold ${
                            precio.diferencia_precio > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {precio.diferencia_precio > 0 ? '+' : ''}$
                          {precio.diferencia_precio.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      ${precio.precio_automatico.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-semibold hidden lg:table-cell ${
                        precio.diferencia_precio > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {precio.diferencia_precio > 0 ? '+' : ''}$
                      {precio.diferencia_precio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditar(precio)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(precio.id_origen, precio.id_destino)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">ℹ️ Información</h3>
        <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
          <li>• Los precios personalizados tienen prioridad sobre el cálculo automático</li>
          <li>• Al eliminar un precio custom, se volverá a usar la fórmula automática</li>
          <li>• La diferencia positiva (verde) indica que el precio custom es mayor que el automático</li>
          <li>• La diferencia negativa (roja) indica que el precio custom es menor que el automático</li>
          <li>• Los cambios se aplican inmediatamente en la aplicación</li>
        </ul>
      </div>
    </div>
  );
}
