// Main factory function
export { createCache } from './core/cache'

// Types
export type {
  // Strategy types
  CacheStrategy,
  CustomStrategy,
  EvictionContext,

  // Entry types
  CacheEntry,

  // Config types
  CacheConfig,
  StorageType,
  StorageAdapter,
  Serializer,
  SetOptions,
  GetOrSetOptions,

  // Event types
  HitEvent,
  MissEvent,
  SetEvent,
  DeleteEvent,
  DeleteReason,
  ExpireEvent,
  EvictEvent,
  ClearEvent,
  PruneEvent,
  CacheEvent,
  CacheEventHandler,
  CacheEventMap,

  // Stats types
  CacheStats,

  // Namespace types
  CacheNamespace,

  // Plugin types
  CachePlugin,

  // Helper types
  MemoizeOptions,
  BatchSetEntry,
  CacheDump,
  Unsubscribe,

  // Instance type
  CacheInstance,
} from './types'

// Utilities (optional exports for advanced usage)
export { estimateSize, formatBytes } from './utils/size'
export { now, isExpired, getRemainingTTL, getExpirationDate } from './utils/time'
