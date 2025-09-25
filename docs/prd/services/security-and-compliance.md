# Security & Compliance Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2~4 보안 기반 설계)

---

## 1. 목적 및 범위 (Purpose & Scope)
Security & Compliance 서비스는 애플리케이션 전반(Core AI Engine, Code Analysis Pipeline, Realtime Collaboration, Auth, Telemetry)에서 처리되는 코드/메타데이터/사용자 정보/비밀을 안전하게 보호하고, 규제 및 엔터프라이즈 요구(감사, 추적성, 데이터 최소화)를 충족하기 위한 공통 보안·규정 준수 레이어를 정의한다.  
핵심 목표:
1. 기밀성(Confidentiality), 무결성(Integrity), 가용성(Availability) 기반 보안 제어 확립  
2. 데이터 최소 수집 & 분류(PII/Non-PII) 전략  
3. 규정 준수(초기: 일반 개인정보 보호 / 향후: SOC2 준비·GDPR 대응·엔터프라이즈 감사 로깅)  
4. AI 처리 경로 내 민감정보(Secrets/Token/PII) 무의도적 전송 차단  
5. 정책/설정 일관성(토큰 수명, 비밀번호 정책, 로깅 마스킹) 중앙화  

## 2. 범위 제외 사항 (Out of Scope)
- 정식 법률 자문 / 인증 심사 수행 자체  
- 하드웨어 인프라 물리적 보안 (클라우드 제공사 책임)  
- 고급 DLP(문서/이미지 분류) (Phase 5+)  
- 완전한 KMS(Cloud HSM) 관리 자동화 (후속 Ops)  
- 서드파티 Vendor 위험 평가 프로세스 문서화  
- 침투 테스트 실행(별도 보안 팀 또는 외부 업체)  

