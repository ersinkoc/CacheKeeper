import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TTLStrategy, createTTLStrategy } from '../../../src/strategies/ttl'
import type { CacheEntry, EvictionContext } from '../../../src/types'

describe('TTL Strategy', () => {
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

  describe('TTLStrategy class', () => {
    it('should return empty array when no entries are expired', () => {
      const strategy = new TTLStrategy()
      const now = Date.now()

      const entries = [
        createEntry('a', 1, { expiresAt: now + 10000 }),
        createEntry('b', 2, { expiresAt: now + 20000 }),
        createEntry('c', 3, { expiresAt: now + 30000 }),
      ]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toEqual([])
    })

    it('should evict all expired entries', () => {
      const strategy = new TTLStrategy()
      const now = Date.now()

      const entries = [
        createEntry('a', 1, { expiresAt: now - 1000 }), // expired
        createEntry('b', 2, { expiresAt: now - 500 }), // expired
        createEntry('c', 3, { expiresAt: now + 10000 }), // not expired
      ]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toHaveLength(2)
      expect(result).toContain('a')
      expect(result).toContain('b')
      expect(result).not.toContain('c')
    })

    it('should not evict entries without expiresAt', () => {
      const strategy = new TTLStrategy()

      const entries = [
        createEntry('a', 1), // no expiresAt
        createEntry('b', 2), // no expiresAt
      ]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toEqual([])
    })

    it('should evict entries exactly at expiration time', () => {
      const strategy = new TTLStrategy()
      const now = Date.now()

      const entries = [
        createEntry('a', 1, { expiresAt: now }), // exactly at expiration
      ]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toContain('a')
    })

    it('should handle mixed entries (with and without TTL)', () => {
      const strategy = new TTLStrategy()
      const now = Date.now()

      const entries = [
        createEntry('a', 1, { expiresAt: now - 1000 }), // expired
        createEntry('b', 2), // no TTL
        createEntry('c', 3, { expiresAt: now + 10000 }), // not expired
      ]

      const result = strategy.shouldEvict(entries, 3, context)
      expect(result).toHaveLength(1)
      expect(result).toContain('a')
    })

    it('should ignore maxSize (TTL only cares about expiration)', () => {
      const strategy = new TTLStrategy()
      const now = Date.now()

      // All entries not expired, but over maxSize
      const entries = [
        createEntry('a', 1, { expiresAt: now + 10000 }),
        createEntry('b', 2, { expiresAt: now + 10000 }),
        createEntry('c', 3, { expiresAt: now + 10000 }),
        createEntry('d', 4, { expiresAt: now + 10000 }),
        createEntry('e', 5, { expiresAt: now + 10000 }),
      ]

      // maxSize is 2 but no evictions since nothing expired
      const result = strategy.shouldEvict(entries, 2, context)
      expect(result).toEqual([])
    })
  })

  describe('createTTLStrategy', () => {
    it('should create a TTL strategy instance', () => {
      const strategy = createTTLStrategy()
      expect(strategy.name).toBe('ttl')
    })

    it('should create a typed strategy', () => {
      const strategy = createTTLStrategy<{ id: number }>()
      expect(strategy.name).toBe('ttl')
    })
  })
})
