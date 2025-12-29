# CacheKeeper - Technical Specification

## 1. Overview

**Package Name:** `@oxog/cachekeeper`
**Version:** 1.0.0
**License:** MIT
**Author:** Ersin KOÇ
**Repository:** https://github.com/ersinkoc/cachekeeper
**Documentation:** https://cachekeeper.oxog.dev

### 1.1 Description

CacheKeeper is a zero-dependency, lightweight caching toolkit for JavaScript/TypeScript applications. It provides multiple eviction strategies, TTL support, namespaces, tags, and flexible storage backends.

### 1.2 Key Features

- **Zero Dependencies** - No runtime dependencies
- **Multiple Strategies** - LRU, LFU, FIFO, TTL, SWR
- **TTL Support** - Automatic expiration with configurable intervals
- **Namespaces** - Hierarchical cache organization
- **Tags** - Tag-based invalidation
- **Stale-While-Revalidate** - Background revalidation pattern
- **Event System** - Comprehensive lifecycle events
- **Statistics** - Detailed cache metrics
- **Storage Backends** - Memory, localStorage, sessionStorage, IndexedDB
- **Plugins** - Extensible plugin architecture
- **React Adapter** - Hooks and components for React integration
- **TypeScript** - Full type safety with strict mode
- **Small Bundle** - < 4KB minified + gzipped

---

## 2. Technical Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Universal (Browser + Node.js) |
| Module Format | ESM + CJS |
| Node.js Version | >= 18 |
| TypeScript | 5.x with strict mode |
| Dependencies | ZERO |
| Test Coverage | 100% |
| Bundle Size | < 4KB (core), < 6KB (with React) |

---

## 3. Core Architecture

### 3.1 Module Structure

```
@oxog/cachekeeper
├── Main Export (createCache)
├── /react (React adapter)
├── /storage (Storage adapters)
└── /plugins (Optional plugins)
```

### 3.2 Core Components

1. **CacheInstance** - Main cache class with all operations
2. **CacheEntry** - Individual cache entry with metadata
3. **Strategy** - Eviction strategy implementations
4. **StorageAdapter** - Storage backend interface
5. **EventEmitter** - Event system for cache lifecycle
6. **Namespace** - Hierarchical namespace support
7. **TagManager** - Tag-based invalidation
8. **Statistics** - Cache metrics and analytics

---

## 4. Cache Strategies

### 4.1 LRU (Least Recently Used)
- Evicts entries that haven't been accessed for the longest time
- Tracks `accessedAt` timestamp
- Best for: General purpose caching

### 4.2 LFU (Least Frequently Used)
- Evicts entries with the lowest access count
- Tracks `accessCount`
- Best for: Hot/cold data patterns

### 4.3 FIFO (First In First Out)
- Evicts oldest entries by creation time
- Tracks `createdAt` timestamp
- Best for: Queue-like patterns

### 4.4 TTL (Time To Live)
- Entries expire after specified duration
- No size-based eviction
- Best for: Session data, temporary tokens

### 4.5 SWR (Stale-While-Revalidate)
- Returns stale data while revalidating in background
- Tracks `staleAt` and `expiresAt`
- Best for: API responses

### 4.6 Custom Strategy
- User-defined eviction logic
- Hooks for access and set operations

---

## 5. Storage Adapters

### 5.1 Memory Storage (Default)
- In-memory Map-based storage
- Fastest performance
- Lost on page refresh

### 5.2 LocalStorage
- Persistent across sessions
- ~5MB limit per domain
- Synchronous operations

### 5.3 SessionStorage
- Persists until tab/window closes
- ~5MB limit per domain
- Synchronous operations

### 5.4 IndexedDB
- Large storage capacity
- Asynchronous operations
- Supports complex data types

### 5.5 Custom Adapter
- Implement StorageAdapter interface
- Supports sync and async operations

---

## 6. API Specification

### 6.1 Factory Function

```typescript
function createCache<T = unknown>(config?: CacheConfig<T>): CacheInstance<T>
```

### 6.2 CacheInstance Methods

