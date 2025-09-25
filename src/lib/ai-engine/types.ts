/**
 * Core AI Engine Type Definitions
 * Implements TASK-001: 컨텍스트 빌더 아키텍처 확정
 */

// Core position and range types
export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

// Symbol and dependency graph types
export interface SymbolMeta {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'import' | 'export';
  range: Range;
  filePath: string;
  signature?: string;
  documentation?: string;
  references: Position[];
  dependencies: string[]; // Symbol names this depends on
  exports?: string[]; // For modules
}

export interface DependencyEdge {
  from: string; // Symbol name or file path
  to: string;
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'references';
  weight: number; // Frequency or importance
}

// Edit tracking types
export interface EditDelta {
  filePath: string;
  timestamp: number;
  range: Range;
  oldText: string;
  newText: string;
  changeType: 'insert' | 'delete' | 'replace';
}

export interface CodeSlice {
  filePath: string;
  content: string;
  range: Range;
  language: 'typescript' | 'javascript' | 'python' | 'go'; // Extensible
}

// Context pack - the core data structure for AI suggestions
export interface ContextPack {
  // Unique identifier for caching
  hash: string;
  
  // Timestamp when this context was built
  createdAt: number;
  
  // TTL for cache invalidation (seconds)
  ttl: number;
  
  // Core context data
  symbols: SymbolMeta[];
  recentEdits: EditDelta[];
  dependencyGraph: DependencyEdge[];
  focusWindow: CodeSlice;
  
  // Metadata
  language: 'typescript' | 'javascript' | 'python' | 'go';
  projectRoot: string;
  
  // Statistics for telemetry
  stats: {
    symbolCount: number;
    editCount: number;
    dependencyCount: number;
    buildTimeMs: number;
  };
}

// Suggestion request and response types
export interface SuggestRequest {
  filePath: string;
  cursor: Position;
  visibleRegion?: Range;
  manualQuery?: string | null;
  capabilities: {
    stream: boolean;
    partialAccept: boolean;
    multiStep?: boolean;
  };
  context?: ContextPack; // Pre-built context (optional)
}

export interface Candidate {
  id: string;
  insertRange: Range;
  text: string;
  rationale?: string;
  riskFlags: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Scoring details
  baseScore: number;
  finalScore: number;
  heuristics: Record<string, number>;
  
  // Metadata
  tokenUsage?: {
    prompt: number;
    completion: number;
  };
}

export interface SuggestResponse {
  requestId: string;
  generatedAt: number;
  candidates: Candidate[];
  contextHash: string;
  
  // Performance metrics
  latencyMs: number;
  contextBuildMs: number;
  modelInferenceMs: number;
  
  // Status
  status: 'success' | 'partial' | 'error';
  error?: string;
}

// Feedback types
export interface SuggestFeedback {
  requestId: string;
  candidateId: string;
  event: 'accept' | 'dismiss' | 'partial' | 'timeout' | 'edit_after_accept';
  
  // Additional context
  appliedBytes?: number;
  editAfterAcceptBytes?: number;
  latencyMs: number;
  
  // User context
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

// Model provider abstraction
export interface ModelProvider {
  name: string;
  generate(request: ModelRequest, abortSignal?: AbortSignal): Promise<ModelResponse>;
  estimateTokens(text: string): number;
  getMaxTokens(): number;
}

export interface ModelRequest {
  prompt: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
  stopSequences?: string[];
}

export interface ModelResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'error';
  tokenUsage: {
    prompt: number;
    completion: number;
  };
  latencyMs: number;
}

// Context builder configuration
export interface ContextBuilderConfig {
  maxSymbols: number;
  maxRecentEdits: number;
  maxDependencies: number;
  focusWindowLines: number;
  cacheTTLSeconds: number;
  
  // Performance tuning
  symbolSearchRadius: number; // Lines around cursor to search for symbols
  dependencyDepth: number; // How deep to traverse dependencies
  
  // Feature flags
  includeDocumentation: boolean;
  includeReferences: boolean;
  includeTypeInfo: boolean;
}

// Event types for context invalidation
export interface ContextEvent {
  type: 'file_changed' | 'file_added' | 'file_deleted' | 'project_opened' | 'dependencies_updated';
  filePath?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Cache management
export interface ContextCache {
  get(hash: string): ContextPack | null;
  set(hash: string, context: ContextPack): void;
  invalidate(pattern: string): void;
  clear(): void;
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}

// Ranking and filtering
export interface RankingHeuristic {
  name: string;
  weight: number;
  calculate(candidate: Candidate, context: ContextPack): number;
}

export interface FilterRule {
  name: string;
  priority: number;
  shouldFilter(candidate: Candidate, context: ContextPack): boolean;
  reason?: string;
}

// Telemetry events
export interface TelemetryEvent {
  name: string;
  timestamp: number;
  properties: Record<string, any>;
  metrics?: Record<string, number>;
}

// Error types
export class ContextBuildError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly filePath?: string
  ) {
    super(message);
    this.name = 'ContextBuildError';
  }
}

export class SuggestionError extends Error {
  constructor(
    message: string,
    public readonly requestId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SuggestionError';
  }
}

// Configuration validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}
