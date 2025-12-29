# CacheKeeper - Zero-Dependency Caching Toolkit

## Package Identity

- **NPM Package**: `@oxog/cachekeeper`
- **GitHub Repository**: `https://github.com/ersinkoc/cachekeeper`
- **Documentation Site**: `https://cachekeeper.oxog.dev`
- **License**: MIT
- **Author**: Ersin KOÇ
- **Created**: 2025-12-29

**NO social media, Discord, email, or external links.**

## Package Description

Zero-dependency caching toolkit with multiple eviction strategies, TTL support, and flexible storage backends.

CacheKeeper is a powerful, lightweight caching library that handles in-memory caching, memoization, and data persistence with multiple eviction strategies (LRU, LFU, FIFO, TTL, SWR). Features include namespaces for organized cache groups, tag-based invalidation, stale-while-revalidate pattern, comprehensive event system, detailed statistics, and pluggable storage backends. Framework-agnostic core with a dedicated React adapter—all under 4KB with zero runtime dependencies.

---

## NON-NEGOTIABLE RULES

These rules are ABSOLUTE and must be followed without exception:

### 1. ZERO DEPENDENCIES
```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```
Implement EVERYTHING from scratch. No runtime dependencies allowed.

### 2. 100% TEST COVERAGE & 100% SUCCESS RATE
- Every line of code must be tested
- Every branch must be tested
- All tests must pass (100% success rate)
- Use Vitest for testing
- Coverage report must show 100%

### 3. DEVELOPMENT WORKFLOW
Create these documents FIRST, before any code:
1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions
3. **TASKS.md** - Ordered task list with dependencies

Only after these documents are complete, implement the code following TASKS.md sequentially.

### 4. TYPESCRIPT STRICT MODE
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 5. NO EXTERNAL LINKS
- ❌ No social media (Twitter, LinkedIn, etc.)
- ❌ No Discord/Slack links
- ❌ No email addresses
- ❌ No donation/sponsor links
- ✅ Only GitHub repo and documentation site allowed

### 6. BUNDLE SIZE TARGET
- Core package: < 4KB minified + gzipped
- With React adapter: < 6KB
- Tree-shakeable

---

## CORE TYPES

```typescript
// ============ CACHE STRATEGIES ============

type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl' | 'swr'

interface CustomStrategy<T = unknown> {
  /**
   * Determine which keys to evict when cache is full
   */
  shouldEvict: (
    entries: CacheEntry<T>[],
    maxSize: number,
    context: EvictionContext
  ) => string[]
  
  /**
   * Called when an entry is accessed
   */
  onAccess?: (entry: CacheEntry<T>) => void
  
  /**
   * Called when an entry is set
   */
  onSet?: (entry: CacheEntry<T>) => void
}

interface EvictionContext {
  currentSize: number
  maxSize: number
  maxMemory?: number
  currentMemory: number
}

// ============ CACHE ENTRY ============

interface CacheEntry<T = unknown> {
  key: string
  value: T
  createdAt: number
  updatedAt: number
  accessedAt: number
  accessCount: number
  size: number              // Approximate memory size in bytes
  ttl?: number              // Time to live in ms
  expiresAt?: number        // Timestamp when entry expires
  staleAt?: number          // Timestamp when entry becomes stale (SWR)
  tags: string[]
  namespace?: string
  metadata?: Record<string, unknown>
}

// ============ CACHE CONFIG ============

interface CacheConfig<T = unknown> {
  // Strategy
  strategy?: CacheStrategy | CustomStrategy<T>
  
  // Limits
  maxSize?: number                    // Max number of items (default: 1000)
  maxMemory?: number                  // Max memory in bytes
  
  // TTL
  ttl?: number                        // Default TTL in ms
  checkInterval?: number              // Expiration check interval (default: 60000)
  
  // SWR
  staleTime?: number                  // Time until stale (SWR mode)
  revalidateTime?: number             // Time until revalidate (SWR mode)
  
  // Storage
  storage?: StorageType | StorageAdapter
  storageKey?: string                 // Prefix for storage keys
  
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

type StorageType = 'memory' | 'local' | 'session'

// ============ STORAGE ADAPTER ============

interface StorageAdapter {
  get: (key: string) => string | null | Promise<string | null>
  set: (key: string, value: string) => void | Promise<void>
  delete: (key: string) => void | Promise<void>
  clear: () => void | Promise<void>
  keys: () => string[] | Promise<string[]>
  has: (key: string) => boolean | Promise<boolean>
  size: () => number | Promise<number>
}

// ============ SERIALIZER ============

interface Serializer<T = unknown> {
  serialize: (value: T) => string
  deserialize: (data: string) => T
}

// ============ SET OPTIONS ============

interface SetOptions {
  ttl?: number                        // Override default TTL
  tags?: string[]                     // Tags for invalidation
  stale?: number                      // Stale time (SWR)
  revalidate?: number                 // Revalidate time (SWR)
  metadata?: Record<string, unknown>  // Custom metadata
}

// ============ GET OR SET OPTIONS ============

interface GetOrSetOptions extends SetOptions {
  forceRefresh?: boolean              // Bypass cache and fetch fresh
}

// ============ EVENTS ============

interface HitEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
}

interface MissEvent {
  key: string
}

interface SetEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
  isUpdate: boolean
}

interface DeleteEvent<T> {
  key: string
  value: T
  reason: DeleteReason
}

type DeleteReason = 'manual' | 'expire' | 'evict' | 'clear' | 'tag'

interface ExpireEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
}

interface EvictEvent<T> {
  key: string
  value: T
  entry: CacheEntry<T>
  strategy: CacheStrategy | 'memory' | 'custom'
}

interface ClearEvent {
  count: number
  namespace?: string
}

type CacheEvent = 
  | 'hit' 
  | 'miss' 
  | 'set' 
  | 'delete' 
  | 'expire' 
  | 'evict' 
  | 'clear'
  | 'prune'

// ============ STATISTICS ============

interface CacheStats {
  hits: number
  misses: number
  hitRate: number                     // 0-1
  sets: number
  deletes: number
  evictions: number
  expirations: number
  size: number                        // Current item count
  maxSize: number
  memoryUsage: number                 // Bytes
  maxMemory?: number
  namespaces: string[]
  oldestEntry?: string
  newestEntry?: string
  avgTTL?: number
  uptime: number                      // ms since creation
}

// ============ NAMESPACE ============

interface CacheNamespace<T = unknown> {
  readonly name: string
  readonly fullPath: string           // e.g., 'user:admin'
  
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
  size: number
  
  // Nested namespace
  namespace(name: string): CacheNamespace<T>
  
  // Stats
  getStats(): CacheStats
}

// ============ PLUGIN ============

interface CachePlugin<T = unknown> {
  name: string
  
  // Lifecycle hooks
  onInit?: (cache: CacheInstance<T>) => void
  onDestroy?: (cache: CacheInstance<T>) => void
  
  // Operation hooks
  beforeGet?: (key: string) => void
  afterGet?: (key: string, value: T | undefined) => T | undefined
  beforeSet?: (key: string, value: T, options?: SetOptions) => { value: T; options?: SetOptions }
  afterSet?: (key: string, entry: CacheEntry<T>) => void
  beforeDelete?: (key: string) => boolean  // Return false to prevent delete
  afterDelete?: (key: string, value: T) => void
  
  // Serialization hooks
  beforeSerialize?: (value: T) => T
  afterDeserialize?: (value: T) => T
}

// ============ CACHE INSTANCE ============

interface CacheInstance<T = unknown> {
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
  getTTL(key: string): number | undefined     // Remaining TTL in ms
  setTTL(key: string, ttl: number): boolean
  touch(key: string): boolean                 // Refresh TTL
  expire(key: string): boolean                // Expire immediately
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
  getKeysByTag(tags: string[]): string[]      // Intersection
  
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
  prune(): number                             // Remove expired entries
  resize(maxSize: number): number             // Resize and evict if needed
  
  // ===== SERIALIZATION =====
  dump(): CacheDump<T>
  restore(dump: CacheDump<T>): void
  
  // ===== LIFECYCLE =====
  destroy(): void
  
  // ===== ITERATOR =====
  [Symbol.iterator](): Iterator<[string, T]>
}

// ============ HELPER TYPES ============

interface MemoizeOptions<Args extends unknown[]> {
  keyGenerator?: (...args: Args) => string
  ttl?: number
  tags?: string[]
  maxSize?: number                    // Max memoized entries
}

interface BatchSetEntry<T> {
  key: string
  value: T
  ttl?: number
  tags?: string[]
}

interface CacheDump<T> {
  version: string
  createdAt: number
  entries: CacheEntry<T>[]
  stats: Partial<CacheStats>
  metadata?: Record<string, unknown>
}

type Unsubscribe = () => void

type CacheEventHandler<E extends CacheEvent, T> = 
  E extends 'hit' ? (event: HitEvent<T>) => void :
  E extends 'miss' ? (event: MissEvent) => void :
  E extends 'set' ? (event: SetEvent<T>) => void :
  E extends 'delete' ? (event: DeleteEvent<T>) => void :
  E extends 'expire' ? (event: ExpireEvent<T>) => void :
  E extends 'evict' ? (event: EvictEvent<T>) => void :
  E extends 'clear' ? (event: ClearEvent) => void :
  E extends 'prune' ? (event: { count: number }) => void :
  never
```

