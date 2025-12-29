/**
 * Logging Plugin Example
 *
 * Logs all cache operations for debugging and monitoring
 */
import { createCache } from '@oxog/cachekeeper';
import { loggingPlugin } from '@oxog/cachekeeper/plugins';

const cache = createCache({
  maxSize: 100,
  plugins: [
    loggingPlugin({
      logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
      logHits: true,
      logMisses: true,
      logSets: true,
      logDeletes: true,
      // Custom logger (defaults to console)
      logger: {
        debug: (msg) => console.log(`[CACHE DEBUG] ${msg}`),
        info: (msg) => console.log(`[CACHE INFO] ${msg}`),
        warn: (msg) => console.warn(`[CACHE WARN] ${msg}`),
        error: (msg) => console.error(`[CACHE ERROR] ${msg}`),
      },
    }),
  ],
});

console.log('Logging plugin demo:\n');

// These operations will be logged
cache.set('user:1', { name: 'Alice' });
// [CACHE DEBUG] SET user:1

cache.get('user:1');
// [CACHE DEBUG] HIT user:1

cache.get('user:2');
// [CACHE DEBUG] MISS user:2

cache.delete('user:1');
// [CACHE DEBUG] DELETE user:1

// Useful for:
// - Debugging cache behavior
// - Monitoring hit/miss rates
// - Tracking cache operations in production
// - Performance analysis
