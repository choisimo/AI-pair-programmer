# Realtime Collaboration Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
Realtime Collaboration 서비스는 다수 사용자가 동일 프로젝트/파일 문맥을 실시간으로 공유·편집·주석·피드백할 수 있도록 하는 동시성(Collaborative) 인프라를 제공한다.  
Phase 1에서는 단일 사용자(싱글세션) 기반 Core 기능이 존재하므로, 본 서비스 초기 목표(Phase 2)는 Presence, Shared Cursor, Comment Thread, Live Suggestion Broadcast, Viewport Sync, 간단한 Conflict 회피를 제공하는 것이다.  
이후 Phase 3~4에서 CRDT 기반 안정성, 멀티 파일 동시 편집, 권한 기반 Visibility, AI Mediated Review(자동 요약/중재)를 확장한다.

## 2. 범위 제외 사항 (Out of Scope)
- 실시간 음성/화상 통신 (외부 통합 후보)
- 완전한 Operational Transform + Undo 히스토리(Phase 3 이후)
- 대규모(>50) 동시 참여 세션의 퍼포먼스 튜닝 (Enterprise Phase)
- 코드 실행/디버깅 공동 제어(Remote Exec)
- 문서 외부(이슈/위키) 협업 채널

## 3. 현재 상태 (Current State)
- 실시간 엔드포인트/게이트웨이 미구현
- 단일 사용자 UI만 존재 (Presence / Cursor 없음)
- 세션 개념 (Workspace Session / Document Session) 정의 전
- 충돌 해결 전략 없음
- 주석(코멘트) 저장/동기화 모델 미정

## 4. 기능 요구사항 (Functional Requirements)
FR-1: 사용자 입장 시 Session Join 이벤트(Presence) 브로드캐스트.  
FR-2: 최소 Presence 정보: userId, displayName, color, lastActiveAt, role.  
FR-3: Shared Cursor 및 선택 영역(Selection Range) 200ms 이하 지연(P95) 반영.  
FR-4: 파일 편집 이벤트(문자열 패치 또는 위치/토큰 단위)가 동기화 구조(초기: line-based patch queue).  
FR-5: 충돌 발생 시 Last Writer Wins + Local Optimistic Update → Phase 3에서 CRDT 전환(Y.js 또는 Automerge).  
FR-6: Inline Comment Thread 생성/수정/해결(resolve) 이벤트 실시간 반영.  
FR-7: Core AI Engine Suggestion 수신 시 참여자 모두에게 동일 anchor 위치 매핑.  
FR-8: 세션 Health 상태(connected/lagging/disconnected) UI 신호 제공.  
FR-9: Idle Timeout (예: 5분) 후 Presence 자동 제거.  
FR-10: 권한(Role) 기반 행위 제한 (예: read-only는 수정 패치 전송 불가).  
FR-11: Session Event Log 최소 24h 보존(메타데이터 위주).  
FR-12: 재접속 시 Delta Resync (미수신 패치 재적용) ≤ 2s.  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- Cursor Broadcast Round Trip P95 < 120ms (동일 리전)
- Patch Propagation P95 < 300ms
- 세션 10명 동시 편집 시 CPU 점유(서버 단일 프로세스 기준) < 60%

신뢰성:
- 네트워크 단절 후 10초 내 자동 재연결(지수 백오프 최대 5회)
- 패킷 손실(최대 5%) 환경에서도 순서 보존(Sequence ID + 재전송)

확장성:
- 단일 Collaboration Gateway 노드당 500 concurrent session or 2k active connections (목표)
- Horizontal Scaling: Sticky Session(세션 ID 기반) + Pub/Sub Fanout

보안:
- 세션 토큰 검증 (JWT ∥ short-lived) + 재발급(refresh) 전략 (Auth 서비스 의존)
- Comment 내용 XSS 방지 (Markdown whitelist / sanitization)
- 비밀 정보 탐지(토큰 패턴) 시 인라인 마스킹

관찰성:
- Metrics: active_sessions, active_connections, msg_in_rate, msg_out_rate, retransmit_count, avg_patch_size_bytes
- Tracing: join → syncComplete 구간 latency

