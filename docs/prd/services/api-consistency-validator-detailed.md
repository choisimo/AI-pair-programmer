# API Consistency Validator - 상세 제품 요구사항 문서

## 1. 개요

### 1.1 목적
API Consistency Validator는 RESTful API, GraphQL, gRPC 등 다양한 API 인터페이스의 일관성을 검증하고, 스키마 변경에 따른 브레이킹 체인지를 사전에 감지하는 시스템입니다.

### 1.2 핵심 가치
- API 계약의 일관성 보장
- 버전 간 호환성 검증
- 브레이킹 체인지 자동 감지
- API 문서와 구현의 동기화

## 2. 기능 요구사항

### 2.1 API 스키마 분석

#### 2.1.1 스키마 파서
```typescript
interface SchemaParser<T extends APISchema> {
  type: 'openapi' | 'graphql' | 'grpc' | 'asyncapi';
  
  // 스키마 파싱
  parse(source: string | object): T;
  
  // 스키마 검증
  validate(schema: T): ValidationResult;
  
  // 스키마 정규화
  normalize(schema: T): NormalizedSchema;
  
  // 버전 추출
  extractVersion(schema: T): SemanticVersion;
}

// OpenAPI 파서 구현
class OpenAPIParser implements SchemaParser<OpenAPISchema> {
  parse(source: string | object): OpenAPISchema {
    const spec = typeof source === 'string' ? 
      YAML.parse(source) : source;
    
    // OpenAPI 3.0 / 3.1 파싱
    return {
      openapi: spec.openapi,
      info: this.parseInfo(spec.info),
      servers: this.parseServers(spec.servers),
      paths: this.parsePaths(spec.paths),
      components: this.parseComponents(spec.components),
      security: this.parseSecurity(spec.security),
      tags: spec.tags,
      externalDocs: spec.externalDocs
    };
  }
  
  private parsePaths(paths: any): PathItems {
    const result: PathItems = new Map();
    
    for (const [path, methods] of Object.entries(paths)) {
      const pathItem: PathItem = {
        path,
        parameters: this.parseParameters(methods.parameters),
        operations: new Map()
      };
      
      // HTTP 메소드별 파싱
      for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']) {
        if (methods[method]) {
          pathItem.operations.set(method, this.parseOperation(methods[method]));
        }
      }
      
      result.set(path, pathItem);
    }
    
    return result;
  }
}
```

#### 2.1.2 스키마 저장소
```typescript
class SchemaRegistry {
  private schemas: Map<string, VersionedSchema[]> = new Map();
  private contracts: Map<string, APIContract> = new Map();
  
  // 스키마 등록
  register(apiId: string, schema: APISchema, version: string): void {
    const normalized = this.normalizeSchema(schema);
    const versionedSchema: VersionedSchema = {
      schema: normalized,
      version: parseSemanticVersion(version),
      timestamp: Date.now(),
      hash: this.calculateHash(normalized),
      metadata: {
        author: this.getCurrentUser(),
        source: this.detectSource(schema),
        tags: this.extractTags(schema)
      }
    };
    
    // 버전 체인에 추가
    if (!this.schemas.has(apiId)) {
      this.schemas.set(apiId, []);
    }
    
    this.schemas.get(apiId)!.push(versionedSchema);
    
    // 계약 업데이트
    this.updateContract(apiId, versionedSchema);
  }
  
  // 스키마 조회
  getSchema(apiId: string, version?: string): VersionedSchema | null {
    const schemas = this.schemas.get(apiId);
    if (!schemas) return null;
    
    if (version) {
      return schemas.find(s => s.version.toString() === version) || null;
    }
    
    // 최신 버전 반환
    return schemas[schemas.length - 1];
  }
  
  // 버전 히스토리
  getHistory(apiId: string): VersionHistory {
    const schemas = this.schemas.get(apiId) || [];
    
    return {
      apiId,
      versions: schemas.map(s => ({
        version: s.version.toString(),
        timestamp: s.timestamp,
        author: s.metadata.author,
        changes: this.summarizeChanges(s)
      }))
    };
  }
}
```

