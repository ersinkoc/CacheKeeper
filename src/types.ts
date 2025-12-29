// ============ CACHE STRATEGIES ============

/**
 * Built-in cache eviction strategies
 */
export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl' | 'swr'

/**
 * Context provided during eviction decisions
 */
export interface EvictionContext {
  currentSize: number
  maxSize: number
  maxMemory?: number
  currentMemory: number
}

/**
 * Custom eviction strategy interface
 */
export interface CustomStrategy<T = unknown> {
  /**
   * Determine which keys to evict when cache is full
   */
  shouldEvict: (entries: CacheEntry<T>[], maxSize: number, context: EvictionContext) => string[]

  /**
   * Called when an entry is accessed
   */
  onAccess?: (entry: CacheEntry<T>) => void

  /**
   * Called when an entry is set
   */
  onSet?: (entry: CacheEntry<T>) => void
}

// ============ CACHE ENTRY ============

/**
 * Individual cache entry with metadata
 */
export interface CacheEntry<T = unknown> {
  key: string
  value: T
  createdAt: number
  updatedAt: number
  accessedAt: number
  accessCount: number
  size: number
  ttl?: number
  expiresAt?: number
  staleAt?: number
  tags: string[]
  namespace?: string
  metadata?: Record<string, unknown>
}

// ============ STORAGE ============

/**
 * Built-in storage types
 */
export type StorageType = 'memory' | 'local' | 'session'

/**
 * Storage adapter interface for custom storage backends
 */
export interface StorageAdapter {
  get: (key: string) => string | null | Promise<string | null>
  set: (key: string, value: string) => void | Promise<void>
  delete: (key: string) => void | Promise<void>
  clear: () => void | Promise<void>
  keys: () => string[] | Promise<string[]>
  has: (key: string) => boolean | Promise<boolean>
  size: () => number | Promise<number>
}

// ============ SERIALIZER ============

/**
 * Custom serializer interface
 */
export interface Serializer<T = unknown> {
  serialize: (value: T) => string
  deserialize: (data: string) => T
}

// ============ SET OPTIONS ============

/**
 * Options for set operation
 */
export interface SetOptions {
  ttl?: number
  tags?: string[]
  stale?: number
  revalidate?: number
  metadata?: Record<string, unknown>
}

// ============ GET OR SET OPTIONS ============

/**
 * Options for getOrSet operation
 */
export interface GetOrSetOptions extends SetOptions {
  forceRefresh?: boolean
}

// ============ EVENTS ============

/**
 * Cache hit event payload
 */
export interface HitEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
}

/**
 * Cache miss event payload
 */
export interface MissEvent {
  key: string
}

/**
 * Cache set event payload
 */
export interface SetEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
  isUpdate: boolean
}

/**
 * Delete reason types
 */
export type DeleteReason = 'manual' | 'expire' | 'evict' | 'clear' | 'tag'

/**
 * Cache delete event payload
 */
export interface DeleteEvent<T> {
  key: string
  value: T
  reason: DeleteReason
}

/**
 * Cache expire event payload
 */
export interface ExpireEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
}

/**
 * Cache evict event payload
 */
export interface EvictEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
  strategy: CacheStrategy | 'memory' | 'custom'
}

/**
 * Cache clear event payload
 */
export interface ClearEvent {
  count: number
  namespace?: string
}

/**
 * Cache prune event payload
 */
export interface PruneEvent {
  count: number
}

/**
 * All cache event types
 */
export type CacheEvent = 'hit' | 'miss' | 'set' | 'delete' | 'expire' | 'evict' | 'clear' | 'prune'

/**
 * Event handler type mapping
 */
export type CacheEventHandler<E extends CacheEvent, T> = E extends 'hit'
  ? (event: HitEvent<T>) => void
  : E extends 'miss'
    ? (event: MissEvent) => void
    : E extends 'set'
      ? (event: SetEvent<T>) => void
      : E extends 'delete'
        ? (event: DeleteEvent<T>) => void
        : E extends 'expire'
          ? (event: ExpireEvent<T>) => void
          : E extends 'evict'
            ? (event: EvictEvent<T>) => void
            : E extends 'clear'
              ? (event: ClearEvent) => void
              : E extends 'prune'
                ? (event: PruneEvent) => void
                : never

/**
 * Event map for internal use
 */
