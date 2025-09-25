/**
 * Test Setup Configuration
 * Global test setup and utilities
 */

import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Global test setup
beforeAll(() => {
  // Mock environment variables for tests
  process.env.NODE_ENV = 'test'
  process.env.TELEMETRY_ENABLED = 'false'
  process.env.DEBUG_MODE = 'true'
  process.env.MOCK_AI_RESPONSES = 'true'
  
  // Mock console methods in CI
  if (process.env.CI) {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  }
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Global mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock as any

// Mock fetch
global.fetch = vi.fn()

// Custom matchers
expect.extend({
  toBeValidTelemetryEvent(received) {
    const { isNot } = this
    const pass = received && 
                 typeof received.name === 'string' &&
                 typeof received.timestamp === 'number' &&
                 received.properties &&
                 typeof received.properties === 'object'

    return {
      pass,
      message: () => 
        `${received} ${isNot ? 'is' : 'is not'} a valid telemetry event`
    }
  },
  
  toHaveValidContextPack(received) {
    const { isNot } = this
    const pass = received &&
                 typeof received.hash === 'string' &&
                 typeof received.createdAt === 'number' &&
                 Array.isArray(received.symbols) &&
                 Array.isArray(received.recentEdits) &&
                 received.focusWindow &&
                 typeof received.focusWindow.content === 'string'

    return {
      pass,
      message: () =>
        `${received} ${isNot ? 'has' : 'does not have'} a valid context pack structure`
    }
  }
})

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidTelemetryEvent(): T
    toHaveValidContextPack(): T
  }
  interface AsymmetricMatchersContaining {
    toBeValidTelemetryEvent(): any
    toHaveValidContextPack(): any
  }
}