#### Basic Operations
- `get(key: string): T | undefined`
- `get(key: string, defaultValue: T): T`
- `set(key: string, value: T, options?: SetOptions): void`
- `has(key: string): boolean`
- `delete(key: string): boolean`
- `delete(keys: string[]): number`
- `clear(): void`

#### Size & State
- `size: number` (readonly)
- `isEmpty: boolean` (readonly)
- `maxSize: number` (readonly)
- `memoryUsage: number` (readonly)

#### TTL Operations
- `getTTL(key: string): number | undefined`
- `setTTL(key: string, ttl: number): boolean`
- `touch(key: string): boolean`
- `expire(key: string): boolean`
- `getExpiration(key: string): Date | null`

#### Namespaces
- `namespace(name: string): CacheNamespace<T>`
- `getNamespace(name: string): CacheNamespace<T> | undefined`
- `clearNamespace(name: string): number`
- `listNamespaces(): string[]`

#### Tags
- `getTags(key: string): string[]`
- `addTags(key: string, tags: string[]): boolean`
- `removeTags(key: string, tags: string[]): boolean`
- `invalidateByTag(tag: string | string[]): number`
- `getKeysByTag(tag: string | string[]): string[]`

#### SWR
- `isStale(key: string): boolean`
- `isFresh(key: string): boolean`
- `revalidate<R>(key: string, fetcher: () => R | Promise<R>): Promise<R>`

#### Memoization
- `getOrSet(key: string, factory: () => T, options?: GetOrSetOptions): T`
- `getOrSet(key: string, factory: () => Promise<T>, options?: GetOrSetOptions): Promise<T>`
- `memoize<Args, R>(fn: (...args: Args) => R, options?: MemoizeOptions<Args>): (...args: Args) => R`

#### Batch Operations
- `getMany(keys: string[]): Map<string, T>`
- `setMany(entries: BatchSetEntry<T>[]): void`
- `deleteMany(keys: string[]): number`
- `hasMany(keys: string[]): Map<string, boolean>`
- `getOrSetMany(keys: string[], fetcher: (missingKeys: string[]) => BatchSetEntry<T>[] | Promise<BatchSetEntry<T>[]>, options?: GetOrSetOptions): Promise<Map<string, T>>`

#### Events
- `on<E>(event: E, handler: CacheEventHandler<E, T>): Unsubscribe`
- `off<E>(event: E, handler: CacheEventHandler<E, T>): void`
- `once<E>(event: E, handler: CacheEventHandler<E, T>): void`

#### Statistics
- `getStats(): CacheStats`
- `hits: number` (readonly)
- `misses: number` (readonly)
- `hitRate: number` (readonly)
- `resetStats(): void`

#### Iteration
- `keys(): string[]`
- `keys(filter: (key: string) => boolean): string[]`
- `values(): T[]`
- `entries(): [string, T][]`
- `forEach(callback: (value: T, key: string) => void): void`
- `find(predicate: (value: T, key: string) => boolean): T | undefined`
- `filter(predicate: (value: T, key: string) => boolean): [string, T][]`

#### Maintenance
- `prune(): number`
- `resize(maxSize: number): number`

#### Serialization
- `dump(): CacheDump<T>`
- `restore(dump: CacheDump<T>): void`

#### Lifecycle
- `destroy(): void`
- `[Symbol.iterator](): Iterator<[string, T]>`

---

## 7. Event System

### 7.1 Event Types
- `hit` - Cache hit occurred
- `miss` - Cache miss occurred
- `set` - Entry was set or updated
- `delete` - Entry was deleted
- `expire` - Entry expired
- `evict` - Entry was evicted
- `clear` - Cache was cleared
- `prune` - Expired entries were pruned

### 7.2 Event Payloads
Each event type has a specific payload interface with relevant data.

---

## 8. Plugin System

