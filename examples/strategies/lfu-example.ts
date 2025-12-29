/**
 * LFU (Least Frequently Used) Strategy Example
 *
 * Evicts the least frequently accessed items when cache is full
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 3,
  strategy: 'lfu',
});

cache.on('evict', (event) => {
  console.log(`Evicted: ${event.key} (access count was low)`);
});

// Fill the cache
cache.set('popular', 'frequently accessed');
cache.set('moderate', 'sometimes accessed');
cache.set('rare', 'rarely accessed');

// Simulate access patterns
for (let i = 0; i < 10; i++) cache.get('popular'); // 10 accesses
for (let i = 0; i < 5; i++) cache.get('moderate'); // 5 accesses
cache.get('rare'); // 1 access

console.log('Access patterns set');

// Add new item - 'rare' should be evicted (least frequent)
cache.set('new', 'new item');
console.log('After adding "new":', cache.keys()); // ['popular', 'moderate', 'new']

// Add another - 'new' should be evicted (only 0 accesses after set)
cache.set('another', 'another item');
console.log('After adding "another":', cache.keys());

// LFU is ideal for:
// - CDN caches
// - Static asset caching
// - Content that has stable popularity patterns
