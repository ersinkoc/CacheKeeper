import type { CacheEntry, EvictionContext } from '../types'
import type { EvictionStrategy } from './types'

/**
 * LFU (Least Frequently Used) eviction strategy
 *
 * Evicts entries with the lowest access count.
 * Best for: Hot/cold data patterns, popular content caching.
 */
export class LFUStrategy<T = unknown> implements EvictionStrategy<T> {
  readonly name = 'lfu'

  shouldEvict(entries: CacheEntry<T>[], maxSize: number, _context: EvictionContext): string[] {
    // When called, we're at or over maxSize and about to add one more entry
    if (entries.length < maxSize) {
      return []
    }

    // Sort by accessCount ascending (least accessed first)
    // Use accessedAt as tiebreaker (older access first)
    const sorted = [...entries].sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount
      }
      return a.accessedAt - b.accessedAt
    })

    // Evict at least one to make room for the new entry
    const countToEvict = Math.max(1, entries.length - maxSize + 1)

    // Return keys of entries to evict
    return sorted.slice(0, countToEvict).map((entry) => entry.key)
  }

  onAccess(entry: CacheEntry<T>): void {
    // accessCount increment is handled by the cache
    void entry
  }
}

/**
 * Creates an LFU strategy instance
 */
export function createLFUStrategy<T = unknown>(): EvictionStrategy<T> {
  return new LFUStrategy<T>()
}
