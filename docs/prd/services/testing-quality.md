# Testing & Quality Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2 기초 품질 게이트 수립)

---

## 1. 목적 및 범위 (Purpose & Scope)
Testing & Quality 서비스는 제품 코드베이스(프론트엔드, Core AI Engine API, Code Analysis Pipeline, Validator)의 **정확성(Correctness)**, **회귀 방지(Regression Protection)**, **일관성(Consistency)**, **신뢰성(Reliability)** 확보를 위한 테스트 전략·도구·품질 게이트 정의를 제공한다.  
포함 대상: 테스트 타입 정의, 커버리지 기준, 테스트 데이터 관리, 품질 메트릭 집계, CI 파이프라인 품질 게이트.  
포함하지 않음: 퍼포먼스/로드 테스트(Performance Optimization 문서), 보안 침투 테스트(Security & Compliance), 실험(A/B) 프레임워크.

## 2. 범위 제외 사항 (Out of Scope)
- 부하/스트레스/용량 테스트(Load/Stress/Capacity)
- 침투 테스트(Penetration Testing)
- 데이터 마이그레이션 검증(Deployment & Ops 연계)
- 다국어 번역 품질 평가(Internationalization 문서)
- 모델 파인튜닝 성능 벤치마크(ML Pipeline 외부)

