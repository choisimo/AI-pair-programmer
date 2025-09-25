# Auth & User Management Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 1 설계)

---

## 1. 목적 및 범위 (Purpose & Scope)
Auth & User Management 서비스는 애플리케이션 사용자 식별, 세션 수명 관리, 권한(Role / Permission) 부여, 팀/워크스페이스 기반 자원 접근 제어의 기초 보안 레이어를 제공한다.  
초기(Phase 1) 목표는 단일 이메일/비밀번호 또는 OAuth(선택) 기반 인증과 기본 사용자 프로필 관리.  
중기(Phase 3~4) 확장: 조직(Organization) / 워크스페이스(Workspace) / 역할 기반 권한(Role-Based Access Control, RBAC) / 감사 로깅(Audit) / SSO(SAML/OIDC).  
장기(Phase 5+) 확장: 세분화된 Permission Matrix, 정책 기반(Policy Engine) 제어, 규정 준수(Audit Export, Data Residency).

## 2. 범위 제외 사항 (Out of Scope)
- 결제/구독(Subscription & Billing) 시스템
- 세션 외 장기 토큰 회전(Key Management for API tokens) (Phase 3+)
- 서드파티 Enterprise SSO (SAML/OIDC) (Phase 4)
- Usage/Billing Metering (Telemetry & Billing 서비스와 연계)
- 완전한 Audit Trail Export (Phase 4+)
- 사용자 간 Direct Messaging (Realtime Collaboration 확장)

## 3. 현재 상태 (Current State)
- 프론트엔드만 존재, 백엔드 인증 미구현
- UI 레벨 로컬 스토리지 토큰 참조 패턴만 시나리오 문서에 존재
- 사용자 엔터티/워크스페이스 구조/권한 체계 미정
- 보안 헤더/Refresh Token 구조 / CSRF 보호 전략 미정

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | 사용자 등록(Sign-up) (Phase 1 옵션) | Email + Password + 약관 동의(checkbox) |
| FR-2 | 로그인(Login) | Email + Password → Access Token(짧은 수명) + Refresh Token(HTTP-Only) |
| FR-3 | 로그아웃(Logout) | Refresh Token 폐기(서버 저장 Blacklist or Rotating) |
| FR-4 | 세션 갱신(Token Refresh) | 만료 2분 전 Silent Refresh |
| FR-5 | 사용자 프로필 조회/수정 | 이름, 아바타, Preferred Language, Timezone |
| FR-6 | 비밀번호 재설정 | 이메일 기반 Reset Link / 토큰 만료(15분) |
| FR-7 | 이메일 검증(Optional) | 신규 계정 활성화 전에 verify link |
| FR-8 | 워크스페이스(Workspace) 생성 (Phase 2) | 기본 개인 워크스페이스 자동 생성 |
| FR-9 | 워크스페이스 초대 (Phase 2) | Email Invite → Pending Member → Accept |
| FR-10 | 역할 부여 (Phase 2) | Owner / Admin / Member (기본 3계층) |
| FR-11 | 권한 평가(Access Check) | 라우트/리소스 액세스 전 role 기반 Gate |
| FR-12 | 활동 기록(Audit Lite) (Phase 2) | lastLoginAt, failedAttemptCount, inviteAcceptedAt |
| FR-13 | Lockout 보호 | 실패 n회(예: 10) 시 15분 Lock |
| FR-14 | Feature Flag 기반 인증 모드 | password | oauth-only | mixed |
| FR-15 | OAuth Provider (Phase 3) | GitHub / Google 최소 1개 (profile + email) |
| FR-16 | 계정 삭제(Soft Delete) | 30일 유예 → 영구 삭제 배치 |
| FR-17 | API Personal Token (Phase 3) | 읽기/쓰기 Scope 발급/회수 |
| FR-18 | Terms & Privacy 버전 고정 | 동의 version 저장 (re-consent 필요시) |

## 5. 비기능 요구사항 (Non-Functional Requirements)
| 영역 | 초기 목표 | 확장 |
|------|---------|-----|
| 보안(Security) | 비밀번호 Argon2 해시, JWT Access 15m, Refresh 7d | SSO, 정책 기반 차단 |
| 성능(Performance) | 로그인 P95 < 600ms | 대규모 조직 1k+ 사용자 |
| 가용성(Reliability) | Auth API 99% | 99.5% (Phase 4) |
| 확장성(Scalability) | 동시 로그인 50 req/s | 200 req/s (수평 확장) |
| 접근성(A11y) | 폼 ARIA 상태, 에러 라벨 | MFA UI 접근성 |
| 국제화(i18n) | 에러/폼 라벨 키 적용 | 다국어 이메일 템플릿 |
| 감사(Audit) | lastLogin, invite 수락 | 완전한 CRUD 추적 |
| 개인정보(PII) | 최소한의 저장, 비밀번호 해시 | Geo Residency / Encryption at Rest |

