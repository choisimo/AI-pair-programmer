# Changelog

모든 주요 변경사항이 이 파일에 기록됩니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

## [Unreleased]

### 🚀 Added
- 초기 프로젝트 구조 설정
- Core AI Engine 아키텍처 구현
- 증분 컨텍스트 빌더 구현 (TASK-002)
- 심볼 그래프 빌더 구현 (TASK-007)
- PII Redactor 보안 모듈 구현
- 테스트 인프라 구성 (Vitest)
- CI/CD 파이프라인 구성 (GitHub Actions)
- 환경 설정 관리 시스템
- TypeScript strict mode 부분 적용
- ESLint 및 코드 품질 도구 설정

### 🔧 Changed
- React Query v5 마이그레이션 (cacheTime → gcTime)
- Vite 설정 최적화 (코드 스플리팅, 번들 최적화)
- 테스트 설정 개선 (deprecated API 제거)
- TypeScript 설정 개선
- 문서 업데이트 및 최신화

### 🐛 Fixed
- TODO 주석들을 TASK 참조로 변경
- deprecated matchMedia API 제거
- 환경 변수 검증 로직 개선

### 📚 Documentation
- README.md 업데이트
- CONTRIBUTING.md 가이드 추가
- 마스터 태스크 리스트 최신화
- API 문서 구조 개선

## [1.0.0] - 2025-09-25

### 🎉 Initial Release
- **Core Features**
  - 실시간 코드 분석 엔진
  - AI 기반 코드 제안
  - 지능형 문서화 도구
  - API 일관성 검사기

- **Infrastructure**
  - React 18 + TypeScript 기반 프론트엔드
  - Vite 빌드 시스템
  - TanStack Query 상태 관리
  - Tailwind CSS + shadcn/ui 디자인 시스템

- **Security**
  - PII 데이터 자동 감지 및 마스킹
  - JWT 기반 인증 시스템 준비
  - 보안 테스트 스위트

- **Developer Experience**
  - Hot Module Replacement
  - TypeScript 타입 안전성
  - 포괄적인 테스트 커버리지
  - CI/CD 자동화

### 📋 Tasks Completed
- TASK-001: 컨텍스트 빌더 아키텍처 확정
- TASK-002: 증분 컨텍스트 빌드 파이프라인 구현
- TASK-005: 증분 파서 요구사항 명세
- TASK-007: 심볼 그래프 빌더
- TASK-037: 테스트 전략 및 커버리지 목표 정의
- TASK-038: 테스트 런너 구성 및 CI 통합
- TASK-039: 회귀 테스트 스위트 1차 작성
- TASK-040: 품질 게이트 자동화

### 🔄 Known Issues
- 일부 TypeScript strict 모드 설정이 비활성화됨
- node_modules 미설치 시 타입 에러 발생
- 일부 AI 기능이 mock 모드로만 동작

### 🔮 Next Steps
- Phase 2: 실시간 협업 기능
- 다국어 지원
- 엔터프라이즈 SSO 통합
- 고급 분석 대시보드

---

## Version History

| Version | Date       | Status      |
|---------|------------|-------------|
| 1.0.0   | 2025-09-25 | Released    |
| 0.9.0   | 2025-09-20 | Beta        |
| 0.5.0   | 2025-09-15 | Alpha       |
| 0.1.0   | 2025-09-01 | Pre-alpha   |

---

[Unreleased]: https://github.com/your-org/ai-pair-programmer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/ai-pair-programmer/releases/tag/v1.0.0
