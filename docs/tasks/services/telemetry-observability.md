# Telemetry & Observability Service Tasks

연결 문서: `docs/prd/services/telemetry-observability.md`

---

## TASK-033: 계측 메트릭 명세 수립
- **카테고리**: Telemetry & Observability
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: -
- **담당 모드**: architect

### 설명
핵심 서비스 전반에서 수집할 메트릭, 이벤트, 트레이스 스팬을 정의한다. KPI 및 알람 기준을 문서화한다.

### 체크리스트
- [ ] 서비스별 메트릭 매트릭스 작성 (Latency, Accept Rate 등)
- [ ] 이벤트 스키마(필드, 타입, 샘플링) 정의
- [ ] 트레이스 스팬 네이밍 규칙 확정
- [ ] 문서 리뷰 및 PRD 반영

### 수락 기준
- 메트릭/이벤트 사양이 `docs/prd/services/telemetry-observability.md`에 추가
- 알람 임계치와 책임자(Responder) 정의 완료

### 기술 노트
- OpenTelemetry 표준을 기반으로 네이밍
- 샘플링 비율은 Phase 1에서 100%, Phase 2에서 적응적 조정 고려

---

## TASK-034: 구조화 이벤트 SDK 구현
- **카테고리**: Telemetry & Observability
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-033, TASK-014
- **담당 모드**: code

### 설명
클라이언트/서버 공용으로 사용할 구조화 이벤트 SDK를 구현하고, 이벤트 큐 및 전송 파이프라인을 구성한다.

### 체크리스트
- [ ] 이벤트 Builder 및 Validator 개발
- [ ] 배치/실시간 전송 전략 구현
- [ ] 실패 시 재시도 및 백오프 로직 추가
- [ ] 통합 테스트 및 샘플 코드 작성

### 수락 기준
- 주요 이벤트(`suggestion_accept`, `feature_flag_eval`)가 SDK로 발행되고 Telemetry 백엔드에 적재
- 이벤트 유효성 검증 실패 시 오류 로그와 함께 드롭

### 기술 노트
- Transport는 Phase 1에서 HTTP POST Batch, Phase 2에서 gRPC/WebSocket 고려
- SDK는 Tree Shaking 가능하도록 모듈화

---

## TASK-035: 트레이싱 파이프라인 구성
- **카테고리**: Telemetry & Observability
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-033, TASK-030
- **담당 모드**: devops

### 설명
분산 트레이싱 수집 파이프라인을 구축하고, 서비스 간 상관관계를 분석할 수 있도록 대시보드를 구성한다.

### 체크리스트
- [ ] OpenTelemetry Collector 설정 및 배포
- [ ] Trace Exporter (Jaeger/Tempo 등) 구성
- [ ] 대시보드(Trace Latency, Error Rate) 생성
- [ ] Alerting 연동 및 문서화

### 수락 기준
- 주요 요청 흐름(Client → Gateway → Core AI) 트레이스가 시각화됨
- 오류 비율이 임계치 초과 시 Alert 발송 확인

### 기술 노트
- Collector는 Kubernetes DaemonSet or Sidecar 방식 평가
- Trace retention은 기본 7일, Phase 2에서 확장 예정

---

## TASK-036: 분석 대시보드 MVP
- **카테고리**: Telemetry & Observability
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-034, TASK-035
- **담당 모드**: documentation-writer

### 설명
KPIs와 운영지표를 확인할 수 있는 대시보드를 작성하고, 공유 가능한 가이드를 만든다.

### 체크리스트
- [ ] 핵심 패널(수용률, 지연, 오류)을 구성
- [ ] 대시보드 접근 권한 및 URL 문서화
- [ ] 주간 리포트 템플릿 작성
- [ ] Oncall 핸드북에 대시보드 사용법 반영

### 수락 기준
- 대시보드가 운영팀과 공유되고 피드백 반영
- 리포트 템플릿이 위키/문서에 게시

### 기술 노트
- Grafana/Loki 등의 스택 사용 시 플러그인 버전 명시
- Phase 2에서 커스텀 알람 패널 추가 계획 포함
