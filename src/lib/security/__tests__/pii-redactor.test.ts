/**
 * PII Redactor Tests
 * Implements TASK-039: 회귀 테스트 스위트 1차 작성
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { piiRedactor, usePIIRedaction } from '../pii-redactor'
import { renderHook } from '@testing-library/react'

describe('PIIRedactor', () => {
  beforeEach(() => {
    // Reset any state between tests
    vi.clearAllMocks()
  })

  describe('redact', () => {
    it('should redact email addresses', () => {
      const text = 'Contact us at support@example.com or admin@test.org'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
      expect(result.redactedText).not.toContain('support@example.com')
      expect(result.redactedText).not.toContain('admin@test.org')
      expect(result.isClean).toBe(false)
      expect(result.detectedPatterns).toHaveLength(1)
      expect(result.detectedPatterns[0].pattern).toBe('email')
      expect(result.detectedPatterns[0].matchCount).toBe(2)
    })

    it('should redact API keys', () => {
      const text = 'const apiKey = "sk-1234567890abcdef1234567890abcdef1234567890abcdef";'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[OPENAI_KEY_REDACTED]')
      expect(result.redactedText).not.toContain('sk-1234567890abcdef')
      expect(result.isClean).toBe(false)
    })

    it('should redact phone numbers', () => {
      const text = 'Call me at (555) 123-4567 or 555.987.6543'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[PHONE_REDACTED]')
      expect(result.redactedText).not.toContain('555-123-4567')
      expect(result.isClean).toBe(false)
    })

    it('should redact credit card numbers', () => {
      const text = 'Card number: 4532015112830366'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[CARD_REDACTED]')
      expect(result.redactedText).not.toContain('4532015112830366')
      expect(result.isClean).toBe(false)
    })

    it('should redact JWT tokens', () => {
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[JWT_REDACTED]')
      expect(result.redactedText).not.toContain('eyJhbGciOiJIUzI1NiI')
      expect(result.isClean).toBe(false)
    })

    it('should redact IP addresses', () => {
      const text = 'Server IP: 192.168.1.100 and backup: 10.0.0.1'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[IP_REDACTED]')
      expect(result.redactedText).not.toContain('192.168.1.100')
      expect(result.isClean).toBe(false)
    })

    it('should handle multiple PII types in one text', () => {
      const text = `
        User email: john@example.com
        API Key: sk-abcd1234567890abcdef1234567890abcdef1234567890
        Phone: (555) 123-4567
        Server: 192.168.1.1
      `
      const result = piiRedactor.redact(text)

      expect(result.detectedPatterns.length).toBeGreaterThan(1)
      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
      expect(result.redactedText).toContain('[OPENAI_KEY_REDACTED]')
      expect(result.redactedText).toContain('[PHONE_REDACTED]')
      expect(result.redactedText).toContain('[IP_REDACTED]')
      expect(result.isClean).toBe(false)
    })

    it('should respect whitelisted domains', () => {
      const text = 'Test email: test@example.com and real email: user@company.com'
      const result = piiRedactor.redact(text)

      // example.com should be whitelisted, company.com should be redacted
      expect(result.redactedText).toContain('test@example.com')
      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
      expect(result.redactedText).not.toContain('user@company.com')
    })

    it('should handle context-based severity reduction', () => {
      const testContext = { isTestContext: true }
      const text = 'Server IP: 192.168.1.100'
      
      const result = piiRedactor.redact(text, testContext)
      
      // In test context, low severity items might be skipped
      expect(result.detectedPatterns.length).toBeLessThanOrEqual(1)
    })

    it('should return clean result for text without PII', () => {
      const text = 'This is a normal text without any sensitive information.'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toBe(text)
      expect(result.isClean).toBe(true)
      expect(result.detectedPatterns).toHaveLength(0)
    })

    it('should handle empty or null text', () => {
      expect(() => piiRedactor.redact('')).not.toThrow()
      expect(piiRedactor.redact('').isClean).toBe(true)
    })

    it('should respect max matches limit', () => {
      // Create text with many email addresses
      const emails = Array.from({ length: 150 }, (_, i) => `user${i}@company.com`).join(' ')
      const result = piiRedactor.redact(emails)

      // Should stop at max matches limit (100 by default)
      expect(result.detectedPatterns[0].matchCount).toBeLessThanOrEqual(100)
    })
  })

  describe('scan', () => {
    it('should detect PII without redacting', () => {
      const text = 'Email: user@example.com'
      const hasPII = piiRedactor.scan(text)

      expect(hasPII).toBe(true)
    })

    it('should return false for clean text', () => {
      const text = 'This is clean text'
      const hasPII = piiRedactor.scan(text)

      expect(hasPII).toBe(false)
    })
  })

  describe('getStats', () => {
    it('should return redaction statistics', () => {
      const text = 'Contact: user@example.com, Phone: (555) 123-4567'
      const stats = piiRedactor.getStats(text)

      expect(stats).toMatchObject({
        originalLength: expect.any(Number),
        redactedLength: expect.any(Number),
        patternsDetected: expect.any(Number),
        totalMatches: expect.any(Number),
        severityBreakdown: expect.any(Object)
      })

      expect(stats.patternsDetected).toBeGreaterThan(0)
      expect(stats.totalMatches).toBeGreaterThan(0)
      expect(stats.severityBreakdown).toHaveProperty('high')
    })
  })

  describe('context handling', () => {
    it('should handle prompt context', () => {
      const text = 'API_KEY=sk-test123456789012345678901234567890123456789012'
      const result = piiRedactor.redact(text, { source: 'prompt' })

      expect(result.redactedText).toContain('[API_KEY_REDACTED]')
      expect(result.isClean).toBe(false)
    })

    it('should handle log context', () => {
      const text = 'User logged in: user@company.com'
      const result = piiRedactor.redact(text, { source: 'log' })

      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    })

    it('should handle telemetry context', () => {
      const text = 'Error in function with email user@test.com'
      const result = piiRedactor.redact(text, { source: 'telemetry' })

      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    })
  })

  describe('edge cases', () => {
    it('should handle very long text', () => {
      const longText = 'Normal text '.repeat(10000) + 'user@example.com'
      const result = piiRedactor.redact(longText)

      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
      expect(result.isClean).toBe(false)
    })

    it('should handle special characters in patterns', () => {
      const text = 'Email with plus: user+tag@example.com'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    })

    it('should handle case insensitive patterns', () => {
      const text = 'PASSWORD=MySecretPassword123'
      const result = piiRedactor.redact(text)

      expect(result.redactedText).toContain('[PASSWORD_REDACTED]')
    })

    it('should handle malformed patterns gracefully', () => {
      const text = 'Almost email: user@'
      const result = piiRedactor.redact(text)

      // Should not crash and should not redact incomplete patterns
      expect(result.redactedText).toBe(text)
      expect(result.isClean).toBe(true)
    })
  })

  describe('performance', () => {
    it('should handle large text efficiently', () => {
      const largeText = 'Some text with email user@example.com '.repeat(1000)
      
      const startTime = Date.now()
      const result = piiRedactor.redact(largeText)
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(1000) // Should complete within 1 second
      expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    })
  })
})

describe('usePIIRedaction hook', () => {
  it('should provide redaction functions', () => {
    const { result } = renderHook(() => usePIIRedaction())

    expect(result.current).toMatchObject({
      redact: expect.any(Function),
      scan: expect.any(Function),
      getStats: expect.any(Function)
    })
  })

  it('should redact text through hook', () => {
    const { result } = renderHook(() => usePIIRedaction())
    
    const text = 'Email: user@example.com'
    const redactionResult = result.current.redact(text)

    expect(redactionResult.redactedText).toContain('[EMAIL_REDACTED]')
    expect(redactionResult.isClean).toBe(false)
  })

  it('should scan text through hook', () => {
    const { result } = renderHook(() => usePIIRedaction())
    
    const textWithPII = 'Email: user@example.com'
    const cleanText = 'This is clean'

    expect(result.current.scan(textWithPII)).toBe(true)
    expect(result.current.scan(cleanText)).toBe(false)
  })
})

// Integration tests
describe('PII Redactor Integration', () => {
  it('should work in realistic code analysis scenario', () => {
    const codeSnippet = `
function authenticateUser(email, password) {
  // User credentials
  const userEmail = "john.doe@company.com";
  const apiKey = "sk-1234567890abcdef1234567890abcdef1234567890abcdef";
  
  // Database connection
  const dbHost = "192.168.1.100";
  const dbPassword = "super_secret_password";
  
  // JWT token for session
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
  
  return { success: true, token };
}
    `

    const result = piiRedactor.redact(codeSnippet, { 
      source: 'prompt',
      filePath: '/src/auth.js' 
    })

    // Should redact all sensitive information
    expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    expect(result.redactedText).toContain('[OPENAI_KEY_REDACTED]')
    expect(result.redactedText).toContain('[IP_REDACTED]')
    expect(result.redactedText).toContain('[PASSWORD_REDACTED]')
    expect(result.redactedText).toContain('[JWT_REDACTED]')
    
    // Should preserve code structure
    expect(result.redactedText).toContain('function authenticateUser')
    expect(result.redactedText).toContain('return { success: true')
    
    expect(result.isClean).toBe(false)
    expect(result.detectedPatterns.length).toBeGreaterThan(3)
  })

  it('should handle mixed content with some whitelisted items', () => {
    const mixedContent = `
Test environment:
- Email: test@example.com (whitelisted)
- Email: real@company.com (should be redacted)
- Localhost: 127.0.0.1 (whitelisted)
- Server: 10.0.0.1 (should be redacted)
    `

    const result = piiRedactor.redact(mixedContent)

    expect(result.redactedText).toContain('test@example.com')
    expect(result.redactedText).toContain('127.0.0.1')
    expect(result.redactedText).toContain('[EMAIL_REDACTED]')
    expect(result.redactedText).toContain('[IP_REDACTED]')
    expect(result.redactedText).not.toContain('real@company.com')
    expect(result.redactedText).not.toContain('10.0.0.1')
  })
})
