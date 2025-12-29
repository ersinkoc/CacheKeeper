import { useState } from 'react'
import { motion } from 'framer-motion'
import { CodeBlock } from '../components/CodeBlock'

const examples = [
  {
    id: 'basic',
    title: 'Basic Usage',
    description: 'Simple cache operations with get, set, and delete.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  strategy: 'lru',
  maxSize: 100,
})

// Set a value
cache.set('user:1', { name: 'John', email: 'john@example.com' })

// Get a value
const user = cache.get('user:1')
console.log(user) // { name: 'John', email: 'john@example.com' }

// Check if key exists
if (cache.has('user:1')) {
  console.log('User exists in cache')
}

// Delete a value
cache.delete('user:1')

// Clear all entries
cache.clear()`,
  },
  {
    id: 'ttl',
    title: 'TTL & Expiration',
    description: 'Set expiration times for cache entries.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({
  strategy: 'lru',
  maxSize: 100,
  ttl: 60000, // Default 1 minute TTL
})

// Use default TTL
cache.set('session', { token: 'abc123' })

// Custom TTL per entry
cache.set('temp-data', { value: 42 }, { ttl: 5000 }) // 5 seconds

// Check remaining TTL
const remaining = cache.ttl('session')
console.log(\`Time remaining: \${remaining}ms\`)

// Refresh TTL (touch)
cache.touch('session')

// Force expire an entry
cache.expire('temp-data')`,
  },
  {
    id: 'memoization',
    title: 'Memoization',
    description: 'Cache function results automatically.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ strategy: 'lru', maxSize: 100 })

// getOrSet - compute only if not cached
const user = await cache.getOrSet(
  'user:123',
  async () => {
    // Only called if not in cache
    const response = await fetch('/api/users/123')
    return response.json()
  },
  { ttl: 60000 }
)

// memoize - wrap any function
const fetchUser = cache.memoize(
  async (id: string) => {
    const response = await fetch(\`/api/users/\${id}\`)
    return response.json()
  },
  (id) => \`user:\${id}\` // Key generator
)

// First call - fetches from API
const user1 = await fetchUser('123')

// Second call - returns cached value
const user2 = await fetchUser('123')`,
  },
  {
    id: 'namespaces',
    title: 'Namespaces',
    description: 'Organize cache entries with namespaces.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ strategy: 'lru', maxSize: 1000 })

// Create namespaces
const users = cache.namespace('users')
const posts = cache.namespace('posts')

// Operations are isolated
users.set('1', { name: 'John' })
posts.set('1', { title: 'Hello World' })

// Get from namespace
const user = users.get('1')
const post = posts.get('1')

// Keys are prefixed automatically
console.log(cache.keys()) // ['users:1', 'posts:1']

// Clear only one namespace
users.clear()

// Nested namespaces
const adminUsers = cache.namespace('admin').namespace('users')
adminUsers.set('1', { name: 'Admin' })
// Key: 'admin:users:1'`,
  },
  {
    id: 'tags',
    title: 'Tags & Invalidation',
    description: 'Group entries with tags for bulk operations.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ strategy: 'lru', maxSize: 100 })

// Set with tags
cache.set('user:1', { name: 'John' }, { tags: ['user', 'active'] })
cache.set('user:2', { name: 'Jane' }, { tags: ['user', 'active'] })
cache.set('post:1', { title: 'Hello' }, { tags: ['post', 'user:1'] })

// Get entries by tag
const users = cache.getByTag('user')
console.log(users) // [{ name: 'John' }, { name: 'Jane' }]

// Invalidate by tag
cache.deleteByTag('active')
// Removes user:1 and user:2

// Check if tag exists
if (cache.hasTag('post')) {
  console.log('Has posts')
}

// Get all tags for an entry
const tags = cache.tags('user:1')
console.log(tags) // ['user', 'active']`,
  },
  {
    id: 'events',
    title: 'Event System',
    description: 'Subscribe to cache lifecycle events.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ strategy: 'lru', maxSize: 100 })

// Subscribe to events
cache.on('hit', (event) => {
  console.log(\`Cache hit: \${event.key}\`)
})

cache.on('miss', (event) => {
  console.log(\`Cache miss: \${event.key}\`)
})

cache.on('set', (event) => {
  console.log(\`Set: \${event.key}\`, event.value)
})

cache.on('delete', (event) => {
  console.log(\`Deleted: \${event.key}, reason: \${event.reason}\`)
})

cache.on('evict', (event) => {
  console.log(\`Evicted: \${event.key} by \${event.strategy}\`)
})

// Unsubscribe
const unsubscribe = cache.on('expire', (event) => {
  console.log(\`Expired: \${event.key}\`)
})
unsubscribe() // Stop listening`,
  },
  {
    id: 'batch',
    title: 'Batch Operations',
    description: 'Efficient bulk get, set, and delete.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ strategy: 'lru', maxSize: 100 })

// Batch set
cache.setMany([
  { key: 'user:1', value: { name: 'John' } },
  { key: 'user:2', value: { name: 'Jane' } },
  { key: 'user:3', value: { name: 'Bob' }, ttl: 30000 },
])

// Batch get
const users = cache.getMany(['user:1', 'user:2', 'user:3'])
// Map { 'user:1' => {...}, 'user:2' => {...}, 'user:3' => {...} }

// Batch has
const exists = cache.hasMany(['user:1', 'user:4'])
// Map { 'user:1' => true, 'user:4' => false }

// Batch delete
cache.deleteMany(['user:1', 'user:2'])

// Batch getOrSet
const results = await cache.getOrSetMany(
  ['user:1', 'user:2'],
  async (key) => {
    const id = key.split(':')[1]
    return fetch(\`/api/users/\${id}\`).then(r => r.json())
  }
)`,
  },
  {
    id: 'react',
    title: 'React Integration',
    description: 'Use hooks for seamless React integration.',
    code: `import {
  CacheProvider,
  useCache,
  useCachedQuery,
  useCachedValue,
  useCacheInvalidation
} from '@oxog/cachekeeper/react'

// Wrap your app
function App() {
  return (
    <CacheProvider config={{ strategy: 'lru', maxSize: 100 }}>
      <UserList />
    </CacheProvider>
  )
}

// Data fetching with SWR pattern
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useCachedQuery(
    \`user:\${userId}\`,
    () => fetch(\`/api/users/\${userId}\`).then(r => r.json()),
    { ttl: 60000, staleTime: 30000 }
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}

// Simple cached value
function Counter() {
  const [count, setCount] = useCachedValue('counter', 0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

// Invalidation
function LogoutButton() {
  const { invalidateAll, invalidateByTag } = useCacheInvalidation()

  const handleLogout = () => {
    invalidateByTag('user-data')
  }

  return <button onClick={handleLogout}>Logout</button>
}`,
  },
  {
    id: 'plugins',
    title: 'Plugins',
    description: 'Extend cache with compression, encryption, and more.',
    code: `import { createCache } from '@oxog/cachekeeper'
import {
  compressionPlugin,
  encryptionPlugin,
  loggingPlugin,
  tieredPlugin
} from '@oxog/cachekeeper/plugins'

// Compression plugin
const cache1 = createCache({
  strategy: 'lru',
  maxSize: 100,
  plugins: [
    compressionPlugin({
      threshold: 1024, // Compress values > 1KB
    }),
  ],
})

// Encryption plugin
const cache2 = createCache({
  strategy: 'lru',
  maxSize: 100,
  plugins: [
    encryptionPlugin({
      secret: 'my-secret-key',
    }),
  ],
})

// Logging plugin
const cache3 = createCache({
  strategy: 'lru',
  maxSize: 100,
  plugins: [
    loggingPlugin({
      level: 'debug',
      logger: console,
    }),
  ],
})

// Tiered cache (L1 memory + L2 localStorage)
const cache4 = createCache({
  strategy: 'lru',
  maxSize: 100,
  plugins: [
    tieredPlugin({
      tiers: [
        { storage: 'memory', maxSize: 50 },
        { storage: 'local', maxSize: 500 },
      ],
    }),
  ],
})`,
  },
  {
    id: 'serialization',
    title: 'Dump & Restore',
    description: 'Export and import cache state.',
    code: `import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ strategy: 'lru', maxSize: 100 })

// Populate cache
cache.set('user:1', { name: 'John' })
cache.set('user:2', { name: 'Jane' })

// Export cache state
const dump = cache.dump()
console.log(JSON.stringify(dump, null, 2))
// {
//   "version": 1,
//   "strategy": "lru",
//   "entries": [...]
// }

// Save to file or send to server
localStorage.setItem('cache-backup', JSON.stringify(dump))

// Later: restore cache
const savedDump = localStorage.getItem('cache-backup')
if (savedDump) {
  cache.restore(JSON.parse(savedDump))
}

// Verify restoration
console.log(cache.get('user:1')) // { name: 'John' }`,
  },
]

export function Examples() {
  const [activeExample, setActiveExample] = useState(examples[0].id)

  const currentExample = examples.find((e) => e.id === activeExample)!

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">Examples</h1>
        <p className="text-lg text-slate-300 mb-8">
          Learn CacheKeeper through practical examples. Click on an example to see the code.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Example List */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {examples.map((example) => (
                <button
                  key={example.id}
                  onClick={() => setActiveExample(example.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeExample === example.id
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/50'
                      : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="font-medium">{example.title}</div>
                  <div className="text-sm text-slate-400 mt-1">{example.description}</div>
                </button>
              ))}
            </nav>
          </div>

          {/* Code Display */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeExample}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">{currentExample.title}</h2>
              <p className="text-slate-300 mb-4">{currentExample.description}</p>
              <CodeBlock
                code={currentExample.code}
                language="typescript"
                filename={`${currentExample.id}.ts`}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