접근성:
- 색각보정 팔레트 제공(사용자별 cursor color 대비율 WCAG 준수)
- 키보드 전용 Comment 생성/이동 단축키

## 6. API/인터페이스 계약 (Interfaces)

### 6.1 WebSocket 초기 핸드셰이크 (Client → Server)
```
{
  "type": "handshake",
  "sessionId": "sess_abc",
  "workspaceId": "ws_1",
  "docPath": "src/components/Hero.tsx",
  "authToken": "jwt..."
}
```

### 6.2 Handshake Ack (Server → Client)
```
{
  "type": "handshake_ack",
  "serverTime": 1737449500000,
  "protocolVersion": "1.0.0",
  "features": { "comments": true, "crdt": false }
}
```

### 6.3 Presence Join / Leave
```
{ "type": "presence_join", "user": { "id":"u1","name":"Alice","color":"#6B5BFF","role":"editor"} }
{ "type": "presence_leave", "userId":"u1" }
```

### 6.4 Cursor Update
```
{
  "type": "cursor",
  "userId": "u1",
  "position": { "line": 120, "column": 8 },
  "selection": { "start": {"line":120,"column":4}, "end":{"line":121,"column":15} },
  "ts": 1737449501200
}
```

### 6.5 Patch(초기 Line-based)
```
{
  "type":"patch",
  "patchId":"pt_9001",
  "baseVersion": 145,
  "ops":[
    { "op":"replace", "line":120, "text":"const x = compute();" }
  ],
  "author":"u1",
  "ts":1737449501500
}
```

### 6.6 Patch Ack / Reject
```
{ "type":"patch_ack", "patchId":"pt_9001", "newVersion":146 }
{ "type":"patch_reject", "patchId":"pt_9001", "reason":"VERSION_CONFLICT", "expectedBase":146 }
```

### 6.7 Comment Thread
```
{
  "type":"comment_create",
  "threadId":"cmt_3001",
  "anchor": { "filePath":"src/x.ts", "range": { "startLine":42, "endLine":45 } },
  "author":"u2",
  "body":"여기 캐싱 가능성?",
  "ts":1737449501700
}
{
  "type":"comment_reply",
  "threadId":"cmt_3001",
  "replyId":"r_10",
  "author":"u1",
  "body":"Phase 2에서 캐시 레이어 도입 예정",
  "ts":1737449502000
}
{
  "type":"comment_resolve",
  "threadId":"cmt_3001",
  "resolver":"u2",
  "ts":1737449510000
}
```

### 6.8 Suggestion Relay (Core 연계)
```
{
  "type":"suggestion_broadcast",
  "suggestionId":"sg_123",
  "filePath":"src/x.ts",
  "range":{"startLine":40,"endLine":44},
  "ruleId":"perf.inline-cache",
  "message":"반복 호출 캐싱",
  "confidence":0.88
}
```

### 6.9 Error
```
{ "type":"error", "code":"AUTH_FAILED", "message":"Invalid token" }
```

## 7. 데이터 모델 (Data Model)
엔티티:
- Session(id, workspaceId, docPath, createdAt, lastActiveAt, participantCount)
- Participant(sessionId, userId, role, color, joinedAt, lastSeenAt, idleFlag)
- PatchLog(id, sessionId, baseVersion, newVersion, ops[], author, latencyMs)
- CommentThread(id, sessionId, anchorFile, anchorRange, status, createdBy, createdAt, resolvedAt?)
- CommentReply(id, threadId, body, author, createdAt)
- CursorState(userId, sessionId, position, selection, updatedAt)
- SuggestionRelay(id, suggestionId, sessionId, filePath, range, deliveredAt)
- SessionMetricSnapshot(id, sessionId, timestamp, avgLatency, patchRate, participantCount)

인덱스:
- PatchLog(sessionId + newVersion) unique
- CommentThread(sessionId + anchorFile + status)
- Participant(sessionId + userId)

Retention:
- PatchLog: 7일 (Aggregation 후 압축)
- CursorState: 최신 1개만 유지
- CommentThread: resolved 30일 후 아카이브

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)

