import { CodeBlock } from '../../components/CodeBlock'

export function Configuration() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Configuration</h1>
      <p className="text-lg text-slate-300 mb-8">
        Learn about all the configuration options available when creating a cache.
      </p>

      {/* Full Config */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Full Configuration</h2>
        <p className="text-slate-300 mb-4">
          Here's a complete example with all available options:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  // Eviction strategy
  strategy: 'lru',           // 'lru' | 'lfu' | 'fifo' | 'ttl' | 'swr'

  // Size limits
  maxSize: 100,              // Maximum number of entries
  maxMemory: 10 * 1024 * 1024, // Maximum memory in bytes (10MB)

  // Time-to-live
  ttl: 60000,                // Default TTL in milliseconds

  // Storage adapter
  storage: 'memory',         // 'memory' | 'local' | 'session' | 'indexeddb'

  // SWR options (only for 'swr' strategy)
  staleTime: 30000,          // Time before data becomes stale

  // Plugins
  plugins: [],               // Array of cache plugins

  // Custom serializer (for persistent storage)
  serializer: {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  },
})`}
          language="typescript"
          filename="config.ts"
        />
      </section>

      {/* Options Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Configuration Options</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Option</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Default</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">strategy</td>
                <td className="py-3 px-4 text-slate-400">string</td>
                <td className="py-3 px-4 text-slate-400">'lru'</td>
                <td className="py-3 px-4 text-slate-300">Eviction strategy to use</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">maxSize</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-400">1000</td>
                <td className="py-3 px-4 text-slate-300">Maximum number of entries</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">maxMemory</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-400">undefined</td>
                <td className="py-3 px-4 text-slate-300">Maximum memory in bytes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">ttl</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-400">undefined</td>
                <td className="py-3 px-4 text-slate-300">Default TTL in milliseconds</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">storage</td>
                <td className="py-3 px-4 text-slate-400">string</td>
                <td className="py-3 px-4 text-slate-400">'memory'</td>
                <td className="py-3 px-4 text-slate-300">Storage adapter to use</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">staleTime</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-400">undefined</td>
                <td className="py-3 px-4 text-slate-300">Time before data becomes stale (SWR)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">plugins</td>
                <td className="py-3 px-4 text-slate-400">Plugin[]</td>
                <td className="py-3 px-4 text-slate-400">[]</td>
                <td className="py-3 px-4 text-slate-300">Array of plugins to use</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">serializer</td>
                <td className="py-3 px-4 text-slate-400">object</td>
                <td className="py-3 px-4 text-slate-400">JSON</td>
                <td className="py-3 px-4 text-slate-300">Custom serializer for storage</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategy Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Strategy Options</h2>
        <p className="text-slate-300 mb-4">
          Available eviction strategies:
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-sky-400 mb-2">lru (Least Recently Used)</h3>
            <p className="text-slate-300 text-sm">
              Evicts the least recently accessed entries first. Best for general-purpose caching
              where recent data is more likely to be accessed again.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-sky-400 mb-2">lfu (Least Frequently Used)</h3>
            <p className="text-slate-300 text-sm">
              Evicts entries with the lowest access count. Best when some data is accessed
              much more often than others.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-sky-400 mb-2">fifo (First In First Out)</h3>
            <p className="text-slate-300 text-sm">
              Evicts the oldest entries first, regardless of access patterns. Simple and
              predictable behavior.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-sky-400 mb-2">ttl (Time To Live Only)</h3>
            <p className="text-slate-300 text-sm">
              Only removes expired entries. Does not evict based on size. Useful when you
              want entries to persist until they expire.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-sky-400 mb-2">swr (Stale-While-Revalidate)</h3>
            <p className="text-slate-300 text-sm">
              Returns stale data immediately while revalidating in the background.
              Great for UI responsiveness with background updates.
            </p>
          </div>
        </div>
      </section>

      {/* Storage Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Storage Options</h2>
        <p className="text-slate-300 mb-4">
          Available storage adapters:
        </p>
        <CodeBlock
          code={`// In-memory (default, fastest)
const memoryCache = createCache({ storage: 'memory' })

// localStorage (persists across sessions)
const localCache = createCache({ storage: 'local' })

// sessionStorage (persists during session)
const sessionCache = createCache({ storage: 'session' })

// IndexedDB (async, large storage)
const indexedCache = createCache({ storage: 'indexeddb' })`}
          language="typescript"
        />
      </section>

      {/* Custom Serializer */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Custom Serializer</h2>
        <p className="text-slate-300 mb-4">
          Provide a custom serializer for special data types or formats:
        </p>
        <CodeBlock
          code={`import superjson from 'superjson'

const cache = createCache({
  storage: 'local',
  serializer: {
    serialize: (value) => superjson.stringify(value),
    deserialize: (str) => superjson.parse(str),
  },
})

// Now supports Date, Map, Set, BigInt, etc.
cache.set('data', {
  date: new Date(),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
})`}
          language="typescript"
        />
      </section>

      {/* Minimal Config */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Minimal Configuration</h2>
        <p className="text-slate-300 mb-4">
          For simple use cases, you can create a cache with minimal or no configuration:
        </p>
        <CodeBlock
          code={`// Default configuration (LRU, 1000 entries, in-memory)
const cache = createCache()

// Just set a max size
const cache = createCache({ maxSize: 100 })

// Just set a default TTL
const cache = createCache({ ttl: 60000 })`}
          language="typescript"
        />
      </section>
    </div>
  )
}
