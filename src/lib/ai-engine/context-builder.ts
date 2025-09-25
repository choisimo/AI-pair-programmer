/**
 * Context Builder Implementation
 * Implements TASK-002: 증분 컨텍스트 빌드 파이프라인 구현
 */

import { createHash } from 'crypto';
import { 
  ContextPack, 
  ContextBuilderConfig, 
  ContextEvent, 
  ContextCache,
  EditDelta,
  SymbolMeta,
  DependencyEdge,
  CodeSlice,
  Position,
  Range,
  ContextBuildError,
  Logger,
  TelemetryEvent
} from './types';
import { parserConfig } from '@/config/environment';

export class ContextBuilder {
  private cache: ContextCache;
  private config: ContextBuilderConfig;
  private logger: Logger;
  private eventBuffer: ContextEvent[] = [];
  private isBuilding = false;

  constructor(
    cache: ContextCache,
    config: ContextBuilderConfig,
    logger: Logger
  ) {
    this.cache = cache;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Build context pack for AI suggestion
   * Implements 300ms SLA requirement
   */
  async buildContext(
    filePath: string,
    cursor: Position,
    visibleRegion?: Range
  ): Promise<ContextPack> {
    const startTime = Date.now();
    
    try {
      this.isBuilding = true;
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(filePath, cursor, visibleRegion);
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isCacheStale(cached)) {
        this.logger.debug('Context cache hit', { cacheKey, age: Date.now() - cached.createdAt });
        return cached;
      }

      // Build new context
      const context = await this.buildNewContext(filePath, cursor, visibleRegion, startTime);
      
      // Cache the result
      this.cache.set(cacheKey, context);
      
      // Emit telemetry
      this.emitTelemetry('context_built', {
        filePath,
        buildTimeMs: context.stats.buildTimeMs,
        symbolCount: context.stats.symbolCount,
        cacheHit: false
      });

      return context;
      
    } catch (error) {
      this.logger.error('Context build failed', error as Error, { filePath, cursor });
      throw new ContextBuildError(
        `Failed to build context for ${filePath}`,
        error as Error,
        filePath
      );
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Process edit events and update context incrementally
   */
  async processEditEvent(event: ContextEvent): Promise<void> {
    this.eventBuffer.push(event);
    
    // Batch process events to avoid thrashing
    if (this.eventBuffer.length >= 10 || this.shouldFlushBuffer()) {
      await this.flushEventBuffer();
    }
  }

  /**
   * Invalidate context cache based on file changes
   */
  invalidateContext(filePath: string): void {
    const pattern = this.createInvalidationPattern(filePath);
    this.cache.invalidate(pattern);
    this.logger.debug('Context invalidated', { filePath, pattern });
  }

  private async buildNewContext(
    filePath: string,
    cursor: Position,
    visibleRegion: Range | undefined,
    startTime: number
  ): Promise<ContextPack> {
    
    // Step 1: Extract focus window (current file content around cursor)
    const focusWindow = await this.extractFocusWindow(filePath, cursor, visibleRegion);
    
    // Step 2: Gather symbols in the vicinity
    const symbols = await this.gatherSymbols(filePath, cursor);
    
    // Step 3: Build dependency graph
    const dependencies = await this.buildDependencyGraph(symbols, filePath);
    
    // Step 4: Collect recent edits
    const recentEdits = await this.collectRecentEdits(filePath);
    
    // Step 5: Generate context hash
    const hash = this.generateContextHash(focusWindow, symbols, dependencies, recentEdits);
    
    const buildTimeMs = Date.now() - startTime;
    
    const context: ContextPack = {
      hash,
      createdAt: Date.now(),
      ttl: this.config.cacheTTLSeconds,
      symbols: symbols.slice(0, this.config.maxSymbols),
      recentEdits: recentEdits.slice(0, this.config.maxRecentEdits),
      dependencyGraph: dependencies.slice(0, this.config.maxDependencies),
      focusWindow,
      language: this.detectLanguage(filePath),
      projectRoot: await this.findProjectRoot(filePath),
      stats: {
        symbolCount: symbols.length,
        editCount: recentEdits.length,
        dependencyCount: dependencies.length,
        buildTimeMs
      }
    };

    // Validate SLA
    if (buildTimeMs > 300) {
      this.logger.warn('Context build exceeded SLA', { 
        buildTimeMs, 
        filePath,
        symbolCount: symbols.length 
      });
    }

    return context;
  }

  private async extractFocusWindow(
    filePath: string,
    cursor: Position,
    visibleRegion?: Range
  ): Promise<CodeSlice> {
    // Read file content (this would integrate with file system or editor API)
    const content = await this.readFileContent(filePath);
    
    // Determine focus range
    const lines = content.split('\n');
    const halfWindow = Math.floor(this.config.focusWindowLines / 2);
    
    const startLine = Math.max(0, cursor.line - halfWindow);
    const endLine = Math.min(lines.length - 1, cursor.line + halfWindow);
    
    // If visible region is provided, expand to include it
    const finalStartLine = visibleRegion 
      ? Math.min(startLine, visibleRegion.start.line)
      : startLine;
    const finalEndLine = visibleRegion
      ? Math.max(endLine, visibleRegion.end.line)
      : endLine;
    
    const focusContent = lines.slice(finalStartLine, finalEndLine + 1).join('\n');
    
    return {
      filePath,
      content: focusContent,
      range: {
        start: { line: finalStartLine, character: 0 },
        end: { line: finalEndLine, character: lines[finalEndLine]?.length || 0 }
      },
      language: this.detectLanguage(filePath)
    };
  }

  private async gatherSymbols(filePath: string, cursor: Position): Promise<SymbolMeta[]> {
    // This would integrate with the AST parser from code-analysis-pipeline
    // For now, return mock data structure
    const symbols: SymbolMeta[] = [];
    
    // Search radius around cursor
    const searchStart = Math.max(0, cursor.line - this.config.symbolSearchRadius);
    const searchEnd = cursor.line + this.config.symbolSearchRadius;
    
    // Integrate with AST parser from code-analysis-pipeline
    // Implementation pending TASK-006: AST 델타 생성기 구현
    
    return symbols;
  }

  private async buildDependencyGraph(
    symbols: SymbolMeta[],
    filePath: string
  ): Promise<DependencyEdge[]> {
    const dependencies: DependencyEdge[] = [];
    
    // Build edges between symbols
    for (const symbol of symbols) {
      for (const dep of symbol.dependencies) {
        dependencies.push({
          from: symbol.name,
          to: dep,
          type: 'references',
          weight: 1.0
        });
      }
    }
    
    // Add import/export relationships (TASK-010)
    // Add call graph analysis (TASK-007)
    
    return dependencies;
  }

  private async collectRecentEdits(filePath: string): Promise<EditDelta[]> {
    // This would integrate with edit tracking system
    // Return recent edits for the file and related files
    return [];
  }

  private generateCacheKey(
    filePath: string,
    cursor: Position,
    visibleRegion?: Range
  ): string {
    const keyData = {
      filePath,
      cursor,
      visibleRegion,
      configHash: this.getConfigHash()
    };
    
    return createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16);
  }

  private generateContextHash(
    focusWindow: CodeSlice,
    symbols: SymbolMeta[],
    dependencies: DependencyEdge[],
    recentEdits: EditDelta[]
  ): string {
    const hashData = {
      focusContent: focusWindow.content,
      symbolNames: symbols.map(s => s.name).sort(),
      dependencyCount: dependencies.length,
      editCount: recentEdits.length,
      timestamp: Math.floor(Date.now() / 1000) // Round to second for cache stability
    };
    
    return createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex')
      .substring(0, 32);
  }

  private isCacheStale(context: ContextPack): boolean {
    const age = (Date.now() - context.createdAt) / 1000;
    return age > context.ttl;
  }

  private shouldFlushBuffer(): boolean {
    if (this.eventBuffer.length === 0) return false;
    
    const oldestEvent = this.eventBuffer[0];
    const age = Date.now() - oldestEvent.timestamp;
    
    // Flush if oldest event is more than 1 second old
    return age > 1000;
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;
    
    const events = [...this.eventBuffer];
    this.eventBuffer = [];
    
    // Process file change events
    const fileChanges = events.filter(e => 
      e.type === 'file_changed' || e.type === 'file_deleted'
    );
    
    for (const event of fileChanges) {
      if (event.filePath) {
        this.invalidateContext(event.filePath);
      }
    }
    
    this.logger.debug('Processed edit events', { 
      eventCount: events.length,
      fileChanges: fileChanges.length 
    });
  }

  private createInvalidationPattern(filePath: string): string {
    // Create pattern to match cache keys for this file
    return `*${filePath}*`;
  }

  private detectLanguage(filePath: string): ContextPack['language'] {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'go':
        return 'go';
      default:
        return 'typescript'; // Default fallback
    }
  }