### 8.1 Join & Sync
1. Handshake → 권한 검증  
2. 최신 문서 버전/패치 버전 전송  
3. 기존 Presence 목록 Push  
4. presence_join 브로드캐스트  
5. Cursor/Comment 초기 상태 동기화

### 8.2 Patch 전파
1. 로컬 Optimistic 적용 & patch 전송  
2. 서버 baseVersion 검증 → 적용 → newVersion 증가  
3. patch_ack → 다른 참가자에게 patch 브로드캐스트  
4. 충돌 시 patch_reject → 클라이언트 재동기(최신 버전 diff 요청)

### 8.3 Comment Thread
1. comment_create 브로드캐스트  
2. reply 추가시 thread 상태 실시간 갱신  
3. resolve 시 상태 변경 및 UI 표시  
4. Telemetry: thread_lifecycle_duration 기록

### 8.4 Suggestion Relay
1. Core AI Engine → suggestion_broadcast  
2. 세션 참가자 UI 마커 렌더  
3. 수락/거절 액션은 Core Feedback 채널 통해 별도 처리

### 8.5 Reconnect
1. 재핸드셰이크 → lastKnownVersion 전달  
2. Missing patch range 계산 → delta 패치 재전송  
3. Cursor/Presence 재등록

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (토큰, 역할)
- Core AI Engine (Suggestion 이벤트)
- Projects & Workspaces (권한 경계)
Downstream:
- Telemetry & Observability (지표/로그)
- Notification & Feedback (실시간 세션 상태 알림)
- Performance Optimization (Prefetch / Lazy subscription)

Infra:
- WebSocket Gateway (Node 또는 Rust)
- Pub/Sub (Redis Pub/Sub / NATS / Kafka - 단계적)
- Optional: CRDT Storage Adapter (Phase 3)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 패치 손실/순서 뒤바뀜 | 문서 손상 | Sequence ID + 재요청(replay) |
| 대기시간 증가 (지리적 거리) | 협업 품질 저하 | Region Routing + Edge Proxy |
| 메모리 누수 (세션 미종료) | 서버 자원 고갈 | Idle Timeout + Heartbeat GC |
| 과도한 브로드캐스트 (Cursor 폭주) | 네트워크 부하 | Throttle (최대 20fps) + Delta 비교 |
| 충돌 해결 부정확 | 인지 부하 | Phase 2 CRDT 전환 계획 문서화 |
| Comment 스팸/악용 | UX 저하 | Rate Limiting + Role 기반 Delete |
| 권한 우회 토큰 재사용 | 데이터 노출 | Short-lived Token + Server-side Role Check |
| Suggestion 위치 불일치 | 오해 | Anchor Version Map + Fuzzy Range Adjust |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1 (Phase 2 초기):
- Presence + Cursor + Patch Broadcasting
- Line-based patch, Last Writer Wins
수락: 3 사용자 동시 편집 문서 손상률 0%, 평균 latency < 400ms

M2:
- Comment Thread + Reply + Resolve
- Suggestion Relay 통합
수락: Thread 생성→Resolve 평균 < 5s, Relay 성공률 99%+

M3:
- 재연결 Delta Sync
- Idle Timeout & Cleanup
수락: 2분 강제 단절 후 재접속 데이터 무손실

M4:
- CRDT Prototype (Y.js/Automerge 평가)
- Partial Conflict-free Merge
수락: 인위적 충돌 케이스 95% 자동 정합

M5:
- Metrics & Adaptive Throttle
- Region-aware Routing PoC
수락: 높은 RTT(200ms) 환경에서 Patch P95 < 600ms

## 12. 향후 확장 계획 (Future Extensions)
- Multi-file Session Bundling (탭 간 context share)
- AI Mediated Review (요약/주요 충돌 자동 정리)
- Live Pairing Mode (Follow Cursor / Focus Sync)
- Annotated Time Travel / Playback
- Access Level Filter (Private Thread)
- Voice/Text Chat Embedding (Conversation Thread Linkage)
- Presence-based Suggestion Prioritization (활동 사용자 우선)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20