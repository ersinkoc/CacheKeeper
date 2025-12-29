import type { CachePlugin, CacheInstance, CacheEntry, StorageType } from '../types'
import { createCache } from '../core/cache'

/**
 * Tier configuration
 */
export interface TierConfig {
  /**
   * Storage type for this tier
   */
  storage: StorageType

  /**
   * Maximum size for this tier
   */
  maxSize: number

  /**
   * Default TTL for this tier in milliseconds
   */
  ttl?: number
}

/**
 * Tiered cache plugin options
 */
export interface TieredPluginOptions {
  /**
   * L1 (fast) cache configuration
   */
  l1: TierConfig

  /**
   * L2 (slow but larger) cache configuration
   */
  l2: TierConfig
}

/**
 * Creates a tiered cache plugin for multi-level caching
 *
 * L1 is the fast cache (usually memory)
 * L2 is the slow cache (usually persistent storage)
 *
 * Get: L1 hit → return
 * Get: L1 miss → check L2 → promote to L1 → return
 * Set: Write to both L1 and L2
 */
export function tieredPlugin<T = unknown>(
  options: TieredPluginOptions
): CachePlugin<T> {
  // Create L2 cache (L1 is the main cache this plugin is attached to)
  const l2Cache = createCache<T>({
    strategy: 'lru',
    maxSize: options.l2.maxSize,
    ttl: options.l2.ttl,
    storage: options.l2.storage,
  })

  // Keep reference to main cache (L1)
  let mainCache: CacheInstance<T> | null = null

  return {
    name: 'tiered',

    onInit(cache: CacheInstance<T>): void {
      mainCache = cache
    },

    onDestroy(_cache: CacheInstance<T>): void {
      l2Cache.destroy()
      mainCache = null
    },

    afterGet(key: string, value: T | undefined): T | undefined {
      // If L1 hit, return immediately
      if (value !== undefined) {
        return value
      }

      // L1 miss - check L2
      const l2Value = l2Cache.get(key)
      if (l2Value !== undefined && mainCache) {
        // Promote to L1
        mainCache.set(key, l2Value, {
          ttl: options.l1.ttl,
        })
        return l2Value
      }

      return undefined
    },

    afterSet(key: string, entry: CacheEntry<T>): void {
      // Write to L2 as well
      l2Cache.set(key, entry.value, {
        ttl: entry.ttl ?? options.l2.ttl,
        tags: entry.tags,
      })
    },

    afterDelete(key: string, _value: T): void {
      // Delete from L2 as well
      l2Cache.delete(key)
    },
  }
}

/**
 * Gets the L2 cache instance for inspection/management
 */
export function getL2Cache<T>(_plugin: CachePlugin<T>): CacheInstance<T> | null {
  // This is a workaround - in a real implementation you might want to expose this differently
  return null
}
