# Data Access & State Service Tasks

연결 문서: `docs/prd/services/data-access-and-state.md`

---

## TASK-013: 상태 관리 전략 모듈화
- **카테고리**: Data Access & State
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
클라이언트 상태를 Query State, Session State, UI State로 분할하고 각 계층의 책임과 데이터 플로우를 정의한다. `TanStack Query` 기반으로 서버 상태를 관리하는 전략을 문서화한다.

### 체크리스트
- [ ] 상태 계층 다이어그램 작성
- [ ] Query Key 네이밍 규칙 확정
- [ ] Mutation 에러 처리 정책 정의
- [ ] 설계 리뷰 완료 및 PRD 반영

### 수락 기준
- 상태 관리 전략 문서가 `docs/prd/services/data-access-and-state.md`에 병합됨
- 주요 흐름에 대한 의사 코드 혹은 시퀀스 다이어그램 포함

### 기술 노트
- Phase 1에서 캐시 TTL은 60초 기본, 수동 무효화 허용
- Offline/Optimistic 단계는 Phase 2 확장을 위해 별도 섹션으로 준비

---

## TASK-014: TanStack Query 캐시 계층 구현
- **카테고리**: Data Access & State
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-013
- **담당 모드**: code

### 설명
`TanStack Query` 기반 캐시 계층을 구현하고 공통 `QueryClient` 설정과 Provider 래퍼를 구성한다. 주요 엔드포인트에 대한 Query Hook를 작성한다.

### 체크리스트
- [ ] 공통 QueryClient 설정(재시도, 스테일타임) 구성
- [ ] API 래퍼와 Query Hook (`useSuggestQuery` 등) 구현
- [ ] Suspense/에러 바운더리와 연동 검증
- [ ] 단위 테스트 및 목 네트워크 테스트 작성

### 수락 기준
- 주요 Query Hook가 스토리북/샌드박스에서 동작 확인
- Telemetry 이벤트 `query_cache_hit` 발행

### 기술 노트
- Axios/Fetch 래퍼 결정시 `Configuration & Environment` TASK-022 의존
- Query Key는 `['workspace', workspaceId, 'suggestions']` 형태 통일

---

## TASK-015: 옵티미스틱 업데이트 롤백 설계
- **카테고리**: Data Access & State
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-013
- **담당 모드**: code

### 설명
Optimistic Update를 위한 Mutation 패턴을 설계하고, 실패 시 롤백 처리 및 사용자 피드백(토스트)을 정의한다.

### 체크리스트
- [ ] Optimistic Mutation 예제 구현 (예: 즐겨찾기 토글)
- [ ] 실패 시 롤백 로직 및 UI 알림 구성
- [ ] 경합 조건(동시 Mutation) 처리 전략 문서화
- [ ] 단위 테스트로 롤백 경로 검증

### 수락 기준
- 주요 Mutation에서 사전/후 상태 스냅샷 기록
- 실패 케이스에서 Rollback이 안정적으로 동작함을 테스트 로그로 증명

### 기술 노트
- 알림 연동은 `Notification & Feedback` TASK-054, TASK-055 참조
- Telemetry `optimistic_rollback` 이벤트 발행 계획 포함

---

## TASK-016: 데이터 일관성 회귀 테스트
- **카테고리**: Data Access & State
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-014, TASK-015
- **담당 모드**: jest-test-engineer

### 설명
캐시 계층과 Optimistic Update가 일관성을 유지하는지 회귀 테스트 스위트를 구축한다.

### 체크리스트
- [ ] 시나리오 기반 테스트(성공/실패/재시도) 정의
- [ ] Mock Server로 네트워크 응답 제어
- [ ] 상태 스냅샷 비교 도구 구성
- [ ] CI 스크립트 `npm run test -- data-state` 추가

### 수락 기준
- 주요 시나리오에서 캐시 상태가 예상과 일치
- 테스트 실패 시 차이점이 콘솔 및 로그에 명확히 출력

### 기술 노트
- 데이터 레코더를 활용해 실시간 상태를 기록하고 재생산가능하도록 할 것
- Phase 2에서 WebSocket 업데이트 대비 확장 가능하게 설계
