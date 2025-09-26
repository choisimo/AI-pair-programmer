# API Consistency Validator Service Tasks

연결 문서: `docs/prd/services/api-consistency-validator.md`

---

## TASK-009: 계약 레지스트리 스키마 설계
- **카테고리**: API Consistency Validator
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
API 계약 레지스트리의 데이터 모델과 버전 관리 전략을 정의한다. Export된 함수, 타입, 엔드포인트 정보를 버전별로 추적하기 위한 스키마와 저장소를 결정한다.

### 체크리스트
- [ ] 계약 엔티티 필드 정의 (모듈, 심볼, 시그니처, 해시 등)
- [ ] 버전 정책(semver vs commit-based) 결정 및 명시
- [ ] 저장소 선택(Local JSON, DB, Git 기반)과 접근 API 설계
- [ ] 설계 문서 리뷰 완료

### 수락 기준
- 스키마 다이어그램과 API 명세가 PRD 부록에 추가됨
- Phase 1 데이터 보존 정책(14일 롤링) 명시

### 기술 노트
- 초기 구현은 파일 기반 저장으로 가정, Phase 2에서 DB 이전 고려
- 민감 정보는 저장하지 않도록 Hash 기반 비교 사용

---

## TASK-010: Diff 엔진 규칙 구현
- **카테고리**: API Consistency Validator
- **우선순위**: P0
- **예상 소요시간**: 4일
- **의존성**: TASK-009, TASK-006
- **담당 모드**: code

### 설명
계약 레지스트리의 버전 간 차이를 계산하고 Breaking/Non-breaking을 분류하는 Diff 엔진을 구현한다.

### 체크리스트
- [ ] Diff 알고리즘 설계 (추가/삭제/변경 감지)
- [ ] Breaking 규칙 테이블 생성 (예: 파라미터 삭제)
- [ ] Rule 평가 결과를 `riskFlags`로 매핑
- [ ] 단위 테스트 및 스냅샷 테스트 작성

### 수락 기준
- 20개 이상의 샘플 계약 변경 케이스에서 정확히 분류
- Breaking/Info 이벤트가 Telemetry에 기록됨

### 기술 노트
- 규칙은 Phase 1에서 함수 시그니처에 집중, 클래스/타입은 Phase 2 확장
- AST Delta 정보 재사용으로 효율 향상

---

## TASK-011: 브레이킹 체인지 경보 파이프라인
- **카테고리**: API Consistency Validator
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-010, TASK-053
- **담당 모드**: code

### 설명
Breaking Change가 감지되면 알림 시스템과 연동하여 시각적 경고를 표시하고, 필요한 차단 정책을 적용한다.

### 체크리스트
- [ ] Breaking Change 이벤트 → Notification 모듈 연동
- [ ] 경보 심각도 기반 토스트/모달 결정 로직 구현
- [ ] 향후 자동 차단(Phase 2)을 위한 Hook 포인트 정의
- [ ] 통합 테스트로 알림 플로우 검증

### 수락 기준
- 감지된 Breaking Change가 1초 이내로 UI에 표시
- Notification 로그(Severity, Symbol) 저장 확인

### 기술 노트
- `docs/tasks/services/notification-feedback.md`의 TASK-054, TASK-055와 협동 필요
- 벡엔드 연동 시 Feature Flag로 제어

---

## TASK-012: 계약 회귀 테스트 세트 구축
- **카테고리**: API Consistency Validator
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-009, TASK-010
- **담당 모드**: jest-test-engineer

### 설명
계약 Diff 엔진이 회귀되지 않도록 Golden Set을 구성하고 테스트 자동화를 구축한다.

### 체크리스트
- [ ] 대표 계약 변화 시나리오 수집 (10개 이상)
- [ ] Golden JSON 스냅샷 생성
- [ ] `npm run test -- api-contract` 스크립트 구성
- [ ] CI에 테스트 통합 및 실패 시 디버깅 로그 추가

### 수락 기준
- 모든 케이스에서 Breaking 분류가 예측과 일치
- 실패 시 Diff 상세 로그가 출력됨

### 기술 노트
- 시나리오에는 파라미터 추가(Non-breaking), 삭제(Breaking) 등 다양한 패턴 포함
- Phase 2에서 GraphQL/REST 스키마 연동 예정