세부:
- Rate Limiting: /login IP별 5req/분 / 계정별 10req/분
- 비밀번호 정책: 최소 8자 / 대소문자, 숫자 중 2종 이상 (Phase 1), 강화 규칙(optional Phase 3)
- 토큰 서명 알고리즘: EdDSA(Ed25519) 또는 ES256 (회전키 전략 Phase 3)

## 6. API/인터페이스 계약 (Interfaces)
(표준 응답 envelope: { success:boolean, data?:T, error?:{ code, message } })

### 6.1 로그인
POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```
Response (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access",
    "expiresIn": 900,
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "name": "홍길동",
      "avatarUrl": null,
      "preferredLanguage": "ko",
      "defaultWorkspaceId": "ws_abc"
    }
  }
}
```
Set-Cookie: refreshToken=opaque_token; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh

### 6.2 토큰 갱신
POST /api/auth/refresh  
쿠키 refreshToken 사용  
Response:
```json
{
  "success": true,
  "data": { "accessToken": "new-access", "expiresIn": 900 }
}
```

### 6.3 로그아웃
POST /api/auth/logout (쿠키 refreshToken 무효화)

### 6.4 사용자 프로필
GET /api/users/me  
PATCH /api/users/me
```json
{
  "name": "새 이름",
  "avatarUrl": "https://cdn/...",
  "preferredLanguage": "en",
  "timezone": "Asia/Seoul"
}
```

### 6.5 워크스페이스 (Phase 2)
POST /api/workspaces  
```json
{ "name": "Team Alpha" }
```
POST /api/workspaces/{id}/invite
```json
{ "email": "invitee@example.com", "role": "MEMBER" }
```
POST /api/workspace-invites/{inviteId}/accept

### 6.6 역할/권한 간단 모델
(서버 내부)
```ts
type Role = 'OWNER' | 'ADMIN' | 'MEMBER'

interface PermissionMatrix {
  workspaces: {
    create: Role[]        // ['OWNER']
    invite: Role[]        // ['OWNER','ADMIN']
    delete: Role[]        // ['OWNER']
    viewSettings: Role[]  // ['OWNER','ADMIN','MEMBER']
  }
  projects: {
    create: Role[]
    delete: Role[]
  }
}
```

### 6.7 에러 코드(예시)
| code | 의미 |
|------|------|
| AUTH_INVALID_CREDENTIALS | 잘못된 이메일/비밀번호 |
| AUTH_ACCOUNT_LOCKED | 잠금 상태 |
| AUTH_TOKEN_EXPIRED | Access 만료 |
| AUTH_REFRESH_INVALID | Refresh 토큰 무효 |
| AUTH_EMAIL_NOT_VERIFIED | 이메일 미검증 |
| AUTH_INVITE_INVALID | 초대 토큰 무효 |

## 7. 데이터 모델 (Data Model)
엔티티:
- User(id, email(unique), passwordHash, name, avatarUrl, preferredLanguage, timezone, emailVerified:boolean, lastLoginAt, createdAt, updatedAt, deletedAt?)
- Workspace(id, name, ownerUserId, createdAt, updatedAt, archivedAt?)
- WorkspaceMember(id, workspaceId, userId, role, invitedByUserId, status('PENDING'|'ACTIVE'), invitedAt, activatedAt)
- RefreshToken(id, userId, tokenHash, createdAt, expiresAt, revokedAt, userAgentHash, ipHash)
- PasswordResetToken(id, userId, tokenHash, createdAt, expiresAt, usedAt)
- InviteToken(id, workspaceId, email, role, tokenHash, createdAt, expiresAt, acceptedAt)
- TermsAcceptance(id, userId, termsVersion, acceptedAt, ipHash)
- UserSetting(id, userId, key, value, updatedAt) (Phase 2)
- ApiPersonalToken(id, userId, name, tokenPrefix, hash, scopes[], createdAt, lastUsedAt, revokedAt) (Phase 3)

인덱스:
- User(email), User(deletedAt)
- Workspace(ownerUserId)
- WorkspaceMember(workspaceId, userId)
- RefreshToken(userId, expiresAt)
Retention:
- Revoked RefreshToken: 7일 후 제거
- PasswordResetToken: usedAt 또는 expiresAt + 7일 후 삭제
- Soft Deleted User: 30일 후 물리 삭제

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 로그인
1. 사용자가 폼 제출  
2. 서버: email 조회 → passwordHash 검증 → lockout 상태 확인  
3. 성공 → accessToken 발급 / refreshToken 쿠키 설정 → lastLoginAt 업데이트  
4. 실패 → failedAttemptCount++ / 임계 초과 → lockoutUntil 설정 → 알림

### 8.2 토큰 갱신
1. Access 만료 임박(프론트 타이머) → /refresh 호출  
2. refreshToken 검증 (revoked? expires?)  
3. 새 Access 발급 + (선택) refresh 회전(rotating)  
4. Rotation 실패 → 재로그인 요구

### 8.3 비밀번호 재설정
1. 사용자 email 제출 → PasswordResetToken 생성 (만료 15m) → 이메일 전송  
2. 링크 클릭 → 토큰 검증 → 새 비밀번호 설정 → 모든 RefreshToken 폐기

