# Performance Optimization Service Tasks

연결 문서: `docs/prd/services/performance-optimization.md`

---

## TASK-057: 성능 예산 수립
- **카테고리**: Performance Optimization
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-033, TASK-041
- **담당 모드**: architect

### 설명
클라이언트/서버 성능 목표(번들 크기, 초기 로드 시간, 상호작용 지표)를 정의하고 성능 예산을 수립한다. KPI와 모니터링 전략을 문서화한다.

### 체크리스트
- [ ] 핵심 성능 지표(LCP, TTI, TBT 등) 목표 설정
- [ ] 번들 크기, 요청 수, API Latency 예산 설정
- [ ] 성능 추적 도구(Lighthouse CI 등) 선정 및 문서화
- [ ] PRD 업데이트 및 리뷰 승인

### 수락 기준
- 성능 예산 문서가 `docs/prd/services/performance-optimization.md`에 반영
- 목표값이 Telemetry/KPI 대시보드와 연계 계획 포함

### 기술 노트
- Phase 1: LCP < 2.5s, 번들 크기 < 300KB gzip 목표
- 예산 초과 시 알림 전략(Feature Flag 강등 등) 정의

---

## TASK-058: 번들 분석 & 코드 스플릿 전략
- **카테고리**: Performance Optimization
- **우선순위**: P0
- **예상 소요시간**: 3일
- **의존성**: TASK-057, TASK-046
- **담당 모드**: code

### 설명
빌드 번들을 분석하고 코드 스플리팅 전략을 구현하여 초기 로드 성능을 개선한다. Lazy Loading, Prefetch 정책을 포함한다.

### 체크리스트
- [ ] 번들 분석 도구(Vite Bundle Analyzer 등) 설정
- [ ] 핵심 라우트에 대한 Dynamic Import 적용
- [ ] Prefetch/Preload 전략 구현 및 문서화
- [ ] 성능 비교 리포트 작성 (Before/After)

### 수락 기준
- 초기 번들 크기가 목표 대비 10% 이상 감소
- 성능 리포트에서 TTI 개선 확인

### 기술 노트
- Code splitting 시 Suspense Fallback 최적화 필요
- `Routing & Application Shell` TASK-046과 긴밀히 협업

---

## TASK-059: 런타임 성능 계측
- **카테고리**: Performance Optimization
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-057, TASK-034
- **담당 모드**: code

### 설명
런타임에서 성능 지표(FP, FCP, INP 등)를 수집하고 Telemetry 파이프라인에 전송하는 계측 코드를 구현한다.

### 체크리스트
- [ ] 웹 성능 API(PerformanceObserver) 기반 측정 로직 구현
- [ ] 사용자 세그먼트/디바이스 정보와 함께 이벤트 전송
- [ ] 성능 저하 감지 시 Notification Hook 연결
- [ ] 단위 테스트 및 샘플 데이터 검증

### 수락 기준
- Telemetry 백엔드에 성능 이벤트가 안정적으로 적재
- 성능 임계치 초과 시 경고 알림 확인

### 기술 노트
- 일시적으로 Sampling 100%, 추후 적응적 조정
- 서버 측 성능은 APM(OpenTelemetry Trace)과 연계

---

## TASK-060: 성능 모니터링 알림 연동
- **카테고리**: Performance Optimization
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-059, TASK-035
- **담당 모드**: devops

### 설명
성능 지표가 예산을 초과할 때 자동으로 알림을 발송하고 대시보드에 표시하는 모니터링 파이프라인을 구축한다.

### 체크리스트
- [ ] Alert Rule 설정(LCP, Latency 등)
- [ ] Slack/이메일/온콜 알림 채널 연동
- [ ] 성능 히스토리 대시보드 구성
- [ ] 대응 프로세스(Runbook) 문서화

### 수락 기준
- 성능 예산 초과 시 알림이 2분 내 전달
- 히스토리 차트에서 트렌드 확인 가능

### 기술 노트
- Alert Fatigue 방지를 위해 지연/배치 전략 포함
- 온콜 Runbook은 `Telemetry & Observability` TASK-036 문서와 연계
