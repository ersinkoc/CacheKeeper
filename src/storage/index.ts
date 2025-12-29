import type { StorageAdapter, StorageType } from '../types'
import { MemoryStorage, createMemoryStorage } from './memory'
import { LocalStorageAdapter, createLocalStorage } from './local'
import { SessionStorageAdapter, createSessionStorage } from './session'
import {
  IndexedDBStorage,
  createIndexedDBStorage,
  indexedDBStorage,
  type IndexedDBStorageOptions,
} from './indexed-db'

export {
  // Memory
  MemoryStorage,
  createMemoryStorage,
  // Local
  LocalStorageAdapter,
  createLocalStorage,
  // Session
  SessionStorageAdapter,
  createSessionStorage,
  // IndexedDB
  IndexedDBStorage,
  createIndexedDBStorage,
  indexedDBStorage,
  type IndexedDBStorageOptions,
}

/**
 * Creates a storage adapter based on type or custom adapter
 */
export function createStorage(
  storage?: StorageType | StorageAdapter,
  storageKey?: string
): StorageAdapter {
  // If already a storage adapter, return it
  if (storage && typeof storage === 'object') {
    return storage
  }

  // Create storage based on type
  switch (storage) {
    case 'local':
      return createLocalStorage(storageKey)
    case 'session':
      return createSessionStorage(storageKey)
    case 'memory':
    default:
      return createMemoryStorage()
  }
}

/**
 * Checks if a storage adapter is async (returns Promises)
 */
export function isAsyncStorage(storage: StorageAdapter): boolean {
  // Try to detect async storage by checking if methods return promises
  // This is a heuristic - IndexedDB storage is always async
  return storage instanceof IndexedDBStorage
}

/**
 * Wraps a sync storage adapter to be used with async operations
 */
export function wrapAsyncStorage(storage: StorageAdapter): StorageAdapter {
  return {
    get: async (key: string) => {
      const result = storage.get(key)
      return result instanceof Promise ? result : result
    },
    set: async (key: string, value: string) => {
      const result = storage.set(key, value)
      return result instanceof Promise ? result : undefined
    },
    delete: async (key: string) => {
      const result = storage.delete(key)
      return result instanceof Promise ? result : undefined
    },
    clear: async () => {
      const result = storage.clear()
      return result instanceof Promise ? result : undefined
    },
    keys: async () => {
      const result = storage.keys()
      return result instanceof Promise ? result : result
    },
    has: async (key: string) => {
      const result = storage.has(key)
      return result instanceof Promise ? result : result
    },
    size: async () => {
      const result = storage.size()
      return result instanceof Promise ? result : result
    },
  }
}
