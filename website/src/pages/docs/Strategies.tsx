import { CodeBlock } from '../../components/CodeBlock'

export function Strategies() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Eviction Strategies</h1>
      <p className="text-lg text-slate-300 mb-8">
        CacheKeeper supports multiple eviction strategies to handle cache overflow.
        Choose the strategy that best fits your use case.
      </p>

      {/* LRU */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">LRU (Least Recently Used)</h2>
        <p className="text-slate-300 mb-4">
          The default strategy. Evicts entries that haven't been accessed for the longest time.
          Each <code className="text-sky-400">get()</code> or <code className="text-sky-400">set()</code> updates the entry's "last accessed" timestamp.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  strategy: 'lru',
  maxSize: 3,
})

cache.set('a', 1)
cache.set('b', 2)
cache.set('c', 3)

// Access 'a' - now 'b' is the least recently used
cache.get('a')

// Adding 'd' will evict 'b'
cache.set('d', 4)

console.log(cache.keys()) // ['a', 'c', 'd']`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Best for:</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>General-purpose caching</li>
            <li>Session data and user preferences</li>
            <li>Recently viewed items</li>
            <li>API response caching</li>
          </ul>
        </div>
      </section>

      {/* LFU */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">LFU (Least Frequently Used)</h2>
        <p className="text-slate-300 mb-4">
          Evicts entries with the lowest access count. Each access increments a counter.
          Entries that are accessed more often stay longer in the cache.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  strategy: 'lfu',
  maxSize: 3,
})

cache.set('a', 1)
cache.set('b', 2)
cache.set('c', 3)

// Access 'a' multiple times
cache.get('a') // count: 2
cache.get('a') // count: 3
cache.get('b') // count: 2

// 'c' has count 1, so it will be evicted
cache.set('d', 4)

console.log(cache.keys()) // ['a', 'b', 'd']`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Best for:</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Caches with "hot" data that's accessed frequently</li>
            <li>Reference data and lookups</li>
            <li>Popular content caching</li>
            <li>Long-running applications</li>
          </ul>
        </div>
      </section>

      {/* FIFO */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">FIFO (First In First Out)</h2>
        <p className="text-slate-300 mb-4">
          Evicts the oldest entries first, regardless of how often they're accessed.
          Simple and predictable behavior.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  strategy: 'fifo',
  maxSize: 3,
})

cache.set('a', 1) // First in
cache.set('b', 2)
cache.set('c', 3) // Last in

// Accessing doesn't change order
cache.get('a')
cache.get('a')

// 'a' is still first, so it will be evicted
cache.set('d', 4)

console.log(cache.keys()) // ['b', 'c', 'd']`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Best for:</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Queue-like data patterns</li>
            <li>Time-ordered data</li>
            <li>When all entries have equal importance</li>
            <li>Simple, predictable caching</li>
          </ul>
        </div>
      </section>

      {/* TTL */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">TTL (Time To Live Only)</h2>
        <p className="text-slate-300 mb-4">
          Only removes expired entries. Does not evict based on size limits.
          Useful when you want entries to persist until they naturally expire.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  strategy: 'ttl',
  ttl: 5000, // 5 seconds default
})

cache.set('short', 'expires soon', { ttl: 1000 })
cache.set('long', 'expires later', { ttl: 10000 })

// After 2 seconds...
await sleep(2000)

console.log(cache.get('short')) // undefined (expired)
console.log(cache.get('long'))  // 'expires later'

// Prune removes all expired entries
cache.prune()`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Best for:</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Session tokens and auth data</li>
            <li>Rate limiting counters</li>
            <li>Temporary data with known lifetime</li>
            <li>When memory is not a concern</li>
          </ul>
        </div>
      </section>

      {/* SWR */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">SWR (Stale-While-Revalidate)</h2>
        <p className="text-slate-300 mb-4">
          Returns stale data immediately while revalidating in the background.
          Provides fast responses while keeping data fresh.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  strategy: 'swr',
  ttl: 60000,       // Total cache time: 1 minute
  staleTime: 10000, // Fresh for 10 seconds, then stale
})

// First fetch - no cached data
const data1 = await cache.getOrSet('api-data', fetchFromAPI)
// Returns: { data, isStale: false }

// Within 10 seconds - fresh data
const data2 = cache.get('api-data')
// Returns: cached data (isStale: false)

// After 10 seconds - stale but valid
const data3 = cache.get('api-data')
// Returns: cached data (isStale: true)
// You can trigger a background refresh

// After 60 seconds - expired
const data4 = cache.get('api-data')
// Returns: undefined`}
          language="typescript"
        />
        <CodeBlock
          code={`// Check if data is stale
if (cache.isStale('api-data')) {
  // Trigger background revalidation
  fetchFromAPI().then(data => cache.set('api-data', data))
}

// Or use the SWR pattern with getOrSet
const result = await cache.getOrSet(
  'api-data',
  fetchFromAPI,
  {
    ttl: 60000,
    staleTime: 10000,
    // Automatically revalidates when stale
    revalidateOnStale: true,
  }
)`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Best for:</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>API response caching</li>
            <li>Data that changes but doesn't need real-time accuracy</li>
            <li>Improving perceived performance</li>
            <li>React applications with useCachedQuery</li>
          </ul>
        </div>
      </section>

      {/* Custom Strategy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Custom Strategy</h2>
        <p className="text-slate-300 mb-4">
          Implement your own eviction strategy by providing a custom function:
        </p>
        <CodeBlock
          code={`import { createCache, type CustomStrategy, type EvictionContext } from '@oxog/cachekeeper'

// Custom strategy: evict entries larger than average size
const largestFirstStrategy: CustomStrategy = {
  name: 'largest-first',

  selectForEviction(context: EvictionContext): string | null {
    const { entries, currentSize, maxSize } = context

    if (currentSize <= maxSize) return null

    let largestKey: string | null = null
    let largestSize = 0

    for (const [key, entry] of entries) {
      if (entry.size > largestSize) {
        largestSize = entry.size
        largestKey = key
      }
    }

    return largestKey
  }
}

const cache = createCache({
  strategy: largestFirstStrategy,
  maxSize: 100,
})`}
          language="typescript"
        />
      </section>

      {/* Strategy Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Strategy Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Strategy</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Evicts Based On</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Complexity</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Memory Overhead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">lru</td>
                <td className="py-3 px-4 text-slate-300">Last access time</td>
                <td className="py-3 px-4 text-slate-400">O(1)</td>
                <td className="py-3 px-4 text-slate-400">Low</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">lfu</td>
                <td className="py-3 px-4 text-slate-300">Access frequency</td>
                <td className="py-3 px-4 text-slate-400">O(1)</td>
                <td className="py-3 px-4 text-slate-400">Low</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">fifo</td>
                <td className="py-3 px-4 text-slate-300">Insertion order</td>
                <td className="py-3 px-4 text-slate-400">O(1)</td>
                <td className="py-3 px-4 text-slate-400">Very Low</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">ttl</td>
                <td className="py-3 px-4 text-slate-300">Expiration time</td>
                <td className="py-3 px-4 text-slate-400">O(1)</td>
                <td className="py-3 px-4 text-slate-400">Low</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">swr</td>
                <td className="py-3 px-4 text-slate-300">Staleness + LRU</td>
                <td className="py-3 px-4 text-slate-400">O(1)</td>
                <td className="py-3 px-4 text-slate-400">Low</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
