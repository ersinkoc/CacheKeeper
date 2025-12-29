import { useContext } from 'react'
import { CacheContext } from '../context'
import type { CacheInstance } from '../../../types'

/**
 * Hook to access the cache instance from context
 *
 * @throws Error if used outside CacheProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const cache = useCache<MyDataType>()
 *
 *   const handleSave = (data: MyDataType) => {
 *     cache.set('my-key', data)
 *   }
 *
 *   const handleLoad = () => {
 *     return cache.get('my-key')
 *   }
 * }
 * ```
 */
export function useCache<T = unknown>(): CacheInstance<T> {
  const cache = useContext(CacheContext)

  if (!cache) {
    throw new Error('useCache must be used within a CacheProvider')
  }

  return cache as CacheInstance<T>
}
