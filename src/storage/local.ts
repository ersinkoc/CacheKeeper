import type { StorageAdapter } from '../types'

/**
 * localStorage adapter with key prefixing
 */
export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix: string = 'cache:') {
    this.prefix = prefix
  }

  private prefixKey(key: string): string {
    return `${this.prefix}${key}`
  }

  get(key: string): string | null {
    try {
      return localStorage.getItem(this.prefixKey(key))
    } catch {
      return null
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(this.prefixKey(key), value)
    } catch (error) {
      // Handle QuotaExceededError
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded')
      }
      throw error
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefixKey(key))
    } catch {
      // Ignore errors on delete
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    } catch {
      // Ignore errors on clear
    }
  }

  keys(): string[] {
    const result: string[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          result.push(key.slice(this.prefix.length))
        }
      }
    } catch {
      // Return empty array on error
    }
    return result
  }

  has(key: string): boolean {
    try {
      return localStorage.getItem(this.prefixKey(key)) !== null
    } catch {
      return false
    }
  }

  size(): number {
    return this.keys().length
  }
}

/**
 * Creates a new localStorage adapter instance
 */
export function createLocalStorage(prefix?: string): StorageAdapter {
  return new LocalStorageAdapter(prefix)
}
