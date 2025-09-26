# Performance Optimization Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2~3 최적화 베이스라인 수립)

---

## 1. 목적 및 범위 (Purpose & Scope)
Performance Optimization 서비스는 클라이언트(React/Vite), Edge/API, Core AI Engine, Code Analysis Pipeline 전 구간의 성능 목표(Budget) 정의, 계측(Monitoring Hook), 병목 탐지, 자동화된 성능 회귀 방지 가드를 제공한다.
핵심 목표:
1) 사용자 체감 상호작용 지연 감소 (TTI, 입력→제안 Latency)
2) 초기 로드 번들 크기/네트워크 비용 관리
3) 인덱싱/분석/제안 파이프라인 서버 처리량(Throughput) 최적화
4) 성능 회귀 자동 감지 및 배포 게이트 구축
범위: 메트릭 정의, 계측 전략, 최적화 기법 가이드, Alert 조건, 회귀 방지 Workflow.

## 2. 범위 제외 사항 (Out of Scope)
- CDN/Edge Provider 세부 캐시 정책(Deployment & Ops 문서)
- ML 모델 자체 압축/경량화(Phase 4+)
- 하드웨어/인프라 비용 최적화(Reserved Instance 등 재무 관점)
- 프론트엔드 비디오/이미지 변환 파이프라인 (미디어 전용 서비스)
- 실험군(A/B) 분리 성능 비교 프레임워크 (Experimentation Phase 4+)

## 3. 현재 상태 (Current State)
- 마케팅 랜딩만 존재: 초기 번들 분석 미수행
- Core AI / Parsing 미구현 → 추정 목표만 존재
- Telemetry 수집 인프라 설계 단계 (실측 데이터 부재)
- Performance Budget(예: main bundle < 300KB gzip) README에 단편 명시

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | Performance Budget Registry | budgets.json (클라이언트 번들 / API Latency / Index Duration) 버전 관리 |
| FR-2 | Build Size 검사 | CI 단계에서 gzip/brotli 사이즈 측정 후 Budget 초과 시 실패 |
| FR-3 | Suggest Latency 측정 Hook | 요청 시작~최종 후보 수신 P50/P95 기록 |
| FR-4 | Indexing 단계별 타이머 | parse / symbols / contracts / finalize 구간 ms 측정 |
| FR-5 | API Latency 추적 | /suggest /reindex /login P50/P95 메트릭 수집 |
| FR-6 | CLS/LCP/FID 수집 (Phase2) | Web Vitals → 보고 & Budget 비교 |
| FR-7 | Preload / Prefetch 전략 관리 | critical asset manifest 정의 |
| FR-8 | Code Splitting 정책 | route-level + component-level 기준표 정의 |
| FR-9 | 캐시 헤더 표준 | static assets cache-control immutable 1y |
| FR-10 | 성능 회귀 Alert | 3 연속 측정 윈도우 Budget 초과 시 Alert 이벤트 발생 |
| FR-11 | Throttling / Debounce 유틸 | 편집 이벤트 → Suggest Trigger Rate 제한 |
| FR-12 | 파서 증분 업데이트 최적화 | 변경 파일 subset AST 재생성 비율 ≥ 95% |
| FR-13 | Worker Pool 크기 자동 조정 | Queue 대기 시간 기반 scale hint (Phase3) |
| FR-14 | Token 비용 vs Latency Trade Report | 후보 수 축소 시 Latency 감소 비교 계산 |
| FR-15 | Perf Mark API 래퍼 | window.performance.mark / measure 추상화 |
| FR-16 | Resource Timing 수집 | 주요 fetch (model, config) TTFB 기록 |
| FR-17 | CPU 프로파일 스냅샷(선택) | Dev build에서 일정 확률采集 |
| FR-18 | Regression Gate CI | 이전 main 브랜치 대비 +10% 초과 실패 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능 지표 목표 (Phase 2 기준):
- 초기 HTML First Paint < 1.0s (광대역, 데스크톱)
- 초기 JS main bundle gzip ≤ 300KB, vendor chunk ≤ 200KB
- Suggestion API P95 ≤ 3000ms (Phase3: 2000ms)
- Indexing (중형 Repo 5k 파일) 최초 완료 ≤ 8min (Phase3: 5min, Phase4: 3min)
- Progress Event 지연(Worker emit→UI 반영) ≤ 800ms
신뢰성:
- 측정 이벤트 실패율 < 2%
- Budget 파일 파싱 오류 시 CI 실패 (Fail Fast)
보안:
- 성능 로그에 PII 포함 금지
- 외부 전송(3rd party analytics) Feature Flag 통제
확장성:
- 이벤트 처리량 증가 시 샘플링 동적 조정 (low variance 구간 다운샘플)
유지보수:
- Budget 변경 PR 템플릿에 근거(reason, baseline data) 필수
데이터 품질:
- 이상치 제거(IQR*3 초과) 후 p95 재계산 옵션
접근성:
- 최적화가 A11y 요소 지연을 초래하지 않도록(FOUC 방지) CSS Critical Path 우선 로드

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 budgets.json (예시)
```json
{
  "version": 1,
  "client": {
    "mainBundleGzipKb": 300,
    "vendorBundleGzipKb": 200,
    "routeChunkGzipKb": 120,
    "lcpMsP75": 2500,
    "clsP75": 0.1
  },
  "api": {
    "suggestP95Ms": 3000,
    "loginP95Ms": 800,
    "indexingAvgMin": 8
  },
  "engine": {
    "contextBuildP95Ms": 300,
    "modelCallP95Ms": 2500
  }
}
```