---

## FACTORY FUNCTION

```typescript
import { createCache } from '@oxog/cachekeeper'

// Basic usage
const cache = createCache()

// With configuration
const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  ttl: 5 * 60 * 1000,  // 5 minutes
})

// Full configuration
const cache = createCache<UserData>({
  // Strategy
  strategy: 'lru',                    // 'lru' | 'lfu' | 'fifo' | 'ttl' | 'swr'
  
  // Limits
  maxSize: 1000,                      // Max items
  maxMemory: 50 * 1024 * 1024,        // 50MB max memory
  
  // TTL
  ttl: 5 * 60 * 1000,                 // 5 minutes default TTL
  checkInterval: 60 * 1000,           // Check expired every 1 min
  
  // Storage
  storage: 'memory',                  // 'memory' | 'local' | 'session'
  storageKey: 'my-app-cache',         // Prefix for storage keys
  
  // Serialization
  serializer: JSON,                   // { serialize, deserialize }
  
  // Callbacks
  onHit: ({ key, value }) => {
    console.log('Cache hit:', key)
  },
  onMiss: ({ key }) => {
    console.log('Cache miss:', key)
  },
  onSet: ({ key, value, isUpdate }) => {
    console.log(isUpdate ? 'Updated:' : 'Added:', key)
  },
  onDelete: ({ key, reason }) => {
    console.log('Deleted:', key, 'Reason:', reason)
  },
  onExpire: ({ key }) => {
    console.log('Expired:', key)
  },
  onEvict: ({ key, strategy }) => {
    console.log('Evicted:', key, 'By:', strategy)
  },
})
```

---

## BASIC OPERATIONS

```typescript
// ===== SET =====

// Simple set
cache.set('user:1', { name: 'Ersin', age: 30 })

// With TTL
cache.set('session', sessionData, { ttl: 3600000 })  // 1 hour

// With tags
cache.set('product:1', productData, {
  ttl: 300000,
  tags: ['products', 'electronics', 'featured'],
})

// With metadata
cache.set('config', configData, {
  metadata: { source: 'api', version: '1.2' },
})


// ===== GET =====

// Basic get
const user = cache.get('user:1')
// Returns: { name: 'Ersin', age: 30 } | undefined

// With default value
const user = cache.get('user:999', { name: 'Guest' })
// Returns: { name: 'Guest' } if not found


// ===== HAS =====

if (cache.has('user:1')) {
  console.log('User exists in cache')
}


// ===== DELETE =====

// Single delete
cache.delete('user:1')  // Returns true if existed

// Batch delete
const deletedCount = cache.delete(['user:1', 'user:2', 'user:3'])
// Returns: number of deleted items


// ===== CLEAR =====

cache.clear()  // Removes all entries


// ===== SIZE & STATE =====

console.log('Size:', cache.size)           // Current item count
console.log('Is empty:', cache.isEmpty)    // boolean
console.log('Max size:', cache.maxSize)    // Configured max size
console.log('Memory:', cache.memoryUsage)  // Bytes used
```