### 2.2 일관성 검증

#### 2.2.1 검증 엔진
```typescript
class ConsistencyValidator {
  private rules: ValidationRule[] = [];
  
  // 규칙 등록
  registerRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }
  
  // 일관성 검증
  async validate(schema: APISchema): Promise<ValidationReport> {
    const results: ValidationResult[] = [];
    
    for (const rule of this.rules) {
      if (rule.applies(schema)) {
        const result = await rule.validate(schema);
        results.push(result);
      }
    }
    
    return {
      schema: schema.id,
      timestamp: Date.now(),
      results,
      summary: this.summarizeResults(results),
      score: this.calculateScore(results)
    };
  }
  
  // 교차 API 검증
  async validateCrossAPI(apis: APISchema[]): Promise<CrossAPIReport> {
    const issues: ConsistencyIssue[] = [];
    
    // 네이밍 일관성
    issues.push(...this.checkNamingConsistency(apis));
    
    // 데이터 모델 일관성
    issues.push(...this.checkDataModelConsistency(apis));
    
    // 에러 처리 일관성
    issues.push(...this.checkErrorHandling(apis));
    
    // 인증/인가 일관성
    issues.push(...this.checkAuthConsistency(apis));
    
    return {
      apis: apis.map(a => a.id),
      issues,
      recommendations: this.generateRecommendations(issues)
    };
  }
}

// 검증 규칙 예시
class NamingConventionRule implements ValidationRule {
  name = 'naming_convention';
  severity: Severity = 'warning';
  
  applies(schema: APISchema): boolean {
    return true; // 모든 스키마에 적용
  }
  
  async validate(schema: APISchema): Promise<ValidationResult> {
    const violations: Violation[] = [];
    
    // 경로 네이밍 검사
    for (const path of schema.paths) {
      if (!this.isValidPath(path)) {
        violations.push({
          location: `paths.${path}`,
          message: `Path '${path}' does not follow REST conventions`,
          suggestion: this.suggestPath(path)
        });
      }
    }
    
    // 파라미터 네이밍 검사
    for (const param of schema.parameters) {
      if (!this.isValidParameterName(param.name)) {
        violations.push({
          location: `parameters.${param.name}`,
          message: `Parameter '${param.name}' should use camelCase`,
          suggestion: this.toCamelCase(param.name)
        });
      }
    }
    
    return {
      rule: this.name,
      passed: violations.length === 0,
      violations
    };
  }
}
```

#### 2.2.2 계약 검증
```typescript
class ContractValidator {
  // 계약 준수 검증
  validateContract(implementation: APIImplementation, contract: APIContract): ContractValidation {
    const violations: ContractViolation[] = [];
    
    // 엔드포인트 검증
    for (const endpoint of contract.endpoints) {
      const impl = implementation.findEndpoint(endpoint.path, endpoint.method);
      
      if (!impl) {
        violations.push({
          type: 'missing_endpoint',
          expected: endpoint,
          actual: null,
          severity: 'error'
        });
        continue;
      }
      
      // 요청 검증
      const requestViolations = this.validateRequest(impl.request, endpoint.request);
      violations.push(...requestViolations);
      
      // 응답 검증
      const responseViolations = this.validateResponse(impl.response, endpoint.response);
      violations.push(...responseViolations);
    }
    
    return {
      contract: contract.id,
      implementation: implementation.id,
      valid: violations.length === 0,
      violations,
      coverage: this.calculateCoverage(implementation, contract)
    };
  }
  
  // 요청 검증
  private validateRequest(actual: Request, expected: RequestContract): ContractViolation[] {
    const violations: ContractViolation[] = [];
    
    // 헤더 검증
    for (const header of expected.headers || []) {
      if (header.required && !actual.headers[header.name]) {
        violations.push({
          type: 'missing_header',
          path: `request.headers.${header.name}`,
          expected: header,
          actual: null
        });
      }
    }
    
    // 바디 스키마 검증
    if (expected.body) {
      const bodyValidation = this.validateSchema(actual.body, expected.body.schema);
      violations.push(...bodyValidation);
    }
    
    // 쿼리 파라미터 검증
    for (const param of expected.queryParams || []) {
      if (param.required && !actual.queryParams[param.name]) {
        violations.push({
          type: 'missing_query_param',
          path: `request.query.${param.name}`,
          expected: param,
          actual: null
        });
      }
    }
    
    return violations;
  }
}
```

