/**
 * React Basic Hooks Example
 *
 * Using CacheKeeper with React hooks
 */
import React from 'react';
import { CacheProvider, useCache, useCachedValue, useCacheStats } from '@oxog/cachekeeper/react';
import { createCache } from '@oxog/cachekeeper';

// Create cache instance
const cache = createCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000,
});

// App wrapper with CacheProvider
function App() {
  return (
    <CacheProvider cache={cache}>
      <UserProfile userId={1} />
      <CacheStatsDisplay />
    </CacheProvider>
  );
}

// Component using useCache hook
function UserProfile({ userId }: { userId: number }) {
  const cache = useCache();

  const handleSavePreference = (key: string, value: unknown) => {
    cache.set(`user:${userId}:${key}`, value);
  };

  const getPreference = (key: string) => {
    return cache.get(`user:${userId}:${key}`);
  };

  return (
    <div>
      <h2>User Profile</h2>
      <button onClick={() => handleSavePreference('theme', 'dark')}>Set Dark Theme</button>
      <button onClick={() => console.log(getPreference('theme'))}>Get Theme</button>
    </div>
  );
}

// Component using useCachedValue for reactive cache value
function UserSettings({ userId }: { userId: number }) {
  const [theme, setTheme] = useCachedValue<string>(`user:${userId}:theme`, 'light', {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  });

  return (
    <div>
      <h3>Settings</h3>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
    </div>
  );
}

// Component displaying cache statistics
function CacheStatsDisplay() {
  const stats = useCacheStats();

  return (
    <div>
      <h3>Cache Statistics</h3>
      <ul>
        <li>Size: {stats.size}</li>
        <li>Hits: {stats.hits}</li>
        <li>Misses: {stats.misses}</li>
        <li>Hit Rate: {(stats.hitRate * 100).toFixed(1)}%</li>
      </ul>
    </div>
  );
}

export default App;
