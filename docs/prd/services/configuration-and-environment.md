# Configuration & Environment Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2 환경 분리 준비)

---

## 1. 목적 및 범위 (Purpose & Scope)
Configuration & Environment 서비스는 애플리케이션(클라이언트, Edge/API, Core AI Engine, Code Analysis Pipeline)의 **환경별(Environment-specific) 설정값** 관리, 안전한 비밀(Secrets) 주입, Feature Flag 기반 점진적 출시(Progressive Delivery), 런타임 동적 설정 업데이트(Hot Reload) 메커니즘을 정의한다.  
핵심 목표:
1. 환경(dev / preview / staging / production) 간 일관된 설정 스키마
2. 런타임에서 안전하고 최소 권한으로 비밀 주입
3. Feature Flag/Experiment 토대 (초기 단순 boolean → 향후 퍼센트 롤아웃)
4. 구성 Drift(환경 간 설정 불일치) 조기 감지
5. 재배포 없이 동적 튜닝이 필요한 값 (예: 샘플링율, Latency 임계치) 반영 경량화

## 2. 범위 제외 사항 (Out of Scope)
- 결제 플랜/라이선스 기반 제약 로직 (Billing Service)
- 고급 Experiment Bucketing (Experimentation 플랫폼 Phase 4+)
- Secret Rotation 워크플로 자동화 (Vault 연동 Phase 4)
- 인프라 IaC(Terraform) 전체 정의 (Deployment & Ops 문서)
- 정책 엔진(OPA / ABAC) 고급 규칙 (Security & Compliance Phase 4+)

## 3. 현재 상태 (Current State)
- Vite 기반 `.env` 로컬 개발 변수만 사용 (VITE_API_BASE_URL 등)
- 중앙화된 설정 레지스트리/스키마 검증 부재
- Feature Flag, 동적 재구성(예: Telemetry 샘플링) 메커니즘 미구현
- 비밀(LLM API Key 등) 관리 전략 미정 (하드코딩 위험 존재)

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | 환경 계층 구조 | dev / preview / staging / production / (future: enterprise) |
| FR-2 | 설정 스키마 정의 | schema.json: key, type, default, mutable(true/false), sensitive |
| FR-3 | 정적 vs 동적 구분 | build-time(Vite) / runtime(fetch config endpoint) |
| FR-4 | Feature Flag 최소 | boolean flags (예: enableRealtime, enableNewParser) |
| FR-5 | Flag 평가 로직 | 사용자/워크스페이스 콘텍스트 없이 전역(Phase2) |
| FR-6 | Telemetry 샘플링율 동적 갱신 | /config/poll 주기 60s |
| FR-7 | Config ETag 기반 캐시 | 변경 없으면 304 |
| FR-8 | 비밀 주입 | 서버 사이드 환경 변수 → 런타임 클라이언트 전송 금지 마스킹 |
| FR-9 | 스키마 검증 파이프라인 | CI에서 schema.json + 환경별 values 비교 |
| FR-10 | Drift 검사 | staging vs production diff 발견 시 실패 옵션 |
| FR-11 | Rollout 전략(Phase3) | % 기반 enableSuggestionRankingBeta |
| FR-12 | Flag 감사 로그(Phase3) | 변경자, 변경 전/후, 이유 |
| FR-13 | 안전한 fallbacks | config fetch 실패 시 마지막 성공 캐시 사용 |
| FR-14 | Immutable 값 보호 | mutable=false 항목 런타임 override 차단 |
| FR-15 | KPI 임계 설정 | latency.p95.suggest.thresholdMs, alert.enabled |
| FR-16 | Export Bundling | 클라이언트 build 시 public-safe keys만 노출 |
| FR-17 | Secret Masking | *** 표시 반환 (로그/전달 시) |
| FR-18 | 규칙 기반 재시도 | fetch config 네트워크 오류 3회 후 backoff |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- Config fetch API 응답 P95 < 200ms
- 폴링 주기 60s (변경률 낮음) / 긴급 변경 시 invalidate webhook (Phase3)  
신뢰성:
- 마지막 성공 config 로컬 저장(LocalStorage or Memory) → 실패 시 재사용  
보안:
- Secret 키는 서버 전용 (접두: SECRET_, INTERNAL_) 클라이언트 누출 금지  
확장성:
- 환경 추가 시 schema.json 확장 (엔티티 수 200개까지 성능 유지)  
일관성:
- 모든 key 네이밍: kebab-case 또는 dot.notation (혼합 금지)  
감사:
- 변경 이벤트(Phase3) audit_log 테이블 기록  
국제화:
- 사용자 Facing 메시지 Flag는 i18n 지원 (예: banner.message.key)  
유지보수:
- Deprecated 키: schema에서 status=deprecated + 제거 기한  
관찰성:
- config_fetch_success, config_fetch_failure 이벤트 Telemetry  
테스트:
- Snapshot: staging vs production config diff test  
재현성:
- 특정 commit + 환경 조합 config snapshot 기록 가능  

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 Runtime Config Fetch
GET /api/config
Response:
```json
{
  "version": "2025-09-20T15:00:00Z",
  "etag": "cfg_abc123",
  "keys": {
    "feature.enableRealtime": true,
    "feature.enableNotificationCenter": false,
    "telemetry.sampleRate": 0.5,
    "latency.threshold.suggest.p95": 3000,
    "ui.maxToast": 3
  }
}
```
Headers: ETag: "cfg_abc123"

