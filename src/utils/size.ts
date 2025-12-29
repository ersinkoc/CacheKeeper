/**
 * Estimates the memory size of a value in bytes
 */
export function estimateSize(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }

  const type = typeof value

  switch (type) {
    case 'boolean':
      return 4

    case 'number':
      return 8

    case 'string':
      // UTF-16: 2 bytes per character
      return (value as string).length * 2

    case 'bigint':
      // Rough estimate for BigInt
      return (value as bigint).toString().length * 2 + 8

    case 'symbol':
      // Symbol description + overhead
      return ((value as symbol).description?.length ?? 0) * 2 + 8

    case 'function':
      // Function overhead
      return 32

    case 'object':
      return estimateObjectSize(value as object)

    default:
      return 0
  }
}

/**
 * Estimates size of an object
 */
function estimateObjectSize(obj: object): number {
  // Handle null explicitly
  if (obj === null) {
    return 0
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    let size = 8 // Array overhead
    for (const item of obj) {
      size += estimateSize(item)
    }
    return size
  }

  // Handle Date
  if (obj instanceof Date) {
    return 8
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return obj.source.length * 2 + 16
  }

  // Handle Map
  if (obj instanceof Map) {
    let size = 16 // Map overhead
    obj.forEach((v, k) => {
      size += estimateSize(k) + estimateSize(v)
    })
    return size
  }

  // Handle Set
  if (obj instanceof Set) {
    let size = 16 // Set overhead
    obj.forEach((v) => {
      size += estimateSize(v)
    })
    return size
  }

  // Handle ArrayBuffer and TypedArrays
  if (obj instanceof ArrayBuffer) {
    return obj.byteLength
  }

  if (ArrayBuffer.isView(obj)) {
    return (obj as ArrayBufferView).byteLength
  }

  // Handle WeakMap/WeakSet - can't iterate, just return overhead
  if (obj instanceof WeakMap || obj instanceof WeakSet) {
    return 16
  }

  // Handle Error
  if (obj instanceof Error) {
    return (obj.message?.length ?? 0) * 2 + (obj.stack?.length ?? 0) * 2 + 32
  }

  // Handle plain objects
  let size = 8 // Object overhead
  const seen = new WeakSet()

  function calculateSize(o: object): number {
    if (seen.has(o)) {
      return 0 // Circular reference
    }
    seen.add(o)

    let objectSize = 0

    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        // Key size (string)
        objectSize += key.length * 2

        // Value size
        const val = (o as Record<string, unknown>)[key]
        if (val !== null && typeof val === 'object') {
          objectSize += calculateSize(val as object)
        } else {
          objectSize += estimateSize(val)
        }
      }
    }

    return objectSize
  }

  size += calculateSize(obj)
  return size
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const index = Math.min(i, units.length - 1)
  const unit = units[index]

  if (unit === undefined) return `${bytes} B`

  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${unit}`
}
