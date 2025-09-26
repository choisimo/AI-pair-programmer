# Projects & Workspaces Service Tasks

연결 문서: `docs/prd/services/projects-workspaces.md`

---

## TASK-105: 워크스페이스 모델 정의
- **카테고리**: Projects & Workspaces
- **우선순위**: P1
- **예상 소요시간**: 2일
- **의존성**: TASK-017
- **담당 모드**: architect

### 설명
워크스페이스 및 프로젝트 엔티티 구조, 관계, 권한 모델을 정의한다. 다중 워크스페이스 지원과 프로젝트 메타데이터(언어, Repo URL 등)를 설계한다.

### 체크리스트
- [ ] 엔터프라이즈/개인 모드 차이를 고려한 데이터 모델 작성
- [ ] 권한 역할과 연계한 접근 규칙 정의
- [ ] 데이터 정규화 vs 비정규화 전략 결정
- [ ] 문서화 및 리뷰 완료

### 수락 기준
- 데이터 모델이 `docs/prd/services/projects-workspaces.md`에 반영
- 권한 모델이 `Auth & User Management` TASK-019와 일관성 유지

### 기술 노트
- Phase 1에서는 단일 리포지토리 프로젝트, Phase 2에서 멀티 Repo 고려
- 워크스페이스 ID는 UUID 기반, 슬러그 전략은 별도 정의

---

## TASK-106: 프로젝트 메타데이터 API
- **카테고리**: Projects & Workspaces
- **우선순위**: P1
- **예상 소요시간**: 3일
- **의존성**: TASK-105, TASK-014
- **담당 모드**: code

### 설명
프로젝트 목록, 세부 정보, 설정을 제공하는 REST/GraphQL API를 구현한다. Query 캐시 전략과 연계한다.

### 체크리스트
- [ ] 프로젝트 CRUD 및 설정 API 구현
- [ ] TanStack Query Hook와 연동
- [ ] API 권한 검사 구현
- [ ] 통합 테스트 및 문서화

### 수락 기준
- 프로젝트 검색/페이징이 200ms 내 응답
- API 스펙이 OpenAPI/GraphQL 스키마 형태로 배포

### 기술 노트
- Phase 1에서 REST 우선, GraphQL은 추후 옵션
- 메타데이터 필드: 언어, Repo URL, LLM 컨텍스트 크기 등

---

## TASK-107: 접근 제어 연동
- **카테고리**: Projects & Workspaces
- **우선순위**: P1
- **예상 소요시간**: 2일
- **의존성**: TASK-019, TASK-105
- **담당 모드**: code

### 설명
프로젝트/워크스페이스 API에 권한 가드를 적용하고, UI 컴포넌트에서 접근 제어 훅을 활용한다.

### 체크리스트
- [ ] 서버측 권한 미들웨어 적용
- [ ] 클라이언트에서 `usePermissionGuard` 훅 연동
- [ ] 승인 실패 UX(에러 페이지/토스트) 구현
- [ ] 권한 테스트 작성

### 수락 기준
- 권한 위반 시 서버/클라이언트 모두 차단 및 피드백 제공
- Telemetry에 `permission_denied` 이벤트 기록

### 기술 노트
- 워크스페이스 Owner만 설정 변경 가능, Editor는 읽기 전용
- UI는 `Routing & Application Shell` TASK-047와 연계

---

## TASK-108: 워크스페이스 마이그레이션 스크립트
- **카테고리**: Projects & Workspaces
- **우선순위**: P1
- **예상 소요시간**: 2일
- **의존성**: TASK-106, TASK-029
- **담당 모드**: devops

### 설명
워크스페이스 스키마 변경 시 데이터 마이그레이션을 수행하는 스크립트를 작성하고, 배포 파이프라인과 통합한다.

### 체크리스트
- [ ] 마이그레이션 CLI 혹은 스크립트 작성
- [ ] 롤백 전략 및 백업 절차 문서화
- [ ] CI/CD에 마이그레이션 단계 포함
- [ ] 테스트 환경에서 시뮬레이션 실행

### 수락 기준
- 마이그레이션 스크립트가 Preview 환경에서 성공적으로 실행
- 실패 시 롤백 및 데이터 복원 절차 검증

### 기술 노트
- 초기에는 SQL/NoSQL에 따라 마이그레이션 도구 선택
- 장기적으로 버전 관리된 마이그레이션(Prisma/Migrate) 도입 검토
