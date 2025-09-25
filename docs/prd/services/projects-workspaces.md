# Projects & Workspaces Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2 대비 설계)

---

## 1. 목적 및 범위 (Purpose & Scope)
Projects & Workspaces 서비스는 사용자 협업 단위(Workspace)와 코드 분석/AI 제안/구성 관리를 위한 프로젝트(Project) 메타데이터를 관리하는 논리 계층이다.  
핵심 역할:
1. Workspace: 사용자 소속/역할(RBAC)과 리소스 범위(프로젝트, 설정)의 최상위 컨테이너
2. Project: 코드베이스(Repo) 혹은 모듈 단위 메타데이터 (브랜치, 기본 언어, 인덱싱 상태)
3. Project Index State: Code Analysis Pipeline / Core AI Engine이 참조하는 파싱/심볼 그래프 상태
4. 환경 설정 스코프: Feature Flag / Performance Budget / i18n 기본 로케일 등 스코프 구분
5. 접근 제어 Bridge: Auth & User Management의 Role → 프로젝트 자원 권한 평가

초기(Phase 2) 범위: 단일 Workspace 당 복수 Project, 기본 RBAC 연계, 인덱싱 상태 표시.  
중기(Phase 3~4): 프로젝트 그룹/태그, 고급 검색/필터, 아카이브/소프트 삭제, 멀티 리포 동기화.  
장기(Phase 5+): 모놀리포 세그먼트 분할, Cross-project Dependency Graph, 정책 기반 자동화.

## 2. 범위 제외 사항 (Out of Scope)
- Git Provider 직접 Clone/Sync 파이프라인 구현 (별도 Integrations Service)
- 결제/과금(Workspace Seat 기반 Billing)
- 세분화된 권한(파일/폴더 단위) (Phase 4+)
- Branch Protection / Merge 정책
- 실시간 편집 CRDT (Realtime Collaboration 서비스 책임)
- 코드 저장(Content Storage) 자체 (외부 Repo 참조 메타데이터만)

## 3. 현재 상태 (Current State)
- 프런트엔드 마케팅 랜딩 외 실제 Workspace/Project 모델 미구현
- Auth 서비스 초안만 존재 (역할/워크스페이스 실구현 없음)
- Code Analysis Pipeline / AI Engine 설계는 있으나 프로젝트 메타 연결점 미정
- 인덱싱 상태(Progress / 성공/실패) 표준 이벤트 정의 없음

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | Workspace 생성 | 사용자 최초 로그인 시 개인 기본 Workspace 자동 생성 |
| FR-2 | Workspace 조회 | 사용자가 속한 모든 Workspace 목록 (role 포함) |
| FR-3 | Workspace 세부 정보 | 이름, 생성자, 멤버 수, 프로젝트 수 |
| FR-4 | Workspace 업데이트 | 이름/설명 변경 (Owner/Admin) |
| FR-5 | Workspace 아카이브 (Phase 3) | active → archived (복구 가능) |
| FR-6 | Project 생성 | name, repositoryUrl(optional), primaryLanguage, visibility |
| FR-7 | Project 상태 | indexingStatus: PENDING|IN_PROGRESS|READY|FAILED |
| FR-8 | Project 재인덱싱 트리거 | 실패/일부 손상 시 재시작 |
| FR-9 | Project 목록 필터 | 상태 / 언어 / 태그 / 최근 업데이트 순 |
| FR-10 | Project 메타 업데이트 | description, tags[], defaultBranch |
| FR-11 | Project 삭제(Soft) | deletedAt 설정, 30일 후 영구 삭제 |
| FR-12 | 인덱싱 Progress 이벤트 | percent, currentPhase(parse|symbols|contracts) |
| FR-13 | Role 기반 권한 검사 | OWNER/ADMIN: CRUD / MEMBER: 읽기 |
| FR-14 | Project Access Token Scope (Phase 3) | 외부 CI 통합용 읽기 전용 토큰 |
| FR-15 | Workspace 멤버 Role 변경 | OWNER → ADMIN/MEMBER 조정 (Self demote 제한) |
| FR-16 | Project Usage Metrics (Phase 3) | lastAnalysisAt, suggestionCount |
| FR-17 | 브랜치 메타(Phase 4) | branches[] tracked, defaultBranch |
| FR-18 | Project Config Snapshot | ai.suggestion.strategy, analysis.depth 등 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- Workspace 목록 조회 P95 < 400ms (멤버 수 ≤ 200)
- Project 목록 50개 페이지네이션 P95 < 500ms  
확장성:
- Workspace 당 Project 200개 (Phase 2), 2000개(Phase 4) 대비 인덱스 설계  
신뢰성:
- 인덱싱 상태 이벤트 중복 수신 시 마지막 timestamp 기준 최신만 반영 (idempotent)  
일관성:
- Project 상태 전이: PENDING→IN_PROGRESS→READY|FAILED (역행 금지)  
보안:
- Soft Deleted Project 접근 차단
- 권한 없는 사용자 403 (오류 코드 WORKSPACE_FORBIDDEN)  
관찰성:
- metrics: project_index_duration_ms, project_count_per_workspace  
국제화:
- 프로젝트/워크스페이스 이름은 원문 유지, 설명 필드 다국어 X (초기)  
유지보수:
- 상태 머신 정의 중앙화 (상수/enum)
데이터 무결성:
- Workspace 삭제(미지원 Phase2) 시 Project 존재하면 차단  

