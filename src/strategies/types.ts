import type { CacheEntry, EvictionContext } from '../types'

/**
 * Internal strategy interface
 */
export interface EvictionStrategy<T = unknown> {
  /**
   * Strategy name
   */
  readonly name: string

  /**
   * Determine which keys to evict when cache is full
   */
  shouldEvict(entries: CacheEntry<T>[], maxSize: number, context: EvictionContext): string[]

  /**
   * Called when an entry is accessed
   */
  onAccess?(entry: CacheEntry<T>): void

  /**
   * Called when an entry is set
   */
  onSet?(entry: CacheEntry<T>): void
}
