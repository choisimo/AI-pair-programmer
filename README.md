# AI 페어 프로그래머 (AI Pair Programmer)

실시간으로 코드를 분석하고 지능적인 피드백을 제공하는 혁신적인 AI 개발 동반자입니다.

![AI 페어 프로그래머 프리뷰](preview-info-image.png)

## 주요 기능

### 실시간 코드 분석
- **즉시 피드백**: 코드 작성과 동시에 품질 검사 및 개선사항 제안
- **버그 감지**: 잠재적 오류와 보안 취약점을 사전에 발견
- **최적화 제안**: 성능 향상을 위한 구체적인 개선 방안 제시

### 지능형 문서화
- **자동 문서 생성**: 코드 분석 결과를 바탕으로 한 자동 문서화
- **실시간 업데이트**: 코드 변경사항에 따른 문서 자동 갱신
- **다양한 형식 지원**: Markdown, JSDoc, 인라인 주석 등

### API 일관성 검사
- **인터페이스 분석**: REST API 및 GraphQL 엔드포인트 일관성 검증
- **타입 안전성**: TypeScript를 활용한 강력한 타입 검사
- **스키마 검증**: 데이터 구조 및 API 스펙 검증

## 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상 또는 pnpm 8.0.0 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/ai-pair-programmer.git

# 2. 프로젝트 디렉터리로 이동
cd ai-pair-programmer

# 3. 환경 설정 파일 복사
cp .env.example .env.local

# 4. 의존성 설치
npm install
# 또는 pnpm을 사용하는 경우
pnpm install

# 5. 개발 서버 실행
npm run dev
# 또는
pnpm dev
```

개발 서버는 기본적으로 `http://localhost:8080`에서 실행됩니다.

### 환경 설정

`.env.local` 파일에서 다음 설정들을 구성하세요:
- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `TELEMETRY_ENABLED`: 텔레메트리 활성화 여부
- `DEBUG_MODE`: 디버그 모드 활성화 여부

자세한 설정은 `.env.example` 파일을 참조하세요.

## 🛠️ 기술 스택

### 프론트엔드
- **React 18**: 모던 React Hooks 및 Concurrent Features 활용
- **TypeScript**: 정적 타입 검사로 안정성 확보
- **Vite**: 빠른 개발 환경 및 빌드 도구
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크

### UI 컴포넌트
- **shadcn/ui**: 고품질 Radix UI 기반 컴포넌트 라이브러리
- **Lucide React**: 아이콘 시스템
- **Recharts**: 데이터 시각화 차트 라이브러리

### 개발 도구
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅 (설정되어 있다면)
- **PostCSS**: CSS 처리 도구

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── ui/             # 재사용 가능한 UI 컴포넌트
│   ├── Architecture.tsx # 시스템 아키텍처 컴포넌트
│   ├── CodeDemo.tsx    # 코드 데모 컴포넌트
│   ├── Features.tsx    # 기능 소개 컴포넌트
│   ├── Hero.tsx        # 메인 히어로 섹션
│   └── Roadmap.tsx     # 로드맵 컴포넌트
├── hooks/              # 커스텀 React 훅
├── lib/                # 유틸리티 함수
├── pages/              # 페이지 컴포넌트
│   ├── Index.tsx       # 메인 페이지
│   └── NotFound.tsx    # 404 페이지
├── assets/             # 정적 자산
└── styles/             # 스타일 파일
```

## 주요 컴포넌트

### Hero 섹션
메인 랜딩 페이지의 히어로 섹션으로, AI 페어 프로그래머의 핵심 가치 제안을 시각적으로 표현합니다.

### Features 섹션
실시간 분석, 지능형 피드백, API 일관성 검사 등 주요 기능들을 카드 형태로 소개합니다.

### Architecture 섹션
시스템의 전체 아키텍처를 다이어그램으로 시각화하여 사용자의 이해를 돕습니다.

### CodeDemo 섹션
실제 코드 예시를 통해 AI 페어 프로그래머의 작동 방식을 보여줍니다.

## 🧪 테스트

```bash
# 단위 테스트 실행
npm run test:unit

# 통합 테스트 실행
npm run test:integration

# 보안 테스트 실행
npm run test:security

# 전체 테스트 커버리지
npm run test:coverage

# E2E 테스트 실행
npm run test:e2e
```

## 📦 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 분석
npm run analyze

# 성능 체크
npm run perf:check
```

## 🤝 기여하기

기여를 환영합니다! 자세한 가이드는 [기여 가이드](docs/guides/CONTRIBUTING.md)를 참조하세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🔗 관련 문서

- [프로젝트 로드맵](docs/tasks/implementation-roadmap.md)
- [마스터 태스크 리스트](docs/tasks/master-task-list.md)
- [서비스 아키텍처](docs/prd/overview.md)
- [API 문서](docs/prd/services/)
- [변경 이력](docs/project-meta/CHANGELOG.md)
- [프로젝트 구조](docs/architecture/)

---

**마지막 업데이트**: 2025년 9월 25일