---

## TTL & EXPIRATION

```typescript
// ===== SET WITH TTL =====

cache.set('session', sessionData, { ttl: 3600000 })  // 1 hour


// ===== GET REMAINING TTL =====

const remainingTTL = cache.getTTL('session')
// Returns: ms remaining, -1 if no TTL, undefined if not exists

if (remainingTTL !== undefined && remainingTTL < 60000) {
  console.log('Session expiring in less than 1 minute!')
}


// ===== UPDATE TTL =====

cache.setTTL('session', 7200000)  // Extend to 2 hours


// ===== TOUCH (REFRESH TTL) =====

cache.touch('session')  // Reset to original TTL
// Useful for "sliding expiration"


// ===== EXPIRE IMMEDIATELY =====

cache.expire('session')  // Triggers onExpire callback


// ===== GET EXPIRATION DATE =====

const expiresAt = cache.getExpiration('session')
// Returns: Date | null

if (expiresAt) {
  console.log('Expires at:', expiresAt.toISOString())
}


// ===== PRUNE EXPIRED =====

const prunedCount = cache.prune()
console.log(`Removed ${prunedCount} expired entries`)
```

---

## NAMESPACES

```typescript
// ===== CREATE NAMESPACE =====

const userCache = cache.namespace('user')
const apiCache = cache.namespace('api')
const sessionCache = cache.namespace('session')


// ===== NAMESPACE OPERATIONS =====

// Set (stored as 'user:1' internally)
userCache.set('1', { name: 'Ersin', email: 'ersin@test.com' })
userCache.set('2', { name: 'Ali', email: 'ali@test.com' })

// Get
const user = userCache.get('1')

// Delete
userCache.delete('1')

// Clear namespace only
userCache.clear()  // Only clears 'user:*', not other namespaces

// Size
console.log('Users cached:', userCache.size)


// ===== NESTED NAMESPACES =====

const adminCache = userCache.namespace('admin')
adminCache.set('1', adminData)  // Stored as 'user:admin:1'

const superAdminCache = adminCache.namespace('super')
superAdminCache.set('1', data)  // Stored as 'user:admin:super:1'


// ===== LIST KEYS IN NAMESPACE =====

const userKeys = userCache.keys()
// ['1', '2', 'admin:1', 'admin:super:1']


// ===== NAMESPACE FROM MAIN CACHE =====

// Direct access
cache.set('user:1', userData)
cache.set('user:2', userData)

// Get namespace instance
const users = cache.getNamespace('user')

// Clear namespace from main cache
cache.clearNamespace('user')  // Clears all 'user:*'

// List all namespaces
const namespaces = cache.listNamespaces()
// ['user', 'api', 'session']


// ===== NAMESPACE STATS =====

const userStats = userCache.getStats()
console.log('User cache hit rate:', userStats.hitRate)
```

---

## TAGS

```typescript
// ===== SET WITH TAGS =====

cache.set('product:1', product1, {
  tags: ['products', 'electronics', 'featured'],
})

cache.set('product:2', product2, {
  tags: ['products', 'clothing'],
})

cache.set('product:3', product3, {
  tags: ['products', 'electronics', 'sale'],
})

cache.set('category:1', category, {
  tags: ['categories', 'featured'],
})


// ===== GET TAGS =====

const tags = cache.getTags('product:1')
// ['products', 'electronics', 'featured']


// ===== ADD TAGS =====

cache.addTags('product:1', ['sale', 'recommended'])
// Now: ['products', 'electronics', 'featured', 'sale', 'recommended']


// ===== REMOVE TAGS =====

cache.removeTags('product:1', ['featured'])
// Now: ['products', 'electronics', 'sale', 'recommended']


// ===== INVALIDATE BY TAG =====

// Single tag
const count = cache.invalidateByTag('featured')
// Deletes: product:1, category:1
// Returns: 2

// Multiple tags (OR logic - matches any)
const count = cache.invalidateByTag(['electronics', 'clothing'])
// Deletes: product:1, product:2, product:3
// Returns: 3


// ===== GET KEYS BY TAG =====

// Single tag
const electronicKeys = cache.getKeysByTag('products')
// ['product:1', 'product:2', 'product:3']

// Multiple tags (intersection - matches all)
const featuredElectronics = cache.getKeysByTag(['products', 'electronics'])
// ['product:1', 'product:3']
```

---

## STALE-WHILE-REVALIDATE (SWR)

```typescript
// ===== CREATE SWR CACHE =====

const cache = createCache({
  strategy: 'swr',
  staleTime: 60000,         // Fresh for 1 min
  revalidateTime: 300000,   // Must revalidate within 5 min
})


// ===== PER-KEY SWR =====

cache.set('api:users', users, {
  stale: 60000,             // Becomes stale after 1 min
  revalidate: 300000,       // Expires after 5 min
})


// ===== CHECK STALENESS =====

if (cache.isStale('api:users')) {
  console.log('Data is stale, should revalidate')
}

if (cache.isFresh('api:users')) {
  console.log('Data is fresh')
}


// ===== GET OR SET WITH SWR =====

const users = await cache.getOrSet(
  'api:users',
  async () => {
    const response = await fetch('/api/users')
    return response.json()
  },
  {
    stale: 60000,           // Fresh for 1 min
    revalidate: 300000,     // Expire after 5 min
  }
)

// First call: Fetches from API
// Within 1 min: Returns cached (fresh)
// 1-5 min: Returns cached (stale), triggers background revalidation
// After 5 min: Fetches from API again


// ===== MANUAL REVALIDATION =====

const freshUsers = await cache.revalidate('api:users', async () => {
  const response = await fetch('/api/users')
  return response.json()
})
```

