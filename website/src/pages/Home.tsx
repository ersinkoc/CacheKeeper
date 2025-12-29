import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Shield,
  Layers,
  Database,
  Component,
  Puzzle,
  Clock,
  BarChart3,
  ArrowRight,
  Check,
  Copy
} from 'lucide-react'
import { useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'

const features = [
  {
    icon: Zap,
    title: 'Zero Dependencies',
    description: 'Lightweight and fast with no external runtime dependencies.',
  },
  {
    icon: Shield,
    title: 'Type-Safe',
    description: 'Full TypeScript support with strict mode and generics.',
  },
  {
    icon: Layers,
    title: 'Multiple Strategies',
    description: 'LRU, LFU, FIFO, TTL, and SWR eviction strategies built-in.',
  },
  {
    icon: Database,
    title: 'Storage Adapters',
    description: 'Memory, localStorage, sessionStorage, and IndexedDB support.',
  },
  {
    icon: Component,
    title: 'React Ready',
    description: 'First-class React adapter with hooks and provider.',
  },
  {
    icon: Puzzle,
    title: 'Plugin System',
    description: 'Extend functionality with compression, encryption, and more.',
  },
  {
    icon: Clock,
    title: 'TTL Support',
    description: 'Per-entry TTL with automatic expiration and stale detection.',
  },
  {
    icon: BarChart3,
    title: 'Statistics',
    description: 'Built-in hit/miss tracking and performance metrics.',
  },
]

const quickStartCode = `import { createCache } from '@oxog/cachekeeper'

// Create a cache with LRU strategy
const cache = createCache({
  strategy: 'lru',
  maxSize: 100,
  ttl: 60000, // 1 minute default TTL
})

// Basic operations
cache.set('user:1', { name: 'John', age: 30 })
const user = cache.get('user:1')

// With TTL
cache.set('session', token, { ttl: 3600000 }) // 1 hour

// Memoization
const getData = cache.memoize(
  async (id) => fetchFromAPI(id),
  (id) => \`data:\${id}\`
)`

const reactCode = `import { CacheProvider, useCachedQuery } from '@oxog/cachekeeper/react'

function App() {
  return (
    <CacheProvider config={{ strategy: 'lru', maxSize: 100 }}>
      <UserProfile userId="123" />
    </CacheProvider>
  )
}

function UserProfile({ userId }) {
  const { data, isLoading, error, refetch } = useCachedQuery(
    \`user:\${userId}\`,
    () => fetchUser(userId),
    { ttl: 60000, staleTime: 30000 }
  )

  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />

  return <div>{data.name}</div>
}`

export function Home() {
  const [installCopied, setInstallCopied] = useState(false)

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText('npm install @oxog/cachekeeper')
    setInstallCopied(true)
    setTimeout(() => setInstallCopied(false), 2000)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-purple-500/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Caching Made{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400">
                Simple
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              A zero-dependency, type-safe caching toolkit for TypeScript and JavaScript.
              Multiple strategies, storage adapters, and a powerful React integration.
            </p>

            {/* Install command */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <code className="px-4 py-3 text-slate-300">
                  npm install @oxog/cachekeeper
                </code>
                <button
                  onClick={handleCopyInstall}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
                >
                  {installCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/playground"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Try Playground
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              CacheKeeper provides a complete caching solution with all the features you need
              for modern web applications.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-slate-900 rounded-xl border border-slate-700 hover:border-sky-500/50 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-sky-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Quick Start</h2>
              <p className="text-slate-300 mb-6">
                Get up and running in seconds with a simple, intuitive API.
                Create a cache, set values, and let CacheKeeper handle the rest.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Simple factory function',
                  'Multiple eviction strategies',
                  'Automatic expiration',
                  'Built-in memoization',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/docs/getting-started"
                className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium"
              >
                Learn more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <CodeBlock code={quickStartCode} language="typescript" filename="cache.ts" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* React Section */}
      <section className="py-24 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1"
            >
              <CodeBlock code={reactCode} language="tsx" filename="App.tsx" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl font-bold text-white mb-4">React Ready</h2>
              <p className="text-slate-300 mb-6">
                First-class React integration with hooks that feel native.
                Use the CacheProvider and enjoy automatic cache management.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'CacheProvider for context',
                  'useCachedQuery for data fetching',
                  'useCachedValue for simple values',
                  'Automatic revalidation',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/docs/react"
                className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium"
              >
                Explore React Adapter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              Install CacheKeeper and start caching in minutes.
              Check out our documentation for guides and examples.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg transition-colors"
              >
                Read the Docs
              </Link>
              <a
                href="https://github.com/oxog/cachekeeper"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
