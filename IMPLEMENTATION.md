# CacheKeeper - Implementation Guide

## 1. Architecture Overview

### 1.1 Design Principles

1. **Zero Dependencies** - Everything implemented from scratch
2. **Type Safety** - Full TypeScript with strict mode
3. **Immutability** - Entry data never mutated directly
4. **Single Responsibility** - Each module has one purpose
5. **Dependency Injection** - Storage and strategies are injectable
6. **Tree Shaking** - ESM exports for optimal bundling

### 1.2 Core Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      createCache()                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       CacheInstance                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Strategy   │ │   Storage   │ │    EventEmitter     │   │
│  │ (LRU/LFU/..)│ │(Memory/Local)│ │ (hit/miss/set/..)  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Namespaces  │ │    Tags     │ │     Statistics      │   │
│  │ (user:admin)│ │(invalidate) │ │ (hits/misses/rate)  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     Plugins                          │   │
│  │  (compression, encryption, logging, tiered)          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Structures

### 2.1 CacheEntry Structure

```typescript
interface CacheEntry<T> {
  key: string           // Unique identifier
  value: T              // Stored value
  createdAt: number     // Creation timestamp (ms)
  updatedAt: number     // Last update timestamp (ms)
  accessedAt: number    // Last access timestamp (ms)
  accessCount: number   // Number of times accessed
  size: number          // Estimated memory size (bytes)
  ttl?: number          // Time to live (ms)
  expiresAt?: number    // Expiration timestamp (ms)
  staleAt?: number      // Stale timestamp for SWR (ms)
  tags: string[]        // Associated tags
  namespace?: string    // Namespace path
  metadata?: Record<string, unknown>  // Custom metadata
}
```

### 2.2 Internal Data Maps

```typescript
// Main entry storage
private entries: Map<string, CacheEntry<T>>

// Tag index for fast lookup
private tagIndex: Map<string, Set<string>>

// Namespace registry
private namespaces: Map<string, CacheNamespace<T>>

// Event listeners
private listeners: Map<CacheEvent, Set<CacheEventHandler>>
```

---

## 3. Strategy Implementation

### 3.1 Strategy Interface

```typescript
interface EvictionStrategy<T> {
  shouldEvict(
    entries: CacheEntry<T>[],
    maxSize: number,
    context: EvictionContext
  ): string[]

  onAccess?(entry: CacheEntry<T>): void
  onSet?(entry: CacheEntry<T>): void
}
```

### 3.2 LRU Strategy

```typescript
// Algorithm: Sort by accessedAt, evict oldest
shouldEvict(entries, maxSize) {
  const sorted = entries.sort((a, b) => a.accessedAt - b.accessedAt)
  const countToEvict = entries.length - maxSize + 1
  return sorted.slice(0, countToEvict).map(e => e.key)
}
```

### 3.3 LFU Strategy

```typescript
// Algorithm: Sort by accessCount, evict least accessed
shouldEvict(entries, maxSize) {
  const sorted = entries.sort((a, b) => a.accessCount - b.accessCount)
  const countToEvict = entries.length - maxSize + 1
  return sorted.slice(0, countToEvict).map(e => e.key)
}
```

### 3.4 FIFO Strategy

```typescript
// Algorithm: Sort by createdAt, evict oldest
shouldEvict(entries, maxSize) {
  const sorted = entries.sort((a, b) => a.createdAt - b.createdAt)
  const countToEvict = entries.length - maxSize + 1
  return sorted.slice(0, countToEvict).map(e => e.key)
}
```

### 3.5 TTL Strategy

```typescript
// No size-based eviction, only TTL expiration
shouldEvict(entries, maxSize) {
  // Only evict expired entries
  const now = Date.now()
  return entries
    .filter(e => e.expiresAt && e.expiresAt <= now)
    .map(e => e.key)
}
```

### 3.6 SWR Strategy

```typescript
// Stale-while-revalidate pattern
shouldEvict(entries, maxSize) {
  // Evict expired entries first, then LRU
  const now = Date.now()
  const expired = entries.filter(e => e.expiresAt && e.expiresAt <= now)

  if (expired.length >= entries.length - maxSize + 1) {
    return expired.map(e => e.key)
  }

  // Fall back to LRU for remaining
  const nonExpired = entries.filter(e => !e.expiresAt || e.expiresAt > now)
  const sorted = nonExpired.sort((a, b) => a.accessedAt - b.accessedAt)
  const countToEvict = entries.length - maxSize + 1 - expired.length
  return [
    ...expired.map(e => e.key),
    ...sorted.slice(0, countToEvict).map(e => e.key)
  ]
}
```

