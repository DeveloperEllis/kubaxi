import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCircuitCalculator } from '@/hooks/useCircuitCalculator';
import * as services from '@/lib/services';

// Mock del módulo de servicios
vi.mock('@/lib/services', () => ({
  calculatePrice: vi.fn(),
}));

describe('useCircuitCalculator Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCiudades = [
    { ciudadId: 2 },
    { ciudadId: 3 },
    { ciudadId: 4 },
  ];

  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useCircuitCalculator(null, [], 2)
    );

    expect(result.current.precioTransporte).toBe(0);
    expect(result.current.distanciaTotal).toBe(0);
    expect(result.current.calculando).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not calculate without origen', async () => {
    const { result } = renderHook(() => 
      useCircuitCalculator(null, mockCiudades, 2)
    );

    await result.current.calcularRuta();

    expect(result.current.precioTransporte).toBe(0);
    expect(result.current.distanciaTotal).toBe(0);
    expect(services.calculatePrice).not.toHaveBeenCalled();
  });

  it('should not calculate without ciudades', async () => {
    const { result } = renderHook(() => 
      useCircuitCalculator(1, [], 2)
    );

    await result.current.calcularRuta();

    expect(result.current.precioTransporte).toBe(0);
    expect(result.current.distanciaTotal).toBe(0);
    expect(services.calculatePrice).not.toHaveBeenCalled();
  });

  it('should calculate circuit price correctly', async () => {
    const mockResults = [
      { price: 100, distance_km: 150 }, // Origen -> Ciudad 1
      { price: 80, distance_km: 120 },  // Ciudad 1 -> Ciudad 2
      { price: 90, distance_km: 130 },  // Ciudad 2 -> Ciudad 3
    ];

    vi.mocked(services.calculatePrice)
      .mockResolvedValueOnce(mockResults[0] as any)
      .mockResolvedValueOnce(mockResults[1] as any)
      .mockResolvedValueOnce(mockResults[2] as any);

    const { result } = renderHook(() => 
      useCircuitCalculator(1, mockCiudades, 2)
    );

    await result.current.calcularRuta();

    await waitFor(() => {
      expect(result.current.calculando).toBe(false);
    });

    // Precio total: 100 + 80 + 90 = 270
    expect(result.current.precioTransporte).toBe(270);
    
    // Distancia total: 150 + 120 + 130 = 400
    expect(result.current.distanciaTotal).toBe(400);
    
    expect(result.current.error).toBeNull();

    // Verificar que se llamó calculatePrice correctamente
    expect(services.calculatePrice).toHaveBeenCalledTimes(3);
    expect(services.calculatePrice).toHaveBeenNthCalledWith(1, 1, 2, 'privado', 2);
    expect(services.calculatePrice).toHaveBeenNthCalledWith(2, 2, 3, 'privado', 2);
    expect(services.calculatePrice).toHaveBeenNthCalledWith(3, 3, 4, 'privado', 2);
  });

  it('should round price and distance correctly', async () => {
    const mockResults = [
      { price: 123.456, distance_km: 234.567 },
      { price: 98.765, distance_km: 123.456 },
    ];

    vi.mocked(services.calculatePrice)
      .mockResolvedValueOnce(mockResults[0] as any)
      .mockResolvedValueOnce(mockResults[1] as any);

    const { result } = renderHook(() => 
      useCircuitCalculator(1, [{ ciudadId: 2 }, { ciudadId: 3 }], 2)
    );

    await result.current.calcularRuta();

    await waitFor(() => {
      expect(result.current.calculando).toBe(false);
    });

    // Precio redondeado: Math.round(123.456 + 98.765) = 222
    expect(result.current.precioTransporte).toBe(222);
    
    // Distancia redondeada a 1 decimal: Math.round((234.567 + 123.456) * 10) / 10 = 358.0
    expect(result.current.distanciaTotal).toBe(358);
  });

  it('should set loading state during calculation', async () => {
    vi.mocked(services.calculatePrice).mockImplementation(
      () => new Promise((resolve) => 
        setTimeout(() => resolve({ price: 100, distance_km: 150 } as any), 100)
      )
    );

    const { result } = renderHook(() => 
      useCircuitCalculator(1, [{ ciudadId: 2 }], 2)
    );

    const promise = result.current.calcularRuta();

    // Durante la carga
    await waitFor(() => {
      expect(result.current.calculando).toBe(true);
    });

    await promise;

    // Después de la carga
    expect(result.current.calculando).toBe(false);
  });

  it('should handle errors in calculation', async () => {
    const mockError = new Error('Calculation failed');
    vi.mocked(services.calculatePrice).mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useCircuitCalculator(1, [{ ciudadId: 2 }], 2)
    );

    await result.current.calcularRuta();

    await waitFor(() => {
      expect(result.current.error).toBe('Calculation failed');
    });

    expect(result.current.precioTransporte).toBe(0);
    expect(result.current.distanciaTotal).toBe(0);
    expect(result.current.calculando).toBe(false);
  });

  it('should handle zero price as error', async () => {
    vi.mocked(services.calculatePrice).mockResolvedValue({
      price: 0,
      distance_km: 100,
    } as any);

    const { result } = renderHook(() => 
      useCircuitCalculator(1, [{ ciudadId: 2 }], 2)
    );

    await result.current.calcularRuta();

    await waitFor(() => {
      expect(result.current.error).toContain('No se pudo calcular el precio');
    });

    expect(result.current.precioTransporte).toBe(0);
    expect(result.current.distanciaTotal).toBe(0);
  });

  it('should handle mid-circuit calculation errors', async () => {
    vi.mocked(services.calculatePrice)
      .mockResolvedValueOnce({ price: 100, distance_km: 150 } as any)
      .mockResolvedValueOnce({ price: 0, distance_km: 0 } as any); // Error en el segundo tramo

    const { result } = renderHook(() => 
      useCircuitCalculator(1, mockCiudades, 2)
    );

    await result.current.calcularRuta();

    await waitFor(() => {
      expect(result.current.error).toContain('No se pudo calcular el precio entre ciudades 1 y 2');
    });
  });

  it('should reset all values', async () => {
    vi.mocked(services.calculatePrice).mockResolvedValue({
      price: 100,
      distance_km: 150,
    } as any);

    const { result } = renderHook(() => 
      useCircuitCalculator(1, [{ ciudadId: 2 }], 2)
    );

    await result.current.calcularRuta();

    await waitFor(() => {
      expect(result.current.precioTransporte).toBe(100);
    });

    result.current.reset();

    expect(result.current.precioTransporte).toBe(0);
    expect(result.current.distanciaTotal).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should recalculate when dependencies change', async () => {
    vi.mocked(services.calculatePrice).mockResolvedValue({
      price: 100,
      distance_km: 150,
    } as any);

    const { result, rerender } = renderHook(
      ({ origenId, ciudades, personas }) => 
        useCircuitCalculator(origenId, ciudades, personas),
      {
        initialProps: {
          origenId: 1,
          ciudades: [{ ciudadId: 2 }],
          personas: 2,
        },
      }
    );

    await result.current.calcularRuta();
    await waitFor(() => expect(result.current.precioTransporte).toBe(100));

    // Cambiar cantidad de personas
    vi.mocked(services.calculatePrice).mockResolvedValue({
      price: 200,
      distance_km: 150,
    } as any);

    rerender({
      origenId: 1,
      ciudades: [{ ciudadId: 2 }],
      personas: 4,
    });

    await result.current.calcularRuta();
    await waitFor(() => expect(result.current.precioTransporte).toBe(200));
  });
});
