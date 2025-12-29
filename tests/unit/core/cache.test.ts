import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCache } from '../../../src/core/cache'

describe('Cache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Operations', () => {
    it('should create a cache with default config', () => {
      const cache = createCache()
      expect(cache).toBeDefined()
      expect(cache.size).toBe(0)
      expect(cache.isEmpty).toBe(true)
      cache.destroy()
    })

    it('should set and get values', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
      cache.destroy()
    })

    it('should return undefined for missing keys', () => {
      const cache = createCache<string>()
      expect(cache.get('nonexistent')).toBeUndefined()
      cache.destroy()
    })

    it('should return default value when key is missing', () => {
      const cache = createCache<string>()
      expect(cache.get('nonexistent', 'default')).toBe('default')
      cache.destroy()
    })

    it('should check if key exists', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('nonexistent')).toBe(false)
      cache.destroy()
    })

    it('should delete a key', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
      expect(cache.delete('nonexistent')).toBe(false)
      cache.destroy()
    })

    it('should delete multiple keys', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      const deleted = cache.delete(['key1', 'key2', 'nonexistent'])
      expect(deleted).toBe(2)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
      expect(cache.has('key3')).toBe(true)
      cache.destroy()
    })

    it('should clear all entries', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.size).toBe(0)
      expect(cache.isEmpty).toBe(true)
      cache.destroy()
    })

    it('should reject invalid keys', () => {
      const cache = createCache<string>()
      expect(() => cache.set('', 'value')).toThrow()
      expect(cache.get('')).toBeUndefined()
      cache.destroy()
    })

    it('should update existing entries', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key1', 'value2')
      expect(cache.get('key1')).toBe('value2')
      expect(cache.size).toBe(1)
      cache.destroy()
    })
  })

  describe('Size and Memory', () => {
    it('should track size correctly', () => {
      const cache = createCache<string>()
      expect(cache.size).toBe(0)
      cache.set('key1', 'value1')
      expect(cache.size).toBe(1)
      cache.set('key2', 'value2')
      expect(cache.size).toBe(2)
      cache.delete('key1')
      expect(cache.size).toBe(1)
      cache.destroy()
    })

    it('should track memory usage', () => {
      const cache = createCache<string>()
      expect(cache.memoryUsage).toBe(0)
      cache.set('key1', 'a'.repeat(100))
      expect(cache.memoryUsage).toBeGreaterThan(0)
      cache.destroy()
    })

    it('should respect maxSize', () => {
      const cache = createCache<number>({ maxSize: 3 })
      cache.set('key1', 1)
      cache.set('key2', 2)
      cache.set('key3', 3)
      cache.set('key4', 4)
      expect(cache.size).toBeLessThanOrEqual(3)
      cache.destroy()
    })
  })

  describe('TTL Operations', () => {
    it('should set TTL on entries', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 1000 })
      expect(cache.getTTL('key1')).toBe(1000)
      cache.destroy()
    })

    it('should expire entries after TTL', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 1000 })

      expect(cache.get('key1')).toBe('value1')

      vi.advanceTimersByTime(1001)

      expect(cache.get('key1')).toBeUndefined()
      cache.destroy()
    })

    it('should update TTL', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 1000 })
      cache.setTTL('key1', 5000)
      expect(cache.getTTL('key1')).toBe(5000)
      cache.destroy()
    })

    it('should touch entry and refresh TTL', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 1000 })

      vi.advanceTimersByTime(500)
      cache.touch('key1')

      vi.advanceTimersByTime(700)
      expect(cache.has('key1')).toBe(true)
      cache.destroy()
    })

    it('should expire entry manually', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      expect(cache.expire('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
      cache.destroy()
    })

    it('should get expiration date', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 60000 })
      const expiration = cache.getExpiration('key1')
      expect(expiration).toBeInstanceOf(Date)
      expect(cache.getExpiration('nonexistent')).toBeNull()
      cache.destroy()
    })

    it('should prune expired entries', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 1000 })
      cache.set('key2', 'value2', { ttl: 2000 })
      cache.set('key3', 'value3')

      vi.advanceTimersByTime(1500)

      const pruned = cache.prune()
      expect(pruned).toBe(1)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
      expect(cache.has('key3')).toBe(true)
      cache.destroy()
    })
  })

  describe('Events', () => {
    it('should emit hit event', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      cache.on('hit', handler)

      cache.set('key1', 'value1')
      cache.get('key1')

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          value: 'value1',
        })
      )
      cache.destroy()
    })

    it('should emit miss event', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      cache.on('miss', handler)

      cache.get('nonexistent')

      expect(handler).toHaveBeenCalledWith({ key: 'nonexistent' })
      cache.destroy()
    })

    it('should emit set event', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      cache.on('set', handler)

      cache.set('key1', 'value1')

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          value: 'value1',
          isUpdate: false,
        })
      )

      cache.set('key1', 'value2')

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          value: 'value2',
          isUpdate: true,
        })
      )
      cache.destroy()
    })

    it('should emit delete event', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      cache.on('delete', handler)

      cache.set('key1', 'value1')
      cache.delete('key1')

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          value: 'value1',
          reason: 'manual',
        })
      )
      cache.destroy()
    })

    it('should emit clear event', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      cache.on('clear', handler)

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()

      expect(handler).toHaveBeenCalledWith({ count: 2 })
      cache.destroy()
    })

    it('should unsubscribe from events', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      const unsubscribe = cache.on('set', handler)

      cache.set('key1', 'value1')
      expect(handler).toHaveBeenCalledTimes(1)

      unsubscribe()
      cache.set('key2', 'value2')
      expect(handler).toHaveBeenCalledTimes(1)
      cache.destroy()
    })

    it('should handle once events', () => {
      const cache = createCache<string>()
      const handler = vi.fn()
      cache.once('set', handler)

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      expect(handler).toHaveBeenCalledTimes(1)
      cache.destroy()
    })
  })

  describe('Statistics', () => {
    it('should track hits and misses', () => {
      const cache = createCache<string>()

      cache.set('key1', 'value1')
      cache.get('key1') // hit
      cache.get('key1') // hit
      cache.get('nonexistent') // miss

      expect(cache.hits).toBe(2)
      expect(cache.misses).toBe(1)
      expect(cache.hitRate).toBeCloseTo(0.666, 2)
      cache.destroy()
    })

    it('should get full stats', () => {
      const cache = createCache<string>({ maxSize: 100 })

      cache.set('key1', 'value1', { ttl: 60000 })
      cache.set('key2', 'value2')
      cache.get('key1')

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(0)
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(100)
      expect(stats.uptime).toBeGreaterThanOrEqual(0)
      cache.destroy()
    })

    it('should reset stats', () => {
      const cache = createCache<string>()

      cache.set('key1', 'value1')
      cache.get('key1')
      cache.get('nonexistent')

      cache.resetStats()

      expect(cache.hits).toBe(0)
      expect(cache.misses).toBe(0)
      cache.destroy()
    })
  })

  describe('Iteration', () => {
    it('should return all keys', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const keys = cache.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys.length).toBe(2)
      cache.destroy()
    })

    it('should filter keys', () => {
      const cache = createCache<string>()
      cache.set('user:1', 'value1')
      cache.set('user:2', 'value2')
      cache.set('product:1', 'value3')

      const userKeys = cache.keys((key) => key.startsWith('user:'))
      expect(userKeys.length).toBe(2)
      cache.destroy()
    })

    it('should return all values', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const values = cache.values()
      expect(values).toContain('value1')
      expect(values).toContain('value2')
      cache.destroy()
    })

    it('should return all entries', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const entries = cache.entries()
      expect(entries).toContainEqual(['key1', 'value1'])
      expect(entries).toContainEqual(['key2', 'value2'])
      cache.destroy()
    })

    it('should iterate with forEach', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const collected: [string, string][] = []
      cache.forEach((value, key) => {
        collected.push([key, value])
      })

      expect(collected.length).toBe(2)
      cache.destroy()
    })

    it('should find entry by predicate', () => {
      const cache = createCache<{ id: number; name: string }>()
      cache.set('user:1', { id: 1, name: 'Alice' })
      cache.set('user:2', { id: 2, name: 'Bob' })

      const found = cache.find((value) => value.name === 'Bob')
      expect(found).toEqual({ id: 2, name: 'Bob' })
      cache.destroy()
    })

    it('should filter entries by predicate', () => {
      const cache = createCache<number>()
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      const filtered = cache.filter((value) => value > 1)
      expect(filtered.length).toBe(2)
      cache.destroy()
    })

    it('should be iterable', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const collected: [string, string][] = []
      for (const [key, value] of cache) {
        collected.push([key, value])
      }

      expect(collected.length).toBe(2)
      cache.destroy()
    })
  })

  describe('Serialization', () => {
    it('should dump cache state', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const dump = cache.dump()
      expect(dump.version).toBe('1.0.0')
      expect(dump.entries.length).toBe(2)
      cache.destroy()
    })

    it('should restore cache state', () => {
      const cache1 = createCache<string>()
      cache1.set('key1', 'value1')
      cache1.set('key2', 'value2')

      const dump = cache1.dump()
      cache1.destroy()

      const cache2 = createCache<string>()
      cache2.restore(dump)

      expect(cache2.get('key1')).toBe('value1')
      expect(cache2.get('key2')).toBe('value2')
      cache2.destroy()
    })
  })

  describe('Lifecycle', () => {
    it('should destroy cache', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')
      cache.destroy()

      expect(() => cache.get('key1')).toThrow()
    })

    it('should resize cache', () => {
      const cache = createCache<number>({ maxSize: 10 })
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, i)
      }

      const evicted = cache.resize(5)
      expect(evicted).toBeGreaterThan(0)
      expect(cache.size).toBe(5)
      expect(cache.maxSize).toBe(5)
      cache.destroy()
    })

    it('should throw when resizing to less than 1', () => {
      const cache = createCache<number>({ maxSize: 10 })
      expect(() => cache.resize(0)).toThrow('maxSize must be at least 1')
      cache.destroy()
    })
  })

  describe('Memory Management', () => {
    it('should enforce memory limit when adding new entries', () => {
      // Create a cache with 500 byte memory limit
      const cache = createCache<string>({
        maxSize: 100,
        maxMemory: 500,
      })

      // Add entries that will exceed the memory limit
      // Each string entry has overhead + string size
      cache.set('key1', 'a'.repeat(100))
      cache.set('key2', 'b'.repeat(100))
      cache.set('key3', 'c'.repeat(100))
      cache.set('key4', 'd'.repeat(100))

      // Memory limit should cause eviction
      expect(cache.memoryUsage).toBeLessThanOrEqual(600)
      cache.destroy()
    })

    it('should evict oldest accessed entries when memory limit exceeded', () => {
      const cache = createCache<string>({
        maxSize: 100,
        maxMemory: 400,
      })

      const evictHandler = vi.fn()
      cache.on('evict', evictHandler)

      cache.set('key1', 'a'.repeat(100))
      cache.set('key2', 'b'.repeat(100))
      cache.set('key3', 'c'.repeat(100)) // This should trigger eviction

      // Eviction should have happened
      expect(evictHandler).toHaveBeenCalled()
      cache.destroy()
    })
  })

  describe('Restore with expired entries', () => {
    it('should skip expired entries when restoring', () => {
      const cache1 = createCache<string>()
      cache1.set('key1', 'value1', { ttl: 1000 })
      cache1.set('key2', 'value2', { ttl: 10000 })

      const dump = cache1.dump()

      // Advance time past first entry's expiration
      vi.advanceTimersByTime(5000)

      const cache2 = createCache<string>()
      cache2.restore(dump)

      // key1 should be expired and not restored
      expect(cache2.has('key1')).toBe(false)
      // key2 should still be valid
      expect(cache2.get('key2')).toBe('value2')

      cache1.destroy()
      cache2.destroy()
    })

    it('should restore entries with tags', () => {
      const cache1 = createCache<string>()
      cache1.set('key1', 'value1', { tags: ['tag1', 'tag2'] })
      cache1.set('key2', 'value2', { tags: ['tag2'] })

      const dump = cache1.dump()
      cache1.destroy()

      const cache2 = createCache<string>()
      cache2.restore(dump)

      expect(cache2.getTags('key1')).toContain('tag1')
      expect(cache2.getTags('key1')).toContain('tag2')
      expect(cache2.getTags('key2')).toContain('tag2')
      expect(cache2.getKeysByTag('tag2')).toContain('key1')
      expect(cache2.getKeysByTag('tag2')).toContain('key2')

      cache2.destroy()
    })
  })

  describe('getEntry internal method', () => {
    it('should return cache entry with metadata', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 5000, tags: ['tag1'] })

      // Access internal getEntry method
      const entry = (cache as unknown as { getEntry: (key: string) => unknown }).getEntry('key1')

      expect(entry).toBeDefined()
      expect((entry as { value: string }).value).toBe('value1')
      expect((entry as { key: string }).key).toBe('key1')
      expect((entry as { tags: string[] }).tags).toContain('tag1')

      cache.destroy()
    })

    it('should return undefined for non-existent key', () => {
      const cache = createCache<string>()

      const entry = (cache as unknown as { getEntry: (key: string) => unknown }).getEntry('nonexistent')
      expect(entry).toBeUndefined()

      cache.destroy()
    })
  })

  describe('Event callbacks in config', () => {
    it('should call onHit callback', () => {
      const onHit = vi.fn()
      const cache = createCache<string>({ onHit })

      cache.set('key1', 'value1')
      cache.get('key1')

      expect(onHit).toHaveBeenCalled()
      cache.destroy()
    })

    it('should call onMiss callback', () => {
      const onMiss = vi.fn()
      const cache = createCache<string>({ onMiss })

      cache.get('nonexistent')

      expect(onMiss).toHaveBeenCalled()
      cache.destroy()
    })

    it('should call onSet callback', () => {
      const onSet = vi.fn()
      const cache = createCache<string>({ onSet })

      cache.set('key1', 'value1')

      expect(onSet).toHaveBeenCalled()
      cache.destroy()
    })

    it('should call onDelete callback', () => {
      const onDelete = vi.fn()
      const cache = createCache<string>({ onDelete })

      cache.set('key1', 'value1')
      cache.delete('key1')

      expect(onDelete).toHaveBeenCalled()
      cache.destroy()
    })

    it('should call onExpire callback', () => {
      const onExpire = vi.fn()
      const cache = createCache<string>({ onExpire })

      cache.set('key1', 'value1', { ttl: 1000 })
      vi.advanceTimersByTime(1001)
      cache.get('key1') // Triggers expiration check

      expect(onExpire).toHaveBeenCalled()
      cache.destroy()
    })

    it('should call onEvict callback', () => {
      const onEvict = vi.fn()
      const cache = createCache<number>({ maxSize: 2, onEvict })

      cache.set('key1', 1)
      cache.set('key2', 2)
      cache.set('key3', 3) // Should evict

      expect(onEvict).toHaveBeenCalled()
      cache.destroy()
    })

    it('should call onClear callback', () => {
      const onClear = vi.fn()
      const cache = createCache<string>({ onClear })

      cache.set('key1', 'value1')
      cache.clear()

      expect(onClear).toHaveBeenCalled()
      cache.destroy()
    })
  })

  describe('Off event handler', () => {
    it('should remove event handler with off', () => {
      const cache = createCache<string>()
      const handler = vi.fn()

      cache.on('set', handler)
      cache.set('key1', 'value1')
      expect(handler).toHaveBeenCalledTimes(1)

      cache.off('set', handler)
      cache.set('key2', 'value2')
      expect(handler).toHaveBeenCalledTimes(1) // Still 1, not called again

      cache.destroy()
    })
  })

  describe('Destroy idempotence', () => {
    it('should handle multiple destroy calls', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1')

      cache.destroy()
      // Second destroy should not throw
      expect(() => cache.destroy()).not.toThrow()
    })
  })

  describe('Invalid key handling', () => {
    it('should return false for has with invalid key', () => {
      const cache = createCache<string>()
      expect(cache.has('')).toBe(false)
      cache.destroy()
    })
  })

  describe('Expiration during has check', () => {
    it('should return false for has when entry is expired', () => {
      const cache = createCache<string>()
      cache.set('key1', 'value1', { ttl: 1000 })

      vi.advanceTimersByTime(1001)

      expect(cache.has('key1')).toBe(false)
      cache.destroy()
    })
  })
})
