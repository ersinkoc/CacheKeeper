import { CodeBlock } from '../../components/CodeBlock'

export function Namespaces() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Namespaces</h1>
      <p className="text-lg text-slate-300 mb-8">
        Organize your cache with namespaces for better isolation and management.
      </p>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Creating Namespaces</h2>
        <p className="text-slate-300 mb-4">
          Namespaces provide isolated views into the cache. Keys are automatically prefixed.
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ maxSize: 1000 })

// Create namespaces
const users = cache.namespace('users')
const posts = cache.namespace('posts')
const settings = cache.namespace('settings')

// Each namespace has its own isolated key space
users.set('123', { name: 'John' })
posts.set('123', { title: 'Hello' })

// Keys don't conflict
console.log(users.get('123'))  // { name: 'John' }
console.log(posts.get('123'))  // { title: 'Hello' }

// Actual keys in cache
console.log(cache.keys())
// ['users:123', 'posts:123']`}
          language="typescript"
        />
      </section>

      {/* Namespace Operations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Namespace Operations</h2>
        <p className="text-slate-300 mb-4">
          Namespaces support all cache operations, scoped to their prefix:
        </p>
        <CodeBlock
          code={`const users = cache.namespace('users')

// All standard operations work
users.set('1', { name: 'John' })
users.set('2', { name: 'Jane' })
users.set('3', { name: 'Bob' })

// Get and has
const user = users.get('1')
const exists = users.has('2')

// Delete within namespace
users.delete('3')

// Get all keys in namespace
const keys = users.keys()
// ['1', '2'] (without prefix)

// Get size of namespace
console.log(users.size) // 2

// Clear only this namespace
users.clear()
// Only removes users:* keys`}
          language="typescript"
        />
      </section>

      {/* Nested Namespaces */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Nested Namespaces</h2>
        <p className="text-slate-300 mb-4">
          Create hierarchical namespaces for complex data organization:
        </p>
        <CodeBlock
          code={`const cache = createCache()

// Create nested structure
const api = cache.namespace('api')
const users = api.namespace('users')
const posts = api.namespace('posts')

// Or chain directly
const adminUsers = cache.namespace('admin').namespace('users')

// Set values
users.set('1', { name: 'John' })
adminUsers.set('1', { name: 'Admin' })

// Keys have full prefix
console.log(cache.keys())
// ['api:users:1', 'admin:users:1']

// Each level is isolated
console.log(users.get('1'))       // { name: 'John' }
console.log(adminUsers.get('1'))  // { name: 'Admin' }`}
          language="typescript"
        />
      </section>

      {/* Sharing Parent Cache */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Sharing Parent Cache</h2>
        <p className="text-slate-300 mb-4">
          Namespaces share the same underlying cache, including size limits and eviction:
        </p>
        <CodeBlock
          code={`const cache = createCache({
  strategy: 'lru',
  maxSize: 5,
})

const ns1 = cache.namespace('ns1')
const ns2 = cache.namespace('ns2')

// Fill up the cache
ns1.set('a', 1)
ns1.set('b', 2)
ns2.set('c', 3)
ns2.set('d', 4)
ns2.set('e', 5)

// Cache is full (5 entries)
console.log(cache.size) // 5

// Adding more triggers eviction
ns1.set('f', 6)
// LRU evicts oldest entry (ns1:a)

console.log(cache.keys())
// ['ns1:b', 'ns2:c', 'ns2:d', 'ns2:e', 'ns1:f']`}
          language="typescript"
        />
      </section>

      {/* Namespace with Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Namespace with Options</h2>
        <p className="text-slate-300 mb-4">
          Set default options for all entries in a namespace:
        </p>
        <CodeBlock
          code={`// All operations in this namespace use these defaults
const sessions = cache.namespace('sessions')

// Set with namespace-specific TTL
sessions.set('user:1', { token: 'abc' }, { ttl: 3600000 })

// Tags work too
const userData = cache.namespace('user-data')
userData.set('profile:1', data, { tags: ['user:1'] })

// Clear all user data by tag
cache.deleteByTag('user:1')`}
          language="typescript"
        />
      </section>

      {/* Use Cases */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Common Use Cases</h2>

        <h3 className="text-xl font-semibold text-white mb-3">Multi-tenant Application</h3>
        <CodeBlock
          code={`function getTenantCache(tenantId: string) {
  return cache.namespace(\`tenant:\${tenantId}\`)
}

// Each tenant has isolated cache
const tenant1Cache = getTenantCache('acme')
const tenant2Cache = getTenantCache('globex')

tenant1Cache.set('settings', { theme: 'dark' })
tenant2Cache.set('settings', { theme: 'light' })

// Completely isolated
console.log(tenant1Cache.get('settings')) // { theme: 'dark' }
console.log(tenant2Cache.get('settings')) // { theme: 'light' }`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">API Response Caching</h3>
        <CodeBlock
          code={`const apiCache = cache.namespace('api')

// Organize by endpoint
const usersApi = apiCache.namespace('users')
const postsApi = apiCache.namespace('posts')

// Cache API responses
async function fetchUser(id: string) {
  return usersApi.getOrSet(\`\${id}\`, async () => {
    const res = await fetch(\`/api/users/\${id}\`)
    return res.json()
  }, { ttl: 60000 })
}

// Clear all API caches
apiCache.clear()`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Feature Modules</h3>
        <CodeBlock
          code={`// Each feature module gets its own namespace
const authCache = cache.namespace('auth')
const cartCache = cache.namespace('cart')
const searchCache = cache.namespace('search')

// Modules can manage their own cache independently
export const authModule = {
  cache: authCache,

  async getSession(userId: string) {
    return authCache.getOrSet(\`session:\${userId}\`, fetchSession)
  },

  clearUserSessions(userId: string) {
    authCache.delete(\`session:\${userId}\`)
  }
}`}
          language="typescript"
        />
      </section>
    </div>
  )
}
