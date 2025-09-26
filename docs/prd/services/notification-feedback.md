# Notification & Feedback Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
Notification & Feedback 서비스는 사용자 행동 결과, 시스템 상태(오류/성공/경고/정보), AI 제안 상태 변화, 백그라운드 비동기 작업 진행률 등을 즉각적이고 방해 최소화(Non-intrusive)된 방식으로 전달하는 UI/로직 레이어를 정의한다.  
Phase 1: Toast(이미 구현 기반), Inline Alert, Blocking Dialog(Confirm) 패턴 표준화  
Phase 2: Progress / Queue / 배치 작업 상태 / AI Suggestion Accept/Dismiss 피드백 / Announcement Banner  
Phase 3+: 우선순위 기반 Notification Center(집계), 사용자 정의(구독/음소거), 다국어(i18n) 및 접근성 개선(라이브리전 세분화)

## 2. 범위 제외 사항 (Out of Scope)
- 이메일/푸시 외부 채널 알림 (추후 Integrations 범위)  
- 시스템 로그/보안 이벤트 감사 기록 (Security & Compliance)  
- 실시간 채팅/메시징 (Collaboration 확장)  
- 긴 형식 문서형 공지 (Docs 시스템)  
- 모바일 푸시(Device Native)  

## 3. 현재 상태 (Current State)
- shadcn/ui Toast 컴포넌트 + use-toast 훅 존재 (TOAST_LIMIT=1, duration 미구현)  
- Notification 분류 체계/우선순위/중복 억제 전략 미정  
- Inline Alert / Global Banner / Progress toast 미표준  
- Feedback Telemetry(accept/dismiss) 미연동  
- 다국어 적용/문구 키 구조 미정  

## 4. 기능 요구사항 (Functional Requirements)
FR-1: 알림 타입: success, error, warning, info, neutral, destructive(=error 강화) 정의  
FR-2: Toast 구조: (title, description, action?, variant, duration, id) → duration 기본 5000ms (0=수동)  
FR-3: 동일 (title+description+variant) 3초 내 반복 호출 시 중복 억제 (Dedup)  
FR-4: Inline Alert 컴포넌트 제공 (상태별 아이콘·색상·SR-only 라벨)  
FR-5: Confirm Dialog 패턴: title, description, confirmLabel, cancelLabel, onConfirm(비동기 지원), loading 상태  
FR-6: Progress Notification: 진행률 0~100 표시, 완료 후 success 토스트 전환  
FR-7: Queue: 동시 다수 Toast 제한(예: 3) + 대기열 FIFO 적용 (Phase 2)  
FR-8: AI Suggestion Accept/Dismiss 결과를 action feedback 으로 사용자에게 토스트 또는 inline badge fade-out 처리  
FR-9: Announcement Banner (전역 상단) 한 세션 1회 노출 + “dismiss” 로컬 저장  
FR-10: 접근성: ARIA live region polite(일반) / assertive(오류) 분리  
FR-11: 키보드 Navigate: 마지막 표시 Toast 포커스 → Esc 닫기  
FR-12: Telemetry: show / dismiss / action / timeout 이벤트 발생 (payload: type, variant, duration, userAction?)  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 알림 렌더링 최초 paint 지연 5ms 미만 (단순 DOM + minimal reflow)  
- Progress 업데이트 빈도 throttle (최대 10fps)  
신뢰성:
- onConfirm 실패 시 오류 설명 재표시 & 재시도 버튼 제공  
접근성:
- 스크린리더: “알림: {title}” 형태로 읽힘  
- 포커스 트랩 금지 (Dialog 제외)  
일관성:
- Variant별 색상, 아이콘 역할 UI Foundation 토큰 사용  
국제화:
- 모든 문구는 i18n key (fallback 한국어)  
보안:
- 사용자 입력(동적 description) XSS sanitize  
관찰성:
- dismiss 원인( timeout | user_click | programmatic ) 구분  
유지보수:
- NotificationEmitter 모듈 단일 진입점  

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 Toast 호출
```ts
interface ToastOptions {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default'|'success'|'error'|'warning'|'info'|'destructive'
  action?: {
    label: string
    onClick: () => void | Promise<void>
  }
  duration?: number // ms (기본 5000, 0=sticky)
  progress?: number // 0~1 (Progress 용)
  metadata?: Record<string, any>
}

function notify(opts: ToastOptions): { id: string; update: (opts: Partial<ToastOptions>) => void; dismiss: () => void }
```
### 6.2 Inline Alert
```ts
interface InlineAlertProps {
  variant: 'success'|'error'|'warning'|'info'|'neutral'
  title?: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
}
```
### 6.3 Confirm Dialog
```ts
interface ConfirmDialogOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => Promise<void> | void
}

function openConfirmDialog(opts: ConfirmDialogOptions): { close: () => void }
```
### 6.4 Announcement Banner
```ts
interface AnnouncementBannerProps {
  id: string
  message: string
  variant?: 'info'|'warning'|'promotion'
  dismissible?: boolean
  learnMoreHref?: string
  storageKey?: string // default: banner_{id}
}
```
### 6.5 Telemetry Payload (예시)
```json
{
  "event": "notification_shown",
  "id": "t_123",
  "variant": "error",
  "source": "mutation.saveProfile",
  "duration": 5000,
  "timestamp": 1737449600000
}
```

