import type {
  CacheConfig,
  CacheInstance,
  CacheEntry,
  CacheNamespace,
  CacheStats,
  CacheEvent,
  CacheEventHandler,
  CacheDump,
  SetOptions,
  GetOrSetOptions,
  MemoizeOptions,
  BatchSetEntry,
  Unsubscribe,
  CachePlugin,
  DeleteReason,
  CacheStrategy,
} from '../types'
import { createStrategy, isEntryStale, isEntryFresh, getStrategyName } from '../strategies'
import type { EvictionStrategy } from '../strategies'
import { EventEmitter } from '../events/emitter'
import { createEntry, updateEntry, accessEntry, touchEntry } from './entry'
import { StatsTracker } from './stats'
import { TagIndex } from './tags'
import { CacheNamespaceImpl } from './namespace'
import { isExpired, now, getRemainingTTL, getExpirationDate } from '../utils/time'
import { isValidKey, generateKeyFromArgs } from '../utils/key'
// Serializer utilities available but not used in memory cache

const DEFAULT_MAX_SIZE = 1000
const DEFAULT_CHECK_INTERVAL = 60000 // 1 minute

/**
 * Main cache implementation
 */
export class Cache<T = unknown> implements CacheInstance<T> {
  private _entries = new Map<string, CacheEntry<T>>()
  private strategy: EvictionStrategy<T>
  private emitter = new EventEmitter<T>()
  private stats = new StatsTracker()
  private tagIndex = new TagIndex()
  private namespaceRegistry = new Map<string, CacheNamespace<T>>()
  private plugins: CachePlugin<T>[] = []

  private _maxSize: number
  private _maxMemory?: number
  private _defaultTTL?: number
  private _defaultStaleTime?: number
  private _checkInterval: number
  private expirationTimer: ReturnType<typeof setInterval> | null = null
  private destroyed = false

  constructor(private config: CacheConfig<T> = {}) {
    // Initialize configuration
    this._maxSize = config.maxSize ?? DEFAULT_MAX_SIZE
    this._maxMemory = config.maxMemory
    this._defaultTTL = config.ttl
    this._defaultStaleTime = config.staleTime
    this._checkInterval = config.checkInterval ?? DEFAULT_CHECK_INTERVAL

    // Initialize strategy
    this.strategy = createStrategy<T>(config.strategy)

    // Initialize plugins
    if (config.plugins) {
      this.plugins = config.plugins
      this.plugins.forEach((plugin) => plugin.onInit?.(this))
    }

    // Setup event callbacks
    this.setupEventCallbacks()

    // Start expiration checker if TTL is used and checkInterval is not disabled
    if ((this._defaultTTL || this._checkInterval) && this._checkInterval !== 0) {
      this.startExpirationChecker()
    }
  }

  private setupEventCallbacks(): void {
    if (this.config.onHit) this.on('hit', this.config.onHit)
    if (this.config.onMiss) this.on('miss', this.config.onMiss)
    if (this.config.onSet) this.on('set', this.config.onSet)
    if (this.config.onDelete) this.on('delete', this.config.onDelete)
    if (this.config.onExpire) this.on('expire', this.config.onExpire)
    if (this.config.onEvict) this.on('evict', this.config.onEvict)
    if (this.config.onClear) this.on('clear', this.config.onClear)
  }

  private startExpirationChecker(): void {
    if (this.expirationTimer) return

    this.expirationTimer = setInterval(() => {
      this.prune()
    }, this._checkInterval)
  }