## 3. 현재 상태 (Current State)
- 인증/Auth PRD 초안만 존재, 암호 저장/토큰 관리 상세 미구현  
- Telemetry / Log 데이터 보안 분류 없음  
- 코드 제안/프롬프트 경로에서 민감 식별/마스킹 구현 전  
- 전송 암호화(HTTPS) 가정 외 구체적 키 로테이션/비밀 관리 전략 부재  
- 감사 로그 스키마/저장소 미정  

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | 데이터 분류(Classification) | PII vs Non-PII vs Secret 태그 기준 정의 |
| FR-2 | Secret Redaction | AI Prompt / Telemetry / Logs 내 토큰/API Key 패턴 마스킹 |
| FR-3 | 입력 검증(Input Validation) | API 경로별 스키마 검증(JSON Schema / Zod) |
| FR-4 | 인증 토큰 보호 | Access JWT(15m), Refresh(7d, HttpOnly, Rotation) |
| FR-5 | 암호 저장 | Argon2 (메모리 파라미터 튜닝) |
| FR-6 | 감사 로그(Audit Log Phase2) | auth.login, role.change, config.flag.update 이벤트 기록 |
| FR-7 | 권한(Authorization) 미들웨어 | Workspace/Project 스코프 접근 사전 검사 |
| FR-8 | Rate Limiting | /auth/login IP+계정, /suggest per user 동시 요청 제한 |
| FR-9 | Security Header | CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| FR-10 | TLS 강제 | HSTS preload (Phase3) |
| FR-11 | 로그 마스킹 | email 부분 마스킹(a***@example.com) & token prefix only |
| FR-12 | 비밀 관리(Phase3) | Secret provider interface (환경/추후 Vault) |
| FR-13 | Audit Integrity | Append-only + hash chain (Phase4) |
| FR-14 | 삭제/지우기(GDPR 준비) | user data pseudo-anonymize flow (Phase4) |
| FR-15 | Session Anomaly (Phase4) | 다중 위치/동시 세션 감지 alert |
| FR-16 | PII Export Stub | 사용자 요청 시 JSON export (Phase4) |
| FR-17 | Static Code Security Scan | CI: eslint security rules + dependency audit |
| FR-18 | Prompt Policy Filter | 금지 패턴(시크릿, private path) 검출 시 거부/경고 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
보안:
- 모든 저장 데이터 at-rest 암호화(KMS 관리, 초기 클라우드 기본 암호화)  
- 전송은 TLS1.2+ 이상, 구성: 최소 TLS1.3 선호  
성능:
- Redaction 파이프라인 처리 오버헤드 < 3% Latency 증가  
가용성:
- Auth & Role Gate 실패 시 Graceful 503 (Fail Open 금지)  
확장성:
- 감사 로그 이벤트 초당 100건 → Batch flush 지원  
유지보수:
- 보안 정책 변경(토큰 수명) Configuration & Environment 통해 관리  
감사:
- Audit Log 보존 180일 (Phase4: 365일)  
관찰성:
- security_event, rate_limit_triggered, secret_redacted 메트릭  
데이터 최소화:
- 필요 없는 Raw Prompt 30일 후 요약/익명화  
테스트:
- Redaction Regex & 경계 케이스 Unit Test 100%  
규정 준수 준비:
- SOC2 준비 체크리스트(접근 제어/Audit/백업) 항목 매핑 문서화  

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 Audit Log 구조
```json
{
  "id": "aud_123",
  "ts": 1737449600000,
  "actor": { "userId": "usr_1", "ipHash": "ip_xxx" },
  "action": "auth.login.success",
  "resource": { "type": "user", "id": "usr_1" },
  "meta": { "userAgentHash": "ua_abc" },
  "hash": "prevHash+currentPayload SHA256"
}
```
### 6.2 Secret Redaction (Pseudo TS)
```ts
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{32,}/g,
  /api_key_[A-Za-z0-9_-]{20,}/g
]

export function redact(input: string): string {
  return SECRET_PATTERNS.reduce(
    (acc, r) => acc.replace(r, match => match.slice(0,4) + "***REDACTED***"),
    input
  )
}
```
### 6.3 Authorization 미들웨어
```ts
function authorize(scope: 'workspace:read'|'workspace:write') {
  return (req, res, next) => {
    const { userId } = req.ctx.auth
    const allowed = permissionEngine.check(userId, scope, req.params.workspaceId)
    if (!allowed) {
      return res.status(403).json({ error: { code: 'FORBIDDEN' } })
    }
    next()
  }
}
```
### 6.4 Prompt Policy Filter 결과
```json
{
  "allowed": false,
  "reasons": ["secret_pattern_detected"],
  "redactedPrompt": "const API_KEY = sk-a***REDACTED***"
}
```
### 6.5 Rate Limit 응답
```json
{
  "error": { "code": "RATE_LIMIT", "retryAfterSec": 30 }
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- AuditLog(id, ts, actorUserId, actorIpHash, action, resourceType, resourceId, meta(jsonb), hash, prevHash)
- RedactionStat(id, pattern, count, windowStart)
- RateLimitBucket(id, key, windowStart, count, limit)
- SecretPattern(id, regex, description, active)
- SecurityIncident(id, type, severity, status, createdAt, resolvedAt?, meta)
- PermissionGrant(id, subjectUserId, scope, resourceType, resourceId, createdAt, expiresAt?)
- DataDeletionRequest(id, userId, status, requestedAt, processedAt?)
- AnomalySession(id, userId, sessionId, reason, detectedAt)
인덱스:
- AuditLog(actorUserId, ts)
- AuditLog(resourceType, resourceId)
- RateLimitBucket(key, windowStart)
보존:
- AuditLog 180일 (압축/아카이브)
- RateLimitBucket 롤링 window
Derived Metrics:
- auth_login_failure_rate
- redaction_rate = total_redacted_tokens / total_processed_tokens
- anomaly_session_rate

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 로그인 성공
1. Credential 검증 → 성공  
2. AuditLog(auth.login.success) 기록  
3. 실패 n회 → auth.login.failed 기록 + 잠금 시 auth.account.locked  
### 8.2 Suggest Prompt 처리
1. 코드 스니펫 수집 → Redaction Pass → 금지 패턴 감지?  
2. 감지 시 either reject or sanitize → Telemetry(secret_redacted)  
3. 모델 호출 → 응답 저장 시 민감 여부 검증  
### 8.3 Role 변경
1. Owner/Admin → member role update  
2. Authorization 체크 → 성공 시 AuditLog(role.change)  
3. 실패 → 403 + audit(role.change.denied)  
### 8.4 Rate Limit
1. API hit → bucket 조회 증가  
2. 초과 → 429 응답 + Telemetry(rate_limit_triggered)  
### 8.5 데이터 삭제 요청 (Phase4)
1. 사용자 request → DataDeletionRequest 생성(status=PENDING)  
2. 워커: 관련 PII 필드 nullify / pseudo anonymize  
3. 완료 → status=COMPLETED + AuditLog(data.deletion)  
### 8.6 Anomaly Session
1. 새 위치 로그인 → 최근 위치/ASN 비교  
2. 편차 임계 초과 → anomaly_session.created 이벤트 → 알림  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Configuration & Environment (토큰 수명, rate limit 값, secret 패턴)
Downstream:
- Auth & User Management (lockout, role)
- Core AI Engine (Prompt filter/redaction)
- Telemetry & Observability (security 이벤트 기록)
- Notification & Feedback (보안 경보 표시)
Cross:
- Projects & Workspaces (scope 검사)
- Performance Optimization (Redaction 오버헤드 측정)
외부:
- Secret Store (Phase3/4)
- GeoIP/ASN 서비스 (위치 이상 탐지)
- Hashing 라이브러리(Argon2)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| Prompt에 비밀 유출 | 외부 모델 전송 위험 | 사전 redaction + deny rule |
| Audit 위변조 | 법적 신뢰 감소 | Hash chain + append-only |
| Rate Limit 우회 | 자원 남용 | IP+User 복합 키 + 지연 응답 |
| 과도한 Redaction → 품질 저하 | AI 맥락 손실 | 패턴 최소화 + 리포트 튜닝 |
| Role Escalation 버그 | 권한 남용 | 중앙 permissionEngine & 테스트 |
| 삭제 요청 미처리 | 규정 위반 | SLA 모니터 + escalation alert |
| Anomaly 탐지 오탐 | 사용자 경험 저하 | 임계 multi-factor (distance+ASN) |
| Secret 패턴 갱신 지연 | 새 Key 포맷 누락 | 패턴 버전 관리 + CI 테스트 |
| PII 로그 등장 | 개인정보 노출 | 로거 마스킹 + 테스트 |
| CSP 미구현 | XSS/인젝션 위험 | 엄격 CSP + nonce 정책 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | Redaction, 기본 AuditLog, Rate Limit | 비밀 패턴 테스트 100% 통과 |
| M2 | PermissionEngine + Role 변경 로그 | 권한 없는 호출 403 & audit 기록 |
| M3 | Security Headers + Argon2 파라미터 튜닝 | OWASP header 스캔 통과 |
| M4 (Phase3) | Secret Provider Interface, Rotation Stub | Secret 교체 후 모니터 no downtime |
| M5 | Hash Chain Audit + Export 도구 | 연속 hash 검증 100% 성공 |
| M6 (Phase4) | Data Deletion & Pseudonymization | 삭제 요청 24h 내 처리 |
| M7 | Anomaly Detection + Alert | 오탐율 < 5% (테스트 세트) |
| M8 (Phase5) | Policy-based Prompt Filter 고도화 | False negative < 2% 목표 |

Acceptance 예시(M2):
- Member가 role 변경 시도 → 403 + audit(role.change.denied)
- Owner가 변경 → 200 + audit(role.change)

## 12. 향후 확장 계획 (Future Extensions)
- OPA(Open Policy Agent) 기반 세분 규칙  
- Fine-grained Scope Tokens (project:read:*)  
- Zero-Knowledge Secret Storage(미래)  
- Confidential Compute / Enclave inference  
- Automated Key Rotation Scheduler  
- DLP(코드 주석 내 PII 탐지) 스캐너  
- Multi-region Data Residency 정책  
- Tamper-evident Ledger 외부 백업  
- MFA / WebAuthn (Auth PRD 연계)  

---
내부 검토 체크리스트:
- Secret 패턴 테스트 케이스 추가 여부
- Argon2 파라미터 (memoryCost, timeCost) 벤치 결과 문서화
- Audit hash chain 기능 통합 테스트
- Rate limit 값 Configuration 키 정의
- Data deletion pseudo anonymization 스펙 명세

(끝)