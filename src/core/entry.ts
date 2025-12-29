import type { CacheEntry, SetOptions } from '../types'
import { estimateSize } from '../utils/size'
import { now, calculateExpiresAt, calculateStaleAt } from '../utils/time'

/**
 * Creates a new cache entry
 */
export function createEntry<T>(
  key: string,
  value: T,
  options?: SetOptions,
  defaultTTL?: number,
  defaultStaleTime?: number
): CacheEntry<T> {
  const currentTime = now()

  // Determine TTL and stale time
  const ttl = options?.ttl ?? defaultTTL
  const staleTime = options?.stale ?? defaultStaleTime

  // Calculate expiration and stale timestamps
  const expiresAt = options?.revalidate
    ? calculateExpiresAt(options.revalidate)
    : calculateExpiresAt(ttl)

  const staleAt = calculateStaleAt(staleTime)

  return {
    key,
    value,
    createdAt: currentTime,
    updatedAt: currentTime,
    accessedAt: currentTime,
    accessCount: 0,
    size: estimateSize(value),
    ttl,
    expiresAt,
    staleAt,
    tags: options?.tags ?? [],
    namespace: options?.metadata?.namespace as string | undefined,
    metadata: options?.metadata,
  }
}

/**
 * Updates an existing cache entry with a new value
 */
export function updateEntry<T>(
  existing: CacheEntry<T>,
  value: T,
  options?: SetOptions,
  defaultTTL?: number
): CacheEntry<T> {
  const currentTime = now()

  // Determine TTL
  const ttl = options?.ttl ?? existing.ttl ?? defaultTTL

  // Calculate new expiration
  const expiresAt = options?.revalidate
    ? calculateExpiresAt(options.revalidate)
    : calculateExpiresAt(ttl)

  // Calculate stale time
  const staleAt = options?.stale ? calculateStaleAt(options.stale) : existing.staleAt

  // Merge tags
  const newTags = options?.tags ?? []
  const existingTags = existing.tags
  const mergedTags = [...new Set([...existingTags, ...newTags])]

  return {
    ...existing,
    value,
    updatedAt: currentTime,
    accessedAt: currentTime,
    size: estimateSize(value),
    ttl,
    expiresAt,
    staleAt,
    tags: mergedTags,
    metadata: options?.metadata ? { ...existing.metadata, ...options.metadata } : existing.metadata,
  }
}

/**
 * Touches an entry (updates access time and refreshes TTL)
 */
export function touchEntry<T>(entry: CacheEntry<T>): CacheEntry<T> {
  const currentTime = now()

  // Refresh TTL if it exists
  const expiresAt = entry.ttl ? currentTime + entry.ttl : entry.expiresAt

  // Refresh stale time if it was set
  const staleAt = entry.staleAt
    ? currentTime + (entry.staleAt - entry.createdAt)
    : undefined

  return {
    ...entry,
    accessedAt: currentTime,
    accessCount: entry.accessCount + 1,
    expiresAt,
    staleAt,
  }
}

/**
 * Records an access to an entry
 */
export function accessEntry<T>(entry: CacheEntry<T>): CacheEntry<T> {
  return {
    ...entry,
    accessedAt: now(),
    accessCount: entry.accessCount + 1,
  }
}

/**
 * Clones an entry (for immutability)
 */
export function cloneEntry<T>(entry: CacheEntry<T>): CacheEntry<T> {
  return {
    ...entry,
    tags: [...entry.tags],
    metadata: entry.metadata ? { ...entry.metadata } : undefined,
  }
}
