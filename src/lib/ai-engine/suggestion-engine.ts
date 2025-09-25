/**
 * AI Suggestion Engine Implementation
 * Implements TASK-003: 프롬프트 오케스트레이션 스캐폴드
 * Implements TASK-004: 랭킹 & 피드백 루프 MVP
 */

import { 
  SuggestRequest, 
  SuggestResponse, 
  Candidate, 
  ContextPack,
  ModelProvider,
  ModelRequest,
  SuggestFeedback,
  RankingHeuristic,
  FilterRule,
  Logger,
  SuggestionError
} from './types';
import { aiConfig } from '@/config/environment';
import { piiRedactor } from '../security/pii-redactor';
import { createHash } from 'crypto';

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
}

export interface SuggestionEngineConfig {
  maxCandidates: number;
  timeoutMs: number;
  enableStreaming: boolean;
  enableFiltering: boolean;
  enableRanking: boolean;
}

export class SuggestionEngine {
  private modelProvider: ModelProvider;
  private config: SuggestionEngineConfig;
  private logger: Logger;
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private rankingHeuristics: RankingHeuristic[] = [];
  private filterRules: FilterRule[] = [];
  private feedbackHistory: Map<string, SuggestFeedback[]> = new Map();

  constructor(
    modelProvider: ModelProvider,
    config: SuggestionEngineConfig,
    logger: Logger
  ) {
    this.modelProvider = modelProvider;
    this.config = config;
    this.logger = logger;
    
    this.initializePromptTemplates();
    this.initializeHeuristics();
    this.initializeFilters();
  }

  /**
   * Generate AI suggestions for a given request
   */
  async generateSuggestions(request: SuggestRequest): Promise<SuggestResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate request
      this.validateRequest(request);

      // Build context if not provided
      const context = request.context || await this.buildContext(request);

      // Select prompt template
      const template = this.selectPromptTemplate(request, context);

      // Generate prompt
      const prompt = await this.generatePrompt(template, request, context);

      // Apply security filters
      const sanitizedPrompt = this.sanitizePrompt(prompt);

      // Call model provider
      const modelResponse = await this.callModel(sanitizedPrompt, request);

      // Parse candidates from response
      const rawCandidates = await this.parseCandidates(modelResponse.text, request);

      // Apply filters
      const filteredCandidates = this.config.enableFiltering 
        ? this.applyFilters(rawCandidates, context)
        : rawCandidates;

      // Apply ranking
      const rankedCandidates = this.config.enableRanking
        ? this.rankCandidates(filteredCandidates, context)
        : filteredCandidates;

      // Limit to max candidates
      const finalCandidates = rankedCandidates.slice(0, this.config.maxCandidates);

      const response: SuggestResponse = {
        requestId,
        generatedAt: Date.now(),
        candidates: finalCandidates,
        contextHash: context.hash,
        latencyMs: Date.now() - startTime,
        contextBuildMs: 0, // Would be set by context builder
        modelInferenceMs: modelResponse.latencyMs,
        status: 'success'
      };

      this.logger.info('Suggestions generated successfully', {
        requestId,
        candidateCount: finalCandidates.length,
        latencyMs: response.latencyMs
      });

