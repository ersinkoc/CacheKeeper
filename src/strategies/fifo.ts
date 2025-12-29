import type { CacheEntry, EvictionContext } from '../types'
import type { EvictionStrategy } from './types'

/**
 * FIFO (First In First Out) eviction strategy
 *
 * Evicts the oldest entries by creation time.
 * Best for: Simple queue-like patterns, time-ordered data.
 */
export class FIFOStrategy<T = unknown> implements EvictionStrategy<T> {
  readonly name = 'fifo'

  shouldEvict(entries: CacheEntry<T>[], maxSize: number, _context: EvictionContext): string[] {
    // When called, we're at or over maxSize and about to add one more entry
    if (entries.length < maxSize) {
      return []
    }

    // Sort by createdAt ascending (oldest first)
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt)

    // Evict at least one to make room for the new entry
    const countToEvict = Math.max(1, entries.length - maxSize + 1)

    // Return keys of entries to evict
    return sorted.slice(0, countToEvict).map((entry) => entry.key)
  }
}

/**
 * Creates a FIFO strategy instance
 */
export function createFIFOStrategy<T = unknown>(): EvictionStrategy<T> {
  return new FIFOStrategy<T>()
}