export interface CacheEventMap<T> {
  hit: HitEvent<T>
  miss: MissEvent
  set: SetEvent<T>
  delete: DeleteEvent<T>
  expire: ExpireEvent<T>
  evict: EvictEvent<T>
  clear: ClearEvent
  prune: PruneEvent
}

// ============ STATISTICS ============

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  sets: number
  deletes: number
  evictions: number
  expirations: number
  size: number
  maxSize: number
  memoryUsage: number
  maxMemory?: number
  namespaces: string[]
  oldestEntry?: string
  newestEntry?: string
  avgTTL?: number
  uptime: number
}

// ============ NAMESPACE ============

/**
 * Cache namespace interface
 */
export interface CacheNamespace<T = unknown> {
  readonly name: string
  readonly fullPath: string

  // Basic operations
  get(key: string): T | undefined
  get(key: string, defaultValue: T): T
  set(key: string, value: T, options?: SetOptions): void
  has(key: string): boolean
  delete(key: string): boolean
  clear(): void

  // Queries
  keys(): string[]
  values(): T[]
  entries(): [string, T][]
  readonly size: number

  // Nested namespace
  namespace(name: string): CacheNamespace<T>

  // Stats
  getStats(): CacheStats
}

// ============ PLUGIN ============

/**
 * Cache plugin interface
 */
export interface CachePlugin<T = unknown> {
  name: string

  // Lifecycle hooks
  onInit?: (cache: CacheInstance<T>) => void
  onDestroy?: (cache: CacheInstance<T>) => void

  // Operation hooks
  beforeGet?: (key: string) => void
  afterGet?: (key: string, value: T | undefined) => T | undefined
  beforeSet?: (
    key: string,
    value: T,
    options?: SetOptions
  ) => { value: T; options?: SetOptions } | void
  afterSet?: (key: string, entry: CacheEntry<T>) => void
  beforeDelete?: (key: string) => boolean
  afterDelete?: (key: string, value: T) => void

  // Serialization hooks
  beforeSerialize?: (value: T) => T
  afterDeserialize?: (value: T) => T
}

// ============ HELPER TYPES ============

/**
 * Memoization options
 */
export interface MemoizeOptions<Args extends unknown[]> {
  keyGenerator?: (...args: Args) => string
  ttl?: number
  tags?: string[]
  maxSize?: number
}

/**
 * Batch set entry
 */
export interface BatchSetEntry<T> {
  key: string
  value: T
  ttl?: number
  tags?: string[]
}

/**
 * Cache dump structure
 */
export interface CacheDump<T> {
  version: string
  createdAt: number
  entries: CacheEntry<T>[]
  stats: Partial<CacheStats>
  metadata?: Record<string, unknown>
}

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void

// ============ CACHE CONFIG ============

/**
 * Cache configuration options
 */
export interface CacheConfig<T = unknown> {
  // Strategy
  strategy?: CacheStrategy | CustomStrategy<T>

  // Limits
  maxSize?: number
  maxMemory?: number

  // TTL
  ttl?: number
  checkInterval?: number

  // SWR
  staleTime?: number
  revalidateTime?: number

  // Storage
  storage?: StorageType | StorageAdapter
  storageKey?: string

  // Serialization
  serializer?: Serializer<T>

  // Plugins
  plugins?: CachePlugin<T>[]

  // Callbacks
  onHit?: (event: HitEvent<T>) => void
  onMiss?: (event: MissEvent) => void
  onSet?: (event: SetEvent<T>) => void
  onDelete?: (event: DeleteEvent<T>) => void
  onExpire?: (event: ExpireEvent<T>) => void
  onEvict?: (event: EvictEvent<T>) => void
  onClear?: (event: ClearEvent) => void
}

// ============ CACHE INSTANCE ============

/**
 * Main cache instance interface
 */
export interface CacheInstance<T = unknown> {
  // ===== BASIC OPERATIONS =====
  get(key: string): T | undefined
  get(key: string, defaultValue: T): T
  set(key: string, value: T, options?: SetOptions): void
  has(key: string): boolean
  delete(key: string): boolean
  delete(keys: string[]): number
  clear(): void

  // ===== SIZE & STATE =====
  readonly size: number
  readonly isEmpty: boolean
  readonly maxSize: number
  readonly memoryUsage: number

  // ===== TTL OPERATIONS =====
  getTTL(key: string): number | undefined
  setTTL(key: string, ttl: number): boolean
  touch(key: string): boolean
  expire(key: string): boolean
  getExpiration(key: string): Date | null

