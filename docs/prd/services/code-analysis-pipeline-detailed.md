# Code Analysis Pipeline - 상세 제품 요구사항 문서

## 1. 개요

### 1.1 목적
Code Analysis Pipeline은 소스 코드를 실시간으로 분석하여 구조적 정보를 추출하고, AI 엔진이 활용할 수 있는 형태로 변환하는 시스템입니다.

### 1.2 핵심 기능
- 다중 언어 AST(Abstract Syntax Tree) 파싱
- 증분 파싱 및 델타 생성
- 심볼 그래프 구축 및 관리
- 의존성 분석 및 타입 추론

## 2. 기능 요구사항

### 2.1 AST 파서 시스템

#### 2.1.1 언어별 파서 어댑터
```typescript
interface LanguageParser {
  language: SupportedLanguage;
  version: string;
  
  // 전체 파싱
  parse(source: string, options?: ParseOptions): AST;
  
  // 증분 파싱
  parseIncremental(params: {
    previousAST: AST;
    edits: TextEdit[];
    source: string;
  }): IncrementalParseResult;
  
  // 에러 복구
  parseWithRecovery(source: string): {
    ast: AST;
    errors: ParseError[];
    recoveries: Recovery[];
  };
  
  // 성능 최적화
  parseAsync(source: string): Promise<AST>;
  parseStreaming(stream: ReadableStream): AsyncIterator<ASTNode>;
}

// 지원 언어 및 파서 매핑
const parserRegistry = new Map<SupportedLanguage, LanguageParser>([
  ['typescript', new TypeScriptParser()],
  ['javascript', new JavaScriptParser()],
  ['python', new PythonParser()],
  ['go', new GoParser()],
  ['rust', new RustParser()],
  ['java', new JavaParser()],
  ['csharp', new CSharpParser()],
]);
```

#### 2.1.2 AST 노드 정의
```typescript
interface ASTNode {
  type: NodeType;
  range: Range;
  
  // 노드 속성
  properties: Map<string, any>;
  
  // 자식 노드
  children: ASTNode[];
  
  // 부모 참조
  parent?: ASTNode;
  
  // 의미 정보
  semantic?: {
    symbol?: Symbol;
    type?: Type;
    scope?: Scope;
    modifiers?: Modifier[];
  };
  
  // 방문자 패턴
  accept<T>(visitor: ASTVisitor<T>): T;
  
  // 유틸리티
  findAncestor(predicate: (node: ASTNode) => boolean): ASTNode | null;
  findDescendants(predicate: (node: ASTNode) => boolean): ASTNode[];
  getPath(): ASTNode[];
}

// 노드 타입 계층
enum NodeType {
  // 구조적 노드
  Program = 'Program',
  Module = 'Module',
  Block = 'Block',
  
  // 선언 노드
  FunctionDeclaration = 'FunctionDeclaration',
  ClassDeclaration = 'ClassDeclaration',
  VariableDeclaration = 'VariableDeclaration',
  TypeDeclaration = 'TypeDeclaration',
  InterfaceDeclaration = 'InterfaceDeclaration',
  
  // 표현식 노드
  CallExpression = 'CallExpression',
  MemberExpression = 'MemberExpression',
  BinaryExpression = 'BinaryExpression',
  ConditionalExpression = 'ConditionalExpression',
  
  // 리터럴 노드
  StringLiteral = 'StringLiteral',
  NumberLiteral = 'NumberLiteral',
  BooleanLiteral = 'BooleanLiteral',
  
  // 제어 흐름
  IfStatement = 'IfStatement',
  ForStatement = 'ForStatement',
  WhileStatement = 'WhileStatement',
  SwitchStatement = 'SwitchStatement',
  ReturnStatement = 'ReturnStatement',
}
```

### 2.2 증분 파싱 엔진

