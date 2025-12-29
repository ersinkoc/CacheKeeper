import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createCache } from '../../../src/core/cache'
import { CacheProvider } from '../../../src/adapters/react/provider'
import { useCache } from '../../../src/adapters/react/hooks/useCache'
import { useCachedValue } from '../../../src/adapters/react/hooks/useCachedValue'
import { useCachedQuery } from '../../../src/adapters/react/hooks/useCachedQuery'
import { useCacheInvalidation } from '../../../src/adapters/react/hooks/useCacheInvalidation'
import { useCacheStats } from '../../../src/adapters/react/hooks/useCacheStats'
import type { ReactNode } from 'react'
import type { CacheInstance } from '../../../src/types'

describe('React Hooks', () => {
  let cache: CacheInstance<unknown>

  beforeEach(() => {
    // Disable automatic expiration checking to avoid infinite loops with fake timers
    cache = createCache({ checkInterval: 0 })
  })

  afterEach(() => {
    cache.destroy()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <CacheProvider cache={cache}>{children}</CacheProvider>
  )

  describe('useCache', () => {
    it('should return cache instance', () => {
      const { result } = renderHook(() => useCache(), { wrapper })
      expect(result.current).toBe(cache)
    })

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useCache())
      }).toThrow('useCache must be used within a CacheProvider')
    })
  })

  describe('useCachedValue', () => {
    it('should return cached value', () => {
      cache.set('key1', 'cached value')

      const { result } = renderHook(() => useCachedValue<string>('key1'), {
        wrapper,
      })

      expect(result.current.data).toBe('cached value')
      expect(result.current.isCached).toBe(true)
    })

    it('should return undefined for missing key', () => {
      const { result } = renderHook(() => useCachedValue<string>('nonexistent'), {
        wrapper,
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.isCached).toBe(false)
    })

    it('should fetch and cache value when fetcher is provided', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched value')

      const { result } = renderHook(
        () =>
          useCachedValue<string>('key1', {
            fetcher,
          }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toBe('fetched value')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should not fetch when enabled is false', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched value')

      const { result } = renderHook(
        () =>
          useCachedValue<string>('key1', {
            fetcher,
            enabled: false,
          }),
        { wrapper }
      )

      expect(fetcher).not.toHaveBeenCalled()
      expect(result.current.data).toBeUndefined()
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const fetcher = vi.fn().mockResolvedValue('value')

      renderHook(
        () =>
          useCachedValue<string>('key1', {
            fetcher,
            onSuccess,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('value')
      })
    })

    it('should call onError callback on fetch failure', async () => {
      const onError = vi.fn()
      const error = new Error('Fetch failed')
      const fetcher = vi.fn().mockRejectedValue(error)

      renderHook(
        () =>
          useCachedValue<string>('key1', {
            fetcher,
            onError,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error)
      })
    })

    it('should refresh data when refresh is called', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second')

      const { result } = renderHook(
        () =>
          useCachedValue<string>('key1', {
            fetcher,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toBe('first')
      })

      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.data).toBe('second')
      })
    })

    it('should invalidate data', async () => {
      cache.set('key1', 'cached')

      const { result } = renderHook(() => useCachedValue<string>('key1'), {
        wrapper,
      })

      expect(result.current.data).toBe('cached')

      act(() => {
        result.current.invalidate()
      })

      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useCachedQuery', () => {
    it('should fetch data on mount', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched')

      const { result } = renderHook(
        () => useCachedQuery<string>('key1', fetcher),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toBe('fetched')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should return cached data and not refetch if fresh', async () => {
      cache.set('key1', 'cached', { stale: 60000 })
      const fetcher = vi.fn().mockResolvedValue('fetched')

      const { result } = renderHook(
        () => useCachedQuery<string>('key1', fetcher),
        { wrapper }
      )

      // Should immediately return cached data
      expect(result.current.data).toBe('cached')
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should mutate data optimistically', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched')

      const { result } = renderHook(
        () => useCachedQuery<string>('key1', fetcher),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toBe('fetched')
      })

      await act(async () => {
        await result.current.mutate('optimistic')
      })

      expect(result.current.data).toBe('optimistic')
    })

    it('should mutate with function', async () => {
      const fetcher = vi.fn().mockResolvedValue({ count: 1 })

      const { result } = renderHook(
        () => useCachedQuery<{ count: number }>('key1', fetcher),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data?.count).toBe(1)
      })

      await act(async () => {
        await result.current.mutate((current) => ({
          count: (current?.count ?? 0) + 1,
        }))
      })

      expect(result.current.data?.count).toBe(2)
    })

    it('should handle error in fetcher', async () => {
      const error = new Error('Fetch failed')
      const fetcher = vi.fn().mockRejectedValue(error)

      const { result } = renderHook(
        () => useCachedQuery<string>('error-key', fetcher),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const fetcher = vi.fn().mockResolvedValue('data')

      renderHook(
        () => useCachedQuery<string>('success-key', fetcher, { onSuccess }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('data')
      })
    })

    it('should call onError callback', async () => {
      const onError = vi.fn()
      const error = new Error('Failed')
      const fetcher = vi.fn().mockRejectedValue(error)

      renderHook(
        () => useCachedQuery<string>('error-key2', fetcher, { onError }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should mutate with undefined to revalidate', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second')

      const { result } = renderHook(
        () => useCachedQuery<string>('revalidate-key', fetcher),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toBe('first')
      })

      // Wait for deduping interval
      await act(async () => {
        await new Promise((r) => setTimeout(r, 2100))
      })

      await act(async () => {
        await result.current.mutate(undefined)
      })

      await waitFor(() => {
        expect(result.current.data).toBe('second')
      })
    })

    it('should mutate with promise', async () => {
      const fetcher = vi.fn().mockResolvedValue('initial')

      const { result } = renderHook(
        () => useCachedQuery<string>('promise-key', fetcher),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toBe('initial')
      })

      await act(async () => {
        await result.current.mutate(Promise.resolve('from-promise'))
      })

      expect(result.current.data).toBe('from-promise')
    })

    it('should handle non-Error rejections', async () => {
      const fetcher = vi.fn().mockRejectedValue('string error')

      const { result } = renderHook(
        () => useCachedQuery<string>('string-error-key', fetcher),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
        expect(result.current.error?.message).toBe('string error')
      })
    })

    it('should setup focus listener when revalidateOnFocus is true', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const fetcher = vi.fn().mockResolvedValue('data')

      const { unmount } = renderHook(
        () => useCachedQuery<string>('focus-key', fetcher, {
          revalidateOnFocus: true,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function))
      })

      unmount()
      addEventListenerSpy.mockRestore()
    })

    it('should setup online listener when revalidateOnReconnect is true', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const fetcher = vi.fn().mockResolvedValue('data')

      const { unmount } = renderHook(
        () => useCachedQuery<string>('online-key', fetcher, {
          revalidateOnReconnect: true,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      })

      unmount()
      addEventListenerSpy.mockRestore()
    })

    it('should dedupe rapid fetches', async () => {
      const fetcher = vi.fn().mockResolvedValue('data')

      const { result } = renderHook(
        () => useCachedQuery<string>('dedupe-key', fetcher, {
          dedupingInterval: 5000,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toBe('data')
      })

      const callCount = fetcher.mock.calls.length

      // Immediate mutate should be deduped
      await act(async () => {
        await result.current.mutate(undefined)
      })

      // Should not have made another fetch call due to deduping
      expect(fetcher.mock.calls.length).toBe(callCount)
    })

    it('should cleanup focus listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const fetcher = vi.fn().mockResolvedValue('data')

      const { unmount } = renderHook(
        () => useCachedQuery<string>('focus-cleanup-key', fetcher, {
          revalidateOnFocus: true,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled()
      })

      unmount()

      // Verify cleanup was called
      const focusCleanupCalls = removeEventListenerSpy.mock.calls.filter(
        call => call[0] === 'focus'
      )
      expect(focusCleanupCalls.length).toBeGreaterThan(0)

      removeEventListenerSpy.mockRestore()
    })

    it('should cleanup online listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const fetcher = vi.fn().mockResolvedValue('data')

      const { unmount } = renderHook(
        () => useCachedQuery<string>('online-cleanup-key', fetcher, {
          revalidateOnReconnect: true,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled()
      })

      unmount()

      // Verify cleanup was called
      const onlineCleanupCalls = removeEventListenerSpy.mock.calls.filter(
        call => call[0] === 'online'
      )
      expect(onlineCleanupCalls.length).toBeGreaterThan(0)

      removeEventListenerSpy.mockRestore()
    })

    it('should setup interval for revalidateInterval option', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      const fetcher = vi.fn().mockResolvedValue('data')

      const { unmount } = renderHook(
        () => useCachedQuery<string>('interval-setup-key', fetcher, {
          revalidateInterval: 5000,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled()
      })

      // Verify setInterval was called with correct interval
      expect(setIntervalSpy).toHaveBeenCalled()

      unmount()
      setIntervalSpy.mockRestore()
    })

    it('should clear interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const fetcher = vi.fn().mockResolvedValue('data')

      const { unmount } = renderHook(
        () => useCachedQuery<string>('interval-cleanup-key', fetcher, {
          revalidateInterval: 5000,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled()
      })

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })
  })

  describe('useCacheInvalidation', () => {
    it('should invalidate single key', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const { result } = renderHook(() => useCacheInvalidation(), { wrapper })

      act(() => {
        result.current.invalidate('key1')
      })

      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
    })

    it('should invalidate by tag', () => {
      cache.set('product:1', 'p1', { tags: ['products'] })
      cache.set('product:2', 'p2', { tags: ['products'] })
      cache.set('user:1', 'u1', { tags: ['users'] })

      const { result } = renderHook(() => useCacheInvalidation(), { wrapper })

      act(() => {
        result.current.invalidateByTag('products')
      })

      expect(cache.has('product:1')).toBe(false)
      expect(cache.has('product:2')).toBe(false)
      expect(cache.has('user:1')).toBe(true)
    })

    it('should clear all cache', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const { result } = renderHook(() => useCacheInvalidation(), { wrapper })

      act(() => {
        result.current.clear()
      })

      expect(cache.size).toBe(0)
    })
  })

  describe('useCacheStats', () => {
    it('should return cache stats', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.get('key1')

      const { result } = renderHook(() => useCacheStats(), { wrapper })

      expect(result.current.size).toBe(2)
      expect(result.current.hits).toBe(1)
    })

    it('should update stats periodically', async () => {
      vi.useFakeTimers()

      const { result } = renderHook(
        () => useCacheStats({ refreshInterval: 1000 }),
        { wrapper }
      )

      const initialSize = result.current.size

      act(() => {
        cache.set('new-key', 'new-value')
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.size).toBe(initialSize + 1)

      vi.useRealTimers()
    })
  })
})
