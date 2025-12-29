import type { ComponentType } from 'react'
import { useCache } from './hooks/useCache'
import type { CacheInstance } from '../../types'

/**
 * Props injected by withCache HOC
 */
export interface WithCacheProps<T = unknown> {
  cache: CacheInstance<T>
}

/**
 * Higher-order component that injects cache instance as a prop
 *
 * @example
 * ```tsx
 * interface MyComponentProps extends WithCacheProps {
 *   title: string
 * }
 *
 * function MyComponent({ cache, title }: MyComponentProps) {
 *   const data = cache.get('my-key')
 *   return <div>{title}: {data}</div>
 * }
 *
 * export default withCache(MyComponent)
 * ```
 */
export function withCache<P extends WithCacheProps<T>, T = unknown>(
  WrappedComponent: ComponentType<P>
): ComponentType<Omit<P, keyof WithCacheProps<T>>> {
  function WithCacheWrapper(props: Omit<P, keyof WithCacheProps<T>>) {
    const cache = useCache<T>()
    return <WrappedComponent {...(props as P)} cache={cache} />
  }

  WithCacheWrapper.displayName = `withCache(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return WithCacheWrapper
}
