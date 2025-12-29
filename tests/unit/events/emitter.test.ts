import { describe, it, expect, vi } from 'vitest'
import { EventEmitter, createEventEmitter } from '../../../src/events/emitter'

describe('EventEmitter', () => {
  it('should add and call event listeners', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.on('hit', handler)
    emitter.emit('hit', { key: 'test', value: 'value', entry: {} as never })

    expect(handler).toHaveBeenCalled()
  })

  it('should remove event listeners with off', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.on('hit', handler)
    emitter.off('hit', handler)
    emitter.emit('hit', { key: 'test', value: 'value', entry: {} as never })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should return unsubscribe function from on', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    const unsubscribe = emitter.on('hit', handler)
    unsubscribe()
    emitter.emit('hit', { key: 'test', value: 'value', entry: {} as never })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle once listeners', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.once('hit', handler)
    emitter.emit('hit', { key: 'test1', value: 'value', entry: {} as never })
    emitter.emit('hit', { key: 'test2', value: 'value', entry: {} as never })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should handle errors in event handlers gracefully', () => {
    const emitter = new EventEmitter()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    emitter.on('hit', () => {
      throw new Error('Handler error')
    })

    // Should not throw
    expect(() => {
      emitter.emit('hit', { key: 'test', value: 'value', entry: {} as never })
    }).not.toThrow()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('should remove all listeners for specific event', () => {
    const emitter = new EventEmitter()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('hit', handler1)
    emitter.on('miss', handler2)
    emitter.removeAllListeners('hit')

    emitter.emit('hit', { key: 'test', value: 'value', entry: {} as never })
    emitter.emit('miss', { key: 'test' })

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalled()
  })

  it('should remove all listeners when no event specified', () => {
    const emitter = new EventEmitter()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('hit', handler1)
    emitter.on('miss', handler2)
    emitter.removeAllListeners()

    emitter.emit('hit', { key: 'test', value: 'value', entry: {} as never })
    emitter.emit('miss', { key: 'test' })

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should return listener count', () => {
    const emitter = new EventEmitter()

    expect(emitter.listenerCount('hit')).toBe(0)

    emitter.on('hit', () => {})
    expect(emitter.listenerCount('hit')).toBe(1)

    emitter.on('hit', () => {})
    expect(emitter.listenerCount('hit')).toBe(2)
  })

  it('should check if event has listeners', () => {
    const emitter = new EventEmitter()

    expect(emitter.hasListeners('hit')).toBe(false)

    emitter.on('hit', () => {})
    expect(emitter.hasListeners('hit')).toBe(true)
  })

  it('should return event names', () => {
    const emitter = new EventEmitter()

    emitter.on('hit', () => {})
    emitter.on('miss', () => {})

    const names = emitter.eventNames()
    expect(names).toContain('hit')
    expect(names).toContain('miss')
  })

  it('should handle off for non-existent event', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    // Should not throw
    expect(() => {
      emitter.off('hit', handler)
    }).not.toThrow()
  })

  it('should clean up empty listener sets', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.on('hit', handler)
    expect(emitter.listenerCount('hit')).toBe(1)

    emitter.off('hit', handler)
    expect(emitter.listenerCount('hit')).toBe(0)
  })

  describe('createEventEmitter factory', () => {
    it('should create a new EventEmitter instance', () => {
      const emitter = createEventEmitter()
      expect(emitter).toBeInstanceOf(EventEmitter)
    })
  })
})
