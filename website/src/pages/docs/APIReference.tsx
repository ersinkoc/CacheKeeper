import { CodeBlock } from '../../components/CodeBlock'

export function APIReference() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
      <p className="text-lg text-slate-300 mb-8">
        Complete API documentation for CacheKeeper.
      </p>

      {/* createCache */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">createCache(config?)</h2>
        <p className="text-slate-300 mb-4">
          Creates a new cache instance with the specified configuration.
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  strategy?: 'lru' | 'lfu' | 'fifo' | 'ttl' | 'swr' | CustomStrategy
  maxSize?: number        // Default: 1000
  maxMemory?: number      // In bytes
  ttl?: number           // Default TTL in ms
  staleTime?: number     // For SWR strategy
  storage?: 'memory' | 'local' | 'session' | 'indexeddb' | StorageAdapter
  plugins?: CachePlugin[]
  serializer?: { serialize: (v) => string, deserialize: (s) => any }
})`}
          language="typescript"
        />
      </section>

      {/* Core Methods */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Core Methods</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">get&lt;T&gt;(key: string): T | undefined</h3>
            <p className="text-slate-300 mb-2">Retrieves a value from the cache.</p>
            <CodeBlock code={`const user = cache.get<User>('user:123')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">set&lt;T&gt;(key: string, value: T, options?): void</h3>
            <p className="text-slate-300 mb-2">Stores a value in the cache.</p>
            <CodeBlock
              code={`cache.set('user:123', user, {
  ttl?: number      // TTL in milliseconds
  tags?: string[]   // Tags for grouping
})`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">has(key: string): boolean</h3>
            <p className="text-slate-300 mb-2">Checks if a key exists and is not expired.</p>
            <CodeBlock code={`if (cache.has('user:123')) { ... }`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">delete(key: string): boolean</h3>
            <p className="text-slate-300 mb-2">Removes an entry from the cache.</p>
            <CodeBlock code={`cache.delete('user:123')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">clear(): void</h3>
            <p className="text-slate-300 mb-2">Removes all entries from the cache.</p>
            <CodeBlock code={`cache.clear()`} language="typescript" />
          </div>
        </div>
      </section>

      {/* TTL Methods */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">TTL Methods</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">ttl(key: string): number | null</h3>
            <p className="text-slate-300 mb-2">Returns remaining TTL in milliseconds, or null if no TTL.</p>
            <CodeBlock code={`const remaining = cache.ttl('session')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">touch(key: string): boolean</h3>
            <p className="text-slate-300 mb-2">Refreshes the TTL of an entry.</p>
            <CodeBlock code={`cache.touch('session')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">expire(key: string): boolean</h3>
            <p className="text-slate-300 mb-2">Forces an entry to expire immediately.</p>
            <CodeBlock code={`cache.expire('temp-data')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">prune(): number</h3>
            <p className="text-slate-300 mb-2">Removes all expired entries. Returns count of removed entries.</p>
            <CodeBlock code={`const removed = cache.prune()`} language="typescript" />
          </div>
        </div>
      </section>

      {/* Memoization */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Memoization</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">getOrSet&lt;T&gt;(key, factory, options?): T | Promise&lt;T&gt;</h3>
            <p className="text-slate-300 mb-2">Gets a value or sets it using the factory if not cached.</p>
            <CodeBlock
              code={`const user = await cache.getOrSet(
  'user:123',
  async () => fetchUser('123'),
  { ttl: 60000 }
)`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">memoize&lt;T, Args&gt;(fn, keyGen?, options?)</h3>
            <p className="text-slate-300 mb-2">Creates a memoized version of a function.</p>
            <CodeBlock
              code={`const memoizedFetch = cache.memoize(
  async (id: string) => fetchUser(id),
  (id) => \`user:\${id}\`,
  { ttl: 60000 }
)`}
              language="typescript"
            />
          </div>
        </div>
      </section>

      {/* Batch Operations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Batch Operations</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">getMany&lt;T&gt;(keys: string[]): Map&lt;string, T&gt;</h3>
            <p className="text-slate-300 mb-2">Gets multiple values at once.</p>
            <CodeBlock code={`const users = cache.getMany(['user:1', 'user:2', 'user:3'])`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">setMany(entries: BatchSetEntry[]): void</h3>
            <p className="text-slate-300 mb-2">Sets multiple values at once.</p>
            <CodeBlock
              code={`cache.setMany([
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2, ttl: 60000 },
])`}
              language="typescript"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">deleteMany(keys: string[]): number</h3>
            <p className="text-slate-300 mb-2">Deletes multiple entries. Returns count of deleted.</p>
            <CodeBlock code={`cache.deleteMany(['user:1', 'user:2'])`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">hasMany(keys: string[]): Map&lt;string, boolean&gt;</h3>
            <p className="text-slate-300 mb-2">Checks existence of multiple keys.</p>
            <CodeBlock code={`const exists = cache.hasMany(['user:1', 'user:2'])`} language="typescript" />
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Tag Methods</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">getByTag&lt;T&gt;(tag: string): T[]</h3>
            <p className="text-slate-300 mb-2">Gets all values with a specific tag.</p>
            <CodeBlock code={`const users = cache.getByTag<User>('users')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">getKeysByTag(tag: string): string[]</h3>
            <p className="text-slate-300 mb-2">Gets all keys with a specific tag.</p>
            <CodeBlock code={`const keys = cache.getKeysByTag('users')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">deleteByTag(tag: string): number</h3>
            <p className="text-slate-300 mb-2">Deletes all entries with a specific tag.</p>
            <CodeBlock code={`cache.deleteByTag('user:123')`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">hasTag(tag: string): boolean</h3>
            <p className="text-slate-300 mb-2">Checks if any entries have the tag.</p>
            <CodeBlock code={`if (cache.hasTag('users')) { ... }`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">tags(key: string): string[]</h3>
            <p className="text-slate-300 mb-2">Gets all tags for a specific entry.</p>
            <CodeBlock code={`const tags = cache.tags('user:123')`} language="typescript" />
          </div>
        </div>
      </section>

      {/* Namespaces */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Namespace Methods</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">namespace(prefix: string): CacheNamespace</h3>
            <p className="text-slate-300 mb-2">Creates a namespaced view of the cache.</p>
            <CodeBlock
              code={`const users = cache.namespace('users')
users.set('123', user) // Actually sets 'users:123'`}
              language="typescript"
            />
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Event Methods</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">on(event, handler): Unsubscribe</h3>
            <p className="text-slate-300 mb-2">Subscribes to cache events.</p>
            <CodeBlock code={`const unsub = cache.on('hit', (e) => console.log(e.key))`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">off(event, handler): void</h3>
            <p className="text-slate-300 mb-2">Unsubscribes from cache events.</p>
            <CodeBlock code={`cache.off('hit', handler)`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">once(event, handler): Unsubscribe</h3>
            <p className="text-slate-300 mb-2">Subscribes to a single event occurrence.</p>
            <CodeBlock code={`cache.once('set', (e) => console.log('First set:', e.key))`} language="typescript" />
          </div>
        </div>
      </section>

      {/* Stats & Serialization */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Statistics & Serialization</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">stats(): CacheStats</h3>
            <p className="text-slate-300 mb-2">Returns current cache statistics.</p>
            <CodeBlock code={`const stats = cache.stats()`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">resetStats(): void</h3>
            <p className="text-slate-300 mb-2">Resets hit/miss counters.</p>
            <CodeBlock code={`cache.resetStats()`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">dump(): CacheDump</h3>
            <p className="text-slate-300 mb-2">Exports cache state for persistence.</p>
            <CodeBlock code={`const dump = cache.dump()`} language="typescript" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-sky-400 mb-2">restore(dump: CacheDump): void</h3>
            <p className="text-slate-300 mb-2">Restores cache state from a dump.</p>
            <CodeBlock code={`cache.restore(dump)`} language="typescript" />
          </div>
        </div>
      </section>

      {/* Properties */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Properties</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Property</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">size</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Current number of entries</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">maxSize</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Maximum allowed entries</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">keys()</td>
                <td className="py-3 px-4 text-slate-400">string[]</td>
                <td className="py-3 px-4 text-slate-300">All cache keys</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">values()</td>
                <td className="py-3 px-4 text-slate-400">unknown[]</td>
                <td className="py-3 px-4 text-slate-300">All cached values</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">entries()</td>
                <td className="py-3 px-4 text-slate-400">[string, unknown][]</td>
                <td className="py-3 px-4 text-slate-300">All key-value pairs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Utility Exports */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Utility Exports</h2>
        <CodeBlock
          code={`import {
  // Size utilities
  estimateSize,   // Estimate memory size of a value
  formatBytes,    // Format bytes as human-readable string

  // Time utilities
  now,            // Current timestamp
  isExpired,      // Check if entry is expired
  getRemainingTTL, // Get remaining TTL
  getExpirationDate, // Get expiration as Date
} from '@oxog/cachekeeper'

// Usage
const size = estimateSize({ name: 'John' }) // 48
const formatted = formatBytes(1536) // "1.5 KB"
const remaining = getRemainingTTL(entry) // 45000`}
          language="typescript"
        />
      </section>
    </div>
  )
}
