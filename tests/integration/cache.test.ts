/**
 * Integration Tests - Full Cache Workflows
 *
 * Tests complete cache operations from start to finish
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCache } from '../../src';

describe('Cache Integration', () => {
  describe('Complete CRUD Workflow', () => {
    it('should handle full lifecycle of cache entries', () => {
      const cache = createCache({ maxSize: 100, defaultTTL: 60000 });

      cache.set('user:1', { id: 1, name: 'Alice', email: 'alice@test.com' });
      cache.set('user:2', { id: 2, name: 'Bob', email: 'bob@test.com' });
      cache.set('user:3', { id: 3, name: 'Charlie', email: 'charlie@test.com' });

      expect(cache.size).toBe(3);

      expect(cache.get('user:1')).toEqual({ id: 1, name: 'Alice', email: 'alice@test.com' });
      expect(cache.has('user:2')).toBe(true);

      cache.set('user:1', { id: 1, name: 'Alice Updated', email: 'alice.new@test.com' });
      expect(cache.get('user:1')).toEqual({
        id: 1,
        name: 'Alice Updated',
        email: 'alice.new@test.com',
      });

      cache.delete('user:2');
      expect(cache.has('user:2')).toBe(false);
      expect(cache.size).toBe(2);

      cache.clear();
      expect(cache.size).toBe(0);
    });

    it('should handle concurrent operations correctly', async () => {
      const cache = createCache({ maxSize: 1000 });

      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => cache.set(`key:${i}`, { value: i }))
      );

      await Promise.all(promises);

      expect(cache.size).toBe(100);

      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key:${i}`)).toEqual({ value: i });
      }
    });
  });

  describe('Eviction Under Pressure', () => {
    it('should evict items when maxSize is exceeded with LRU', () => {
      const cache = createCache({ maxSize: 5, strategy: 'lru' });

      for (let i = 0; i < 5; i++) {
        cache.set(`key:${i}`, i);
      }

      cache.get('key:0');
      cache.get('key:2');
      cache.get('key:4');

      cache.set('key:5', 5);
      cache.set('key:6', 6);

      expect(cache.has('key:0')).toBe(true);
      expect(cache.has('key:1')).toBe(false);
      expect(cache.has('key:2')).toBe(true);
      expect(cache.has('key:3')).toBe(false);
      expect(cache.has('key:4')).toBe(true);
    });

    it('should evict items when maxSize is exceeded with LFU', () => {
      const cache = createCache({ maxSize: 3, strategy: 'lfu' });

      cache.set('popular', 'data');
      cache.set('moderate', 'data');
      cache.set('rare', 'data');

      for (let i = 0; i < 10; i++) cache.get('popular');
      for (let i = 0; i < 5; i++) cache.get('moderate');
      cache.get('rare');

      cache.set('new', 'data');

      expect(cache.has('popular')).toBe(true);
      expect(cache.has('moderate')).toBe(true);
      expect(cache.has('rare')).toBe(false);
      expect(cache.has('new')).toBe(true);
    });

    it('should evict oldest items with FIFO', () => {
      const cache = createCache({ maxSize: 3, strategy: 'fifo' });

      cache.set('first', 1);
      cache.set('second', 2);
      cache.set('third', 3);

      cache.get('first');
      cache.get('first');

      cache.set('fourth', 4);

      expect(cache.has('first')).toBe(false);
      expect(cache.has('second')).toBe(true);
      expect(cache.has('third')).toBe(true);
      expect(cache.has('fourth')).toBe(true);
    });
  });

  describe('TTL Expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire items based on TTL', () => {
      const cache = createCache({ maxSize: 100, defaultTTL: 5000 });

      cache.set('item1', 'value1');
      cache.set('item2', 'value2', { ttl: 10000 });
      cache.set('item3', 'value3', { ttl: 0 });

      expect(cache.get('item1')).toBe('value1');
      expect(cache.get('item2')).toBe('value2');
      expect(cache.get('item3')).toBe('value3');

      vi.advanceTimersByTime(6000);

      expect(cache.get('item1')).toBeUndefined();
      expect(cache.get('item2')).toBe('value2');
      expect(cache.get('item3')).toBe('value3');

      vi.advanceTimersByTime(5000);

      expect(cache.get('item2')).toBeUndefined();
      expect(cache.get('item3')).toBe('value3');
    });

    it('should extend TTL with touch', () => {
      const cache = createCache({ maxSize: 100, defaultTTL: 5000 });

      cache.set('item', 'value');

      vi.advanceTimersByTime(4000);
      expect(cache.get('item')).toBe('value');

      cache.touch('item', 10000);

      vi.advanceTimersByTime(4000);
      expect(cache.get('item')).toBe('value');

      vi.advanceTimersByTime(7000);
      expect(cache.get('item')).toBeUndefined();
    });
  });

  describe('Memoization Workflow', () => {
    it('should memoize expensive computations with getOrSet', async () => {
      const cache = createCache({ maxSize: 100 });
      let computeCount = 0;

      const expensiveCompute = async (n: number) => {
        computeCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return n * n;
      };

      const result1 = await cache.getOrSet('square:5', () => expensiveCompute(5));
      expect(result1).toBe(25);
      expect(computeCount).toBe(1);

      const result2 = await cache.getOrSet('square:5', () => expensiveCompute(5));
      expect(result2).toBe(25);
      expect(computeCount).toBe(1);

      const result3 = await cache.getOrSet('square:10', () => expensiveCompute(10));
      expect(result3).toBe(100);
      expect(computeCount).toBe(2);
    });

    it('should work with memoize wrapper', async () => {
      const cache = createCache({ maxSize: 100 });
      let callCount = 0;

      const fetchUser = async (id: number) => {
        callCount++;
        return { id, name: `User ${id}` };
      };

      const memoizedFetch = cache.memoize(fetchUser, {
        keyGenerator: (id) => `user:${id}`,
      });

      await memoizedFetch(1);
      await memoizedFetch(2);
      expect(callCount).toBe(2);

      await memoizedFetch(1);
      await memoizedFetch(2);
      expect(callCount).toBe(2);

      await memoizedFetch(3);
      expect(callCount).toBe(3);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch operations efficiently', () => {
      const cache = createCache({ maxSize: 1000 });

      const entries = Array.from({ length: 50 }, (_, i) => ({
        key: `item:${i}`,
        value: { id: i, data: `data-${i}` },
        ttl: 60000,
      }));

      cache.setMany(entries);
      expect(cache.size).toBe(50);

      const keys = entries.map((e) => e.key);
      const results = cache.getMany(keys);

      expect(results.size).toBe(50);
      expect(results.get('item:0')).toEqual({ id: 0, data: 'data-0' });
      expect(results.get('item:49')).toEqual({ id: 49, data: 'data-49' });

      const keysToDelete = keys.slice(0, 25);
      cache.deleteMany(keysToDelete);

      expect(cache.size).toBe(25);
      expect(cache.has('item:0')).toBe(false);
      expect(cache.has('item:25')).toBe(true);
    });

    it('should handle batch existence checks', () => {
      const cache = createCache({ maxSize: 100 });

      cache.set('exists:1', 'value');
      cache.set('exists:2', 'value');

      const existsMap = cache.hasMany(['exists:1', 'exists:2', 'missing:1', 'missing:2']);

      expect(existsMap.get('exists:1')).toBe(true);
      expect(existsMap.get('exists:2')).toBe(true);
      expect(existsMap.get('missing:1')).toBe(false);
      expect(existsMap.get('missing:2')).toBe(false);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track cache statistics accurately', () => {
      const cache = createCache({ maxSize: 100 });

      const initialStats = cache.getStats();
      expect(initialStats.hits).toBe(0);
      expect(initialStats.misses).toBe(0);
      expect(initialStats.size).toBe(0);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.get('key1');
      cache.get('key2');
      cache.get('key1');

      cache.get('nonexistent1');
      cache.get('nonexistent2');

      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.size).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.6, 2);
    });

    it('should track eviction statistics', () => {
      const cache = createCache({ maxSize: 3, strategy: 'lru' });

      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4);
      cache.set('e', 5);

      const stats = cache.getStats();
      expect(stats.evictions).toBe(2);
    });
  });

  describe('Dump and Restore', () => {
    it('should dump and restore cache state', () => {
      const cache1 = createCache({ maxSize: 100 });

      cache1.set('user:1', { id: 1, name: 'Alice' });
      cache1.set('user:2', { id: 2, name: 'Bob' });
      cache1.set('config', { theme: 'dark' });

      const dump = cache1.dump();
      expect(dump.length).toBe(3);

      const cache2 = createCache({ maxSize: 100 });
      cache2.restore(dump);

      expect(cache2.get('user:1')).toEqual({ id: 1, name: 'Alice' });
      expect(cache2.get('user:2')).toEqual({ id: 2, name: 'Bob' });
      expect(cache2.get('config')).toEqual({ theme: 'dark' });
    });
  });
});
