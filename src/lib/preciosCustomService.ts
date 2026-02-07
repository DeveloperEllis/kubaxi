/**
 * Servicio para gestionar precios personalizados de transfers
 * Permite consultar, crear, actualizar y eliminar precios custom
 */

import { supabase } from './supabase';
import {
  PrecioTransferCustom,
  PrecioTransferConNombres,
  UpsertPrecioCustomParams,
} from '@/types';

/**
 * Obtiene todos los precios personalizados con información enriquecida
 * @returns Array de precios custom con nombres de ubicaciones y comparación con precio automático
 */
export async function getPreciosCustom(): Promise<PrecioTransferConNombres[]> {
  const { data, error } = await supabase
    .from('precios_transfer_con_nombres')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error al obtener precios custom:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene un precio personalizado específico por origen y destino
 * @param idOrigen - ID de la ubicación de origen
 * @param idDestino - ID de la ubicación de destino
 * @returns Precio custom si existe, null si no
 */
export async function getPrecioCustom(
  idOrigen: number,
  idDestino: number
): Promise<PrecioTransferCustom | null> {
  const { data, error } = await supabase
    .from('precios_transfer_custom')
    .select('*')
    .or(
      `and(id_origen.eq.${idOrigen},id_destino.eq.${idDestino}),` +
      `and(id_origen.eq.${idDestino},id_destino.eq.${idOrigen})`
    )
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró registro, no es un error
      return null;
    }
    console.error('Error al obtener precio custom:', error);
    throw error;
  }

  return data;
}

/**
 * Crea o actualiza un precio personalizado
 * @param params - Parámetros del precio custom
 * @returns El precio custom creado/actualizado
 */
export async function upsertPrecioCustom(
  params: UpsertPrecioCustomParams
): Promise<PrecioTransferCustom> {
  const { data, error } = await supabase.rpc('upsert_precio_custom', params);

  if (error) {
    console.error('Error al crear/actualizar precio custom:', error);
    throw new Error(`Error al guardar precio custom: ${error.message}`);
  }

  if (!data || !data.success) {
    throw new Error('No se pudo crear/actualizar el precio custom');
  }

  // La función retorna JSONB, convertirlo al tipo esperado
  return {
    id_origen: data.id_origen,
    id_destino: data.id_destino,
    distancia_km: data.distancia_km,
    tiempo_min: data.tiempo_min,
    precio_base: data.precio_base,
    notas: data.notas,
    ajustado_por: data.ajustado_por,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Elimina un precio personalizado (vuelve a usar el cálculo automático)
 * @param idOrigen - ID de la ubicación de origen
 * @param idDestino - ID de la ubicación de destino
 * @returns true si se eliminó, false si no existía
 */
export async function eliminarPrecioCustom(
  idOrigen: number,
  idDestino: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('eliminar_precio_custom', {
    p_id_origen: idOrigen,
    p_id_destino: idDestino,
  });

  if (error) {
    console.error('Error al eliminar precio custom:', error);
    throw error;
  }

  return data === true;
}

/**
 * Obtiene la comparación entre precio custom (si existe) y precio automático
 * para una ruta específica
 * @param idOrigen - ID de la ubicación de origen
 * @param idDestino - ID de la ubicación de destino
 * @returns Información detallada de la comparación
 */
export async function compararPrecios(
  idOrigen: number,
  idDestino: number
): Promise<{
  custom: PrecioTransferCustom | null;
  automatico: { distancia_km: number; tiempo_min: number; precio: number } | null;
  diferencia: number | null;
}> {
  // Obtener precio custom si existe
  const precioCustom = await getPrecioCustom(idOrigen, idDestino);

  // Calcular precio automático (usando la función RPC original)
  const { data: precioAuto, error } = await supabase.rpc(
    'calculate_reservation_details',
    {
      p_id_origen: idOrigen,
      p_id_destino: idDestino,
    }
  );

  if (error) {
    console.error('Error al calcular precio automático:', error);
    return {
      custom: precioCustom,
      automatico: null,
      diferencia: null,
    };
  }

  const result = Array.isArray(precioAuto) ? precioAuto[0] : precioAuto;

  if (!result) {
    return {
      custom: precioCustom,
      automatico: null,
      diferencia: null,
    };
  }

  const automatico = {
    distancia_km: parseFloat(result.distancia_km?.toString() || '0'),
    tiempo_min: parseFloat(result.tiempo_min?.toString() || '0'),
    precio: parseFloat(result.precio?.toString() || '0'),
  };

  const diferencia = precioCustom
    ? precioCustom.precio_base - automatico.precio
    : null;

  return {
    custom: precioCustom,
    automatico,
    diferencia,
  };
}

/**
 * Busca precios custom por texto (nombre de ubicación, provincia, etc.)
 * @param searchText - Texto a buscar
 * @returns Array de precios custom que coinciden con la búsqueda
 */
export async function buscarPreciosCustom(
  searchText: string
): Promise<PrecioTransferConNombres[]> {
  const { data, error } = await supabase
    .from('precios_transfer_con_nombres')
    .select('*')
    .or(
      `origen_nombre.ilike.%${searchText}%,` +
      `destino_nombre.ilike.%${searchText}%,` +
      `origen_provincia.ilike.%${searchText}%,` +
      `destino_provincia.ilike.%${searchText}%`
    )
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error al buscar precios custom:', error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene estadísticas sobre los precios personalizados
 * @returns Estadísticas útiles
 */
export async function getEstadisticasPreciosCustom(): Promise<{
  total: number;
  conAjustePositivo: number;
  conAjusteNegativo: number;
  diferenciaPromedio: number;
}> {
  const precios = await getPreciosCustom();

  const total = precios.length;
  const conAjustePositivo = precios.filter((p) => p.diferencia_precio > 0).length;
  const conAjusteNegativo = precios.filter((p) => p.diferencia_precio < 0).length;
  const diferenciaPromedio =
    total > 0
      ? precios.reduce((sum, p) => sum + p.diferencia_precio, 0) / total
      : 0;

  return {
    total,
    conAjustePositivo,
    conAjusteNegativo,
    diferenciaPromedio: Math.round(diferenciaPromedio * 100) / 100,
  };
}
