/**
 * Mock Model Provider for Testing
 * Implements TASK-039: 회귀 테스트 스위트 1차 작성
 */

import { vi } from 'vitest'
import { ModelProvider, ModelRequest, ModelResponse } from '@/lib/ai-engine/types'

export class MockModelProvider implements ModelProvider {
  name = 'MockProvider'
  
  // Mock responses for different scenarios
  private mockResponses: Map<string, ModelResponse> = new Map()
  private callHistory: ModelRequest[] = []
  private shouldFail = false
  private failureError = new Error('Mock model provider failure')
  private latencyMs = 100

  constructor() {
    this.setupDefaultResponses()
  }

  async generate(request: ModelRequest, abortSignal?: AbortSignal): Promise<ModelResponse> {
    // Record the call
    this.callHistory.push({ ...request })

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, this.latencyMs))

    // Check for abort signal
    if (abortSignal?.aborted) {
      throw new Error('Request aborted')
    }

    // Simulate failure if configured
    if (this.shouldFail) {
      throw this.failureError
    }

    // Find matching response
    const responseKey = this.getResponseKey(request)
    const response = this.mockResponses.get(responseKey) || this.getDefaultResponse(request)

    return {
      ...response,
      latencyMs: this.latencyMs
    }
  }

  estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  getMaxTokens(): number {
    return 4096
  }

  // Test utilities
  setMockResponse(key: string, response: Partial<ModelResponse>): void {
    const fullResponse: ModelResponse = {
      text: '',
      finishReason: 'stop',
      tokenUsage: { prompt: 100, completion: 50 },
      latencyMs: this.latencyMs,
      ...response
    }
    this.mockResponses.set(key, fullResponse)
  }

  setLatency(ms: number): void {
    this.latencyMs = ms
  }

  setShouldFail(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail
    if (error) {
      this.failureError = error
    }
  }

  getCallHistory(): ModelRequest[] {
    return [...this.callHistory]
  }

  getLastCall(): ModelRequest | undefined {
    return this.callHistory[this.callHistory.length - 1]
  }

  clearHistory(): void {
    this.callHistory = []
  }

  reset(): void {
    this.clearHistory()
    this.setShouldFail(false)
    this.setLatency(100)
    this.mockResponses.clear()
    this.setupDefaultResponses()
  }

  private setupDefaultResponses(): void {
    // Default code suggestion response
    this.setMockResponse('default', {
      text: `\`\`\`typescript
function handleClick() {
  console.log('Button clicked');
}
\`\`\``,
      finishReason: 'stop',
      tokenUsage: { prompt: 150, completion: 30 }
    })

    // Explanation response
    this.setMockResponse('explain', {
      text: 'This function handles button click events by logging a message to the console.',
      finishReason: 'stop',
      tokenUsage: { prompt: 100, completion: 20 }
    })

    // Multiple suggestions response
    this.setMockResponse('multiple', {
      text: `Here are several options:

\`\`\`typescript
// Option 1: Simple handler
function handleClick() {
  console.log('Clicked');
}
\`\`\`

\`\`\`typescript
// Option 2: With event parameter
function handleClick(event: MouseEvent) {
  event.preventDefault();
  console.log('Clicked with event:', event);
}
\`\`\``,
      finishReason: 'stop',
      tokenUsage: { prompt: 200, completion: 80 }
    })

    // Empty response
    this.setMockResponse('empty', {
      text: '',
      finishReason: 'stop',
      tokenUsage: { prompt: 50, completion: 0 }
    })

    // Long response (for testing truncation)
    this.setMockResponse('long', {
      text: `\`\`\`typescript
${Array(100).fill('console.log("Very long response");').join('\n')}
\`\`\``,
      finishReason: 'length',
      tokenUsage: { prompt: 100, completion: 1000 }
    })
  }

  private getResponseKey(request: ModelRequest): string {
    // Simple key generation based on prompt content
    if (request.prompt.includes('explain')) return 'explain'
    if (request.prompt.includes('multiple') || request.prompt.includes('options')) return 'multiple'
    if (request.prompt.length > 1000) return 'long'
    return 'default'
  }

  private getDefaultResponse(request: ModelRequest): ModelResponse {
    return {
      text: `// Generated suggestion for: ${request.prompt.slice(0, 50)}...`,
      finishReason: 'stop',
      tokenUsage: {
        prompt: this.estimateTokens(request.prompt),
        completion: 20
      },
      latencyMs: this.latencyMs
    }
  }
}

// Factory function for creating mock providers
export function createMockModelProvider(): MockModelProvider {
  return new MockModelProvider()
}

// Vitest mock factory
export const mockModelProviderFactory = vi.fn(() => createMockModelProvider())

// Pre-configured mock scenarios
export const MockScenarios = {
  // Fast, successful responses
  fast: () => {
    const provider = createMockModelProvider()
    provider.setLatency(50)
    return provider
  },

  // Slow responses (for timeout testing)
  slow: () => {
    const provider = createMockModelProvider()
    provider.setLatency(5000)
    return provider
  },

  // Failing provider
  failing: () => {
    const provider = createMockModelProvider()
    provider.setShouldFail(true, new Error('Network error'))
    return provider
  },

  // Provider with custom responses
  custom: (responses: Record<string, Partial<ModelResponse>>) => {
    const provider = createMockModelProvider()
    Object.entries(responses).forEach(([key, response]) => {
      provider.setMockResponse(key, response)
    })
    return provider
  }
}

// Helper for creating provider with specific behavior
export function createMockProviderWithBehavior(
  behavior: 'success' | 'failure' | 'timeout' | 'empty'
): MockModelProvider {
  const provider = createMockModelProvider()
  
  switch (behavior) {
    case 'failure':
      provider.setShouldFail(true)
      break
    case 'timeout':
      provider.setLatency(10000)
      break
    case 'empty':
      provider.setMockResponse('default', { text: '' })
      break
    case 'success':
    default:
      // Use default successful behavior
      break
  }
  
  return provider
}
