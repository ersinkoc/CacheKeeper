import type { CacheEntry, EvictionContext } from '../types'
import type { EvictionStrategy } from './types'
import { now } from '../utils/time'

/**
 * SWR (Stale-While-Revalidate) eviction strategy
 *
 * Returns stale data while revalidating in background.
 * Evicts expired entries first, then falls back to LRU.
 * Best for: API responses, data that can be slightly outdated.
 */
export class SWRStrategy<T = unknown> implements EvictionStrategy<T> {
  readonly name = 'swr'

  shouldEvict(entries: CacheEntry<T>[], maxSize: number, _context: EvictionContext): string[] {
    // When called, we're at or over maxSize and about to add one more entry
    if (entries.length < maxSize) {
      return []
    }

    const currentTime = now()

    // First, find expired entries (past revalidateTime/expiresAt)
    const expired = entries.filter(
      (entry) => entry.expiresAt !== undefined && entry.expiresAt <= currentTime
    )

    // Evict at least one to make room for the new entry
    const countToEvict = Math.max(1, entries.length - maxSize + 1)

    // If we have enough expired entries, just evict those
    if (expired.length >= countToEvict) {
      return expired.slice(0, countToEvict).map((entry) => entry.key)
    }

    // Otherwise, evict all expired + some LRU entries
    const expiredKeys = expired.map((entry) => entry.key)
    const expiredKeySet = new Set(expiredKeys)

    // Get non-expired entries for LRU eviction
    const nonExpired = entries.filter((entry) => !expiredKeySet.has(entry.key))

    // Sort non-expired by accessedAt (LRU)
    const sortedNonExpired = [...nonExpired].sort((a, b) => a.accessedAt - b.accessedAt)

    // Take additional entries needed
    const additionalNeeded = countToEvict - expired.length
    const additionalKeys = sortedNonExpired.slice(0, additionalNeeded).map((entry) => entry.key)

    return [...expiredKeys, ...additionalKeys]
  }

  onAccess(entry: CacheEntry<T>): void {
    // accessedAt update is handled by the cache
    void entry
  }
}

/**
 * Creates an SWR strategy instance
 */
export function createSWRStrategy<T = unknown>(): EvictionStrategy<T> {
  return new SWRStrategy<T>()
}

/**
 * Checks if an entry is stale (past staleAt but not expired)
 */
export function isEntryStale<T>(entry: CacheEntry<T>): boolean {
  if (entry.staleAt === undefined) {
    return false
  }
  const currentTime = now()
  return currentTime >= entry.staleAt && (entry.expiresAt === undefined || currentTime < entry.expiresAt)
}

/**
 * Checks if an entry is fresh (not stale)
 */
export function isEntryFresh<T>(entry: CacheEntry<T>): boolean {
  if (entry.staleAt === undefined) {
    // No stale time defined, check expiration
    if (entry.expiresAt === undefined) {
      return true // No expiration, always fresh
    }
    return now() < entry.expiresAt
  }
  return now() < entry.staleAt
}
