/**
 * FIFO (First In First Out) Strategy Example
 *
 * Evicts the oldest items regardless of access patterns
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 3,
  strategy: 'fifo',
});

cache.on('evict', (event) => {
  console.log(`Evicted: ${event.key} (oldest item)`);
});

// Fill the cache in order
cache.set('first', '1st item');
await sleep(10);
cache.set('second', '2nd item');
await sleep(10);
cache.set('third', '3rd item');

console.log('Initial cache:', cache.keys()); // ['first', 'second', 'third']

// Access patterns don't matter for FIFO
cache.get('first'); // This won't prevent eviction

// Add new item - 'first' will be evicted (oldest)
cache.set('fourth', '4th item');
console.log('After adding "fourth":', cache.keys()); // ['second', 'third', 'fourth']

// Add another - 'second' will be evicted
cache.set('fifth', '5th item');
console.log('After adding "fifth":', cache.keys()); // ['third', 'fourth', 'fifth']

// FIFO is ideal for:
// - Log buffers
// - Event queues
// - Scenarios where insertion order matters
// - Simple predictable eviction patterns

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
