import type { CacheNamespace, CacheStats, SetOptions, CacheInstance } from '../types'

/**
 * Namespace implementation for hierarchical cache organization
 */
export class CacheNamespaceImpl<T = unknown> implements CacheNamespace<T> {
  private cache: CacheInstance<T>
  private _name: string
  private parentPath: string

  constructor(cache: CacheInstance<T>, name: string, parentPath: string = '') {
    this.cache = cache
    this._name = name
    this.parentPath = parentPath
  }

  /**
   * Gets the namespace name
   */
  get name(): string {
    return this._name
  }

  /**
   * Gets the full namespace path
   */
  get fullPath(): string {
    return this.parentPath ? `${this.parentPath}:${this._name}` : this._name
  }

  /**
   * Prefixes a key with the namespace path
   */
  private prefixKey(key: string): string {
    return `${this.fullPath}:${key}`
  }

  /**
   * Gets a value from the namespace
   */
  get(key: string): T | undefined
  get(key: string, defaultValue: T): T
  get(key: string, defaultValue?: T): T | undefined {
    const result = this.cache.get(this.prefixKey(key))
    return result !== undefined ? result : defaultValue
  }

  /**
   * Sets a value in the namespace
   */
  set(key: string, value: T, options?: SetOptions): void {
    this.cache.set(this.prefixKey(key), value, {
      ...options,
      metadata: {
        ...options?.metadata,
        namespace: this.fullPath,
      },
    })
  }

  /**
   * Checks if a key exists in the namespace
   */
  has(key: string): boolean {
    return this.cache.has(this.prefixKey(key))
  }

  /**
   * Deletes a key from the namespace
   */
  delete(key: string): boolean {
    return this.cache.delete(this.prefixKey(key))
  }

  /**
   * Clears all entries in this namespace
   */
  clear(): void {
    const prefix = `${this.fullPath}:`
    const keysToDelete = this.cache.keys().filter((key) => key.startsWith(prefix))
    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Gets all keys in this namespace (without prefix)
   */
  keys(): string[] {
    const prefix = `${this.fullPath}:`
    return this.cache
      .keys()
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
  }

  /**
   * Gets all values in this namespace
   */
  values(): T[] {
    const prefix = `${this.fullPath}:`
    return this.cache
      .entries()
      .filter(([key]) => key.startsWith(prefix))
      .map(([_, value]) => value)
  }

  /**
   * Gets all entries in this namespace
   */
  entries(): [string, T][] {
    const prefix = `${this.fullPath}:`
    return this.cache
      .entries()
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value] as [string, T])
  }

  /**
   * Gets the number of entries in this namespace
   */
  get size(): number {
    return this.keys().length
  }

  /**
   * Creates a nested namespace
   */
  namespace(name: string): CacheNamespace<T> {
    return new CacheNamespaceImpl(this.cache, name, this.fullPath)
  }

  /**
   * Gets statistics for this namespace
   */
  getStats(): CacheStats {
    // Get overall stats and filter for this namespace
    const stats = this.cache.getStats()
    const namespaceSize = this.size

    return {
      ...stats,
      size: namespaceSize,
      namespaces: stats.namespaces.filter((ns) => ns.startsWith(this.fullPath)),
    }
  }
}

/**
 * Creates a namespace instance
 */
export function createNamespace<T>(
  cache: CacheInstance<T>,
  name: string,
  parentPath?: string
): CacheNamespace<T> {
  return new CacheNamespaceImpl(cache, name, parentPath)
}
