// Context
export { CacheContext } from './context'

// Provider
export { CacheProvider, type CacheProviderProps } from './provider'

// Hooks
export {
  useCache,
  useCachedValue,
  useCachedQuery,
  useCacheInvalidation,
  useCacheStats,
} from './hooks'

// HOC
export { withCache, type WithCacheProps } from './hoc'

// Re-export types
export type {
  UseCachedValueOptions,
  UseCachedValueResult,
  UseCachedQueryOptions,
  UseCachedQueryResult,
  UseCacheInvalidationResult,
  UseCacheStatsOptions,
} from '../../types'
