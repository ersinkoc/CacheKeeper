import type { StorageAdapter } from '../types'

/**
 * In-memory storage adapter using Map
 */
export class MemoryStorage implements StorageAdapter {
  private data = new Map<string, string>()

  get(key: string): string | null {
    return this.data.get(key) ?? null
  }

  set(key: string, value: string): void {
    this.data.set(key, value)
  }

  delete(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  keys(): string[] {
    return Array.from(this.data.keys())
  }

  has(key: string): boolean {
    return this.data.has(key)
  }

  size(): number {
    return this.data.size
  }
}

/**
 * Creates a new memory storage instance
 */
export function createMemoryStorage(): StorageAdapter {
  return new MemoryStorage()
}
