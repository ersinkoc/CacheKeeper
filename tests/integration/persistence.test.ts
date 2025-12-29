/**
 * Integration Tests - Persistence
 *
 * Tests storage adapters and data persistence
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCache } from '../../src';
import { createMemoryStorage, createLocalStorage, createSessionStorage } from '../../src/storage';

const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

describe('Persistence Integration', () => {
  describe('Memory Storage', () => {
    it('should store and retrieve data correctly', () => {
      const storage = createMemoryStorage();
      const cache = createCache({ maxSize: 100, storage });

      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });

      expect(cache.get('key1')).toEqual({ data: 'value1' });
      expect(cache.get('key2')).toEqual({ data: 'value2' });
    });

    it('should handle complex data types', () => {
      const storage = createMemoryStorage();
      const cache = createCache({ maxSize: 100, storage });

      const complexData = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'found',
          },
        },
        date: new Date('2024-01-01').toISOString(),
      };

      cache.set('complex', complexData);
      expect(cache.get('complex')).toEqual(complexData);
    });

    it('should not persist across instances', () => {
      const storage1 = createMemoryStorage();
      const cache1 = createCache({ maxSize: 100, storage: storage1 });

      cache1.set('key', 'value');

      const storage2 = createMemoryStorage();
      const cache2 = createCache({ maxSize: 100, storage: storage2 });

      expect(cache2.get('key')).toBeUndefined();
    });
  });

  describe('LocalStorage Adapter', () => {
    let mockLocalStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
      mockLocalStorage = createMockStorage();
      vi.stubGlobal('localStorage', mockLocalStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should persist data to localStorage', () => {
      const storage = createLocalStorage({ prefix: 'test:' });
      const cache = createCache({ maxSize: 100, storage });

      cache.set('user', { id: 1, name: 'Alice' });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(cache.get('user')).toEqual({ id: 1, name: 'Alice' });
    });

    it('should use prefix for all keys', () => {
      const storage = createLocalStorage({ prefix: 'myapp:' });
      const cache = createCache({ maxSize: 100, storage });

      cache.set('key1', 'value1');

      const calls = mockLocalStorage.setItem.mock.calls;
      const keyUsed = calls.find((call) => call[0].includes('myapp:'));
      expect(keyUsed).toBeDefined();
    });

    it('should handle serialization correctly', () => {
      const storage = createLocalStorage({ prefix: 'test:' });
      const cache = createCache({ maxSize: 100, storage });

      const data = {
        string: 'hello',
        number: 42,
        array: [1, 2, 3],
        object: { nested: true },
      };

      cache.set('data', data);
      expect(cache.get('data')).toEqual(data);
    });

    it('should handle deletion correctly', () => {
      const storage = createLocalStorage({ prefix: 'test:' });
      const cache = createCache({ maxSize: 100, storage });

      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      cache.delete('key');
      expect(cache.get('key')).toBeUndefined();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('SessionStorage Adapter', () => {
    let mockSessionStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
      mockSessionStorage = createMockStorage();
      vi.stubGlobal('sessionStorage', mockSessionStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should persist data to sessionStorage', () => {
      const storage = createSessionStorage({ prefix: 'session:' });
      const cache = createCache({ maxSize: 100, storage });

      cache.set('token', 'abc123');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(cache.get('token')).toBe('abc123');
    });

    it('should clear all prefixed keys on cache clear', () => {
      const storage = createSessionStorage({ prefix: 'app:' });
      const cache = createCache({ maxSize: 100, storage });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.size).toBe(0);
    });
  });

  describe('Dump and Restore', () => {
    it('should dump cache state to serializable format', () => {
      const cache = createCache({ maxSize: 100 });

      cache.set('user:1', { id: 1, name: 'Alice' }, { ttl: 60000, tags: ['users'] });
      cache.set('user:2', { id: 2, name: 'Bob' }, { ttl: 60000, tags: ['users'] });
      cache.set('config', { theme: 'dark' }, { ttl: 0 });

      const dump = cache.dump();

      expect(dump).toHaveLength(3);
      expect(dump.find((e) => e.key === 'user:1')?.value).toEqual({ id: 1, name: 'Alice' });
      expect(dump.find((e) => e.key === 'config')?.value).toEqual({ theme: 'dark' });
    });

    it('should restore cache state from dump', () => {
      const cache1 = createCache({ maxSize: 100 });

      cache1.set('data:1', { value: 1 });
      cache1.set('data:2', { value: 2 });
      cache1.set('data:3', { value: 3 });

      const dump = cache1.dump();

      const cache2 = createCache({ maxSize: 100 });
      cache2.restore(dump);

      expect(cache2.get('data:1')).toEqual({ value: 1 });
      expect(cache2.get('data:2')).toEqual({ value: 2 });
      expect(cache2.get('data:3')).toEqual({ value: 3 });
    });

    it('should handle TTL during restore', () => {
      vi.useFakeTimers();

      const cache1 = createCache({ maxSize: 100, defaultTTL: 10000 });
      cache1.set('short', 'value', { ttl: 5000 });
      cache1.set('long', 'value', { ttl: 20000 });

      vi.advanceTimersByTime(3000);

      const dump = cache1.dump();

      const cache2 = createCache({ maxSize: 100 });
      cache2.restore(dump);

      vi.advanceTimersByTime(3000);
      expect(cache2.get('short')).toBeUndefined();
      expect(cache2.get('long')).toBe('value');

      vi.useRealTimers();
    });
  });

  describe('Storage with Different Data Types', () => {
    it('should handle various data types', () => {
      const cache = createCache({ maxSize: 100 });

      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('null', null);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('null')).toBe(null);

      cache.set('array', [1, 2, 3]);
      cache.set('nestedArray', [[1, 2], [3, 4]]);

      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('nestedArray')).toEqual([[1, 2], [3, 4]]);

      cache.set('object', { key: 'value' });
      cache.set('nestedObject', { a: { b: { c: 'deep' } } });

      expect(cache.get('object')).toEqual({ key: 'value' });
      expect(cache.get('nestedObject')).toEqual({ a: { b: { c: 'deep' } } });
    });

    it('should handle special values', () => {
      const cache = createCache({ maxSize: 100 });

      cache.set('undefined', undefined);
      cache.set('emptyString', '');
      cache.set('zero', 0);
      cache.set('emptyArray', []);
      cache.set('emptyObject', {});

      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.get('emptyString')).toBe('');
      expect(cache.get('zero')).toBe(0);
      expect(cache.get('emptyArray')).toEqual([]);
      expect(cache.get('emptyObject')).toEqual({});
    });
  });
});