#### 2.2.1 델타 생성기
```typescript
class DeltaGenerator {
  // 텍스트 변경을 AST 변경으로 변환
  generateDelta(params: {
    oldAST: AST;
    newAST: AST;
    textEdits: TextEdit[];
  }): ASTDelta {
    const delta: ASTDelta = {
      added: [],
      removed: [],
      modified: [],
      moved: []
    };
    
    // 1. 텍스트 편집 영향 범위 계산
    const affectedRanges = this.calculateAffectedRanges(textEdits);
    
    // 2. 영향받은 노드 식별
    const affectedNodes = this.findAffectedNodes(oldAST, affectedRanges);
    
    // 3. 노드별 변경 타입 분류
    for (const node of affectedNodes) {
      const changeType = this.classifyChange(node, oldAST, newAST);
      
      switch (changeType) {
        case 'added':
          delta.added.push(this.createAddition(node));
          break;
        case 'removed':
          delta.removed.push(this.createRemoval(node));
          break;
        case 'modified':
          delta.modified.push(this.createModification(node, oldAST, newAST));
          break;
        case 'moved':
          delta.moved.push(this.createMovement(node, oldAST, newAST));
          break;
      }
    }
    
    // 4. 델타 최적화
    return this.optimizeDelta(delta);
  }
  
  // 델타 적용
  applyDelta(ast: AST, delta: ASTDelta): AST {
    const newAST = this.cloneAST(ast);
    
    // 순서대로 적용 (removed → modified → moved → added)
    for (const removal of delta.removed) {
      this.removeNode(newAST, removal.nodeId);
    }
    
    for (const modification of delta.modified) {
      this.modifyNode(newAST, modification);
    }
    
    for (const movement of delta.moved) {
      this.moveNode(newAST, movement);
    }
    
    for (const addition of delta.added) {
      this.addNode(newAST, addition);
    }
    
    return newAST;
  }
}
```

#### 2.2.2 증분 파싱 캐시
```typescript
class IncrementalParseCache {
  private cache: LRUCache<string, CachedParseResult>;
  private dependencies: DependencyGraph;
  
  // 캐시 조회
  get(fileId: string, version: number): CachedParseResult | null {
    const key = `${fileId}:${version}`;
    const cached = this.cache.get(key);
    
    if (cached && this.isValid(cached)) {
      return cached;
    }
    
    return null;
  }
  
  // 캐시 저장
  set(fileId: string, version: number, result: ParseResult): void {
    const key = `${fileId}:${version}`;
    
    const cached: CachedParseResult = {
      ...result,
      timestamp: Date.now(),
      dependencies: this.extractDependencies(result.ast)
    };
    
    this.cache.set(key, cached);
    this.updateDependencyGraph(fileId, cached.dependencies);
  }
  
  // 무효화
  invalidate(fileId: string): void {
    // 직접 무효화
    this.cache.delete(`${fileId}:*`);
    
    // 의존성 기반 무효화
    const dependents = this.dependencies.getDependents(fileId);
    for (const dependent of dependents) {
      this.invalidate(dependent);
    }
  }
}
```

### 2.3 심볼 그래프

#### 2.3.1 심볼 추출기
```typescript
class SymbolExtractor {
  // AST에서 심볼 추출
  extractSymbols(ast: AST): Symbol[] {
    const symbols: Symbol[] = [];
    
    const visitor: ASTVisitor<void> = {
      visitFunctionDeclaration: (node) => {
        symbols.push(this.createFunctionSymbol(node));
      },
      
      visitClassDeclaration: (node) => {
        symbols.push(this.createClassSymbol(node));
        
        // 멤버 심볼 추출
        for (const member of node.members) {
          symbols.push(this.createMemberSymbol(member, node));
        }
      },
      
      visitVariableDeclaration: (node) => {
        symbols.push(this.createVariableSymbol(node));
      },
      
      visitTypeDeclaration: (node) => {
        symbols.push(this.createTypeSymbol(node));
      }
    };
    
    ast.accept(visitor);
    return symbols;
  }
  
  // 심볼 생성
  private createSymbol(node: ASTNode, kind: SymbolKind): Symbol {
    return {
      id: this.generateSymbolId(node),
      name: this.extractName(node),
      kind,
      
      // 위치 정보
      location: {
        file: node.file,
        range: node.range
      },
      
      // 시그니처
      signature: this.extractSignature(node),
      
      // 타입 정보
      type: this.inferType(node),
      
      // 접근 제어
      visibility: this.extractVisibility(node),
      modifiers: this.extractModifiers(node),
      
      // 문서화
      documentation: this.extractDocumentation(node),
      
      // 관계
      parent: this.findParentSymbol(node),
      children: [],
      references: [],
      dependencies: []
    };
  }
}
```

