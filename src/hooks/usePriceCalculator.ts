import { useState, useCallback } from 'react';
import { calculatePrice } from '@/lib/services';

interface PriceCalculation {
  price: number;
  distance: number;
  estimatedTime: number;
}

interface PriceCalculatorResult extends PriceCalculation {
  loading: boolean;
  error: string | null;
  calcular: (
    origenId: number,
    destinoId: number,
    tipoViaje: 'colectivo' | 'privado',
    cantidadPersonas: number
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Hook personalizado para calcular precios de viajes individuales
 * @returns Objeto con precio, distancia, tiempo, estado de carga y función calculadora
 */
export function usePriceCalculator(): PriceCalculatorResult {
  const [price, setPrice] = useState(0);
  const [distance, setDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcular = useCallback(async (
    origenId: number,
    destinoId: number,
    tipoViaje: 'colectivo' | 'privado',
    cantidadPersonas: number
  ) => {
    // Validación de entrada
    if (!origenId || !destinoId) {
      setError('Origen y destino son requeridos');
      return;
    }

    if (origenId === destinoId) {
      setError('El origen y destino no pueden ser iguales');
      return;
    }

    if (cantidadPersonas < 1) {
      setError('Debe haber al menos 1 persona');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resultado = await calculatePrice(
        origenId,
        destinoId,
        tipoViaje,
        cantidadPersonas
      );

      if (!resultado || resultado.price === 0) {
        throw new Error('No se pudo calcular el precio. Verifica que exista una ruta entre estas ubicaciones.');
      }

      // Actualizar estado con resultados
      setPrice(Math.round(resultado.price));
      setDistance(Math.round(resultado.distance_km * 10) / 10); // 1 decimal
      setEstimatedTime(Math.round(resultado.estimated_hours * 10) / 10); // 1 decimal
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al calcular el precio';
      setError(mensaje);
      setPrice(0);
      setDistance(0);
      setEstimatedTime(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPrice(0);
    setDistance(0);
    setEstimatedTime(0);
    setError(null);
  }, []);

  return {
    price,
    distance,
    estimatedTime,
    loading,
    error,
    calcular,
    reset,
  };
}
