# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-29

### Added

- Initial release of CacheKeeper
- Core cache functionality with full TypeScript support
- Multiple eviction strategies:
  - LRU (Least Recently Used)
  - LFU (Least Frequently Used)
  - FIFO (First In First Out)
  - TTL (Time To Live only)
  - SWR (Stale-While-Revalidate)
  - Custom strategy support
- Storage adapters:
  - Memory storage (default)
  - localStorage adapter
  - sessionStorage adapter
  - IndexedDB adapter
  - Custom adapter interface
- TTL and expiration:
  - Per-entry TTL configuration
  - Automatic expiration checking
  - Manual expiration (touch, expire)
  - Sliding expiration support
- Namespace system:
  - Hierarchical namespaces
  - Namespace isolation
  - Nested namespace support
- Tag system:
  - Tag-based entry grouping
  - Tag-based invalidation
  - Multiple tag support
- Memoization:
  - getOrSet for lazy computation
  - Function memoization wrapper
  - Custom key generators
  - Async function support
- Batch operations:
  - getMany
  - setMany
  - deleteMany
  - hasMany
  - getOrSetMany
- Event system:
  - hit, miss, set, delete events
  - expire, evict, clear, prune events
  - Subscribe/unsubscribe support
- Statistics:
  - Hit/miss counting
  - Hit rate calculation
  - Memory usage tracking
  - Uptime tracking
- Plugins:
  - Plugin lifecycle hooks
  - Compression plugin
  - Logging plugin
  - Encryption plugin
  - Tiered cache plugin
- React adapter:
  - CacheProvider component
  - useCache hook
  - useCachedValue hook
  - useCachedQuery hook
  - useCacheInvalidation hook
  - useCacheStats hook
  - withCache HOC
- Serialization:
  - dump() for state export
  - restore() for state import
  - Custom serializer support
- Zero runtime dependencies
- Full TypeScript support with strict mode
- Comprehensive test suite
