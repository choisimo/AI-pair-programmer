# Testing & Quality - 상세 제품 요구사항 문서

## 1. 개요

### 1.1 목적
Testing & Quality 서비스는 코드 품질을 보장하고, 자동화된 테스트를 통해 버그를 사전에 발견하며, 지속적인 품질 개선을 추진하는 포괄적인 품질 관리 시스템을 제공합니다.

### 1.2 핵심 목표
- 포괄적인 테스트 커버리지 달성
- 자동화된 품질 게이트
- 지속적인 품질 메트릭 추적
- 테스트 주도 개발(TDD) 지원

## 2. 테스트 프레임워크

### 2.1 단위 테스트

#### 2.1.1 테스트 구조
```typescript
interface TestFramework {
  // 테스트 구성
  configure(options: TestConfig): void;
  
  // 테스트 실행
  run(patterns: string[]): Promise<TestResult>;
  
  // 커버리지 측정
  coverage(): Promise<CoverageReport>;
}

class UnitTestFramework implements TestFramework {
  private vitest: Vitest;
  private coverage: CoverageProvider;
  
  // 테스트 유틸리티
  class TestUtils {
    // Mock 생성
    createMock<T>(implementation?: Partial<T>): Mock<T> {
      return {
        ...implementation,
        _isMock: true,
        _calls: [],
        _results: [],
        
        mockImplementation(fn: Function) {
          this._implementation = fn;
          return this;
        },
        
        mockReturnValue(value: any) {
          this._returnValue = value;
          return this;
        },
        
        mockResolvedValue(value: any) {
          this._returnValue = Promise.resolve(value);
          return this;
        },
        
        mockRejectedValue(error: any) {
          this._returnValue = Promise.reject(error);
          return this;
        }
      };
    }
    
    // 스파이 생성
    createSpy<T extends (...args: any[]) => any>(fn: T): SpyFunction<T> {
      const spy = function(...args: Parameters<T>): ReturnType<T> {
        spy.calls.push(args);
        const result = fn.apply(this, args);
        spy.results.push(result);
        return result;
      };
      
      spy.calls = [];
      spy.results = [];
      spy.calledWith = (...args: Parameters<T>) => 
        spy.calls.some(call => 
          JSON.stringify(call) === JSON.stringify(args)
        );
      spy.reset = () => {
        spy.calls = [];
        spy.results = [];
      };
      
      return spy as SpyFunction<T>;
    }
    
    // 테스트 픽스처
    async createFixture<T>(factory: () => T | Promise<T>): Promise<Fixture<T>> {
      const instance = await factory();
      
      return {
        instance,
        
        async reset() {
          if (typeof instance.reset === 'function') {
            await instance.reset();
          }
        },
        
        async cleanup() {
          if (typeof instance.cleanup === 'function') {
            await instance.cleanup();
          }
        }
      };
    }
  }
  
  // 테스트 매처
  class CustomMatchers {
    toBeValidEmail(received: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const pass = emailRegex.test(received);
      
      return {
        pass,
        message: () => 
          pass 
            ? `Expected ${received} not to be a valid email`
            : `Expected ${received} to be a valid email`
      };
    }
    
    toHaveBeenCalledWithContext(received: any, context: any) {
      const calls = received.mock.calls;
      const pass = calls.some(([callContext]: any[]) => 
        JSON.stringify(callContext) === JSON.stringify(context)
      );
      
      return {
        pass,
        message: () =>
          pass
            ? `Expected function not to be called with context ${JSON.stringify(context)}`
            : `Expected function to be called with context ${JSON.stringify(context)}`
      };
    }
    
    toMatchSchema(received: any, schema: Schema) {
      const validation = schema.validate(received);
      
      return {
        pass: validation.valid,
        message: () => 
          validation.valid
            ? `Expected object not to match schema`
            : `Expected object to match schema. Errors: ${validation.errors.join(', ')}`
      };
    }
  }
}
```

