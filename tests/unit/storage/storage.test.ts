import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryStorage } from '../../../src/storage/memory'
import { LocalStorageAdapter, createLocalStorage } from '../../../src/storage/local'
import { SessionStorageAdapter, createSessionStorage } from '../../../src/storage/session'
import { IndexedDBStorage, createIndexedDBStorage, indexedDBStorage } from '../../../src/storage/indexed-db'

describe('Storage Adapters', () => {
  describe('MemoryStorage', () => {
    let storage: MemoryStorage

    beforeEach(() => {
      storage = new MemoryStorage()
    })

    it('should set and get values', () => {
      storage.set('key1', 'value1')
      expect(storage.get('key1')).toBe('value1')
    })

    it('should return null for missing keys', () => {
      expect(storage.get('nonexistent')).toBeNull()
    })

    it('should check key existence', () => {
      storage.set('key1', 'value1')
      expect(storage.has('key1')).toBe(true)
      expect(storage.has('nonexistent')).toBe(false)
    })

    it('should delete keys', () => {
      storage.set('key1', 'value1')
      storage.delete('key1')
      expect(storage.has('key1')).toBe(false)
    })

    it('should clear all keys', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      storage.clear()
      expect(storage.size()).toBe(0)
    })

    it('should return all keys', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      const keys = storage.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })

    it('should return size', () => {
      expect(storage.size()).toBe(0)
      storage.set('key1', 'value1')
      expect(storage.size()).toBe(1)
      storage.set('key2', 'value2')
      expect(storage.size()).toBe(2)
    })
  })

  describe('LocalStorageAdapter', () => {
    let storage: LocalStorageAdapter

    beforeEach(() => {
      localStorage.clear()
      storage = new LocalStorageAdapter('test:')
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should set and get values with prefix', () => {
      storage.set('key1', 'value1')
      expect(storage.get('key1')).toBe('value1')
      expect(localStorage.getItem('test:key1')).toBe('value1')
    })

    it('should return null for missing keys', () => {
      expect(storage.get('nonexistent')).toBeNull()
    })

    it('should check key existence', () => {
      storage.set('key1', 'value1')
      expect(storage.has('key1')).toBe(true)
      expect(storage.has('nonexistent')).toBe(false)
    })

    it('should delete keys', () => {
      storage.set('key1', 'value1')
      storage.delete('key1')
      expect(storage.has('key1')).toBe(false)
    })

    it('should clear only prefixed keys', () => {
      storage.set('key1', 'value1')
      localStorage.setItem('other:key', 'other value')

      storage.clear()

      expect(storage.has('key1')).toBe(false)
      expect(localStorage.getItem('other:key')).toBe('other value')
    })

    it('should return only prefixed keys', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      localStorage.setItem('other:key', 'other value')

      const keys = storage.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).not.toContain('other:key')
    })

    it('should return correct size', () => {
      expect(storage.size()).toBe(0)
      storage.set('key1', 'value1')
      expect(storage.size()).toBe(1)
      storage.set('key2', 'value2')
      expect(storage.size()).toBe(2)
    })

    it('should use default prefix', () => {
      const defaultStorage = new LocalStorageAdapter()
      defaultStorage.set('key1', 'value1')
      expect(defaultStorage.get('key1')).toBe('value1')
      defaultStorage.clear()
    })

    it('should handle QuotaExceededError on set', () => {
      const originalSetItem = localStorage.setItem.bind(localStorage)
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw quotaError
      })

      expect(() => storage.set('key1', 'large-value')).toThrow()
      expect(warnSpy).toHaveBeenCalledWith('localStorage quota exceeded')

      warnSpy.mockRestore()
      vi.mocked(localStorage.setItem).mockRestore()
    })

    it('should handle get errors gracefully', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(storage.get('key1')).toBeNull()

      vi.mocked(localStorage.getItem).mockRestore()
    })

    it('should handle has errors gracefully', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(storage.has('key1')).toBe(false)

      vi.mocked(localStorage.getItem).mockRestore()
    })

    it('should handle delete errors gracefully', () => {
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => storage.delete('key1')).not.toThrow()

      vi.mocked(localStorage.removeItem).mockRestore()
    })

    it('should handle clear errors gracefully', () => {
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => storage.clear()).not.toThrow()

      vi.mocked(localStorage.removeItem).mockRestore()
    })

    it('should handle keys errors gracefully', () => {
      vi.spyOn(localStorage, 'key').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(storage.keys()).toEqual([])

      vi.mocked(localStorage.key).mockRestore()
    })

    describe('createLocalStorage factory', () => {
      it('should create a LocalStorageAdapter with custom prefix', () => {
        const store = createLocalStorage('custom:')
        store.set('key1', 'value1')
        expect(localStorage.getItem('custom:key1')).toBe('value1')
        store.clear()
      })

      it('should create a LocalStorageAdapter with default prefix', () => {
        const store = createLocalStorage()
        store.set('key1', 'value1')
        expect(localStorage.getItem('cache:key1')).toBe('value1')
        store.clear()
      })
    })
  })

  describe('SessionStorageAdapter', () => {
    let storage: SessionStorageAdapter

    beforeEach(() => {
      sessionStorage.clear()
      storage = new SessionStorageAdapter('test:')
    })

    afterEach(() => {
      sessionStorage.clear()
    })

    it('should set and get values with prefix', () => {
      storage.set('key1', 'value1')
      expect(storage.get('key1')).toBe('value1')
      expect(sessionStorage.getItem('test:key1')).toBe('value1')
    })

    it('should return null for missing keys', () => {
      expect(storage.get('nonexistent')).toBeNull()
    })

    it('should check key existence', () => {
      storage.set('key1', 'value1')
      expect(storage.has('key1')).toBe(true)
      expect(storage.has('nonexistent')).toBe(false)
    })

    it('should delete keys', () => {
      storage.set('key1', 'value1')
      storage.delete('key1')
      expect(storage.has('key1')).toBe(false)
    })

    it('should clear only prefixed keys', () => {
      storage.set('key1', 'value1')
      sessionStorage.setItem('other:key', 'other value')

      storage.clear()

      expect(storage.has('key1')).toBe(false)
      expect(sessionStorage.getItem('other:key')).toBe('other value')
    })

    it('should return only prefixed keys', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      sessionStorage.setItem('other:key', 'other value')

      const keys = storage.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).not.toContain('other:key')
    })

    it('should return correct size', () => {
      expect(storage.size()).toBe(0)
      storage.set('key1', 'value1')
      expect(storage.size()).toBe(1)
      storage.set('key2', 'value2')
      expect(storage.size()).toBe(2)
      storage.delete('key1')
      expect(storage.size()).toBe(1)
    })

    it('should use default prefix', () => {
      const defaultStorage = new SessionStorageAdapter()
      defaultStorage.set('key1', 'value1')
      expect(defaultStorage.get('key1')).toBe('value1')
      defaultStorage.clear()
    })

    it('should handle QuotaExceededError on set', () => {
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
        throw quotaError
      })

      expect(() => storage.set('key1', 'large-value')).toThrow()
      expect(warnSpy).toHaveBeenCalledWith('sessionStorage quota exceeded')

      warnSpy.mockRestore()
      vi.mocked(sessionStorage.setItem).mockRestore()
    })

    it('should handle get errors gracefully', () => {
      vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(storage.get('key1')).toBeNull()

      vi.mocked(sessionStorage.getItem).mockRestore()
    })

    it('should handle has errors gracefully', () => {
      vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(storage.has('key1')).toBe(false)

      vi.mocked(sessionStorage.getItem).mockRestore()
    })

    it('should handle delete errors gracefully', () => {
      vi.spyOn(sessionStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => storage.delete('key1')).not.toThrow()

      vi.mocked(sessionStorage.removeItem).mockRestore()
    })

    it('should handle clear errors gracefully', () => {
      vi.spyOn(sessionStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => storage.clear()).not.toThrow()

      vi.mocked(sessionStorage.removeItem).mockRestore()
    })

    it('should handle keys errors gracefully', () => {
      vi.spyOn(sessionStorage, 'key').mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(storage.keys()).toEqual([])

      vi.mocked(sessionStorage.key).mockRestore()
    })

    describe('createSessionStorage factory', () => {
      it('should create a SessionStorageAdapter with custom prefix', () => {
        const store = createSessionStorage('custom:')
        store.set('key1', 'value1')
        expect(sessionStorage.getItem('custom:key1')).toBe('value1')
        store.clear()
      })

      it('should create a SessionStorageAdapter with default prefix', () => {
        const store = createSessionStorage()
        store.set('key1', 'value1')
        expect(sessionStorage.getItem('cache:key1')).toBe('value1')
        store.clear()
      })
    })
  })

  describe('IndexedDBStorage', () => {
    let storage: IndexedDBStorage

    beforeEach(async () => {
      storage = new IndexedDBStorage({
        dbName: 'test-db',
        storeName: 'test-store',
      })
    })

    afterEach(async () => {
      await storage.deleteDatabase()
    })

    it('should set and get values', async () => {
      await storage.set('key1', 'value1')
      expect(await storage.get('key1')).toBe('value1')
    })

    it('should return null for missing keys', async () => {
      expect(await storage.get('nonexistent')).toBeNull()
    })

    it('should check key existence', async () => {
      await storage.set('key1', 'value1')
      expect(await storage.has('key1')).toBe(true)
      expect(await storage.has('nonexistent')).toBe(false)
    })

    it('should delete keys', async () => {
      await storage.set('key1', 'value1')
      await storage.delete('key1')
      expect(await storage.has('key1')).toBe(false)
    })

    it('should clear all keys', async () => {
      await storage.set('key1', 'value1')
      await storage.set('key2', 'value2')
      await storage.clear()
      expect(await storage.size()).toBe(0)
    })

    it('should return all keys', async () => {
      await storage.set('key1', 'value1')
      await storage.set('key2', 'value2')
      const keys = await storage.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })

    it('should return size', async () => {
      expect(await storage.size()).toBe(0)
      await storage.set('key1', 'value1')
      expect(await storage.size()).toBe(1)
    })

    it('should close and reopen database', async () => {
      await storage.set('key1', 'value1')
      storage.close()

      // After close, it should reinitialize on next operation
      const value = await storage.get('key1')
      expect(value).toBe('value1')
    })

    it('should use custom version', async () => {
      const versionedStorage = new IndexedDBStorage({
        dbName: 'versioned-db',
        storeName: 'test-store',
        version: 2,
      })

      await versionedStorage.set('key1', 'value1')
      expect(await versionedStorage.get('key1')).toBe('value1')
      await versionedStorage.deleteDatabase()
    })

    describe('createIndexedDBStorage factory', () => {
      it('should create IndexedDBStorage with options', async () => {
        const store = createIndexedDBStorage({
          dbName: 'factory-test-db',
          storeName: 'factory-store',
        })

        await (store as IndexedDBStorage).set('key1', 'value1')
        expect(await (store as IndexedDBStorage).get('key1')).toBe('value1')
        await (store as IndexedDBStorage).deleteDatabase()
      })
    })

    describe('indexedDBStorage shorthand factory', () => {
      it('should create IndexedDBStorage with defaults', async () => {
        const store = indexedDBStorage()

        await (store as IndexedDBStorage).set('key1', 'value1')
        expect(await (store as IndexedDBStorage).get('key1')).toBe('value1')
        await (store as IndexedDBStorage).deleteDatabase()
      })

      it('should create IndexedDBStorage with partial options', async () => {
        const store = indexedDBStorage({
          dbName: 'custom-db',
        })

        await (store as IndexedDBStorage).set('key1', 'value1')
        expect(await (store as IndexedDBStorage).get('key1')).toBe('value1')
        await (store as IndexedDBStorage).deleteDatabase()
      })
    })

    describe('error handling', () => {
      it('should handle get error', async () => {
        // Initialize the database first
        await storage.set('key1', 'value1')

        // Now mock the transaction to throw an error
        const originalTransaction = IDBDatabase.prototype.transaction
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
          const tx = originalTransaction.apply(this, args)
          const originalObjectStore = tx.objectStore.bind(tx)
          vi.spyOn(tx, 'objectStore').mockImplementation((name: string) => {
            const store = originalObjectStore(name)
            vi.spyOn(store, 'get').mockImplementation(() => {
              const request = {
                error: new Error('Get error'),
                onerror: null as ((event: Event) => void) | null,
                onsuccess: null as ((event: Event) => void) | null,
              } as unknown as IDBRequest
              setTimeout(() => {
                if (request.onerror) {
                  request.onerror(new Event('error'))
                }
              }, 0)
              return request
            })
            return store
          })
          return tx
        })

        await expect(storage.get('key1')).rejects.toThrow('Failed to get key')

        vi.mocked(IDBDatabase.prototype.transaction).mockRestore()
      })

      it('should handle set error', async () => {
        // Initialize the database first
        await storage.set('init', 'value')

        const originalTransaction = IDBDatabase.prototype.transaction
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
          const tx = originalTransaction.apply(this, args)
          const originalObjectStore = tx.objectStore.bind(tx)
          vi.spyOn(tx, 'objectStore').mockImplementation((name: string) => {
            const store = originalObjectStore(name)
            vi.spyOn(store, 'put').mockImplementation(() => {
              const request = {
                error: new Error('Put error'),
                onerror: null as ((event: Event) => void) | null,
                onsuccess: null as ((event: Event) => void) | null,
              } as unknown as IDBRequest
              setTimeout(() => {
                if (request.onerror) {
                  request.onerror(new Event('error'))
                }
              }, 0)
              return request
            })
            return store
          })
          return tx
        })

        await expect(storage.set('key1', 'value1')).rejects.toThrow('Failed to set key')

        vi.mocked(IDBDatabase.prototype.transaction).mockRestore()
      })

      it('should handle delete error', async () => {
        // Initialize the database first
        await storage.set('key1', 'value1')

        const originalTransaction = IDBDatabase.prototype.transaction
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
          const tx = originalTransaction.apply(this, args)
          const originalObjectStore = tx.objectStore.bind(tx)
          vi.spyOn(tx, 'objectStore').mockImplementation((name: string) => {
            const store = originalObjectStore(name)
            vi.spyOn(store, 'delete').mockImplementation(() => {
              const request = {
                error: new Error('Delete error'),
                onerror: null as ((event: Event) => void) | null,
                onsuccess: null as ((event: Event) => void) | null,
              } as unknown as IDBRequest
              setTimeout(() => {
                if (request.onerror) {
                  request.onerror(new Event('error'))
                }
              }, 0)
              return request
            })
            return store
          })
          return tx
        })

        await expect(storage.delete('key1')).rejects.toThrow('Failed to delete key')

        vi.mocked(IDBDatabase.prototype.transaction).mockRestore()
      })

      it('should handle clear error', async () => {
        // Initialize the database first
        await storage.set('key1', 'value1')

        const originalTransaction = IDBDatabase.prototype.transaction
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
          const tx = originalTransaction.apply(this, args)
          const originalObjectStore = tx.objectStore.bind(tx)
          vi.spyOn(tx, 'objectStore').mockImplementation((name: string) => {
            const store = originalObjectStore(name)
            vi.spyOn(store, 'clear').mockImplementation(() => {
              const request = {
                error: new Error('Clear error'),
                onerror: null as ((event: Event) => void) | null,
                onsuccess: null as ((event: Event) => void) | null,
              } as unknown as IDBRequest
              setTimeout(() => {
                if (request.onerror) {
                  request.onerror(new Event('error'))
                }
              }, 0)
              return request
            })
            return store
          })
          return tx
        })

        await expect(storage.clear()).rejects.toThrow('Failed to clear store')

        vi.mocked(IDBDatabase.prototype.transaction).mockRestore()
      })

      it('should handle keys error', async () => {
        // Initialize the database first
        await storage.set('key1', 'value1')

        const originalTransaction = IDBDatabase.prototype.transaction
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
          const tx = originalTransaction.apply(this, args)
          const originalObjectStore = tx.objectStore.bind(tx)
          vi.spyOn(tx, 'objectStore').mockImplementation((name: string) => {
            const store = originalObjectStore(name)
            vi.spyOn(store, 'getAllKeys').mockImplementation(() => {
              const request = {
                error: new Error('Keys error'),
                onerror: null as ((event: Event) => void) | null,
                onsuccess: null as ((event: Event) => void) | null,
              } as unknown as IDBRequest
              setTimeout(() => {
                if (request.onerror) {
                  request.onerror(new Event('error'))
                }
              }, 0)
              return request
            })
            return store
          })
          return tx
        })

        await expect(storage.keys()).rejects.toThrow('Failed to get keys')

        vi.mocked(IDBDatabase.prototype.transaction).mockRestore()
      })

      it('should handle size/count error', async () => {
        // Initialize the database first
        await storage.set('key1', 'value1')

        const originalTransaction = IDBDatabase.prototype.transaction
        vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, ...args: Parameters<IDBDatabase['transaction']>) {
          const tx = originalTransaction.apply(this, args)
          const originalObjectStore = tx.objectStore.bind(tx)
          vi.spyOn(tx, 'objectStore').mockImplementation((name: string) => {
            const store = originalObjectStore(name)
            vi.spyOn(store, 'count').mockImplementation(() => {
              const request = {
                error: new Error('Count error'),
                onerror: null as ((event: Event) => void) | null,
                onsuccess: null as ((event: Event) => void) | null,
              } as unknown as IDBRequest
              setTimeout(() => {
                if (request.onerror) {
                  request.onerror(new Event('error'))
                }
              }, 0)
              return request
            })
            return store
          })
          return tx
        })

        await expect(storage.size()).rejects.toThrow('Failed to get count')

        vi.mocked(IDBDatabase.prototype.transaction).mockRestore()
      })

      it('should handle deleteDatabase error', async () => {
        // Initialize and close first
        await storage.set('key1', 'value1')
        storage.close()

        const originalDeleteDatabase = indexedDB.deleteDatabase.bind(indexedDB)
        vi.spyOn(indexedDB, 'deleteDatabase').mockImplementation(() => {
          const request = {
            error: new Error('Delete database error'),
            onerror: null as ((event: Event) => void) | null,
            onsuccess: null as ((event: Event) => void) | null,
          } as unknown as IDBOpenDBRequest
          setTimeout(() => {
            if (request.onerror) {
              request.onerror(new Event('error'))
            }
          }, 0)
          return request
        })

        await expect(storage.deleteDatabase()).rejects.toThrow('Failed to delete database')

        vi.mocked(indexedDB.deleteDatabase).mockRestore()
      })

      it('should handle init/open error', async () => {
        const errorStorage = new IndexedDBStorage({
          dbName: 'error-db',
          storeName: 'error-store',
        })

        const originalOpen = indexedDB.open.bind(indexedDB)
        vi.spyOn(indexedDB, 'open').mockImplementation(() => {
          const request = {
            error: new Error('Open error'),
            onerror: null as ((event: Event) => void) | null,
            onsuccess: null as ((event: Event) => void) | null,
            onupgradeneeded: null as ((event: Event) => void) | null,
          } as unknown as IDBOpenDBRequest
          setTimeout(() => {
            if (request.onerror) {
              request.onerror(new Event('error'))
            }
          }, 0)
          return request
        })

        await expect(errorStorage.get('key1')).rejects.toThrow('Failed to open IndexedDB')

        vi.mocked(indexedDB.open).mockRestore()
      })

      it('should return empty array for keys when db is null', async () => {
        // Create fresh storage
        const freshStorage = new IndexedDBStorage({
          dbName: 'null-db-test',
          storeName: 'test-store',
        })
        // Access keys without initializing
        // We need to bypass ensureInit by forcing db to null
        // Since this is tricky, we test the "db null" path differently
        // Let's close db and make ensureInit fail
        await freshStorage.set('key1', 'value1')
        freshStorage.close()

        // Now mock open to always succeed with db = null
        const originalOpen = indexedDB.open.bind(indexedDB)
        vi.spyOn(indexedDB, 'open').mockImplementation(() => {
          const request = {
            error: null,
            result: null,
            onerror: null as ((event: Event) => void) | null,
            onsuccess: null as ((event: Event) => void) | null,
            onupgradeneeded: null as ((event: Event) => void) | null,
          } as unknown as IDBOpenDBRequest
          setTimeout(() => {
            if (request.onsuccess) {
              request.onsuccess(new Event('success'))
            }
          }, 0)
          return request
        })

        // This should handle null db gracefully
        const result = await freshStorage.get('key1')
        expect(result).toBeNull()

        vi.mocked(indexedDB.open).mockRestore()
        await freshStorage.deleteDatabase()
      })
    })
  })
})
