/**
 * React Data Fetching Example
 *
 * Using useCachedQuery for API data fetching with caching
 */
import React from 'react';
import { CacheProvider, useCachedQuery } from '@oxog/cachekeeper/react';
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 1000,
  strategy: 'swr',
  defaultTTL: 5 * 60 * 1000,
});

// API fetcher function
async function fetchUser(userId: number) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

async function fetchPosts(userId: number) {
  const response = await fetch(`/api/users/${userId}/posts`);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
}

function App() {
  return (
    <CacheProvider cache={cache}>
      <UserDashboard userId={1} />
    </CacheProvider>
  );
}

function UserDashboard({ userId }: { userId: number }) {
  // Fetch user data with caching
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useCachedQuery({
    key: `user:${userId}`,
    fetcher: () => fetchUser(userId),
    ttl: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
  });

  // Fetch posts with caching
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useCachedQuery({
    key: `user:${userId}:posts`,
    fetcher: () => fetchPosts(userId),
    ttl: 120000, // 2 minutes
    enabled: !!user, // Only fetch when user is loaded
  });

  if (userLoading) return <div>Loading user...</div>;
  if (userError) return <div>Error: {userError.message}</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={refetchUser}>Refresh User</button>

      <h2>Posts</h2>
      {postsLoading ? (
        <p>Loading posts...</p>
      ) : postsError ? (
        <p>Error loading posts</p>
      ) : (
        <ul>
          {posts.map((post: { id: number; title: string }) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
