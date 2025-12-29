import type { CacheEntry, EvictionContext } from '../types'
import type { EvictionStrategy } from './types'

/**
 * LRU (Least Recently Used) eviction strategy
 *
 * Evicts entries that haven't been accessed for the longest time.
 * Best for: General purpose caching, recently accessed data.
 */
export class LRUStrategy<T = unknown> implements EvictionStrategy<T> {
  readonly name = 'lru'

  shouldEvict(entries: CacheEntry<T>[], maxSize: number, _context: EvictionContext): string[] {
    // When called, we're at or over maxSize and about to add one more entry
    // So we need to make room for the new entry
    if (entries.length < maxSize) {
      return []
    }

    // Sort by accessedAt ascending (oldest access first)
    const sorted = [...entries].sort((a, b) => a.accessedAt - b.accessedAt)

    // Evict at least one to make room for the new entry
    const countToEvict = Math.max(1, entries.length - maxSize + 1)

    // Return keys of entries to evict
    return sorted.slice(0, countToEvict).map((entry) => entry.key)
  }

  onAccess(entry: CacheEntry<T>): void {
    // Update accessedAt is handled by the cache, not the strategy
    // This hook is for additional tracking if needed
    void entry
  }
}

/**
 * Creates an LRU strategy instance
 */
export function createLRUStrategy<T = unknown>(): EvictionStrategy<T> {
  return new LRUStrategy<T>()
}
