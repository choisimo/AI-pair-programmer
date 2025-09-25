# Auth & User Management Service Tasks

연결 문서: `docs/prd/services/auth-and-user-management.md`

---

## TASK-017: 세션/토큰 모델 정의
- **카테고리**: Auth & User Management
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
사용자 세션 관리와 액세스 토큰 발급/갱신 전략을 문서화한다. JWT vs Session 토큰 선택, 만료 정책, 갱신 플로우를 결정한다.

### 체크리스트
- [ ] 세션 모델 다이어그램 작성
- [ ] 액세스 토큰 및 리프레시 토큰 수명 정의
- [ ] 토큰 저장 위치 및 보안 고려사항 정리
- [ ] 문서 리뷰 및 승인 기록

### 수락 기준
- 토큰 모델 문서가 `docs/prd/services/auth-and-user-management.md`에 반영
- 보안/컴플라이언스 요구 사항 체크리스트 포함

### 기술 노트
- Phase 1에서는 JWT + HTTP Only 쿠키 전략 추천
- Feature Flag 기반 프리미엄 권한 확장 고려

---

## TASK-018: 인증 API 게이트웨이 연동
- **카테고리**: Auth & User Management
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-017, TASK-029
- **담당 모드**: code

### 설명
Gateway/Edge 레이어에 인증 미들웨어를 추가하고 사용자 인증 플로우(로그인, 로그아웃, 토큰 갱신)를 구현한다.

### 체크리스트
- [ ] 로그인 API 및 세션 생성 로직 구현
- [ ] 토큰 검증 미들웨어 등록
- [ ] 토큰 갱신 엔드포인트 및 자동 갱신 처리
- [ ] 통합 테스트 및 로컬 시나리오 검증

### 수락 기준
- 인증 흐름이 E2E 테스트에서 통과
- 인증 실패 로그가 Telemetry에 기록

### 기술 노트
- 경로 보호(Protected Route)는 `Routing & Application Shell` TASK-047와 연계
- 리소스 접근은 `Projects & Workspaces` TASK-107과 통합

---

## TASK-019: 권한 매트릭스 & 가드 훅 구현
- **카테고리**: Auth & User Management
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-017
- **담당 모드**: code

### 설명
역할(Role)에 따른 권한 매트릭스를 정의하고, 클라이언트/서버에서 재사용 가능한 Guard Layer를 구현한다.

### 체크리스트
- [ ] 역할 및 권한 매트릭스 정의 (예: owner, editor, viewer)
- [ ] 서버측 권한 가드 미들웨어 구현
- [ ] 클라이언트 훅(`usePermissionGuard`) 구현
- [ ] 단위 테스트 및 문서화

### 수락 기준
- 권한 위반 시 403 응답 및 사용자 피드백(토스트) 동작 확인
- Guard 훅이 UI에서 조건부 렌더링에 사용됨

### 기술 노트
- 권한 정책은 Feature Flag와 연동 가능하도록 설계
- Telemetry로 권한 위반 이벤트 추적

---

## TASK-020: 보안 리뷰 및 침투 테스트 준비
- **카테고리**: Auth & User Management
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-018, TASK-019
- **담당 모드**: security-review

### 설명
초기 보안 리뷰를 실행하고 침투 테스트를 위한 체크리스트와 스코프를 정의한다.

### 체크리스트
- [ ] 인증 플로우 위협 모델링 작성
- [ ] OWASP Top 10 체크리스트 매핑
- [ ] 침투 테스트 계획(도구, 범위, 일정) 작성
- [ ] 리스크 및 완화 전략 문서화

### 수락 기준
- 보안 리뷰 보고서가 승인됨
- 침투 테스트 준비 문서가 릴리스 체크리스트에 포함

### 기술 노트
- Token Misuse, Session Fixation, CSRF 대응 전략 포함
- 보안 이벤트는 `Security & Compliance` TASK-028과 연동
