# CacheKeeper

<div align="center">
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

- **Multiple Strategies** - LRU, LFU, FIFO, TTL, SWR
- **TTL Support** - Automatic expiration with configurable intervals
- **Namespaces** - Organized cache groups with hierarchical structure
- **Tags** - Tag-based invalidation for flexible cache management
- **SWR** - Stale-while-revalidate pattern for optimal UX
- **Statistics** - Hit rate, memory usage, and performance metrics
- **Storage** - Memory, localStorage, sessionStorage, IndexedDB
- **React Adapter** - Hooks & components for seamless React integration
- **Zero Dependencies** - Lightweight with no external dependencies
- **< 4KB** - Tiny bundle size, fully tree-shakeable

## Installation

```bash
npm install @oxog/cachekeeper
```

```bash
yarn add @oxog/cachekeeper
```

```bash
pnpm add @oxog/cachekeeper
```

## Quick Start

```typescript
import { createCache } from '@oxog/cachekeeper'

// Create a cache with LRU strategy
const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
})

// Basic operations
cache.set('user:1', { name: 'Alice', email: 'alice@example.com' })
const user = cache.get('user:1')

// With TTL
cache.set('session', sessionData, { ttl: 3600000 }) // 1 hour

// With tags
cache.set('product:1', productData, {
  tags: ['products', 'electronics'],
})

// Invalidate by tag
cache.invalidateByTag('products')
```

## Memoization

```typescript
// Memoize expensive function
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

// First call: fetches from API
const user = await fetchUser('123')

// Second call: returns cached result
const cachedUser = await fetchUser('123')
```

## Namespaces

```typescript
// Create namespaces for organization
const userCache = cache.namespace('user')
const productCache = cache.namespace('product')

userCache.set('1', { name: 'Alice' })
productCache.set('1', { name: 'Widget' })

// Clear only user namespace
userCache.clear()
```

## Stale-While-Revalidate

```typescript
const cache = createCache({
  strategy: 'swr',
  staleTime: 60000,      // Fresh for 1 min
  revalidateTime: 300000, // Expire after 5 min
})

// Returns stale data immediately while revalidating in background
const data = await cache.getOrSet('api:data', fetchData)
```

## React Integration

```tsx
import { CacheProvider, useCachedQuery } from '@oxog/cachekeeper/react'
import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
})

function App() {
  return (
    <CacheProvider cache={cache}>
      <Products />
    </CacheProvider>
  )
}

function Products() {
  const { data, isLoading, error, mutate } = useCachedQuery(
    'products',
    fetchProducts,
    {
      ttl: 300000,
      revalidateOnFocus: true,
    }
  )

  if (isLoading) return <Spinner />
  if (error) return <Error error={error} />

  return <ProductList products={data} />
}
```

## Cache Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **LRU** | Least Recently Used | General purpose caching |
| **LFU** | Least Frequently Used | Hot/cold data patterns |
| **FIFO** | First In First Out | Queue-like patterns |
| **TTL** | Time-based expiration only | Session data, tokens |
| **SWR** | Stale-While-Revalidate | API responses |

## Storage Backends

```typescript
// Memory (default)
const memoryCache = createCache({ storage: 'memory' })

// localStorage (persistent)
const localCache = createCache({
  storage: 'local',
  storageKey: 'my-app-cache',
})

// sessionStorage
const sessionCache = createCache({
  storage: 'session',
  storageKey: 'my-app-cache',
})

// IndexedDB (for large data)
import { indexedDBStorage } from '@oxog/cachekeeper/storage'

const idbCache = createCache({
  storage: indexedDBStorage({
    dbName: 'my-cache-db',
    storeName: 'cache',
  }),
})
```

## Plugins

```typescript
import { compressionPlugin, loggingPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    compressionPlugin({ threshold: 1024 }),
    loggingPlugin({ level: 'debug' }),
  ],
})
```

## Statistics

```typescript
const stats = cache.getStats()

console.log({
  hitRate: stats.hitRate,      // 0.85 (85%)
  size: stats.size,            // 150 entries
  memoryUsage: stats.memoryUsage, // bytes
  uptime: stats.uptime,        // ms
})
```

## API Reference

### createCache(config?)

Creates a new cache instance.

```typescript
const cache = createCache({
  strategy: 'lru',     // 'lru' | 'lfu' | 'fifo' | 'ttl' | 'swr' | CustomStrategy
  maxSize: 1000,       // Maximum number of entries
  maxMemory: 50 * 1024 * 1024, // Max memory in bytes
  ttl: 300000,         // Default TTL in ms
  checkInterval: 60000, // Expiration check interval
  storage: 'memory',   // 'memory' | 'local' | 'session' | StorageAdapter
  storageKey: 'cache', // Prefix for storage keys
  plugins: [],         // Array of plugins
})
```

### CacheInstance Methods

| Method | Description |
|--------|-------------|
| `get(key)` | Get a value |
| `set(key, value, options?)` | Set a value |
| `has(key)` | Check if key exists |
| `delete(key)` | Delete a key |
| `clear()` | Clear all entries |
| `getTTL(key)` | Get remaining TTL |
| `setTTL(key, ttl)` | Update TTL |
| `touch(key)` | Refresh TTL |
| `namespace(name)` | Get/create namespace |
| `invalidateByTag(tag)` | Invalidate by tag |
| `getOrSet(key, factory)` | Get or compute value |
| `memoize(fn, options)` | Memoize a function |
| `getStats()` | Get statistics |
| `dump()` | Export cache state |
| `restore(dump)` | Import cache state |

## TypeScript Support

CacheKeeper is written in TypeScript and provides full type definitions.

```typescript
interface User {
  id: string
  name: string
  email: string
}

const cache = createCache<User>()

cache.set('user:1', { id: '1', name: 'Alice', email: 'alice@example.com' })

const user = cache.get('user:1') // User | undefined
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Documentation

Visit [cachekeeper.oxog.dev](https://cachekeeper.oxog.dev) for full documentation.

## License

MIT © [Ersin KOC](https://github.com/ersinkoc)
