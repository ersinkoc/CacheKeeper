/**
 * SWR (Stale-While-Revalidate) Strategy Example
 *
 * Returns stale data immediately while fetching fresh data in background
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 100,
  strategy: 'swr',
  staleTime: 5000, // Data becomes stale after 5 seconds
  defaultTTL: 60000, // Data expires completely after 60 seconds
  onStaleRevalidate: async (key, staleValue) => {
    console.log(`Background revalidation for: ${key}`);
    const freshData = await fetchFromAPI(key);
    return freshData;
  },
});

// Simulate API fetch
async function fetchFromAPI(key: string) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { data: `Fresh data for ${key}`, timestamp: Date.now() };
}

async function main() {
  // Initial fetch
  const initialData = await cache.getOrSet('api:data', () => fetchFromAPI('api:data'));
  console.log('Initial data:', initialData);

  // Immediate access - returns fresh data
  console.log('\nImmediate access:');
  console.log(cache.get('api:data'));

  // Wait for data to become stale (but not expired)
  console.log('\nWaiting 6 seconds for data to become stale...');
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Access stale data - returns immediately, revalidates in background
  console.log('\nAccessing stale data:');
  const staleData = cache.get('api:data');
  console.log('Returned (stale):', staleData);

  // Wait for background revalidation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Now data is fresh again
  console.log('\nAfter revalidation:');
  console.log(cache.get('api:data'));
}

main();

// SWR is ideal for:
// - API response caching
// - User interface data
// - Data that can be slightly outdated
// - Improving perceived performance