### 2.3 브레이킹 체인지 감지

#### 2.3.1 Diff 엔진
```typescript
class APIDiffEngine {
  // 스키마 비교
  diff(oldSchema: APISchema, newSchema: APISchema): APIDiff {
    const diff: APIDiff = {
      breaking: [],
      nonBreaking: [],
      deprecated: [],
      additions: []
    };
    
    // 경로 비교
    const pathDiff = this.diffPaths(oldSchema.paths, newSchema.paths);
    diff.breaking.push(...pathDiff.breaking);
    diff.nonBreaking.push(...pathDiff.nonBreaking);
    
    // 모델 비교
    const modelDiff = this.diffModels(oldSchema.components, newSchema.components);
    diff.breaking.push(...modelDiff.breaking);
    diff.nonBreaking.push(...modelDiff.nonBreaking);
    
    // 보안 비교
    const securityDiff = this.diffSecurity(oldSchema.security, newSchema.security);
    diff.breaking.push(...securityDiff.breaking);
    
    return diff;
  }
  
  // 경로 비교
  private diffPaths(oldPaths: PathItems, newPaths: PathItems): PathDiff {
    const diff: PathDiff = {
      breaking: [],
      nonBreaking: []
    };
    
    // 제거된 경로 (브레이킹)
    for (const [path, oldItem] of oldPaths) {
      if (!newPaths.has(path)) {
        diff.breaking.push({
          type: 'removed_path',
          path,
          oldValue: oldItem,
          newValue: null,
          impact: 'high',
          migration: `Path '${path}' has been removed. Clients using this endpoint will fail.`
        });
      }
    }
    
    // 변경된 경로
    for (const [path, newItem] of newPaths) {
      const oldItem = oldPaths.get(path);
      
      if (oldItem) {
        // 오퍼레이션 비교
        for (const [method, oldOp] of oldItem.operations) {
          const newOp = newItem.operations.get(method);
          
          if (!newOp) {
            // 메소드 제거 (브레이킹)
            diff.breaking.push({
              type: 'removed_operation',
              path: `${path}.${method}`,
              oldValue: oldOp,
              newValue: null
            });
          } else {
            // 오퍼레이션 상세 비교
            const opDiff = this.diffOperation(oldOp, newOp);
            diff.breaking.push(...opDiff.breaking);
            diff.nonBreaking.push(...opDiff.nonBreaking);
          }
        }
        
        // 새로운 메소드 (논브레이킹)
        for (const [method, newOp] of newItem.operations) {
          if (!oldItem.operations.has(method)) {
            diff.nonBreaking.push({
              type: 'added_operation',
              path: `${path}.${method}`,
              oldValue: null,
              newValue: newOp
            });
          }
        }
      } else {
        // 새로운 경로 (논브레이킹)
        diff.nonBreaking.push({
          type: 'added_path',
          path,
          oldValue: null,
          newValue: newItem
        });
      }
    }
    
    return diff;
  }
}
```

