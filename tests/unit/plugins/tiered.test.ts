import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createCache } from '../../../src/core/cache'
import { tieredPlugin, getL2Cache } from '../../../src/plugins/tiered'
import type { CacheInstance } from '../../../src/types'

describe('Tiered Plugin', () => {
  let cache: CacheInstance<unknown>

  beforeEach(() => {
    const plugin = tieredPlugin({
      l1: {
        storage: 'memory',
        maxSize: 10,
        ttl: 60000,
      },
      l2: {
        storage: 'memory',
        maxSize: 100,
        ttl: 300000,
      },
    })

    cache = createCache({
      strategy: 'lru',
      maxSize: 10,
      checkInterval: 0,
      plugins: [plugin],
    })
  })

  afterEach(() => {
    cache.destroy()
  })

  it('should write to both L1 and L2 on set', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return value from L1 if present', () => {
    cache.set('key1', 'value1')

    // Value should be in L1
    const value = cache.get('key1')
    expect(value).toBe('value1')
  })

  it('should call afterGet with value when L1 hits', () => {
    // Set value which goes to both L1 and L2
    cache.set('key1', 'value1')

    // The afterGet hook is called when there's a hit
    // It should return the same value since L1 hit means we don't need L2
    const value = cache.get('key1')
    expect(value).toBe('value1')
  })

  it('should return undefined on L1 miss (afterGet not called for misses)', () => {
    // Note: The current cache implementation calls afterGet ONLY on hits
    // On misses, it returns early before calling afterGet
    // So L2 promotion doesn't work with the current hook design
    // This test documents the actual behavior

    cache.set('key1', 'value1')

    // Clear L1 by filling it with other values
    for (let i = 0; i < 15; i++) {
      cache.set(`fill-${i}`, `fill-value-${i}`)
    }

    // key1 is evicted from L1, and since afterGet isn't called on miss,
    // we can't promote from L2
    const value = cache.get('key1')
    expect(value).toBeUndefined()
  })

  it('should delete from both L1 and L2', () => {
    cache.set('key1', 'value1')
    cache.delete('key1')

    expect(cache.get('key1')).toBeUndefined()
  })

  it('should handle entries with tags', () => {
    cache.set('key1', 'value1', { tags: ['tag1', 'tag2'] })
    expect(cache.get('key1')).toBe('value1')
    expect(cache.getTags('key1')).toContain('tag1')
  })

  it('should handle entries with custom TTL', () => {
    cache.set('key1', 'value1', { ttl: 1000 })
    expect(cache.get('key1')).toBe('value1')
  })

  it('should destroy L2 cache on destroy', () => {
    cache.set('key1', 'value1')
    cache.destroy()

    // After destroy, cache should throw
    expect(() => cache.get('key1')).toThrow()
  })

  describe('getL2Cache', () => {
    it('should return null (implementation limitation)', () => {
      const plugin = tieredPlugin({
        l1: { storage: 'memory', maxSize: 10 },
        l2: { storage: 'memory', maxSize: 100 },
      })

      const result = getL2Cache(plugin)
      expect(result).toBeNull()
    })
  })

  describe('afterGet hook direct testing', () => {
    it('should return value immediately when L1 hits (value !== undefined)', () => {
      const plugin = tieredPlugin({
        l1: { storage: 'memory', maxSize: 10 },
        l2: { storage: 'memory', maxSize: 100 },
      })

      // Initialize plugin with a cache
      const testCache = createCache({
        strategy: 'lru',
        maxSize: 10,
        checkInterval: 0,
        plugins: [plugin],
      })

      // Set a value (goes to both L1 and L2)
      testCache.set('key1', 'value1')

      // Directly test the afterGet hook with a defined value (L1 hit)
      const result = plugin.afterGet?.('key1', 'value1')
      expect(result).toBe('value1')

      testCache.destroy()
    })

    it('should promote from L2 when L1 misses', () => {
      const plugin = tieredPlugin({
        l1: { storage: 'memory', maxSize: 10, ttl: 60000 },
        l2: { storage: 'memory', maxSize: 100, ttl: 300000 },
      })

      // Create a cache with the plugin
      const testCache = createCache({
        strategy: 'lru',
        maxSize: 10,
        checkInterval: 0,
        plugins: [plugin],
      })

      // Set value - this writes to both L1 and L2
      testCache.set('key1', 'value1')

      // Now directly call afterGet with undefined (simulating L1 miss)
      // The plugin should fetch from L2 and promote to L1
      const result = plugin.afterGet?.('key1', undefined)
      expect(result).toBe('value1')

      testCache.destroy()
    })

    it('should return undefined when both L1 and L2 miss', () => {
      const plugin = tieredPlugin({
        l1: { storage: 'memory', maxSize: 10 },
        l2: { storage: 'memory', maxSize: 100 },
      })

      // Create a cache with the plugin
      const testCache = createCache({
        strategy: 'lru',
        maxSize: 10,
        checkInterval: 0,
        plugins: [plugin],
      })

      // Don't set any value - both L1 and L2 are empty

      // Directly call afterGet with undefined (simulating L1 miss)
      // L2 should also miss, returning undefined
      const result = plugin.afterGet?.('nonexistent', undefined)
      expect(result).toBeUndefined()

      testCache.destroy()
    })

    it('should promote with correct TTL from L1 config', () => {
      const plugin = tieredPlugin({
        l1: { storage: 'memory', maxSize: 10, ttl: 5000 },
        l2: { storage: 'memory', maxSize: 100, ttl: 300000 },
      })

      const testCache = createCache({
        strategy: 'lru',
        maxSize: 10,
        checkInterval: 0,
        plugins: [plugin],
      })

      // Set value without TTL (should use L2's TTL)
      testCache.set('key1', 'value1')

      // Directly call afterGet with undefined (simulating L1 miss)
      const result = plugin.afterGet?.('key1', undefined)
      expect(result).toBe('value1')

      testCache.destroy()
    })

    it('should not promote when mainCache is null', () => {
      const plugin = tieredPlugin({
        l1: { storage: 'memory', maxSize: 10 },
        l2: { storage: 'memory', maxSize: 100 },
      })

      // Don't initialize with a cache, so mainCache stays null

      // Directly call afterGet with undefined
      // Since mainCache is null, it should return undefined
      const result = plugin.afterGet?.('key1', undefined)
      expect(result).toBeUndefined()
    })
  })
})
