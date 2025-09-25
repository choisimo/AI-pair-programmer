/**
 * Suggestion Engine Tests
 * Implements TASK-039: 회귀 테스트 스위트 1차 작성
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SuggestionEngine } from '../suggestion-engine'
import { SuggestionEngineConfig, Logger, SuggestRequest, SuggestFeedback } from '../types'
import { ContextFactory } from '@/test/factories/context-factory'
import { createMockModelProvider, MockScenarios } from '@/test/mocks/model-provider.mock'

// Mock logger
const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('SuggestionEngine', () => {
  let suggestionEngine: SuggestionEngine
  let mockProvider: ReturnType<typeof createMockModelProvider>
  let config: SuggestionEngineConfig

  beforeEach(() => {
    config = {
      maxCandidates: 5,
      timeoutMs: 3000,
      enableStreaming: false,
      enableFiltering: true,
      enableRanking: true
    }

    mockProvider = createMockModelProvider()
    suggestionEngine = new SuggestionEngine(mockProvider, config, mockLogger)
  })

  describe('generateSuggestions', () => {
    it('should generate suggestions successfully', async () => {
      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(10, 5),
        capabilities: {
          stream: false,
          partialAccept: true
        },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.status).toBe('success')
      expect(response.candidates).toHaveLength(1)
      expect(response.candidates[0]).toMatchObject({
        id: expect.any(String),
        text: expect.any(String),
        confidence: expect.any(String),
        finalScore: expect.any(Number)
      })
      expect(response.latencyMs).toBeGreaterThan(0)
    })

    it('should handle multiple candidates', async () => {
      mockProvider.setMockResponse('default', {
        text: `Here are multiple suggestions:

\`\`\`typescript
function option1() {
  console.log('Option 1');
}
\`\`\`

\`\`\`typescript
function option2() {
  console.log('Option 2');
}
\`\`\`

\`\`\`typescript
function option3() {
  console.log('Option 3');
}
\`\`\``,
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 150 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(10, 5),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.candidates).toHaveLength(3)
      expect(response.candidates.every(c => c.text.includes('function'))).toBe(true)
    })

    it('should respect maxCandidates limit', async () => {
      // Set up provider to return many candidates
      const manyCandidates = Array.from({ length: 10 }, (_, i) => 
        `\`\`\`typescript\nfunction option${i}() {}\n\`\`\``
      ).join('\n\n')

      mockProvider.setMockResponse('default', {
        text: manyCandidates,
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 300 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.candidates.length).toBeLessThanOrEqual(config.maxCandidates)
    })

    it('should handle model provider errors', async () => {
      mockProvider.setShouldFail(true, new Error('Network timeout'))

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.status).toBe('error')
      expect(response.error).toContain('Network timeout')
      expect(response.candidates).toHaveLength(0)
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle timeout scenarios', async () => {
      mockProvider.setLatency(5000) // Longer than timeout

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const startTime = Date.now()
      const response = await suggestionEngine.generateSuggestions(request)
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(4000) // Should timeout before 5s latency
      expect(response.status).toBe('error')
    })

    it('should sanitize prompts for PII', async () => {
      const contextWithPII = ContextFactory.createContextPack()
      contextWithPII.focusWindow.content = `
        const apiKey = 'sk-1234567890abcdef';
        const email = 'user@example.com';
        function processData() {}
      `

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: contextWithPII
      }

      await suggestionEngine.generateSuggestions(request)

      const lastCall = mockProvider.getLastCall()
      expect(lastCall?.prompt).not.toContain('sk-1234567890abcdef')
      expect(lastCall?.prompt).toContain('[API_KEY_REDACTED]')
    })

    it('should handle manual queries', async () => {
      mockProvider.setMockResponse('explain', {
        text: 'This function handles user authentication by validating credentials.',
        finishReason: 'stop',
        tokenUsage: { prompt: 80, completion: 25 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        manualQuery: 'explain this function',
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.candidates[0].text).toContain('authentication')
      expect(response.candidates[0].rationale).toBeDefined()
    })
  })

  describe('filtering', () => {
    it('should filter out dangerous code patterns', async () => {
      mockProvider.setMockResponse('default', {
        text: `\`\`\`typescript
eval(userInput); // Dangerous!
\`\`\`

\`\`\`typescript
function safeFunction() {
  console.log('Safe code');
}
\`\`\``,
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 80 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      // Should filter out the dangerous eval() suggestion
      expect(response.candidates).toHaveLength(1)
      expect(response.candidates[0].text).toContain('safeFunction')
      expect(response.candidates[0].text).not.toContain('eval')
    })

    it('should filter out empty suggestions', async () => {
      mockProvider.setMockResponse('default', {
        text: `\`\`\`typescript
\`\`\`

\`\`\`typescript
function validFunction() {
  return true;
}
\`\`\``,
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 50 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.candidates).toHaveLength(1)
      expect(response.candidates[0].text).toContain('validFunction')
    })
  })

  describe('ranking', () => {
    it('should rank suggestions by quality', async () => {
      mockProvider.setMockResponse('default', {
        text: `\`\`\`typescript
// Long, complex function
function veryLongFunctionNameThatDoesTooManyThings() {
  // This function has many lines and does too much
  let result = 0;
  for (let i = 0; i < 1000; i++) {
    result += i * Math.random();
  }
  return result;
}
\`\`\`

\`\`\`typescript
function add(a, b) {
  return a + b;
}
\`\`\``,
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 120 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      // Shorter, simpler function should rank higher
      expect(response.candidates[0].text).toContain('add(a, b)')
      expect(response.candidates[0].finalScore).toBeGreaterThan(
        response.candidates[1].finalScore
      )
    })

    it('should consider confidence levels', async () => {
      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      // All candidates should have confidence scores
      expect(response.candidates.every(c => 
        ['LOW', 'MEDIUM', 'HIGH'].includes(c.confidence)
      )).toBe(true)
    })
  })

  describe('feedback processing', () => {
    it('should process accept feedback', async () => {
      const feedback: SuggestFeedback = {
        requestId: 'test_request_123',
        candidateId: 'candidate_1',
        event: 'accept',
        appliedBytes: 50,
        latencyMs: 1500,
        timestamp: Date.now()
      }

      await suggestionEngine.processFeedback(feedback)

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Feedback processed',
        expect.objectContaining({
          requestId: feedback.requestId,
          event: 'accept'
        })
      )
    })

    it('should process dismiss feedback', async () => {
      const feedback: SuggestFeedback = {
        requestId: 'test_request_123',
        candidateId: 'candidate_1',
        event: 'dismiss',
        latencyMs: 800,
        timestamp: Date.now()
      }

      await suggestionEngine.processFeedback(feedback)

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Feedback processed',
        expect.objectContaining({
          requestId: feedback.requestId,
          event: 'dismiss'
        })
      )
    })

    it('should update heuristic weights based on feedback', async () => {
      // Generate some suggestions first
      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)
      
      // Provide positive feedback
      const feedback: SuggestFeedback = {
        requestId: response.requestId,
        candidateId: response.candidates[0].id,
        event: 'accept',
        latencyMs: 1000,
        timestamp: Date.now()
      }

      await suggestionEngine.processFeedback(feedback)

      // Generate suggestions again - should potentially have different scores
      const response2 = await suggestionEngine.generateSuggestions(request)
      
      expect(response2.candidates[0]).toMatchObject({
        finalScore: expect.any(Number),
        heuristics: expect.any(Object)
      })
    })
  })

  describe('statistics', () => {
    it('should track suggestion statistics', async () => {
      // Generate some suggestions and feedback
      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)
      
      await suggestionEngine.processFeedback({
        requestId: response.requestId,
        candidateId: response.candidates[0].id,
        event: 'accept',
        latencyMs: 1000,
        timestamp: Date.now()
      })

      const stats = suggestionEngine.getStats()

      expect(stats).toMatchObject({
        totalRequests: expect.any(Number),
        totalFeedback: expect.any(Number),
        acceptRate: expect.any(Number),
        dismissRate: expect.any(Number),
        heuristicCount: expect.any(Number),
        filterCount: expect.any(Number)
      })

      expect(stats.acceptRate).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty model responses', async () => {
      mockProvider.setMockResponse('default', {
        text: '',
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 0 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      expect(response.status).toBe('success')
      expect(response.candidates).toHaveLength(0)
    })

    it('should validate request parameters', async () => {
      const invalidRequest = {
        filePath: '', // Invalid
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true }
      } as SuggestRequest

      const response = await suggestionEngine.generateSuggestions(invalidRequest)

      expect(response.status).toBe('error')
      expect(response.error).toContain('File path is required')
    })

    it('should handle malformed code blocks', async () => {
      mockProvider.setMockResponse('default', {
        text: `Here's some code:
\`\`\`typescript
function incomplete() {
  // Missing closing brace
\`\`\`

\`\`\`
// No language specified
function another() {}
\`\`\``,
        finishReason: 'stop',
        tokenUsage: { prompt: 100, completion: 80 }
      })

      const request: SuggestRequest = {
        filePath: '/test/file.ts',
        cursor: ContextFactory.createPosition(),
        capabilities: { stream: false, partialAccept: true },
        context: ContextFactory.createContextPack()
      }

      const response = await suggestionEngine.generateSuggestions(request)

      // Should still extract what it can
      expect(response.candidates.length).toBeGreaterThan(0)
    })
  })
})

// Integration tests with different provider scenarios
describe('SuggestionEngine Integration', () => {
  it('should work with fast provider', async () => {
    const fastProvider = MockScenarios.fast()
    const engine = new SuggestionEngine(
      fastProvider,
      { maxCandidates: 3, timeoutMs: 1000, enableStreaming: false, enableFiltering: true, enableRanking: true },
      mockLogger
    )

    const request: SuggestRequest = {
      filePath: '/test/file.ts',
      cursor: ContextFactory.createPosition(),
      capabilities: { stream: false, partialAccept: true },
      context: ContextFactory.createContextPack()
    }

    const response = await engine.generateSuggestions(request)

    expect(response.status).toBe('success')
    expect(response.latencyMs).toBeLessThan(200)
  })

  it('should handle slow provider with timeout', async () => {
    const slowProvider = MockScenarios.slow()
    const engine = new SuggestionEngine(
      slowProvider,
      { maxCandidates: 3, timeoutMs: 1000, enableStreaming: false, enableFiltering: true, enableRanking: true },
      mockLogger
    )

    const request: SuggestRequest = {
      filePath: '/test/file.ts',
      cursor: ContextFactory.createPosition(),
      capabilities: { stream: false, partialAccept: true },
      context: ContextFactory.createContextPack()
    }

    const response = await engine.generateSuggestions(request)

    expect(response.status).toBe('error')
    expect(response.latencyMs).toBeLessThan(2000) // Should timeout
  })

  it('should handle failing provider gracefully', async () => {
    const failingProvider = MockScenarios.failing()
    const engine = new SuggestionEngine(
      failingProvider,
      { maxCandidates: 3, timeoutMs: 3000, enableStreaming: false, enableFiltering: true, enableRanking: true },
      mockLogger
    )

    const request: SuggestRequest = {
      filePath: '/test/file.ts',
      cursor: ContextFactory.createPosition(),
      capabilities: { stream: false, partialAccept: true },
      context: ContextFactory.createContextPack()
    }

    const response = await engine.generateSuggestions(request)

    expect(response.status).toBe('error')
    expect(response.candidates).toHaveLength(0)
  })
})
