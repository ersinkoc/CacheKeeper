import { CodeBlock } from '../../components/CodeBlock'

export function Plugins() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Plugins</h1>
      <p className="text-lg text-slate-300 mb-8">
        Extend CacheKeeper functionality with built-in and custom plugins.
      </p>

      {/* Using Plugins */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Using Plugins</h2>
        <p className="text-slate-300 mb-4">
          Add plugins when creating a cache:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'
import { compressionPlugin, loggingPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  maxSize: 100,
  plugins: [
    loggingPlugin({ level: 'debug' }),
    compressionPlugin({ threshold: 1024 }),
  ],
})`}
          language="typescript"
        />
      </section>

      {/* Compression Plugin */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Compression Plugin</h2>
        <p className="text-slate-300 mb-4">
          Automatically compress large values to reduce memory usage:
        </p>
        <CodeBlock
          code={`import { compressionPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    compressionPlugin({
      // Only compress values larger than 1KB
      threshold: 1024,
    }),
  ],
})

// Large values are automatically compressed
cache.set('large-data', hugeJSONObject)

// Decompression is transparent
const data = cache.get('large-data') // Returns original object`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Options</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
            <li><code>threshold</code> - Minimum size in bytes to trigger compression (default: 1024)</li>
          </ul>
        </div>
      </section>

      {/* Encryption Plugin */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Encryption Plugin</h2>
        <p className="text-slate-300 mb-4">
          Encrypt cached values for sensitive data:
        </p>
        <CodeBlock
          code={`import { encryptionPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  storage: 'local', // Persist encrypted data
  plugins: [
    encryptionPlugin({
      secret: process.env.CACHE_SECRET!,
    }),
  ],
})

// Values are encrypted before storage
cache.set('api-key', 'sk-secret-key-12345')

// Decryption is transparent
const key = cache.get('api-key') // 'sk-secret-key-12345'`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
          <h4 className="text-yellow-400 font-semibold mb-2">Security Note</h4>
          <p className="text-slate-300 text-sm">
            The built-in encryption is suitable for obfuscation but not for
            high-security requirements. For sensitive data, consider using
            a proper encryption library like Web Crypto API.
          </p>
        </div>
      </section>

      {/* Logging Plugin */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Logging Plugin</h2>
        <p className="text-slate-300 mb-4">
          Log cache operations for debugging:
        </p>
        <CodeBlock
          code={`import { loggingPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    loggingPlugin({
      level: 'debug', // 'debug' | 'info' | 'warn' | 'error'
      logger: console, // Custom logger (optional)
    }),
  ],
})

cache.set('key', 'value')
// [CacheKeeper] SET key

cache.get('key')
// [CacheKeeper] HIT key

cache.get('missing')
// [CacheKeeper] MISS missing`}
          language="typescript"
        />
        <CodeBlock
          code={`// Custom logger example
import pino from 'pino'

const logger = pino({ level: 'debug' })

const cache = createCache({
  plugins: [
    loggingPlugin({
      level: 'info',
      logger: {
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
      },
    }),
  ],
})`}
          language="typescript"
        />
      </section>

      {/* Tiered Plugin */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Tiered Cache Plugin</h2>
        <p className="text-slate-300 mb-4">
          Create multi-level caching with L1/L2 tiers:
        </p>
        <CodeBlock
          code={`import { tieredPlugin } from '@oxog/cachekeeper/plugins'

const cache = createCache({
  plugins: [
    tieredPlugin({
      tiers: [
        {
          storage: 'memory',
          maxSize: 100,
          // L1: Fast, small, in-memory
        },
        {
          storage: 'local',
          maxSize: 1000,
          // L2: Slower, larger, persistent
        },
      ],
    }),
  ],
})

// Write goes to all tiers
cache.set('key', 'value')

// Read checks L1 first, then L2
const value = cache.get('key')

// L1 miss promotes from L2 to L1`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">How It Works</h4>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
            <li>Writes go to all tiers</li>
            <li>Reads check tiers in order (L1 → L2 → ...)</li>
            <li>Cache hits in lower tiers promote data to higher tiers</li>
            <li>Each tier can have different size limits and storage</li>
          </ul>
        </div>
      </section>

      {/* Creating Custom Plugins */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Creating Custom Plugins</h2>
        <p className="text-slate-300 mb-4">
          Create your own plugins by implementing the plugin interface:
        </p>
        <CodeBlock
          code={`import { createCache, type CachePlugin } from '@oxog/cachekeeper'

// Plugin interface
interface CachePlugin {
  name: string

  // Lifecycle hooks (all optional)
  onInit?(cache: CacheInstance): void
  onDestroy?(): void

  // Operation hooks
  beforeGet?(key: string): void
  afterGet?(key: string, value: unknown): unknown

  beforeSet?(key: string, value: unknown): unknown
  afterSet?(key: string, value: unknown): void

  beforeDelete?(key: string): void
  afterDelete?(key: string): void
}`}
          language="typescript"
        />
        <CodeBlock
          code={`// Example: Validation plugin
const validationPlugin: CachePlugin = {
  name: 'validation',

  beforeSet(key: string, value: unknown) {
    // Validate key format
    if (!key.match(/^[a-z0-9:-]+$/i)) {
      throw new Error(\`Invalid cache key: \${key}\`)
    }

    // Validate value is serializable
    try {
      JSON.stringify(value)
    } catch {
      throw new Error('Value must be JSON serializable')
    }

    return value
  },
}

const cache = createCache({
  plugins: [validationPlugin],
})`}
          language="typescript"
        />
      </section>

      {/* Transform Plugin Example */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Transform Plugin Example</h2>
        <p className="text-slate-300 mb-4">
          Transform values on read/write:
        </p>
        <CodeBlock
          code={`// Auto-parse JSON strings
const jsonParsePlugin: CachePlugin = {
  name: 'json-parse',

  afterGet(key: string, value: unknown) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  },

  beforeSet(key: string, value: unknown) {
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return value
  },
}

// Date serialization plugin
const datePlugin: CachePlugin = {
  name: 'date-serializer',

  beforeSet(key: string, value: unknown) {
    return JSON.stringify(value, (k, v) => {
      if (v instanceof Date) {
        return { __date: v.toISOString() }
      }
      return v
    })
  },

  afterGet(key: string, value: unknown) {
    if (typeof value !== 'string') return value
    return JSON.parse(value, (k, v) => {
      if (v && v.__date) {
        return new Date(v.__date)
      }
      return v
    })
  },
}`}
          language="typescript"
        />
      </section>

      {/* Plugin Order */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Plugin Execution Order</h2>
        <p className="text-slate-300 mb-4">
          Plugins execute in the order they are provided:
        </p>
        <CodeBlock
          code={`const cache = createCache({
  plugins: [
    loggingPlugin(),      // 1. Logs the operation
    validationPlugin,     // 2. Validates the data
    compressionPlugin(),  // 3. Compresses if needed
    encryptionPlugin(),   // 4. Encrypts the result
  ],
})

// For SET: logging → validation → compression → encryption → storage
// For GET: storage → decryption → decompression → logging`}
          language="typescript"
        />
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sky-400 font-semibold mb-2">Order Matters</h4>
          <p className="text-slate-300 text-sm">
            Put logging first to see all operations. Put encryption last for
            security. Compression should come before encryption.
          </p>
        </div>
      </section>
    </div>
  )
}