---

## GET OR SET (MEMOIZATION)

```typescript
// ===== SYNC GET OR SET =====

const config = cache.getOrSet('app:config', () => {
  return loadConfigFromDisk()
})


// ===== ASYNC GET OR SET =====

const users = await cache.getOrSet('api:users', async () => {
  const response = await fetch('/api/users')
  return response.json()
})


// ===== WITH OPTIONS =====

const data = await cache.getOrSet(
  'expensive:computation',
  async () => await computeExpensiveData(),
  {
    ttl: 60000,
    tags: ['computed', 'heavy'],
  }
)


// ===== FORCE REFRESH =====

const freshData = await cache.getOrSet(
  'api:data',
  fetchData,
  { forceRefresh: true }  // Bypass cache
)


// ===== MEMOIZE FUNCTION =====

const fetchUser = cache.memoize(
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
  {
    keyGenerator: (userId) => `user:${userId}`,
    ttl: 60000,
    tags: ['users'],
  }
)

// First call: Fetches from API
const user1 = await fetchUser('123')

// Second call: Returns cached
const user1Again = await fetchUser('123')

// Different argument: Fetches from API
const user2 = await fetchUser('456')


// ===== MEMOIZE WITH COMPLEX ARGS =====

const searchProducts = cache.memoize(
  async (query: string, filters: Filters) => {
    return await searchAPI(query, filters)
  },
  {
    keyGenerator: (query, filters) => {
      return `search:${query}:${JSON.stringify(filters)}`
    },
    ttl: 30000,
    maxSize: 100,  // Max 100 memoized searches
  }
)
```

---

## BATCH OPERATIONS

```typescript
// ===== GET MANY =====

const values = cache.getMany(['user:1', 'user:2', 'user:3'])
// Returns: Map<string, User>

values.forEach((user, key) => {
  console.log(key, user)
})

// Check which were found
for (const key of ['user:1', 'user:2', 'user:3']) {
  if (values.has(key)) {
    console.log(`${key} found:`, values.get(key))
  } else {
    console.log(`${key} not found`)
  }
}


// ===== SET MANY =====

cache.setMany([
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2, ttl: 60000 },
  { key: 'user:3', value: user3, tags: ['vip'] },
])


// ===== DELETE MANY =====

const deletedCount = cache.deleteMany(['user:1', 'user:2', 'user:3'])
console.log(`Deleted ${deletedCount} entries`)


// ===== HAS MANY =====

const existence = cache.hasMany(['user:1', 'user:2', 'user:3'])
// Returns: Map<string, boolean>

existence.forEach((exists, key) => {
  console.log(`${key}: ${exists ? 'exists' : 'missing'}`)
})


// ===== GET OR SET MANY =====

const users = await cache.getOrSetMany(
  ['user:1', 'user:2', 'user:3', 'user:4'],
  async (missingKeys) => {
    // Only fetch missing keys
    console.log('Fetching:', missingKeys)
    const users = await fetchUsersByIds(missingKeys)
    return users.map(u => ({
      key: `user:${u.id}`,
      value: u,
      ttl: 60000,
    }))
  }
)
// Returns: Map<string, User> with all 4 users
```

---

## EVENTS

```typescript
// ===== SUBSCRIBE TO EVENTS =====

// Hit event
cache.on('hit', ({ key, value, entry }) => {
  console.log('Cache hit:', key)
  console.log('Access count:', entry.accessCount)
})

// Miss event
cache.on('miss', ({ key }) => {
  console.log('Cache miss:', key)
  // Maybe log to analytics
})

// Set event
cache.on('set', ({ key, value, entry, isUpdate }) => {
  console.log(isUpdate ? 'Updated:' : 'Added:', key)
  console.log('TTL:', entry.ttl)
})

// Delete event
cache.on('delete', ({ key, value, reason }) => {
  // reason: 'manual' | 'expire' | 'evict' | 'clear' | 'tag'
  console.log('Deleted:', key, 'Reason:', reason)
})

// Expire event
cache.on('expire', ({ key, value, entry }) => {
  console.log('Expired:', key)
  console.log('Was created at:', new Date(entry.createdAt))
})

// Evict event (when cache is full)
cache.on('evict', ({ key, value, entry, strategy }) => {
  // strategy: 'lru' | 'lfu' | 'fifo' | 'memory' | 'custom'
  console.log('Evicted:', key, 'by', strategy)
})

// Clear event
cache.on('clear', ({ count, namespace }) => {
  console.log(`Cleared ${count} items`)
  if (namespace) {
    console.log('From namespace:', namespace)
  }
})

// Prune event
cache.on('prune', ({ count }) => {
  console.log(`Pruned ${count} expired entries`)
})


// ===== UNSUBSCRIBE =====

const unsubscribe = cache.on('hit', handler)

// Later...
unsubscribe()

// Or using off
cache.off('hit', handler)


// ===== ONCE =====

cache.once('clear', ({ count }) => {
  // Only called once, then auto-unsubscribed
  console.log('Cache was cleared')
})
```

---

## STATISTICS

```typescript
// ===== GET ALL STATS =====

const stats = cache.getStats()

console.log({
  // Hit/Miss
  hits: stats.hits,                    // 1500
  misses: stats.misses,                // 300
  hitRate: stats.hitRate,              // 0.833 (83.3%)
  
  // Operations
  sets: stats.sets,                    // 500
  deletes: stats.deletes,              // 100
  evictions: stats.evictions,          // 50
  expirations: stats.expirations,      // 30
  
  // Size
  size: stats.size,                    // 420 items
  maxSize: stats.maxSize,              // 1000
  memoryUsage: stats.memoryUsage,      // 2500000 bytes
  maxMemory: stats.maxMemory,          // 52428800 bytes
  
  // Meta
  namespaces: stats.namespaces,        // ['user', 'api']
  oldestEntry: stats.oldestEntry,      // 'user:1'
  newestEntry: stats.newestEntry,      // 'api:latest'
  avgTTL: stats.avgTTL,                // 180000 ms
  uptime: stats.uptime,                // 3600000 ms
})


// ===== INDIVIDUAL STATS =====

console.log('Hit rate:', cache.hitRate)        // 0.833
console.log('Hits:', cache.hits)               // 1500
console.log('Misses:', cache.misses)           // 300
console.log('Memory:', cache.memoryUsage)      // bytes


// ===== RESET STATS =====

cache.resetStats()
// Resets hits, misses, etc. to 0
// Does NOT clear cache entries


// ===== STATS PER NAMESPACE =====

const userCache = cache.namespace('user')
const userStats = userCache.getStats()
console.log('User cache hit rate:', userStats.hitRate)
```