  // ===== NAMESPACES =====
  namespace(name: string): CacheNamespace<T>
  getNamespace(name: string): CacheNamespace<T> | undefined
  clearNamespace(name: string): number
  listNamespaces(): string[]

  // ===== TAGS =====
  getTags(key: string): string[]
  addTags(key: string, tags: string[]): boolean
  removeTags(key: string, tags: string[]): boolean
  invalidateByTag(tag: string): number
  invalidateByTag(tags: string[]): number
  getKeysByTag(tag: string): string[]
  getKeysByTag(tags: string[]): string[]

  // ===== STALE-WHILE-REVALIDATE =====
  isStale(key: string): boolean
  isFresh(key: string): boolean
  revalidate<R = T>(key: string, fetcher: () => R | Promise<R>): Promise<R>

  // ===== GET OR SET (MEMOIZATION) =====
  getOrSet(key: string, factory: () => T, options?: GetOrSetOptions): T
  getOrSet(key: string, factory: () => Promise<T>, options?: GetOrSetOptions): Promise<T>

  memoize<Args extends unknown[], R>(
    fn: (...args: Args) => R,
    options?: MemoizeOptions<Args>
  ): (...args: Args) => R

  memoize<Args extends unknown[], R>(
    fn: (...args: Args) => Promise<R>,
    options?: MemoizeOptions<Args>
  ): (...args: Args) => Promise<R>

  // ===== BATCH OPERATIONS =====
  getMany(keys: string[]): Map<string, T>
  setMany(entries: BatchSetEntry<T>[]): void
  deleteMany(keys: string[]): number
  hasMany(keys: string[]): Map<string, boolean>
  getOrSetMany(
    keys: string[],
    fetcher: (missingKeys: string[]) => BatchSetEntry<T>[] | Promise<BatchSetEntry<T>[]>,
    options?: GetOrSetOptions
  ): Promise<Map<string, T>>

  // ===== EVENTS =====
  on<E extends CacheEvent>(event: E, handler: CacheEventHandler<E, T>): Unsubscribe
  off<E extends CacheEvent>(event: E, handler: CacheEventHandler<E, T>): void
  once<E extends CacheEvent>(event: E, handler: CacheEventHandler<E, T>): void

  // ===== STATISTICS =====
  getStats(): CacheStats
  readonly hits: number
  readonly misses: number
  readonly hitRate: number
  resetStats(): void

  // ===== ITERATION =====
  keys(): string[]
  keys(filter: (key: string) => boolean): string[]
  values(): T[]
  entries(): [string, T][]
  forEach(callback: (value: T, key: string) => void): void
  find(predicate: (value: T, key: string) => boolean): T | undefined
  filter(predicate: (value: T, key: string) => boolean): [string, T][]

  // ===== MAINTENANCE =====
  prune(): number
  resize(maxSize: number): number

  // ===== SERIALIZATION =====
  dump(): CacheDump<T>
  restore(dump: CacheDump<T>): void

  // ===== LIFECYCLE =====
  destroy(): void

  // ===== INTERNAL =====
  getEntry(key: string): CacheEntry<T> | undefined

  // ===== ITERATOR =====
  [Symbol.iterator](): Iterator<[string, T]>
}

// ============ REACT ADAPTER TYPES ============

/**
 * Options for useCachedValue hook
 */
export interface UseCachedValueOptions<T> {
  fetcher?: () => T | Promise<T>
  ttl?: number
  staleTime?: number
  tags?: string[]
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

/**
 * Result from useCachedValue hook
 */
export interface UseCachedValueResult<T> {
  data: T | undefined
  isLoading: boolean
  isCached: boolean
  isStale: boolean
  isFetching: boolean
  error: Error | null
  refresh: () => Promise<void>
  invalidate: () => void
}

/**
 * Options for useCachedQuery hook
 */
export interface UseCachedQueryOptions<T> {
  ttl?: number
  staleTime?: number
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  revalidateInterval?: number
  dedupingInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

/**
 * Result from useCachedQuery hook
 */
export interface UseCachedQueryResult<T> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T | Promise<T> | ((current: T | undefined) => T)) => Promise<void>
}

/**
 * Result from useCacheInvalidation hook
 */
export interface UseCacheInvalidationResult {
  invalidate: (key: string) => void
  invalidateByTag: (tag: string | string[]) => number
  clear: () => void
}

/**
 * Options for useCacheStats hook
 */
export interface UseCacheStatsOptions {
  refreshInterval?: number
}
