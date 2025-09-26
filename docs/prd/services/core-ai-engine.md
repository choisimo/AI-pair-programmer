# Core AI Engine Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft

---

## 1. 목적 및 범위 (Purpose & Scope)
Core AI Engine은 코드베이스의 **지속적 문맥(Continuous Project Context)** 을 기반으로 개발자 입력(편집, 질의, 명령)에 대해 높은 신뢰성과 일관성을 갖춘 **코드/설명/리팩터링 제안(Proposal)** 을 생성·랭킹·전달하는 중추 서비스이다.  
핵심 기능 축:
1. Context Builder: 최신 AST Delta / Symbol Graph / Dependency 영향 / 최근 편집 창(Edit Window) 집계  
2. Prompt Orchestration & Strategy: 모델 선택, 프롬프트 다단 구성, Guardrail 삽입  
3. Suggestion Generation: Multi-candidate 생성 및 품질 스코어링  
4. Ranking & Filtering: Heuristic + Telemetry 기반 가중치 → 최종 후보  
5. Feedback Loop: Accept / Dismiss / Edit After Accept 신호를 재학습/가중치에 반영  
6. Explanation Layer: 제안 이유·영향(위험 API 호출, 추론 단서) 메타데이터 첨부  

Scope (Phase 1 ~ 3) 에서는 TypeScript 단일 언어 + 단일 모델 Provider(추상화 Layer는 준비) 로 제한.

## 2. 범위 제외 사항 (Out of Scope)
- 다국어 코드/다중 언어 파서(Python/Go) (Phase 4+)
- 자연어 문서 생성(README Auto 문서화) (추후 Documentation Assistant)
- 완전 자동 코드 적용(자동 커밋) (Phase 5+ Auto Refactor)
- 장기 학습(미니파인튜닝) 인프라 (Feedback Aggregation만)
- 에이전트형 멀티스텝 실행(도구 호출/테스트 실행 루프) (Phase 5+)

