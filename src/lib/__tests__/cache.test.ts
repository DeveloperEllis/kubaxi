import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cacheManager } from '@/lib/cache';

describe('CacheManager', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cacheManager.set('key1', 'value1', 1000);
      expect(cacheManager.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cacheManager.get('nonexistent')).toBeUndefined();
    });

    it('should handle different data types', () => {
      cacheManager.set('string', 'hello', 1000);
      cacheManager.set('number', 42, 1000);
      cacheManager.set('object', { foo: 'bar' }, 1000);
      cacheManager.set('array', [1, 2, 3], 1000);

      expect(cacheManager.get('string')).toBe('hello');
      expect(cacheManager.get('number')).toBe(42);
      expect(cacheManager.get('object')).toEqual({ foo: 'bar' });
      expect(cacheManager.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should expire values after TTL', () => {
      cacheManager.set('key1', 'value1', 1000);
      expect(cacheManager.get('key1')).toBe('value1');

      // Avanzar tiempo más allá del TTL
      vi.advanceTimersByTime(1001);

      expect(cacheManager.get('key1')).toBeUndefined();
    });

    it('should not expire values before TTL', () => {
      cacheManager.set('key1', 'value1', 1000);
      
      vi.advanceTimersByTime(500);
      expect(cacheManager.get('key1')).toBe('value1');

      vi.advanceTimersByTime(499);
      expect(cacheManager.get('key1')).toBe('value1');

      vi.advanceTimersByTime(2);
      expect(cacheManager.get('key1')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing valid keys', () => {
      cacheManager.set('key1', 'value1', 1000);
      expect(cacheManager.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cacheManager.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', () => {
      vi.useFakeTimers();
      cacheManager.set('key1', 'value1', 1000);
      vi.advanceTimersByTime(1001);
      expect(cacheManager.has('key1')).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('delete', () => {
    it('should remove existing keys', () => {
      cacheManager.set('key1', 'value1', 1000);
      expect(cacheManager.has('key1')).toBe(true);
      
      cacheManager.delete('key1');
      expect(cacheManager.has('key1')).toBe(false);
    });

    it('should not throw error when deleting non-existent keys', () => {
      expect(() => cacheManager.delete('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cacheManager.set('key1', 'value1', 1000);
      cacheManager.set('key2', 'value2', 1000);
      cacheManager.set('key3', 'value3', 1000);

      expect(cacheManager.has('key1')).toBe(true);
      expect(cacheManager.has('key2')).toBe(true);
      expect(cacheManager.has('key3')).toBe(true);

      cacheManager.clear();

      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.has('key3')).toBe(false);
    });
  });

  describe('getOrFetch', () => {
    it('should fetch and cache value on first call', async () => {
      const fetcher = vi.fn(async () => 'fetched-value');

      const result = await cacheManager.getOrFetch('key1', fetcher, 1000);

      expect(result).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(cacheManager.get('key1')).toBe('fetched-value');
    });

    it('should return cached value without fetching on subsequent calls', async () => {
      const fetcher = vi.fn(async () => 'fetched-value');

      await cacheManager.getOrFetch('key1', fetcher, 1000);
      const result2 = await cacheManager.getOrFetch('key1', fetcher, 1000);
      const result3 = await cacheManager.getOrFetch('key1', fetcher, 1000);

      expect(result2).toBe('fetched-value');
      expect(result3).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should refetch after cache expires', async () => {
      vi.useFakeTimers();
      const fetcher = vi.fn()
        .mockResolvedValueOnce('first-value')
        .mockResolvedValueOnce('second-value');

      const result1 = await cacheManager.getOrFetch('key1', fetcher, 1000);
      expect(result1).toBe('first-value');

      vi.advanceTimersByTime(1001);

      const result2 = await cacheManager.getOrFetch('key1', fetcher, 1000);
      expect(result2).toBe('second-value');
      expect(fetcher).toHaveBeenCalledTimes(2);

      vi.restoreAllMocks();
    });

    it('should handle async errors', async () => {
      const error = new Error('Fetch failed');
      const fetcher = vi.fn(async () => {
        throw error;
      });

      await expect(cacheManager.getOrFetch('key1', fetcher, 1000)).rejects.toThrow('Fetch failed');
      expect(cacheManager.has('key1')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      cacheManager.set('key1', 'value1', 1000);
      cacheManager.set('key2', 'value2', 1000);
      cacheManager.set('key3', 'value3', 1000);

      const stats = cacheManager.getStats();

      expect(stats.size).toBe(3);
      expect(stats.keys).toEqual(['key1', 'key2', 'key3']);
    });

    it('should reflect changes after deletions', () => {
      cacheManager.set('key1', 'value1', 1000);
      cacheManager.set('key2', 'value2', 1000);
      cacheManager.delete('key1');

      const stats = cacheManager.getStats();

      expect(stats.size).toBe(1);
      expect(stats.keys).toEqual(['key2']);
    });

    it('should return empty stats for empty cache', () => {
      const stats = cacheManager.getStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });
});
