/**
 * Memory Storage Example
 *
 * Default in-memory storage - fastest, no persistence
 */
import { createCache } from '@oxog/cachekeeper';
import { createMemoryStorage } from '@oxog/cachekeeper/storage';

// Memory storage is the default, but can be explicit
const cache = createCache({
  maxSize: 1000,
  storage: createMemoryStorage(),
});

// All operations are synchronous and fast
cache.set('key1', { data: 'value1' });
cache.set('key2', { data: 'value2' });

console.log('Memory storage demo:');
console.log('Get key1:', cache.get('key1'));
console.log('Cache size:', cache.size());
console.log('All keys:', cache.keys());

// Data is lost on page refresh/restart
// Use for: Session data, temporary computations, UI state
