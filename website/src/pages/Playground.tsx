import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Trash2 } from 'lucide-react'

const defaultCode = `// CacheKeeper Playground
// Try out CacheKeeper right in your browser!

const cache = createCache({
  strategy: 'lru',
  maxSize: 10,
  ttl: 60000,
})

// Basic operations
cache.set('greeting', 'Hello, World!')
console.log('Get greeting:', cache.get('greeting'))

// Set with TTL
cache.set('temp', 'This expires soon', { ttl: 5000 })
console.log('Temp value:', cache.get('temp'))
console.log('TTL remaining:', cache.ttl('temp'), 'ms')

// Objects work too
cache.set('user', { name: 'John', age: 30 })
console.log('User:', cache.get('user'))

// Check cache size
console.log('Cache size:', cache.size)

// List all keys
console.log('All keys:', cache.keys())

// Stats
const stats = cache.stats()
console.log('Stats:', stats)
`

// Simple mock implementation for the playground
const createMockCache = () => {
  const store = new Map<string, { value: unknown; ttl?: number; createdAt: number }>()
  let hits = 0
  let misses = 0

  return {
    set: (key: string, value: unknown, options?: { ttl?: number }) => {
      store.set(key, {
        value,
        ttl: options?.ttl,
        createdAt: Date.now(),
      })
    },
    get: (key: string) => {
      const entry = store.get(key)
      if (!entry) {
        misses++
        return undefined
      }
      if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
        store.delete(key)
        misses++
        return undefined
      }
      hits++
      return entry.value
    },
    has: (key: string) => {
      const entry = store.get(key)
      if (!entry) return false
      if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
        store.delete(key)
        return false
      }
      return true
    },
    delete: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get size() {
      return store.size
    },
    keys: () => Array.from(store.keys()),
    values: () => Array.from(store.values()).map((e) => e.value),
    ttl: (key: string) => {
      const entry = store.get(key)
      if (!entry || !entry.ttl) return null
      const remaining = entry.ttl - (Date.now() - entry.createdAt)
      return remaining > 0 ? remaining : 0
    },
    stats: () => ({
      hits,
      misses,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
      size: store.size,
    }),
  }
}

// Evaluate code in a sandboxed context
// This is an intentional use of Function constructor for the playground feature
function evaluatePlaygroundCode(
  code: string,
  mockCache: ReturnType<typeof createMockCache>,
  logger: { log: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void }
) {
  // Create sandboxed evaluation context
  const sandboxedEval = (codeStr: string, createCache: () => ReturnType<typeof createMockCache>, console: typeof logger) => {
    // Intentionally using Function for playground code execution
    const execute = Function('createCache', 'console', codeStr)
    return execute(createCache, console)
  }

  sandboxedEval(code, () => mockCache, logger)
}

export function Playground() {
  const [code, setCode] = useState(defaultCode)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runCode = useCallback(() => {
    setIsRunning(true)
    setOutput([])

    const logs: string[] = []
    const mockConsole = {
      log: (...args: unknown[]) => {
        logs.push(
          args
            .map((arg) =>
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            )
            .join(' ')
        )
      },
      error: (...args: unknown[]) => {
        logs.push(
          '[ERROR] ' +
            args
              .map((arg) =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              )
              .join(' ')
        )
      },
      warn: (...args: unknown[]) => {
        logs.push(
          '[WARN] ' +
            args
              .map((arg) =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              )
              .join(' ')
        )
      },
    }

    try {
      const mockCache = createMockCache()
      evaluatePlaygroundCode(code, mockCache, mockConsole)
      setOutput(logs)
    } catch (error) {
      setOutput([`Error: ${error instanceof Error ? error.message : String(error)}`])
    }

    setIsRunning(false)
  }, [code])

  const resetCode = () => {
    setCode(defaultCode)
    setOutput([])
  }

  const clearOutput = () => {
    setOutput([])
  }

  // Run on mount
  useEffect(() => {
    runCode()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Playground</h1>
            <p className="text-lg text-slate-300">
              Try CacheKeeper directly in your browser. Edit the code and click Run to see results.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
              <span className="text-sm text-slate-400">playground.ts</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetCode}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Reset code"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[500px] p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
              <span className="text-sm text-slate-400">Output</span>
              <button
                onClick={clearOutput}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Clear output"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[500px] p-4 overflow-auto font-mono text-sm">
              {output.length === 0 ? (
                <span className="text-slate-500">Click "Run" to see output...</span>
              ) : (
                output.map((line, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-wrap mb-1 ${
                      line.startsWith('[ERROR]')
                        ? 'text-red-400'
                        : line.startsWith('[WARN]')
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Available APIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="text-sky-400 font-medium mb-2">Core Methods</h4>
              <ul className="space-y-1 text-slate-300">
                <li><code>cache.set(key, value, options?)</code></li>
                <li><code>cache.get(key)</code></li>
                <li><code>cache.has(key)</code></li>
                <li><code>cache.delete(key)</code></li>
                <li><code>cache.clear()</code></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sky-400 font-medium mb-2">Properties</h4>
              <ul className="space-y-1 text-slate-300">
                <li><code>cache.size</code></li>
                <li><code>cache.keys()</code></li>
                <li><code>cache.values()</code></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sky-400 font-medium mb-2">TTL Methods</h4>
              <ul className="space-y-1 text-slate-300">
                <li><code>cache.ttl(key)</code></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sky-400 font-medium mb-2">Statistics</h4>
              <ul className="space-y-1 text-slate-300">
                <li><code>cache.stats()</code></li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-slate-400 text-sm">
            Note: This is a simplified playground. For the full API, install the package and use it in your project.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