#### 2.3.2 그래프 빌더
```typescript
class GraphBuilder {
  private graph: SymbolGraph;
  
  // 그래프 구축
  buildGraph(symbols: Symbol[]): SymbolGraph {
    this.graph = new SymbolGraph();
    
    // 1. 노드 추가
    for (const symbol of symbols) {
      this.graph.addNode(symbol);
    }
    
    // 2. 엣지 추가 (관계 분석)
    for (const symbol of symbols) {
      // 상속 관계
      if (symbol.extends) {
        this.graph.addEdge({
          from: symbol.id,
          to: symbol.extends,
          type: 'extends'
        });
      }
      
      // 구현 관계
      for (const impl of symbol.implements || []) {
        this.graph.addEdge({
          from: symbol.id,
          to: impl,
          type: 'implements'
        });
      }
      
      // 참조 관계
      for (const ref of symbol.references) {
        this.graph.addEdge({
          from: symbol.id,
          to: ref,
          type: 'references'
        });
      }
      
      // 의존성 관계
      for (const dep of symbol.dependencies) {
        this.graph.addEdge({
          from: symbol.id,
          to: dep,
          type: 'depends_on'
        });
      }
    }
    
    // 3. 그래프 분석
    this.analyzeGraph();
    
    return this.graph;
  }
  
  // 그래프 분석
  private analyzeGraph(): void {
    // 중심성 계산
    this.calculateCentrality();
    
    // 클러스터링
    this.detectClusters();
    
    // 순환 의존성 감지
    this.detectCycles();
    
    // 중요도 계산
    this.calculateImportance();
  }
}
```

### 2.4 의존성 분석

#### 2.4.1 의존성 추적기
```typescript
class DependencyTracker {
  // import/export 분석
  analyzeImports(ast: AST): ImportAnalysis {
    const imports: Import[] = [];
    const exports: Export[] = [];
    
    ast.accept({
      visitImportDeclaration: (node) => {
        imports.push({
          source: node.source,
          specifiers: node.specifiers,
          type: node.importType,
          range: node.range
        });
      },
      
      visitExportDeclaration: (node) => {
        exports.push({
          specifiers: node.specifiers,
          source: node.source,
          type: node.exportType,
          range: node.range
        });
      }
    });
    
    return { imports, exports };
  }
  
  // 타입 의존성 분석
  analyzeTypeDependencies(symbol: Symbol): TypeDependency[] {
    const dependencies: TypeDependency[] = [];
    
    // 파라미터 타입
    for (const param of symbol.parameters || []) {
      if (param.type) {
        dependencies.push({
          symbol: symbol.id,
          dependsOn: param.type,
          kind: 'parameter'
        });
      }
    }
    
    // 반환 타입
    if (symbol.returnType) {
      dependencies.push({
        symbol: symbol.id,
        dependsOn: symbol.returnType,
        kind: 'return'
      });
    }
    
    // 제네릭 제약
    for (const generic of symbol.generics || []) {
      if (generic.constraint) {
        dependencies.push({
          symbol: symbol.id,
          dependsOn: generic.constraint,
          kind: 'generic_constraint'
        });
      }
    }
    
    return dependencies;
  }
}
```

## 3. 성능 요구사항