---

## CACHE STRATEGIES

```typescript
// ===== LRU (Least Recently Used) =====

const lruCache = createCache({
  strategy: 'lru',
  maxSize: 100,
})

// When full, evicts the item that hasn't been accessed for the longest time
// Best for: General purpose caching, recently accessed data


// ===== LFU (Least Frequently Used) =====

const lfuCache = createCache({
  strategy: 'lfu',
  maxSize: 100,
})

// When full, evicts the item with the lowest access count
// Best for: Hot/cold data patterns, popular content caching


// ===== FIFO (First In First Out) =====

const fifoCache = createCache({
  strategy: 'fifo',
  maxSize: 100,
})

// When full, evicts the oldest item (by creation time)
// Best for: Simple queue-like patterns, time-ordered data


// ===== TTL Only =====

const ttlCache = createCache({
  strategy: 'ttl',
  ttl: 60000,         // Required for TTL strategy
})

// No size limit, only time-based expiration
// Best for: Session data, temporary tokens


// ===== SWR (Stale-While-Revalidate) =====

const swrCache = createCache({
  strategy: 'swr',
  staleTime: 60000,       // Fresh for 1 min
  revalidateTime: 300000, // Expire after 5 min
})

// Returns stale data immediately while revalidating in background
// Best for: API responses, data that can be slightly outdated


// ===== CUSTOM STRATEGY =====

const customCache = createCache({
  strategy: {
    shouldEvict: (entries, maxSize, context) => {
      // Custom eviction logic
      // Example: Evict low-priority items first
      const lowPriority = entries
        .filter(e => e.metadata?.priority === 'low')
        .map(e => e.key)
      
      const needed = entries.length - maxSize
      return lowPriority.slice(0, needed)
    },
    
    onAccess: (entry) => {
      // Track custom access metrics
      entry.metadata = entry.metadata || {}
      entry.metadata.lastAccessDay = new Date().toDateString()
    },
    
    onSet: (entry) => {
      // Set default priority
      entry.metadata = entry.metadata || {}
      entry.metadata.priority = entry.metadata.priority || 'normal'
    },
  },
})

// Set with priority
customCache.set('important', data, {
  metadata: { priority: 'high' },
})
```

---

## STORAGE ADAPTERS

```typescript
// ===== MEMORY (DEFAULT) =====

const memoryCache = createCache({
  storage: 'memory',
})

// Fast, volatile, lost on page refresh


// ===== LOCALSTORAGE =====

const localCache = createCache({
  storage: 'local',
  storageKey: 'my-app-cache',  // Prefix
})

// Persists across sessions
// ~5MB limit per domain
// Synchronous, blocks main thread


// ===== SESSIONSTORAGE =====

const sessionCache = createCache({
  storage: 'session',
  storageKey: 'my-app-cache',
})

// Persists until tab/window closes
// ~5MB limit per domain


// ===== CUSTOM STORAGE =====

const customCache = createCache({
  storage: {
    get: (key) => {
      return localStorage.getItem(key)
    },
    set: (key, value) => {
      localStorage.setItem(key, value)
    },
    delete: (key) => {
      localStorage.removeItem(key)
    },
    clear: () => {
      localStorage.clear()
    },
    keys: () => {
      return Object.keys(localStorage)
    },
    has: (key) => {
      return localStorage.getItem(key) !== null
    },
    size: () => {
      return localStorage.length
    },
  },
})


// ===== ASYNC STORAGE (IndexedDB) =====

import { indexedDBStorage } from '@oxog/cachekeeper/storage'

const idbCache = createCache({
  storage: indexedDBStorage({
    dbName: 'my-cache-db',
    storeName: 'cache',
    version: 1,
  }),
})

// Large storage capacity
// Async operations
// Supports complex data


// ===== REDIS ADAPTER EXAMPLE =====

const redisCache = createCache({
  storage: {
    get: async (key) => {
      return await redis.get(key)
    },
    set: async (key, value) => {
      await redis.set(key, value)
    },
    delete: async (key) => {
      await redis.del(key)
    },
    clear: async () => {
      await redis.flushdb()
    },
    keys: async () => {
      return await redis.keys('*')
    },
    has: async (key) => {
      return (await redis.exists(key)) === 1
    },
    size: async () => {
      return await redis.dbsize()
    },
  },
})
```

---

## SERIALIZATION

```typescript
// ===== DEFAULT (JSON) =====

const cache = createCache({
  serializer: JSON,  // Uses JSON.stringify/parse
})


// ===== SUPERJSON (Dates, Maps, Sets, etc.) =====

import superjson from 'superjson'

const cache = createCache({
  serializer: {
    serialize: (value) => superjson.stringify(value),
    deserialize: (data) => superjson.parse(data),
  },
})

// Now supports:
cache.set('data', {
  date: new Date(),
  map: new Map([['a', 1]]),
  set: new Set([1, 2, 3]),
})


// ===== MSGPACK (Binary) =====

import { encode, decode } from '@msgpack/msgpack'

const cache = createCache({
  storage: indexedDBStorage(),  // Binary-friendly storage
  serializer: {
    serialize: (value) => encode(value),
    deserialize: (data) => decode(data),
  },
})


// ===== CUSTOM WITH COMPRESSION =====

import { compress, decompress } from 'lz-string'

const cache = createCache({
  serializer: {
    serialize: (value) => {
      const json = JSON.stringify(value)
      return compress(json)
    },
    deserialize: (data) => {
      const json = decompress(data)
      return JSON.parse(json)
    },
  },
})
```

