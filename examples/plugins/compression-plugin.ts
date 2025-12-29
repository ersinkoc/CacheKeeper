/**
 * Compression Plugin Example
 *
 * Automatically compresses cached values to save memory
 */
import { createCache } from '@oxog/cachekeeper';
import { compressionPlugin } from '@oxog/cachekeeper/plugins';

const cache = createCache({
  maxSize: 1000,
  plugins: [
    compressionPlugin({
      threshold: 1024, // Only compress values larger than 1KB
      algorithm: 'lz-string', // Lightweight compression
    }),
  ],
});

// Small values - stored as-is
cache.set('small', { name: 'John' });

// Large values - automatically compressed
const largeData = {
  users: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    profile: { bio: 'Lorem ipsum dolor sit amet...'.repeat(10) },
  })),
};

cache.set('large', largeData);

console.log('Compression plugin demo:');
console.log('Small value retrieved:', cache.get('small'));
console.log('Large value users count:', cache.get('large')?.users.length);

// Compression is transparent - you get back original data
// Memory savings can be 50-90% for text-heavy data