      return response;

    } catch (error) {
      this.logger.error('Suggestion generation failed', error as Error, { requestId });
      
      return {
        requestId,
        generatedAt: Date.now(),
        candidates: [],
        contextHash: request.context?.hash || '',
        latencyMs: Date.now() - startTime,
        contextBuildMs: 0,
        modelInferenceMs: 0,
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  /**
   * Process feedback for improving suggestions
   */
  async processFeedback(feedback: SuggestFeedback): Promise<void> {
    try {
      // Store feedback
      const requestFeedback = this.feedbackHistory.get(feedback.requestId) || [];
      requestFeedback.push(feedback);
      this.feedbackHistory.set(feedback.requestId, requestFeedback);

      // Update heuristic weights based on feedback
      await this.updateHeuristicWeights(feedback);

      this.logger.debug('Feedback processed', {
        requestId: feedback.requestId,
        event: feedback.event
      });

    } catch (error) {
      this.logger.error('Failed to process feedback', error as Error, {
        requestId: feedback.requestId
      });
    }
  }

  /**
   * Get suggestion statistics
   */
  getStats() {
    const totalFeedback = Array.from(this.feedbackHistory.values())
      .reduce((sum, feedback) => sum + feedback.length, 0);

    const acceptCount = Array.from(this.feedbackHistory.values())
      .flat()
      .filter(f => f.event === 'accept').length;

    const dismissCount = Array.from(this.feedbackHistory.values())
      .flat()
      .filter(f => f.event === 'dismiss').length;

    return {
      totalRequests: this.feedbackHistory.size,
      totalFeedback,
      acceptRate: totalFeedback > 0 ? acceptCount / totalFeedback : 0,
      dismissRate: totalFeedback > 0 ? dismissCount / totalFeedback : 0,
      heuristicCount: this.rankingHeuristics.length,
      filterCount: this.filterRules.length
    };
  }

  private validateRequest(request: SuggestRequest): void {
    if (!request.filePath) {
      throw new SuggestionError('File path is required');
    }

    if (!request.cursor) {
      throw new SuggestionError('Cursor position is required');
    }
  }

  private async buildContext(request: SuggestRequest): Promise<ContextPack> {
    // This would integrate with the ContextBuilder
    // For now, return a minimal context
    return {
      hash: 'mock_context_hash',
      createdAt: Date.now(),
      ttl: 300,
      symbols: [],
      recentEdits: [],
      dependencyGraph: [],
      focusWindow: {
        filePath: request.filePath,
        content: '// Mock content',
        range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } },
        language: 'typescript'
      },
      language: 'typescript',
      projectRoot: '/workspace',
      stats: {
        symbolCount: 0,
        editCount: 0,
        dependencyCount: 0,
        buildTimeMs: 0
      }
    };
  }

  private selectPromptTemplate(request: SuggestRequest, context: ContextPack): PromptTemplate {
    // Simple template selection logic
    if (request.manualQuery) {
      return this.promptTemplates.get('explain') || this.promptTemplates.get('default')!;
    }

    return this.promptTemplates.get('default')!;
  }

  private async generatePrompt(
    template: PromptTemplate,
    request: SuggestRequest,
    context: ContextPack
  ): Promise<string> {
    const variables = {
      filePath: request.filePath,
      cursor: `${request.cursor.line}:${request.cursor.character}`,
      focusWindow: context.focusWindow.content,
      symbols: context.symbols.map(s => `${s.kind} ${s.name}`).join('\n'),
      recentEdits: context.recentEdits.length.toString(),
      manualQuery: request.manualQuery || '',
      language: context.language
    };

    let prompt = template.userPromptTemplate;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return `${template.systemPrompt}\n\n${prompt}`;
  }

  private sanitizePrompt(prompt: string): string {
    const result = piiRedactor.redact(prompt, { source: 'prompt' });
    
    if (!result.isClean) {
      this.logger.warn('PII detected and redacted from prompt', {
        patternsDetected: result.detectedPatterns.length
      });
    }

    return result.redactedText;
  }

  private async callModel(prompt: string, request: SuggestRequest): Promise<any> {
    const modelRequest: ModelRequest = {
      prompt,
      maxTokens: aiConfig.maxTokens,
      temperature: aiConfig.temperature,
      stream: request.capabilities.stream && this.config.enableStreaming,
      stopSequences: ['```', '---END---']
    };

    // Create timeout signal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.modelProvider.generate(modelRequest, controller.signal);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async parseCandidates(responseText: string, request: SuggestRequest): Promise<Candidate[]> {
    const candidates: Candidate[] = [];

    // Simple parsing logic - extract code blocks
    const codeBlockRegex = /```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/g;
    let match;
    let candidateId = 1;

    while ((match = codeBlockRegex.exec(responseText)) !== null) {
      const code = match[1].trim();
      
      if (code.length > 0) {
        candidates.push({
          id: `candidate_${candidateId++}`,
          insertRange: {
            start: request.cursor,
            end: request.cursor
          },
          text: code,
          rationale: 'AI-generated code suggestion',
          riskFlags: [],
          confidence: 'MEDIUM',
          baseScore: 0.7,
          finalScore: 0.7,
          heuristics: {}
        });
      }
    }

    // If no code blocks found, treat entire response as a suggestion
    if (candidates.length === 0 && responseText.trim()) {
      candidates.push({
        id: 'candidate_1',
        insertRange: {
          start: request.cursor,
          end: request.cursor
        },
        text: responseText.trim(),
        rationale: 'AI-generated suggestion',
        riskFlags: [],
        confidence: 'LOW',
        baseScore: 0.5,
        finalScore: 0.5,
        heuristics: {}
      });
    }

    return candidates;
  }

  private applyFilters(candidates: Candidate[], context: ContextPack): Candidate[] {
    return candidates.filter(candidate => {
      for (const rule of this.filterRules) {
        if (rule.shouldFilter(candidate, context)) {
          this.logger.debug('Candidate filtered', {
            candidateId: candidate.id,
            rule: rule.name,
            reason: rule.reason
          });
          return false;
        }
      }
      return true;
    });
  }

  private rankCandidates(candidates: Candidate[], context: ContextPack): Candidate[] {
    // Calculate heuristic scores
    for (const candidate of candidates) {
      let totalScore = candidate.baseScore;
      const heuristics: Record<string, number> = {};

      for (const heuristic of this.rankingHeuristics) {
        const score = heuristic.calculate(candidate, context);
        heuristics[heuristic.name] = score;
        totalScore += score * heuristic.weight;
      }

      candidate.heuristics = heuristics;
      candidate.finalScore = Math.max(0, Math.min(1, totalScore));
    }

    // Sort by final score (descending)
    return candidates.sort((a, b) => b.finalScore - a.finalScore);
  }

  private async updateHeuristicWeights(feedback: SuggestFeedback): Promise<void> {
    // Simple weight adjustment based on feedback
    const learningRate = 0.1;

    for (const heuristic of this.rankingHeuristics) {
      if (feedback.event === 'accept') {
        // Increase weight for accepted suggestions
        heuristic.weight = Math.min(2.0, heuristic.weight + learningRate);
      } else if (feedback.event === 'dismiss') {
        // Decrease weight for dismissed suggestions
        heuristic.weight = Math.max(0.1, heuristic.weight - learningRate);
      }
    }
  }

  private initializePromptTemplates(): void {
    // Default suggestion template
    this.promptTemplates.set('default', {
      id: 'default',
      name: 'Default Code Suggestion',
      systemPrompt: `You are an AI coding assistant. Generate helpful, accurate, and contextually appropriate code suggestions.

Guidelines:
- Focus on the current cursor position and surrounding code
- Consider the project's existing patterns and conventions
- Provide clean, readable, and well-commented code
- Avoid suggesting code that might introduce security vulnerabilities
- Keep suggestions concise and focused`,
      userPromptTemplate: `File: {{filePath}}
Language: {{language}}
Cursor Position: {{cursor}}

Current Code Context:
\`\`\`{{language}}
{{focusWindow}}
\`\`\`

Recent Symbols:
{{symbols}}

Please provide a code suggestion for the current cursor position. Consider the existing code context and maintain consistency with the project's style.`,
      variables: ['filePath', 'language', 'cursor', 'focusWindow', 'symbols']
    });

    // Explanation template
    this.promptTemplates.set('explain', {
      id: 'explain',
      name: 'Code Explanation',
      systemPrompt: `You are an AI coding assistant. Provide clear, concise explanations of code functionality, potential improvements, and best practices.`,
      userPromptTemplate: `File: {{filePath}}
Language: {{language}}

Code to explain:
\`\`\`{{language}}
{{focusWindow}}
\`\`\`

User Query: {{manualQuery}}

Please explain the selected code, its purpose, and suggest any improvements if applicable.`,
      variables: ['filePath', 'language', 'focusWindow', 'manualQuery']
    });
  }

  private initializeHeuristics(): void {
    // Length heuristic - prefer shorter suggestions
    this.rankingHeuristics.push({
      name: 'length',
      weight: 0.3,
      calculate: (candidate: Candidate) => {
        const length = candidate.text.length;
        return length < 100 ? 0.2 : length < 500 ? 0.0 : -0.2;
      }
    });

    // Syntax heuristic - prefer syntactically valid code
    this.rankingHeuristics.push({
      name: 'syntax',
      weight: 0.5,
      calculate: (candidate: Candidate) => {
        // Simple syntax checks
        const hasMatchingBraces = this.hasMatchingBraces(candidate.text);
        const hasValidIndentation = this.hasValidIndentation(candidate.text);
        
        return (hasMatchingBraces ? 0.3 : -0.3) + (hasValidIndentation ? 0.2 : -0.1);
      }
    });

    // Confidence heuristic - use model confidence
    this.rankingHeuristics.push({
      name: 'confidence',
      weight: 0.4,
      calculate: (candidate: Candidate) => {
        switch (candidate.confidence) {
          case 'HIGH': return 0.3;
          case 'MEDIUM': return 0.0;
          case 'LOW': return -0.2;
          default: return 0.0;
        }
      }
    });
  }

  private initializeFilters(): void {
    // Security filter - block potentially dangerous code
    this.filterRules.push({
      name: 'security',
      priority: 1,
      shouldFilter: (candidate: Candidate) => {
        const dangerousPatterns = [
          /eval\s*\(/,
          /document\.write/,
          /innerHTML\s*=/,
          /exec\s*\(/,
          /system\s*\(/
        ];

        return dangerousPatterns.some(pattern => pattern.test(candidate.text));
      },
      reason: 'Contains potentially dangerous code patterns'
    });

    // Empty filter - block empty suggestions
    this.filterRules.push({
      name: 'empty',
      priority: 2,
      shouldFilter: (candidate: Candidate) => {
        return candidate.text.trim().length === 0;
      },
      reason: 'Empty suggestion'
    });
  }

  private hasMatchingBraces(code: string): boolean {
    const stack: string[] = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    
    for (const char of code) {
      if (char in pairs) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last] !== char) {
          return false;
        }
      }
    }
    
    return stack.length === 0;
  }

  private hasValidIndentation(code: string): boolean {
    const lines = code.split('\n');
    let indentLevel = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      const currentIndent = line.length - line.trimStart().length;
      
      // Simple indentation validation
      if (trimmed.includes('{')) indentLevel += 2;
      if (trimmed.includes('}')) indentLevel -= 2;
      
      if (currentIndent > indentLevel + 4) return false; // Too much indentation
    }
    
    return true;
  }

  private generateRequestId(): string {
    return createHash('sha256')
      .update(`${Date.now()}_${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// Factory function
export function createSuggestionEngine(
  modelProvider: ModelProvider,
  logger: Logger
): SuggestionEngine {
  const config: SuggestionEngineConfig = {
    maxCandidates: aiConfig.maxCandidates,
    timeoutMs: aiConfig.suggestionTimeout,
    enableStreaming: false, // Phase 2 feature
    enableFiltering: true,
    enableRanking: true
  };

  return new SuggestionEngine(modelProvider, config, logger);
}
