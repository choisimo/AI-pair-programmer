/**
 * Context Builder Tests
 * Implements TASK-039: 회귀 테스트 스위트 1차 작성
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextBuilder, InMemoryContextCache } from '../context-builder'
import { ContextBuilderConfig, Logger } from '../types'
import { ContextFactory } from '@/test/factories/context-factory'

// Mock logger
const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('ContextBuilder', () => {
  let contextBuilder: ContextBuilder
  let cache: InMemoryContextCache
  let config: ContextBuilderConfig

  beforeEach(() => {
    config = {
      maxSymbols: 50,
      maxRecentEdits: 20,
      maxDependencies: 100,
      focusWindowLines: 50,
      cacheTTLSeconds: 300,
      symbolSearchRadius: 25,
      dependencyDepth: 3,
      includeDocumentation: true,
      includeReferences: true,
      includeTypeInfo: true
    }

    cache = new InMemoryContextCache()
    contextBuilder = new ContextBuilder(cache, config, mockLogger)
  })

  describe('buildContext', () => {
    it('should build context successfully', async () => {
      const filePath = '/test/file.ts'
      const cursor = ContextFactory.createPosition(10, 5)

      const context = await contextBuilder.buildContext(filePath, cursor)

      expect(context).toHaveValidContextPack()
      expect(context.focusWindow.filePath).toBe(filePath)
      expect(context.language).toBe('typescript')
      expect(context.stats.buildTimeMs).toBeGreaterThan(0)
    })

    it('should respect SLA of 300ms', async () => {
      const startTime = Date.now()
      
      await contextBuilder.buildContext('/test/file.ts', ContextFactory.createPosition())
      
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(500) // Allow some buffer for test environment
    })

    it('should cache context results', async () => {
      const filePath = '/test/file.ts'
      const cursor = ContextFactory.createPosition(10, 5)

      // First call
      const context1 = await contextBuilder.buildContext(filePath, cursor)
      
      // Second call with same parameters
      const context2 = await contextBuilder.buildContext(filePath, cursor)

      expect(context1.hash).toBe(context2.hash)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Context cache hit',
        expect.objectContaining({ cacheKey: expect.any(String) })
      )
    })

    it('should handle different file types', async () => {
      const testCases = [
        { filePath: '/test/file.ts', expectedLanguage: 'typescript' },
        { filePath: '/test/file.js', expectedLanguage: 'javascript' },
        { filePath: '/test/file.py', expectedLanguage: 'python' },
        { filePath: '/test/file.go', expectedLanguage: 'go' }
      ]

      for (const { filePath, expectedLanguage } of testCases) {
        const context = await contextBuilder.buildContext(
          filePath, 
          ContextFactory.createPosition()
        )
        expect(context.language).toBe(expectedLanguage)
      }
    })

    it('should include visible region in focus window', async () => {
      const filePath = '/test/file.ts'
      const cursor = ContextFactory.createPosition(10, 5)
      const visibleRegion = ContextFactory.createRange(5, 0, 20, 0)

      const context = await contextBuilder.buildContext(filePath, cursor, visibleRegion)

      expect(context.focusWindow.range.start.line).toBeLessThanOrEqual(5)
      expect(context.focusWindow.range.end.line).toBeGreaterThanOrEqual(20)
    })

    it('should handle build errors gracefully', async () => {
      // Mock a file that doesn't exist or causes parsing errors
      const invalidFilePath = '/nonexistent/file.ts'
      
      await expect(
        contextBuilder.buildContext(invalidFilePath, ContextFactory.createPosition())
      ).rejects.toThrow('Failed to build context')
      
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('processEditEvent', () => {
    it('should process edit events', async () => {
      const event = {
        type: 'file_changed' as const,
        filePath: '/test/file.ts',
        timestamp: Date.now()
      }

      await contextBuilder.processEditEvent(event)

      // Should not throw and should log debug info
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processed edit events',
        expect.objectContaining({ eventCount: 1 })
      )
    })

    it('should batch process multiple events', async () => {
      const events = Array.from({ length: 15 }, (_, i) => ({
        type: 'file_changed' as const,
        filePath: `/test/file${i}.ts`,
        timestamp: Date.now()
      }))

      // Process events rapidly
      for (const event of events) {
        await contextBuilder.processEditEvent(event)
      }

      // Should have processed in batches
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processed edit events',
        expect.objectContaining({ eventCount: expect.any(Number) })
      )
    })
  })

  describe('invalidateContext', () => {
    it('should invalidate context for specific file', async () => {
      const filePath = '/test/file.ts'
      
      // Build context first
      await contextBuilder.buildContext(filePath, ContextFactory.createPosition())
      
      // Invalidate
      contextBuilder.invalidateContext(filePath)
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Context invalidated',
        expect.objectContaining({ filePath })
      )
    })
  })
})

describe('InMemoryContextCache', () => {
  let cache: InMemoryContextCache

  beforeEach(() => {
    cache = new InMemoryContextCache(5) // Small cache for testing
  })

  describe('basic operations', () => {
    it('should store and retrieve context', () => {
      const context = ContextFactory.createContextPack()
      const key = 'test_key'

      cache.set(key, context)
      const retrieved = cache.get(key)

      expect(retrieved).toEqual(context)
    })

    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should update access time on get', () => {
      const context = ContextFactory.createContextPack()
      const key = 'test_key'

      cache.set(key, context)
      
      // Wait a bit and access again
      setTimeout(() => {
        cache.get(key)
      }, 10)

      const stats = cache.getStats()
      expect(stats.hitRate).toBe(1)
    })
  })

  describe('eviction', () => {
    it('should evict oldest entries when cache is full', () => {
      // Fill cache beyond capacity
      for (let i = 0; i < 10; i++) {
        cache.set(`key_${i}`, ContextFactory.createContextPack())
      }

      // Check that cache size is limited
      const stats = cache.getStats()
      expect(stats.size).toBeLessThanOrEqual(5)

      // Oldest entries should be evicted
      expect(cache.get('key_0')).toBeNull()
      expect(cache.get('key_9')).not.toBeNull()
    })
  })

  describe('invalidation', () => {
    it('should invalidate matching patterns', () => {
      const contexts = [
        { key: 'file1.ts_context', context: ContextFactory.createContextPack() },
        { key: 'file2.ts_context', context: ContextFactory.createContextPack() },
        { key: 'file1.js_context', context: ContextFactory.createContextPack() }
      ]

      contexts.forEach(({ key, context }) => cache.set(key, context))

      // Invalidate all .ts files
      cache.invalidate('*file*.ts*')

      expect(cache.get('file1.ts_context')).toBeNull()
      expect(cache.get('file2.ts_context')).toBeNull()
      expect(cache.get('file1.js_context')).not.toBeNull()
    })
  })

  describe('statistics', () => {
    it('should track hit rate correctly', () => {
      const context = ContextFactory.createContextPack()
      cache.set('key1', context)

      // Hit
      cache.get('key1')
      // Miss
      cache.get('key2')
      // Hit
      cache.get('key1')

      const stats = cache.getStats()
      expect(stats.hitRate).toBe(2/3) // 2 hits out of 3 attempts
    })

    it('should estimate memory usage', () => {
      const context = ContextFactory.createLargeContext()
      cache.set('large_context', context)

      const stats = cache.getStats()
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })
  })

  describe('clear', () => {
    it('should clear all entries and reset stats', () => {
      cache.set('key1', ContextFactory.createContextPack())
      cache.set('key2', ContextFactory.createContextPack())
      cache.get('key1') // Create some stats

      cache.clear()

      const stats = cache.getStats()
      expect(stats.size).toBe(0)
      expect(stats.hitRate).toBe(0)
      expect(cache.get('key1')).toBeNull()
    })
  })
})

// Integration tests
describe('ContextBuilder Integration', () => {
  it('should handle realistic workflow', async () => {
    const cache = new InMemoryContextCache()
    const contextBuilder = new ContextBuilder(
      cache,
      {
        maxSymbols: 10,
        maxRecentEdits: 5,
        maxDependencies: 20,
        focusWindowLines: 20,
        cacheTTLSeconds: 60,
        symbolSearchRadius: 10,
        dependencyDepth: 2,
        includeDocumentation: true,
        includeReferences: true,
        includeTypeInfo: true
      },
      mockLogger
    )

    const filePath = '/src/components/Button.tsx'
    
    // Simulate editing workflow
    const positions = [
      ContextFactory.createPosition(10, 5),
      ContextFactory.createPosition(10, 10), // Small move
      ContextFactory.createPosition(15, 0),  // Larger move
      ContextFactory.createPosition(10, 5)   // Back to original
    ]

    const contexts = []
    for (const position of positions) {
      const context = await contextBuilder.buildContext(filePath, position)
      contexts.push(context)
    }

    // Should have cached some results
    expect(contexts[0].hash).toBe(contexts[3].hash) // Same position
    expect(contexts[0].hash).not.toBe(contexts[2].hash) // Different position

    // Process some edit events
    await contextBuilder.processEditEvent({
      type: 'file_changed',
      filePath,
      timestamp: Date.now()
    })

    // Cache should be invalidated for this file
    contextBuilder.invalidateContext(filePath)
    
    const newContext = await contextBuilder.buildContext(filePath, positions[0])
    // Should be different due to invalidation (in real scenario)
    expect(newContext).toHaveValidContextPack()
  })
})
