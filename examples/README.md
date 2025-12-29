# CacheKeeper Examples

This directory contains comprehensive examples demonstrating CacheKeeper features.

## Directory Structure

```
examples/
├── basic/                    # Fundamental cache operations
│   ├── simple-cache.ts       # Basic set, get, delete operations
│   ├── ttl-expiration.ts     # Time-to-live and expiration
│   ├── memoization.ts        # getOrSet and memoize functions
│   └── batch-operations.ts   # Batch get, set, delete
│
├── strategies/               # Eviction strategy examples
│   ├── lru-example.ts        # Least Recently Used
│   ├── lfu-example.ts        # Least Frequently Used
│   ├── fifo-example.ts       # First In First Out
│   ├── swr-example.ts        # Stale-While-Revalidate
│   └── ttl-only-example.ts   # TTL-only (no size eviction)
│
├── storage/                  # Storage adapter examples
│   ├── memory-storage.ts     # In-memory (default)
│   ├── local-storage.ts      # localStorage persistence
│   ├── session-storage.ts    # sessionStorage (tab-scoped)
│   └── indexed-db.ts         # IndexedDB (large data)
│
├── plugins/                  # Plugin examples
│   ├── compression-plugin.ts # Compress large values
│   ├── encryption-plugin.ts  # Encrypt sensitive data
│   ├── logging-plugin.ts     # Log cache operations
│   └── tiered-cache.ts       # Multi-level caching
│
└── react/                    # React integration examples
    ├── basic-hooks.tsx       # useCache, useCachedValue, useCacheStats
    ├── data-fetching.tsx     # useCachedQuery for API calls
    ├── cache-invalidation.tsx # Invalidation patterns
    └── with-cache-hoc.tsx    # HOC for class components
```

## Running Examples

These examples are TypeScript files meant to demonstrate API usage. To run them:

1. **In your project**: Copy the relevant code into your application
2. **Standalone**: Create a test file and import from `@oxog/cachekeeper`

```bash
# Install CacheKeeper
npm install @oxog/cachekeeper

# Run an example with ts-node
npx ts-node examples/basic/simple-cache.ts
```

## Quick Start

### Basic Usage

```typescript
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 100,
  defaultTTL: 60000, // 1 minute
});

cache.set('key', 'value');
console.log(cache.get('key')); // 'value'
```

### With React

```tsx
import { CacheProvider, useCachedQuery } from '@oxog/cachekeeper/react';
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({ maxSize: 1000 });

function App() {
  return (
    <CacheProvider cache={cache}>
      <MyComponent />
    </CacheProvider>
  );
}

function MyComponent() {
  const { data, isLoading } = useCachedQuery({
    key: 'users',
    fetcher: () => fetch('/api/users').then(r => r.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

## Learn More

- [Documentation](https://cachekeeper.oxog.dev)
- [API Reference](https://cachekeeper.oxog.dev/docs/api)
- [GitHub Repository](https://github.com/ersinkoc/cachekeeper)