## 3. 현재 상태 (Current State)
- 마케팅 랜딩 React 컴포넌트만 존재 → 단위 테스트 미구현
- Jest / Vitest 등 테스트 러너 미도입 (package.json 검토 필요)
- E2E(Test Runner: Playwright/Cypress) 선택 전
- 커버리지 기준/폴더 구조/테스트 데이터 전략 미정
- 품질 메트릭(테스트 시간, 실패 비율) Telemetry 연동 없음

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | 테스트 계층 구조 확립 | Unit / Integration / E2E / Contract / Snapshot / Static Analysis |
| FR-2 | 테스트 명명 규칙 | {unit|int|e2e}.{feature}.{spec}.ts 패턴 (예: button.unit.spec.ts) |
| FR-3 | 단위 테스트 기반 설정 | React 컴포넌트, 유틸 함수, 훅(use-*) |
| FR-4 | 통합 테스트 | Data Access + API Mock + 상태 변화 (React Query 캐시 포함) |
| FR-5 | 계약(Contract) 테스트 (Phase 2) | API Consistency Validator와 REST/Graph-like Schema 검증 |
| FR-6 | AI Suggest Stub 테스트 (Phase 2) | Model Adapter Mock → Deterministic Fixture |
| FR-7 | Snapshot 테스트 가이드 | UI Skeleton, 복잡한 조건부 렌더 제한적 사용 (과도 사용 금지) |
| FR-8 | E2E 시나리오 (Phase 3) | Workspace 전환, 프로젝트 인덱싱 Progress, Suggest Accept Flow |
| FR-9 | 커버리지 기준 | Lines ≥ 70%(Phase2) → 80%(Phase3) 핵심 모듈(엔진 orchestration) 90% |
| FR-10 | Lint & Type Gate | ESLint 오류=CI 실패, TS build error=gate fail |
| FR-11 | Mutation Testing (Phase 3) | 핵심 유틸 5% 이상 kill ratio 개선 추적 |
| FR-12 | Test Data Factory | 재현성 있는 Factory 패턴 (faker seed 고정) |
| FR-13 | Flaky Test 감지 | 3회 재실행 시 편차 기록 → Telemetry 전송 |
| FR-14 | Test Parallelization | CI 워커 샤딩 (spec file 분배) 시간 단축 |
| FR-15 | 실패 아티팩트 수집 | E2E 실패 시 스크린샷/로그 업로드 |
| FR-16 | Contract Drift Alert | 스키마 변경 → 비호환 테스트 실패 시 알림 |
| FR-17 | Pre-commit 훅 | lint-staged + type check + affected unit tests 실행 |
| FR-18 | Selective Test Run | 변경된 패키지/디렉토리 기반 테스트 영향 분석 (Phase 3) |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 단위 테스트 전체 실행 시간: ≤ 60s (Phase 2 기준 기초 규모)
- E2E 스모크 스위트: ≤ 8분 (병렬 4워커)
신뢰성:
- Flaky Fail 비율 < 2% 목표
- 재시도(retry) 정책: E2E 최대 2회 재실행
일관성:
- Seed 고정 (process.env.TEST_SEED) 로 faker, date 모킹
보안:
- 테스트 로그 민감정보(토큰/이메일) 마스킹
유지보수:
- 테스트 파일: 코드/테스트 비율 ≤ 1:1 (과도한 snapshot 지양)
데이터 품질:
- Contract Fixture SHA 체크 (변경 시 diff 출력)
관찰성:
- Telemetry: test_run_complete 이벤트 (duration, pass_rate, flaky_count)
국제화:
- i18n 키 테스트: 누락 키 검출 스위트 (Phase 3)
접근성:
- 핵심 UI 컴포넌트 Axe 위반 High/Serious 0 유지
회귀 방지:
- baseline coverage < threshold 시 PR 실패

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 테스트 Telemetry 이벤트
```json
{
  "name": "test_run_complete",
  "ts": 1737449600000,
  "context": {
    "commit": "abc123",
    "branch": "feature/ai-engine"
  },
  "attributes": {
    "type": "unit",
    "total": 152,
    "passed": 150,
    "failed": 2,
    "flaky": 1,
    "durationMs": 42500,
    "coverageLinePct": 0.74
  }
}
```
### 6.2 Contract 테스트 예 (Pseudo)
```ts
// contract/suggest-response.contract.ts
expect(schema.validate(suggestResponse)).toEqual({ valid: true })
expect(diff(currentSchema, baselineSchema).breaking).toHaveLength(0)
```
### 6.3 Factory 패턴
```ts
export const userFactory = (overrides: Partial<User> = {}): User => ({
  id: `usr_${randomId()}`,
  email: `u${counter()}@example.com`,
  name: 'Test User',
  role: 'MEMBER',
  ...overrides
})
```
### 6.4 AI Suggest Stub
```ts
mockModelProvider.generate
  .mockResolvedValueOnce(fixture('suggest/simple_function.json'))
```
### 6.5 Flaky Test Marker
```ts
if (retryCount > 0) {
  telemetry.track({ name: 'test_flaky_occurrence', attributes: { testId, retryCount } })
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- TestRun(id, type(unit|integration|e2e|contract), commitSha, branch, total, passed, failed, flaky, durationMs, coverageLinePct, createdAt)
- FlakyTest(id, testId, firstSeenCommit, lastSeenCommit, occurrences, lastFailureAt)
- ContractBaseline(id, name, version, schemaHash, createdAt)
- CoverageThreshold(id, module, requiredPct, currentPct, commitSha, createdAt)
- MutationScore(id, module, mutantsTotal, killed, scorePct, commitSha, createdAt) (Phase 3)
인덱스:
- TestRun(commitSha, type)
- FlakyTest(testId)
- ContractBaseline(name, version)
보존:
- Raw TestRun 180일
- FlakyTest stale(최근 30일 활동 없음) 아카이브
Derived Metrics:
- pass_rate = passed / total
- flaky_rate = flaky / total
- mutation_score = killed / mutantsTotal
- failure_trend (rolling 7 commits)

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 CI Unit Test
1. Install → Build → Lint/Type → Unit Tests 실행  
2. Coverage 계산 → threshold 비교 → 실패 시 CI 중단  
3. Telemetry 전송 (test_run_complete)  
### 8.2 Contract Drift
1. API Schema 재생성 → baseline과 diff  
2. Breaking 발견 → Contract Test 실패 → PR 라벨 “contract-breaking”  
### 8.3 E2E 스모크
1. 배포된 Preview URL 대상  
2. 로그인 모킹 or 실제 Auth Flow  
3. 핵심 시나리오(Workspace 생성 → Project 생성 → 인덱싱 Progress Mock → Suggest Accept)  
4. 실패 → 스크린샷/콘솔 로그 업로드  
### 8.4 Flaky Detection
1. 동일 testId N회 중 1회 이상 실패 → flaky 후보  
2. 재시도 성공이면 flaky 카운트 증가  
3. threshold 초과(예: 3회) 시 리포트  
### 8.5 Mutation Testing (Phase 3)
1. 핵심 유틸 모듈 대상 mutant 생성  
2. 테스트 스위트 실행 → kill 비율 계산  
3. scorePct < 목표 → 경고 코멘트  
### 8.6 Selective Test Run (Phase 3)
1. 변경된 경로 diff 분석 → 영향 모듈 매핑  
2. 그 모듈 관련 테스트만 우선 실행 (Fast Feedback)  
3. 풀 스위트 Nightly

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (로그인/토큰 플로우)
- Projects & Workspaces (Workspace, Project 생성 시나리오)
- Configuration & Environment (테스트 모드 변수)
Downstream:
- Telemetry & Observability (테스트 이벤트/커버리지 지표)
- Deployment & Ops (CI 파이프라인 / Preview 환경)
Cross:
- Performance Optimization (회귀 시 성능 테스트 트리거)
- Security & Compliance (보안 린트 규칙)
외부:
- Jest / Vitest / Playwright / ESLint / TypeScript
- Mutation Testing (StrykerJS 후보)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 과도한 Snapshot | 유지보수 비용 상승 | 제한 정책(파일당 1~2), 의미 있는 diff 검토 |
| Flaky 증가 | CI 신뢰 하락 | 재시도 + flaky 레지스트리 + 격리 |
| 커버리지 왜곡(Dead Code) | 품질 착시 | 잔존 미사용 코드 감지 린트 + 트리쉐이킹 리포트 |
| Contract Drift 미검출 | 런타임 오류 | 빌드 단계 스키마 diff 게이트 |
| 긴 테스트 시간 | 개발자 피로 | 샤딩 + selective run + 캐시 |
| 환경 의존성(E2E) | 불안정성 | Test double / Mock server fallback |
| Mutation 비용 과다 | CI 지연 | Nightly 실행 + 중요 모듈만 |
| 데이터 레이스 | 간헐 실패 | 격리된 test db(fork) / id prefix |
| 비결정적 시드 | 재현 어려움 | 글로벌 seed 고정 + 시간 Freeze(mock date) |
| 숨은 실패 억제(retry 남용) | 실제 오류 누락 | retry 결과 Telemetry & flaky flag |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | Unit + Lint + Type Gate + 기본 Coverage | Lines ≥ 70%, Serious Axe 위반 0 |
| M2 | Contract Tests + Integration (API Mock) | Breaking diff 시 PR 차단 |
| M3 | E2E Smoke + Flaky Detection + Coverage Upload | Flaky Rate < 3% |
| M4 | Mutation Testing(core utils) + Selective Run | Mutation Score ≥ 60% |
| M5 (Phase3) | Extended E2E(Workspace/Project flows) | 핵심 시나리오 실패율 < 2% |
| M6 | Nightly Full Regression + Report Dashboard | 7일 pass_rate 추세 시각화 |
| M7 (Phase4) | i18n Key Missing Test + Accessibility Extended | 번역 누락 0, A11y 경고 0 |
| M8 | Test Impact Analysis w/ Telemetry Feedback | 평균 CI 시간 20% 감소 |

Acceptance 예시(M2):
- API Schema param 이름 변경 → Contract Test 실패 로그에 diff(JSON path) 노출
- 그 외 변경 없을 때 green

## 12. 향후 확장 계획 (Future Extensions)
- AI 기반 테스트 코드 생성 도움(제안 품질 평가)
- Risk-based Test Selection (최근 실패 / 복잡도 점수)
- Visual Regression Testing (스토리북 컴포넌트 스냅샷 비교)
- Accessibility 자동 스캔 Nightly (axe + pa11y)
- Parallel Remote Cache (Bazel-like) 도입
- Test Data Synthetic Generator (모델 기반)
- Runtime Behavior Coverage (분기 외 실제 실행 경로)
- Contract Back-compat Analyzer (다중 버전 호환성)

---
내부 검토 체크리스트:
- jest/vitest 선택 및 구성 문서화
- coverage exclude 전략 (index.ts re-export 등)
- flaky 기준 정의(retry >0 & eventually pass)
- mutation 대상 스코프(파일 glob) 확정
- test 환경 변수 분리(.env.test)

(끝)