import { describe, it, expect } from 'vitest'
import {
  defaultSerializer,
  serializeEntry,
  deserializeEntry,
  createSerializer,
  safeSerialize,
  safeDeserialize,
} from '../../../src/utils/serialize'
import type { CacheEntry } from '../../../src/types'

describe('Serialization Utils', () => {
  describe('defaultSerializer', () => {
    it('should serialize primitive values', () => {
      expect(defaultSerializer.serialize('hello')).toBe('"hello"')
      expect(defaultSerializer.serialize(42)).toBe('42')
      expect(defaultSerializer.serialize(true)).toBe('true')
      expect(defaultSerializer.serialize(null)).toBe('null')
    })

    it('should serialize objects', () => {
      const obj = { name: 'John', age: 30 }
      expect(defaultSerializer.serialize(obj)).toBe('{"name":"John","age":30}')
    })

    it('should serialize arrays', () => {
      const arr = [1, 2, 3]
      expect(defaultSerializer.serialize(arr)).toBe('[1,2,3]')
    })

    it('should deserialize primitive values', () => {
      expect(defaultSerializer.deserialize('"hello"')).toBe('hello')
      expect(defaultSerializer.deserialize('42')).toBe(42)
      expect(defaultSerializer.deserialize('true')).toBe(true)
      expect(defaultSerializer.deserialize('null')).toBe(null)
    })

    it('should deserialize objects', () => {
      const result = defaultSerializer.deserialize('{"name":"John","age":30}')
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should deserialize arrays', () => {
      const result = defaultSerializer.deserialize('[1,2,3]')
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('serializeEntry', () => {
    it('should serialize a cache entry', () => {
      const entry: CacheEntry<{ name: string }> = {
        key: 'user:1',
        value: { name: 'John' },
        createdAt: 1000,
        updatedAt: 1000,
        accessedAt: 1000,
        accessCount: 0,
        size: 100,
        tags: ['user'],
      }

      const serialized = serializeEntry(entry, defaultSerializer)
      const parsed = JSON.parse(serialized)

      expect(parsed.key).toBe('user:1')
      expect(parsed.value).toBe('{"name":"John"}')
      expect(parsed.tags).toEqual(['user'])
    })
  })

  describe('deserializeEntry', () => {
    it('should deserialize a cache entry', () => {
      const serializedEntry = JSON.stringify({
        key: 'user:1',
        value: '{"name":"John"}',
        createdAt: 1000,
        updatedAt: 1000,
        accessedAt: 1000,
        accessCount: 0,
        size: 100,
        tags: ['user'],
      })

      const entry = deserializeEntry<{ name: string }>(serializedEntry, defaultSerializer)

      expect(entry.key).toBe('user:1')
      expect(entry.value).toEqual({ name: 'John' })
      expect(entry.tags).toEqual(['user'])
    })
  })

  describe('createSerializer', () => {
    it('should create a custom serializer', () => {
      const numberSerializer = createSerializer<number>(
        (value) => value.toString(),
        (data) => parseInt(data, 10)
      )

      expect(numberSerializer.serialize(42)).toBe('42')
      expect(numberSerializer.deserialize('42')).toBe(42)
    })

    it('should create a serializer for complex types', () => {
      interface User {
        id: number
        name: string
      }

      const userSerializer = createSerializer<User>(
        (user) => `${user.id}:${user.name}`,
        (data) => {
          const [id, name] = data.split(':')
          return { id: parseInt(id, 10), name }
        }
      )

      expect(userSerializer.serialize({ id: 1, name: 'John' })).toBe('1:John')
      expect(userSerializer.deserialize('1:John')).toEqual({ id: 1, name: 'John' })
    })
  })

  describe('safeSerialize', () => {
    it('should serialize valid values', () => {
      const result = safeSerialize({ name: 'John' }, defaultSerializer)
      expect(result).toBe('{"name":"John"}')
    })

    it('should return null for circular references', () => {
      const circular: Record<string, unknown> = { name: 'John' }
      circular.self = circular

      const result = safeSerialize(circular, defaultSerializer)
      expect(result).toBe(null)
    })

    it('should return null when serialization throws', () => {
      const badSerializer = createSerializer<unknown>(
        () => {
          throw new Error('Serialization error')
        },
        (data) => JSON.parse(data)
      )

      const result = safeSerialize({ name: 'John' }, badSerializer)
      expect(result).toBe(null)
    })
  })

  describe('safeDeserialize', () => {
    it('should deserialize valid data', () => {
      const result = safeDeserialize('{"name":"John"}', defaultSerializer)
      expect(result).toEqual({ name: 'John' })
    })

    it('should return null for invalid JSON', () => {
      const result = safeDeserialize('not valid json', defaultSerializer)
      expect(result).toBe(null)
    })

    it('should return null when deserialization throws', () => {
      const badSerializer = createSerializer<unknown>(
        (value) => JSON.stringify(value),
        () => {
          throw new Error('Deserialization error')
        }
      )

      const result = safeDeserialize('{"name":"John"}', badSerializer)
      expect(result).toBe(null)
    })
  })
})
