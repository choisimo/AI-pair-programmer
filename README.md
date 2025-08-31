# AI 페어 프로그래머 (AI Pair Programmer)

실시간으로 코드를 분석하고 지능적인 피드백을 제공하는 혁신적인 AI 개발 동반자입니다.

![AI 페어 프로그래머 프리뷰](preview-info-image.png)

## 🎯 주요 기능

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

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/ai-pair-programmer.git

# 2. 프로젝트 디렉터리로 이동
cd ai-pair-programmer

# 3. 의존성 설치
npm install

# 4. 개발 서버 실행
npm run dev
```

개발 서버는 기본적으로 `http://localhost:8080`에서 실행됩니다.

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

## 🎨 주요 컴포넌트

### Hero 섹션
메인 랜딩 페이지의 히어로 섹션으로, AI 페어 프로그래머의 핵심 가치 제안을 시각적으로 표현합니다.

### Features 섹션
실시간 분석, 지능형 피드백, API 일관성 검사 등 주요 기능들을 카드 형태로 소개합니다.

### Architecture 섹션
시스템의 전체 아키텍처를 다이어그램으로 시각화하여 사용자의 이해를 돕습니다.

### CodeDemo 섹션
실제 코드 예시를 통해 AI 페어 프로그래머의 작동 방식을 보여줍니다.

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 개발 모드 빌드
npm run build:dev

# 린트 검사
npm run lint

# 빌드된 앱 미리보기
npm run preview
```

## 🌟 특징

### 반응형 디자인
모든 디바이스에서 최적화된 사용자 경험을 제공합니다.

### 다크 모드 지원
시스템 테마 또는 사용자 선호도에 따른 다크/라이트 모드 전환을 지원합니다.

### 접근성 최적화
WCAG 2.1 AA 수준의 접근성 가이드라인을 준수합니다.

### 성능 최적화
- 코드 스플리팅을 통한 빠른 초기 로딩
- 이미지 최적화 및 지연 로딩
- 효율적인 번들링으로 최소 번들 크기 달성

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의 및 지원

- 이슈 트래커: [GitHub Issues](https://github.com/your-username/ai-pair-programmer/issues)
- 이메일: support@aipairprogrammer.dev
- 문서: [프로젝트 위키](https://github.com/your-username/ai-pair-programmer/wiki)

---

**AI 페어 프로그래머**와 함께 더 스마트하고 효율적인 개발 경험을 만들어보세요! 🚀