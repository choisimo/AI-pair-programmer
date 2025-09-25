# 서비스 단위 마스터 태스크 리스트

최종 업데이트: 2025-09-25
문서 상태: Draft (Phase 1 준비)

---

## 범례
- **우선순위**: P0=핵심 기반, P1=가용성 확장, P2=고도화 기능
- **상태**: Planned / In Progress / Blocked / Review / Done
- **모드**: architect, code, debug, documentation-writer, devops, security-review, jest-test-engineer, project-research
- **의존성**: 선행 태스크 ID. 다수일 경우 콤마로 구분.

---

## P0: Foundation & Core Reliability

### Core AI Engine (`docs/tasks/services/core-ai-engine.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-001 | 컨텍스트 빌더 아키텍처 확정 | architect | - | Planned |
| TASK-002 | 증분 컨텍스트 빌드 파이프라인 구현 | code | TASK-001, TASK-005 | Planned |
| TASK-003 | 프롬프트 오케스트레이션 스캐폴드 | code | TASK-001 | Planned |
| TASK-004 | 랭킹 & 피드백 루프 MVP | code | TASK-002, TASK-033 | Planned |

### Code Analysis Pipeline (`docs/tasks/services/code-analysis-pipeline.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-005 | 증분 파서 요구사항 명세 | architect | - | Planned |
| TASK-006 | AST 델타 생성기 구현 | code | TASK-005 | Planned |
| TASK-007 | 심볼 그래프 빌더 | code | TASK-005 | Planned |
| TASK-008 | 분석 파이프라인 통합 테스트 | jest-test-engineer | TASK-006, TASK-007 | Planned |

### API Consistency Validator (`docs/tasks/services/api-consistency-validator.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-009 | 계약 레지스트리 스키마 설계 | architect | - | Planned |
| TASK-010 | Diff 엔진 규칙 구현 | code | TASK-009, TASK-006 | Planned |
| TASK-011 | 브레이킹 체인지 경보 파이프라인 | code | TASK-010, TASK-053 | Planned |
| TASK-012 | 계약 회귀 테스트 세트 구축 | jest-test-engineer | TASK-009, TASK-010 | Planned |

### Data Access & State (`docs/tasks/services/data-access-and-state.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-013 | 상태 관리 전략 모듈화 | architect | - | Planned |
| TASK-014 | TanStack Query 캐시 계층 구현 | code | TASK-013 | Planned |
| TASK-015 | 옵티미스틱 업데이트 롤백 설계 | code | TASK-013 | Planned |
| TASK-016 | 데이터 일관성 회귀 테스트 | jest-test-engineer | TASK-014, TASK-015 | Planned |

### Auth & User Management (`docs/tasks/services/auth-and-user-management.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-017 | 세션/토큰 모델 정의 | architect | - | Planned |
| TASK-018 | 인증 API 게이트웨이 연동 | code | TASK-017, TASK-029 | Planned |
| TASK-019 | 권한 매트릭스 & 가드 훅 구현 | code | TASK-017 | Planned |
| TASK-020 | 보안 리뷰 및 침투 테스트 준비 | security-review | TASK-018, TASK-019 | Planned |

### Configuration & Environment (`docs/tasks/services/configuration-and-environment.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-021 | 환경 변수 카탈로그 수립 | documentation-writer | - | Planned |
| TASK-022 | 런타임 설정 주입 모듈 | code | TASK-021 | Planned |
| TASK-023 | 피처 플래그 토글 설계 | architect | TASK-021 | Planned |
| TASK-024 | 설정 검증 파이프라인 자동화 | devops | TASK-022, TASK-023 | Planned |

### Security & Compliance (`docs/tasks/services/security-and-compliance.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-025 | 민감 데이터 레드액션 정책 수립 | security-review | TASK-021 | Planned |
| TASK-026 | PII 스캐닝 미들웨어 구현 | code | TASK-025, TASK-022 | Planned |
| TASK-027 | 감사 로그 스키마 설계 | architect | TASK-025 | Planned |
| TASK-028 | 보안 감사 체크리스트 자동화 | devops | TASK-026, TASK-027 | Planned |

### Deployment & Ops (`docs/tasks/services/deployment-and-ops.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-029 | IaC 환경 기초 템플릿 | devops | - | Planned |
| TASK-030 | CI/CD 파이프라인 구성 | devops | TASK-029, TASK-024 | Planned |
| TASK-031 | 카나리 릴리즈 전략 구현 | devops | TASK-030 | Planned |
| TASK-032 | 런타임 헬스 프로브 세트 | devops | TASK-029 | Planned |

### Telemetry & Observability (`docs/tasks/services/telemetry-observability.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-033 | 계측 메트릭 명세 수립 | architect | - | Planned |
| TASK-034 | 구조화 이벤트 SDK 구현 | code | TASK-033, TASK-014 | Planned |
| TASK-035 | 트레이싱 파이프라인 구성 | devops | TASK-033, TASK-030 | Planned |
| TASK-036 | 분석 대시보드 MVP | documentation-writer | TASK-034, TASK-035 | Planned |

### Testing & Quality (`docs/tasks/services/testing-quality.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-037 | 테스트 전략 및 커버리지 목표 정의 | architect | - | Planned |
| TASK-038 | 테스트 런너 구성 및 CI 통합 | devops | TASK-037, TASK-030 | Planned |
| TASK-039 | 회귀 테스트 스위트 1차 작성 | jest-test-engineer | TASK-038 | Planned |
| TASK-040 | 품질 게이트 자동화 | devops | TASK-038, TASK-039 | Planned |

