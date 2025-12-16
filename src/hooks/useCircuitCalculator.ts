import { useState, useCallback } from 'react';
import { calculatePrice } from '@/lib/services';

interface CiudadCircuito {
  ciudadId: number;
  alojamiento?: {
    habitaciones: number;
    noches: number;
  };
}

interface CircuitCalculatorResult {
  precioTransporte: number;
  distanciaTotal: number;
  calculando: boolean;
  error: string | null;
  calcularRuta: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook personalizado para calcular rutas de circuitos turísticos
 * @param origenId ID de la ubicación de origen
 * @param ciudadesSeleccionadas Array de ciudades del circuito
 * @param cantidadPersonas Número de personas
 * @returns Objeto con precio, distancia, estado de cálculo y función calculadora
 */
export function useCircuitCalculator(
  origenId: number | null,
  ciudadesSeleccionadas: CiudadCircuito[],
  cantidadPersonas: number
): CircuitCalculatorResult {
  const [precioTransporte, setPrecioTransporte] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcularRuta = useCallback(async () => {
    // Validación inicial
    if (!origenId || ciudadesSeleccionadas.length < 1) {
      setPrecioTransporte(0);
      setDistanciaTotal(0);
      setError(null);
      return;
    }

    try {
      setCalculando(true);
      setError(null);
      let precioTotal = 0;
      let distanciaAcumulada = 0;

      // Calcular desde origen al primer destino
      const primerDestino = ciudadesSeleccionadas[0].ciudadId;
      let resultado = await calculatePrice(
        origenId,
        primerDestino,
        "privado",
        cantidadPersonas
      );
      
      if (!resultado || resultado.price === 0) {
        throw new Error('No se pudo calcular el precio para el primer tramo');
      }

      precioTotal += resultado.price;
      distanciaAcumulada += resultado.distance_km;

      // Calcular entre destinos consecutivos
      for (let i = 0; i < ciudadesSeleccionadas.length - 1; i++) {
        const origen = ciudadesSeleccionadas[i].ciudadId;
        const destino = ciudadesSeleccionadas[i + 1].ciudadId;

        resultado = await calculatePrice(
          origen,
          destino,
          "privado",
          cantidadPersonas
        );

        if (!resultado || resultado.price === 0) {
          throw new Error(`No se pudo calcular el precio entre ciudades ${i + 1} y ${i + 2}`);
        }

        precioTotal += resultado.price;
        distanciaAcumulada += resultado.distance_km;
      }

      // Actualizar estado con resultados
      setPrecioTransporte(Math.round(precioTotal));
      setDistanciaTotal(Math.round(distanciaAcumulada * 10) / 10); // 1 decimal
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al calcular la ruta';
      setError(mensaje);
      setPrecioTransporte(0);
      setDistanciaTotal(0);
    } finally {
      setCalculando(false);
    }
  }, [origenId, ciudadesSeleccionadas, cantidadPersonas]);

  const reset = useCallback(() => {
    setPrecioTransporte(0);
    setDistanciaTotal(0);
    setError(null);
  }, []);

  return {
    precioTransporte,
    distanciaTotal,
    calculando,
    error,
    calcularRuta,
    reset,
  };
}
