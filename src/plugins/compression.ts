import type { CachePlugin, SetOptions } from '../types'

/**
 * Compression plugin options
 */
export interface CompressionPluginOptions {
  /**
   * Minimum size in bytes before compression is applied
   * Default: 1024 (1KB)
   */
  threshold?: number

  /**
   * Compression algorithm to use
   * 'lz' uses LZ-based compression (built-in)
   */
  algorithm?: 'lz'
}

// Simple LZ-based compression implementation
// This is a basic implementation for demonstration - in production you might want to use a library
const COMPRESSION_MARKER = '\u0000LZ\u0000'

/**
 * Simple LZ compression (Run-Length Encoding variant)
 */
function compress(input: string): string {
  if (input.length < 100) return input // Don't compress small strings

  let output = ''
  let i = 0

  while (i < input.length) {
    const char = input[i]!
    let count = 1

    while (i + count < input.length && input[i + count] === char && count < 255) {
      count++
    }

    if (count > 3) {
      output += `\u0001${String.fromCharCode(count)}${char}`
    } else {
      output += char.repeat(count)
    }

    i += count
  }

  // Only use compressed version if it's actually smaller
  if (output.length < input.length) {
    return COMPRESSION_MARKER + output
  }
  return input
}

/**
 * Simple LZ decompression
 */
function decompress(input: string): string {
  if (!input.startsWith(COMPRESSION_MARKER)) {
    return input
  }

  const compressed = input.slice(COMPRESSION_MARKER.length)
  let output = ''
  let i = 0

  while (i < compressed.length) {
    if (compressed[i] === '\u0001') {
      const count = compressed.charCodeAt(i + 1)
      const char = compressed[i + 2] ?? ''
      output += char.repeat(count)
      i += 3
    } else {
      output += compressed[i]
      i++
    }
  }

  return output
}

/**
 * Creates a compression plugin for reducing cache storage size
 */
export function compressionPlugin<T = unknown>(
  options: CompressionPluginOptions = {}
): CachePlugin<T> {
  const threshold = options.threshold ?? 1024

  return {
    name: 'compression',

    beforeSet(
      _key: string,
      value: T,
      setOptions?: SetOptions
    ): { value: T; options?: SetOptions } | void {
      // Only compress string values that exceed threshold
      if (typeof value === 'string' && value.length >= threshold) {
        const compressed = compress(value)
        return { value: compressed as unknown as T, options: setOptions }
      }
      return undefined
    },

    afterGet(_key: string, value: T | undefined): T | undefined {
      if (typeof value === 'string' && value.startsWith(COMPRESSION_MARKER)) {
        return decompress(value) as unknown as T
      }
      return value
    },

    beforeSerialize(value: T): T {
      if (typeof value === 'string' && value.length >= threshold) {
        return compress(value) as unknown as T
      }
      return value
    },

    afterDeserialize(value: T): T {
      if (typeof value === 'string' && value.startsWith(COMPRESSION_MARKER)) {
        return decompress(value) as unknown as T
      }
      return value
    },
  }
}