## 3. 현재 상태 (Current State)
- 구현 전 (Landing Page Only)
- 요구 선행 조건: Code Analysis Pipeline(Incremental Parsing), Telemetry 수집, Consistency Validator 일부
- 설계 가이드/엔티티/프로토콜 미정
- 모델 Provider 선택(LLM Adapter) 미정 (OpenAI/Gemini 등 후보)

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | Context Snapshot 구성 | 편집 이벤트 수신 후 최대 300ms 내 Context Pack(파일 조각, Symbol, Imports) 생성 |
| FR-2 | Prompt Assembly | Base System Prompt + Role Prompt + Code Region + Neighbor Symbols + 최근 N편집(Δ) |
| FR-3 | Candidate 생성 | /suggest 호출 시 Top-K(기본 3~5) 후보 포함 |
| FR-4 | Ranking | Heuristic(길이/변경 폭/규약 위반 가능성) + Telemetry Weight |
| FR-5 | Filtering | 위험 패턴(금지 API / 민감 토큰) 발견 시 제거 |
| FR-6 | Explanation | 각 후보 reason: {rationale, affectedSymbols, riskFlags[]} |
| FR-7 | Partial Accept 지원 | 사용자 선택 범위에 부분 적용(범위 매핑) |
| FR-8 | Streaming | 토큰 스트림 기반 점진 표시(Phase 2) |
| FR-9 | Feedback 수집 | accept/dismiss/editedAfterAccept 이벤트 배치 전송 |
| FR-10 | Safety Guard | PII/시크릿 패턴 마스킹 후 모델 호출 |
| FR-11 | Rate Control | 사용자/워크스페이스 별 동시 요청 제한 (예: 2 in-flight) |
| FR-12 | Caching | 동일 최근 컨텍스트(해시) + 동일 질의 10초 내 재호출 시 캐시 히트 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- Suggest API 응답(P95) Phase1 < 3s, Phase3 < 2s
- Context Build 시간 P95 < 300ms
신뢰성:
- 모델 호출 실패 시 Retry (지수 백오프 2회) → Fallback(간소 Prompt)
- Suggestion Fail Rate (네트워크/모델 오류) < 5%
확장성:
- 동시 요청 100 (Phase3: 500) 처리 가능 (비동기 Queue + Worker)
보안:
- Prompt 내 API Key/Access Token 정규식 마스킹
- 모델 응답 Code Block만 Whitelist 추출(추가 Text 제외 옵션)
접근성:
- Streaming 시 Skeleton + Progress ARIA live polite
관찰성:
- metrics: suggestion_latency_ms, suggestion_candidates_count, accept_rate
- traces: context_build_span, model_inference_span
비용:
- Per candidate Token 사용량 집계 → Cost Budget 알림 (Notification 시스템 연동)
유지보수:
- 모델 Provider Adapter 인터페이스 고정 (단일 책임)
국제화:
- Explanation rationale 텍스트 i18n Key fallback (Phase 3)
테스팅:
- Deterministic Fixture Prompt → Golden Suggestion Snapshot (회귀 검증)

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 Suggest HTTP (초기)
POST /api/ai/suggest  
Request:
```json
{
  "filePath": "src/components/Button.tsx",
  "cursor": { "line": 42, "character": 5 },
  "visibleRegion": { "start": 0, "end": 4000 },
  "manualQuery": null,
  "capabilities": { "stream": false, "partialAccept": true }
}
```
Response:
```json
{
  "requestId": "req_abc123",
  "generatedAt": 1737449600123,
  "candidates": [
    {
      "id": "cand_1",
      "insertRange": { "start": 1052, "end": 1052 },
      "text": "function handleClick() { ... }",
      "rationale": "사용자 인터랙션 로깅 추가",
      "riskFlags": ["new_side_effect"],
      "score": 0.78,
      "confidence": "MEDIUM"
    }
  ]
}
```
### 6.2 Streaming (Phase 2 - SSE/WebSocket)
Event: suggestion.token, suggestion.complete, suggestion.error  
### 6.3 Feedback
POST /api/ai/feedback
```json
{
  "requestId": "req_abc123",
  "candidateId": "cand_1",
  "event": "accept",
  "appliedBytes": 120,
  "editAfterAcceptBytes": 15,
  "latencyMs": 1800
}
```
### 6.4 Internal Engine Interface (Pseudo TS)
```ts
interface ContextPack {
  symbols: SymbolMeta[]
  recentEdits: EditDelta[]
  dependencyGraph: DependencyEdge[]
  focusWindow: CodeSlice
  language: 'ts'
  hash: string
}

interface SuggestRequest {
  filePath: string
  cursor: Position
  manualQuery?: string | null
  context: ContextPack
  options: { maxCandidates: number; stream: boolean }
}

interface Candidate {
  id: string
  text: string
  insertRange: Range
  rationale?: string
  riskFlags: string[]
  heuristics: Record<string, number>
  baseScore: number
  finalScore: number
}

interface ModelProvider {
  generate(req: SuggestRequest, abortSignal: AbortSignal): Promise<ModelRawResult>
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- SuggestRequestLog(id, requestId, filePath, cursorLine, contextHash, createdAt, latencyMs, candidateCount)
- SuggestCandidate(id, requestId, rank, baseScore, finalScore, riskFlags[], tokenUsagePrompt, tokenUsageCompletion)
- SuggestFeedback(id, requestId, candidateId, event(accept|dismiss|partial|timeout), editAfterBytes, createdAt)
- ContextCache(hash, createdAt, sizeBytes, symbolCount, fileSample[])
- ModelCostStat(intervalStart, provider, totalTokensPrompt, totalTokensCompletion, costUsd)

인덱스:
- SuggestFeedback(requestId)
- SuggestCandidate(requestId + rank)
- ContextCache(hash)
보존:
- Raw Request 14일
- Aggregated Metrics 180일
- Context Cache LRU (메모리/디스크) 용량기반 (예: 512MB)

Derived Metrics:
- accept_rate = accept / (accept + dismiss)
- edit_over_accept_ratio = ΣeditAfterBytes / ΣappliedBytes
- avg_context_build_ms
- model_cost_per_accept

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 기본 Suggest
1. 사용자 입력 중 1.2s idle → Trigger  
2. Context Builder: recentEdits merge + symbol lookup  
3. Cache hit? → 재사용; miss → Build  
4. Model Provider 호출 → 후보 K  
5. Ranking & Filter → Client 송신  
6. 사용자 Accept → Feedback 저장 → Telemetry → Weight 업데이트 (주기적)  
### 8.2 Partial Accept
1. 후보 중 일부 텍스트 범위 드래그 → Apply  
2. remaining part discard → event(partial)  
### 8.3 Manual Query (Slash Command)
1. /explain 함수 헤더 선택 → manualQuery="explain"  
2. Prompt Strategy: Explanation Template  
3. 단일 Candidate(reason + 개선 포인트) 반환  
### 8.4 Retry Fallback
1. 모델 오류(Timeout) → Retry(1)  
2. 재실패 → Fallback Provider(Minimal Prompt)  
3. 실패 전체 → Empty Response + Notification(error)  
### 8.5 Feedback Aggregation
1. Feedback Batch 10개 또는 5s 경과 시 전송  
2. Aggregator: acceptRate 변화 > 임계치 → Ranking heuristic weight 조정  
### 8.6 Cost Budget
1. 토큰 사용 누적 > 일일 예산 80% → Warning Notification  
2. 100% 초과 → Low-cost mode (maxCandidates=1) 자동 전환 (Feature Flag)

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Code Analysis Pipeline (Symbol Graph, Edit Delta)
- API Consistency Validator (위험 Diff 힌트)
- Configuration & Environment (모델 설정, 토큰)
Downstream:
- Realtime Collaboration (향후 공동 제안 공유)
- Notification & Feedback (오류/비용 경고)
- Telemetry & Observability (지표·트레이스)
Cross:
- Security & Compliance (PII redaction)
- Performance Optimization (캐싱/스로틀)
외부:
- LLM Provider API(OpenAI/Gemini 등) → Adapter
- Token Counting 라이브러리

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 잘못된 컨텍스트(Out-of-date AST) | 부적절 제안 | Context hash 검증 + 변경 감지시 재빌드 |
| 모델 응답 지연 | 흐름 저하 | Streaming + Skeleton + Timeout fallback |
| Hallucination(컴파일 불가) | 신뢰 저하 | Pre-filter: Type Check Simulation(Phase 2) |
| 민감정보 노출 | 보안위험 | Redaction RegExp + Denylist 토큰 |
| 비용 폭증 | 예산 초과 | 토큰 모니터 + Dynamic 후보 수 감소 |
| Accept Rate 하락 | 가치 인식 저하 | Telemetry 기반 Weight Tuning + 품질 Alert |
| Retry 폭주 | 인프라 부하 | Circuit Breaker(연속 실패 n회) |
| Ranking 편향 | 낮은 품질 제안 표면화 | 다중 Scoring 컴포넌트 + Ensemble 평균 |
| Cache Staleness | 잘못된 후보 | TTL + 파일 변경 이벤트 무효화 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase1) | Context Builder + 기본 Suggest (K=3) | 첫 호출 P95 < 3s, Accept Rate(내부 테스트) ≥ 15% |
| M2 | Ranking Heuristic + Feedback Event 수집 | Telemetry 반영 후 Accept Rate ≥ +3pp |
| M3 | Streaming Partial Tokens + Fallback Provider | Timeout 대비 완전 실패율 < 2% |
| M4 | Explanation Layer + Risk Flags | 후보 90% rationale 포함 |
| M5 | Cost Budget & Dynamic Candidate Scaling | 예산 초과 시 자동 후보 감소 동작 |
| M6 | Type Simulation Filter(Phase3) | 컴파일 실패 후보 비율 30%→15% 이하 |
| M7 | Multi-Strategy Orchestration (Refactor vs Inline) | 두 Strategy 혼합 Accept Rate Ref Baseline ≥ +5pp |

Acceptance 예시(M3):
- 100 요청 중 Timeout 후 Fallback 성공 95 이상 / 실패 2 이하  
- Streaming 시작(TTFB) < 800ms (P95)

## 12. 향후 확장 계획 (Future Extensions)
- Multi-language (Python, Go) Context Adapter
- Semantic Rewrite Planner (멀티단계 리팩터링 플랜)
- Constraint-driven Generation (스타일 가이드 강제)
- In-editor Test Suggestion Generation
- Fine-tuned Domain Adapter Layer (팀별)
- On-device Lightweight Model Fallback
- Code Risk Heatmap(변경 영향 스코어) 내장
- Auto Refactor Draft with Approval Workflow
- Knowledge Graph Integration (API Usage Example Retrieval)

---

추가 메모:
- 모델 Provider 추상화 설계 시 최소 공통: generate(prompt, maxTokens, temperature, stream) + tokenUsage 메타 필요
- Ranking Weight 업데이트는 온라인 학습 (주기 10분) vs 배치(하루 1회) 혼합 가능성 검토

(끝)