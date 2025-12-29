import type { CacheStrategy, CustomStrategy } from '../types'
import type { EvictionStrategy } from './types'
import { LRUStrategy, createLRUStrategy } from './lru'
import { LFUStrategy, createLFUStrategy } from './lfu'
import { FIFOStrategy, createFIFOStrategy } from './fifo'
import { TTLStrategy, createTTLStrategy } from './ttl'
import { SWRStrategy, createSWRStrategy, isEntryStale, isEntryFresh } from './swr'

export type { EvictionStrategy }

export {
  // LRU
  LRUStrategy,
  createLRUStrategy,
  // LFU
  LFUStrategy,
  createLFUStrategy,
  // FIFO
  FIFOStrategy,
  createFIFOStrategy,
  // TTL
  TTLStrategy,
  createTTLStrategy,
  // SWR
  SWRStrategy,
  createSWRStrategy,
  isEntryStale,
  isEntryFresh,
}

/**
 * Creates an eviction strategy based on type or custom strategy
 */
export function createStrategy<T = unknown>(
  strategy?: CacheStrategy | CustomStrategy<T>
): EvictionStrategy<T> {
  // Default to LRU
  if (!strategy) {
    return createLRUStrategy<T>()
  }

  // Handle custom strategy
  if (typeof strategy === 'object') {
    return {
      name: 'custom',
      shouldEvict: strategy.shouldEvict,
      onAccess: strategy.onAccess,
      onSet: strategy.onSet,
    }
  }

  // Handle built-in strategies
  switch (strategy) {
    case 'lru':
      return createLRUStrategy<T>()
    case 'lfu':
      return createLFUStrategy<T>()
    case 'fifo':
      return createFIFOStrategy<T>()
    case 'ttl':
      return createTTLStrategy<T>()
    case 'swr':
      return createSWRStrategy<T>()
    default:
      return createLRUStrategy<T>()
  }
}

/**
 * Gets the strategy name from a strategy type or custom strategy
 */
export function getStrategyName<T>(strategy?: CacheStrategy | CustomStrategy<T>): string {
  if (!strategy) {
    return 'lru'
  }

  if (typeof strategy === 'object') {
    return 'custom'
  }

  return strategy
}
