# Configuration & Environment Service Tasks

연결 문서: `docs/prd/services/configuration-and-environment.md`

---

## TASK-021: 환경 변수 카탈로그 수립
- **카테고리**: Configuration & Environment
- **우선순위**: P0
- **예상 소요시간**: 1일
- **의존성**: -
- **담당 모드**: documentation-writer

### 설명
런타임, 빌드 타임, 보안 민감도별 환경 변수 목록을 작성하고 관리 정책을 정의한다.

### 체크리스트
- [ ] 환경 변수 분류(공개/비공개) 표 작성
- [ ] 변수별 기본값/필수 여부/설명 기입
- [ ] 보관 위치(.env, secrets manager 등) 명시
- [ ] PRD 문서 업데이트 및 리뷰 완료

### 수락 기준
- 카탈로그가 `docs/prd/services/configuration-and-environment.md`에 추가됨
- 민감 변수에 대한 레드랙션 지침 명시

### 기술 노트
- 초기 단계에서는 `.env.local`, `.env.production` 두 레이어만 사용
- Rotation 정책은 `Security & Compliance`와 연계하여 작성

---

## TASK-022: 런타임 설정 주입 모듈
- **카테고리**: Configuration & Environment
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-021
- **담당 모드**: code

### 설명
클라이언트/서버 양쪽에 런타임 설정을 주입하는 모듈을 구현한다. 빌드 타임과 런타임의 설정 차이를 해소하는 로더를 제공한다.

### 체크리스트
- [ ] 설정 스키마 정의 및 타입 가드 구현
- [ ] 서버 런타임 로더와 클라이언트 expose 메커니즘 구현
- [ ] Feature Flag와 연계한 설정 샘플 작성
- [ ] 단위 테스트 및 타입 검증 추가

### 수락 기준
- 설정이 누락되면 애플리케이션이 안전하게 실패(Log & Fail Fast)
- 런타임에서 설정 변경(Hot Reload)이 반영되는지 확인

### 기술 노트
- Vite `import.meta.env`와 Node `process.env` 동시 지원
- 설정 검증은 `Deployment & Ops` TASK-024에서 자동화

---

## TASK-023: 피처 플래그 토글 설계
- **카테고리**: Configuration & Environment
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-021
- **담당 모드**: architect

### 설명
Feature Flag 전략(환경별 기본값, 사용자/워크스페이스 레벨 오버라이드)을 설계하고 토글 명명 규칙을 정의한다.

### 체크리스트
- [ ] Feature Flag 카탈로그 작성
- [ ] 토글 평가 순서(환경 → 워크스페이스 → 사용자) 정의
- [ ] Flag 스펙(타입, 롤아웃 전략) 문서화
- [ ] 승인 및 PRD 업데이트

### 수락 기준
- 토글 명세가 PRD에 반영
- 향후 LaunchDarkly/Amplication 등 외부 시스템 연동을 고려한 확장성 포함

### 기술 노트
- Phase 1에서는 Config 파일 기반 플래그, Phase 2에서 원격 제어 고려
- 토글 상태 Telemetry(`feature_flag_eval`) 발행 계획 포함

---

## TASK-024: 설정 검증 파이프라인 자동화
- **카테고리**: Configuration & Environment
- **우선순위**: P0
- **예상 소요시간**: 2일
- **의존성**: TASK-022, TASK-023
- **담당 모드**: devops

### 설명
CI/CD 파이프라인에서 환경 변수 및 설정 유효성을 검사하는 스크립트를 구축한다.

### 체크리스트
- [ ] 스키마 검증 스크립트 작성 (`npm run config:validate`)
- [ ] CI 파이프라인에 검증 단계를 추가
- [ ] 실패 시 상세 리포트 및 제안 해결책 출력
- [ ] 결과를 Slack/Notification과 연동

### 수락 기준
- CI에서 설정 누락 시 즉시 실패하고 알림 발송
- 검증 성공/실패 지표가 Observatory 대시보드에 기록

### 기술 노트
- Git Hooks(Pre-commit)에서 기본 검증 옵션 제공
- CI는 `Deployment & Ops` TASK-030과 통합 관리