---

## OPTIONAL PLUGINS

```typescript
// ===== COMPRESSION PLUGIN =====

import { compressionPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    compressionPlugin({
      threshold: 1024,        // Compress if value > 1KB
      algorithm: 'lz',        // 'lz' (lz-string) | 'gzip' (pako)
    }),
  ],
})


// ===== TIERED CACHE PLUGIN =====

import { tieredPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    tieredPlugin({
      l1: {
        storage: 'memory',
        maxSize: 100,         // Fast, small
        ttl: 60000,
      },
      l2: {
        storage: 'local',
        maxSize: 1000,        // Slower, larger
        ttl: 3600000,
      },
    }),
  ],
})

// Get: L1 hit → return
// Get: L1 miss → check L2 → promote to L1 → return
// Set: Write to both L1 and L2


// ===== ENCRYPTION PLUGIN =====

import { encryptionPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    encryptionPlugin({
      key: 'my-secret-key-32-chars-long!!',
      algorithm: 'aes-256-gcm',
    }),
  ],
})

// All values encrypted before storage


// ===== LOGGING PLUGIN =====

import { loggingPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    loggingPlugin({
      logger: console,        // Or custom logger
      level: 'debug',         // 'debug' | 'info' | 'warn' | 'error'
      prefix: '[Cache]',
    }),
  ],
})

// Logs all cache operations


// ===== MULTIPLE PLUGINS =====

const cache = createCache({
  plugins: [
    loggingPlugin({ level: 'debug' }),
    compressionPlugin({ threshold: 1024 }),
    encryptionPlugin({ key: 'secret' }),
  ],
})

// Applied in order: logging → compression → encryption
```

---

## ITERATION & INSPECTION

```typescript
// ===== KEYS =====

const allKeys = cache.keys()
// ['user:1', 'user:2', 'api:data', ...]

// With filter
const userKeys = cache.keys(key => key.startsWith('user:'))
// ['user:1', 'user:2']


// ===== VALUES =====

const allValues = cache.values()
// [user1, user2, apiData, ...]


// ===== ENTRIES =====

const allEntries = cache.entries()
// [['user:1', user1], ['user:2', user2], ...]


// ===== FOR...OF =====

for (const [key, value] of cache) {
  console.log(key, value)
}


// ===== FOREACH =====

cache.forEach((value, key) => {
  console.log(key, value)
})


// ===== FIND =====

const activeUser = cache.find((value, key) => {
  return key.startsWith('user:') && value.isActive
})


// ===== FILTER =====

const activeUsers = cache.filter((value, key) => {
  return key.startsWith('user:') && value.isActive
})
// [['user:1', user1], ['user:3', user3]]


// ===== PRUNE EXPIRED =====

const prunedCount = cache.prune()
console.log(`Removed ${prunedCount} expired entries`)


// ===== RESIZE =====

const evictedCount = cache.resize(500)  // Reduce max size to 500
console.log(`Evicted ${evictedCount} entries`)


// ===== DUMP (BACKUP) =====

const dump = cache.dump()
// {
//   version: '1.0.0',
//   createdAt: 1703851200000,
//   entries: [...],
//   stats: { hits: 100, ... },
// }

// Save to file or send to server
localStorage.setItem('cache-backup', JSON.stringify(dump))


// ===== RESTORE =====

const dump = JSON.parse(localStorage.getItem('cache-backup'))
cache.restore(dump)
// Restores all entries with their TTLs
```

---

## REACT ADAPTER

