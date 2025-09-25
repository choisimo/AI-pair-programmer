# Core AI Engine Service Tasks

연결 문서: `docs/prd/services/core-ai-engine.md`

---

## TASK-001: 컨텍스트 빌더 아키텍처 확정
- **카테고리**: Core AI Engine
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
Core AI Engine의 컨텍스트 빌더 구성 요소(입력 스트림, 증분 캐시, 심볼 그래프 컴바이너)의 모듈 경계를 정의한다. `docs/prd/services/core-ai-engine.md`의 FR-1, FR-2 요구사항을 명문화된 시퀀스 다이어그램과 컴포넌트 책임표로 분해한다.

### 체크리스트
- [ ] 이벤트 소스(에디터 입력, AST 델타)별 데이터 플로우 작성
- [ ] ContextPack 인터페이스(필드 정의, TTL) 확정
- [ ] 캐시 전략(LRU, Invalidation 트리거) 도식화
- [ ] 위 구성을 아키텍처 리뷰에 공유하고 승인 기록 확보

### 수락 기준
- 아키텍처 다이어그램이 PRD 부록으로 추가되어 팀 리뷰 승인 완료
- ContextPack 스키마가 `docs/prd/services/core-ai-engine.md`에 인라인 업데이트

### 기술 노트
- 증분 파서 의존성: `TASK-005` 산출물 참조
- 캐싱은 Phase 1 기준 메모리 내에서 제한 (512MB 이하)

---

## TASK-002: 증분 컨텍스트 빌드 파이프라인 구현
- **카테고리**: Core AI Engine
- **우선순위**: P0
- **예상 소요시간**: 5일
- **의존성**: TASK-001, TASK-005
- **담당 모드**: code

### 설명
Context Builder 파이프라인(Step: 이벤트 집계 → AST 델타 병합 → Symbol Graph 인라인 → Focus Window 추출)을 TypeScript 서비스로 구현한다. 300ms SLA를 충족하도록 비동기 처리와 워커 큐 구조를 도입한다.

### 체크리스트
- [ ] 이벤트 버퍼 및 배치 처리 로직 구현
- [ ] AST 델타 병합기(`EditDelta` → `ContextPack`) 통합
- [ ] Focus Window 추출 범위 알고리즘 구현 및 단위 테스트 작성
- [ ] 성능 측정(로컬 95% < 280ms) 리포트 작성

### 수락 기준
- `npm run test -- context-builder` 통과
- Telemetry 이벤트 `context_build_latency_ms` 수집 확인
- 베이스라인 시나리오에서 95p < 300ms 실측 스냅샷 첨부

### 기술 노트
- AST 델타는 `docs/tasks/services/code-analysis-pipeline.md`의 TASK-006 결과를 사용
- 처리 중단 시 fallback 전체 재빌드 전략 정의 필요

---

## TASK-003: 프롬프트 오케스트레이션 스캐폴드
- **카테고리**: Core AI Engine
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-001
- **담당 모드**: code

### 설명
Prompt Orchestration Layer의 기본 틀(템플릿 로더, 전략 선택기, 가드레일 삽입기)을 구현한다. Phase 1에서는 단일 전략(기본 Suggest)만 지원하되, Phase 2 확장성을 고려한 Strategy 패턴 구조를 마련한다.

### 체크리스트
- [ ] 시스템 프롬프트/역할 프롬프트 템플릿 저장 구조 정의
- [ ] 전략 선택 인터페이스(`PromptStrategy`) 구현
- [ ] Guardrail 훅(PII 마스킹, 토큰 제한) 연결
- [ ] 단위 테스트로 템플릿 결합 결과 스냅샷 생성

### 수락 기준
- `/api/ai/suggest` 요청에서 템플릿 결합 로직이 실행되고 로깅으로 확인
- 템플릿 변경 시 안전하게 테스트가 실패하도록 스냅샷 테스트 구성

### 기술 노트
- Guardrail 훅은 `TASK-025` 정책을 반영해야 함
- 템플릿 데이터는 Phase 1에서 JSON/TS 객체로 관리, 추후 CMS 연동 고려

---

## TASK-004: 랭킹 & 피드백 루프 MVP
- **카테고리**: Core AI Engine
- **우선순위**: P0
- **예상 소요시간**: 4일
- **의존성**: TASK-002, TASK-033
- **담당 모드**: code

### 설명
LLM 후보 결과에 히유리스틱과 텔레메트리 가중치를 적용해 최종 랭킹을 산출하고, Accept/Dismiss 이벤트를 수집하는 피드백 루프를 구현한다. Phase 1에서는 가중치 업데이트를 배치(5분 주기) 방식으로 제한한다.

### 체크리스트
- [ ] Ranker 모듈(길이, 변경 범위, 위험 플래그 가중치) 구현
- [ ] 텔레메트리 입력(`suggestion_accept`, `suggestion_dismiss`) 처리기 연결
- [ ] Accept Rate 변동 > 5pp 시 경고 로그 출력
- [ ] 단위/통합 테스트 작성 및 랭킹 결정 로직 검증

### 수락 기준
- 베타 시나리오에서 Accept Rate 변화에 따라 가중치 업데이트 로그 확인
- 피드백 이벤트가 `docs/tasks/services/telemetry-observability.md` TASK-034 파이프라인으로 적재됨

### 기술 노트
- 가중치 저장소는 Phase 1에서 In-memory + 주기적 persistence (Redis 예정) 전략
- Accept Rate 계산 시 `editAfterAcceptBytes` 반영 로직 설계 필요
