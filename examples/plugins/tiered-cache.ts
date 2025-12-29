/**
 * Tiered Cache Plugin Example
 *
 * Multi-level caching: L1 (fast memory) -> L2 (persistent storage)
 */
import { createCache } from '@oxog/cachekeeper';
import { tieredPlugin } from '@oxog/cachekeeper/plugins';
import { createMemoryStorage, createLocalStorage } from '@oxog/cachekeeper/storage';

// Create a tiered cache with two levels
const cache = createCache({
  maxSize: 100,
  plugins: [
    tieredPlugin({
      tiers: [
        {
          name: 'L1-Memory',
          storage: createMemoryStorage(),
          maxSize: 50, // Small, fast tier
          ttl: 60000, // 1 minute
        },
        {
          name: 'L2-LocalStorage',
          storage: createLocalStorage({ prefix: 'tiered:' }),
          maxSize: 500, // Larger, persistent tier
          ttl: 3600000, // 1 hour
        },
      ],
      writePolicy: 'write-through', // Write to all tiers
      readPolicy: 'read-through', // Read from L1, fallback to L2
    }),
  ],
});

console.log('Tiered cache demo:');

// Write goes to both tiers
cache.set('data:1', { value: 'important data' });
console.log('Data written to both tiers');

// Read from L1 (fast)
console.log('First read (L1):', cache.get('data:1'));

// Simulate L1 eviction by filling it
for (let i = 0; i < 60; i++) {
  cache.set(`temp:${i}`, { temp: true });
}

// Now data:1 might be evicted from L1, but still in L2
console.log('After L1 eviction, read (from L2):', cache.get('data:1'));
// Data is automatically promoted back to L1

// Benefits:
// - Fast access for hot data (L1)
// - Persistence for important data (L2)
// - Automatic tier management
// - Optimal resource utilization