### 6.2 Conditional (If-None-Match)
GET /api/config (If-None-Match: cfg_abc123) → 304 Not Modified

### 6.3 Admin Flag Update (Phase3)
PATCH /api/admin/config/flags
```json
{
  "changes": [
    { "key": "feature.enableRealtime", "value": true, "reason": "rollout-phase2" }
  ]
}
```
Response:
```json
{ "success": true, "updated": 1, "version": "2025-10-11T02:10:00Z" }
```

### 6.4 Schema 구조 (schema.json)
```json
{
  "version": 3,
  "keys": [
    {
      "key": "feature.enableRealtime",
      "type": "boolean",
      "default": false,
      "mutable": true,
      "sensitive": false,
      "description": "Realtime collaboration toggle"
    },
    {
      "key": "telemetry.sampleRate",
      "type": "number",
      "default": 1.0,
      "min": 0,
      "max": 1,
      "mutable": true,
      "sensitive": false
    },
    {
      "key": "secret.llm.provider.apiKey",
      "type": "string",
      "mutable": false,
      "sensitive": true
    }
  ]
}
```

### 6.5 Client Helper (Pseudo TS)
```ts
interface RuntimeConfig {
  get<T = any>(key: string, fallback?: T): T
  onChange(handler: (changedKeys: string[]) => void): () => void
  refresh(): Promise<void>
}
export const runtimeConfig: RuntimeConfig = { ... }
```

