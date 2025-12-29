import type { CacheEntry, CacheStats } from '../types'
import { now } from '../utils/time'

/**
 * Statistics tracker for cache operations
 */
export class StatsTracker {
  private _hits = 0
  private _misses = 0
  private _sets = 0
  private _deletes = 0
  private _evictions = 0
  private _expirations = 0
  private startTime: number

  constructor() {
    this.startTime = now()
  }

  /**
   * Records a cache hit
   */
  recordHit(): void {
    this._hits++
  }

  /**
   * Records a cache miss
   */
  recordMiss(): void {
    this._misses++
  }

  /**
   * Records a set operation
   */
  recordSet(): void {
    this._sets++
  }

  /**
   * Records a delete operation
   */
  recordDelete(): void {
    this._deletes++
  }

  /**
   * Records an eviction
   */
  recordEviction(): void {
    this._evictions++
  }

  /**
   * Records an expiration
   */
  recordExpiration(): void {
    this._expirations++
  }

  /**
   * Gets the number of hits
   */
  get hits(): number {
    return this._hits
  }

  /**
   * Gets the number of misses
   */
  get misses(): number {
    return this._misses
  }

  /**
   * Gets the hit rate (0-1)
   */
  get hitRate(): number {
    const total = this._hits + this._misses
    return total === 0 ? 0 : this._hits / total
  }

  /**
   * Gets the number of set operations
   */
  get sets(): number {
    return this._sets
  }

  /**
   * Gets the number of delete operations
   */
  get deletes(): number {
    return this._deletes
  }

  /**
   * Gets the number of evictions
   */
  get evictions(): number {
    return this._evictions
  }

  /**
   * Gets the number of expirations
   */
  get expirations(): number {
    return this._expirations
  }

  /**
   * Gets the uptime in milliseconds
   */
  get uptime(): number {
    return now() - this.startTime
  }

  /**
   * Resets all statistics
   */
  reset(): void {
    this._hits = 0
    this._misses = 0
    this._sets = 0
    this._deletes = 0
    this._evictions = 0
    this._expirations = 0
    this.startTime = now()
  }

  /**
   * Generates full stats object
   */
  getStats<T>(
    entries: Map<string, CacheEntry<T>>,
    maxSize: number,
    maxMemory?: number
  ): CacheStats {
    const entriesArray = Array.from(entries.values())
    const memoryUsage = entriesArray.reduce((sum, entry) => sum + entry.size, 0)

    // Find oldest and newest entries
    let oldestEntry: string | undefined
    let newestEntry: string | undefined
    let oldestTime = Infinity
    let newestTime = 0

    // Calculate average TTL
    let ttlSum = 0
    let ttlCount = 0

    // Collect namespaces
    const namespaceSet = new Set<string>()

    for (const entry of entriesArray) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestEntry = entry.key
      }
      if (entry.createdAt > newestTime) {
        newestTime = entry.createdAt
        newestEntry = entry.key
      }
      if (entry.ttl !== undefined) {
        ttlSum += entry.ttl
        ttlCount++
      }
      if (entry.namespace) {
        namespaceSet.add(entry.namespace)
      }
      // Also extract namespace from key
      const colonIndex = entry.key.indexOf(':')
      if (colonIndex > 0) {
        namespaceSet.add(entry.key.slice(0, colonIndex))
      }
    }

    return {
      hits: this._hits,
      misses: this._misses,
      hitRate: this.hitRate,
      sets: this._sets,
      deletes: this._deletes,
      evictions: this._evictions,
      expirations: this._expirations,
      size: entries.size,
      maxSize,
      memoryUsage,
      maxMemory,
      namespaces: Array.from(namespaceSet),
      oldestEntry,
      newestEntry,
      avgTTL: ttlCount > 0 ? ttlSum / ttlCount : undefined,
      uptime: this.uptime,
    }
  }
}

/**
 * Creates a new stats tracker
 */
export function createStatsTracker(): StatsTracker {
  return new StatsTracker()
}