### 8.1 Plugin Interface
```typescript
interface CachePlugin<T> {
  name: string
  onInit?: (cache: CacheInstance<T>) => void
  onDestroy?: (cache: CacheInstance<T>) => void
  beforeGet?: (key: string) => void
  afterGet?: (key: string, value: T | undefined) => T | undefined
  beforeSet?: (key: string, value: T, options?: SetOptions) => { value: T; options?: SetOptions }
  afterSet?: (key: string, entry: CacheEntry<T>) => void
  beforeDelete?: (key: string) => boolean
  afterDelete?: (key: string, value: T) => void
  beforeSerialize?: (value: T) => T
  afterDeserialize?: (value: T) => T
}
```

### 8.2 Built-in Plugins
- **Compression** - LZ-string compression for large values
- **Tiered** - Multi-tier caching (L1/L2)
- **Encryption** - AES encryption for sensitive data
- **Logging** - Debug logging for cache operations

---

## 9. React Adapter

### 9.1 Components
- `CacheProvider` - Context provider for cache instance

### 9.2 Hooks
- `useCache()` - Access cache instance
- `useCachedValue(key, options)` - Cached value with loading state
- `useCachedQuery(key, fetcher, options)` - SWR-like data fetching
- `useCacheInvalidation()` - Cache invalidation utilities
- `useCacheStats(options)` - Real-time cache statistics

### 9.3 HOC
- `withCache(Component)` - Inject cache prop

---

## 10. Memory Management

### 10.1 Size Estimation
- Strings: `length * 2` bytes (UTF-16)
- Numbers: 8 bytes
- Booleans: 4 bytes
- Objects: Recursive size calculation
- Arrays: Sum of element sizes

### 10.2 Memory Limits
- `maxSize` - Maximum number of entries
- `maxMemory` - Maximum memory in bytes
- Eviction triggered when limits exceeded

---

## 11. Serialization

### 11.1 Default Serializer
- JSON.stringify/JSON.parse
- Handles basic types

### 11.2 Custom Serializer
- `serialize(value: T): string`
- `deserialize(data: string): T`
- Supports SuperJSON, msgpack, etc.

---

## 12. Error Handling

### 12.1 Error Types
- `CacheError` - Base error class
- `StorageError` - Storage operation failed
- `SerializationError` - Serialization failed
- `ValidationError` - Invalid input

### 12.2 Error Recovery
- Graceful degradation for storage failures
- Automatic cleanup of corrupted entries

---

## 13. Performance Targets

| Operation | Target |
|-----------|--------|
| Get (memory) | < 1μs |
| Set (memory) | < 10μs |
| Delete | < 5μs |
| Clear | < 100μs |
| Prune | < 1ms per 1000 entries |

---

## 14. Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+
- Node.js 18+

---

## 15. Bundle Analysis

### 15.1 Core Package
- Types: ~1KB
- Cache class: ~2KB
- Strategies: ~0.5KB
- Storage: ~0.5KB
- **Total: < 4KB gzipped**

### 15.2 React Adapter
- Provider: ~0.5KB
- Hooks: ~1.5KB
- **Additional: ~2KB gzipped**

---

## 16. Security Considerations

### 16.1 Data Protection
- Optional encryption plugin
- No sensitive data in default logs
- Safe serialization

### 16.2 Input Validation
- Key validation (non-empty strings)
- TTL validation (positive numbers)
- Size validation (positive integers)

---

## 17. Testing Strategy

### 17.1 Unit Tests
- All public methods
- All strategies
- All storage adapters
- Edge cases

### 17.2 Integration Tests
- Full workflow scenarios
- Persistence tests
- Concurrent access

### 17.3 Coverage Requirements
- Lines: 100%
- Branches: 100%
- Functions: 100%
- Statements: 100%

---

## 18. Documentation

### 18.1 Code Documentation
- JSDoc for all public APIs
- Type definitions
- Inline comments for complex logic

### 18.2 User Documentation
- Getting started guide
- API reference
- Examples
- Migration guides

---

## 19. Versioning

- Semantic versioning (SemVer)
- CHANGELOG.md for all releases
- Deprecation notices for breaking changes

---

## 20. Future Considerations

- Server-side rendering support
- Web Worker support
- Distributed cache coordination
- Cache warming utilities
- Query-based invalidation