```tsx
import {
  // Provider
  CacheProvider,
  
  // Hooks
  useCache,
  useCachedValue,
  useCachedQuery,
  useCacheInvalidation,
  useCacheStats,
  
  // HOC
  withCache,
} from '@oxog/cachekeeper/react'

// ============ PROVIDER ============

function App() {
  const cache = useMemo(() => createCache({
    strategy: 'lru',
    maxSize: 1000,
    ttl: 5 * 60 * 1000,
  }), [])

  return (
    <CacheProvider cache={cache}>
      <MyApp />
    </CacheProvider>
  )
}


// ============ useCache ============

function Component() {
  const cache = useCache()
  
  const handleSave = (data) => {
    cache.set('form:draft', data)
  }
  
  const handleLoad = () => {
    return cache.get('form:draft')
  }
  
  const handleClear = () => {
    cache.delete('form:draft')
  }
}


// ============ useCachedValue ============

interface UseCachedValueOptions<T> {
  fetcher?: () => T | Promise<T>
  ttl?: number
  staleTime?: number
  tags?: string[]
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseCachedValueResult<T> {
  data: T | undefined
  isLoading: boolean
  isCached: boolean
  isStale: boolean
  isFetching: boolean
  error: Error | null
  refresh: () => Promise<void>
  invalidate: () => void
}

function UserProfile({ userId }: { userId: string }) {
  const {
    data: user,
    isLoading,
    isCached,
    isStale,
    error,
    refresh,
  } = useCachedValue<User>(`user:${userId}`, {
    fetcher: () => fetchUser(userId),
    ttl: 60000,
    staleTime: 30000,
  })

  if (isLoading && !isCached) {
    return <Spinner />
  }

  if (error) {
    return <Error message={error.message} />
  }

  return (
    <div>
      <h1>{user?.name}</h1>
      {isStale && <Badge>Updating...</Badge>}
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}


// ============ useCachedQuery (SWR-like) ============

interface UseCachedQueryOptions<T> {
  ttl?: number
  staleTime?: number
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  revalidateInterval?: number
  dedupingInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseCachedQueryResult<T> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T | Promise<T> | ((current: T) => T)) => Promise<void>
}

function Products() {
  const {
    data: products,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useCachedQuery<Product[]>('products', fetchProducts, {
    ttl: 300000,                    // 5 min cache
    staleTime: 60000,               // Fresh for 1 min
    revalidateOnFocus: true,        // Refetch on window focus
    revalidateOnReconnect: true,    // Refetch on network reconnect
    revalidateInterval: 30000,      // Poll every 30s
  })

  if (isLoading) return <Spinner />
  if (error) return <Error error={error} />

  return (
    <div>
      {isValidating && <Badge>Updating...</Badge>}
      
      <ProductList products={products} />
      
      <button onClick={() => mutate()}>
        Refresh
      </button>
      
      <button onClick={() => mutate(optimisticData)}>
        Optimistic Update
      </button>
    </div>
  )
}


// ============ useCacheInvalidation ============

function AdminPanel() {
  const { invalidate, invalidateByTag, clear } = useCacheInvalidation()

  return (
    <div>
      <button onClick={() => invalidate('user:1')}>
        Invalidate User 1
      </button>
      
      <button onClick={() => invalidateByTag('products')}>
        Invalidate All Products
      </button>
      
      <button onClick={() => clear()}>
        Clear All Cache
      </button>
    </div>
  )
}


// ============ useCacheStats ============

function CacheMonitor() {
  const stats = useCacheStats({ refreshInterval: 1000 })

  return (
    <div className="cache-monitor">
      <div>
        <span>Hit Rate</span>
        <span>{(stats.hitRate * 100).toFixed(1)}%</span>
      </div>
      
      <div>
        <span>Size</span>
        <span>{stats.size} / {stats.maxSize}</span>
      </div>
      
      <div>
        <span>Memory</span>
        <span>{formatBytes(stats.memoryUsage)}</span>
      </div>
      
      <ProgressBar value={stats.size / stats.maxSize} />
    </div>
  )
}


// ============ withCache HOC ============

interface WithCacheProps {
  cache: CacheInstance
}

const EnhancedComponent = withCache(MyComponent)
// MyComponent receives `cache` prop
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Universal (Browser + Node) |
| Module | ESM + CJS |
| Node.js | >= 18 |
| TypeScript | Strict mode, full generics |
| Dependencies | ZERO |
| Test Coverage | 100% |
| Bundle Size | < 4KB core |

---

## PROJECT STRUCTURE

```
cachekeeper/
├── src/
│   ├── index.ts                    # Main exports
│   ├── types.ts                    # Type definitions
│   │
│   ├── core/
│   │   ├── cache.ts                # Main cache class
│   │   ├── entry.ts                # Cache entry management
│   │   ├── namespace.ts            # Namespace implementation
│   │   ├── tags.ts                 # Tag management
│   │   └── stats.ts                # Statistics tracking
│   │
│   ├── strategies/
│   │   ├── index.ts                # Strategy exports
│   │   ├── lru.ts                  # LRU implementation
│   │   ├── lfu.ts                  # LFU implementation
│   │   ├── fifo.ts                 # FIFO implementation
│   │   ├── ttl.ts                  # TTL-only implementation
│   │   └── swr.ts                  # Stale-while-revalidate
│   │
│   ├── storage/
│   │   ├── index.ts                # Storage exports
│   │   ├── memory.ts               # In-memory storage
│   │   ├── local.ts                # localStorage adapter
│   │   ├── session.ts              # sessionStorage adapter
│   │   └── indexed-db.ts           # IndexedDB adapter
│   │
│   ├── events/
│   │   ├── emitter.ts              # Event emitter
│   │   └── types.ts                # Event types
│   │
│   ├── plugins/
│   │   ├── index.ts                # Plugin exports
│   │   ├── compression.ts          # Compression plugin
│   │   ├── tiered.ts               # Tiered cache plugin
│   │   ├── encryption.ts           # Encryption plugin
│   │   └── logging.ts              # Logging plugin
│   │
│   ├── adapters/
│   │   └── react/
│   │       ├── index.ts
│   │       ├── provider.tsx
│   │       ├── context.ts
│   │       └── hooks/
│   │           ├── useCache.ts
│   │           ├── useCachedValue.ts
│   │           ├── useCachedQuery.ts
│   │           ├── useCacheInvalidation.ts
│   │           └── useCacheStats.ts
│   │
│   └── utils/
│       ├── size.ts                 # Memory size estimation
│       ├── hash.ts                 # Key hashing
│       ├── time.ts                 # Time utilities
│       └── serialize.ts            # Serialization helpers
│
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   ├── strategies/
│   │   ├── storage/
│   │   └── plugins/
│   ├── integration/
│   │   ├── cache.test.ts
│   │   ├── namespaces.test.ts
│   │   ├── tags.test.ts
│   │   ├── swr.test.ts
│   │   └── persistence.test.ts
│   └── fixtures/
│
├── examples/
│   ├── basic/
│   ├── strategies/
│   ├── storage/
│   ├── plugins/
│   └── react/
│
├── website/                        # React + Vite documentation
│   └── [See WEBSITE section]
│
├── .github/
│   └── workflows/
│       └── deploy-website.yml
│
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## DOCUMENTATION WEBSITE

Build a modern documentation site using React + Vite.

### Technology Stack (MANDATORY)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18+ | UI framework |
| **Vite** | 5+ | Build tool |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3+ | Styling (npm, NOT CDN) |
| **shadcn/ui** | Latest | UI components |
| **React Router** | 6+ | Routing |
| **Lucide React** | Latest | Icons |
| **Framer Motion** | Latest | Animations |
| **Prism.js** | Latest | Syntax highlighting |

### Fonts (MANDATORY)

- **JetBrains Mono** - ALL code
- **Inter** - Body text

### Required Pages

1. **Home** (`/`)
   - Hero with cache visualization
   - Strategy comparison
   - Install command
   - Live demo (interactive cache)
   - Feature highlights

2. **Getting Started** (`/docs/getting-started`)
   - Installation
   - Quick start
   - Basic example

