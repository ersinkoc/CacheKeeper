import { useState, useEffect, useCallback, useRef } from 'react'
import { useCache } from './useCache'
import type { UseCachedValueOptions, UseCachedValueResult } from '../../../types'

/**
 * Hook for caching a single value with optional fetcher
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const {
 *     data: user,
 *     isLoading,
 *     isCached,
 *     isStale,
 *     error,
 *     refresh,
 *   } = useCachedValue<User>(`user:${userId}`, {
 *     fetcher: () => fetchUser(userId),
 *     ttl: 60000,
 *     staleTime: 30000,
 *   })
 *
 *   if (isLoading && !isCached) {
 *     return <Spinner />
 *   }
 *
 *   if (error) {
 *     return <Error message={error.message} />
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{user?.name}</h1>
 *       {isStale && <Badge>Updating...</Badge>}
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCachedValue<T>(
  key: string,
  options: UseCachedValueOptions<T> = {}
): UseCachedValueResult<T> {
  const cache = useCache<T>()
  const { fetcher, ttl, staleTime, tags, enabled = true, onSuccess, onError } = options

  const [state, setState] = useState<{
    data: T | undefined
    isLoading: boolean
    isFetching: boolean
    error: Error | null
  }>(() => ({
    data: cache.get(key),
    isLoading: false,
    isFetching: false,
    error: null,
  }))

  const mountedRef = useRef(true)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!fetcher || fetchingRef.current) return

    fetchingRef.current = true

    setState((s) => ({
      ...s,
      isLoading: s.data === undefined,
      isFetching: true,
    }))

    try {
      const result = await Promise.resolve(fetcher())

      if (!mountedRef.current) return

      cache.set(key, result, {
        ttl,
        tags,
        stale: staleTime,
      })

      setState({
        data: result,
        isLoading: false,
        isFetching: false,
        error: null,
      })

      onSuccess?.(result)
    } catch (err) {
      if (!mountedRef.current) return

      const error = err instanceof Error ? err : new Error(String(err))

      setState((s) => ({
        ...s,
        isLoading: false,
        isFetching: false,
        error,
      }))

      onError?.(error)
    } finally {
      fetchingRef.current = false
    }
  }, [cache, key, fetcher, ttl, staleTime, tags, onSuccess, onError])

  const refresh = useCallback(async () => {
    if (!fetcher) return
    await fetchData()
  }, [fetchData, fetcher])

  const invalidate = useCallback(() => {
    cache.delete(key)
    setState((s) => ({ ...s, data: undefined }))
  }, [cache, key])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Check cache first
    const cached = cache.get(key)

    if (cached !== undefined) {
      setState((s) => ({ ...s, data: cached }))

      // If stale, fetch in background
      if (cache.isStale(key)) {
        fetchData().catch(() => {
          // Ignore background fetch errors
        })
      }
      return
    }

    // No cached data, fetch if fetcher is provided
    if (fetcher) {
      fetchData().catch(() => {
        // Error is handled in fetchData
      })
    }
  }, [key, enabled, cache, fetcher, fetchData])

  return {
    data: state.data,
    isLoading: state.isLoading,
    isCached: cache.has(key),
    isStale: cache.isStale(key),
    isFetching: state.isFetching,
    error: state.error,
    refresh,
    invalidate,
  }
}
