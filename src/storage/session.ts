import type { StorageAdapter } from '../types'

/**
 * sessionStorage adapter with key prefixing
 */
export class SessionStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix: string = 'cache:') {
    this.prefix = prefix
  }

  private prefixKey(key: string): string {
    return `${this.prefix}${key}`
  }

  get(key: string): string | null {
    try {
      return sessionStorage.getItem(this.prefixKey(key))
    } catch {
      return null
    }
  }

  set(key: string, value: string): void {
    try {
      sessionStorage.setItem(this.prefixKey(key), value)
    } catch (error) {
      // Handle QuotaExceededError
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('sessionStorage quota exceeded')
      }
      throw error
    }
  }

  delete(key: string): void {
    try {
      sessionStorage.removeItem(this.prefixKey(key))
    } catch {
      // Ignore errors on delete
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key))
    } catch {
      // Ignore errors on clear
    }
  }

  keys(): string[] {
    const result: string[] = []
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
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
      return sessionStorage.getItem(this.prefixKey(key)) !== null
    } catch {
      return false
    }
  }

  size(): number {
    return this.keys().length
  }
}

/**
 * Creates a new sessionStorage adapter instance
 */
export function createSessionStorage(prefix?: string): StorageAdapter {
  return new SessionStorageAdapter(prefix)
}
