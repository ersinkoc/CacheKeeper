import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SWRStrategy, createSWRStrategy, isEntryStale, isEntryFresh } from '../../../src/strategies/swr'
import type { CacheEntry, EvictionContext } from '../../../src/types'

describe('SWR Strategy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createEntry = <T>(key: string, value: T, options: Partial<CacheEntry<T>> = {}): CacheEntry<T> => ({
    key,
    value,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    accessedAt: Date.now(),
    accessCount: 0,
    size: 100,
    tags: [],
    ...options,
  })

  const context: EvictionContext = {
    currentSize: 3,
    maxSize: 3,
  }

  describe('SWRStrategy class', () => {
    it('should return empty array when under maxSize', () => {
      const strategy = new SWRStrategy()
      const entries = [createEntry('a', 1), createEntry('b', 2)]

      const result = strategy.shouldEvict(entries, 5, context)
      expect(result).toEqual([])
    })

    it('should evict expired entries first', () => {
      const strategy = new SWRStrategy()
      const now = Date.now()

      const entries = [
        createEntry('a', 1, { accessedAt: now, expiresAt: now - 1000 }), // expired
        createEntry('b', 2, { accessedAt: now - 100 }), // not expired, older access
        createEntry('c', 3, { accessedAt: now }), // not expired, newer access
      ]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toContain('a')
    })

    it('should evict LRU entries when no expired entries', () => {
      const strategy = new SWRStrategy()

      vi.advanceTimersByTime(100)
      const entry1 = createEntry('a', 1, { accessedAt: Date.now() })

      vi.advanceTimersByTime(100)
      const entry2 = createEntry('b', 2, { accessedAt: Date.now() })

      vi.advanceTimersByTime(100)
      const entry3 = createEntry('c', 3, { accessedAt: Date.now() })

      const entries = [entry1, entry2, entry3]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toContain('a') // oldest access
    })

    it('should evict all expired + some LRU when not enough expired', () => {
      const strategy = new SWRStrategy()
      const now = Date.now()

      const entries = [
        createEntry('a', 1, { accessedAt: now - 300, expiresAt: now - 1000 }), // expired
        createEntry('b', 2, { accessedAt: now - 200 }), // not expired, oldest
        createEntry('c', 3, { accessedAt: now - 100 }), // not expired, middle
        createEntry('d', 4, { accessedAt: now }), // not expired, newest
      ]

      // Need to evict 2 (4 entries - 3 maxSize + 1)
      const result = strategy.shouldEvict(entries, 3, context)
      expect(result.length).toBe(2)
      expect(result).toContain('a') // expired
      expect(result).toContain('b') // LRU of non-expired
    })

    it('should handle onAccess (no-op)', () => {
      const strategy = new SWRStrategy()
      const entry = createEntry('a', 1)

      // Should not throw
      expect(() => strategy.onAccess(entry)).not.toThrow()
    })
  })

  describe('createSWRStrategy', () => {
    it('should create an SWR strategy instance', () => {
      const strategy = createSWRStrategy()
      expect(strategy.name).toBe('swr')
    })
  })

  describe('isEntryStale', () => {
    it('should return false when staleAt is undefined', () => {
      const entry = createEntry('a', 1)
      expect(isEntryStale(entry)).toBe(false)
    })

    it('should return false when current time is before staleAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { staleAt: now + 10000 })
      expect(isEntryStale(entry)).toBe(false)
    })

    it('should return true when current time is after staleAt but before expiresAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { staleAt: now - 1000, expiresAt: now + 10000 })
      expect(isEntryStale(entry)).toBe(true)
    })

    it('should return true when stale and no expiresAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { staleAt: now - 1000 })
      expect(isEntryStale(entry)).toBe(true)
    })

    it('should return false when past expiresAt (expired, not stale)', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { staleAt: now - 2000, expiresAt: now - 1000 })
      expect(isEntryStale(entry)).toBe(false)
    })
  })

  describe('isEntryFresh', () => {
    it('should return true when staleAt is undefined and no expiresAt', () => {
      const entry = createEntry('a', 1)
      expect(isEntryFresh(entry)).toBe(true)
    })

    it('should return true when staleAt is undefined and before expiresAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { expiresAt: now + 10000 })
      expect(isEntryFresh(entry)).toBe(true)
    })

    it('should return false when staleAt is undefined and past expiresAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { expiresAt: now - 1000 })
      expect(isEntryFresh(entry)).toBe(false)
    })

    it('should return true when current time is before staleAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { staleAt: now + 10000 })
      expect(isEntryFresh(entry)).toBe(true)
    })

    it('should return false when current time is after staleAt', () => {
      const now = Date.now()
      const entry = createEntry('a', 1, { staleAt: now - 1000 })
      expect(isEntryFresh(entry)).toBe(false)
    })
  })
})
