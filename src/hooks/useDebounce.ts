import { useState, useEffect } from 'react';

/**
 * Hook para debouncing - retrasa la actualización de un valor
 * hasta que el usuario deje de escribir/cambiar por X ms
 * 
 * @param value - Valor a aplicar debounce
 * @param delay - Tiempo en ms (default 300ms)
 * @returns Valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecer timeout para actualizar el valor
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