3. **Core Concepts** (`/docs/concepts/*`)
   - Cache Strategies (LRU, LFU, FIFO, TTL, SWR)
   - Namespaces
   - Tags
   - TTL & Expiration
   - Memoization
   - Events
   - Statistics

4. **API Reference** (`/docs/api/*`)
   - createCache
   - CacheInstance methods
   - Options & Types

5. **Storage** (`/docs/storage/*`)
   - Memory
   - localStorage
   - sessionStorage
   - IndexedDB
   - Custom adapters

6. **Plugins** (`/docs/plugins/*`)
   - Compression
   - Tiered Cache
   - Encryption
   - Logging
   - Creating plugins

7. **React Guide** (`/docs/react/*`)
   - CacheProvider
   - useCachedValue
   - useCachedQuery
   - useCacheStats

8. **Examples** (`/examples`)
   - API Response Caching
   - Memoization
   - Offline Support
   - Real-time Dashboard
   - Multi-tier Caching

9. **Playground** (`/playground`)
   - Interactive cache demo
   - Strategy comparison
   - Performance visualization

### Design Theme

- Blue/cyan accent (#0ea5e9) - Data/storage theme
- Dark mode default
- Light mode support

### Code Features (MANDATORY)

- ✅ Line numbers
- ✅ Syntax highlighting
- ✅ Copy button
- ✅ Filename header
- ✅ IDE window style
- ✅ JetBrains Mono font

### GitHub Actions

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: website/package-lock.json
      - run: cd website && npm ci
      - run: cd website && npm run build
      - run: echo "cachekeeper.oxog.dev" > website/dist/CNAME
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: website/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

---

## README.md

````markdown
# CacheKeeper

<div align="center">
  <img src="website/public/logo.svg" alt="CacheKeeper" width="120" />
  <h3>Zero-dependency caching toolkit with multiple strategies</h3>
  <p>
    <a href="https://cachekeeper.oxog.dev">Documentation</a> •
    <a href="https://cachekeeper.oxog.dev/docs/getting-started">Getting Started</a> •
    <a href="https://cachekeeper.oxog.dev/examples">Examples</a>
  </p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@oxog/cachekeeper.svg)](https://www.npmjs.com/package/@oxog/cachekeeper)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@oxog/cachekeeper)](https://bundlephobia.com/package/@oxog/cachekeeper)
[![license](https://img.shields.io/npm/l/@oxog/cachekeeper.svg)](LICENSE)

</div>

---

## Features

- 🗄️ **Multiple Strategies** - LRU, LFU, FIFO, TTL, SWR
- ⏱️ **TTL Support** - Automatic expiration
- 📁 **Namespaces** - Organized cache groups
- 🏷️ **Tags** - Tag-based invalidation
- 🔄 **SWR** - Stale-while-revalidate
- 📊 **Statistics** - Hit rate, memory usage
- 💾 **Storage** - Memory, localStorage, IndexedDB
- ⚛️ **React Adapter** - Hooks & components
- 🔌 **Zero Dependencies** - Lightweight
- ⚡ **< 4KB** - Tiny bundle

## Installation

```bash
npm install @oxog/cachekeeper
```

## Quick Start

```typescript
import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  ttl: 5 * 60 * 1000,  // 5 minutes
})

// Basic operations
cache.set('user:1', { name: 'Ersin' })
const user = cache.get('user:1')

// Memoization
const getUser = cache.memoize(fetchUser, {
  keyGenerator: (id) => `user:${id}`,
  ttl: 60000,
})
```

## React

```tsx
import { CacheProvider, useCachedQuery } from '@oxog/cachekeeper/react'

function Products() {
  const { data, isLoading } = useCachedQuery('products', fetchProducts)
  
  if (isLoading) return <Spinner />
  return <ProductList products={data} />
}
```

## Documentation

Visit [cachekeeper.oxog.dev](https://cachekeeper.oxog.dev) for full documentation.

## License

MIT © [Ersin KOÇ](https://github.com/ersinkoc)
````

---

## IMPLEMENTATION CHECKLIST

### Before Implementation
- [ ] Create SPECIFICATION.md
- [ ] Create IMPLEMENTATION.md
- [ ] Create TASKS.md

### Core
- [ ] Cache class
- [ ] Entry management
- [ ] Basic operations (get/set/has/delete/clear)
- [ ] TTL & expiration
- [ ] Namespace system
- [ ] Tag system
- [ ] Statistics tracking

### Strategies
- [ ] LRU implementation
- [ ] LFU implementation
- [ ] FIFO implementation
- [ ] TTL-only implementation
- [ ] SWR implementation
- [ ] Custom strategy support

### Storage
- [ ] Memory storage
- [ ] localStorage adapter
- [ ] sessionStorage adapter
- [ ] IndexedDB adapter
- [ ] Custom adapter interface

### Features
- [ ] getOrSet (memoization)
- [ ] memoize function wrapper
- [ ] Batch operations
- [ ] Event system
- [ ] Iteration methods

### Plugins
- [ ] Plugin system
- [ ] Compression plugin
- [ ] Tiered cache plugin
- [ ] Encryption plugin
- [ ] Logging plugin

### React Adapter
- [ ] CacheProvider
- [ ] useCache
- [ ] useCachedValue
- [ ] useCachedQuery
- [ ] useCacheInvalidation
- [ ] useCacheStats

### Testing
- [ ] 100% coverage
- [ ] All tests passing

### Website
- [ ] React + Vite setup
- [ ] All pages
- [ ] Interactive examples
- [ ] Playground
- [ ] GitHub Actions

---

## BEGIN IMPLEMENTATION

Start by creating SPECIFICATION.md with the complete package specification. Then proceed with IMPLEMENTATION.md and TASKS.md before writing any actual code.

Remember: This package will be published to NPM. It must be production-ready, zero-dependency, fully tested, and professionally documented.

**Date: 2025-12-29**
**Author: Ersin KOÇ**
**Repository: github.com/ersinkoc/cachekeeper**
**Website: cachekeeper.oxog.dev**
