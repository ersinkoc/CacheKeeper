import type { CachePlugin, SetOptions } from '../types'

/**
 * Encryption plugin options
 */
export interface EncryptionPluginOptions {
  /**
   * Encryption key (must be 32 characters for AES-256)
   */
  key: string

  /**
   * Encryption algorithm
   * Default: 'aes-256-gcm' (simulated with XOR for browser compatibility)
   */
  algorithm?: 'aes-256-gcm'
}

const ENCRYPTION_MARKER = '\u0000ENC\u0000'

/**
 * Simple XOR encryption (for browser compatibility without Web Crypto complexity)
 * Note: This is a simplified implementation for demonstration.
 * For production use, consider using Web Crypto API or a proper encryption library.
 */
function xorEncrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const keyIndex = i % key.length
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(keyIndex)
    result += String.fromCharCode(charCode)
  }
  return result
}

function xorDecrypt(encrypted: string, key: string): string {
  // XOR encryption is symmetric
  return xorEncrypt(encrypted, key)
}

/**
 * Converts string to base64 for safe storage
 */
function toBase64(str: string): string {
  try {
    // Browser environment
    if (typeof btoa !== 'undefined') {
      return btoa(unescape(encodeURIComponent(str)))
    }
    // Node.js environment
    return Buffer.from(str, 'utf-8').toString('base64')
  } catch {
    return str
  }
}

/**
 * Converts base64 back to string
 */
function fromBase64(base64: string): string {
  try {
    // Browser environment
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(escape(atob(base64)))
    }
    // Node.js environment
    return Buffer.from(base64, 'base64').toString('utf-8')
  } catch {
    return base64
  }
}

/**
 * Encrypts a value
 */
function encrypt(value: string, key: string): string {
  const encrypted = xorEncrypt(value, key)
  const base64 = toBase64(encrypted)
  return ENCRYPTION_MARKER + base64
}

/**
 * Decrypts a value
 */
function decrypt(value: string, key: string): string {
  if (!value.startsWith(ENCRYPTION_MARKER)) {
    return value
  }

  const base64 = value.slice(ENCRYPTION_MARKER.length)
  const encrypted = fromBase64(base64)
  return xorDecrypt(encrypted, key)
}

/**
 * Creates an encryption plugin for securing cache values
 */
export function encryptionPlugin<T = unknown>(
  options: EncryptionPluginOptions
): CachePlugin<T> {
  const key = options.key

  if (!key || key.length < 8) {
    throw new Error('Encryption key must be at least 8 characters')
  }

  return {
    name: 'encryption',

    beforeSet(
      _key: string,
      value: T,
      setOptions?: SetOptions
    ): { value: T; options?: SetOptions } | void {
      if (typeof value === 'string') {
        const encrypted = encrypt(value, key)
        return { value: encrypted as unknown as T, options: setOptions }
      }
      // For non-string values, serialize then encrypt
      try {
        const serialized = JSON.stringify(value)
        const encrypted = encrypt(serialized, key)
        return { value: encrypted as unknown as T, options: setOptions }
      } catch {
        return undefined
      }
    },

    afterGet(_getKey: string, value: T | undefined): T | undefined {
      if (typeof value !== 'string') return value
      if (!value.startsWith(ENCRYPTION_MARKER)) return value

      const decrypted = decrypt(value, key)

      // Try to parse as JSON
      try {
        return JSON.parse(decrypted) as T
      } catch {
        return decrypted as unknown as T
      }
    },

    beforeSerialize(value: T): T {
      if (typeof value === 'string') {
        return encrypt(value, key) as unknown as T
      }
      return value
    },

    afterDeserialize(value: T): T {
      if (typeof value === 'string' && value.startsWith(ENCRYPTION_MARKER)) {
        const decrypted = decrypt(value, key)
        try {
          return JSON.parse(decrypted) as T
        } catch {
          return decrypted as unknown as T
        }
      }
      return value
    },
  }
}
