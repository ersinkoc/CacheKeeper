import { createContext } from 'react'
import type { CacheInstance } from '../../types'

/**
 * React context for cache instance
 */
export const CacheContext = createContext<CacheInstance<unknown> | null>(null)

CacheContext.displayName = 'CacheContext'
