/**
 * TTL & Expiration Example
 *
 * Demonstrates time-to-live functionality and automatic expiration
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 100,
  defaultTTL: 60000, // 1 minute default
});

// Set with default TTL
cache.set('session:abc', { userId: 1, token: 'xyz' });

// Set with custom TTL (10 seconds)
cache.set('otp:123', '456789', { ttl: 10000 });

// Set without TTL (never expires)
cache.set('config:app', { theme: 'dark' }, { ttl: 0 });

// Check TTL remaining
console.log('Session TTL:', cache.getTTL('session:abc')); // ~60000ms
console.log('OTP TTL:', cache.getTTL('otp:123')); // ~10000ms
console.log('Config TTL:', cache.getTTL('config:app')); // null (no expiration)

// Update TTL without changing value
cache.touch('session:abc', 120000); // Extend to 2 minutes

// Set a value only if it doesn't exist (with TTL)
cache.setIfAbsent('session:abc', { new: 'value' }); // Won't update - key exists
cache.setIfAbsent('session:def', { userId: 2, token: 'abc' }); // Will set

// Simulate time passing and check expiration
setTimeout(() => {
  console.log('After 11 seconds:');
  console.log('OTP exists?', cache.has('otp:123')); // false (expired)
  console.log('Session exists?', cache.has('session:abc')); // true (not expired yet)
}, 11000);
