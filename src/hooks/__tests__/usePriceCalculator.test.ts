import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import * as services from '@/lib/services';

// Mock del módulo de servicios
vi.mock('@/lib/services', () => ({
  calculatePrice: vi.fn(),
}));

describe('usePriceCalculator Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePriceCalculator());

    expect(result.current.price).toBe(0);
    expect(result.current.distance).toBe(0);
    expect(result.current.estimatedTime).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should calculate price successfully', async () => {
    const mockResult = {
      price: 150.5,
      distance_km: 250.75,
      estimated_hours: 3.25,
    };

    vi.mocked(services.calculatePrice).mockResolvedValue(mockResult);

    const { result } = renderHook(() => usePriceCalculator());

    await result.current.calcular(1, 2, 'privado', 2);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.price).toBe(151); // Redondeado
    expect(result.current.distance).toBe(250.8); // 1 decimal
    expect(result.current.estimatedTime).toBe(3.3); // 1 decimal
    expect(result.current.error).toBeNull();
    expect(services.calculatePrice).toHaveBeenCalledWith(1, 2, 'privado', 2);
  });

  it('should set loading state during calculation', async () => {
    const mockResult = {
      price: 100,
      distance_km: 200,
      estimated_hours: 2,
    };

    vi.mocked(services.calculatePrice).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResult), 100))
    );

    const { result } = renderHook(() => usePriceCalculator());

    const promise = result.current.calcular(1, 2, 'colectivo', 3);

    // Durante la carga
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await promise;

    // Después de la carga
    expect(result.current.loading).toBe(false);
  });

  it('should handle validation errors', async () => {
    const { result } = renderHook(() => usePriceCalculator());

    // Origen faltante
    await result.current.calcular(0, 2, 'privado', 2);
    expect(result.current.error).toBe('Origen y destino son requeridos');

    // Destino faltante
    await result.current.calcular(1, 0, 'privado', 2);
    expect(result.current.error).toBe('Origen y destino son requeridos');

    // Mismos origen y destino
    await result.current.calcular(1, 1, 'privado', 2);
    expect(result.current.error).toBe('El origen y destino no pueden ser iguales');

    // Cantidad de personas inválida
    await result.current.calcular(1, 2, 'privado', 0);
    expect(result.current.error).toBe('Debe haber al menos 1 persona');
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    vi.mocked(services.calculatePrice).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePriceCalculator());

    await result.current.calcular(1, 2, 'privado', 2);

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });

    expect(result.current.price).toBe(0);
    expect(result.current.distance).toBe(0);
    expect(result.current.estimatedTime).toBe(0);
  });

  it('should handle zero price as error', async () => {
    const mockResult = {
      price: 0,
      distance_km: 100,
      estimated_hours: 1,
    };

    vi.mocked(services.calculatePrice).mockResolvedValue(mockResult);

    const { result } = renderHook(() => usePriceCalculator());

    await result.current.calcular(1, 2, 'privado', 2);

    await waitFor(() => {
      expect(result.current.error).toContain('No se pudo calcular el precio');
    });

    expect(result.current.price).toBe(0);
  });

  it('should reset all values', async () => {
    const mockResult = {
      price: 150,
      distance_km: 250,
      estimated_hours: 3,
    };

    vi.mocked(services.calculatePrice).mockResolvedValue(mockResult);

    const { result } = renderHook(() => usePriceCalculator());

    await result.current.calcular(1, 2, 'privado', 2);

    await waitFor(() => {
      expect(result.current.price).toBe(150);
    });

    result.current.reset();

    expect(result.current.price).toBe(0);
    expect(result.current.distance).toBe(0);
    expect(result.current.estimatedTime).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
