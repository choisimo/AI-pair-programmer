/**
 * Vitest Configuration
 * Implements TASK-038: 테스트 런너 구성 및 CI 통합
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // Higher thresholds for critical modules
        './src/lib/ai-engine/**': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        './src/lib/security/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/__tests__/**/*.{js,ts,tsx}'
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Watch mode
    watch: false,
    
    // Reporter configuration
    reporter: process.env.CI 
      ? ['verbose', 'junit', 'json']
      : ['verbose'],
    
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/test': resolve(__dirname, './src/test')
    }
  },
  
  // Define global constants for tests
  define: {
    __TEST__: true,
    __DEV__: true
  }
})
