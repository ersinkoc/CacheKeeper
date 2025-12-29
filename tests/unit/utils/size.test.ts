import { describe, it, expect } from 'vitest'
import { estimateSize, formatBytes } from '../../../src/utils/size'

describe('Size Utilities', () => {
  describe('estimateSize', () => {
    it('should return 0 for null', () => {
      expect(estimateSize(null)).toBe(0)
    })

    it('should return 0 for undefined', () => {
      expect(estimateSize(undefined)).toBe(0)
    })

    it('should return 4 for booleans', () => {
      expect(estimateSize(true)).toBe(4)
      expect(estimateSize(false)).toBe(4)
    })

    it('should return 8 for numbers', () => {
      expect(estimateSize(42)).toBe(8)
      expect(estimateSize(3.14159)).toBe(8)
    })

    it('should estimate string size (2 bytes per char)', () => {
      expect(estimateSize('hello')).toBe(10) // 5 chars * 2
      expect(estimateSize('')).toBe(0)
    })

    it('should estimate BigInt size', () => {
      const bigInt = BigInt('12345678901234567890')
      const size = estimateSize(bigInt)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate Symbol size', () => {
      const sym = Symbol('test')
      const size = estimateSize(sym)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate Symbol without description', () => {
      const sym = Symbol()
      const size = estimateSize(sym)
      expect(size).toBe(8)
    })

    it('should return 32 for functions', () => {
      const fn = () => {}
      expect(estimateSize(fn)).toBe(32)
    })

    it('should estimate array size', () => {
      const arr = [1, 2, 3]
      const size = estimateSize(arr)
      expect(size).toBe(8 + 8 * 3) // overhead + 3 numbers
    })

    it('should estimate nested array size', () => {
      const arr = [[1, 2], [3, 4]]
      const size = estimateSize(arr)
      expect(size).toBeGreaterThan(0)
    })

    it('should estimate Date size', () => {
      const date = new Date()
      expect(estimateSize(date)).toBe(8)
    })

    it('should estimate RegExp size', () => {
      const regex = /test/gi
      const size = estimateSize(regex)
      expect(size).toBe('test'.length * 2 + 16)
    })

    it('should estimate Map size', () => {
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ])
      const size = estimateSize(map)
      expect(size).toBeGreaterThan(16) // at least overhead
    })

    it('should estimate Set size', () => {
      const set = new Set([1, 2, 3])
      const size = estimateSize(set)
      expect(size).toBe(16 + 8 * 3) // overhead + 3 numbers
    })

    it('should estimate ArrayBuffer size', () => {
      const buffer = new ArrayBuffer(100)
      expect(estimateSize(buffer)).toBe(100)
    })

    it('should estimate TypedArray size', () => {
      const typedArray = new Uint8Array(100)
      expect(estimateSize(typedArray)).toBe(100)
    })

    it('should estimate WeakMap size', () => {
      const weakMap = new WeakMap()
      expect(estimateSize(weakMap)).toBe(16)
    })

    it('should estimate WeakSet size', () => {
      const weakSet = new WeakSet()
      expect(estimateSize(weakSet)).toBe(16)
    })

    it('should estimate Error size', () => {
      const error = new Error('Test error')
      const size = estimateSize(error)
      expect(size).toBeGreaterThan(32)
    })

    it('should estimate plain object size', () => {
      const obj = { name: 'test', value: 42 }
      const size = estimateSize(obj)
      expect(size).toBeGreaterThan(0)
    })

    it('should handle nested objects', () => {
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

    it('should handle circular references', () => {
      const obj: { self?: unknown } = {}
      obj.self = obj

      // Should not throw
      const size = estimateSize(obj)
      expect(size).toBeGreaterThan(0)
    })
  })

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(2048)).toBe('2 KB')
    })

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
    })

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should format terabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB')
    })

    it('should format with decimal places', () => {
      expect(formatBytes(1536)).toBe('1.5 KB')
    })
  })
})
