import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEntry, updateEntry, touchEntry, accessEntry, cloneEntry } from '../../../src/core/entry'

describe('Entry Operations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createEntry', () => {
    it('should create a basic entry', () => {
      const entry = createEntry('key1', 'value1')

      expect(entry.key).toBe('key1')
      expect(entry.value).toBe('value1')
      expect(entry.accessCount).toBe(0)
      expect(entry.tags).toEqual([])
    })

    it('should create entry with TTL from options', () => {
      const entry = createEntry('key1', 'value1', { ttl: 60000 })

      expect(entry.ttl).toBe(60000)
      expect(entry.expiresAt).toBeDefined()
    })

    it('should create entry with default TTL', () => {
      const entry = createEntry('key1', 'value1', undefined, 30000)

      expect(entry.ttl).toBe(30000)
    })

    it('should create entry with stale time from options', () => {
      const entry = createEntry('key1', 'value1', { stale: 10000 })

      expect(entry.staleAt).toBeDefined()
    })

    it('should create entry with default stale time', () => {
      const entry = createEntry('key1', 'value1', undefined, undefined, 5000)

      expect(entry.staleAt).toBeDefined()
    })

    it('should create entry with tags', () => {
      const entry = createEntry('key1', 'value1', { tags: ['tag1', 'tag2'] })

      expect(entry.tags).toEqual(['tag1', 'tag2'])
    })

    it('should create entry with metadata', () => {
      const entry = createEntry('key1', 'value1', {
        metadata: { namespace: 'test', custom: 'data' },
      })

      expect(entry.metadata).toEqual({ namespace: 'test', custom: 'data' })
      expect(entry.namespace).toBe('test')
    })

    it('should create entry with revalidate option', () => {
      const entry = createEntry('key1', 'value1', { revalidate: 120000 })

      expect(entry.expiresAt).toBeDefined()
    })

    it('should estimate size of value', () => {
      const entry = createEntry('key1', 'hello')

      expect(entry.size).toBe(10) // 5 chars * 2 bytes
    })
  })

  describe('updateEntry', () => {
    it('should update entry value', () => {
      const existing = createEntry('key1', 'old')
      const updated = updateEntry(existing, 'new')

      expect(updated.value).toBe('new')
      expect(updated.key).toBe('key1')
    })

    it('should update TTL from options', () => {
      const existing = createEntry('key1', 'value', { ttl: 30000 })
      const updated = updateEntry(existing, 'new', { ttl: 60000 })

      expect(updated.ttl).toBe(60000)
    })

    it('should keep existing TTL if not provided', () => {
      const existing = createEntry('key1', 'value', { ttl: 30000 })
      const updated = updateEntry(existing, 'new')

      expect(updated.ttl).toBe(30000)
    })

    it('should use default TTL when no TTL exists', () => {
      const existing = createEntry('key1', 'value')
      const updated = updateEntry(existing, 'new', undefined, 45000)

      expect(updated.ttl).toBe(45000)
    })

    it('should update stale time from options', () => {
      const existing = createEntry('key1', 'value')
      const updated = updateEntry(existing, 'new', { stale: 5000 })

      expect(updated.staleAt).toBeDefined()
    })

    it('should keep existing stale time if not provided', () => {
      const existing = createEntry('key1', 'value', { stale: 5000 })
      const updated = updateEntry(existing, 'new')

      expect(updated.staleAt).toBe(existing.staleAt)
    })

    it('should merge tags', () => {
      const existing = createEntry('key1', 'value', { tags: ['tag1'] })
      const updated = updateEntry(existing, 'new', { tags: ['tag2'] })

      expect(updated.tags).toContain('tag1')
      expect(updated.tags).toContain('tag2')
    })

    it('should merge metadata', () => {
      const existing = createEntry('key1', 'value', {
        metadata: { a: 1 },
      })
      const updated = updateEntry(existing, 'new', {
        metadata: { b: 2 },
      })

      expect(updated.metadata).toEqual({ a: 1, b: 2 })
    })

    it('should use revalidate for expiration', () => {
      const existing = createEntry('key1', 'value')
      const updated = updateEntry(existing, 'new', { revalidate: 100000 })

      expect(updated.expiresAt).toBeDefined()
    })

    it('should update size', () => {
      const existing = createEntry('key1', 'ab')
      const updated = updateEntry(existing, 'abcdef')

      expect(updated.size).toBe(12) // 6 chars * 2
    })
  })

  describe('touchEntry', () => {
    it('should update access time', () => {
      const entry = createEntry('key1', 'value')
      const originalAccessTime = entry.accessedAt

      vi.advanceTimersByTime(1000)
      const touched = touchEntry(entry)

      expect(touched.accessedAt).toBeGreaterThan(originalAccessTime)
    })

    it('should increment access count', () => {
      const entry = createEntry('key1', 'value')
      const touched = touchEntry(entry)

      expect(touched.accessCount).toBe(entry.accessCount + 1)
    })

    it('should refresh TTL when entry has TTL', () => {
      const entry = createEntry('key1', 'value', { ttl: 60000 })
      const originalExpires = entry.expiresAt

      vi.advanceTimersByTime(10000)
      const touched = touchEntry(entry)

      expect(touched.expiresAt).toBeGreaterThan(originalExpires!)
    })

    it('should keep expiresAt when no TTL', () => {
      const entry = createEntry('key1', 'value')
      const touched = touchEntry(entry)

      expect(touched.expiresAt).toBe(entry.expiresAt)
    })

    it('should refresh stale time when entry has staleAt', () => {
      const entry = createEntry('key1', 'value', { stale: 30000 })
      const originalStaleAt = entry.staleAt

      vi.advanceTimersByTime(10000)
      const touched = touchEntry(entry)

      expect(touched.staleAt).toBeGreaterThan(originalStaleAt!)
    })

    it('should keep staleAt as undefined when not set', () => {
      const entry = createEntry('key1', 'value')
      const touched = touchEntry(entry)

      expect(touched.staleAt).toBeUndefined()
    })
  })

  describe('accessEntry', () => {
    it('should update access time', () => {
      const entry = createEntry('key1', 'value')
      const originalAccessTime = entry.accessedAt

      vi.advanceTimersByTime(1000)
      const accessed = accessEntry(entry)

      expect(accessed.accessedAt).toBeGreaterThan(originalAccessTime)
    })

    it('should increment access count', () => {
      const entry = createEntry('key1', 'value')
      const accessed = accessEntry(entry)

      expect(accessed.accessCount).toBe(entry.accessCount + 1)
    })

    it('should not modify other properties', () => {
      const entry = createEntry('key1', 'value', { ttl: 60000 })
      const accessed = accessEntry(entry)

      expect(accessed.value).toBe(entry.value)
      expect(accessed.ttl).toBe(entry.ttl)
      expect(accessed.expiresAt).toBe(entry.expiresAt)
    })
  })

  describe('cloneEntry', () => {
    it('should create a shallow clone', () => {
      const entry = createEntry('key1', 'value', { tags: ['tag1'] })
      const clone = cloneEntry(entry)

      expect(clone).toEqual(entry)
      expect(clone).not.toBe(entry)
    })

    it('should clone tags array', () => {
      const entry = createEntry('key1', 'value', { tags: ['tag1'] })
      const clone = cloneEntry(entry)

      expect(clone.tags).toEqual(entry.tags)
      expect(clone.tags).not.toBe(entry.tags)
    })

    it('should clone metadata', () => {
      const entry = createEntry('key1', 'value', { metadata: { key: 'val' } })
      const clone = cloneEntry(entry)

      expect(clone.metadata).toEqual(entry.metadata)
      expect(clone.metadata).not.toBe(entry.metadata)
    })

    it('should handle undefined metadata', () => {
      const entry = createEntry('key1', 'value')
      const clone = cloneEntry(entry)

      expect(clone.metadata).toBeUndefined()
    })
  })
})
