import type { CacheEvent, CacheEventMap, Unsubscribe } from '../types'

/**
 * Type-safe event emitter for cache events
 */
export class EventEmitter<T = unknown> {
  private listeners = new Map<CacheEvent, Set<(payload: unknown) => void>>()

  /**
   * Subscribe to an event
   */
  on<E extends CacheEvent>(
    event: E,
    handler: (payload: CacheEventMap<T>[E]) => void
  ): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const handlers = this.listeners.get(event)!
    handlers.add(handler as (payload: unknown) => void)

    return () => this.off(event, handler)
  }

  /**
   * Unsubscribe from an event
   */
  off<E extends CacheEvent>(
    event: E,
    handler: (payload: CacheEventMap<T>[E]) => void
  ): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler as (payload: unknown) => void)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Subscribe to an event once
   */
  once<E extends CacheEvent>(
    event: E,
    handler: (payload: CacheEventMap<T>[E]) => void
  ): void {
    const wrapper = (payload: CacheEventMap<T>[E]) => {
      this.off(event, wrapper)
      handler(payload)
    }
    this.on(event, wrapper)
  }

  /**
   * Emit an event to all listeners
   */
  emit<E extends CacheEvent>(event: E, payload: CacheEventMap<T>[E]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error)
        }
      })
    }
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners(event?: CacheEvent): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: CacheEvent): number {
    return this.listeners.get(event)?.size ?? 0
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners(event: CacheEvent): boolean {
    return this.listenerCount(event) > 0
  }

  /**
   * Get all events that have listeners
   */
  eventNames(): CacheEvent[] {
    return Array.from(this.listeners.keys())
  }
}

/**
 * Creates a new event emitter instance
 */
export function createEventEmitter<T = unknown>(): EventEmitter<T> {
  return new EventEmitter<T>()
}