## 6. API/인터페이스 계약 (Interfaces)
표준 응답: { success, data?, error? }

### 6.1 Workspace APIs
POST /api/workspaces
```json
{ "name": "My Team", "description": "Core platform team" }
```
Response:
```json
{
  "success": true,
  "data": { "id": "ws_123", "name": "My Team", "createdAt": 1737449600000 }
}
```

GET /api/workspaces  
Response:
```json
{
  "success": true,
  "data": [
    { "id":"ws_123","name":"My Team","role":"OWNER","projectCount":5,"memberCount":8 },
    { "id":"ws_456","name":"Research","role":"MEMBER","projectCount":2,"memberCount":4 }
  ]
}
```

GET /api/workspaces/{id}  
PATCH /api/workspaces/{id}
```json
{ "name": "Platform Team", "description": "Updated" }
```

### 6.2 Project APIs
POST /api/workspaces/{workspaceId}/projects
```json
{
  "name": "core-engine",
  "repositoryUrl": "https://github.com/org/core-engine",
  "primaryLanguage": "ts",
  "visibility": "private"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id":"prj_abc",
    "name":"core-engine",
    "indexingStatus":"PENDING",
    "createdAt":1737449600000
  }
}
```

GET /api/workspaces/{workspaceId}/projects?status=READY&lang=ts&page=1&pageSize=20  
GET /api/projects/{projectId}  
PATCH /api/projects/{projectId}
```json
{ "description":"Core AI Engine project", "tags":["ai","engine"], "defaultBranch":"main" }
```

DELETE /api/projects/{projectId} (Soft delete)

### 6.3 인덱싱 재시작
POST /api/projects/{projectId}/reindex
Response:
```json
{ "success": true, "data": { "indexingStatus": "IN_PROGRESS" } }
```

### 6.4 인덱싱 상태 이벤트 (Internal → Webhook/Queue)
```json
{
  "type":"project.index.progress",
  "projectId":"prj_abc",
  "phase":"symbols", // parse|symbols|contracts|finalize
  "percent":72,
  "updatedAt":1737449605123
}
```

### 6.5 권한 오류 예시
```json
{
  "success": false,
  "error": { "code":"WORKSPACE_FORBIDDEN","message":"권한이 없습니다" }
}
```