---

## 4. Storage Implementation

### 4.1 Memory Storage

```typescript
class MemoryStorage implements StorageAdapter {
  private data = new Map<string, string>()

  get(key: string): string | null {
    return this.data.get(key) ?? null
  }

  set(key: string, value: string): void {
    this.data.set(key, value)
  }

  delete(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  keys(): string[] {
    return Array.from(this.data.keys())
  }

  has(key: string): boolean {
    return this.data.has(key)
  }

  size(): number {
    return this.data.size
  }
}
```

### 4.2 LocalStorage Adapter

```typescript
class LocalStorageAdapter implements StorageAdapter {
  constructor(private prefix: string = 'cache:') {}

  private prefixKey(key: string): string {
    return `${this.prefix}${key}`
  }

  get(key: string): string | null {
    return localStorage.getItem(this.prefixKey(key))
  }

  set(key: string, value: string): void {
    localStorage.setItem(this.prefixKey(key), value)
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefixKey(key))
  }

  clear(): void {
    const keys = this.keys()
    keys.forEach(key => localStorage.removeItem(this.prefixKey(key)))
  }

  keys(): string[] {
    const result: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length))
      }
    }
    return result
  }

  has(key: string): boolean {
    return localStorage.getItem(this.prefixKey(key)) !== null
  }

  size(): number {
    return this.keys().length
  }
}
```

### 4.3 IndexedDB Adapter

```typescript
class IndexedDBStorage implements StorageAdapter {
  private db: IDBDatabase | null = null
  private dbName: string
  private storeName: string

  constructor(options: { dbName: string; storeName: string; version?: number }) {
    this.dbName = options.dbName
    this.storeName = options.storeName
    this.init(options.version ?? 1)
  }

  private async init(version: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async get(key: string): Promise<string | null> {
    // ... IDB get implementation
  }

  async set(key: string, value: string): Promise<void> {
    // ... IDB put implementation
  }

  // ... other methods
}
```

---

## 5. Event System

### 5.1 EventEmitter Implementation

```typescript
class EventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Function>>()

  on<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    return () => this.off(event, handler)
  }

  off<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void
  ): void {
    this.listeners.get(event)?.delete(handler)
  }

  once<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void
  ): void {
    const wrapper = (payload: Events[E]) => {
      this.off(event, wrapper)
      handler(payload)
    }
    this.on(event, wrapper)
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(payload)
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error)
      }
    })
  }
}
```

---

## 6. Namespace Implementation

### 6.1 Namespace Class

```typescript
class CacheNamespaceImpl<T> implements CacheNamespace<T> {
  constructor(
    private cache: CacheInstance<T>,
    public readonly name: string,
    private parentPath: string = ''
  ) {}

  get fullPath(): string {
    return this.parentPath ? `${this.parentPath}:${this.name}` : this.name
  }

  private prefixKey(key: string): string {
    return `${this.fullPath}:${key}`
  }

  get(key: string): T | undefined
  get(key: string, defaultValue: T): T
  get(key: string, defaultValue?: T): T | undefined {
    return this.cache.get(this.prefixKey(key), defaultValue as T)
  }

  set(key: string, value: T, options?: SetOptions): void {
    this.cache.set(this.prefixKey(key), value, {
      ...options,
      metadata: { ...options?.metadata, namespace: this.fullPath }
    })
  }

  has(key: string): boolean {
    return this.cache.has(this.prefixKey(key))
  }

  delete(key: string): boolean {
    return this.cache.delete(this.prefixKey(key))
  }

  clear(): void {
    const keys = this.keys()
    keys.forEach(key => this.delete(key))
  }

  keys(): string[] {
    const prefix = `${this.fullPath}:`
    return this.cache.keys()
      .filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length))
  }

  namespace(name: string): CacheNamespace<T> {
    return new CacheNamespaceImpl(this.cache, name, this.fullPath)
  }

  // ... other methods
}
```

---

## 7. Tag System

### 7.1 Tag Index Structure

