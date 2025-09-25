# 프로젝트 구조

## 📁 디렉토리 구조

```
ai-pair-programmer/
├── src/                           # 소스 코드
│   ├── components/                # React 컴포넌트
│   │   ├── ui/                   # 재사용 가능한 UI 컴포넌트 (shadcn/ui)
│   │   ├── layout/               # 레이아웃 컴포넌트
│   │   └── features/             # 기능별 컴포넌트
│   ├── lib/                      # 핵심 비즈니스 로직
│   │   ├── ai-engine/           # AI 엔진 구현
│   │   ├── code-analysis/       # 코드 분석 파이프라인
│   │   ├── security/            # 보안 모듈
│   │   ├── telemetry/          # 텔레메트리 시스템
│   │   └── utils/              # 유틸리티 함수
│   ├── hooks/                   # 커스텀 React 훅
│   ├── pages/                   # 페이지 컴포넌트
│   ├── config/                  # 설정 파일
│   └── test/                    # 테스트 유틸리티
│
├── docs/                         # 문서
│   ├── prd/                     # 제품 요구사항 문서
│   │   ├── overview.md         # 전체 개요
│   │   └── services/           # 서비스별 PRD
│   ├── tasks/                   # 태스크 관리
│   │   ├── master-task-list.md # 마스터 태스크 리스트
│   │   └── services/           # 서비스별 태스크
│   ├── architecture/            # 아키텍처 문서
│   ├── guides/                  # 가이드 문서
│   │   └── CONTRIBUTING.md    # 기여 가이드
│   ├── project-meta/           # 프로젝트 메타 정보
│   │   └── CHANGELOG.md       # 변경 이력
│   └── services/               # 서비스 문서
│
├── public/                      # 정적 자산
│   ├── icons/                  # 아이콘
│   └── images/                 # 이미지
│
├── .github/                    # GitHub 설정
│   └── workflows/             # CI/CD 워크플로우
│
├── dist/                       # 빌드 출력 (git ignored)
├── node_modules/              # 의존성 (git ignored)
└── coverage/                  # 테스트 커버리지 (git ignored)
```

## 🏗️ 코드 아키텍처

### 계층 구조

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │
│         (React Components, UI)          │
├─────────────────────────────────────────┤
│           Application Layer             │
│     (Hooks, State Management)           │
├─────────────────────────────────────────┤
│           Business Logic Layer          │
│    (AI Engine, Code Analysis, etc)      │
├─────────────────────────────────────────┤
│            Data Access Layer            │
│      (API Clients, Cache, Storage)      │
└─────────────────────────────────────────┘
```

### 주요 모듈

#### 1. AI Engine (`src/lib/ai-engine/`)
- `context-builder.ts`: 컨텍스트 빌더
- `prompt-orchestration.ts`: 프롬프트 오케스트레이션
- `types.ts`: 타입 정의

#### 2. Code Analysis (`src/lib/code-analysis/`)
- `ast-parser.ts`: AST 파서
- `symbol-graph.ts`: 심볼 그래프 빌더
- `incremental-parser.ts`: 증분 파서

#### 3. Security (`src/lib/security/`)
- `pii-redactor.ts`: PII 데이터 마스킹
- `auth-guard.ts`: 인증 가드
- `audit-logger.ts`: 감사 로깅

#### 4. Telemetry (`src/lib/telemetry/`)
- `event-collector.ts`: 이벤트 수집기
- `metrics-exporter.ts`: 메트릭 내보내기
- `tracing.ts`: 분산 트레이싱

## 📋 문서 구조

### PRD 문서 (`docs/prd/`)
각 서비스별 상세한 제품 요구사항 문서

### 태스크 문서 (`docs/tasks/`)
구현 태스크 및 진행 상황 추적

### 아키텍처 문서 (`docs/architecture/`)
시스템 설계 및 기술 결정 사항

### 가이드 문서 (`docs/guides/`)
개발자 가이드 및 사용 설명서

## 🔧 설정 파일

### 빌드 도구
- `vite.config.ts`: Vite 설정
- `tsconfig.json`: TypeScript 설정
- `tailwind.config.ts`: Tailwind CSS 설정

### 코드 품질
- `eslint.config.js`: ESLint 설정
- `vitest.config.ts`: 테스트 설정
- `.prettierrc`: Prettier 설정

### CI/CD
- `.github/workflows/ci.yml`: CI 파이프라인

### 환경 설정
- `.env.example`: 환경 변수 템플릿
- `src/config/environment.ts`: 환경 설정 검증

## 🚀 개발 워크플로우

1. **기능 개발**: `src/lib/` 또는 `src/components/`
2. **테스트 작성**: `__tests__/` 디렉토리
3. **문서 업데이트**: `docs/` 디렉토리
4. **빌드 & 배포**: CI/CD 파이프라인

## 📦 모듈 의존성

```
components → hooks → lib → config
     ↓         ↓       ↓      ↓
    UI    →  State → Logic → Data
```

## 🔐 보안 고려사항

- 모든 사용자 입력은 검증
- PII 데이터는 자동 마스킹
- API 키는 환경 변수로 관리
- 감사 로그 자동 생성

## 📊 성능 목표

- 번들 크기: < 300KB (gzipped)
- 초기 로드: < 2초
- 컨텍스트 빌드: < 300ms
- 테스트 커버리지: > 70%