#### 2.1.2 테스트 패턴
```typescript
// 컴포넌트 테스트
describe('Button Component', () => {
  let wrapper: ReactWrapper;
  let mockProps: ButtonProps;
  
  beforeEach(() => {
    mockProps = {
      onClick: jest.fn(),
      disabled: false,
      loading: false,
      variant: 'primary'
    };
    
    wrapper = mount(<Button {...mockProps} />);
  });
  
  afterEach(() => {
    wrapper.unmount();
    jest.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render with correct variant class', () => {
      expect(wrapper.find('button')).toHaveClass('btn-primary');
    });
    
    it('should render loading spinner when loading', () => {
      wrapper.setProps({ loading: true });
      expect(wrapper.find('Spinner')).toExist();
    });
    
    it('should be disabled when loading or disabled prop is true', () => {
      wrapper.setProps({ loading: true });
      expect(wrapper.find('button')).toBeDisabled();
      
      wrapper.setProps({ loading: false, disabled: true });
      expect(wrapper.find('button')).toBeDisabled();
    });
  });
  
  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      wrapper.find('button').simulate('click');
      expect(mockProps.onClick).toHaveBeenCalledTimes(1);
    });
    
    it('should not call onClick when disabled', () => {
      wrapper.setProps({ disabled: true });
      wrapper.find('button').simulate('click');
      expect(mockProps.onClick).not.toHaveBeenCalled();
    });
  });
  
  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      wrapper.setProps({ loading: true });
      expect(wrapper.find('button')).toHaveAttribute('aria-busy', 'true');
    });
    
    it('should be keyboard navigable', () => {
      const button = wrapper.find('button');
      button.simulate('keydown', { key: 'Enter' });
      expect(mockProps.onClick).toHaveBeenCalled();
      
      button.simulate('keydown', { key: ' ' });
      expect(mockProps.onClick).toHaveBeenCalledTimes(2);
    });
  });
});

// 서비스 테스트
describe('AuthService', () => {
  let authService: AuthService;
  let mockHttpClient: MockHttpClient;
  let mockTokenStorage: MockTokenStorage;
  
  beforeEach(() => {
    mockHttpClient = createMock<HttpClient>();
    mockTokenStorage = createMock<TokenStorage>();
    
    authService = new AuthService({
      httpClient: mockHttpClient,
      tokenStorage: mockTokenStorage
    });
  });
  
  describe('login', () => {
    it('should authenticate user and store tokens', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: credentials.email }
      };
      
      mockHttpClient.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login(credentials);
      
      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalledWith(mockResponse.accessToken);
      expect(mockTokenStorage.setRefreshToken).toHaveBeenCalledWith(mockResponse.refreshToken);
      expect(result).toEqual(mockResponse.user);
    });
    
    it('should handle authentication errors', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const error = new Error('Invalid credentials');
      
      mockHttpClient.post.mockRejectedValue(error);
      
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(mockTokenStorage.setAccessToken).not.toHaveBeenCalled();
    });
  });
});
```

### 2.2 통합 테스트