```typescript
// Tag to keys mapping
private tagIndex: Map<string, Set<string>> = new Map()

// Add tag
addTag(key: string, tag: string): void {
  if (!this.tagIndex.has(tag)) {
    this.tagIndex.set(tag, new Set())
  }
  this.tagIndex.get(tag)!.add(key)
}

// Remove tag
removeTag(key: string, tag: string): void {
  this.tagIndex.get(tag)?.delete(key)
  if (this.tagIndex.get(tag)?.size === 0) {
    this.tagIndex.delete(tag)
  }
}

// Get keys by tag
getKeysByTag(tag: string): string[] {
  return Array.from(this.tagIndex.get(tag) ?? [])
}

// Invalidate by tag
invalidateByTag(tag: string): number {
  const keys = this.getKeysByTag(tag)
  return this.deleteMany(keys)
}
```

---

## 8. Memory Size Estimation

### 8.1 Size Calculator

```typescript
function estimateSize(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }

  switch (typeof value) {
    case 'boolean':
      return 4
    case 'number':
      return 8
    case 'string':
      return (value as string).length * 2
    case 'object':
      if (Array.isArray(value)) {
        return value.reduce((sum, item) => sum + estimateSize(item), 0)
      }
      if (value instanceof Date) {
        return 8
      }
      if (value instanceof Map || value instanceof Set) {
        let size = 0
        value.forEach((v, k) => {
          size += estimateSize(k) + estimateSize(v)
        })
        return size
      }
      // Plain object
      let objectSize = 0
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          objectSize += key.length * 2 + estimateSize((value as Record<string, unknown>)[key])
        }
      }
      return objectSize
    default:
      return 0
  }
}
```

---

## 9. TTL Management

### 9.1 Expiration Checker

```typescript
class ExpirationChecker {
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    private cache: CacheInstance<unknown>,
    private interval: number
  ) {}

  start(): void {
    if (this.timer) return

    this.timer = setInterval(() => {
      this.check()
    }, this.interval)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private check(): void {
    const now = Date.now()
    const entries = this.cache.entries()

    for (const [key, _] of entries) {
      const entry = this.cache.getEntry(key)
      if (entry?.expiresAt && entry.expiresAt <= now) {
        this.cache.expire(key)
      }
    }
  }
}
```

---

## 10. Plugin System

### 10.1 Plugin Manager

```typescript
class PluginManager<T> {
  private plugins: CachePlugin<T>[] = []

  register(plugin: CachePlugin<T>): void {
    this.plugins.push(plugin)
  }

  onInit(cache: CacheInstance<T>): void {
    this.plugins.forEach(p => p.onInit?.(cache))
  }

  onDestroy(cache: CacheInstance<T>): void {
    this.plugins.forEach(p => p.onDestroy?.(cache))
  }

  beforeGet(key: string): void {
    this.plugins.forEach(p => p.beforeGet?.(key))
  }

  afterGet(key: string, value: T | undefined): T | undefined {
    return this.plugins.reduce(
      (val, p) => p.afterGet?.(key, val) ?? val,
      value
    )
  }

  beforeSet(
    key: string,
    value: T,
    options?: SetOptions
  ): { value: T; options?: SetOptions } {
    return this.plugins.reduce(
      (result, p) => p.beforeSet?.(key, result.value, result.options) ?? result,
      { value, options }
    )
  }

  afterSet(key: string, entry: CacheEntry<T>): void {
    this.plugins.forEach(p => p.afterSet?.(key, entry))
  }

  beforeDelete(key: string): boolean {
    return this.plugins.every(p => p.beforeDelete?.(key) ?? true)
  }

  afterDelete(key: string, value: T): void {
    this.plugins.forEach(p => p.afterDelete?.(key, value))
  }
}
```

---

## 11. React Integration

### 11.1 Context Setup

```typescript
const CacheContext = createContext<CacheInstance<unknown> | null>(null)

export function CacheProvider<T>({
  cache,
  children
}: {
  cache: CacheInstance<T>
  children: React.ReactNode
}) {
  return (
    <CacheContext.Provider value={cache as CacheInstance<unknown>}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache<T = unknown>(): CacheInstance<T> {
  const cache = useContext(CacheContext)
  if (!cache) {
    throw new Error('useCache must be used within CacheProvider')
  }
  return cache as CacheInstance<T>
}
```

