# Telemetry & Observability Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2 착수 대비)

---

## 1. 목적 및 범위 (Purpose & Scope)
Telemetry & Observability 서비스는 제품 전반의 이벤트(event), 메트릭(metric), 로그(log), 트레이스(trace)를 구조화하여 **성능, 품질, 신뢰성, 사용 패턴** 을 가시화하고 데이터 기반 개선 루프(Feedback Loop)를 가능하게 하는 계층이다.  
핵심 가치:
- Core AI Engine / Code Analysis Pipeline / Consistency Validator / Notification 시스템의 결과를 정량화
- Accept Rate, Suggestion Latency, Indexing Duration, Breaking Diff Detection Coverage 같은 KPI 추적
- 이상(anomaly) 탐지 또는 임계치(threshold) 기반 경보(Alert) 트리거

초기(Phase 2): 최소 이벤트 스키마, 기본 메트릭 수집, 에러 로깅, 수동 대시보드 구성.  
중기(Phase 3~4): 트레이싱(분산 추적), 샘플링 전략, 비용 최적화, 알림(Webhook/Slack) 통합.  
장기(Phase 5+): 예측(예: Accept Rate 감소 선행 신호), ML 기반 이상 탐지, 데이터 레이크 연계.

## 2. 범위 제외 사항 (Out of Scope)
- 결제/청구용 정밀 Usage Metering (별도 Billing/Usage 서비스)
- 개인정보(PII) 고급 마스킹 규칙 엔진 (Security & Compliance 문서 범위)
- A/B 실험 플랫폼(Experimentation) 전 기능 (Phase 4+)
- 장기 보관 Data Warehouse 모델링 (Phase 4+)
- Incident Management(온콜 파이프라인) 자체 구현

## 3. 현재 상태 (Current State)
- 프런트엔드만 존재: Telemetry 수집 코드 없음
- 이벤트 명명 규칙, 공통 스키마 미정
- Accept Rate / Latency 등 핵심 KPI 정의만 상위 개요 문서에 존재
- 백엔드 인프라(수집 엔드포인트, 버퍼, 영속 스토리지) 미구현

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | 이벤트 스키마 표준화 | eventName, context, user/workspace, timestamp, version |
| FR-2 | 클라이언트 이벤트 전송 | Batch(최대 20개 또는 5초) + 백오프 재시도 |
| FR-3 | 핵심 이벤트 정의 | suggestion_accept, suggestion_dismiss, indexing_progress, notification_shown, api_diff_detected |
| FR-4 | 메트릭 집계(서버) | Accept Rate, Suggestion Latency, Index Duration |
| FR-5 | 에러 로깅 | Client JS error + backend error categorization |
| FR-6 | 추적(Phase 3) | Suggest API request → model inference → ranking span 연결 |
| FR-7 | 샘플링(Phase 3) | High-volume 이벤트 10~30% 샘플링 (configurable) |
| FR-8 | 임계치 알림 | Latency P95 > 임계 5분 지속 시 Alert 이벤트 발생 |
| FR-9 | 데이터 보존 정책 | Raw events 30d, Aggregated metrics 180d |
| FR-10 | PII 마스킹 | email, token, path variable(가능한 경우) 해싱/치환 |
| FR-11 | 버전 태깅 | clientVersion, schemaVersion 필드 강제 |
| FR-12 | 전송 실패 처리 | 로컬 큐 (IndexedDB 또는 in-memory fallback) |
| FR-13 | Feature Flag 노출 | telemetry.enabled=false 시 모든 전송 중단 |
| FR-14 | GDPR Delete 지원 (Phase 4) | userId 삭제 요청 시 관련 PII 필드 제거/치환 |
| FR-15 | 이벤트 리플레이(Phase 4) | Dead-letter queue 재처리 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 클라이언트 전송 오버헤드 < 2% CPU (Idle 시 flush)
- 네트워크 패킷 압축(gzip) 평균 payload < 25KB/flush  
신뢰성:
- 전송 성공률 ≥ 98% (네트워크 정상 시)
- 재시도 지수 백오프 최대 5회 후 드롭 로그  
확장성:
- 초당 이벤트 수 200 (Phase 2) → 2000 (Phase 4) 수용
- 멀티 샤드 파티션 전략(event date hash)  
보안:
- Access Token/Secret 문자열 절대 전송 금지 정규식 필터
- 사용자 식별자 hash(userId + salt) (Logs viewer에서 reversible 없음)  
관찰성 자체:
- Telemetry Pipeline 단계(ingest→queue→store) latency 메트릭  
비용:
- 고빈도 이벤트 샘플링율 동적 조정 (Accept Rate 변동폭 낮을 때 추가 샘플 다운)  
국제화:
- 이벤트 키는 영어 스네이크케이스, 설명 문서는 다국어 가능  
데이터 품질:
- Validation 실패 이벤트는 error_count(metric) 인크리먼트  
유지보수:
- 이벤트 스키마 변경 시 schemaVersion 증가 & 역호환 Layer

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 클라이언트 배치 전송
POST /api/telemetry/events
```json
{
  "clientVersion": "1.0.0",
  "schemaVersion": 1,
  "sentAt": 1737449600500,
  "events": [
    {
      "id": "evt_abc",
      "name": "suggestion_accept",
      "ts": 1737449600401,
      "userId": "usr_123",
      "workspaceId": "ws_789",
      "sessionId": "sess_xyz",
      "attributes": {
        "requestId": "req_123",
        "candidateId": "cand_4",
        "appliedBytes": 132
      },
      "context": {
        "clientLatencyMs": 1820,
        "editorLanguage": "ts"
      }
    }
  ]
}
```
Response 200:
```json
{ "success": true, "accepted": 10, "rejected": 0 }
```

