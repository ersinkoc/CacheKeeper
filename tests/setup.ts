import 'fake-indexeddb/auto'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key]
    }),
    clear: vi.fn((): void => {
      store = {}
    }),
    key: vi.fn((index: number): string | null => Object.keys(store)[index] ?? null),
    get length(): number {
      return Object.keys(store).length
    },
  }
})()

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key]
    }),
    clear: vi.fn((): void => {
      store = {}
    }),
    key: vi.fn((index: number): string | null => Object.keys(store)[index] ?? null),
    get length(): number {
      return Object.keys(store).length
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear()
  sessionStorageMock.clear()
  vi.clearAllMocks()
})