### 6.2 성능 마크 유틸 (Pseudo TS)
```ts
interface PerfMark {
  start(name: string): void
  end(name: string, attrs?: Record<string, any>): number // duration ms
  measure(name: string, start: string, end: string): number
}
export const perf: PerfMark = { ... }
```

### 6.3 Suggest Latency 이벤트 (Telemetry 연계)
```json
{
  "name": "suggestion_latency",
  "requestId": "req_abc",
  "latencyMs": 1820,
  "candidateCount": 3,
  "contextBuildMs": 120,
  "modelMs": 1500,
  "rankingMs": 80,
  "ts": 1737449600000
}
```

### 6.4 Build Size CI Output (예시)
```json
{
  "main.js.gzKb": 278.4,
  "vendor.js.gzKb": 185.2,
  "chunks": [
    { "name": "route-index", "gzKb": 88.1 },
    { "name": "route-settings", "gzKb": 97.5 }
  ],
  "pass": true
}
```

### 6.5 Reindex Efficiency Report
```json
{
  "projectId": "prj_abc",
  "totalFiles": 5000,
  "changedFiles": 120,
  "reparsedFiles": 118,
  "reuseRatio": 0.983,
  "durationMs": 64000
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- PerfBudget(id, version, json, createdAt, appliedAt)
- BuildArtifactStat(id, commitSha, mainGzipKb, vendorGzipKb, routeMaxGzipKb, createdAt)
- ApiLatencyStat(id, route, windowStart, p50, p95, count)
- SuggestLatencySample(id, requestId, latencyMs, contextBuildMs, modelMs, rankingMs, ts)
- IndexingStat(id, projectId, fullDurationMs, phaseParseMs, phaseSymbolsMs, phaseContractsMs, createdAt)
- ReindexEfficiency(id, projectId, reuseRatio, changedFiles, reparsedFiles, durationMs, createdAt)
- PerfAlert(id, metric, windowStart, value, threshold, severity, triggeredAt, resolvedAt?)
- PerfRegression(id, commitSha, baselineCommitSha, metric, deltaPct, status, createdAt)
인덱스:
- BuildArtifactStat(commitSha)
- ApiLatencyStat(route, windowStart)
- SuggestLatencySample(ts)
- IndexingStat(projectId, createdAt)
- ReindexEfficiency(projectId, createdAt)
보존:
- Raw SuggestLatencySample 14일
- Aggregated Stat 180일
- PerfBudget 모든 버전 영구 (감사 목적)

Derived Metrics:
- model_ratio = modelMs / latencyMs
- context_ratio = contextBuildMs / latencyMs
- reindex_reuse_ratio = reparsedFiles / changedFiles
- bundle_growth_pct = (current - baseline)/baseline

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 Build Budget Check (CI)
1. 빌드 완료 후 size analyzer 실행
2. budgets.json 로드 → 임계 비교
3. 초과 → CI 실패 + 상세 diff 코멘트 (파일별 증가량)
4. 통과 → BuildArtifactStat 저장

### 8.2 Suggest Latency 측정
1. /suggest 호출 start mark
2. 각 서브 단계 완료 후 mark 기록
3. 응답 시 end → duration 계산 → Telemetry 전송
4. Aggregator → p50/p95 업데이트 → Alert 평가

### 8.3 Reindex Efficiency
1. Reindex Job 시작 → 변경 파일 목록 획득
2. 파서: 재파싱 파일 카운트 추적
3. Job 종료 → 재사용 비율(reuseRatio) 산출 → 저장
4. Budget 이하(예: reuse ≥ 0.95) 실패 시 엔지니어링 알림

### 8.4 Regression Gate
1. main 대비 신규 PR metric fetch
2. 임계 초과 deltaPct > 10% → PR 상태 “성능 회귀” 라벨
3. 승인 전 Budget 조정 or 최적화 필요

### 8.5 Progressive Optimization
1. Latency p95 목표 달성 후 후보 수 증가 실험
2. Accept Rate 개선 vs 추가 Latency trade 계산
3. Cost/Latency 효율곡선 산출 → 전략 문서화

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Telemetry & Observability (이벤트 저장/집계)
- Auth & User Management (user/workspace 해시)
Downstream:
- Core AI Engine (동적 후보 수 조정 정책)
- Deployment & Ops (CI Gate, 경보 채널)
Cross:
- Notification & Feedback (Alert surfaced to UI)
- Configuration & Environment (budget version config)
외부:
- Bundler Analyzer (rollup-plugin-visualizer or custom)
- Time-series DB / ClickHouse / Prometheus

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 과도한 조기 최적화 | 개발 속도 저하 | Phase 기준 Prioritize + Must-Fix 리스트 한정 |
| 로그/이벤트 과다 | 비용 증가 | Adaptive 샘플링 / 핵심 지표 화이트리스트 |
| Budget 인플레이션 | 목표 상실 | 변경 시 근거 필드 의무 + 리뷰 프로세스 |
| 측정 편향(캐시 영향) | 잘못된 의사결정 | cold/warm 분리 수집 |
| API latency 스파이크 미감지 | UX 저하 | 연속 윈도우 비교 + Derivative Alert |
| 재인덱스 효율 저하 감지 실패 | 서버 부하 | reuseRatio Alert Threshold |
| 프론트 번들 증가 누락 | 로딩 지연 | CI Gate 필수 & Slack 통지 |
| 성능 개선 → 품질 저하 | 기능 퇴화 | 품질 KPI(Accept Rate)와 동시 모니터 |
| 모델 호출 비용 폭증 | 예산 초과 | 후보 수 동적 축소 / 캐싱 |
| 측정 코드 성능 영향 | 오버헤드 증가 | lightweight mark/store, lazy flush |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | budgets.json + Build Size CI + Suggest Latency 기본 | 첫 실패 PR: CI 차단 동작 |
| M2 | Web Vitals(LCP/CLS) 수집 + Indexing Timer | LCP P75 보고 / Index 단계별 ms 기록 |
| M3 | Reindex Efficiency + Alert Rule(p95 latency) | reuseRatio ≥ 0.95 실패 시 Alert |
| M4 | Regression Gate(diff %) + Prefetch Manifest | PR 증가분 리포트 자동 코멘트 |
| M5 (Phase3) | Worker Pool Auto Hint + Token/LAT Trade Report | 후보 수 조정 후 p95 감소 ≥10% |
| M6 | Adaptive Sampling + Cold/Warm 분리 | cold/warm latency 대시보드 |
| M7 (Phase4) | Predictive Trend PoC | 1주 추세 예측 MAPE < 15% |

Acceptance 예시(M3):
- 10회 Reindex 중 reuseRatio 평균 ≥ 0.95
- reuseRatio < 0.9 발생 시 AlertTrigger 생성 확인

## 12. 향후 확장 계획 (Future Extensions)
- Real User Monitoring(RUM) 세션 리플레이(Privacy-safe)
- WASM 기반 경량 AST 전처리로 contextBuild 단축
- Auto Model Selection (Latency SLA 위반 시 저비용/고속 fallback)
- Continuous Profiling (CPU/Heap) 샘플러
- Prefetch ML (사용자 이동 예측 기반 코드 청크 사전 로드)
- GPU 가속 파싱(장기)
- Edge Function Cold Start 히트율 최적화 전략
- Budget Drift Detection (자동 회귀 그래프)

---
내부 검토 체크리스트:
- budgets.json 변경 제출 시 baseline 비교 스크립트 실행?
- Web Vitals 수집 opt-out 처리 여부
- Reindex Efficiency 계산 정확성 테스트
- Cold/Warm 구분 기준(첫 5분 vs 이후) 확정
- Prefetch Manifest 생성 파이프라인 문서화

(끝)