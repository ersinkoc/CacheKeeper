import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CodeBlock } from '../../components/CodeBlock'

export function GettingStarted() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Getting Started</h1>
      <p className="text-lg text-slate-300 mb-8">
        Learn how to install and use CacheKeeper in your project.
      </p>

      {/* Installation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
        <p className="text-slate-300 mb-4">
          Install CacheKeeper using your preferred package manager:
        </p>
        <CodeBlock code="npm install @oxog/cachekeeper" language="bash" />
        <p className="text-slate-400 text-sm mt-2">
          Or with yarn: <code className="text-sky-400">yarn add @oxog/cachekeeper</code>
        </p>
        <p className="text-slate-400 text-sm">
          Or with pnpm: <code className="text-sky-400">pnpm add @oxog/cachekeeper</code>
        </p>
      </section>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Basic Usage</h2>
        <p className="text-slate-300 mb-4">
          Create a cache instance using the <code className="text-sky-400">createCache</code> factory function:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

// Create a cache with default settings
const cache = createCache()

// Or with configuration
const cache = createCache({
  strategy: 'lru',      // Eviction strategy
  maxSize: 100,         // Maximum number of entries
  ttl: 60000,           // Default TTL in milliseconds (1 minute)
})`}
          language="typescript"
          filename="cache.ts"
        />
      </section>

      {/* Core Operations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Core Operations</h2>

        <h3 className="text-xl font-semibold text-white mb-3">Setting Values</h3>
        <CodeBlock
          code={`// Simple set
cache.set('key', 'value')

// With options
cache.set('session', { userId: 123 }, {
  ttl: 3600000,                    // 1 hour TTL
  tags: ['user', 'session'],       // Tags for grouping
})

// Objects, arrays, and primitives all work
cache.set('user', { name: 'John', age: 30 })
cache.set('numbers', [1, 2, 3, 4, 5])
cache.set('count', 42)`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Getting Values</h3>
        <CodeBlock
          code={`// Get a value (returns undefined if not found or expired)
const value = cache.get('key')

// Type-safe get
const user = cache.get<User>('user')

// Check if key exists
if (cache.has('key')) {
  console.log('Key exists!')
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Deleting Values</h3>
        <CodeBlock
          code={`// Delete a single key
cache.delete('key')

// Clear all entries
cache.clear()

// Delete by tag
cache.deleteByTag('user')`}
          language="typescript"
        />
      </section>

      {/* TTL */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">TTL (Time To Live)</h2>
        <p className="text-slate-300 mb-4">
          Control how long entries stay in the cache:
        </p>
        <CodeBlock
          code={`// Set default TTL in config
const cache = createCache({
  ttl: 60000, // 1 minute default
})

// Override TTL per entry
cache.set('temp', 'data', { ttl: 5000 }) // 5 seconds

// Check remaining TTL
const remaining = cache.ttl('temp')
console.log(\`\${remaining}ms remaining\`)

// Refresh TTL
cache.touch('temp') // Resets TTL to original value

// Force expire an entry
cache.expire('temp')`}
          language="typescript"
        />
      </section>

      {/* Memoization */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Memoization</h2>
        <p className="text-slate-300 mb-4">
          Cache expensive computations or API calls:
        </p>
        <CodeBlock
          code={`// getOrSet - compute only if not cached
const user = await cache.getOrSet(
  'user:123',
  async () => {
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

// First call - executes function
const user1 = await fetchUser('123')

// Second call - returns cached result
const user2 = await fetchUser('123')`}
          language="typescript"
        />
      </section>

      {/* TypeScript */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">TypeScript Support</h2>
        <p className="text-slate-300 mb-4">
          CacheKeeper is written in TypeScript and provides full type safety:
        </p>
        <CodeBlock
          code={`interface User {
  id: string
  name: string
  email: string
}

// Type-safe cache
const cache = createCache()

// Type inference works
cache.set('user', { id: '1', name: 'John', email: 'john@example.com' })

// Explicit type annotation
const user = cache.get<User>('user')
if (user) {
  console.log(user.name) // TypeScript knows this is a User
}

// Type-safe memoization
const fetchUser = cache.memoize<User, [string]>(
  async (id) => fetch(\`/api/users/\${id}\`).then(r => r.json()),
  (id) => \`user:\${id}\`
)`}
          language="typescript"
        />
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/docs/configuration"
            className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-sky-500/50 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              Configuration
              <ArrowRight className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm">
              Learn about all available configuration options.
            </p>
          </Link>
          <Link
            to="/docs/strategies"
            className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-sky-500/50 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              Strategies
              <ArrowRight className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm">
              Explore different eviction strategies.
            </p>
          </Link>
          <Link
            to="/docs/react"
            className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-sky-500/50 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              React Adapter
              <ArrowRight className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm">
              Use CacheKeeper with React hooks.
            </p>
          </Link>
          <Link
            to="/examples"
            className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-sky-500/50 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              Examples
              <ArrowRight className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm">
              See practical examples and use cases.
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