#### 2.2.1 API 통합 테스트
```typescript
class IntegrationTestSuite {
  private testServer: TestServer;
  private testDatabase: TestDatabase;
  private testClient: TestClient;
  
  // 테스트 환경 설정
  async setup(): Promise<void> {
    // 테스트 데이터베이스 초기화
    this.testDatabase = await TestDatabase.create({
      schema: './schema.sql',
      seeds: './seeds',
      isolated: true
    });
    
    // 테스트 서버 시작
    this.testServer = await TestServer.create({
      port: 0, // 랜덤 포트
      database: this.testDatabase,
      config: testConfig
    });
    
    // 테스트 클라이언트 생성
    this.testClient = new TestClient({
      baseURL: this.testServer.url
    });
  }
  
  // API 엔드포인트 테스트
  describe('API Integration', () => {
    describe('POST /api/suggestions', () => {
      it('should generate code suggestions', async () => {
        // Given
        const context = {
          code: 'function calculate',
          cursor: { line: 0, column: 18 },
          language: 'javascript'
        };
        
        // When
        const response = await testClient.post('/api/suggestions', context);
        
        // Then
        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          suggestions: expect.arrayContaining([
            expect.objectContaining({
              text: expect.any(String),
              score: expect.any(Number)
            })
          ])
        });
      });
      
      it('should validate request schema', async () => {
        // Given - 잘못된 요청
        const invalidContext = {
          code: 'function calculate'
          // cursor 누락
        };
        
        // When
        const response = await testClient.post('/api/suggestions', invalidContext);
        
        // Then
        expect(response.status).toBe(400);
        expect(response.data.error).toContain('cursor is required');
      });
    });
    
    describe('WebSocket Integration', () => {
      let wsClient: WebSocketClient;
      
      beforeEach(async () => {
        wsClient = await WebSocketClient.connect(testServer.wsUrl);
      });
      
      afterEach(async () => {
        await wsClient.disconnect();
      });
      
      it('should receive real-time updates', async (done) => {
        // Given
        const subscription = {
          type: 'subscribe',
          channel: 'suggestions',
          fileId: 'test.js'
        };
        
        // When
        wsClient.on('message', (message) => {
          // Then
          expect(message).toMatchObject({
            type: 'suggestion',
            data: expect.any(Object)
          });
          done();
        });
        
        await wsClient.send(subscription);
        
        // Trigger suggestion
        await testClient.post('/api/trigger-suggestion', {
          fileId: 'test.js'
        });
      });
    });
  });
}
```

### 2.3 E2E 테스트

#### 2.3.1 시나리오 테스트
```typescript
class E2ETestFramework {
  private browser: Browser;
  private page: Page;
  
  // Playwright 설정
  async setup(): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.DEBUG ? 100 : 0
    });
    
    this.page = await this.browser.newPage();
    
    // 뷰포트 설정
    await this.page.setViewportSize({
      width: 1920,
      height: 1080
    });
  }
  
  // 사용자 시나리오 테스트
  describe('User Journey', () => {
    test('Complete code suggestion workflow', async () => {
      // 1. 로그인
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // 대기 및 검증
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
      
      // 2. 프로젝트 열기
      await page.click('[data-testid="project-card-1"]');
      await page.waitForSelector('[data-testid="code-editor"]');
      
      // 3. 코드 입력 및 제안 받기
      const editor = await page.locator('[data-testid="code-editor"]');
      await editor.type('function calculate');
      
      // 제안 대기
      await page.waitForSelector('[data-testid="suggestion-popup"]', {
        timeout: 5000
      });
      
      // 4. 제안 선택
      const firstSuggestion = await page.locator('[data-testid="suggestion-item-0"]');
      await firstSuggestion.click();
      
      // 5. 결과 검증
      const editorContent = await editor.inputValue();
      expect(editorContent).toContain('function calculate(');
      
      // 스크린샷 캡처 (실패 시)
      if (process.env.CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: `screenshots/suggestion-applied-${Date.now()}.png`
        });
      }
    });
    
    test('Performance critical path', async () => {
      // 성능 추적 시작
      await page.coverage.startJSCoverage();
      await page.tracing.start({ screenshots: true, snapshots: true });
      
      const metrics = [];
      
      // 페이지 로드 성능
      const navigationStart = Date.now();
      await page.goto('/');
      const navigationEnd = Date.now();
      
      metrics.push({
        metric: 'page_load',
        value: navigationEnd - navigationStart
      });
      
      // 첫 번째 의미있는 페인트
      const fcp = await page.evaluate(() => {
        const entry = performance.getEntriesByType('paint')
          .find(e => e.name === 'first-contentful-paint');
        return entry ? entry.startTime : 0;
      });
      
      metrics.push({
        metric: 'first_contentful_paint',
        value: fcp
      });
      
      // 상호작용 가능 시간
      const tti = await page.evaluate(() => {
        return new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve(performance.now());
          } else {
            window.addEventListener('load', () => resolve(performance.now()));
          }
        });
      });
      
      metrics.push({
        metric: 'time_to_interactive',
        value: tti
      });
      
      // 성능 추적 종료
      const coverage = await page.coverage.stopJSCoverage();
      const trace = await page.tracing.stop();
      
      // 성능 기준 검증
      expect(metrics.find(m => m.metric === 'page_load').value).toBeLessThan(3000);
      expect(metrics.find(m => m.metric === 'first_contentful_paint').value).toBeLessThan(1000);
      expect(metrics.find(m => m.metric === 'time_to_interactive').value).toBeLessThan(5000);
    });
  });
}
```

