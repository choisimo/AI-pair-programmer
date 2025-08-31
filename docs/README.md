# AI Pair Programmer - 개발 문서

이 프로젝트는 React + Vite + TypeScript + Tailwind CSS + shadcn/ui로 구성된 AI 페어 프로그래머 랜딩 페이지입니다.

## 문서 구조

### 서비스별 개발 문서
각 서비스는 목적/역할, 공개 API, 내부 설계, 의존성, 에러 처리, 테스트 포인트, 코드 리뷰 체크리스트, 확장 가이드를 포함합니다.

- [디자인 시스템 서비스](services/ui.md) - shadcn/ui 기반 재사용 컴포넌트
- [레이아웃/내비게이션 서비스](services/layout.md) - 전역 레이아웃 및 반응형 처리
- [알림/토스트 서비스](services/toast.md) - 사용자 피드백 시스템
- [콘텐츠 섹션 서비스](services/sections.md) - Hero, Features 등 마케팅 섹션
- [라우팅 서비스](services/routing.md) - SPA 라우팅 및 404 처리
- [유틸리티 서비스](services/utils.md) - 공용 헬퍼 함수
- [훅 서비스](services/hooks.md) - 커스텀 React 훅
- [빌드/환경 서비스](services/build-env.md) - Vite, TypeScript, 환경 변수 설정
- [데이터/상태 서비스](services/data.md) - 미래 API 통신 및 상태 관리 (계획)

## 프로젝트 개요

### 기술 스택
- **프레임워크**: React 18 + Vite
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS + shadcn/ui
- **컴포넌트**: Radix UI 기반
- **패키지 매니저**: npm
- **린트**: ESLint

### 디렉터리 구조
```
src/
├── components/
│   ├── ui/           # shadcn/ui 컴포넌트
│   ├── Architecture.tsx
│   ├── CodeDemo.tsx
│   ├── Features.tsx
│   ├── Hero.tsx
│   └── Roadmap.tsx
├── hooks/
├── lib/
├── pages/
├── assets/
└── main.tsx
```

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm

### 로컬 실행
```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 타입 체크
npm run typecheck

# 린트 검사
npm run lint

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 코딩 규칙

### 컴포넌트
- 함수형 컴포넌트 사용
- 파일명: PascalCase.tsx
- Props 타입 명시적 선언 (FC 타입 지양)

### 스타일
- Tailwind 유틸리티 우선 사용
- 클래스 조건부 적용 시 `cn` 유틸 사용
- 중복/충돌 클래스는 `tailwind-merge`로 처리

### 타입스크립트
- strict 모드 유지
- `any` 사용 금지
- 명시적 타입 선언 권장

### 접근성
- semantic HTML 사용
- aria-label, role 속성 준수
- 키보드 내비게이션 지원
- Radix UI 기본 접근성 활용

## 배포

### Vercel
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Netlify
- Build Command: `npm run build` 
- Publish Directory: `dist`
- SPA 리다이렉트: `_redirects` 파일에 `/* /index.html 200`

## 품질 보증

### 코드 리뷰 체크리스트
- 타입/린트/빌드 통과
- 접근성 준수 (aria, role, focus)
- 반응형 디자인 확인
- 성능 최적화 (이미지, 번들)
- 에러 처리 및 사용자 피드백

### 테스트 가이드라인
- 컴포넌트 동작 테스트 중심
- 접근성 테스트 (키보드, 스크린리더)
- 반응형 레이아웃 확인
- 에러 바운더리 동작 검증

## 확장 계획

### 단기 (1-2개월)
- React Testing Library + Vitest 도입
- 에러 바운더리 구현
- 성능 최적화 (이미지, 코드 스플리팅)

### 중기 (3-6개월)
- API 연동 및 TanStack Query 도입
- 다국어화 (i18next)
- E2E 테스트 (Playwright)

### 장기 (6개월+)
- 모니터링 (Sentry, Analytics)
- CI/CD 파이프라인 구축
- 성능 분석 및 최적화

## 기여 가이드

1. feature/fix 브랜치 생성
2. Conventional Commits 메시지 사용
3. 타입체크, 린트 통과 확인
4. PR 생성 및 코드 리뷰 요청
5. 접근성, 반응형 테스트 완료

## 문의 및 지원

- 버그 리포트: GitHub Issues
- 기능 요청: GitHub Discussions
- 문서 개선: docs/ 폴더 PR

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.*