  private stopExpirationChecker(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer)
      this.expirationTimer = null
    }
  }

  // ===== BASIC OPERATIONS =====

  get(key: string): T | undefined
  get(key: string, defaultValue: T): T
  get(key: string, defaultValue?: T): T | undefined {
    this.ensureNotDestroyed()

    if (!isValidKey(key)) {
      return defaultValue
    }

    // Plugin hook
    this.plugins.forEach((p) => p.beforeGet?.(key))

    const entry = this._entries.get(key)

    if (!entry) {
      this.stats.recordMiss()
      this.emitter.emit('miss', { key })
      return defaultValue
    }

    // Check expiration
    if (isExpired(entry.expiresAt)) {
      this.deleteInternal(key, 'expire')
      this.stats.recordMiss()
      this.emitter.emit('miss', { key })
      return defaultValue
    }

    // Update access metadata
    const updatedEntry = accessEntry(entry)
    this._entries.set(key, updatedEntry)
    this.strategy.onAccess?.(updatedEntry)

    // Record hit
    this.stats.recordHit()
    this.emitter.emit('hit', {
      key,
      value: updatedEntry.value,
      entry: updatedEntry,
    })

    // Plugin hook
    let value: T | undefined = updatedEntry.value
    for (const plugin of this.plugins) {
      value = plugin.afterGet?.(key, value) ?? value
    }

    return value
  }

  set(key: string, value: T, options?: SetOptions): void {
    this.ensureNotDestroyed()

    if (!isValidKey(key)) {
      throw new Error('Invalid cache key: key must be a non-empty string')
    }

    // Plugin hook
    let finalValue = value
    let finalOptions = options
    for (const plugin of this.plugins) {
      const result = plugin.beforeSet?.(key, finalValue, finalOptions)
      if (result) {
        finalValue = result.value
        finalOptions = result.options
      }
    }

    const existing = this._entries.get(key)
    const isUpdate = existing !== undefined

    // Create or update entry
    const entry = isUpdate
      ? updateEntry(existing, finalValue, finalOptions, this._defaultTTL)
      : createEntry(key, finalValue, finalOptions, this._defaultTTL, this._defaultStaleTime)

    // Check if we need to evict
    if (!isUpdate && this._entries.size >= this._maxSize) {
      this.evict()
    }

    // Check memory limit
    if (this._maxMemory) {
      this.enforceMemoryLimit(entry.size)
    }

    // Store entry
    this._entries.set(key, entry)
    this.strategy.onSet?.(entry)

    // Update tag index
    if (entry.tags.length > 0) {
      this.tagIndex.setTags(key, entry.tags)
    }

    // Record stats
    this.stats.recordSet()

    // Emit event
    this.emitter.emit('set', {
      key,
      value: entry.value,
      entry,
      isUpdate,
    })

    // Plugin hook
    this.plugins.forEach((p) => p.afterSet?.(key, entry))
  }

  has(key: string): boolean {
    this.ensureNotDestroyed()

    if (!isValidKey(key)) return false

    const entry = this._entries.get(key)
    if (!entry) return false

    // Check expiration
    if (isExpired(entry.expiresAt)) {
      this.deleteInternal(key, 'expire')
      return false
    }

    return true
  }

  delete(key: string): boolean
  delete(keys: string[]): number
  delete(keyOrKeys: string | string[]): boolean | number {
    this.ensureNotDestroyed()

    if (Array.isArray(keyOrKeys)) {
      return this.deleteMany(keyOrKeys)
    }

    return this.deleteInternal(keyOrKeys, 'manual')
  }

  private deleteInternal(key: string, reason: DeleteReason): boolean {
    // Plugin hook
    for (const plugin of this.plugins) {
      if (plugin.beforeDelete?.(key) === false) {
        return false
      }
    }

    const entry = this._entries.get(key)
    if (!entry) return false

    this._entries.delete(key)
    this.tagIndex.removeKey(key)
    this.stats.recordDelete()

    if (reason === 'expire') {
      this.stats.recordExpiration()
      this.emitter.emit('expire', {
        key,
        value: entry.value,
        entry,
      })
    }

    this.emitter.emit('delete', {
      key,
      value: entry.value,
      reason,
    })

    // Plugin hook
    this.plugins.forEach((p) => p.afterDelete?.(key, entry.value))

    return true
  }

  clear(): void {
    this.ensureNotDestroyed()

    const count = this._entries.size

    this._entries.clear()
    this.tagIndex.clear()

    this.emitter.emit('clear', { count })
  }

  // ===== SIZE & STATE =====

  get size(): number {
    return this._entries.size
  }

  get isEmpty(): boolean {
    return this._entries.size === 0
  }

  get maxSize(): number {
    return this._maxSize
  }

  get memoryUsage(): number {
    let total = 0
    for (const entry of this._entries.values()) {
      total += entry.size
    }
    return total
  }

  // ===== TTL OPERATIONS =====

  getTTL(key: string): number | undefined {
    const entry = this._entries.get(key)
    if (!entry) return undefined
    return getRemainingTTL(entry.expiresAt)
  }

  setTTL(key: string, ttl: number): boolean {
    const entry = this._entries.get(key)
    if (!entry) return false

    const updatedEntry: CacheEntry<T> = {
      ...entry,
      ttl,
      expiresAt: now() + ttl,
    }
    this._entries.set(key, updatedEntry)
    return true
  }

  touch(key: string): boolean {
    const entry = this._entries.get(key)
    if (!entry) return false

    const updatedEntry = touchEntry(entry)
    this._entries.set(key, updatedEntry)
    return true
  }

  expire(key: string): boolean {
    return this.deleteInternal(key, 'expire')
  }

  getExpiration(key: string): Date | null {
    const entry = this._entries.get(key)
    if (!entry) return null
    return getExpirationDate(entry.expiresAt)
  }

  // ===== NAMESPACES =====

  namespace(name: string): CacheNamespace<T> {
    let ns = this.namespaceRegistry.get(name)
    if (!ns) {
      ns = new CacheNamespaceImpl(this, name)
      this.namespaceRegistry.set(name, ns)
    }
    return ns
  }

  getNamespace(name: string): CacheNamespace<T> | undefined {
    return this.namespaceRegistry.get(name)
  }

  clearNamespace(name: string): number {
    const prefix = `${name}:`
    const keysToDelete = this.keys().filter((key) => key.startsWith(prefix))
    return this.deleteMany(keysToDelete)
  }

  listNamespaces(): string[] {
    const namespaces = new Set<string>()

    for (const key of this._entries.keys()) {
      const colonIndex = key.indexOf(':')
      if (colonIndex > 0) {
        namespaces.add(key.slice(0, colonIndex))
      }
    }

    return Array.from(namespaces)
  }

  // ===== TAGS =====

  getTags(key: string): string[] {
    return this.tagIndex.getTags(key)
  }

  addTags(key: string, tags: string[]): boolean {
    const entry = this._entries.get(key)
    if (!entry) return false

    this.tagIndex.addTags(key, tags)
    entry.tags = [...new Set([...entry.tags, ...tags])]
    return true
  }

  removeTags(key: string, tags: string[]): boolean {
    const entry = this._entries.get(key)
    if (!entry) return false

    this.tagIndex.removeTags(key, tags)
    entry.tags = entry.tags.filter((t) => !tags.includes(t))
    return true
  }

  invalidateByTag(tag: string): number
  invalidateByTag(tags: string[]): number
  invalidateByTag(tagOrTags: string | string[]): number {
    const tags = Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags]
    const keys = this.tagIndex.getKeysByAnyTag(tags)
    return keys.reduce((count, key) => {
      return count + (this.deleteInternal(key, 'tag') ? 1 : 0)
    }, 0)
  }

  getKeysByTag(tag: string): string[]
  getKeysByTag(tags: string[]): string[]
  getKeysByTag(tagOrTags: string | string[]): string[] {
    if (Array.isArray(tagOrTags)) {
      return this.tagIndex.getKeysByTags(tagOrTags)
    }
    return this.tagIndex.getKeysByTag(tagOrTags)
  }

  // ===== STALE-WHILE-REVALIDATE =====

  isStale(key: string): boolean {
    const entry = this._entries.get(key)
    if (!entry) return false
    return isEntryStale(entry)
  }

  isFresh(key: string): boolean {
    const entry = this._entries.get(key)
    if (!entry) return false
    return isEntryFresh(entry)
  }

  async revalidate<R = T>(key: string, fetcher: () => R | Promise<R>): Promise<R> {
    const result = await Promise.resolve(fetcher())
    this.set(key, result as unknown as T)
    return result
  }

  // ===== GET OR SET (MEMOIZATION) =====

  getOrSet(key: string, factory: () => T, options?: GetOrSetOptions): T
  getOrSet(key: string, factory: () => Promise<T>, options?: GetOrSetOptions): Promise<T>
  getOrSet(
    key: string,
    factory: () => T | Promise<T>,
    options?: GetOrSetOptions
  ): T | Promise<T> {
    // Force refresh bypasses cache
    if (options?.forceRefresh) {
      const result = factory()
      if (result instanceof Promise) {
        return result.then((value) => {
          this.set(key, value, options)
          return value
        })
      }
      this.set(key, result, options)
      return result
    }

    // Check cache first
    const existing = this.get(key)
    if (existing !== undefined) {
      // If stale, trigger background revalidation
      if (this.isStale(key)) {
        Promise.resolve(factory()).then((value) => {
          this.set(key, value, options)
        }).catch(() => {
          // Ignore background revalidation errors
        })
      }
      return existing
    }

    // Execute factory
    const result = factory()
    if (result instanceof Promise) {
      return result.then((value) => {
        this.set(key, value, options)
        return value
      })
    }

    this.set(key, result, options)
    return result
  }

  memoize<Args extends unknown[], R>(
    fn: (...args: Args) => R,
    options?: MemoizeOptions<Args>
  ): (...args: Args) => R {
    const customKeyGen = options?.keyGenerator

    return (...args: Args): R => {
      const key = customKeyGen ? customKeyGen(...args) : generateKeyFromArgs(args)
      const cached = this.get(key) as R | undefined

      if (cached !== undefined) {
        return cached
      }

      const result = fn(...args)

      if (result instanceof Promise) {
        return result.then((value) => {
          this.set(key, value as unknown as T, {
            ttl: options?.ttl,
            tags: options?.tags,
          })
          return value
        }) as R
      }

      this.set(key, result as unknown as T, {
        ttl: options?.ttl,
        tags: options?.tags,
      })
      return result
    }
  }

  // ===== BATCH OPERATIONS =====

  getMany(keys: string[]): Map<string, T> {
    const result = new Map<string, T>()

    for (const key of keys) {
      const value = this.get(key)
      if (value !== undefined) {
        result.set(key, value)
      }
    }

    return result
  }

  setMany(entries: BatchSetEntry<T>[]): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, {
        ttl: entry.ttl,
        tags: entry.tags,
      })
    }
  }

  deleteMany(keys: string[]): number {
    let count = 0
    for (const key of keys) {
      if (this.deleteInternal(key, 'manual')) {
        count++
      }
    }
    return count
  }

  hasMany(keys: string[]): Map<string, boolean> {
    const result = new Map<string, boolean>()
    for (const key of keys) {
      result.set(key, this.has(key))
    }
    return result
  }

  async getOrSetMany(
    keys: string[],
    fetcher: (missingKeys: string[]) => BatchSetEntry<T>[] | Promise<BatchSetEntry<T>[]>,
    options?: GetOrSetOptions
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const missingKeys: string[] = []

    // Check cache for each key
    for (const key of keys) {
      const value = this.get(key)
      if (value !== undefined) {
        result.set(key, value)
      } else {
        missingKeys.push(key)
      }
    }

    // Fetch missing keys
    if (missingKeys.length > 0) {
      const fetched = await Promise.resolve(fetcher(missingKeys))

      for (const entry of fetched) {
        this.set(entry.key, entry.value, {
          ttl: entry.ttl ?? options?.ttl,
          tags: entry.tags ?? options?.tags,
        })
        result.set(entry.key, entry.value)
      }
    }

    return result
  }

  // ===== EVENTS =====

  on<E extends CacheEvent>(event: E, handler: CacheEventHandler<E, T>): Unsubscribe {
    return this.emitter.on(event, handler as (payload: unknown) => void)
  }

  off<E extends CacheEvent>(event: E, handler: CacheEventHandler<E, T>): void {
    this.emitter.off(event, handler as (payload: unknown) => void)
  }

  once<E extends CacheEvent>(event: E, handler: CacheEventHandler<E, T>): void {
    this.emitter.once(event, handler as (payload: unknown) => void)
  }

  // ===== STATISTICS =====

  getStats(): CacheStats {
    return this.stats.getStats(this._entries, this._maxSize, this._maxMemory)
  }

  get hits(): number {
    return this.stats.hits
  }

  get misses(): number {
    return this.stats.misses
  }

  get hitRate(): number {
    return this.stats.hitRate
  }

  resetStats(): void {
    this.stats.reset()
  }

  // ===== ITERATION =====

  keys(): string[]
  keys(filter: (key: string) => boolean): string[]
  keys(filter?: (key: string) => boolean): string[] {
    const allKeys = Array.from(this._entries.keys())
    return filter ? allKeys.filter(filter) : allKeys
  }

  values(): T[] {
    return Array.from(this._entries.values()).map((entry) => entry.value)
  }

  entries(): [string, T][] {
    return Array.from(this._entries.entries()).map(([key, entry]) => [key, entry.value])
  }

  forEach(callback: (value: T, key: string) => void): void {
    this._entries.forEach((entry, key) => {
      callback(entry.value, key)
    })
  }

  find(predicate: (value: T, key: string) => boolean): T | undefined {
    for (const [key, entry] of this._entries) {
      if (predicate(entry.value, key)) {
        return entry.value
      }
    }
    return undefined
  }

  filter(predicate: (value: T, key: string) => boolean): [string, T][] {
    const result: [string, T][] = []
    for (const [key, entry] of this._entries) {
      if (predicate(entry.value, key)) {
        result.push([key, entry.value])
      }
    }
    return result
  }

  // ===== MAINTENANCE =====

  prune(): number {
    const currentTime = now()
    let count = 0

    for (const [key, entry] of this._entries) {
      if (entry.expiresAt !== undefined && entry.expiresAt <= currentTime) {
        this.deleteInternal(key, 'expire')
        count++
      }
    }

    if (count > 0) {
      this.emitter.emit('prune', { count })
    }

    return count
  }

  resize(newMaxSize: number): number {
    if (newMaxSize < 1) {
      throw new Error('maxSize must be at least 1')
    }

    this._maxSize = newMaxSize
    let evicted = 0

    // Use direct eviction for resize to avoid the +1 logic in strategy
    while (this._entries.size > this._maxSize) {
      const entriesArray = Array.from(this._entries.values())
      // Sort by accessedAt ascending (oldest access first) for LRU behavior
      const sorted = [...entriesArray].sort((a, b) => a.accessedAt - b.accessedAt)
      const keyToEvict = sorted[0]?.key

      if (keyToEvict) {
        const entry = this._entries.get(keyToEvict)
        if (entry) {
          this._entries.delete(keyToEvict)
          this.tagIndex.removeKey(keyToEvict)
          this.stats.recordEviction()

          this.emitter.emit('evict', {
            key: keyToEvict,
            value: entry.value,
            entry,
            strategy: getStrategyName(this.config.strategy) as CacheStrategy | 'memory' | 'custom',
          })

          this.emitter.emit('delete', {
            key: keyToEvict,
            value: entry.value,
            reason: 'evict',
          })

          evicted++
        }
      } else {
        break // No more entries to evict
      }
    }

    return evicted
  }

  private evict(): void {
    const entriesArray = Array.from(this._entries.values())
    const keysToEvict = this.strategy.shouldEvict(entriesArray, this._maxSize, {
      currentSize: this._entries.size,
      maxSize: this._maxSize,
      maxMemory: this._maxMemory,
      currentMemory: this.memoryUsage,
    })

    for (const key of keysToEvict) {
      const entry = this._entries.get(key)
      if (entry) {
        this._entries.delete(key)
        this.tagIndex.removeKey(key)
        this.stats.recordEviction()

        this.emitter.emit('evict', {
          key,
          value: entry.value,
          entry,
          strategy: getStrategyName(this.config.strategy) as CacheStrategy | 'memory' | 'custom',
        })

        this.emitter.emit('delete', {
          key,
          value: entry.value,
          reason: 'evict',
        })
      }
    }
  }

  private enforceMemoryLimit(newEntrySize: number): void {
    if (!this._maxMemory) return

    const currentUsage = this.memoryUsage
    const targetUsage = this._maxMemory - newEntrySize

    if (currentUsage <= targetUsage) return

    // Sort entries by access time and evict oldest until under limit
    const sortedEntries = Array.from(this._entries.entries()).sort(
      ([, a], [, b]) => a.accessedAt - b.accessedAt
    )

    let freed = 0
    for (const [key, entry] of sortedEntries) {
      if (currentUsage - freed <= targetUsage) break

      this._entries.delete(key)
      this.tagIndex.removeKey(key)
      this.stats.recordEviction()

      this.emitter.emit('evict', {
        key,
        value: entry.value,
        entry,
        strategy: 'memory',
      })

      freed += entry.size
    }
  }

  // ===== SERIALIZATION =====

  dump(): CacheDump<T> {
    return {
      version: '1.0.0',
      createdAt: now(),
      entries: Array.from(this._entries.values()),
      stats: {
        hits: this.stats.hits,
        misses: this.stats.misses,
        sets: this.stats.sets,
        deletes: this.stats.deletes,
        evictions: this.stats.evictions,
        expirations: this.stats.expirations,
      },
    }
  }

  restore(dump: CacheDump<T>): void {
    this.clear()

    const currentTime = now()

    for (const entry of dump.entries) {
      // Skip expired entries
      if (entry.expiresAt !== undefined && entry.expiresAt <= currentTime) {
        continue
      }

      this._entries.set(entry.key, entry)

      if (entry.tags.length > 0) {
        this.tagIndex.setTags(entry.key, entry.tags)
      }
    }
  }

  // ===== LIFECYCLE =====

  destroy(): void {
    if (this.destroyed) return

    this.destroyed = true
    this.stopExpirationChecker()
    this.plugins.forEach((p) => p.onDestroy?.(this))
    this._entries.clear()
    this.tagIndex.clear()
    this.namespaceRegistry.clear()
    this.emitter.removeAllListeners()
  }

  // ===== INTERNAL =====

  getEntry(key: string): CacheEntry<T> | undefined {
    return this._entries.get(key)
  }

  private ensureNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('Cache has been destroyed')
    }
  }

  // ===== ITERATOR =====

  [Symbol.iterator](): Iterator<[string, T]> {
    const entriesIterator = this._entries.entries()

    return {
      next: (): IteratorResult<[string, T]> => {
        const result = entriesIterator.next()
        if (result.done) {
          return { done: true, value: undefined }
        }
        const [key, entry] = result.value
        return { done: false, value: [key, entry.value] }
      },
    }
  }
}

/**
 * Creates a new cache instance
 */
export function createCache<T = unknown>(config?: CacheConfig<T>): CacheInstance<T> {
  return new Cache<T>(config)
}