### 6.2 인덱싱 진행 이벤트 (서버 내부 → Queue)
```json
{
  "name": "indexing_progress",
  "projectId": "prj_abc",
  "phase": "symbols",
  "percent": 46,
  "ts": 1737449600789
}
```

### 6.3 메트릭 스냅샷 조회 (Internal API)
GET /api/telemetry/metrics/suggestion-latency?window=1h
```json
{
  "success": true,
  "data": {
    "window": "1h",
    "p50": 850,
    "p95": 2100,
    "count": 1432
  }
}
```

### 6.4 경보(Alert) Webhook Payload
```json
{
  "alertId": "alt_latency_suggest_p95",
  "severity": "WARNING",
  "triggeredAt": 1737449700000,
  "metric": "suggestion_latency_ms_p95",
  "value": 3200,
  "threshold": 3000,
  "window": "5m",
  "samples": 5
}
```

### 6.5 TypeScript 클라이언트 SDK (Pseudo)
```ts
interface TelemetryClientOptions {
  endpoint: string
  flushIntervalMs?: number
  maxBatchSize?: number
  sampleRate?: number // 0~1
}

interface TelemetryEvent {
  id?: string
  name: string
  ts?: number
  attributes?: Record<string, any>
  context?: Record<string, any>
}

class TelemetryClient {
  constructor(opts: TelemetryClientOptions)
  track(event: TelemetryEvent): void
  flush(): Promise<void>
  setUser(userId: string, workspaceId?: string): void
  setSession(sessionId: string): void
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- RawEvent(id, name, ts, receivedAt, userHash, workspaceId, sessionId, schemaVersion, attributes(jsonb), context(jsonb), sampleRate, dropped:boolean)
- MetricAggregate(id/windowStart/windowSize, metricName, p50, p95, avg, count, updatedAt)
- AlertRule(id, metricName, thresholdType, comparator, thresholdValue, window, severity, enabled)
- AlertTrigger(id, alertRuleId, triggeredAt, value, windowStart)
- EventIngestError(id, rawPayload, errorCode, createdAt)
- TraceSpan(id, traceId, parentId?, name, startTs, endTs, attributes(jsonb)) (Phase 3)
- RetentionJob(id, executedAt, deletedCount, window)

인덱스:
- RawEvent(name, ts)
- RawEvent(userHash)
- MetricAggregate(metricName, windowStart)
- TraceSpan(traceId)
보존:
- RawEvent 30일
- TraceSpan 14일
- MetricAggregate 180일
Derived Metrics:
- accept_rate = sum(suggestion_accept)/ (suggestion_accept + suggestion_dismiss)
- error_rate = errors / total_requests
- indexing_avg_duration = avg(indexing_complete - indexing_start)
- notification_action_rate = notification_action / notification_shown

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 이벤트 수집
1. 클라이언트 track() 호출 → in-memory Queue push  
2. flushInterval 또는 배치 size 도달 → POST /events  
3. 서버 Validation → 성공: RawEvent 저장 / 실패: EventIngestError  
4. Aggregator (주기성 Worker) → MetricAggregate 업데이트  

### 8.2 Suggestion Latency 측정
1. 클라이언트 요청 시작 timeStamp 기록  
2. 응답 수신 → suggestion_response_received 이벤트 fire (latencyMs)  
3. 수집 후 aggregator: p50/p95 계산 → Alerts 평가  

### 8.3 Alert 트리거
1. Scheduler: 최근 5m latency_p95 > threshold?  
2. 조건 만족 n회(연속 3) → AlertTrigger 생성 & Webhook dispatch  
3. 상태 대시보드 표시 (Open / Acknowledged)

### 8.4 인덱싱 Progress
1. Index Worker 단계 → progress event emit  
2. Progress Handler: RawEvent 저장 & latest percent upsert (cache)  
3. READY 이벤트 → duration 계산 후 metric 업데이트  

### 8.5 샘플링
1. track 호출 시 sampleRate < Math.random() → drop=true  
2. dropped 이벤트는 클라이언트 로컬 카운터 증가 (품질 추적)  

### 8.6 데이터 삭제(GDPR, Phase 4)
1. userDelete 요청 → userHash 재계산 비교 매칭 → 해당 RawEvent PII 필드 nullify  
2. Async Job 완료 후 audit 기록

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (userId 해시, workspaceId)
- Configuration & Environment (endpoints, sampleRate, thresholds)
Downstream:
- Core AI Engine (Feedback 기반 가중치: accept_rate)
- Performance Optimization (지연/에러 hotspot 근거)
- Notification & Feedback (Alert 발생 시 사용자 통보)
Cross:
- Security & Compliance (PII 마스킹 규칙, GDPR 삭제)
- Deployment & Ops (로그 수집/Exporter 설정)
외부:
- Object Storage (장기 아카이빙 optional)
- Alerting 채널 (Slack/Webhook)
- Time-series DB (Prometheus / ClickHouse / Influx 후보)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 이벤트 폭증 (버스트) | 수집 지연/드롭 | 배압(backpressure) + 샘플링 상향 |
| PII 유출 | 규정 위반 | Regex/키 화이트리스트 + 마스킹 유닛테스트 |
| 지연된 Flush | 데이터 손실(탭 종료) | visibilitychange 시 강제 flush |
| Clock Skew | 잘못된 지표 | 서버 수신시간 보정(ts < now-24h drop) |
| Aggregation Race | 잘못된 통계 | UPSERT with atomic increment |
| Alert Noise | 경보 피로 | 연속조건(3회) + Hysteresis ±10% |
| Storage 비용 증가 | 비용 초과 | TTL 파티션 + Columnar 압축 |
| 샘플링 편향 | 메트릭 왜곡 | 핵심 이벤트(accept) 100% 수집, 부가 이벤트만 샘플 |
| Trace Overhead | 성능 저하 | Adaptive sampling (모델 지연 시 full capture) |
| GDPR 삭제 실패 | 법적 리스크 | 삭제 Job 재시도 + 감사 로그 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | 기본 이벤트 수집(suggestion_accept/dismiss, indexing_progress) + Batch Flush | 95% 이벤트 10초 이내 수집 반영 |
| M2 | MetricAggregator (accept_rate, suggestion_latency) + 기본 대시보드 | Accept Rate 실시간(≤1m 지연) |
| M3 | Alert Rule & Trigger (Latency P95) | 임계 초과 시 5분 내 AlertTrigger |
| M4 | Trace Span (Suggest Request) + 샘플링 | Trace 샘플 10% 내 latency 상관분석 |
| M5 (Phase3) | PII 마스킹 & GDPR Delete Stub | 마스킹 단위 테스트 100% 통과 |
| M6 | Advanced Sampling & Cost Report | 고빈도 이벤트 전송량 30% 절감 |
| M7 (Phase4) | GDPR 실제 삭제 & Dead-letter 재처리 | 삭제 요청 24h 내 완료 |
| M8 | ML 기반 이상 감지 PoC | 수동 Threshold 대비 탐지 리드타임 개선 |

Acceptance 예시(M2):
- 1시간 테스트 동안 수집한 suggestion_accept + dismiss 수 합이 클라이언트 로컬 카운트 대비 ≥ 98%
- Latency p95 계산값 수동 샘플링 측정 오차 ≤ 5%

## 12. 향후 확장 계획 (Future Extensions)
- Real-time Streaming Dashboard (WebSocket)
- Query Language (이벤트 필터 ad-hoc 질의)
- ML Anomaly Detection (Isolation Forest / STL Decomposition)
- Derived Cohort Metrics (신규 vs 복귀 사용자 Accept Rate)
- Cost Attribution (토큰 사용량 대비 Accept Rate 효율)
- Event Schema Registry & 자동 검증 툴
- Multi-tenant Partitioning / Cross-region replication
- Synthetic Transaction Monitoring (가짜 Suggest 호출 주기 검사)
- Backfill Engine (Raw 재처리 → 새로운 지표 생성)

---

내부 검토 체크리스트:
- 이벤트 명명 규칙 문서화 (snake_case, domain.prefix 제외 단순)
- 마스킹 정규식 우선순위 및 성능 벤치
- 샘플링 구성 값 환경 변수 이름 확정(TELEMETRY_SAMPLE_RATE 등)
- Alert Rule Storage 선택(파일 vs DB)
- Aggregation Window 경계(UTC 정각 vs sliding)

(끝)