#### 2.3.2 영향 분석
```typescript
class ImpactAnalyzer {
  // 브레이킹 체인지 영향 분석
  analyzeImpact(diff: APIDiff, usage: APIUsage): ImpactReport {
    const impacts: Impact[] = [];
    
    for (const change of diff.breaking) {
      const affectedClients = this.findAffectedClients(change, usage);
      
      impacts.push({
        change,
        severity: this.calculateSeverity(change, affectedClients),
        affectedClients,
        estimatedEffort: this.estimateFixEffort(change),
        migrationStrategy: this.suggestMigration(change),
        timeline: this.suggestTimeline(change, affectedClients)
      });
    }
    
    return {
      totalImpacts: impacts.length,
      criticalImpacts: impacts.filter(i => i.severity === 'critical'),
      impacts,
      summary: this.generateSummary(impacts),
      recommendations: this.generateRecommendations(impacts)
    };
  }
  
  // 클라이언트 영향 파악
  private findAffectedClients(change: BreakingChange, usage: APIUsage): Client[] {
    const affected: Client[] = [];
    
    for (const client of usage.clients) {
      // 클라이언트가 영향받는 엔드포인트 사용하는지 확인
      if (this.isClientAffected(client, change)) {
        affected.push(client);
      }
    }
    
    return affected;
  }
  
  // 마이그레이션 전략 제안
  private suggestMigration(change: BreakingChange): MigrationStrategy {
    switch (change.type) {
      case 'removed_path':
        return {
          strategy: 'redirect',
          steps: [
            'Add redirect from old path to new path',
            'Update client to use new path',
            'Remove redirect after all clients updated'
          ],
          example: this.generateRedirectExample(change)
        };
        
      case 'changed_response_type':
        return {
          strategy: 'versioning',
          steps: [
            'Support both response formats temporarily',
            'Add version header to differentiate',
            'Migrate clients to new format',
            'Deprecate old format'
          ],
          example: this.generateVersioningExample(change)
        };
        
      default:
        return {
          strategy: 'gradual',
          steps: this.generateGenericMigrationSteps(change)
        };
    }
  }
}
```

### 2.4 실시간 모니터링

#### 2.4.1 런타임 검증
```typescript
class RuntimeValidator {
  private interceptor: RequestInterceptor;
  private validator: SchemaValidator;
  
  // 요청/응답 가로채기 및 검증
  async interceptRequest(request: Request): Promise<ValidationResult> {
    const endpoint = this.matchEndpoint(request);
    
    if (!endpoint) {
      return {
        valid: false,
        error: 'Unknown endpoint'
      };
    }
    
    // 요청 검증
    const schema = await this.getSchema(endpoint);
    const validation = this.validator.validate(request, schema.request);
    
    if (!validation.valid) {
      // 검증 실패 로깅
      this.logValidationFailure(request, validation);
      
      // 메트릭 업데이트
      this.metrics.recordValidationFailure(endpoint);
    }
    
    return validation;
  }
  
  // 드리프트 감지
  detectDrift(actual: RuntimeBehavior, expected: APIContract): DriftReport {
    const drifts: Drift[] = [];
    
    // 응답 시간 드리프트
    if (actual.avgResponseTime > expected.sla.responseTime) {
      drifts.push({
        type: 'performance',
        metric: 'response_time',
        expected: expected.sla.responseTime,
        actual: actual.avgResponseTime,
        deviation: (actual.avgResponseTime - expected.sla.responseTime) / expected.sla.responseTime
      });
    }
    
    // 에러율 드리프트
    if (actual.errorRate > expected.sla.errorRate) {
      drifts.push({
        type: 'reliability',
        metric: 'error_rate',
        expected: expected.sla.errorRate,
        actual: actual.errorRate
      });
    }
    
    // 스키마 드리프트
    for (const violation of actual.schemaViolations) {
      drifts.push({
        type: 'schema',
        path: violation.path,
        expected: violation.expected,
        actual: violation.actual
      });
    }
    
    return {
      contract: expected.id,
      period: actual.period,
      drifts,
      severity: this.calculateDriftSeverity(drifts)
    };
  }
}
```

## 3. 통합 요구사항

### 3.1 개발 도구 통합

