import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCache } from '../../../src/core/cache'
import { compressionPlugin } from '../../../src/plugins/compression'
import { loggingPlugin } from '../../../src/plugins/logging'
import { encryptionPlugin } from '../../../src/plugins/encryption'

describe('Plugins', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Compression Plugin', () => {
    it('should compress large strings', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin({ threshold: 50 })],
      })

      const largeString = 'a'.repeat(100)
      cache.set('key1', largeString)

      // The stored value should be compressed, but when we get it back it should be decompressed
      expect(cache.get('key1')).toBe(largeString)

      cache.destroy()
    })

    it('should not compress small strings', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin({ threshold: 100 })],
      })

      cache.set('key1', 'small')
      expect(cache.get('key1')).toBe('small')

      cache.destroy()
    })

    it('should handle repeated patterns well', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin({ threshold: 10 })],
      })

      const repeatedPattern = 'abcabc'.repeat(50)
      cache.set('key1', repeatedPattern)

      expect(cache.get('key1')).toBe(repeatedPattern)

      cache.destroy()
    })

    it('should use default threshold if not specified', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin()],
      })

      // String under default threshold (1024) should not be compressed
      cache.set('key1', 'small string')
      expect(cache.get('key1')).toBe('small string')

      cache.destroy()
    })

    it('should handle beforeSerialize and afterDeserialize', () => {
      const plugin = compressionPlugin<string>({ threshold: 10 })

      // Test beforeSerialize with large string
      const largeString = 'a'.repeat(100)
      const serialized = plugin.beforeSerialize?.(largeString)
      expect(serialized).toBeDefined()

      // Test beforeSerialize with small string
      const smallString = 'small'
      const notSerialized = plugin.beforeSerialize?.(smallString)
      expect(notSerialized).toBe(smallString)

      // Test afterDeserialize
      if (serialized && typeof serialized === 'string' && serialized.startsWith('\u0000LZ\u0000')) {
        const deserialized = plugin.afterDeserialize?.(serialized)
        expect(deserialized).toBe(largeString)
      }

      // Test afterDeserialize with non-compressed value
      const normal = plugin.afterDeserialize?.('normal value')
      expect(normal).toBe('normal value')
    })

    it('should not compress if result is not smaller', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin({ threshold: 10 })],
      })

      // Random string that likely won't compress well
      const randomString = 'abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()'.repeat(3)
      cache.set('key1', randomString)
      expect(cache.get('key1')).toBe(randomString)

      cache.destroy()
    })

    it('should handle non-string values', () => {
      const cache = createCache<number>({
        plugins: [compressionPlugin({ threshold: 10 })],
      })

      cache.set('key1', 12345)
      expect(cache.get('key1')).toBe(12345)

      cache.destroy()
    })
  })

  describe('Logging Plugin', () => {
    it('should log cache operations', () => {
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const cache = createCache<string>({
        plugins: [
          loggingPlugin({
            logger: mockLogger,
            level: 'debug',
          }),
        ],
      })

      cache.set('key1', 'value1')
      cache.get('key1')
      cache.delete('key1')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cache initialized'),
        expect.anything()
      )
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('SET'),
        expect.anything()
      )
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('GET'),
      )

      cache.destroy()
    })

    it('should respect log level', () => {
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const cache = createCache<string>({
        plugins: [
          loggingPlugin({
            logger: mockLogger,
            level: 'warn', // Only warn and error
          }),
        ],
      })

      cache.set('key1', 'value1')
      cache.get('key1')

      // Debug and info should not be called
      expect(mockLogger.debug).not.toHaveBeenCalled()

      cache.destroy()
    })

    it('should use custom prefix', () => {
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const cache = createCache<string>({
        plugins: [
          loggingPlugin({
            logger: mockLogger,
            level: 'info',
            prefix: '[MyCache]',
          }),
        ],
      })

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[MyCache]'),
        expect.anything()
      )

      cache.destroy()
    })
  })

  describe('Encryption Plugin', () => {
    it('should encrypt and decrypt string values', () => {
      const cache = createCache<string>({
        plugins: [
          encryptionPlugin({
            key: 'my-secret-key-32-chars-long!!',
          }),
        ],
      })

      cache.set('key1', 'secret message')
      expect(cache.get('key1')).toBe('secret message')

      cache.destroy()
    })

    it('should encrypt and decrypt object values', () => {
      const cache = createCache({
        plugins: [
          encryptionPlugin({
            key: 'my-secret-key-32-chars-long!!',
          }),
        ],
      })

      const data = { username: 'admin', password: 'secret123' }
      cache.set('key1', data)

      expect(cache.get('key1')).toEqual(data)

      cache.destroy()
    })

    it('should throw if key is too short', () => {
      expect(() => {
        createCache({
          plugins: [
            encryptionPlugin({
              key: 'short',
            }),
          ],
        })
      }).toThrow('Encryption key must be at least 8 characters')
    })

    it('should throw if key is empty', () => {
      expect(() => {
        createCache({
          plugins: [
            encryptionPlugin({
              key: '',
            }),
          ],
        })
      }).toThrow('Encryption key must be at least 8 characters')
    })

    it('should handle non-encrypted values in afterGet', () => {
      const plugin = encryptionPlugin<string>({ key: 'my-secret-key-32' })

      // Non-string value should be returned as-is
      const nonString = plugin.afterGet?.('key', 123 as unknown as string)
      expect(nonString).toBe(123)

      // String without encryption marker should be returned as-is
      const plainString = plugin.afterGet?.('key', 'plain text')
      expect(plainString).toBe('plain text')

      // Undefined value should be returned as-is
      const undef = plugin.afterGet?.('key', undefined)
      expect(undef).toBeUndefined()
    })

    it('should handle beforeSerialize and afterDeserialize', () => {
      const plugin = encryptionPlugin<string>({ key: 'my-secret-key-32' })

      // Test beforeSerialize with string
      const serialized = plugin.beforeSerialize?.('secret message')
      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe('string')
      expect((serialized as string).startsWith('\u0000ENC\u0000')).toBe(true)

      // Test beforeSerialize with non-string value
      const nonStringSerialized = plugin.beforeSerialize?.(12345 as unknown as string)
      expect(nonStringSerialized).toBe(12345)

      // Test afterDeserialize with encrypted value
      if (serialized && typeof serialized === 'string') {
        const deserialized = plugin.afterDeserialize?.(serialized)
        expect(deserialized).toBe('secret message')
      }

      // Test afterDeserialize with non-encrypted value
      const plainDeserialized = plugin.afterDeserialize?.('plain text')
      expect(plainDeserialized).toBe('plain text')
    })

    it('should handle circular reference in JSON during encryption', () => {
      const plugin = encryptionPlugin({ key: 'my-secret-key-32' })

      // Create an object that can't be serialized
      const circularObj: { self?: unknown } = {}
      circularObj.self = circularObj

      // Should return undefined when serialization fails
      const result = plugin.beforeSet?.('key', circularObj as unknown)
      expect(result).toBeUndefined()
    })

    it('should handle decryption returning non-JSON string', () => {
      const plugin = encryptionPlugin<string>({ key: 'my-secret-key-32' })

      // Encrypt a plain string (not JSON)
      const result = plugin.beforeSet?.('key', 'plain string')
      expect(result).toBeDefined()

      // After get should return the decrypted string
      if (result) {
        const decrypted = plugin.afterGet?.('key', result.value)
        expect(decrypted).toBe('plain string')
      }
    })
  })

  describe('Encryption edge cases', () => {
    it('should handle afterDeserialize with non-JSON value', () => {
      const plugin = encryptionPlugin<string>({ key: 'my-secret-key-32' })

      // Encrypt a plain string
      const encrypted = plugin.beforeSerialize?.('plain string')

      // afterDeserialize should return the decrypted string even if not JSON
      if (typeof encrypted === 'string') {
        const result = plugin.afterDeserialize?.(encrypted)
        expect(result).toBe('plain string')
      }
    })

    it('should handle afterDeserialize with non-encrypted string', () => {
      const plugin = encryptionPlugin<string>({ key: 'my-secret-key-32' })

      const result = plugin.afterDeserialize?.('normal string' as unknown as string)
      expect(result).toBe('normal string')
    })

    it('should handle afterDeserialize with JSON value', () => {
      const plugin = encryptionPlugin({ key: 'my-secret-key-32' })

      // Encrypt an object (will be JSON serialized)
      const obj = { foo: 'bar', num: 123 }
      const setResult = plugin.beforeSet?.('key', obj)

      if (setResult?.value && typeof setResult.value === 'string') {
        // afterDeserialize should parse JSON
        const result = plugin.afterDeserialize?.(setResult.value)
        expect(result).toEqual(obj)
      }
    })
  })

  describe('Compression edge cases', () => {
    it('should handle decompress with run-length encoded data', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin({ threshold: 50 })],
      })

      // Create a string with repeating characters that will use run-length encoding
      const repeatingString = 'a'.repeat(50) + 'b'.repeat(50) + 'c'.repeat(50)
      cache.set('key1', repeatingString)

      expect(cache.get('key1')).toBe(repeatingString)
      cache.destroy()
    })

    it('should handle decompress with mixed content', () => {
      const cache = createCache<string>({
        plugins: [compressionPlugin({ threshold: 50 })],
      })

      // Mix of repeating and non-repeating characters
      const mixedString = 'aaaa' + 'xyz' + 'bbbb'.repeat(20) + 'pqr' + 'cccc'.repeat(10)
      cache.set('key1', mixedString)

      expect(cache.get('key1')).toBe(mixedString)
      cache.destroy()
    })

    it('should return original value in afterDeserialize for non-compressed', () => {
      const plugin = compressionPlugin<string>({ threshold: 10 })

      const result = plugin.afterDeserialize?.('normal string')
      expect(result).toBe('normal string')
    })

    it('should return original value in afterGet for non-string', () => {
      const plugin = compressionPlugin<number>({ threshold: 10 })

      const result = plugin.afterGet?.('key', 12345)
      expect(result).toBe(12345)
    })

    it('should return original value in afterGet for non-compressed string', () => {
      const plugin = compressionPlugin<string>({ threshold: 10 })

      const result = plugin.afterGet?.('key', 'not compressed')
      expect(result).toBe('not compressed')
    })

    it('should return undefined from beforeSet for non-string below threshold', () => {
      const plugin = compressionPlugin<string>({ threshold: 100 })

      const result = plugin.beforeSet?.('key', 'small')
      expect(result).toBeUndefined()
    })
  })

  describe('Plugin Lifecycle', () => {
    it('should call onInit when cache is created', () => {
      const onInit = vi.fn()

      const cache = createCache({
        plugins: [
          {
            name: 'test-plugin',
            onInit,
          },
        ],
      })

      expect(onInit).toHaveBeenCalledWith(cache)

      cache.destroy()
    })

    it('should call onDestroy when cache is destroyed', () => {
      const onDestroy = vi.fn()

      const cache = createCache({
        plugins: [
          {
            name: 'test-plugin',
            onDestroy,
          },
        ],
      })

      cache.destroy()

      expect(onDestroy).toHaveBeenCalled()
    })

    it('should call hooks in order', () => {
      const order: string[] = []

      const cache = createCache<string>({
        plugins: [
          {
            name: 'plugin1',
            beforeSet: () => {
              order.push('plugin1-beforeSet')
            },
            afterSet: () => {
              order.push('plugin1-afterSet')
            },
          },
          {
            name: 'plugin2',
            beforeSet: () => {
              order.push('plugin2-beforeSet')
            },
            afterSet: () => {
              order.push('plugin2-afterSet')
            },
          },
        ],
      })

      cache.set('key1', 'value1')

      expect(order).toEqual([
        'plugin1-beforeSet',
        'plugin2-beforeSet',
        'plugin1-afterSet',
        'plugin2-afterSet',
      ])

      cache.destroy()
    })

    it('should allow beforeDelete to prevent deletion', () => {
      const cache = createCache<string>({
        plugins: [
          {
            name: 'protection-plugin',
            beforeDelete: (key) => {
              return !key.startsWith('protected:')
            },
          },
        ],
      })

      cache.set('normal', 'value')
      cache.set('protected:key', 'value')

      expect(cache.delete('normal')).toBe(true)
      expect(cache.delete('protected:key')).toBe(false)
      expect(cache.has('protected:key')).toBe(true)

      cache.destroy()
    })

    it('should allow afterGet to transform values', () => {
      const cache = createCache<string>({
        plugins: [
          {
            name: 'transform-plugin',
            afterGet: (_key, value) => {
              return value ? value.toUpperCase() : value
            },
          },
        ],
      })

      cache.set('key1', 'hello')
      expect(cache.get('key1')).toBe('HELLO')

      cache.destroy()
    })
  })
})