## 7. 데이터 모델 (Data Model)
- NotificationEvent(id, type(shown|dismiss|action), variant, source, cause(timeout|user|program), createdAt, metadata)  
- BannerState(id, dismissedAt, sessionId?, userId?)  
- ConfirmationLog(id, dialogType, success:boolean, latencyMs, createdAt)  
- QueueItem(id, status(pending|shown|dismissed), priority, createdAt) (Phase 2)  

인덱스:
- NotificationEvent(createdAt)
- BannerState(id + userId)
Retention:
- NotificationEvent 30일 (집계 후 요약)
Derived Metrics:
- avg_duration_by_variant
- action_rate (action clicks / shown)
- dismiss_without_action_rate

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 성공 Mutation
1. mutation success → notify({ variant:'success', title:'저장 완료' })  
2. duration 후 timeout dismiss → Telemetry(dismiss:timeout)  
### 8.2 오류 Mutation
1. mutation error → categorize → notify({ variant:'error', title:'실패', description:humanizeError(e), action:'다시 시도' })  
2. 사용자 action 클릭 → 재시도 로직 → 실패 시 update(description)  
### 8.3 Progress 업로드
1. 업로드 시작 → notify({ id:'upload1', title:'업로드 중', progress:0, duration:0 })  
2. 진행률 이벤트마다 update({ progress })  
3. 완료 → update({ title:'업로드 완료', variant:'success', progress:1, duration:3000 })  
### 8.4 AI Suggestion Accept
1. 사용자 Accept → notify({ variant:'success', title:'제안 적용됨', metadata:{ suggestionId } })  
2. Feedback 이벤트 Core Engine 전달  
### 8.5 Banner 표시
1. 로드 → localStorage banner_{id} 확인 → 미해당 시 렌더  
2. Dismiss 클릭 → 상태 저장 → Telemetry(action)  
### 8.6 Queue (Phase 2)
1. notify 호출 수(>3) 초과 → 대기열 push  
2. 현재 토스트 종료 시 next dequeue → shown  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Data Access & State (mutation success/error)
- Core AI Engine (제안 Accept/Dismiss 이벤트)
- Configuration & Environment (feature flag: enableBanner)
Downstream:
- Telemetry & Observability (notification events)
- UI Foundation (Toast/Alert/Dialog composables)
Cross:
- Performance Optimization (지연 로딩 비필수 variant)
- Internationalization (문구 key 변환)
외부:
- shadcn/ui / Radix (Toast primitives)
- react-aria-live (선택적)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 중복 알림 폭주 | 사용자 피로 | Dedup + Rate Limit (N/sec) |
| 긴 설명 가독성 저하 | UX 저하 | 2줄 초과 ellipsis + '자세히' 링크 |
| Progress 빈번 업데이트 | 성능/재렌더 증가 | throttle 100ms + diff check |
| Action 실패 미표시 | 혼란 | update → variant:'error' retry 지시 |
| Banner 영구 노출 | 배너 피로 | dismiss TTL / release 버전 태그 |
| XSS 위험(description) | 보안 문제 | sanitize + allow list |
| 다국어 미번역 | 품질 저하 | 빌드 시 키 검증 스크립트 |
| SR(스크린리더) 중복 읽기 | 접근성 저하 | polite/assertive 분리 + aria-atomic 설정 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- notify API + 기본 variant 5종 + duration + dedup  
- Inline Alert / Confirm Dialog  
수락: 오류 후 재시도 Confirm 정상 동작 & Axe 중대 위반 0  
M2:
- Progress Toast + Queue + Banner + Telemetry  
수락: Progress 10fps 제한 + Queue 초과 시 순차 표시  
M3:
- AI Suggestion 피드백 전용 variant / action  
수락: Suggestion Accept 후 1초 이내 피드백 표시  
M4:
- 국제화(i18n keys) + action rate 대시보드 지표  
수락: 번역 누락 로그 0 / action_rate 계산 가능  
M5:
- Notification Center(집계 목록 미리보기) PoC  
수락: 최근 20개 이벤트 필터/검색(variant별)  

## 12. 향후 확장 계획 (Future Extensions)
- Notification Center (탭: All / Errors / Actions)  
- 사용자 알림 선호도 설정 (mute variant, duration override)  
- Grouped Toast (동종 다수 묶음 “+3 추가”)  
- Multi-channel (Email/Webhook) 커넥터  
- AI Prioritization (중요도 스코어 기반 표시 순서)  
- Adaptive Duration (읽은 시간/포커스 여부 기반)  
- Observability Integration (Error Trace link)  
- A/B 테스트 (배너 문구 클릭율)  

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20