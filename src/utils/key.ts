/**
 * Validates a cache key
 */
export function isValidKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0
}

/**
 * Normalizes a cache key (trims whitespace)
 */
export function normalizeKey(key: string): string {
  return key.trim()
}

/**
 * Creates a prefixed key for namespaces
 */
export function prefixKey(prefix: string, key: string): string {
  return prefix ? `${prefix}:${key}` : key
}

/**
 * Removes prefix from a key
 */
export function unprefixKey(prefix: string, key: string): string {
  if (!prefix) return key
  const fullPrefix = `${prefix}:`
  return key.startsWith(fullPrefix) ? key.slice(fullPrefix.length) : key
}

/**
 * Checks if a key belongs to a namespace
 */
export function keyBelongsToNamespace(key: string, namespace: string): boolean {
  return key.startsWith(`${namespace}:`)
}

/**
 * Extracts namespace from a key
 */
export function extractNamespace(key: string): string | undefined {
  const colonIndex = key.indexOf(':')
  return colonIndex > 0 ? key.slice(0, colonIndex) : undefined
}

/**
 * Generates a unique key from arguments
 */
export function generateKeyFromArgs(args: unknown[]): string {
  // Handle empty args - use a default key
  if (args.length === 0) {
    return '__memoize_no_args__'
  }

  return args
    .map((arg) => {
      if (arg === null) return 'null'
      if (arg === undefined) return 'undefined'

      const type = typeof arg

      if (type === 'string' || type === 'number' || type === 'boolean') {
        return String(arg)
      }

      if (type === 'object') {
        try {
          return JSON.stringify(arg)
        } catch {
          return '[object]'
        }
      }

      return String(arg)
    })
    .join(':')
}
