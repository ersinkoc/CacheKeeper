import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCache } from '../../../src/core/cache'
import type { CacheInstance } from '../../../src/types'

describe('Cache Strategies', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('LRU (Least Recently Used)', () => {
    it('should evict least recently used entries', () => {
      const cache = createCache<number>({ strategy: 'lru', maxSize: 3 })

      cache.set('a', 1)
      vi.advanceTimersByTime(100)
      cache.set('b', 2)
      vi.advanceTimersByTime(100)
      cache.set('c', 3)

      // Access 'a' and 'b' to make them more recently used
      vi.advanceTimersByTime(100)
      cache.get('a')
      vi.advanceTimersByTime(100)
      cache.get('b')

      // Add new entry, 'c' should be evicted (least recently used)
      cache.set('d', 4)

      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(true)
      expect(cache.has('c')).toBe(false)
      expect(cache.has('d')).toBe(true)

      cache.destroy()
    })

    it('should update access time on get', () => {
      const cache = createCache<number>({ strategy: 'lru', maxSize: 3 })

      cache.set('a', 1)
      vi.advanceTimersByTime(100)
      cache.set('b', 2)
      vi.advanceTimersByTime(100)
      cache.set('c', 3)

      // Access 'a' to make it most recently used
      vi.advanceTimersByTime(100)
      cache.get('a')

      // Add new entry, 'b' should be evicted
      cache.set('d', 4)

      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(false)

      cache.destroy()
    })
  })

  describe('LFU (Least Frequently Used)', () => {
    it('should evict least frequently used entries', () => {
      const cache = createCache<number>({ strategy: 'lfu', maxSize: 3 })

      cache.set('a', 1)
      vi.advanceTimersByTime(100)
      cache.set('b', 2)
      vi.advanceTimersByTime(100)
      cache.set('c', 3)
      vi.advanceTimersByTime(100)

      // Access 'a' and 'b' multiple times
      cache.get('a')
      cache.get('a')
      cache.get('a')
      cache.get('b')
      cache.get('b')
      // 'c' has been accessed 0 times

      // Add new entry, 'c' should be evicted (least frequently used)
      cache.set('d', 4)

      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(true)
      expect(cache.has('c')).toBe(false)
      expect(cache.has('d')).toBe(true)

      cache.destroy()
    })

    it('should use access time as tiebreaker', () => {
      const cache = createCache<number>({ strategy: 'lfu', maxSize: 3 })

      cache.set('a', 1)
      cache.get('a') // access count: 1
      vi.advanceTimersByTime(100)

      cache.set('b', 2)
      cache.get('b') // access count: 1
      vi.advanceTimersByTime(100)

      cache.set('c', 3)
      cache.get('c') // access count: 1

      // All have same access count, 'a' was accessed least recently
      cache.set('d', 4)

      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(true)

      cache.destroy()
    })
  })

  describe('FIFO (First In First Out)', () => {
    it('should evict oldest entries', () => {
      const cache = createCache<number>({ strategy: 'fifo', maxSize: 3 })

      cache.set('a', 1)
      vi.advanceTimersByTime(100)
      cache.set('b', 2)
      vi.advanceTimersByTime(100)
      cache.set('c', 3)

      // Access doesn't affect FIFO
      cache.get('a')
      cache.get('a')

      // Add new entry, 'a' should be evicted (first in)
      cache.set('d', 4)

      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(true)
      expect(cache.has('c')).toBe(true)
      expect(cache.has('d')).toBe(true)

      cache.destroy()
    })
  })

  describe('TTL Only', () => {
    it('should only evict expired entries', () => {
      const cache = createCache<number>({ strategy: 'ttl', ttl: 1000 })

      cache.set('a', 1)
      cache.set('b', 2)

      vi.advanceTimersByTime(500)
      cache.set('c', 3)

      vi.advanceTimersByTime(600)

      // 'a' and 'b' should be expired
      expect(cache.has('a')).toBe(false)
      expect(cache.has('b')).toBe(false)
      expect(cache.has('c')).toBe(true)

      cache.destroy()
    })
  })

  describe('SWR (Stale-While-Revalidate)', () => {
    it('should mark entries as stale', () => {
      const cache = createCache<number>({
        strategy: 'swr',
        staleTime: 1000,
        ttl: 5000,
      })

      cache.set('a', 1)

      expect(cache.isFresh('a')).toBe(true)
      expect(cache.isStale('a')).toBe(false)

      vi.advanceTimersByTime(1500)

      expect(cache.isFresh('a')).toBe(false)
      expect(cache.isStale('a')).toBe(true)

      cache.destroy()
    })

    it('should return stale data while revalidating', async () => {
      const cache = createCache<number>({
        strategy: 'swr',
        staleTime: 100,
        ttl: 5000,
      })

      cache.set('a', 1)

      vi.advanceTimersByTime(150)

      // Still returns value even when stale
      expect(cache.get('a')).toBe(1)
      expect(cache.isStale('a')).toBe(true)

      cache.destroy()
    })

    it('should revalidate stale entries', async () => {
      const cache = createCache<number>({
        strategy: 'swr',
        staleTime: 100,
        ttl: 5000,
      })

      cache.set('a', 1)
      vi.advanceTimersByTime(150)

      const newValue = await cache.revalidate('a', () => Promise.resolve(2))
      expect(newValue).toBe(2)
      expect(cache.get('a')).toBe(2)

      cache.destroy()
    })
  })

  describe('Custom Strategy', () => {
    it('should use custom eviction logic', () => {
      const cache = createCache<{ priority: number; value: string }>({
        maxSize: 3,
        strategy: {
          shouldEvict: (entries, maxSize) => {
            if (entries.length < maxSize) return []

            // Evict lowest priority entries
            const sorted = [...entries].sort(
              (a, b) => (a.value.priority ?? 0) - (b.value.priority ?? 0)
            )

            const countToEvict = Math.max(1, entries.length - maxSize + 1)
            return sorted.slice(0, countToEvict).map((e) => e.key)
          },
        },
      })

      cache.set('low', { priority: 1, value: 'low' })
      cache.set('medium', { priority: 5, value: 'medium' })
      cache.set('high', { priority: 10, value: 'high' })
      cache.set('new', { priority: 7, value: 'new' })

      expect(cache.has('low')).toBe(false) // Evicted (lowest priority)
      expect(cache.has('medium')).toBe(true)
      expect(cache.has('high')).toBe(true)
      expect(cache.has('new')).toBe(true)

      cache.destroy()
    })
  })
})