### 6.6 TypeScript Interfaces (Pseudo)
```ts
type IndexingStatus = 'PENDING'|'IN_PROGRESS'|'READY'|'FAILED'

interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  archivedAt?: number
}

interface Project {
  id: string
  workspaceId: string
  name: string
  primaryLanguage: 'ts'|'js'|'py'|'go'
  repositoryUrl?: string
  indexingStatus: IndexingStatus
  description?: string
  tags?: string[]
  defaultBranch?: string
  lastAnalysisAt?: number
  deletedAt?: number
  createdAt: number
  updatedAt: number
}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- Workspace(id, name, description, createdAt, updatedAt, archivedAt?)
- Project(id, workspaceId FK, name, primaryLanguage, repositoryUrl, indexingStatus, description, tags(jsonb), defaultBranch, lastAnalysisAt, deletedAt?, createdAt, updatedAt)
- ProjectIndexLog(id, projectId, phase, percent, status, startedAt, finishedAt?, errorCode?)
- ProjectTag(projectId, tag) (정규화 선택적; 초기 tags 배열 jsonb)
- WorkspaceStats(workspaceId, projectCount, memberCount, lastUpdatedAt) (Materialized View / Cache)
- ProjectConfigSnapshot(id, projectId, key, value, version, createdAt) (Phase 3)
- ProjectUsageStat(projectId, suggestionCount, analysisCount, windowStart) (Phase 3)

인덱스:
- Project(workspaceId, indexingStatus)
- Project(name, workspaceId) (unique)
- Project(deletedAt)
- ProjectIndexLog(projectId, startedAt)
보존:
- ProjectIndexLog 90일
- Soft Deleted Project 30일 후 물리 삭제
파티셔닝(Phase 4):
- ProjectIndexLog by month

Derived Metrics:
- avg_index_duration = mean(finishedAt - startedAt)
- ready_ratio = READY count / total projects
- reindex_failure_rate = failed reindex / total reindex attempts

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 Project 생성 및 인덱싱
1. 사용자 → 새 Project 생성 (status=PENDING)  
2. Worker 큐 → 인덱싱 Job 할당 → status=IN_PROGRESS  
3. 파서 진행 단계마다 progress 이벤트 발행 (phase/percent)  
4. 성공 → status=READY, lastAnalysisAt 갱신  
5. 실패 → status=FAILED + errorCode 기록 → 재시작 가능  

### 8.2 Reindex Flow
1. 사용자 Reindex 요청 → 상태가 READY|FAILED 일 때만 허용  
2. 새로운 Job 기록 + IndexLog row  
3. 실패 시 Project.indexingStatus=FAILED 유지  
4. 성공 → 새 lastAnalysisAt 업데이트  

### 8.3 Workspace 전환
1. 사용자 UI에서 Workspace 선택 → JWT Claims(현재 ws) or local selection state  
2. 클라이언트: Query Key (workspaceId)로 캐시 분리  
3. 권한 에러 발생 시 Notification(error) → Workspace 선택 초기화  

### 8.4 Project 삭제 (Soft)
1. DELETE 호출 → deletedAt 설정, READY → 접근 차단  
2. 30일 내 복구(Phase 3 기능) 가능 (복구 호출 시 deletedAt null)  
3. 만료 배치 → 연관 IndexLog / UsageStat Cascade 제거 or Archive  

### 8.5 권한 검사
1. Protected API 호출 → accessToken decode → workspaceId param 비교  
2. WorkspaceMember.role 조회 → Action → PermissionMatrix 확인  
3. 불가 시 403 + WORKSPACE_FORBIDDEN  

### 8.6 Index Failure Notification
1. Index Worker 실패 → ProjectIndexLog.errorCode 저장  
2. Event → Notification & Telemetry (index_failure)  
3. UI: “재시도” 버튼 → /reindex 호출  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (WorkspaceMember / Role)
- Configuration & Environment (기본 인덱싱 동시성, queue 크기)
Downstream:
- Code Analysis Pipeline (Project 목록/메타)
- Core AI Engine (lastAnalysisAt, indexingStatus)
- API Consistency Validator (프로젝트별 계약 저장소)
- Telemetry & Observability (index events, metrics)
Cross:
- Notification & Feedback (인덱싱 실패/완료 알림)
- Performance Optimization (대규모 프로젝트 캐시 전략)
- Security & Compliance (권한 감사 로그)
외부:
- Git Provider Webhook (Repo 변경 시 인덱스 트리거) (Phase 3)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 인덱싱 큐 적체 | 지연/사용자 불만 | 우선순위 큐 + 동시성 조정 Feature Flag |
| 대형 Repo 인덱싱 실패 | READY 전환 지연 | Chunk 기반 Partial Index + 재시도 전략 |
| Soft Delete 누락 접근 | 보안/정보 노출 | 모든 SELECT where deletedAt IS NULL 조건 강제 |
| Tag 폭발(변경 잦음) | 쿼리 성능 저하 | jsonb 인덱스 or 정규화 + 캐싱 |
| 재인덱스 과도 호출 | 비용 증가 | Rate Limit (프로젝트당 10/시간) |
| 잘못된 Role 평가 | 권한 상승 | 중앙 PermissionMatrix & 단위 테스트 |
| Index 상태 이벤트 순서 역전 | UI 혼란 | updatedAt 비교 후 최신만 반영 |
| Cross-workspace Leakage | 데이터 노출 | workspaceId 스코프 검증 Middleware |
| 대량 삭제 배치 부하 | DB I/O 급증 | 소량 배치 처리 + 아카이빙 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | Workspace 기본 CRUD + Project 생성/목록 + 인덱싱 상태 필드 | Project 생성 후 상태 PENDING → IN_PROGRESS → READY 로그 기록 |
| M2 | Index Progress 이벤트 & UI 연동 | 5단계 이상 이벤트 순서 보존 (역순 수신 무시) |
| M3 | Reindex + FAILED 처리 + Notification | 실패 후 재시작 성공률 ≥ 90% (테스트) |
| M4 | Soft Delete & Cleanup 배치 | 삭제 30일 후 물리 제거 자동 |
| M5 (Phase3) | Project ConfigSnapshot + UsageStat | suggestionCount / lastAnalysisAt 메트릭 노출 |
| M6 | 태그/필터/검색 | 태그 필터 응답 P95 < 700ms (200 Projects) |
| M7 (Phase4) | Branch 메타 + 대규모 확장 튜닝 | 2000 Projects 환경에서 목록 페이지 P95 < 900ms |

Acceptance 예시(M2):
- Progress 이벤트 (percent 증가) 역순 도착 테스트 → UI 최종 percent 정확성 100%
- FAILED 상태에서 Reindex 요청 후 READY 도달 성공

## 12. 향후 확장 계획 (Future Extensions)
- Monorepo 모듈 자동 감지 → Sub-project 자동 생성
- Cross-project Dependency Graph (위험 Impact View)
- Project Health Score (index freshness + 실패율 + suggestion adoption)
- Immutable Snapshot Versioning (분석 시점 고정)
- Custom Field (key/value) 메타 확장
- Archived Projects 전용 Storage Tier
- Project-level Feature Flag Override
- Differential Index (변경 파일만 재파싱)
- Per-branch Index Isolation
- Multi-region Replica & Latency-aware Scheduling

---

내부 검토 체크리스트(초안):
- Index 상태 FSM 정의 문서화 여부
- PermissionMatrix 테스트 케이스 (권한 부여/거부)
- Soft Delete 복구 전략 필요성
- API Rate Limit 표준화 (Configuration 문서 연계)
- Event 명명 규칙(project.index.*) Telemetry 문서 일관성

(끝)