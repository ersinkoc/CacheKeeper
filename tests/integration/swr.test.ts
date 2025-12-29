/**
 * Integration Tests - Stale-While-Revalidate (SWR)
 *
 * Tests SWR pattern implementation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCache } from '../../src';

describe('SWR Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Stale Data Behavior', () => {
    it('should return fresh data within stale time', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 5000,
        defaultTTL: 60000,
      });

      const fetchCount = { value: 0 };
      const fetcher = async () => {
        fetchCount.value++;
        return { data: 'value', fetchedAt: Date.now() };
      };

      await cache.getOrSet('key', fetcher);
      expect(fetchCount.value).toBe(1);

      vi.advanceTimersByTime(3000);
      const result = await cache.getOrSet('key', fetcher);
      expect(result.data).toBe('value');
      expect(fetchCount.value).toBe(1);
    });

    it('should return stale data after stale time', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 5000,
        defaultTTL: 60000,
      });

      await cache.getOrSet('key', async () => ({ data: 'initial' }));

      vi.advanceTimersByTime(6000);

      const stale = cache.get('key');
      expect(stale?.data).toBe('initial');
    });
  });

  describe('TTL vs Stale Time', () => {
    it('should distinguish between stale and expired', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 5000,
        defaultTTL: 15000,
      });

      await cache.getOrSet('key', async () => 'value');

      expect(cache.get('key')).toBe('value');

      vi.advanceTimersByTime(7000);
      expect(cache.get('key')).toBe('value');

      vi.advanceTimersByTime(10000);
      expect(cache.get('key')).toBeUndefined();
    });
  });

  describe('SWR with Async Data', () => {
    it('should handle async fetchers correctly', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 1000,
        defaultTTL: 10000,
      });

      const mockAPI = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { users: ['alice', 'bob'] };
      });

      const result1 = await cache.getOrSet('users', mockAPI);
      expect(result1.users).toEqual(['alice', 'bob']);
      expect(mockAPI).toHaveBeenCalledTimes(1);

      const result2 = await cache.getOrSet('users', mockAPI);
      expect(result2.users).toEqual(['alice', 'bob']);
      expect(mockAPI).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch failures gracefully', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 1000,
        defaultTTL: 10000,
      });

      let shouldFail = false;
      const fetcher = async () => {
        if (shouldFail) {
          throw new Error('Network error');
        }
        return { data: 'success' };
      };

      const result = await cache.getOrSet('key', fetcher);
      expect(result.data).toBe('success');

      shouldFail = true;

      vi.advanceTimersByTime(2000);

      const staleResult = cache.get('key');
      expect(staleResult?.data).toBe('success');
    });
  });

  describe('SWR Events', () => {
    it('should emit appropriate events', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 1000,
        defaultTTL: 10000,
      });

      const events: string[] = [];
      cache.on('set', () => events.push('set'));
      cache.on('hit', () => events.push('hit'));
      cache.on('miss', () => events.push('miss'));

      await cache.getOrSet('key', async () => 'value');

      cache.get('key');

      vi.advanceTimersByTime(2000);
      cache.get('key');

      expect(events).toContain('set');
      expect(events).toContain('hit');
    });
  });

  describe('SWR Real-world Scenarios', () => {
    it('should handle API response caching', async () => {
      const cache = createCache({
        maxSize: 1000,
        strategy: 'swr',
        staleTime: 30000,
        defaultTTL: 300000,
      });

      const fetchUser = vi.fn().mockResolvedValue({
        id: 1,
        name: 'Alice',
        lastUpdated: Date.now(),
      });

      async function getUser(id: number) {
        return cache.getOrSet(`user:${id}`, () => fetchUser(id));
      }

      const [user1, user2, user3] = await Promise.all([getUser(1), getUser(1), getUser(1)]);

      expect(user1).toEqual(user2);
      expect(user2).toEqual(user3);
      expect(fetchUser).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(35000);

      const staleUser = cache.get('user:1');
      expect(staleUser).toBeDefined();
    });

    it('should support dashboard data refreshing', async () => {
      const cache = createCache({
        maxSize: 100,
        strategy: 'swr',
        staleTime: 10000,
        defaultTTL: 60000,
      });

      const dashboardAPI = vi.fn().mockImplementation(async () => ({
        metrics: { visitors: 1000, conversions: 50 },
        timestamp: Date.now(),
      }));

      const initial = await cache.getOrSet('dashboard:metrics', dashboardAPI);
      expect(initial.metrics.visitors).toBe(1000);

      for (let i = 0; i < 5; i++) {
        await cache.getOrSet('dashboard:metrics', dashboardAPI);
      }

      expect(dashboardAPI).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(15000);

      dashboardAPI.mockResolvedValue({
        metrics: { visitors: 1200, conversions: 60 },
        timestamp: Date.now(),
      });

      const staleData = cache.get('dashboard:metrics');
      expect(staleData?.metrics.visitors).toBe(1000);
    });
  });

  describe('SWR with Namespace', () => {
    it('should work correctly with namespaced cache', async () => {
      const cache = createCache({
        maxSize: 1000,
        strategy: 'swr',
        staleTime: 5000,
        defaultTTL: 60000,
      });

      const apiCache = cache.namespace('api');

      apiCache.set('users', ['alice', 'bob']);
      apiCache.set('products', ['laptop', 'phone']);

      expect(apiCache.get('users')).toEqual(['alice', 'bob']);
      expect(apiCache.get('products')).toEqual(['laptop', 'phone']);

      vi.advanceTimersByTime(7000);

      expect(apiCache.get('users')).toEqual(['alice', 'bob']);
      expect(apiCache.get('products')).toEqual(['laptop', 'phone']);
    });
  });
});
