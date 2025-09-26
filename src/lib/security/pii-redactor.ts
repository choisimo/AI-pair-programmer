/**
 * PII Redaction Service
 * Implements TASK-026: PII 스캐닝 미들웨어 구현
 */

import { securityConfig } from '@/config/environment';
import piiPatterns from '@/config/pii-patterns.json';

export interface PIIPattern {
  name: string;
  regex: string;
  replacement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RedactionResult {
  redactedText: string;
  detectedPatterns: Array<{
    pattern: string;
    severity: string;
    matchCount: number;
  }>;
  isClean: boolean;
}

export interface RedactionContext {
  source?: 'prompt' | 'log' | 'telemetry' | 'response';
  filePath?: string;
  isTestContext?: boolean;
}

class PIIRedactor {
  private patterns: Map<string, RegExp> = new Map();
  private patternMeta: Map<string, PIIPattern> = new Map();
  private whitelistedDomains: Set<string> = new Set();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns() {
    // Load patterns from configuration
    for (const pattern of piiPatterns.patterns) {
      try {
        const flags = piiPatterns.settings.case_sensitive ? 'g' : 'gi';
        const regex = new RegExp(pattern.regex, flags);
        
        this.patterns.set(pattern.name, regex);
        this.patternMeta.set(pattern.name, pattern);
      } catch (error) {
        console.warn(`Failed to compile PII pattern '${pattern.name}':`, error);
      }
    }

    // Load whitelisted domains
    for (const domain of piiPatterns.whitelisted_domains) {
      this.whitelistedDomains.add(domain.toLowerCase());
    }
  }

  /**
   * Redact PII from text with context awareness
   */
  public redact(text: string, context: RedactionContext = {}): RedactionResult {
    if (!securityConfig.piiRedactionEnabled) {
      return {
        redactedText: text,
        detectedPatterns: [],
        isClean: true
      };
    }

    let redactedText = text;
    const detectedPatterns: RedactionResult['detectedPatterns'] = [];
    let totalMatches = 0;

    for (const [patternName, regex] of this.patterns) {
      const patternMeta = this.patternMeta.get(patternName)!;
      
      // Apply context-based severity reduction
      const adjustedSeverity = this.adjustSeverityForContext(
        patternMeta.severity,
        context
      );

      // Skip low-severity patterns in test contexts
      if (context.isTestContext && adjustedSeverity === 'low') {
        continue;
      }

      const matches = Array.from(redactedText.matchAll(regex));
      
      if (matches.length > 0) {
        // Check if matches are whitelisted
        const validMatches = matches.filter(match => 
          !this.isWhitelisted(match[0], patternName)
        );

        if (validMatches.length > 0) {
          redactedText = redactedText.replace(regex, patternMeta.replacement);
          
          detectedPatterns.push({
            pattern: patternName,
            severity: adjustedSeverity,
            matchCount: validMatches.length
          });

          totalMatches += validMatches.length;

          // Log redaction if enabled
          if (piiPatterns.settings.log_redactions) {
            console.warn(`PII redacted: ${patternName} (${validMatches.length} matches)`);
          }
        }
      }

      // Respect max matches limit
      if (totalMatches >= piiPatterns.settings.max_matches_per_text) {
        break;
      }
    }

    return {
      redactedText,
      detectedPatterns,
      isClean: detectedPatterns.length === 0
    };
  }

  /**
   * Check if text contains PII without redacting
   */
  public scan(text: string, context: RedactionContext = {}): boolean {
    const result = this.redact(text, context);
    return !result.isClean;
  }

  /**
   * Get redaction statistics
   */
  public getStats(text: string, context: RedactionContext = {}) {
    const result = this.redact(text, context);
    return {
      originalLength: text.length,
      redactedLength: result.redactedText.length,
      patternsDetected: result.detectedPatterns.length,
      totalMatches: result.detectedPatterns.reduce(
        (sum, p) => sum + p.matchCount, 0
      ),
      severityBreakdown: this.getSeverityBreakdown(result.detectedPatterns)
    };
  }

  private adjustSeverityForContext(
    severity: PIIPattern['severity'],
    context: RedactionContext
  ): PIIPattern['severity'] {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    let currentLevel = severityLevels.indexOf(severity);

    // Apply context rules
    for (const rule of piiPatterns.context_rules) {
      let applies = false;

      if (rule.name === 'test_files' && context.isTestContext) {
        applies = true;
      } else if (rule.name === 'code_comments' && context.filePath?.endsWith('.ts')) {
        applies = true;
      }

      if (applies) {
        currentLevel = Math.max(0, currentLevel - rule.severity_reduction);
      }
    }

    return severityLevels[currentLevel] as PIIPattern['severity'];
  }

  private isWhitelisted(match: string, patternName: string): boolean {
    if (patternName === 'email') {
      const domain = match.split('@')[1]?.toLowerCase();
      return domain ? this.whitelistedDomains.has(domain) : false;
    }

    if (patternName === 'ip_address') {
      return this.whitelistedDomains.has(match);
    }

    return false;
  }

  private getSeverityBreakdown(patterns: RedactionResult['detectedPatterns']) {
    const breakdown = { low: 0, medium: 0, high: 0, critical: 0 };
    
    for (const pattern of patterns) {
      breakdown[pattern.severity as keyof typeof breakdown] += pattern.matchCount;
    }

    return breakdown;
  }
}

// Singleton instance
export const piiRedactor = new PIIRedactor();

// Middleware function for Express/API routes
export function createPIIRedactionMiddleware() {
  return (req: any, res: any, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      if (typeof data === 'string') {
        const result = piiRedactor.redact(data, { source: 'response' });
        
        if (!result.isClean) {
          console.warn('PII detected in API response, redacted');
        }
        
        return originalSend.call(this, result.redactedText);
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

// React Hook for client-side redaction
export function usePIIRedaction() {
  return {
    redact: (text: string, context?: RedactionContext) => 
      piiRedactor.redact(text, context),
    scan: (text: string, context?: RedactionContext) => 
      piiRedactor.scan(text, context),
    getStats: (text: string, context?: RedactionContext) => 
      piiRedactor.getStats(text, context)
  };
}

export default piiRedactor;
