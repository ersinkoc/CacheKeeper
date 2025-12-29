/**
 * Encryption Plugin Example
 *
 * Encrypts cached values for security
 */
import { createCache } from '@oxog/cachekeeper';
import { encryptionPlugin } from '@oxog/cachekeeper/plugins';

const cache = createCache({
  maxSize: 1000,
  plugins: [
    encryptionPlugin({
      secretKey: 'your-secret-key-at-least-32-chars!',
      algorithm: 'aes-256', // Strong encryption
    }),
  ],
});

// Sensitive data is automatically encrypted before storage
cache.set('user:credentials', {
  username: 'admin',
  apiKey: 'sk-secret-api-key-12345',
  refreshToken: 'rt-refresh-token-67890',
});

cache.set('payment:info', {
  cardLast4: '4242',
  expiryMonth: 12,
  expiryYear: 2025,
});

console.log('Encryption plugin demo:');
console.log('Credentials:', cache.get('user:credentials'));
console.log('Payment info:', cache.get('payment:info'));

// Data is encrypted at rest
// Even if storage is compromised, data is protected
// Decryption happens transparently on retrieval