#### 3.1.1 IDE 플러그인
```typescript
interface IDEPlugin {
  // 실시간 검증
  validateOnSave(document: TextDocument): Promise<ValidationResult>;
  
  // 인라인 경고
  provideInlineWarnings(document: TextDocument): InlineWarning[];
  
  // 자동 완성
  provideCompletions(position: Position): CompletionItem[];
  
  // 코드 액션
  provideCodeActions(range: Range): CodeAction[];
  
  // 호버 정보
  provideHover(position: Position): Hover;
}
```

#### 3.1.2 CI/CD 통합
```typescript
class CIPipeline {
  // 빌드 시 검증
  async validateBuild(config: BuildConfig): Promise<BuildValidation> {
    const schemas = await this.collectSchemas(config.sourceDir);
    const results: ValidationResult[] = [];
    
    for (const schema of schemas) {
      // 스키마 검증
      const validation = await this.validator.validate(schema);
      results.push(validation);
      
      // 이전 버전과 비교
      const previous = await this.getPreviousVersion(schema);
      if (previous) {
        const diff = await this.diffEngine.diff(previous, schema);
        
        // 브레이킹 체인지 확인
        if (diff.breaking.length > 0) {
          results.push({
            type: 'breaking_change',
            errors: diff.breaking,
            severity: 'error'
          });
        }
      }
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      artifacts: this.generateArtifacts(results)
    };
  }
}
```

## 4. 보고 및 분석

### 4.1 대시보드
```typescript
interface APIHealthDashboard {
  // 전체 상태
  overview: {
    totalAPIs: number;
    healthScore: number;
    criticalIssues: number;
    warnings: number;
  };
  
  // API별 상태
  apiStatus: Map<string, {
    health: 'healthy' | 'warning' | 'critical';
    consistency: number;
    coverage: number;
    lastUpdated: Date;
  }>;
  
  // 트렌드
  trends: {
    consistencyTrend: DataPoint[];
    breakingChanges: DataPoint[];
    validationFailures: DataPoint[];
  };
  
  // 상세 리포트
  reports: Report[];
}
```

### 4.2 알림 시스템
```typescript
class AlertingSystem {
  private channels: NotificationChannel[] = [];
  
  // 알림 규칙
  rules: AlertRule[] = [
    {
      name: 'breaking_change_detected',
      condition: (event) => event.type === 'breaking_change',
      severity: 'critical',
      channels: ['email', 'slack'],
      template: 'breaking-change-alert'
    },
    {
      name: 'consistency_degradation',
      condition: (event) => event.consistencyScore < 0.8,
      severity: 'warning',
      channels: ['slack'],
      template: 'consistency-warning'
    }
  ];
  
  // 알림 전송
  async sendAlert(event: Event): Promise<void> {
    const matchingRules = this.rules.filter(r => r.condition(event));
    
    for (const rule of matchingRules) {
      const alert = this.createAlert(event, rule);
      
      for (const channelName of rule.channels) {
        const channel = this.channels.find(c => c.name === channelName);
        await channel?.send(alert);
      }
    }
  }
}
```

## 5. 성능 요구사항

### 5.1 응답 시간
- 스키마 파싱: < 100ms (10KB 파일)
- 일관성 검증: < 500ms
- Diff 생성: < 200ms
- 영향 분석: < 1s

### 5.2 확장성
- 동시 API 처리: 1000+
- 스키마 저장소 크기: 100GB+
- 일일 검증 요청: 1M+

## 6. 보안 요구사항

### 6.1 접근 제어
- API별 권한 관리
- 역할 기반 접근 제어 (RBAC)
- 감사 로깅

### 6.2 데이터 보호
- 민감 정보 마스킹
- 암호화된 저장
- 안전한 전송

## 7. 테스트 요구사항

### 7.1 검증 정확도
- False positive rate: < 5%
- False negative rate: < 1%
- 브레이킹 체인지 감지율: > 99%

### 7.2 테스트 커버리지
- 단위 테스트: > 90%
- 통합 테스트: > 80%
- E2E 테스트: > 70%