### 8.4 워크스페이스 초대 (Phase 2)
1. Admin/Owner → invite(email, role)  
2. InviteToken 생성 → 이메일 전송  
3. 수신자 가입 또는 로그인 후 accept → WorkspaceMember status=ACTIVE

### 8.5 로그아웃
1. /logout → 해당 refreshToken 레코드 revokedAt 설정  
2. 클라이언트: 로컬 Access 제거 / 캐시 초기화

### 8.6 권한 검사
1. 요청 수신 → Access JWT 검증(decoding + exp + aud)  
2. userId → WorkspaceMember(role) 조회  
3. PermissionMatrix 비교 → 허용/거부  
4. 거부 시 403 + error code

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Configuration & Environment (토큰 만료, 해시 비용, provider 설정)
- Security & Compliance (비밀번호 정책, 감사 전략)
Downstream:
- Projects & Workspaces (workspaceId 기반 접근)
- Realtime Collaboration (Presence 세션 식별)
- Telemetry & Observability (login_success, login_fail 이벤트)
- Notification & Feedback (비밀번호 재설정 완료 알림)
Cross:
- Internationalization (Validation 메시지 다국어)
- Performance Optimization (해시 비용 튜닝)
외부:
- Email Provider(API) (Password reset / Invitation)
- OAuth Provider(GitHub/Google)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 약한 비밀번호 | 계정 탈취 | 최소 정책 + 점수 기반 경고(Phase 2) |
| 토큰 탈취 | 세션 하이재킹 | Refresh HTTP-only + Rotation + IP/UserAgent 바인딩 |
| Brute Force 공격 | 계정 잠금/리소스 낭비 | Rate Limit + Lockout + 지연 응답(Random jitter) |
| Invite 남용 | 스팸 | 도메인 블락 리스트 + 초대 제한(일 n회) |
| Role Escalation 버그 | 권한 오용 | 중앙 PermissionMatrix 단일 소스 + 테스트 |
| 만료 미처리 | 보안 구멍 | 중앙 토큰 검증 미들웨어 + exp 검증 |
| 폐기 토큰 재사용 | 세션 유지 | Rotation + revoked 리스트 조회 |
| 데이터 일관성(삭제 사용자 잔류) | 고아 레코드 | Soft Delete(Flag) + Cleanup 배치 |
| OAuth 이메일 미검증 | 가짜 계정 | provider email_verified claim 검증 |
| PII 로그 노출 | 개인정보 유출 | 로그 마스킹(email 해싱) |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준(AC) |
|-----------|------|---------------|
| M1 (Phase1) | Email/Password Login, Refresh, Logout, Profile | 로그인 성공 P95 < 600ms, 비밀번호 해시 Argon2, 실패 계정 잠금 기능 동작 |
| M2 | Password Reset, Email Verification(옵션) | Reset flow E2E, 만료 토큰 거부, 이메일 검증 미완료 시 보호 라우트 차단 |
| M3 (Phase2) | Workspaces, Invites, Basic RBAC(OWNER/ADMIN/MEMBER) | Invite 수락 후 즉시 권한 반영, 권한 없는 액션 403 |
| M4 | Audit Lite (lastLogin, inviteAccepted), Terms Acceptance | Terms version 변경 시 재동의 요구 |
| M5 (Phase3) | OAuth Provider 1종, Personal API Token | OAuth 로그인 Accept Rate > 95%, Personal Token 생성/폐기 AC |
| M6 (Phase4) | SSO(OIDC/SAML) PoC, Advanced Audit | Enterprise 워크스페이스 Single Sign-On |
| M7 (Phase5) | Policy Engine 초안 (속성 기반) | 정책 거부 케이스 100% 테스트 커버 |

Acceptance 예시(M3):
- 권한 없는 사용자(ROLE=MEMBER)가 workspace invite 호출 시 403
- Invite 토큰 만료 후 사용 시 AUTH_INVITE_INVALID 반환

## 12. 향후 확장 계획 (Future Extensions)
- 다요소 인증(MFA) (TOTP / WebAuthn)
- 속성 기반 접근 제어(ABAC) (리소스 태그 + 정책)
- Session Anomaly Detection (IP 이동 / 동시 접속 경보)
- API Personal Token 사용량 대시보드
- Region-based Data Residency (User / Workspace 분할)
- Organization 계층 (Org → Workspaces)
- Delegated Admin (특정 권한 위임)
- SCIM Provisioning (Enterprise)
- Fine-grained Permissions (프로젝트 단위 Create/Read/Update/Delete Matrix)
- Account Merge Flow (소셜+이메일 계정 통합)

---

문서 검토 체크포인트(내부):
- 비밀번호 해시 파라미터(메모리/시간) 비용 측정표 필요
- JWT 서명키 회전 전략 문서 별도 (security-and-compliance.md 연계)
- Invite Rate Limit 값 확정 (기본 20/일)
- Email Template 다국어 키 정의 (i18n 서비스 연계)

(끝)