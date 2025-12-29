import { CodeBlock } from '../../components/CodeBlock'

export function Statistics() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Statistics</h1>
      <p className="text-lg text-slate-300 mb-8">
        Track cache performance with built-in statistics and metrics.
      </p>

      {/* Getting Stats */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Getting Statistics</h2>
        <p className="text-slate-300 mb-4">
          Use the <code className="text-sky-400">stats()</code> method to get current cache statistics:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache({ maxSize: 100 })

// Perform some operations
cache.set('a', 1)
cache.set('b', 2)
cache.get('a') // hit
cache.get('c') // miss

// Get statistics
const stats = cache.stats()
console.log(stats)
// {
//   hits: 1,
//   misses: 1,
//   hitRate: 0.5,
//   size: 2,
//   maxSize: 100,
//   memoryUsage: 48,
//   evictions: 0,
//   expirations: 0,
//   uptime: 1234,
// }`}
          language="typescript"
        />
      </section>

      {/* Stats Properties */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Available Statistics</h2>
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
                <td className="py-3 px-4 text-sky-400 font-mono">hits</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Number of cache hits</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">misses</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Number of cache misses</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">hitRate</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Hit rate (0-1)</td>
              </tr>
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
                <td className="py-3 px-4 text-sky-400 font-mono">memoryUsage</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Estimated memory usage in bytes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">evictions</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Number of evictions by strategy</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">expirations</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Number of TTL expirations</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sky-400 font-mono">uptime</td>
                <td className="py-3 px-4 text-slate-400">number</td>
                <td className="py-3 px-4 text-slate-300">Cache uptime in milliseconds</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Hit Rate */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Understanding Hit Rate</h2>
        <p className="text-slate-300 mb-4">
          The hit rate is the ratio of cache hits to total lookups:
        </p>
        <CodeBlock
          code={`const stats = cache.stats()

// hitRate = hits / (hits + misses)
console.log(\`Hit rate: \${(stats.hitRate * 100).toFixed(1)}%\`)

// Interpret the hit rate
if (stats.hitRate > 0.9) {
  console.log('Excellent cache efficiency')
} else if (stats.hitRate > 0.7) {
  console.log('Good cache efficiency')
} else if (stats.hitRate > 0.5) {
  console.log('Moderate cache efficiency')
} else {
  console.log('Consider adjusting cache size or TTL')
}`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Improving Hit Rate</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
            <li>Increase <code>maxSize</code> if evictions are high</li>
            <li>Increase <code>ttl</code> if data changes slowly</li>
            <li>Use appropriate eviction strategy for your access pattern</li>
            <li>Pre-warm cache with frequently accessed data</li>
          </ul>
        </div>
      </section>

      {/* Memory Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Memory Usage</h2>
        <p className="text-slate-300 mb-4">
          Track memory consumption with the <code className="text-sky-400">memoryUsage</code> stat:
        </p>
        <CodeBlock
          code={`import { formatBytes } from '@oxog/cachekeeper'

const stats = cache.stats()

// Format for display
console.log(\`Memory: \${formatBytes(stats.memoryUsage)}\`)
// "Memory: 1.5 MB"

// Check against limits
const maxMemory = 10 * 1024 * 1024 // 10 MB
const usage = stats.memoryUsage / maxMemory

if (usage > 0.9) {
  console.warn('Cache memory usage is high')
}`}
          language="typescript"
        />
      </section>

      {/* Resetting Stats */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Resetting Statistics</h2>
        <p className="text-slate-300 mb-4">
          Reset statistics to start fresh:
        </p>
        <CodeBlock
          code={`// Reset all stats
cache.resetStats()

// Stats are cleared
const stats = cache.stats()
console.log(stats.hits)    // 0
console.log(stats.misses)  // 0

// Useful for:
// - After cache warm-up period
// - At the start of a new session
// - For A/B testing different strategies`}
          language="typescript"
        />
      </section>

      {/* React Hook */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">React Integration</h2>
        <p className="text-slate-300 mb-4">
          Use the <code className="text-sky-400">useCacheStats</code> hook for real-time statistics:
        </p>
        <CodeBlock
          code={`import { useCacheStats } from '@oxog/cachekeeper/react'

function CacheMonitor() {
  const stats = useCacheStats({
    interval: 1000, // Update every second
  })

  return (
    <div className="cache-stats">
      <div>
        <span>Hit Rate</span>
        <span>{(stats.hitRate * 100).toFixed(1)}%</span>
      </div>
      <div>
        <span>Entries</span>
        <span>{stats.size} / {stats.maxSize}</span>
      </div>
      <div>
        <span>Memory</span>
        <span>{formatBytes(stats.memoryUsage)}</span>
      </div>
      <div>
        <span>Evictions</span>
        <span>{stats.evictions}</span>
      </div>
    </div>
  )
}`}
          language="tsx"
        />
      </section>

      {/* Monitoring Dashboard */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Building a Monitoring Dashboard</h2>
        <p className="text-slate-300 mb-4">
          Combine statistics with events for comprehensive monitoring:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache()

// Track stats over time
const history: CacheStats[] = []

setInterval(() => {
  const stats = cache.stats()
  history.push({ ...stats, timestamp: Date.now() })

  // Keep last hour of data
  const oneHourAgo = Date.now() - 3600000
  while (history.length > 0 && history[0].timestamp < oneHourAgo) {
    history.shift()
  }
}, 60000)

// Calculate trends
function getHitRateTrend() {
  if (history.length < 2) return 0
  const recent = history.slice(-5).map(h => h.hitRate)
  const older = history.slice(0, 5).map(h => h.hitRate)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  return recentAvg - olderAvg
}

// Alert on low hit rate
cache.on('miss', () => {
  const stats = cache.stats()
  if (stats.hitRate < 0.5 && stats.hits + stats.misses > 100) {
    console.warn('Cache hit rate below 50%')
  }
})`}
          language="typescript"
        />
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Best Practices</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Monitor After Warm-up</h4>
            <p className="text-slate-300 text-sm">
              Reset statistics after your cache warm-up period to get accurate metrics
              for steady-state operation.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Track Eviction Rate</h4>
            <p className="text-slate-300 text-sm">
              High eviction rates may indicate your cache is too small. Consider
              increasing maxSize if evictions are frequent.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Use formatBytes</h4>
            <p className="text-slate-300 text-sm">
              CacheKeeper exports <code>formatBytes</code> utility for human-readable
              memory sizes.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Compare Strategies</h4>
            <p className="text-slate-300 text-sm">
              Use statistics to compare different eviction strategies for your
              specific workload.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
