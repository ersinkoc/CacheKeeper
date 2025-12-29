import type { StorageAdapter } from '../types'

/**
 * IndexedDB storage configuration
 */
export interface IndexedDBStorageOptions {
  dbName: string
  storeName: string
  version?: number
}

/**
 * IndexedDB storage adapter for large-scale persistent storage
 */
export class IndexedDBStorage implements StorageAdapter {
  private db: IDBDatabase | null = null
  private dbName: string
  private storeName: string
  private version: number
  private initPromise: Promise<void> | null = null

  constructor(options: IndexedDBStorageOptions) {
    this.dbName = options.dbName
    this.storeName = options.storeName
    this.version = options.version ?? 1
  }

  private async ensureInit(): Promise<void> {
    if (this.db) return

    if (!this.initPromise) {
      this.initPromise = this.init()
    }

    await this.initPromise
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async get(key: string): Promise<string | null> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null)
        return
      }

      const transaction = this.db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onerror = () => {
        reject(new Error(`Failed to get key "${key}": ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve((request.result as string | undefined) ?? null)
      }
    })
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(value, key)

      request.onerror = () => {
        reject(new Error(`Failed to set key "${key}": ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  async delete(key: string): Promise<void> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      const transaction = this.db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onerror = () => {
        reject(new Error(`Failed to delete key "${key}": ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  async clear(): Promise<void> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      const transaction = this.db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  async keys(): Promise<string[]> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([])
        return
      }

      const transaction = this.db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onerror = () => {
        reject(new Error(`Failed to get keys: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve(request.result as string[])
      }
    })
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  async size(): Promise<number> {
    await this.ensureInit()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(0)
        return
      }

      const transaction = this.db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onerror = () => {
        reject(new Error(`Failed to get count: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  }

  /**
   * Closes the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }

  /**
   * Deletes the entire database
   */
  async deleteDatabase(): Promise<void> {
    this.close()

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)

      request.onerror = () => {
        reject(new Error(`Failed to delete database: ${request.error?.message ?? 'Unknown error'}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }
}

/**
 * Creates a new IndexedDB storage instance
 */
export function createIndexedDBStorage(options: IndexedDBStorageOptions): StorageAdapter {
  return new IndexedDBStorage(options)
}

/**
 * Shorthand for creating IndexedDB storage with defaults
 */
export function indexedDBStorage(
  options: Partial<IndexedDBStorageOptions> = {}
): StorageAdapter {
  return new IndexedDBStorage({
    dbName: options.dbName ?? 'cachekeeper',
    storeName: options.storeName ?? 'cache',
    version: options.version ?? 1,
  })
}