### 11.2 useCachedValue Hook

```typescript
function useCachedValue<T>(
  key: string,
  options: UseCachedValueOptions<T> = {}
): UseCachedValueResult<T> {
  const cache = useCache<T>()
  const [state, setState] = useState<{
    data: T | undefined
    isLoading: boolean
    error: Error | null
  }>({
    data: cache.get(key),
    isLoading: false,
    error: null
  })

  useEffect(() => {
    if (options.enabled === false) return

    const cached = cache.get(key)
    if (cached !== undefined) {
      setState(s => ({ ...s, data: cached }))
      return
    }

    if (options.fetcher) {
      setState(s => ({ ...s, isLoading: true }))

      Promise.resolve(options.fetcher())
        .then(data => {
          cache.set(key, data, {
            ttl: options.ttl,
            tags: options.tags
          })
          setState({ data, isLoading: false, error: null })
          options.onSuccess?.(data)
        })
        .catch(error => {
          setState(s => ({ ...s, isLoading: false, error }))
          options.onError?.(error)
        })
    }
  }, [key, options.enabled])

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isCached: cache.has(key),
    isStale: cache.isStale(key),
    isFetching: state.isLoading,
    refresh: async () => {
      // ... refresh implementation
    },
    invalidate: () => cache.delete(key)
  }
}
```

---

## 12. Serialization

### 12.1 Default JSON Serializer

```typescript
const defaultSerializer: Serializer<unknown> = {
  serialize: (value) => JSON.stringify(value),
  deserialize: (data) => JSON.parse(data)
}
```

### 12.2 Entry Serialization

```typescript
function serializeEntry<T>(
  entry: CacheEntry<T>,
  serializer: Serializer<T>
): string {
  return JSON.stringify({
    ...entry,
    value: serializer.serialize(entry.value)
  })
}

function deserializeEntry<T>(
  data: string,
  serializer: Serializer<T>
): CacheEntry<T> {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    value: serializer.deserialize(parsed.value)
  }
}
```

---

## 13. Error Handling

### 13.1 Custom Errors

```typescript
class CacheError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'CacheError'
  }
}

class StorageError extends CacheError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR')
    this.name = 'StorageError'
  }
}

class SerializationError extends CacheError {
  constructor(message: string) {
    super(message, 'SERIALIZATION_ERROR')
    this.name = 'SerializationError'
  }
}
```

---

## 14. Performance Optimizations

### 14.1 Lazy Initialization
- Storage adapters initialized on first use
- Expiration checker starts only when TTL is used

### 14.2 Batch Operations
- Bulk get/set/delete minimize storage calls
- Single event emission for batch operations

### 14.3 Index Structures
- Tag index for O(1) tag lookups
- Namespace registry for fast namespace access

### 14.4 Memory Management
- Lazy size calculation
- Periodic cleanup of expired entries

---

## 15. Testing Approach

### 15.1 Unit Test Structure

```typescript
describe('CacheInstance', () => {
  describe('get/set', () => {
    it('should store and retrieve values', () => {})
    it('should return undefined for missing keys', () => {})
    it('should return default value when provided', () => {})
  })

  describe('TTL', () => {
    it('should expire entries after TTL', () => {})
    it('should refresh TTL on touch', () => {})
  })

  // ... more test suites
})
```

### 15.2 Integration Test Structure

```typescript
describe('Cache Integration', () => {
  it('should persist data across page reloads (localStorage)', () => {})
  it('should handle concurrent access', () => {})
  it('should recover from storage failures', () => {})
})
```

---

## 16. Build Configuration

### 16.1 tsup Configuration

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/adapters/react/index.ts',
    storage: 'src/storage/index.ts',
    plugins: 'src/plugins/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  minify: true,
  treeshake: true,
  external: ['react']
})
```

### 16.2 Package.json Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react.mjs",
      "require": "./dist/react.cjs",
      "types": "./dist/react.d.ts"
    },
    "./storage": {
      "import": "./dist/storage.mjs",
      "require": "./dist/storage.cjs",
      "types": "./dist/storage.d.ts"
    },
    "./plugins": {
      "import": "./dist/plugins.mjs",
      "require": "./dist/plugins.cjs",
      "types": "./dist/plugins.d.ts"
    }
  }
}
```
