/**
 * React Cache Invalidation Example
 *
 * Patterns for invalidating cached data
 */
import React from 'react';
import {
  CacheProvider,
  useCache,
  useCacheInvalidation,
  useCachedQuery,
} from '@oxog/cachekeeper/react';
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000,
});

function App() {
  return (
    <CacheProvider cache={cache}>
      <TodoApp />
    </CacheProvider>
  );
}

function TodoApp() {
  const { invalidate, invalidateByTag, invalidateByPrefix } = useCacheInvalidation();

  // Fetch todos with tags
  const { data: todos, refetch } = useCachedQuery({
    key: 'todos:all',
    fetcher: async () => {
      const res = await fetch('/api/todos');
      return res.json();
    },
    tags: ['todos', 'user-data'],
  });

  // Add new todo and invalidate cache
  const addTodo = async (title: string) => {
    await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });

    // Option 1: Invalidate specific key
    invalidate('todos:all');

    // Option 2: Invalidate by tag (all todo-related caches)
    // invalidateByTag('todos');

    // Option 3: Invalidate by prefix
    // invalidateByPrefix('todos:');

    // Refetch to get fresh data
    refetch();
  };

  // Delete todo
  const deleteTodo = async (id: number) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });

    // Invalidate all caches with 'todos' tag
    invalidateByTag('todos');
    refetch();
  };

  return (
    <div>
      <h1>Todo List</h1>

      <button onClick={() => addTodo('New Todo')}>Add Todo</button>

      <button onClick={() => invalidateByTag('user-data')}>Clear All User Data</button>

      <ul>
        {todos?.map((todo: { id: number; title: string }) => (
          <li key={todo.id}>
            {todo.title}
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
