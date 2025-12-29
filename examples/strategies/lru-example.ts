/**
 * LRU (Least Recently Used) Strategy Example
 *
 * Evicts the least recently accessed items when cache is full
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 3, // Small size to demonstrate eviction
  strategy: 'lru',
});

// Listen to eviction events
cache.on('evict', (event) => {
  console.log(`Evicted: ${event.key} (reason: ${event.reason})`);
});

// Fill the cache
cache.set('a', 'value A');
cache.set('b', 'value B');
cache.set('c', 'value C');

console.log('Initial cache:', cache.keys()); // ['a', 'b', 'c']

// Access 'a' - makes it recently used
cache.get('a');
console.log('Accessed "a"');

// Add new item - 'b' should be evicted (least recently used)
cache.set('d', 'value D');
console.log('After adding "d":', cache.keys()); // ['a', 'c', 'd']

// Access 'c' and 'a'
cache.get('c');
cache.get('a');

// Add another item - 'd' should be evicted
cache.set('e', 'value E');
console.log('After adding "e":', cache.keys()); // ['c', 'a', 'e']

// LRU is ideal for:
// - Session caches
// - Page/component caches
// - General purpose caching where recent access indicates future access
