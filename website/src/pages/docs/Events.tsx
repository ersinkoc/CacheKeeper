import { CodeBlock } from '../../components/CodeBlock'

export function Events() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Events</h1>
      <p className="text-lg text-slate-300 mb-8">
        Subscribe to cache lifecycle events for logging, debugging, and reactive updates.
      </p>

      {/* Available Events */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Available Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Event</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Triggered When</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">hit</td>
                <td className="py-3 px-4 text-slate-300">Cache lookup finds a value</td>
                <td className="py-3 px-4 text-slate-400">key, value</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">miss</td>
                <td className="py-3 px-4 text-slate-300">Cache lookup doesn't find a value</td>
                <td className="py-3 px-4 text-slate-400">key</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">set</td>
                <td className="py-3 px-4 text-slate-300">Value is stored in cache</td>
                <td className="py-3 px-4 text-slate-400">key, value, ttl, tags</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">delete</td>
                <td className="py-3 px-4 text-slate-300">Entry is removed from cache</td>
                <td className="py-3 px-4 text-slate-400">key, reason</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">expire</td>
                <td className="py-3 px-4 text-slate-300">Entry TTL expires</td>
                <td className="py-3 px-4 text-slate-400">key, value</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">evict</td>
                <td className="py-3 px-4 text-slate-300">Entry is evicted by strategy</td>
                <td className="py-3 px-4 text-slate-400">key, value, strategy</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">clear</td>
                <td className="py-3 px-4 text-slate-300">Cache is cleared</td>
                <td className="py-3 px-4 text-slate-400">count</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">prune</td>
                <td className="py-3 px-4 text-slate-300">Expired entries are pruned</td>
                <td className="py-3 px-4 text-slate-400">count, keys</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Subscribing to Events */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Subscribing to Events</h2>
        <p className="text-slate-300 mb-4">
          Use the <code className="text-sky-400">on()</code> method to subscribe to events:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache()

// Subscribe to hit events
cache.on('hit', (event) => {
  console.log(\`Cache hit: \${event.key}\`)
  console.log(\`Value: \`, event.value)
})

// Subscribe to miss events
cache.on('miss', (event) => {
  console.log(\`Cache miss: \${event.key}\`)
})

// Subscribe to set events
cache.on('set', (event) => {
  console.log(\`Set: \${event.key}\`)
  console.log(\`TTL: \${event.ttl}ms\`)
  console.log(\`Tags: \`, event.tags)
})

// Subscribe to delete events
cache.on('delete', (event) => {
  console.log(\`Deleted: \${event.key}\`)
  console.log(\`Reason: \${event.reason}\`) // 'manual' | 'expire' | 'evict' | 'tag'
})`}
          language="typescript"
        />
      </section>

      {/* Unsubscribing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Unsubscribing</h2>
        <p className="text-slate-300 mb-4">
          The <code className="text-sky-400">on()</code> method returns an unsubscribe function:
        </p>
        <CodeBlock
          code={`// Subscribe returns unsubscribe function
const unsubscribe = cache.on('hit', (event) => {
  console.log(\`Hit: \${event.key}\`)
})

// Later, stop listening
unsubscribe()

// Or use off() method
function handleHit(event) {
  console.log(\`Hit: \${event.key}\`)
}

cache.on('hit', handleHit)
cache.off('hit', handleHit)`}
          language="typescript"
        />
      </section>

      {/* One-time Events */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">One-time Events</h2>
        <p className="text-slate-300 mb-4">
          Use <code className="text-sky-400">once()</code> to subscribe to a single event:
        </p>
        <CodeBlock
          code={`// Only fires once, then automatically unsubscribes
cache.once('set', (event) => {
  console.log(\`First set: \${event.key}\`)
})

cache.set('a', 1) // Logs: "First set: a"
cache.set('b', 2) // Nothing logged`}
          language="typescript"
        />
      </section>

      {/* Event Payloads */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Event Payloads</h2>
        <p className="text-slate-300 mb-4">
          Each event type has a specific payload structure:
        </p>
        <CodeBlock
          code={`// Hit event
interface HitEvent {
  key: string
  value: unknown
}

// Miss event
interface MissEvent {
  key: string
}

// Set event
interface SetEvent {
  key: string
  value: unknown
  ttl?: number
  tags?: string[]
}

// Delete event
interface DeleteEvent {
  key: string
  reason: 'manual' | 'expire' | 'evict' | 'tag'
}

// Expire event
interface ExpireEvent {
  key: string
  value: unknown
}

// Evict event
interface EvictEvent {
  key: string
  value: unknown
  strategy: string
}

// Clear event
interface ClearEvent {
  count: number
}

// Prune event
interface PruneEvent {
  count: number
  keys: string[]
}`}
          language="typescript"
        />
      </section>

      {/* Use Cases */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Use Cases</h2>

        <h3 className="text-xl font-semibold text-white mb-3">Debug Logging</h3>
        <CodeBlock
          code={`// Log all cache activity in development
if (process.env.NODE_ENV === 'development') {
  cache.on('hit', (e) => console.log(\`[CACHE HIT] \${e.key}\`))
  cache.on('miss', (e) => console.log(\`[CACHE MISS] \${e.key}\`))
  cache.on('set', (e) => console.log(\`[CACHE SET] \${e.key}\`))
  cache.on('delete', (e) => console.log(\`[CACHE DEL] \${e.key} (\${e.reason})\`))
  cache.on('evict', (e) => console.log(\`[CACHE EVICT] \${e.key} by \${e.strategy}\`))
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Metrics Collection</h3>
        <CodeBlock
          code={`// Track cache metrics
const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
}

cache.on('hit', () => metrics.hits++)
cache.on('miss', () => metrics.misses++)
cache.on('set', () => metrics.sets++)
cache.on('evict', () => metrics.evictions++)

// Report metrics periodically
setInterval(() => {
  const hitRate = metrics.hits / (metrics.hits + metrics.misses)
  console.log(\`Hit rate: \${(hitRate * 100).toFixed(1)}%\`)
  console.log(\`Evictions: \${metrics.evictions}\`)
}, 60000)`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Reactive Updates</h3>
        <CodeBlock
          code={`// React to cache changes
cache.on('set', (event) => {
  if (event.key.startsWith('user:')) {
    notifyUserDataChanged(event.key, event.value)
  }
})

cache.on('delete', (event) => {
  if (event.reason === 'expire') {
    // Session expired, redirect to login
    if (event.key === 'session') {
      window.location.href = '/login'
    }
  }
})`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Write-through Pattern</h3>
        <CodeBlock
          code={`// Sync cache changes to server
cache.on('set', async (event) => {
  if (event.key.startsWith('user-settings:')) {
    await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify(event.value),
    })
  }
})

cache.on('delete', async (event) => {
  if (event.key.startsWith('user-settings:')) {
    await fetch(\`/api/settings/\${event.key}\`, {
      method: 'DELETE',
    })
  }
})`}
          language="typescript"
        />
      </section>
    </div>
  )
}
