import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    expect(result.current).toBe('first');

    // Cambiar valor
    rerender({ value: 'second', delay: 500 });
    
    // El valor no debe cambiar inmediatamente
    expect(result.current).toBe('first');

    // Avanzar el tiempo
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    // Cambios rápidos
    rerender({ value: 'second', delay: 500 });
    vi.advanceTimersByTime(200);
    rerender({ value: 'third', delay: 500 });
    vi.advanceTimersByTime(200);
    rerender({ value: 'fourth', delay: 500 });

    // Solo debe quedar el último valor después del delay completo
    expect(result.current).toBe('first');

    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('fourth');
    });
  });

  it('should work with different delay values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 1000 },
      }
    );

    rerender({ value: 'changed', delay: 1000 });
    
    vi.advanceTimersByTime(500);
    expect(result.current).toBe('test');

    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('changed');
    });
  });

  it('should handle number values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 300 });
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(42);
    });
  });

  it('should handle empty strings', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'text', delay: 300 },
      }
    );

    rerender({ value: '', delay: 300 });
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe('');
    });
  });
});
