# Routing & Application Shell Service Tasks

연결 문서: `docs/prd/services/routing-and-application-shell.md`

---

## TASK-045: 애플리케이션 셸 구조 정의
- **카테고리**: Routing & Application Shell
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
앱 셸의 핵심 구성요소(헤더, 사이드바, 컨텐츠영역, 시스템 상태 패널)와 데이터 로딩 전략을 정의한다. Suspense/에러 경계 위치를 결정하고 초기 렌더 경로를 명시한다.

### 체크리스트
- [ ] 앱 셸 와이어프레임 및 구조 다이어그램 작성
- [ ] 초기 데이터 요구사항 매트릭스 작성
- [ ] Suspense & Error Boundary 배치 전략 문서화
- [ ] PRD 업데이트 및 리뷰 승인

### 수락 기준
- 앱 셸 구조 문서가 `docs/prd/services/routing-and-application-shell.md`에 반영
- 초기 렌더와 후속 데이터 로딩 흐름이 시퀀스 다이어그램으로 제공

### 기술 노트
- Shell 내 Global State는 `Data Access & State` TASK-013 전략과 일치해야 함
- Skeleton UI는 `UI Foundation` TASK-042 컴포넌트 활용

---

## TASK-046: SPA 라우팅 구성
- **카테고리**: Routing & Application Shell
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-045, TASK-042
- **담당 모드**: code

### 설명
React Router 기반 SPA 라우팅을 구성하고 코드 스플리팅, 보호된 라우트, 동적 파라미터를 구현한다.

### 체크리스트
- [ ] 라우트 테이블 정의 및 코드 스플릿 구성
- [ ] Protected Route HOC/컴포넌트 구현 (`TASK-019` 의존)
- [ ] 에러 페이지, NotFound 핸들러 연결
- [ ] 라우트 전환 Telemetry 이벤트 트래킹 추가

### 수락 기준
- 주요 라우트가 Storybook/샌드박스에서 확인 가능
- 라우트 보호/리다이렉션 시나리오 테스트 통과

### 기술 노트
- `React Router v6` 기준, 비동기 로더 활용 검토
- 라우트 메타데이터는 Phase 2에서 SEO/i18n에 활용 예정

---

## TASK-047: 에러/로드 경계 컴포넌트
- **카테고리**: Routing & Application Shell
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-045
- **담당 모드**: code

### 설명
전역 및 라우트별 Error Boundary와 Loading Boundary 컴포넌트를 구현한다. 에러 상태에 따라 Notification 시스템과 연동한다.

### 체크리스트
- [ ] ErrorBoundary 컴포넌트 구현 및 Telemetry 연동
- [ ] Suspense용 Loading Skeleton 컴포넌트 구성
- [ ] 에러 상태별 사용자 메시지/CTA 정의
- [ ] 단위 테스트 및 스냅샷 작성

### 수락 기준
- 의도적 오류 발생 시 ErrorBoundary가 정상 동작
- Loading Skeleton이 라우트 전환 200ms 내 렌더

### 기술 노트
- 에러 로깅은 `Telemetry` TASK-034와 연계
- 심각 에러는 `Notification` TASK-054 경고 모달 트리거

---

## TASK-048: 라우팅 회귀 테스트
- **카테고리**: Routing & Application Shell
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-046, TASK-047
- **담당 모드**: jest-test-engineer

### 설명
핵심 라우팅 시나리오(보호 라우트, 동적 파라미터, 비동기 로딩)를 자동화 테스트로 검증한다.

### 체크리스트
- [ ] Playwright/Vitest 기반 라우트 테스트 추가
- [ ] 인증 Mock을 통한 보호 라우트 검증
- [ ] 비동기 데이터 로딩 시 Skeleton/결과 확인
- [ ] 테스트 결과 리포트 및 디버깅 가이드 작성

### 수락 기준
- 라우팅 테스트가 CI에서 안정적으로 통과
- 실패 시 라우트 전환 로그와 스크린샷 확보

### 기술 노트
- E2E 테스트는 `Testing & Quality` TASK-039와 통합 관리
- 라우팅 히스토리 모킹 전략을 문서화
