import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCache } from '../../../src/core/cache'
import type { CacheInstance } from '../../../src/types'

describe('Memoization', () => {
  let cache: CacheInstance<unknown>

  beforeEach(() => {
    vi.useFakeTimers()
    // Disable automatic expiration checking to avoid infinite loops with fake timers
    cache = createCache({ checkInterval: 0 })
  })

  afterEach(() => {
    cache.destroy()
    vi.useRealTimers()
  })

  describe('getOrSet', () => {
    it('should return cached value if exists', () => {
      cache.set('key1', 'cached')
      const factory = vi.fn(() => 'new value')

      const result = cache.getOrSet('key1', factory)

      expect(result).toBe('cached')
      expect(factory).not.toHaveBeenCalled()
    })

    it('should call factory and cache result if not exists', () => {
      const factory = vi.fn(() => 'computed')

      const result = cache.getOrSet('key1', factory)

      expect(result).toBe('computed')
      expect(factory).toHaveBeenCalledTimes(1)
      expect(cache.get('key1')).toBe('computed')
    })

    it('should handle async factory', async () => {
      const factory = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 100))
        return 'async value'
      })

      const resultPromise = cache.getOrSet('key1', factory)
      expect(resultPromise).toBeInstanceOf(Promise)

      vi.advanceTimersByTime(100)
      const result = await resultPromise

      expect(result).toBe('async value')
      expect(cache.get('key1')).toBe('async value')
    })

    it('should respect TTL option', () => {
      cache.getOrSet('key1', () => 'value', { ttl: 1000 })

      expect(cache.has('key1')).toBe(true)
      vi.advanceTimersByTime(1001)
      expect(cache.has('key1')).toBe(false)
    })

    it('should respect tags option', () => {
      cache.getOrSet('key1', () => 'value', { tags: ['tag1', 'tag2'] })

      const tags = cache.getTags('key1')
      expect(tags).toContain('tag1')
      expect(tags).toContain('tag2')
    })

    it('should force refresh when forceRefresh is true', () => {
      cache.set('key1', 'old value')
      const factory = vi.fn(() => 'new value')

      const result = cache.getOrSet('key1', factory, { forceRefresh: true })

      expect(result).toBe('new value')
      expect(factory).toHaveBeenCalled()
      expect(cache.get('key1')).toBe('new value')
    })

    it('should trigger background revalidation when stale', async () => {
      cache.set('key1', 'stale value', { stale: 100, revalidate: 5000 })

      vi.advanceTimersByTime(150)
      expect(cache.isStale('key1')).toBe(true)

      const factory = vi.fn(async () => 'refreshed')
      const result = cache.getOrSet('key1', factory)

      // Should return stale value immediately
      expect(result).toBe('stale value')

      // Factory should be called for background refresh
      await vi.runAllTimersAsync()
      expect(factory).toHaveBeenCalled()
    })
  })

  describe('memoize', () => {
    it('should memoize function results', () => {
      const expensiveFn = vi.fn((a: number, b: number) => a + b)
      const memoized = cache.memoize(expensiveFn)

      expect(memoized(1, 2)).toBe(3)
      expect(memoized(1, 2)).toBe(3)
      expect(memoized(1, 2)).toBe(3)

      expect(expensiveFn).toHaveBeenCalledTimes(1)
    })

    it('should cache different arguments separately', () => {
      const fn = vi.fn((x: number) => x * 2)
      const memoized = cache.memoize(fn)

      expect(memoized(1)).toBe(2)
      expect(memoized(2)).toBe(4)
      expect(memoized(1)).toBe(2)

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should use custom key generator', () => {
      const fn = vi.fn((user: { id: number }) => `User ${user.id}`)
      const memoized = cache.memoize(fn, {
        keyGenerator: (user) => `user:${user.id}`,
      })

      expect(memoized({ id: 1 })).toBe('User 1')
      expect(memoized({ id: 1 })).toBe('User 1')

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should respect TTL option', () => {
      const fn = vi.fn(() => Math.random())
      const memoized = cache.memoize(fn, { ttl: 1000 })

      const first = memoized()
      expect(memoized()).toBe(first)

      vi.advanceTimersByTime(1001)

      const second = memoized()
      expect(second).not.toBe(first)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should memoize async functions', async () => {
      const fn = vi.fn(async (id: number) => {
        await new Promise((r) => setTimeout(r, 100))
        return { id, data: 'fetched' }
      })
      const memoized = cache.memoize(fn)

      const promise1 = memoized(1)
      vi.advanceTimersByTime(100)
      const result1 = await promise1

      const result2 = await memoized(1)

      expect(result1).toEqual({ id: 1, data: 'fetched' })
      expect(result2).toEqual({ id: 1, data: 'fetched' })
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should apply tags to memoized entries', () => {
      const fn = vi.fn((id: number) => `item-${id}`)
      const memoized = cache.memoize(fn, {
        keyGenerator: (id) => `item:${id}`,
        tags: ['items'],
      })

      memoized(1)
      memoized(2)

      const keys = cache.getKeysByTag('items')
      expect(keys).toContain('item:1')
      expect(keys).toContain('item:2')
    })
  })

  describe('Batch getOrSet', () => {
    it('should fetch missing keys only', async () => {
      cache.set('key1', 'cached1')
      cache.set('key2', 'cached2')

      const fetcher = vi.fn(async (missingKeys: string[]) => {
        return missingKeys.map((key) => ({
          key,
          value: `fetched-${key}`,
        }))
      })

      const result = await cache.getOrSetMany(
        ['key1', 'key2', 'key3', 'key4'],
        fetcher
      )

      expect(result.get('key1')).toBe('cached1')
      expect(result.get('key2')).toBe('cached2')
      expect(result.get('key3')).toBe('fetched-key3')
      expect(result.get('key4')).toBe('fetched-key4')

      expect(fetcher).toHaveBeenCalledWith(['key3', 'key4'])
    })

    it('should not call fetcher if all keys are cached', async () => {
      cache.set('key1', 'cached1')
      cache.set('key2', 'cached2')

      const fetcher = vi.fn()

      const result = await cache.getOrSetMany(['key1', 'key2'], fetcher)

      expect(result.get('key1')).toBe('cached1')
      expect(result.get('key2')).toBe('cached2')
      expect(fetcher).not.toHaveBeenCalled()
    })
  })
})
