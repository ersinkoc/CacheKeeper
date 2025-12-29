import { useCallback } from 'react'
import { useCache } from './useCache'
import type { UseCacheInvalidationResult } from '../../../types'

/**
 * Hook for cache invalidation utilities
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { invalidate, invalidateByTag, clear } = useCacheInvalidation()
 *
 *   return (
 *     <div>
 *       <button onClick={() => invalidate('user:1')}>
 *         Invalidate User 1
 *       </button>
 *
 *       <button onClick={() => invalidateByTag('products')}>
 *         Invalidate All Products
 *       </button>
 *
 *       <button onClick={() => clear()}>
 *         Clear All Cache
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCacheInvalidation(): UseCacheInvalidationResult {
  const cache = useCache()

  const invalidate = useCallback(
    (key: string) => {
      cache.delete(key)
    },
    [cache]
  )

  const invalidateByTag = useCallback(
    (tag: string | string[]): number => {
      if (Array.isArray(tag)) {
        return cache.invalidateByTag(tag)
      }
      return cache.invalidateByTag(tag)
    },
    [cache]
  )

  const clear = useCallback(() => {
    cache.clear()
  }, [cache])

  return {
    invalidate,
    invalidateByTag,
    clear,
  }
}
