# 서비스별 구현 로드맵

최초 작성: 2025-09-24
상태: Draft (개발 킥오프용)

---

## Phase 0. 준비 & 프레임 고도화 (주차 1)
- **목표**: Core AI/분석 파이프라인 개발 착수를 위한 기반 정비
- **선행 조건**: 팀 구성 확정, 인프라 접근 권한, 개발 환경 세팅 완료

| 서비스 | 태스크 | 담당 제안 | 기간 |
| --- | --- | --- | --- |
| `core-ai-engine` | TASK-001, TASK-003 | AI 플랫폼 엔지니어 1명 | 1주 |
| `code-analysis-pipeline` | TASK-005 | 컴파일/파서 엔지니어 1명 | 4일 |
| `telemetry-observability` | TASK-033 | SRE 1명 | 3일 |
| `configuration-and-environment` | TASK-021 | 테크라이터 0.5명 | 2일 |
| `security-and-compliance` | TASK-025 | 보안 담당 0.5명 | 3일 |

> **Deliverables**: 설계 문서 승인, 핵심 정책(토큰/레드액션) 공표, ContextPack 스키마 확정

---

## Phase 1. Core Foundation (주차 2~4)
- **목표**: P0 필수 서비스 구현 및 통합 테스트 통과
- **선행 조건**: Phase 0 Deliverable 승인, 환경 변수/피처 플래그 체계 배포

| Sprint | 서비스 | 태스크 묶음 | 주요 의존성 |
| --- | --- | --- | --- |
| 2주차 | `code-analysis-pipeline` | TASK-006, TASK-007 | TASK-005 |
| 2주차 | `core-ai-engine` | TASK-002 | TASK-001, TASK-005 |
| 2주차 | `data-access-and-state` | TASK-013, TASK-014 | - |
| 3주차 | `core-ai-engine` | TASK-004 | TASK-002, TASK-033 |
| 3주차 | `api-consistency-validator` | TASK-009, TASK-010 | TASK-006 |
| 3주차 | `configuration-and-environment` | TASK-022, TASK-023 | TASK-021 |
| 3주차 | `telemetry-observability` | TASK-034 | TASK-033, TASK-014 |
| 4주차 | `notification-feedback` | TASK-053, TASK-054 | TASK-033, TASK-042 |
| 4주차 | `security-and-compliance` | TASK-026, TASK-027 | TASK-025, TASK-022 |
| 4주차 | `deployment-and-ops` | TASK-029, TASK-030 | TASK-024 |

> **Exit Criteria**: Core Suggest 파이프라인 E2E 테스트 통과, CI/CD 자동화, 기본 알림/보안 훅 가동

---

## Phase 2. 협업 & 상태 확장 (주차 5~7)
- **목표**: P1 서비스 구현으로 팀 협업 기능 및 프로젝트 관리 강화
- **선행 조건**: Phase 1 서비스가 Preview 환경에서 안정 동작, Telemetry 대시보드 가동

| Sprint | 서비스 | 태스크 묶음 | 주요 의존성 |
| --- | --- | --- | --- |
| 5주차 | `realtime-collaboration` | TASK-101, TASK-102 | TASK-017, TASK-014 |
| 5주차 | `projects-workspaces` | TASK-105, TASK-106 | TASK-017, TASK-014 |
| 5주차 | `auth-and-user-management` | TASK-018, TASK-019 | TASK-017 |
| 6주차 | `realtime-collaboration` | TASK-103 | TASK-029 |
| 6주차 | `notification-feedback` | TASK-055 | TASK-034 |
| 6주차 | `data-access-and-state` | TASK-015 | TASK-013 |
| 6주차 | `layout-navigation` | TASK-049, TASK-050 | TASK-041, TASK-042 |
| 7주차 | `projects-workspaces` | TASK-107, TASK-108 | TASK-019 |
| 7주차 | `realtime-collaboration` | TASK-104 | TASK-102, TASK-103 |
| 7주차 | `content-sections` | TASK-109, TASK-110 | TASK-041, TASK-014 |

> **Exit Criteria**: 실시간 Presence 데모, 워크스페이스 CRUD, Optimistic Mutation 롤백, 레이아웃/콘텐츠 동적화

