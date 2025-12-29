/**
 * Basic Cache Example
 *
 * Demonstrates fundamental cache operations: set, get, delete
 */
import { createCache } from '@oxog/cachekeeper';

// Create a simple cache with default settings
const cache = createCache({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

// Basic set and get operations
cache.set('user:1', { id: 1, name: 'Alice', email: 'alice@example.com' });
cache.set('user:2', { id: 2, name: 'Bob', email: 'bob@example.com' });

const user1 = cache.get('user:1');
console.log('User 1:', user1);
// Output: User 1: { id: 1, name: 'Alice', email: 'alice@example.com' }

// Check if key exists
console.log('Has user:1?', cache.has('user:1')); // true
console.log('Has user:3?', cache.has('user:3')); // false

// Get cache size
console.log('Cache size:', cache.size()); // 2

// Delete a key
cache.delete('user:1');
console.log('After delete, has user:1?', cache.has('user:1')); // false

// Get all keys
console.log('All keys:', cache.keys()); // ['user:2']

// Clear entire cache
cache.clear();
console.log('After clear, size:', cache.size()); // 0
