import type { CacheEntry, EvictionContext } from '../types'
import type { EvictionStrategy } from './types'
import { now } from '../utils/time'

/**
 * TTL (Time To Live) eviction strategy
 *
 * Only evicts expired entries, no size-based eviction.
 * Best for: Session data, temporary tokens.
 */
export class TTLStrategy<T = unknown> implements EvictionStrategy<T> {
  readonly name = 'ttl'

  shouldEvict(entries: CacheEntry<T>[], _maxSize: number, _context: EvictionContext): string[] {
    const currentTime = now()

    // Only evict expired entries
    return entries
      .filter((entry) => entry.expiresAt !== undefined && entry.expiresAt <= currentTime)
      .map((entry) => entry.key)
  }
}

/**
 * Creates a TTL strategy instance
 */
export function createTTLStrategy<T = unknown>(): EvictionStrategy<T> {
  return new TTLStrategy<T>()
}
