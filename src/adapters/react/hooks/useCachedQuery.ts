import { useState, useEffect, useCallback, useRef } from 'react'
import { useCache } from './useCache'
import type { UseCachedQueryOptions, UseCachedQueryResult } from '../../../types'

/**
 * Hook for SWR-like data fetching with automatic revalidation
 *
 * @example
 * ```tsx
 * function Products() {
 *   const {
 *     data: products,
 *     error,
 *     isLoading,
 *     isValidating,
 *     mutate,
 *   } = useCachedQuery<Product[]>('products', fetchProducts, {
 *     ttl: 300000,                    // 5 min cache
 *     staleTime: 60000,               // Fresh for 1 min
 *     revalidateOnFocus: true,        // Refetch on window focus
 *     revalidateOnReconnect: true,    // Refetch on network reconnect
 *     revalidateInterval: 30000,      // Poll every 30s
 *   })
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <div>
 *       {isValidating && <Badge>Updating...</Badge>}
 *       <ProductList products={products} />
 *       <button onClick={() => mutate()}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  options: UseCachedQueryOptions<T> = {}
): UseCachedQueryResult<T> {
  const cache = useCache<T>()
  const {
    ttl,
    staleTime,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    revalidateInterval,
    dedupingInterval = 2000,
    onSuccess,
    onError,
  } = options

  const [state, setState] = useState<{
    data: T | undefined
    error: Error | null
    isLoading: boolean
    isValidating: boolean
  }>(() => ({
    data: cache.get(key),
    error: null,
    isLoading: !cache.has(key),
    isValidating: false,
  }))

  const mountedRef = useRef(true)
  const lastFetchRef = useRef(0)
  const fetchingRef = useRef(false)

  const revalidate = useCallback(async () => {
    const now = Date.now()

    // Deduping: don't fetch if we just fetched
    if (now - lastFetchRef.current < dedupingInterval) {
      return
    }

    // Don't fetch if already fetching
    if (fetchingRef.current) {
      return
    }

    fetchingRef.current = true
    lastFetchRef.current = now

    setState((s) => ({
      ...s,
      isLoading: s.data === undefined,
      isValidating: true,
    }))

    try {
      const result = await Promise.resolve(fetcher())

      if (!mountedRef.current) return

      cache.set(key, result, {
        ttl,
        stale: staleTime,
      })

      setState({
        data: result,
        error: null,
        isLoading: false,
        isValidating: false,
      })

      onSuccess?.(result)
    } catch (err) {
      if (!mountedRef.current) return

      const error = err instanceof Error ? err : new Error(String(err))

      setState((s) => ({
        ...s,
        error,
        isLoading: false,
        isValidating: false,
      }))

      onError?.(error)
    } finally {
      fetchingRef.current = false
    }
  }, [cache, key, fetcher, ttl, staleTime, dedupingInterval, onSuccess, onError])

  const mutate = useCallback(
    async (
      data?: T | Promise<T> | ((current: T | undefined) => T)
    ): Promise<void> => {
      if (data === undefined) {
        // Just revalidate
        await revalidate()
        return
      }

      // Handle function
      if (typeof data === 'function') {
        const fn = data as (current: T | undefined) => T
        const current = cache.get(key)
        const newData = fn(current)
        cache.set(key, newData, { ttl, stale: staleTime })
        setState((s) => ({ ...s, data: newData }))
        return
      }

      // Handle promise
      if (data instanceof Promise) {
        const resolved = await data
        cache.set(key, resolved, { ttl, stale: staleTime })
        setState((s) => ({ ...s, data: resolved }))
        return
      }

      // Handle direct value
      cache.set(key, data, { ttl, stale: staleTime })
      setState((s) => ({ ...s, data }))
    },
    [cache, key, ttl, staleTime, revalidate]
  )

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const cached = cache.get(key)

    if (cached !== undefined) {
      setState((s) => ({
        ...s,
        data: cached,
        isLoading: false,
      }))

      // Revalidate if stale
      if (cache.isStale(key)) {
        revalidate().catch(() => {
          // Error handled in revalidate
        })
      }
    } else {
      revalidate().catch(() => {
        // Error handled in revalidate
      })
    }
  }, [key, cache, revalidate])

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return

    const handleFocus = () => {
      if (cache.isStale(key) || !cache.has(key)) {
        revalidate().catch(() => {
          // Ignore
        })
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
    return undefined
  }, [revalidateOnFocus, cache, key, revalidate])

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return

    const handleOnline = () => {
      revalidate().catch(() => {
        // Ignore
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      return () => window.removeEventListener('online', handleOnline)
    }
    return undefined
  }, [revalidateOnReconnect, revalidate])

  // Revalidate interval
  useEffect(() => {
    if (!revalidateInterval) return

    const interval = setInterval(() => {
      revalidate().catch(() => {
        // Ignore
      })
    }, revalidateInterval)

    return () => clearInterval(interval)
  }, [revalidateInterval, revalidate])

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    mutate,
  }
}