---

## Phase 3. 품질 & 운영 강화 (주차 8~9)
- **목표**: 품질 확보, 성능 최적화, 테스트 자동화 완성

| Sprint | 서비스 | 태스크 묶음 | 주요 의존성 |
| --- | --- | --- | --- |
| 8주차 | `testing-quality` | TASK-037, TASK-038 | - |
| 8주차 | `core-ai-engine` | TASK-003 번들 테스트 보강 | TASK-004 |
| 8주차 | `performance-optimization` | TASK-057, TASK-058 | TASK-046 |
| 9주차 | `testing-quality` | TASK-039, TASK-040 | TASK-038 |
| 9주차 | `performance-optimization` | TASK-059, TASK-060 | TASK-034, TASK-035 |
| 9주차 | `telemetry-observability` | TASK-035, TASK-036 | TASK-034 |

> **Exit Criteria**: 테스트 커버리지 목표 충족, 성능 예산 준수 자동 모니터링, 대시보드/알람 운영화

---

## Phase 4. 확장/고도화 (주차 10~12)
- **목표**: 고급 기능, 콘텐츠 품질, 국제화 준비 완료

| Sprint | 서비스 | 태스크 묶음 | 주요 의존성 |
| --- | --- | --- | --- |
| 10주차 | `content-sections` | TASK-111, TASK-112 | TASK-110 |
| 10주차 | `notification-feedback` | TASK-056 | TASK-054, TASK-055 |
| 11주차 | `internationalization` | TASK-201, TASK-202 | TASK-041, TASK-022 |
| 11주차 | `layout-navigation` | TASK-051, TASK-052 | TASK-050 |
| 12주차 | `internationalization` | TASK-203, TASK-204 | TASK-202 |
| 12주차 | `performance-optimization` | 추가 튜닝 (옵션) | Phase 3 결과 |

> **Exit Criteria**: 콘텐츠/알림 UX 검증, 다국어 토대 구축, UX/레이아웃 사용성 데이터 확보

---

## 리소스 및 역할 매핑
- **AI 플랫폼 엔지니어**: Core AI, API Consistency, Parser 협업 담당
- **프런트엔드 엔지니어**: UI Foundation, Routing, Layout, Content, Notifications
- **풀스택 엔지니어**: Auth, Projects/Workspaces, Data State, Realtime Collaboration
- **DevOps/SRE**: Deployment & Ops, Telemetry, Security 자동화, Performance 알람
- **테크라이터/PM**: 문서, 카탈로그, QA 가이드, 번역 프로세스
- **QA/테스트 엔지니어**: Testing & Quality, 회귀 및 A11y, 라우팅 테스트

> 각 Phase 시작 전 스프린트 계획 회의에서 담당자와 소요 공수 재평가 (Velocity 기반 30% 버퍼 확보 권장)

---

## 진행 지표 & 검증 체크포인트
- **주간**: Accept Rate, Suggest Latency, 테스트 커버리지, CI 안정도
- **Phase 종료**: Phase 기준 Exit Criteria 체크리스트 100% 충족
- **릴리즈 게이트**: 보안 감사, 설정 검증, 품질 게이트 통과, 마이그레이션 시뮬레이션 완료

---

## 리스크 & 대응 전략
- **인력 병목**: 중요 서비스 병렬화 시 보조 엔지니어 Pairing (Phase 1 Core AI, Parser)
- **인프라 지연**: IaC/CI 구축 지연 시 로컬/임시 환경으로 개발 진행, Preview 병행 구축
- **Telemetry 미비**: 초기부터 샘플링 100% 유지, Phase 2에서 조정
- **도메인 미확정**: PRD 업데이트 주 1회 동기화, Change Log 관리

---

## 다음 액션
1. Phase 0 Kickoff 미팅에서 담당자/일정 확정 및 `master-task-list.md` 상태 업데이트
2. 스프린트 보드(Jira/GitHub Projects)에 TASK-001~TASK-060, TASK-201~204 생성 및 링크
3. 환경 세팅 및 공통 개발 스캐폴드 (`README.md`, `docs/tasks/README.md`) 재확인 후 착수