### 3.1 파싱 성능
```typescript
interface ParsingPerformanceRequirements {
  // 파일 크기별 목표
  small: {  // < 1KB
    fullParse: 10,      // ms
    incremental: 2      // ms
  };
  
  medium: { // 1KB - 100KB
    fullParse: 100,     // ms
    incremental: 20     // ms
  };
  
  large: {  // 100KB - 1MB
    fullParse: 500,     // ms
    incremental: 50     // ms
  };
  
  // 메모리 사용
  memoryPerFile: 10;     // MB
  cacheSize: 256;        // MB
  
  // 동시 처리
  concurrentFiles: 10;
  
  // 캐시 효율
  cacheHitRate: 0.8;    // 80%
}
```

### 3.2 최적화 전략

#### 3.2.1 병렬 처리
```typescript
class ParallelParser {
  private workerPool: WorkerPool;
  
  async parseFiles(files: File[]): Promise<ParseResult[]> {
    // 파일을 청크로 분할
    const chunks = this.chunkFiles(files);
    
    // 병렬 파싱
    const promises = chunks.map(chunk => 
      this.workerPool.execute('parse', chunk)
    );
    
    // 결과 수집
    const results = await Promise.all(promises);
    
    // 결과 병합
    return this.mergeResults(results);
  }
  
  private chunkFiles(files: File[]): File[][] {
    const chunkSize = Math.ceil(files.length / this.workerPool.size);
    const chunks: File[][] = [];
    
    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
}
```

#### 3.2.2 지연 파싱
```typescript
class LazyParser {
  // 필요할 때만 파싱
  parseOnDemand(file: File): LazyAST {
    return new Proxy({}, {
      get: (target, prop) => {
        if (!target[prop]) {
          // 해당 부분만 파싱
          target[prop] = this.parseSection(file, prop);
        }
        return target[prop];
      }
    });
  }
  
  // 점진적 파싱
  async *parseProgressive(file: File): AsyncGenerator<PartialAST> {
    const chunks = this.splitIntoChunks(file);
    
    for (const chunk of chunks) {
      const partialAST = await this.parseChunk(chunk);
      yield partialAST;
      
      // UI 업데이트 기회 제공
      await this.yieldControl();
    }
  }
}
```

## 4. 언어별 특수 처리

### 4.1 TypeScript/JavaScript
```typescript
interface TypeScriptSpecificFeatures {
  // 타입 추론
  typeInference: {
    enabled: boolean;
    depth: number;
    timeout: number;
  };
  
  // JSX 처리
  jsx: {
    enabled: boolean;
    pragma: string;
    pragmaFrag: string;
  };
  
  // 데코레이터
  decorators: {
    enabled: boolean;
    legacy: boolean;
  };
  
  // 모듈 해석
  moduleResolution: 'node' | 'classic' | 'node16' | 'nodenext';
  
  // 경로 매핑
  paths: Map<string, string[]>;
}
```

### 4.2 Python
```typescript
interface PythonSpecificFeatures {
  // 타입 힌트
  typeHints: {
    enabled: boolean;
    strict: boolean;
  };
  
  // 비동기 처리
  async: {
    enabled: boolean;
    syntax: 'async/await' | 'asyncio';
  };
  
  // 데코레이터
  decorators: {
    enabled: boolean;
  };
  
  // 버전별 처리
  version: '2.7' | '3.6' | '3.7' | '3.8' | '3.9' | '3.10' | '3.11';
}
```

## 5. 에러 처리 및 복구

### 5.1 에러 복구 전략
```typescript
class ErrorRecoveryStrategy {
  // 구문 오류 복구
  recoverFromSyntaxError(error: SyntaxError, context: ParseContext): Recovery {
    switch (error.type) {
      case 'missing_semicolon':
        return this.insertSemicolon(error.position);
        
      case 'unclosed_brace':
        return this.closeBrace(error.position);
        
      case 'unexpected_token':
        return this.skipToken(error.position);
        
      default:
        return this.skipToNextStatement(error.position);
    }
  }
  
  // 부분 AST 구축
  buildPartialAST(source: string, errors: ParseError[]): PartialAST {
    const ast = new PartialAST();
    
    // 에러 영역 표시
    for (const error of errors) {
      ast.addErrorNode({
        range: error.range,
        message: error.message,
        recovery: error.recovery
      });
    }
    
    // 유효한 부분 파싱
    const validRanges = this.findValidRanges(source, errors);
    for (const range of validRanges) {
      const partialNode = this.parseRange(source, range);
      ast.addNode(partialNode);
    }
    
    return ast;
  }
}
```

