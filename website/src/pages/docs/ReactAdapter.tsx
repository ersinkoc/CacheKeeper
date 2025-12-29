import { CodeBlock } from '../../components/CodeBlock'

export function ReactAdapter() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">React Adapter</h1>
      <p className="text-lg text-slate-300 mb-8">
        First-class React integration with hooks, provider, and HOC.
      </p>

      {/* Installation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Setup</h2>
        <p className="text-slate-300 mb-4">
          Wrap your app with <code className="text-sky-400">CacheProvider</code>:
        </p>
        <CodeBlock
          code={`import { CacheProvider } from '@oxog/cachekeeper/react'

function App() {
  return (
    <CacheProvider
      config={{
        strategy: 'lru',
        maxSize: 100,
        ttl: 60000,
      }}
    >
      <YourApp />
    </CacheProvider>
  )
}`}
          language="tsx"
          filename="App.tsx"
        />
      </section>

      {/* useCache */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">useCache</h2>
        <p className="text-slate-300 mb-4">
          Access the cache instance directly:
        </p>
        <CodeBlock
          code={`import { useCache } from '@oxog/cachekeeper/react'

function MyComponent() {
  const cache = useCache()

  const handleClick = () => {
    cache.set('clicked', true)
    console.log(cache.get('clicked'))
  }

  return <button onClick={handleClick}>Click me</button>
}`}
          language="tsx"
        />
      </section>

      {/* useCachedValue */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">useCachedValue</h2>
        <p className="text-slate-300 mb-4">
          Simple cached state that persists across renders:
        </p>
        <CodeBlock
          code={`import { useCachedValue } from '@oxog/cachekeeper/react'

function Counter() {
  const [count, setCount] = useCachedValue('counter', 0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  )
}

// With TTL
function TimedValue() {
  const [value, setValue] = useCachedValue('temp', 'initial', {
    ttl: 30000, // Expires after 30 seconds
  })

  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}`}
          language="tsx"
        />
      </section>

      {/* useCachedQuery */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">useCachedQuery</h2>
        <p className="text-slate-300 mb-4">
          Data fetching with caching, similar to React Query or SWR:
        </p>
        <CodeBlock
          code={`import { useCachedQuery } from '@oxog/cachekeeper/react'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch, isStale } = useCachedQuery(
    \`user:\${userId}\`,
    () => fetch(\`/api/users/\${userId}\`).then(r => r.json()),
    {
      ttl: 60000,      // Cache for 1 minute
      staleTime: 30000, // Consider stale after 30 seconds
    }
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
      {isStale && <span>Data may be outdated</span>}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}`}
          language="tsx"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Return Value</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
            <li><code>data</code> - The fetched data (or undefined)</li>
            <li><code>isLoading</code> - True during initial fetch</li>
            <li><code>isFetching</code> - True during any fetch</li>
            <li><code>isStale</code> - True if data is stale but valid</li>
            <li><code>error</code> - Error object if fetch failed</li>
            <li><code>refetch</code> - Function to manually refetch</li>
          </ul>
        </div>
      </section>

      {/* useCachedQuery Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">useCachedQuery Options</h2>
        <CodeBlock
          code={`useCachedQuery(key, fetcher, {
  // Time-to-live in milliseconds
  ttl: 60000,

  // Time before data becomes stale
  staleTime: 30000,

  // Refetch when window regains focus
  refetchOnWindowFocus: true,

  // Refetch at intervals (milliseconds)
  refetchInterval: 30000,

  // Don't fetch on mount (manual fetch only)
  enabled: true,

  // Initial data while loading
  initialData: { name: 'Loading...' },

  // Tags for invalidation
  tags: ['users'],

  // Callbacks
  onSuccess: (data) => console.log('Fetched:', data),
  onError: (error) => console.error('Failed:', error),
})`}
          language="typescript"
        />
      </section>

      {/* useCacheInvalidation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">useCacheInvalidation</h2>
        <p className="text-slate-300 mb-4">
          Utilities for invalidating cached data:
        </p>
        <CodeBlock
          code={`import { useCacheInvalidation } from '@oxog/cachekeeper/react'

function LogoutButton() {
  const {
    invalidate,      // Invalidate specific key
    invalidateByTag, // Invalidate by tag
    invalidateAll,   // Clear entire cache
  } = useCacheInvalidation()

  const handleLogout = async () => {
    // Clear user-related cache
    invalidateByTag('user')
    invalidateByTag('session')

    // Or clear everything
    // invalidateAll()

    await logout()
  }

  return <button onClick={handleLogout}>Logout</button>
}

// Invalidate after mutation
function UpdateUserForm({ userId }: { userId: string }) {
  const { invalidate } = useCacheInvalidation()

  const handleSubmit = async (data: UserData) => {
    await updateUser(userId, data)

    // Invalidate the cached user data
    invalidate(\`user:\${userId}\`)
  }

  return <form onSubmit={handleSubmit}>...</form>
}`}
          language="tsx"
        />
      </section>

      {/* useCacheStats */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">useCacheStats</h2>
        <p className="text-slate-300 mb-4">
          Real-time cache statistics:
        </p>
        <CodeBlock
          code={`import { useCacheStats } from '@oxog/cachekeeper/react'

function CacheMonitor() {
  const stats = useCacheStats({
    interval: 1000, // Update every second
  })

  return (
    <div className="stats-panel">
      <div>
        <label>Hit Rate</label>
        <span>{(stats.hitRate * 100).toFixed(1)}%</span>
      </div>
      <div>
        <label>Entries</label>
        <span>{stats.size} / {stats.maxSize}</span>
      </div>
      <div>
        <label>Memory</label>
        <span>{formatBytes(stats.memoryUsage)}</span>
      </div>
      <div>
        <label>Hits / Misses</label>
        <span>{stats.hits} / {stats.misses}</span>
      </div>
    </div>
  )
}`}
          language="tsx"
        />
      </section>

      {/* withCache HOC */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">withCache HOC</h2>
        <p className="text-slate-300 mb-4">
          Higher-order component for class components:
        </p>
        <CodeBlock
          code={`import { withCache, type WithCacheProps } from '@oxog/cachekeeper/react'

interface Props extends WithCacheProps {
  userId: string
}

class UserProfileClass extends React.Component<Props> {
  componentDidMount() {
    const { cache } = this.props
    cache.set('mounted', true)
  }

  render() {
    const { cache, userId } = this.props
    const user = cache.get(\`user:\${userId}\`)

    return <div>{user?.name}</div>
  }
}

export const UserProfile = withCache(UserProfileClass)`}
          language="tsx"
        />
      </section>

      {/* Multiple Caches */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Multiple Caches</h2>
        <p className="text-slate-300 mb-4">
          Use multiple cache instances with named providers:
        </p>
        <CodeBlock
          code={`import { CacheProvider, useCache } from '@oxog/cachekeeper/react'

function App() {
  return (
    <CacheProvider name="api" config={{ strategy: 'lru', maxSize: 100 }}>
      <CacheProvider name="ui" config={{ strategy: 'fifo', maxSize: 50 }}>
        <MyApp />
      </CacheProvider>
    </CacheProvider>
  )
}

function MyComponent() {
  // Access specific cache by name
  const apiCache = useCache('api')
  const uiCache = useCache('ui')

  // Or use default (innermost provider)
  const defaultCache = useCache()
}`}
          language="tsx"
        />
      </section>

      {/* SSR Considerations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Server-Side Rendering</h2>
        <p className="text-slate-300 mb-4">
          CacheKeeper works with SSR frameworks like Next.js:
        </p>
        <CodeBlock
          code={`// pages/_app.tsx (Next.js)
import { CacheProvider } from '@oxog/cachekeeper/react'

function MyApp({ Component, pageProps }) {
  return (
    <CacheProvider
      config={{
        strategy: 'lru',
        maxSize: 100,
        // Use memory storage for SSR compatibility
        storage: 'memory',
      }}
    >
      <Component {...pageProps} />
    </CacheProvider>
  )
}

// Hydration with initial data
function Page({ initialData }) {
  const { data } = useCachedQuery(
    'page-data',
    fetchPageData,
    { initialData }
  )

  return <div>{data.title}</div>
}

export async function getServerSideProps() {
  const data = await fetchPageData()
  return { props: { initialData: data } }
}`}
          language="tsx"
        />
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Best Practices</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Use Stable Keys</h4>
            <p className="text-slate-300 text-sm">
              Cache keys should be stable and deterministic. Include all variables
              that affect the fetched data in the key.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Prefer useCachedQuery</h4>
            <p className="text-slate-300 text-sm">
              For data fetching, prefer <code>useCachedQuery</code> over manual
              cache operations. It handles loading states, errors, and refetching.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Use Tags for Related Data</h4>
            <p className="text-slate-300 text-sm">
              Tag related data for easy bulk invalidation. For example, tag all
              user-related queries with the user ID.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Invalidate After Mutations</h4>
            <p className="text-slate-300 text-sm">
              After updating data on the server, invalidate the corresponding
              cache entries to keep the UI in sync.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
