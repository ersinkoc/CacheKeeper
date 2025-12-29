import type { ReactNode } from 'react'
import { CacheContext } from './context'
import type { CacheInstance } from '../../types'

/**
 * Props for CacheProvider component
 */
export interface CacheProviderProps<T = unknown> {
  /**
   * Cache instance to provide
   */
  cache: CacheInstance<T>

  /**
   * Child components
   */
  children: ReactNode
}

/**
 * Provider component for cache context
 *
 * @example
 * ```tsx
 * const cache = createCache({ strategy: 'lru', maxSize: 1000 })
 *
 * function App() {
 *   return (
 *     <CacheProvider cache={cache}>
 *       <MyApp />
 *     </CacheProvider>
 *   )
 * }
 * ```
 */
export function CacheProvider<T = unknown>({
  cache,
  children,
}: CacheProviderProps<T>): JSX.Element {
  return (
    <CacheContext.Provider value={cache as CacheInstance<unknown>}>
      {children}
    </CacheContext.Provider>
  )
}