## 6. 테스트 요구사항

### 6.1 파서 테스트
```typescript
describe('LanguageParser', () => {
  // 정확성 테스트
  describe('correctness', () => {
    test('should parse valid syntax correctly', () => {
      const cases = loadTestCases('valid');
      for (const testCase of cases) {
        const ast = parser.parse(testCase.source);
        expect(ast).toMatchSnapshot(testCase.expectedAST);
      }
    });
    
    test('should handle syntax errors gracefully', () => {
      const cases = loadTestCases('invalid');
      for (const testCase of cases) {
        const result = parser.parseWithRecovery(testCase.source);
        expect(result.errors).toHaveLength(testCase.expectedErrors);
      }
    });
  });
  
  // 성능 테스트
  describe('performance', () => {
    test('should meet parsing speed requirements', () => {
      const file = loadLargeFile();
      const startTime = performance.now();
      parser.parse(file);
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(500); // ms
    });
    
    test('incremental parsing should be faster', () => {
      const { oldAST, edits } = setupIncrementalTest();
      const startTime = performance.now();
      parser.parseIncremental({ oldAST, edits });
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(50); // ms
    });
  });
});
```

## 7. 통합 요구사항

### 7.1 IDE 통합
```typescript
interface IDEIntegration {
  // 실시간 파싱
  onDidChangeTextDocument(event: TextDocumentChangeEvent): void;
  
  // 진단 제공
  provideDiagnostics(document: TextDocument): Diagnostic[];
  
  // 심볼 제공
  provideDocumentSymbols(document: TextDocument): SymbolInformation[];
  
  // 정의 이동
  provideDefinition(position: Position): Location[];
  
  // 참조 찾기
  provideReferences(position: Position): Location[];
  
  // 호버 정보
  provideHover(position: Position): Hover;
}
```

### 7.2 API 인터페이스
```typescript
interface CodeAnalysisAPI {
  // 파일 분석
  analyzeFile(file: string, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  // 프로젝트 분석
  analyzeProject(root: string, options?: ProjectOptions): Promise<ProjectAnalysis>;
  
  // 실시간 업데이트
  watchFile(file: string, callback: (delta: ASTDelta) => void): Disposable;
  
  // 심볼 검색
  searchSymbols(query: string, scope?: SearchScope): Symbol[];
  
  // 의존성 그래프
  getDependencyGraph(scope?: GraphScope): DependencyGraph;
}
```

## 8. 모니터링 및 디버깅

### 8.1 메트릭 수집
```typescript
interface AnalysisMetrics {
  // 파싱 메트릭
  parsing: {
    filesAnalyzed: number;
    totalParseTime: number;
    averageParseTime: number;
    incrementalParseRatio: number;
    cacheHitRate: number;
  };
  
  // 심볼 메트릭
  symbols: {
    totalSymbols: number;
    symbolsByType: Map<SymbolKind, number>;
    averageSymbolsPerFile: number;
  };
  
  // 에러 메트릭
  errors: {
    syntaxErrors: number;
    recoveries: number;
    failedParses: number;
  };
  
  // 성능 메트릭
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    cacheMemory: number;
  };
}
```

### 8.2 디버그 도구
```typescript
class AnalysisDebugger {
  // AST 시각화
  visualizeAST(ast: AST): string {
    // GraphViz DOT 형식으로 출력
    return this.toDOT(ast);
  }
  
  // 심볼 그래프 시각화
  visualizeSymbolGraph(graph: SymbolGraph): string {
    // D3.js 호환 JSON 출력
    return this.toD3JSON(graph);
  }
  
  // 파싱 트레이스
  traceParser(source: string): ParserTrace {
    return {
      steps: this.recordParsingSteps(source),
      decisions: this.recordParsingDecisions(source),
      backtracking: this.recordBacktracking(source)
    };
  }
}
```