### UI Foundation (`docs/tasks/services/ui-foundation.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-041 | UI 토큰 시스템 정의 | architect | - | Planned |
| TASK-042 | 공통 UI 컴포넌트 라이브러리 스캐폴드 | code | TASK-041 | Planned |
| TASK-043 | 접근성(A11y) 검증 루틴 | jest-test-engineer | TASK-042 | Planned |
| TASK-044 | UI 문서화 & 스토리북 세트 | documentation-writer | TASK-042 | Planned |

### Routing & Application Shell (`docs/tasks/services/routing-and-application-shell.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-045 | 애플리케이션 셸 구조 정의 | architect | - | Planned |
| TASK-046 | SPA 라우팅 구성 | code | TASK-045, TASK-042 | Planned |
| TASK-047 | 에러/로드 경계 컴포넌트 | code | TASK-045 | Planned |
| TASK-048 | 라우팅 회귀 테스트 | jest-test-engineer | TASK-046, TASK-047 | Planned |

### Layout & Navigation (`docs/tasks/services/layout-navigation.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-049 | 내비게이션 IA 설계 | architect | TASK-041 | Planned |
| TASK-050 | 레이아웃 컴포넌트 구현 | code | TASK-049, TASK-042 | Planned |
| TASK-051 | 반응형 브레이크포인트 검증 | code | TASK-050 | Planned |
| TASK-052 | 사용자 워크플로 사용성 테스트 | project-research | TASK-050 | Planned |

### Notification & Feedback (`docs/tasks/services/notification-feedback.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-053 | 알림 유형 및 중요도 체계 정의 | architect | TASK-033 | Planned |
| TASK-054 | 토스트 & 인앱 알림 컴포넌트 | code | TASK-053, TASK-042 | Planned |
| TASK-055 | 피드백 이벤트 파이프라인 | code | TASK-053, TASK-034 | Planned |
| TASK-056 | 알림 UX 검증 & 조정 | project-research | TASK-054, TASK-055 | Planned |

### Performance Optimization (`docs/tasks/services/performance-optimization.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-057 | 성능 예산 수립 | architect | TASK-033, TASK-041 | Planned |
| TASK-058 | 번들 분석 & 코드 스플릿 전략 | code | TASK-057, TASK-046 | Planned |
| TASK-059 | 런타임 성능 계측 | code | TASK-057, TASK-034 | Planned |
| TASK-060 | 성능 모니터링 알림 연동 | devops | TASK-059, TASK-035 | Planned |

---

## P1: Collaboration & Scaling

### Realtime Collaboration (`docs/tasks/services/realtime-collaboration.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-101 | Presence 프로토콜 설계 | architect | TASK-017 | Planned |
| TASK-102 | CRDT 편집 동기화 엔진 | code | TASK-101, TASK-014 | Planned |
| TASK-103 | 실시간 이벤트 브로커 연동 | devops | TASK-101, TASK-029 | Planned |
| TASK-104 | 동시 편집 회귀 테스트 | jest-test-engineer | TASK-102, TASK-103 | Planned |

### Projects & Workspaces (`docs/tasks/services/projects-workspaces.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-105 | 워크스페이스 모델 정의 | architect | TASK-017 | Planned |
| TASK-106 | 프로젝트 메타데이터 API | code | TASK-105, TASK-014 | Planned |
| TASK-107 | 접근 제어 연동 | code | TASK-019, TASK-105 | Planned |
| TASK-108 | 워크스페이스 마이그레이션 스크립트 | devops | TASK-106, TASK-029 | Planned |

### Content Sections (`docs/tasks/services/content-sections.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-109 | 섹션 콘텐츠 IA 재정의 | architect | TASK-041, TASK-049 | Planned |
| TASK-110 | 동적 섹션 데이터 바인딩 | code | TASK-109, TASK-014 | Planned |
| TASK-111 | 코드 데모 상호작용 최적화 | code | TASK-110 | Planned |
| TASK-112 | 콘텐츠 QA & 카피 가이드 | documentation-writer | TASK-110 | Planned |

---

## P2: Advanced Experience

### Internationalization (`docs/tasks/services/internationalization.md`)
| ID | 제목 | 모드 | 의존성 | 상태 |
|----|------|------|--------|------|
| TASK-201 | i18n 키 전략 정의 | architect | TASK-041, TASK-021 | Planned |
| TASK-202 | 번역 리소스 로더 구현 | code | TASK-201, TASK-022 | Planned |
| TASK-203 | 다국어 스위칭 UX | code | TASK-201, TASK-050 | Planned |
| TASK-204 | 번역 품질 검증 파이프라인 | documentation-writer | TASK-202 | Planned |

---

## 의존성 하이라이트
- **컨텍스트 파이프라인**: `TASK-005` → `TASK-006` → `TASK-002`
- **텔레메트리 연계**: `TASK-033` → `TASK-034` → `TASK-055` → `TASK-004`
- **배포 체인**: `TASK-029` → `TASK-030` → `TASK-031`
- **보안 체계**: `TASK-021` → `TASK-025` → `TASK-026` → `TASK-020`

---

## 변경 관리
- 태스크 상태 업데이트 시 본 문서와 서비스별 상세 문서를 동기화
- 신규 태스크 추가 시 ID 규칙을 준수하고 서비스 섹션에 반영
- 완료된 태스크는 상태를 `Done`으로 표기하고 관련 산출물 링크 첨부 예정
