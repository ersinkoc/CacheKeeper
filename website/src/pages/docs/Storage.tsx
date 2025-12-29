import { CodeBlock } from '../../components/CodeBlock'

export function Storage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Storage Adapters</h1>
      <p className="text-lg text-slate-300 mb-8">
        CacheKeeper supports multiple storage backends. Choose based on your
        persistence and performance requirements.
      </p>

      {/* Memory Storage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Memory Storage (Default)</h2>
        <p className="text-slate-300 mb-4">
          In-memory storage using a JavaScript Map. Fastest option but data is lost on page refresh.
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  storage: 'memory', // This is the default
  maxSize: 1000,
})

// Fast synchronous operations
cache.set('key', 'value')
const value = cache.get('key')`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-green-400 font-semibold mb-2">Pros:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Fastest performance</li>
                <li>No serialization overhead</li>
                <li>Stores any JavaScript value</li>
                <li>No size limits (except memory)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-semibold mb-2">Cons:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Data lost on refresh</li>
                <li>Not shared between tabs</li>
                <li>Uses JavaScript heap</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* localStorage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">localStorage</h2>
        <p className="text-slate-300 mb-4">
          Persistent storage that survives page refreshes and browser restarts.
          Limited to ~5MB in most browsers.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  storage: 'local',
  maxSize: 100,
})

// Data persists across sessions
cache.set('user-preferences', { theme: 'dark', language: 'en' })

// Still available after page refresh
const prefs = cache.get('user-preferences')`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-green-400 font-semibold mb-2">Pros:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Persists across sessions</li>
                <li>Synchronous API</li>
                <li>Simple and reliable</li>
                <li>Shared between tabs</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-semibold mb-2">Cons:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>~5MB limit</li>
                <li>Serialization required</li>
                <li>Blocks main thread</li>
                <li>String values only</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* sessionStorage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">sessionStorage</h2>
        <p className="text-slate-300 mb-4">
          Similar to localStorage but data is cleared when the tab is closed.
          Useful for temporary session data.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  storage: 'session',
  maxSize: 100,
})

// Data persists during the session
cache.set('form-draft', { title: 'My Post', content: '...' })

// Lost when tab is closed
const draft = cache.get('form-draft')`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-green-400 font-semibold mb-2">Pros:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Persists across refreshes</li>
                <li>Auto-clears on tab close</li>
                <li>Isolated per tab</li>
                <li>Same API as localStorage</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-semibold mb-2">Cons:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>~5MB limit</li>
                <li>Not shared between tabs</li>
                <li>Serialization required</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* IndexedDB */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">IndexedDB</h2>
        <p className="text-slate-300 mb-4">
          Asynchronous storage with much larger capacity. Ideal for large datasets
          or when you need more than 5MB.
        </p>
        <CodeBlock
          code={`const cache = createCache({
  storage: 'indexeddb',
  maxSize: 10000,
})

// Async operations (returns promises)
await cache.set('large-data', hugeDataset)
const data = await cache.get('large-data')

// Or use with async/await
async function loadData() {
  const cached = await cache.get('api-response')
  if (cached) return cached

  const fresh = await fetchFromAPI()
  await cache.set('api-response', fresh)
  return fresh
}`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-green-400 font-semibold mb-2">Pros:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Large storage capacity</li>
                <li>Non-blocking async API</li>
                <li>Structured data support</li>
                <li>Persists across sessions</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-semibold mb-2">Cons:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Async only (needs await)</li>
                <li>More complex API</li>
                <li>Slightly slower than memory</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Storage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Custom Storage Adapter</h2>
        <p className="text-slate-300 mb-4">
          Implement your own storage adapter for custom backends:
        </p>
        <CodeBlock
          code={`import { createCache, type StorageAdapter } from '@oxog/cachekeeper'

// Custom Redis-like storage adapter
const redisAdapter: StorageAdapter = {
  get(key: string) {
    return redisClient.get(key)
  },

  set(key: string, value: string) {
    redisClient.set(key, value)
  },

  delete(key: string) {
    redisClient.del(key)
  },

  clear() {
    redisClient.flushdb()
  },

  keys() {
    return redisClient.keys('*')
  },

  has(key: string) {
    return redisClient.exists(key) > 0
  },

  get size() {
    return redisClient.dbsize()
  }
}

const cache = createCache({
  storage: redisAdapter,
  maxSize: 10000,
})`}
          language="typescript"
        />
      </section>

      {/* Comparison Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Storage Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Storage</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Capacity</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Persistence</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">API</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">memory</td>
                <td className="py-3 px-4 text-slate-300">Unlimited*</td>
                <td className="py-3 px-4 text-slate-400">None</td>
                <td className="py-3 px-4 text-slate-400">Sync</td>
                <td className="py-3 px-4 text-slate-300">Performance critical</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">local</td>
                <td className="py-3 px-4 text-slate-300">~5MB</td>
                <td className="py-3 px-4 text-slate-400">Permanent</td>
                <td className="py-3 px-4 text-slate-400">Sync</td>
                <td className="py-3 px-4 text-slate-300">User preferences</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">session</td>
                <td className="py-3 px-4 text-slate-300">~5MB</td>
                <td className="py-3 px-4 text-slate-400">Tab session</td>
                <td className="py-3 px-4 text-slate-400">Sync</td>
                <td className="py-3 px-4 text-slate-300">Form drafts</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">indexeddb</td>
                <td className="py-3 px-4 text-slate-300">Large (GB+)</td>
                <td className="py-3 px-4 text-slate-400">Permanent</td>
                <td className="py-3 px-4 text-slate-400">Async</td>
                <td className="py-3 px-4 text-slate-300">Large datasets</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-400 text-sm mt-2">* Limited by available JavaScript heap memory</p>
      </section>
    </div>
  )
}
