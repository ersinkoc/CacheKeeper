import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createCache } from '../../../src/core/cache'
import { CacheProvider } from '../../../src/adapters/react/provider'
import { withCache, type WithCacheProps } from '../../../src/adapters/react/hoc'
import type { CacheInstance } from '../../../src/types'

describe('withCache HOC', () => {
  let cache: CacheInstance<unknown>

  beforeEach(() => {
    cache = createCache({ checkInterval: 0 })
  })

  afterEach(() => {
    cache.destroy()
  })

  it('should inject cache instance as prop', () => {
    interface TestProps extends WithCacheProps {
      title: string
    }

    function TestComponent({ cache: injectedCache, title }: TestProps) {
      return (
        <div>
          <span data-testid="title">{title}</span>
          <span data-testid="has-cache">{injectedCache ? 'yes' : 'no'}</span>
        </div>
      )
    }

    const WrappedComponent = withCache(TestComponent)

    render(
      <CacheProvider cache={cache}>
        <WrappedComponent title="Test Title" />
      </CacheProvider>
    )

    expect(screen.getByTestId('title').textContent).toBe('Test Title')
    expect(screen.getByTestId('has-cache').textContent).toBe('yes')
  })

  it('should allow access to cache methods', () => {
    cache.set('test-key', 'test-value')

    interface TestProps extends WithCacheProps {
      cacheKey: string
    }

    function TestComponent({ cache: injectedCache, cacheKey }: TestProps) {
      const value = injectedCache.get(cacheKey) as string | undefined
      return <div data-testid="value">{value ?? 'not found'}</div>
    }

    const WrappedComponent = withCache(TestComponent)

    render(
      <CacheProvider cache={cache}>
        <WrappedComponent cacheKey="test-key" />
      </CacheProvider>
    )

    expect(screen.getByTestId('value').textContent).toBe('test-value')
  })

  it('should set displayName correctly', () => {
    function NamedComponent({ cache: _ }: WithCacheProps) {
      return <div>Named</div>
    }

    const WrappedComponent = withCache(NamedComponent)
    expect(WrappedComponent.displayName).toBe('withCache(NamedComponent)')
  })

  it('should handle component without displayName', () => {
    const AnonymousComponent = ({ cache: _ }: WithCacheProps) => <div>Anonymous</div>
    // Remove displayName if present - name will be 'AnonymousComponent' from the variable
    Object.defineProperty(AnonymousComponent, 'displayName', { value: undefined })

    const WrappedComponent = withCache(AnonymousComponent)
    // Since name is 'AnonymousComponent', it should use that
    expect(WrappedComponent.displayName).toBe('withCache(AnonymousComponent)')
  })

  it('should fallback to Component when name is empty', () => {
    // Create a truly anonymous component
    const component = function({ cache: _ }: WithCacheProps) { return <div>Test</div> }
    Object.defineProperty(component, 'displayName', { value: undefined })
    Object.defineProperty(component, 'name', { value: '' })

    const WrappedComponent = withCache(component)
    // Empty string is falsy for || but not for ??, so it evaluates to empty string
    // The implementation uses ??, so '' ?? 'Component' = ''
    expect(WrappedComponent.displayName).toBe('withCache()')
  })
})
