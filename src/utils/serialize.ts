import type { CacheEntry, Serializer } from '../types'

/**
 * Default JSON serializer
 */
export const defaultSerializer: Serializer<unknown> = {
  serialize: (value: unknown): string => JSON.stringify(value),
  deserialize: (data: string): unknown => JSON.parse(data) as unknown,
}

/**
 * Serializes a cache entry for storage
 */
export function serializeEntry<T>(entry: CacheEntry<T>, serializer: Serializer<T>): string {
  const serializedValue = serializer.serialize(entry.value)
  const entryData = {
    ...entry,
    value: serializedValue,
  }
  return JSON.stringify(entryData)
}

/**
 * Deserializes a cache entry from storage
 */
export function deserializeEntry<T>(data: string, serializer: Serializer<T>): CacheEntry<T> {
  const parsed = JSON.parse(data) as CacheEntry<string> & { value: string }
  const value = serializer.deserialize(parsed.value)
  return {
    ...parsed,
    value,
  }
}

/**
 * Creates a type-safe serializer wrapper
 */
export function createSerializer<T>(
  serialize: (value: T) => string,
  deserialize: (data: string) => T
): Serializer<T> {
  return { serialize, deserialize }
}

/**
 * Safely serializes a value, returning null on error
 */
export function safeSerialize<T>(value: T, serializer: Serializer<T>): string | null {
  try {
    return serializer.serialize(value)
  } catch {
    return null
  }
}

/**
 * Safely deserializes a value, returning null on error
 */
export function safeDeserialize<T>(data: string, serializer: Serializer<T>): T | null {
  try {
    return serializer.deserialize(data)
  } catch {
    return null
  }
}
