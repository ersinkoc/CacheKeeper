/**
 * TTL-Only Strategy Example
 *
 * No size-based eviction, relies purely on TTL expiration
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: Infinity, // No size limit
  strategy: 'ttl',
  defaultTTL: 5000, // 5 seconds default TTL
});

cache.on('expire', (event) => {
  console.log(`Expired: ${event.key}`);
});

// Set items with different TTLs
cache.set('short', 'expires quickly', { ttl: 2000 }); // 2 seconds
cache.set('medium', 'expires normally'); // 5 seconds (default)
cache.set('long', 'expires slowly', { ttl: 10000 }); // 10 seconds
cache.set('permanent', 'never expires', { ttl: 0 }); // No expiration

console.log('Initial cache size:', cache.size()); // 4

// Check after 3 seconds
setTimeout(() => {
  console.log('\nAfter 3 seconds:');
  console.log('short exists?', cache.has('short')); // false
  console.log('medium exists?', cache.has('medium')); // true
  console.log('long exists?', cache.has('long')); // true
  console.log('permanent exists?', cache.has('permanent')); // true
}, 3000);

// Check after 7 seconds
setTimeout(() => {
  console.log('\nAfter 7 seconds:');
  console.log('medium exists?', cache.has('medium')); // false
  console.log('long exists?', cache.has('long')); // true
  console.log('permanent exists?', cache.has('permanent')); // true
}, 7000);

// Check after 12 seconds
setTimeout(() => {
  console.log('\nAfter 12 seconds:');
  console.log('long exists?', cache.has('long')); // false
  console.log('permanent exists?', cache.has('permanent')); // true
  console.log('Cache size:', cache.size()); // 1 (only permanent)
}, 12000);

// TTL-Only is ideal for:
// - Session tokens
// - OTP codes
// - Temporary flags
// - Time-sensitive data
