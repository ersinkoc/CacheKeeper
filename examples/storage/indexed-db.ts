/**
 * IndexedDB Storage Adapter Example
 *
 * Large-scale persistent storage with async API
 */
import { createCache } from '@oxog/cachekeeper';
import { createIndexedDBStorage } from '@oxog/cachekeeper/storage';

async function main() {
  // IndexedDB requires async initialization
  const storage = await createIndexedDBStorage({
    dbName: 'myapp-cache',
    storeName: 'cache',
    version: 1,
  });

  const cache = createCache({
    maxSize: 10000,
    defaultTTL: 7 * 24 * 60 * 60 * 1000, // 1 week
    storage,
  });

  // Store large data efficiently
  cache.set('images:gallery', {
    images: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      url: `https://example.com/image${i}.jpg`,
      metadata: { width: 1920, height: 1080 },
    })),
  });

  cache.set('offline:articles', [
    { id: 1, title: 'Article 1', content: 'Long content here...' },
    { id: 2, title: 'Article 2', content: 'More content...' },
  ]);

  console.log('IndexedDB demo:');
  console.log('Gallery images count:', cache.get('images:gallery')?.images.length);
  console.log('Offline articles:', cache.get('offline:articles'));

  // IndexedDB advantages:
  // - Much larger storage (50MB+)
  // - Async API (non-blocking)
  // - Structured data support
  // - Better for large datasets

  // Ideal for:
  // - Offline-first applications
  // - Large file caching
  // - Complex data structures
  // - PWA data storage
}

main();
