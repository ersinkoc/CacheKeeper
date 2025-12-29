/**
 * React Higher-Order Component Example
 *
 * Using withCache HOC for class components or prop injection
 */
import React, { Component } from 'react';
import { CacheProvider, withCache, WithCacheProps } from '@oxog/cachekeeper/react';
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000,
});

function App() {
  return (
    <CacheProvider cache={cache}>
      <EnhancedCounter />
      <EnhancedUserCard userId={1} />
    </CacheProvider>
  );
}

// Class component with cache access
interface CounterProps extends WithCacheProps {
  initialCount?: number;
}

interface CounterState {
  count: number;
}

class Counter extends Component<CounterProps, CounterState> {
  constructor(props: CounterProps) {
    super(props);
    // Load count from cache or use initial
    const cached = props.cache.get<number>('counter:value');
    this.state = { count: cached ?? props.initialCount ?? 0 };
  }

  increment = () => {
    this.setState(
      (prev) => ({ count: prev.count + 1 }),
      () => {
        // Save to cache
        this.props.cache.set('counter:value', this.state.count);
      }
    );
  };

  decrement = () => {
    this.setState(
      (prev) => ({ count: prev.count - 1 }),
      () => {
        this.props.cache.set('counter:value', this.state.count);
      }
    );
  };

  render() {
    return (
      <div>
        <h2>Cached Counter</h2>
        <p>Count: {this.state.count}</p>
        <button onClick={this.decrement}>-</button>
        <button onClick={this.increment}>+</button>
        <p>
          <small>Value persists in cache</small>
        </p>
      </div>
    );
  }
}

// Wrap with HOC
const EnhancedCounter = withCache(Counter);

// Functional component with cache props
interface UserCardProps extends WithCacheProps {
  userId: number;
}

function UserCard({ userId, cache }: UserCardProps) {
  const [user, setUser] = React.useState(() => cache.get(`user:${userId}`));

  React.useEffect(() => {
    if (!user) {
      // Fetch and cache
      fetch(`/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          cache.set(`user:${userId}`, data);
          setUser(data);
        });
    }
  }, [userId, cache, user]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

const EnhancedUserCard = withCache(UserCard);

export default App;
