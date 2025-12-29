import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCache } from '../../../src/core/cache'
import type { CacheInstance } from '../../../src/types'

describe('Namespace', () => {
  let cache: CacheInstance<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = createCache<string>()
  })

  afterEach(() => {
    cache.destroy()
    vi.useRealTimers()
  })

  describe('Basic Operations', () => {
    it('should create a namespace', () => {
      const userNs = cache.namespace('user')
      expect(userNs.name).toBe('user')
      expect(userNs.fullPath).toBe('user')
    })

    it('should set and get values in namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')

      expect(userNs.get('1')).toBe('Alice')
      expect(userNs.get('2')).toBe('Bob')
    })

    it('should isolate namespaces', () => {
      const userNs = cache.namespace('user')
      const productNs = cache.namespace('product')

      userNs.set('1', 'Alice')
      productNs.set('1', 'Widget')

      expect(userNs.get('1')).toBe('Alice')
      expect(productNs.get('1')).toBe('Widget')
    })

    it('should check key existence in namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')

      expect(userNs.has('1')).toBe(true)
      expect(userNs.has('2')).toBe(false)
    })

    it('should delete from namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')

      expect(userNs.delete('1')).toBe(true)
      expect(userNs.has('1')).toBe(false)
      expect(userNs.has('2')).toBe(true)
    })

    it('should clear namespace only', () => {
      const userNs = cache.namespace('user')
      const productNs = cache.namespace('product')

      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')
      productNs.set('1', 'Widget')

      userNs.clear()

      expect(userNs.size).toBe(0)
      expect(productNs.get('1')).toBe('Widget')
    })

    it('should return default value when key is missing', () => {
      const userNs = cache.namespace('user')
      expect(userNs.get('nonexistent', 'default')).toBe('default')
    })
  })

  describe('Nested Namespaces', () => {
    it('should create nested namespaces', () => {
      const userNs = cache.namespace('user')
      const adminNs = userNs.namespace('admin')

      expect(adminNs.name).toBe('admin')
      expect(adminNs.fullPath).toBe('user:admin')
    })

    it('should set and get values in nested namespace', () => {
      const adminNs = cache.namespace('user').namespace('admin')
      adminNs.set('1', 'SuperAdmin')

      expect(adminNs.get('1')).toBe('SuperAdmin')
    })

    it('should isolate nested namespaces', () => {
      const userNs = cache.namespace('user')
      const adminNs = userNs.namespace('admin')

      userNs.set('1', 'Regular User')
      adminNs.set('1', 'Admin User')

      expect(userNs.get('1')).toBe('Regular User')
      expect(adminNs.get('1')).toBe('Admin User')
    })

    it('should support deeply nested namespaces', () => {
      const deepNs = cache
        .namespace('level1')
        .namespace('level2')
        .namespace('level3')

      expect(deepNs.fullPath).toBe('level1:level2:level3')

      deepNs.set('key', 'deep value')
      expect(deepNs.get('key')).toBe('deep value')
    })
  })

  describe('Queries', () => {
    it('should return keys in namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')

      const keys = userNs.keys()
      expect(keys).toContain('1')
      expect(keys).toContain('2')
      expect(keys.length).toBe(2)
    })

    it('should return values in namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')

      const values = userNs.values()
      expect(values).toContain('Alice')
      expect(values).toContain('Bob')
    })

    it('should return entries in namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')

      const entries = userNs.entries()
      expect(entries).toContainEqual(['1', 'Alice'])
      expect(entries).toContainEqual(['2', 'Bob'])
    })

    it('should return size of namespace', () => {
      const userNs = cache.namespace('user')
      expect(userNs.size).toBe(0)

      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')
      expect(userNs.size).toBe(2)
    })
  })

  describe('Main Cache Namespace Methods', () => {
    it('should get namespace instance', () => {
      cache.namespace('user') // Create namespace
      const ns = cache.getNamespace('user')
      expect(ns).toBeDefined()
    })

    it('should clear namespace from main cache', () => {
      cache.set('user:1', 'Alice')
      cache.set('user:2', 'Bob')
      cache.set('product:1', 'Widget')

      const cleared = cache.clearNamespace('user')
      expect(cleared).toBe(2)
      expect(cache.has('user:1')).toBe(false)
      expect(cache.has('product:1')).toBe(true)
    })

    it('should list all namespaces', () => {
      cache.set('user:1', 'Alice')
      cache.set('product:1', 'Widget')
      cache.set('category:1', 'Electronics')

      const namespaces = cache.listNamespaces()
      expect(namespaces).toContain('user')
      expect(namespaces).toContain('product')
      expect(namespaces).toContain('category')
    })
  })

  describe('Stats', () => {
    it('should return stats for namespace', () => {
      const userNs = cache.namespace('user')
      userNs.set('1', 'Alice')
      userNs.set('2', 'Bob')

      const stats = userNs.getStats()
      expect(stats.size).toBe(2)
    })
  })
})
