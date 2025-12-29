/**
 * LocalStorage Adapter Example
 *
 * Persistent storage that survives page refreshes and browser restarts
 */
import { createCache } from '@oxog/cachekeeper';
import { createLocalStorage } from '@oxog/cachekeeper/storage';

const cache = createCache({
  maxSize: 100,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  storage: createLocalStorage({
    prefix: 'myapp:', // Namespace prefix for keys
    serializer: JSON.stringify,
    deserializer: JSON.parse,
  }),
});

// Data persists across page refreshes
cache.set('user:preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true,
});

cache.set('user:lastVisit', Date.now());

console.log('LocalStorage demo:');
console.log('Preferences:', cache.get('user:preferences'));
console.log('Last visit:', cache.get('user:lastVisit'));

// Check actual localStorage
console.log('\nIn localStorage:');
console.log(localStorage.getItem('myapp:user:preferences'));

// Clear cache (also clears from localStorage)
// cache.clear();

// LocalStorage limitations:
// - ~5MB storage limit
// - Synchronous API (can block)
// - String-only storage (auto-serialization handles this)
// - Shared across tabs
