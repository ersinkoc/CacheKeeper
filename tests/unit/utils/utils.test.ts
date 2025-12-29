import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { estimateSize, formatBytes } from '../../../src/utils/size'
import {
  now,
  isExpired,
  isStaleTime,
  calculateExpiresAt,
  getRemainingTTL,
  getExpirationDate,
} from '../../../src/utils/time'
import {
  isValidKey,
  normalizeKey,
  prefixKey,
  unprefixKey,
  keyBelongsToNamespace,
  extractNamespace,
  generateKeyFromArgs,
} from '../../../src/utils/key'

describe('Utils', () => {
  describe('Size Estimation', () => {
    it('should estimate string size', () => {
      expect(estimateSize('hello')).toBe(10) // 5 chars * 2 bytes
    })

    it('should estimate number size', () => {
      expect(estimateSize(42)).toBe(8)
      expect(estimateSize(3.14)).toBe(8)
    })

    it('should estimate boolean size', () => {
      expect(estimateSize(true)).toBe(4)
      expect(estimateSize(false)).toBe(4)
    })

    it('should estimate null/undefined as 0', () => {
      expect(estimateSize(null)).toBe(0)
      expect(estimateSize(undefined)).toBe(0)
    })

    it('should estimate array size', () => {
      const arr = [1, 2, 3]
      const size = estimateSize(arr)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate object size', () => {
      const obj = { name: 'test', value: 123 }
      const size = estimateSize(obj)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate nested object size', () => {
      const obj = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      }
      const size = estimateSize(obj)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate Map size', () => {
      const map = new Map([['key', 'value']])
      const size = estimateSize(map)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate Set size', () => {
      const set = new Set([1, 2, 3])
      const size = estimateSize(set)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate Date size', () => {
      expect(estimateSize(new Date())).toBe(8)
    })
  })

  describe('Format Bytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(100)).toBe('100 B')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })
  })

  describe('Time Utilities', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return current timestamp', () => {
      const timestamp = now()
      expect(typeof timestamp).toBe('number')
    })

    it('should check if expired', () => {
      const currentTime = now()
      expect(isExpired(currentTime - 1000)).toBe(true)
      expect(isExpired(currentTime + 1000)).toBe(false)
      expect(isExpired(undefined)).toBe(false)
    })

    it('should check if stale', () => {
      const currentTime = now()
      expect(isStaleTime(currentTime - 1000)).toBe(true)
      expect(isStaleTime(currentTime + 1000)).toBe(false)
      expect(isStaleTime(undefined)).toBe(false)
    })

    it('should calculate expiration timestamp', () => {
      const expiresAt = calculateExpiresAt(1000)
      expect(expiresAt).toBe(now() + 1000)
      expect(calculateExpiresAt(undefined)).toBeUndefined()
      expect(calculateExpiresAt(0)).toBeUndefined()
      expect(calculateExpiresAt(-1)).toBeUndefined()
    })

    it('should get remaining TTL', () => {
      const expiresAt = now() + 5000
      const remaining = getRemainingTTL(expiresAt)
      expect(remaining).toBe(5000)

      expect(getRemainingTTL(undefined)).toBeUndefined()
      expect(getRemainingTTL(now() - 1000)).toBe(0)
    })

    it('should get expiration date', () => {
      const expiresAt = now() + 60000
      const date = getExpirationDate(expiresAt)
      expect(date).toBeInstanceOf(Date)
      expect(getExpirationDate(undefined)).toBeNull()
    })
  })

  describe('Key Utilities', () => {
    it('should validate keys', () => {
      expect(isValidKey('valid')).toBe(true)
      expect(isValidKey('')).toBe(false)
      expect(isValidKey(null)).toBe(false)
      expect(isValidKey(undefined)).toBe(false)
      expect(isValidKey(123)).toBe(false)
    })

    it('should normalize keys', () => {
      expect(normalizeKey('  key  ')).toBe('key')
      expect(normalizeKey('key')).toBe('key')
    })

    it('should prefix keys', () => {
      expect(prefixKey('user', 'id')).toBe('user:id')
      expect(prefixKey('', 'id')).toBe('id')
    })

    it('should unprefix keys', () => {
      expect(unprefixKey('user', 'user:id')).toBe('id')
      expect(unprefixKey('user', 'id')).toBe('id')
      expect(unprefixKey('', 'id')).toBe('id')
    })

    it('should check namespace membership', () => {
      expect(keyBelongsToNamespace('user:123', 'user')).toBe(true)
      expect(keyBelongsToNamespace('product:123', 'user')).toBe(false)
      expect(keyBelongsToNamespace('user', 'user')).toBe(false)
    })

    it('should extract namespace', () => {
      expect(extractNamespace('user:123')).toBe('user')
      expect(extractNamespace('user:admin:123')).toBe('user')
      expect(extractNamespace('nonamespace')).toBeUndefined()
    })

    it('should generate key from args', () => {
      expect(generateKeyFromArgs(['a', 'b', 'c'])).toBe('a:b:c')
      expect(generateKeyFromArgs([1, 2, 3])).toBe('1:2:3')
      expect(generateKeyFromArgs([null, undefined])).toBe('null:undefined')
      expect(generateKeyFromArgs([{ key: 'value' }])).toBe('{"key":"value"}')
    })
  })
})