### 2.4 성능 테스트

#### 2.4.1 부하 테스트
```typescript
class LoadTestFramework {
  private k6: K6Runner;
  
  // 부하 테스트 시나리오
  defineScenario(): LoadTestScenario {
    return {
      stages: [
        { duration: '2m', target: 50 },   // Ramp up
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Spike
        { duration: '5m', target: 200 },  // Stay at peak
        { duration: '5m', target: 0 }     // Ramp down
      ],
      
      thresholds: {
        'http_req_duration': ['p(95)<500', 'p(99)<1000'],
        'http_req_failed': ['rate<0.1'],
        'http_reqs': ['rate>100']
      },
      
      scenarios: {
        constant_load: {
          executor: 'constant-vus',
          vus: 50,
          duration: '10m'
        },
        
        spike_test: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '10s', target: 100 },
            { duration: '1m', target: 100 },
            { duration: '10s', target: 1000 }, // Spike!
            { duration: '3m', target: 1000 },
            { duration: '10s', target: 100 },
            { duration: '3m', target: 100 },
            { duration: '10s', target: 0 }
          ]
        },
        
        stress_test: {
          executor: 'ramping-arrival-rate',
          startRate: 0,
          timeUnit: '1s',
          preAllocatedVUs: 500,
          stages: [
            { duration: '2m', target: 50 },
            { duration: '5m', target: 50 },
            { duration: '2m', target: 100 },
            { duration: '5m', target: 100 },
            { duration: '2m', target: 200 },
            { duration: '5m', target: 200 },
            { duration: '2m', target: 300 },
            { duration: '5m', target: 300 }
          ]
        }
      }
    };
  }
  
  // K6 테스트 스크립트
  generateK6Script(): string {
    return `
      import http from 'k6/http';
      import { check, sleep } from 'k6';
      import { Rate } from 'k6/metrics';
      
      const errorRate = new Rate('errors');
      
      export const options = ${JSON.stringify(this.defineScenario())};
      
      export function setup() {
        // 로그인 및 토큰 획득
        const loginRes = http.post(
          '\${__ENV.BASE_URL}/auth/login',
          JSON.stringify({
            email: 'test@example.com',
            password: 'password'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        const token = loginRes.json('accessToken');
        return { token };
      }
      
      export default function(data) {
        const params = {
          headers: {
            'Authorization': \`Bearer \${data.token}\`,
            'Content-Type': 'application/json'
          }
        };
        
        // 시나리오 1: 코드 제안 요청
        const suggestRes = http.post(
          '\${__ENV.BASE_URL}/api/suggestions',
          JSON.stringify({
            code: 'function test() {',
            cursor: { line: 0, column: 18 }
          }),
          params
        );
        
        check(suggestRes, {
          'status is 200': (r) => r.status === 200,
          'response time < 500ms': (r) => r.timings.duration < 500,
          'suggestions returned': (r) => JSON.parse(r.body).suggestions.length > 0
        });
        
        errorRate.add(suggestRes.status !== 200);
        
        sleep(1);
        
        // 시나리오 2: 분석 요청
        const analyzeRes = http.post(
          '\${__ENV.BASE_URL}/api/analyze',
          JSON.stringify({
            filePath: 'test.js',
            content: 'const x = 1;'
          }),
          params
        );
        
        check(analyzeRes, {
          'analysis successful': (r) => r.status === 200
        });
        
        sleep(0.5);
      }
      
      export function teardown(data) {
        // 정리 작업
        console.log('Test completed');
      }
    `;
  }
}
```

## 3. 품질 메트릭

### 3.1 코드 품질 분석
```typescript
class CodeQualityAnalyzer {
  private metrics: Map<string, QualityMetric> = new Map();
  
  // 품질 메트릭 수집
  async analyze(codebase: string): Promise<QualityReport> {
    const results = await Promise.all([
      this.analyzeComplexity(codebase),
      this.analyzeDuplication(codebase),
      this.analyzeDependencies(codebase),
      this.analyzeTestCoverage(codebase),
      this.analyzeSecurity(codebase),
      this.analyzePerformance(codebase)
    ]);
    
    return {
      timestamp: Date.now(),
      metrics: results,
      score: this.calculateQualityScore(results),
      recommendations: this.generateRecommendations(results)
    };
  }
  
  // 순환 복잡도 분석
  private async analyzeComplexity(codebase: string): Promise<ComplexityMetric> {
    const files = await this.getSourceFiles(codebase);
    const complexities = [];
    
    for (const file of files) {
      const ast = await this.parseFile(file);
      const complexity = this.calculateCyclomaticComplexity(ast);
      
      complexities.push({
        file,
        complexity,
        functions: this.analyzeFunctionComplexity(ast)
      });
    }
    
    return {
      type: 'complexity',
      average: this.average(complexities.map(c => c.complexity)),
      max: Math.max(...complexities.map(c => c.complexity)),
      distribution: this.getDistribution(complexities),
      hotspots: complexities
        .filter(c => c.complexity > 10)
        .sort((a, b) => b.complexity - a.complexity)
        .slice(0, 10)
    };
  }
}
```

## 4. 품질 게이트

### 4.1 자동 품질 검증
```typescript
class QualityGate {
  private rules: QualityRule[] = [];
  
  // 품질 게이트 평가
  async evaluate(context: QualityContext): Promise<QualityGateResult> {
    const results = await Promise.all(
      this.rules.map(rule => rule.evaluate(context))
    );
    
    const passed = results.every(r => r.passed);
    const score = this.calculateScore(results);
    
    return {
      passed,
      score,
      results,
      blockers: results.filter(r => !r.passed && r.severity === 'blocker'),
      warnings: results.filter(r => !r.passed && r.severity === 'warning')
    };
  }
  
  // 기본 규칙 설정
  setupDefaultRules(): void {
    this.rules = [
      new CoverageRule({ minimum: 70, target: 'overall' }),
      new ComplexityRule({ maximum: 10, target: 'function' }),
      new DuplicationRule({ maximum: 5, unit: 'percent' }),
      new SecurityRule({ blockers: 0, critical: 0 }),
      new PerformanceRule({ p95: 500, p99: 1000 }),
      new AccessibilityRule({ level: 'AA' })
    ];
  }
}
```

## 5. 테스트 자동화

### 5.1 CI/CD 통합
```typescript
class TestAutomation {
  // GitHub Actions 워크플로우
  generateWorkflow(): string {
    return `
name: Test Automation

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
        test-suite: [unit, integration, e2e]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run \${{ matrix.test-suite }} tests
        run: npm run test:\${{ matrix.test-suite }}
      
      - name: Upload coverage
        if: matrix.test-suite == 'unit'
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-\${{ matrix.node-version }}-\${{ matrix.test-suite }}
          path: test-results/
    `;
  }
}
```
