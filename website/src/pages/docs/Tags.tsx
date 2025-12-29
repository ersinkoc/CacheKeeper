import { CodeBlock } from '../../components/CodeBlock'

export function Tags() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-white mb-4">Tags</h1>
      <p className="text-lg text-slate-300 mb-8">
        Group cache entries with tags for efficient bulk operations and invalidation.
      </p>

      {/* Basic Usage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Setting Tags</h2>
        <p className="text-slate-300 mb-4">
          Add tags when setting cache entries to create logical groupings:
        </p>
        <CodeBlock
          code={`import { createCache } from '@oxog/cachekeeper'

const cache = createCache()

// Single tag
cache.set('user:1', { name: 'John' }, { tags: ['users'] })

// Multiple tags
cache.set('post:1', { title: 'Hello' }, {
  tags: ['posts', 'user:1', 'published']
})

// Tags for related data
cache.set('user:1:profile', profileData, { tags: ['user:1'] })
cache.set('user:1:settings', settingsData, { tags: ['user:1'] })
cache.set('user:1:notifications', notifData, { tags: ['user:1'] })`}
          language="typescript"
        />
      </section>

      {/* Getting by Tag */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Getting Entries by Tag</h2>
        <p className="text-slate-300 mb-4">
          Retrieve all entries that have a specific tag:
        </p>
        <CodeBlock
          code={`// Get all values with a tag
const allUsers = cache.getByTag('users')
// [{ name: 'John' }, { name: 'Jane' }, ...]

// Get keys with a tag
const userKeys = cache.getKeysByTag('users')
// ['user:1', 'user:2', ...]

// Check if a tag exists
if (cache.hasTag('users')) {
  console.log('Has user data cached')
}

// Get tags for a specific entry
const tags = cache.tags('post:1')
// ['posts', 'user:1', 'published']`}
          language="typescript"
        />
      </section>

      {/* Tag-based Invalidation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Tag-based Invalidation</h2>
        <p className="text-slate-300 mb-4">
          Delete all entries with a specific tag in one operation:
        </p>
        <CodeBlock
          code={`// Setup: cache user-related data
cache.set('user:1', userData, { tags: ['user:1', 'users'] })
cache.set('user:1:profile', profile, { tags: ['user:1'] })
cache.set('user:1:posts', posts, { tags: ['user:1'] })
cache.set('user:1:settings', settings, { tags: ['user:1'] })

// When user logs out, clear ALL their data
cache.deleteByTag('user:1')
// Removes: user:1, user:1:profile, user:1:posts, user:1:settings

// Clear all user data
cache.deleteByTag('users')

// Chain multiple tag deletions
function logout(userId: string) {
  cache.deleteByTag(\`user:\${userId}\`)
  cache.deleteByTag('session')
}`}
          language="typescript"
        />
      </section>

      {/* Common Patterns */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Common Patterns</h2>

        <h3 className="text-xl font-semibold text-white mb-3">User Data Invalidation</h3>
        <CodeBlock
          code={`// When caching user-related data, tag with user ID
function cacheUserData(userId: string, key: string, data: any) {
  cache.set(key, data, { tags: [\`user:\${userId}\`] })
}

cacheUserData('123', 'profile:123', profileData)
cacheUserData('123', 'posts:123', postsData)
cacheUserData('123', 'friends:123', friendsData)

// On logout or user deletion, clear everything
function onUserLogout(userId: string) {
  cache.deleteByTag(\`user:\${userId}\`)
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Resource Type Grouping</h3>
        <CodeBlock
          code={`// Tag by resource type
cache.set('product:1', product1, { tags: ['products', 'category:electronics'] })
cache.set('product:2', product2, { tags: ['products', 'category:electronics'] })
cache.set('product:3', product3, { tags: ['products', 'category:clothing'] })

// Clear all products
cache.deleteByTag('products')

// Clear only electronics
cache.deleteByTag('category:electronics')`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Time-based Grouping</h3>
        <CodeBlock
          code={`// Tag with time periods
const today = new Date().toISOString().split('T')[0]

cache.set('analytics:page-views', data, {
  tags: ['analytics', \`date:\${today}\`]
})

// Clear old analytics data
function clearOldAnalytics(date: string) {
  cache.deleteByTag(\`date:\${date}\`)
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-white mb-3 mt-6">Dependency Tracking</h3>
        <CodeBlock
          code={`// Track dependencies between cached data
cache.set('post:1', postData, {
  tags: ['posts', 'user:1'] // Post depends on user 1
})

cache.set('comment:1', commentData, {
  tags: ['comments', 'post:1', 'user:2'] // Comment depends on post and user
})

// When a post is updated, invalidate related comments
function onPostUpdate(postId: string) {
  cache.delete(\`post:\${postId}\`)
  cache.deleteByTag(\`post:\${postId}\`) // Invalidates comments too
}`}
          language="typescript"
        />
      </section>

      {/* React Integration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">React Integration</h2>
        <p className="text-slate-300 mb-4">
          Use the <code className="text-sky-400">useCacheInvalidation</code> hook for tag-based invalidation:
        </p>
        <CodeBlock
          code={`import { useCacheInvalidation, useCachedQuery } from '@oxog/cachekeeper/react'

function UserProfile({ userId }: { userId: string }) {
  const { data } = useCachedQuery(
    \`user:\${userId}\`,
    () => fetchUser(userId),
    { tags: [\`user:\${userId}\`] }
  )

  const { invalidateByTag } = useCacheInvalidation()

  const handleLogout = () => {
    invalidateByTag(\`user:\${userId}\`)
    // All user-related cached data is cleared
  }

  return (
    <div>
      <h1>{data?.name}</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}`}
          language="tsx"
        />
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Best Practices</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Use Consistent Naming</h4>
            <p className="text-slate-300 text-sm">
              Establish a naming convention for tags (e.g., <code>type:id</code>) and stick to it.
              This makes invalidation patterns predictable.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Don't Over-Tag</h4>
            <p className="text-slate-300 text-sm">
              Only add tags that you'll actually use for invalidation. Each tag adds a small
              amount of overhead.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Hierarchical Tags</h4>
            <p className="text-slate-300 text-sm">
              Use hierarchical tags like <code>user:123</code> and <code>user:123:posts</code>
              to enable both broad and specific invalidation.
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sky-400 font-semibold mb-2">Combine with TTL</h4>
            <p className="text-slate-300 text-sm">
              Tags handle active invalidation, TTL handles passive expiration.
              Use both for robust cache management.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
