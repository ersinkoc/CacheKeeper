/**
 * Memoization Example
 *
 * Demonstrates getOrSet and memoize for expensive computations
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

// Simulate an expensive API call
async function fetchUserFromAPI(userId: number): Promise<{ id: number; name: string }> {
  console.log(`Fetching user ${userId} from API...`);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate latency
  return { id: userId, name: `User ${userId}` };
}

// Using getOrSet for single value memoization
async function getUser(userId: number) {
  return cache.getOrSet(`user:${userId}`, () => fetchUserFromAPI(userId), {
    ttl: 60000,
  });
}

// Using memoize to wrap a function
const memoizedFetch = cache.memoize(
  async (userId: number, includeDetails: boolean) => {
    console.log(`Fetching user ${userId} (details: ${includeDetails})`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: userId,
      name: `User ${userId}`,
      details: includeDetails ? { role: 'admin' } : undefined,
    };
  },
  {
    ttl: 30000,
    keyGenerator: (userId, includeDetails) => `user:${userId}:${includeDetails}`,
  }
);

// Usage
async function main() {
  // First call - fetches from API
  console.log('First call:');
  const user1 = await getUser(1);
  console.log(user1);

  // Second call - returns from cache
  console.log('\nSecond call (cached):');
  const user1Cached = await getUser(1);
  console.log(user1Cached);

  // Memoized function calls
  console.log('\nMemoized function:');
  await memoizedFetch(2, true); // Fetches
  await memoizedFetch(2, true); // Cached
  await memoizedFetch(2, false); // Fetches (different params)
}

main();