  private async findProjectRoot(filePath: string): Promise<string> {
    // Walk up directory tree to find package.json, tsconfig.json, etc.
    // For now, return a placeholder
    return '/workspace/project';
  }

  private async readFileContent(filePath: string): Promise<string> {
    // This would integrate with file system or editor API
    // For now, return placeholder
    return '// File content placeholder';
  }

  private getConfigHash(): string {
    return createHash('sha256')
      .update(JSON.stringify(this.config))
      .digest('hex')
      .substring(0, 8);
  }

  private emitTelemetry(eventName: string, properties: Record<string, any>): void {
    const event: TelemetryEvent = {
      name: eventName,
      timestamp: Date.now(),
      properties,
      metrics: {
        build_time_ms: properties.buildTimeMs,
        symbol_count: properties.symbolCount
      }
    };
    
    // Send to telemetry system (TASK-034)
    this.logger.debug('Telemetry event', event);
  }
}

// In-memory cache implementation
export class InMemoryContextCache implements ContextCache {
  private cache = new Map<string, ContextPack>();
  private accessTimes = new Map<string, number>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(hash: string): ContextPack | null {
    const context = this.cache.get(hash);
    
    if (context) {
      this.accessTimes.set(hash, Date.now());
      this.hits++;
      return context;
    }
    
    this.misses++;
    return null;
  }

  set(hash: string, context: ContextPack): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(hash, context);
    this.accessTimes.set(hash, Date.now());
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  private estimateMemoryUsage(): number {
    let total = 0;
    
    for (const context of this.cache.values()) {
      // Rough estimation in bytes
      total += JSON.stringify(context).length * 2; // UTF-16 encoding
    }
    
    return total;
  }
}

// Factory function
export function createContextBuilder(
  config: Partial<ContextBuilderConfig> = {},
  logger: Logger
): ContextBuilder {
  const defaultConfig: ContextBuilderConfig = {
    maxSymbols: 50,
    maxRecentEdits: 20,
    maxDependencies: 100,
    focusWindowLines: 50,
    cacheTTLSeconds: parserConfig.astDeltaTTL,
    symbolSearchRadius: 25,
    dependencyDepth: 3,
    includeDocumentation: true,
    includeReferences: true,
    includeTypeInfo: true
  };

  const finalConfig = { ...defaultConfig, ...config };
  const cache = new InMemoryContextCache();
  
  return new ContextBuilder(cache, finalConfig, logger);
}
