/**
 * SessionStorage Adapter Example
 *
 * Storage that persists for the browser session only
 */
import { createCache } from '@oxog/cachekeeper';
import { createSessionStorage } from '@oxog/cachekeeper/storage';

const cache = createCache({
  maxSize: 100,
  storage: createSessionStorage({
    prefix: 'session:',
  }),
});

// Data persists during session but cleared on tab close
cache.set('auth:token', 'jwt-token-here');
cache.set('form:draft', {
  title: 'My Draft Post',
  content: 'Work in progress...',
  savedAt: Date.now(),
});

console.log('SessionStorage demo:');
console.log('Auth token exists:', cache.has('auth:token'));
console.log('Form draft:', cache.get('form:draft'));

// Session storage is ideal for:
// - Authentication tokens
// - Form drafts
// - Shopping cart (temporary)
// - Single-session preferences

// Unlike localStorage:
// - Data is cleared when tab/window closes
// - Not shared across tabs
// - Same ~5MB limit
