# Code Analysis Pipeline Service Tasks

연결 문서: `docs/prd/services/code-analysis-pipeline.md`

---

## TASK-005: 증분 파서 요구사항 명세
- **카테고리**: Code Analysis Pipeline
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
TypeScript 증분 파서에 필요한 입력 이벤트, AST 캐시 정책, 오류 복구 전략을 정의한다. `docs/prd/services/code-analysis-pipeline.md`의 FR-1~FR-3 요구사항을 기반으로 Technical Spec을 작성한다.

### 체크리스트
- [ ] AST Delta 포맷(JSON Schema) 정의
- [ ] 파일 시스템/에디터 이벤트 처리 플로우 도식화
- [ ] 오류 복구 단계(Partial Parse → Full Parse) 기준 정리
- [ ] 리뷰어 승인을 받은 기술 명세서 업로드

### 수락 기준
- 명세서가 PRD 부록 섹션에 첨부되고 서명 완료
- 파서 성능 목표(P95 < 120ms) 및 메모리 예산이 명시됨

### 기술 노트
- 향후 다언어 지원을 위한 확장 포인트를 기술 노트에 포함
- AST 캐시 크기는 초기 256MB 제한

---

## TASK-006: AST 델타 생성기 구현
- **카테고리**: Code Analysis Pipeline
- **우선순위**: P0
- **예상 소요시간**: 4일
- **의존성**: TASK-005
- **담당 모드**: code

### 설명
에디터 편집 이벤트를 받아 AST Delta를 계산하는 모듈을 구현한다. 최소 변경 영역만 재파싱하여 Context Builder에 제공한다.

### 체크리스트
- [ ] AST Delta 계산기 프로토타입 구현
- [ ] 변경 영향 범위(Minimal Reparse Window) 테스트 작성
- [ ] 성능 계측(1000라인 파일 기준) 보고서 작성
- [ ] 에러 시 전체 재파싱으로 폴백하는 로직 추가

### 수락 기준
- 단위 테스트 및 통합 테스트가 CI에서 통과
- Delta 사이즈 평균이 전체 AST 대비 < 8%임을 측정 로그로 확인

### 기술 노트
- TypeScript Compiler API 활용, incremental program 유지
- Telemetry 이벤트 `ast_delta_size_bytes` 발행 필요

---

## TASK-007: 심볼 그래프 빌더
- **카테고리**: Code Analysis Pipeline
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-005
- **담당 모드**: code

### 설명
AST Delta를 기반으로 최신 심볼 그래프(Symbol Graph)를 업데이트하는 빌더를 구현한다. 함수 호출, import/export 관계, 타입 의존성 노드를 관리한다.

### 체크리스트
- [ ] 그래프 데이터 구조 설계 및 구현
- [ ] 증분 업데이트(추가/삭제/변경) 알고리즘 작성
- [ ] 그래프 검증 유닛 테스트 추가
- [ ] 그래프 스냅샷 시각화 도구 초안 제작

### 수락 기준
- 핵심 그래프 질의(API 호출 관계 탐색)가 50ms 이내 응답
- 그래프 무결성 검사(사이클 감지) 결과 리포트 제공

### 기술 노트
- Graph 저장은 Phase 1에서 In-memory, Phase 2에서 영속화 고려
- 분석 결과는 `ContextPack.dependencyGraph`에 직렬화

---

## TASK-008: 분석 파이프라인 통합 테스트
- **카테고리**: Code Analysis Pipeline
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-006, TASK-007
- **담당 모드**: jest-test-engineer

### 설명
증분 파서, AST Delta 생성기, 심볼 그래프 빌더를 통합한 E2E 테스트를 설계 및 구현한다. 대표 에디터 시나리오(코드 추가/삭제/리팩터링)를 커버한다.

### 체크리스트
- [ ] 통합 테스트 시나리오 5개 이상 정의
- [ ] 테스트 데이터셋(샘플 TypeScript 프로젝트) 준비
- [ ] 자동화 스크립트 `npm run test -- analysis-pipeline` 구성
- [ ] 실패 시 디버깅 로깅(그래프/델타 출력) 확보

### 수락 기준
- CI에서 통합 테스트가 stable하게 통과
- 테스트 리포트에 Latency, Delta 크기, 그래프 노드 수가 기록됨

### 기술 노트
- Telemetry 모의객체로 이벤트 발행을 검증할 것
- 다언어 확장을 위해 테스트 구조를 템플릿화