### 6.6 Telemetry 이벤트
```json
{
  "name": "config_fetch_success",
  "ts": 1737449600000,
  "attributes": { "etag": "cfg_abc123", "durationMs": 84 }
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- ConfigVersion(id, versionTimestamp, etag, json, createdAt)
- FlagChangeLog(id, key, oldValue, newValue, changedBy, reason, createdAt)
- SecretReference(id, key, provider, path, createdAt, rotatedAt?)
- EnvironmentSnapshot(id, env, commitSha, etag, createdAt)
- ConfigDriftAlert(id, sourceEnv, targetEnv, diffCount, createdAt, resolvedAt?)
- DeprecatedKey(id, key, removeAfter, createdAt, status)
인덱스:
- ConfigVersion(versionTimestamp)
- FlagChangeLog(key, createdAt)
- EnvironmentSnapshot(env, commitSha)
보존:
- ConfigVersion 180일 (핵심 역사 필요 시 압축 저장)
- FlagChangeLog 365일
Derived Metrics:
- flag_change_frequency = count(changes)/window
- drift_rate = drift_alerts / comparisons
- config_fetch_error_rate

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 앱 시작
1. 클라이언트 빌드시 embedded 기본 값 로드  
2. 런타임 /api/config 호출 → 성공 시 머지 → 이벤트 발생  
3. 실패 → fallback 기본 값 유지 + 재시도(backoff)  

### 8.2 주기적 업데이트
1. setInterval(60s) → If-None-Match 헤더 포함 요청  
2. 304 → 무시 / 200 → 변경 키 diff 계산, 핸들러 호출  

### 8.3 Feature Flag Rollout (Phase3)
1. Admin PATCH 변경 → ConfigVersion 신규 생성  
2. Broadcast (웹훅 / 메시지 큐) → 캐시 무효화  
3. 클라이언트 폴링 직후 반영 → UI 조건부 렌더  

### 8.4 Drift Detection (CI)
1. CI 스크립트: staging_config.json vs production_config.json 비교  
2. 허용하지 않는 diff 존재 → 실패 & 슬랙 알림  

### 8.5 Secret 관리
1. 서버 기동 시 Provider(Vault 또는 ENV)에서 secret.llm.provider.apiKey 로드  
2. 클라이언트 Config 생성 시 sensitive=true 키 제거  
3. 로그 출력 시 키값 마스킹  

### 8.6 Deprecation Lifecycle
1. status=deprecated → 콘솔 경고(빌드)  
2. removeAfter 지난 뒤 값 존재 시 CI 실패  
3. 완전 삭제 후 snapshot diff 기록  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Deployment & Ops (환경 변수 주입, secret backend)
- Security & Compliance (secret 정책, rotation)
Downstream:
- Core AI Engine (모델 선택, 샘플링율)
- Telemetry & Observability (샘플링율, 임계치)
- Performance Optimization (latency budget)
- Notification & Feedback (feature flag로 새로운 UI 제어)
Cross:
- Internationalization (banner.message.key flag)
- Auth & User Management (workspace feature quotas)
외부:
- Secret Store(Vault/AWS Secrets Manager) (Phase4)
- CDN 캐시 헤더 (config static fallback)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| Drift 미검출 | 예측 불가 동작 | CI 비교 + Slack Alert |
| Secret 노출 | 보안 사고 | sensitive 필터 + 마스킹 테스트 |
| 과도한 폴링 | 네트워크 낭비 | ETag + 백오프 |
| Flag 남용 | 복잡성 증가 | flag lifecycle 정책 + 정기 정리 |
| Deprecated 미제거 | 기술부채 | removeAfter CI 게이트 |
| 실패 시 빈 Config | 기능 비활성 | Fallback + 마지막 캐시 |
| 무결성 손상(JSON 파손) | 런타임 오류 | JSON Schema validate + fail safe |
| 불법 변경(인증 안됨) | 설정 변조 | Admin API 인증/감사 로그 |
| Secret Rotation 실패 | 서비스 중단 | Dual secret window (old + new) |
| Large Config Payload | 성능 저하 | Key 분할 / 그룹화 / 압축 (Phase3) |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | schema.json + /api/config + ETag 캐시 | 최초 fetch P95 < 200ms |
| M2 | Feature Flags(기본 Boolean) + CI Drift 검사 | Drift 발생 시 CI 실패 |
| M3 | Admin Update API + Audit Log | Flag 변경 Audit 100% 기록 |
| M4 | Percentage Rollout + Broadcast | 10%→50%→100% 단계적 적용 |
| M5 (Phase3) | Secret Mask & Rotation Stub | 민감키 노출 이벤트 0 |
| M6 | Deprecation Enforcement | 만료 키 사용 시 CI 차단 |
| M7 (Phase4) | External Secret Store 통합 | Vault downtime 시 fallback |
| M8 | Dynamic Threshold Tuning | Latency threshold 변경 후 2분 내 반영 |

Acceptance 예시(M2):
- staging vs production diff (허용되지 않은 key 추가) → drift 검사 실패 & exit code 1

## 12. 향후 확장 계획 (Future Extensions)
- Contextual Flags (사용자 속성 기반 세분화)  
- Policy-driven Override (조건식 DSL)  
- Remote Evaluation (Edge worker)  
- Multi-tenant Config Partition  
- Signed Config Manifest (무결성 증명)  
- Config Change Rollback API  
- Progressive Experiment Buckets (traffic weight)  
- Hierarchical Config (org → workspace → project 상속)  

---
내부 검토 체크리스트:
- schema.json 문서화 (key, type, mutable)
- drift 검사 스크립트 작성
- secret 접두 네이밍 표준(SECRET_, INTERNAL_)
- audit 로그 테이블 인덱스 전략
- fallback 저장 매체(localStorage vs memory) 결정

(끝)