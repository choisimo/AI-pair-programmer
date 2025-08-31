# 레이아웃/내비게이션 서비스 (App Shell)

## 목적/역할
- 애플리케이션 전반의 일관된 레이아웃 구조 제공
- 반응형 디자인 및 모바일/데스크톱 최적화
- 접근성을 고려한 내비게이션 및 skip link 제공
- 전역 컴포넌트(Toaster 등) 마운트 위치 관리

## 공개 API

### 레이아웃 컴포넌트
```tsx
// 현재는 App.tsx에서 직접 섹션 배치, 향후 확장 예정
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { Architecture } from "@/components/Architecture"
import { Roadmap } from "@/components/Roadmap"
```

### 반응형 훅
```tsx
import { useIsMobile } from "@/hooks/use-mobile"
```

### 향후 AppShell 패턴 (계획)
```tsx
// 구현 예정
import { AppShell } from "@/components/AppShell"

<AppShell>
  {children}
</AppShell>
```

## 내부 설계

### 현재 구조 (App.tsx 기반)
- **단일 페이지**: Index 페이지에 모든 섹션 수직 배치
- **섹션 순서**: Hero → Features → Architecture → Roadmap
- **컨테이너**: 각 섹션별 responsive container 적용
- **스크롤**: 부드러운 스크롤 동작 (CSS scroll-behavior)

### 반응형 브레이크포인트
- **모바일**: < 768px (MOBILE_BREAKPOINT)
- **태블릿**: 768px - 1024px
- **데스크톱**: > 1024px
- **훅 기반 감지**: `useIsMobile()` 사용

### 접근성 구조
```tsx
// 시맨틱 HTML 구조
<html lang="ko">
  <body>
    <a href="#main-content" className="skip-link">메인 콘텐츠로 이동</a>
    <header role="banner">
      {/* 네비게이션 */}
    </header>
    <main id="main-content" role="main">
      <section aria-labelledby="hero-heading">
        {/* Hero 섹션 */}
      </section>
      <section aria-labelledby="features-heading">
        {/* Features 섹션 */}
      </section>
      {/* ... 기타 섹션 */}
    </main>
    <footer role="contentinfo">
      {/* 푸터 */}
    </footer>
  </body>
</html>
```

## 의존성

### 핵심 의존성
- **React**: 컴포넌트 구조
- **shadcn/ui**: 레이아웃 관련 컴포넌트 (Container, Grid 등)
- **Tailwind CSS**: 반응형 스타일링

### 훅 의존성
- **use-mobile.tsx**: 브레이크포인트 감지
- **React hooks**: useState, useEffect for responsive behavior

## 예외/에러 처리

### 반응형 대응
```tsx
// 오버플로우 방지
className="min-h-screen overflow-hidden"

// 안전한 컨테이너
className="container mx-auto px-6 max-w-7xl"

// 모바일 안전 영역 고려
className="min-h-[100dvh] pt-safe-top pb-safe-bottom"
```

### 브라우저 호환성
```tsx
// SSR 안전 가드
const isMobile = useIsMobile() // undefined → false로 안전 처리

// matchMedia 미지원 브라우저 대응
const mql = window.matchMedia ? 
  window.matchMedia(`(max-width: 767px)`) : 
  null
```

### 접근성 에러 방지
```tsx
// 키보드 트랩 방지
<div role="navigation" aria-label="주 메뉴">
  {/* 탭 순서 보장 */}
</div>

// 스크린리더 혼선 방지
<div aria-live="polite" aria-atomic="true">
  {/* 동적 콘텐츠 알림 */}
</div>
```

## 테스트 포인트

### 반응형 테스트
```tsx
// 브레이크포인트 경계값 테스트
describe("반응형 레이아웃", () => {
  test("767px에서 모바일 레이아웃으로 전환", () => {
    // viewport 767px 설정
    // useIsMobile() === true 확인
  })
  
  test("768px에서 데스크톱 레이아웃으로 전환", () => {
    // viewport 768px 설정  
    // useIsMobile() === false 확인
  })
})
```

### 접근성 테스트
```tsx
// 키보드 내비게이션
test("Tab 키로 모든 상호작용 요소에 접근 가능", () => {
  // Tab 순서 확인
  // focus-visible 스타일 확인
})

// skip link 테스트
test("skip link가 올바르게 작동", () => {
  // Tab으로 skip link 포커스
  // Enter로 main content로 이동 확인
})
```

### 성능 테스트
```tsx
// 렌더링 성능
test("불필요한 리렌더링 방지", () => {
  // useIsMobile 변경 시에만 리렌더
  // 섹션 컴포넌트 메모이제이션 확인
})

// 이미지 로딩
test("hero 이미지 LCP 최적화", () => {
  // lazy loading 미적용 (Above-the-fold)
  // 적절한 이미지 크기/포맷 확인
})
```

## 코드 리뷰 체크리스트

### 시맨틱 구조
- [ ] header, main, footer 태그 사용
- [ ] 섹션별 heading 계층 구조 올바름 (h1 → h2 → h3)
- [ ] 랜드마크 역할(role) 명시
- [ ] aria-labelledby로 섹션-제목 연결

### 반응형 설계
- [ ] 모바일 우선 설계 적용
- [ ] useIsMobile 훅 효율적 사용 (불필요한 리렌더 방지)
- [ ] 터치 타겟 최소 44px 확보 (모바일)
- [ ] 가로/세로 orientation 대응

### 성능 최적화
- [ ] 섹션 컴포넌트 메모이제이션 여부
- [ ] 이미지 loading 속성 적절히 설정
- [ ] CSS-in-JS보다 Tailwind 유틸리티 우선 사용
- [ ] 불필요한 DOM 중첩 제거

### 접근성
- [ ] skip navigation 링크 제공
- [ ] 키보드 포커스 순서 논리적
- [ ] 색상 대비 WCAG AA 기준 준수
- [ ] 텍스트 크기 조정 가능 (zoom 200%까지)

## 확장 가이드

### AppShell 패턴 도입
```tsx
// src/components/AppShell.tsx
import { useIsMobile } from "@/hooks/use-mobile"
import { Toaster } from "@/components/ui/toaster"

interface AppShellProps {
  children: React.ReactNode
  navigation?: React.ReactNode
  sidebar?: React.ReactNode
}

export function AppShell({ children, navigation, sidebar }: AppShellProps) {
  const isMobile = useIsMobile()
  
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        메인 콘텐츠로 이동
      </a>
      
      {navigation && (
        <header role="banner" className="sticky top-0 z-50 bg-background/80 backdrop-blur">
          {navigation}
        </header>
      )}
      
      <div className="flex-1 flex">
        {sidebar && !isMobile && (
          <aside className="w-64 border-r bg-muted/40">
            {sidebar}
          </aside>
        )}
        
        <main id="main-content" role="main" className="flex-1">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  )
}
```

### 라우팅 시스템 통합
```tsx
// React Router 도입 시
import { Outlet } from "react-router-dom"
import { AppShell } from "./AppShell"
import { Navigation } from "./Navigation"

export function RootLayout() {
  return (
    <AppShell navigation={<Navigation />}>
      <Outlet />
    </AppShell>
  )
}
```

### 프로그레시브 웹앱 대응
```tsx
// PWA 기능 추가 시
export function AppShell({ children }: AppShellProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return (
    <div className="min-h-screen">
      {!isOnline && (
        <div className="bg-warning text-warning-foreground p-2 text-center">
          오프라인 상태입니다
        </div>
      )}
      {/* 기존 레이아웃 */}
    </div>
  )
}
```

## 예시/스니펫

### 현재 Hero 섹션 레이아웃 분석
```tsx
// src/components/Hero.tsx 구조 분석
export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      
      {/* 컨테이너 */}
      <div className="container mx-auto px-6 relative z-10">
        {/* 그리드 레이아웃 */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 좌측: 텍스트 콘텐츠 */}
          <div className="text-center lg:text-left space-y-8">
            {/* ... */}
          </div>
          
          {/* 우측: 이미지 */}
          <div className="relative">
            {/* ... */}
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 반응형 컴포넌트 예시
```tsx
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ResponsiveSection({ title, children, actions }) {
  const isMobile = useIsMobile()
  
  return (
    <section className={cn(
      "py-16 md:py-24", // 반응형 패딩
      isMobile ? "px-4" : "px-6" // 조건부 마진
    )}>
      <div className="container mx-auto max-w-6xl">
        <div className={cn(
          "space-y-8",
          isMobile ? "text-center" : "text-left"
        )}>
          <h2 className={cn(
            "font-bold tracking-tight",
            isMobile ? "text-3xl" : "text-4xl md:text-5xl"
          )}>
            {title}
          </h2>
          
          <div className={cn(
            "grid gap-8",
            isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
          )}>
            {children}
          </div>
          
          {actions && (
            <div className={cn(
              "flex gap-4",
              isMobile ? "flex-col" : "flex-row justify-center"
            )}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

### Skip Link 구현
```tsx
// src/components/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        // 기본적으로 숨김
        "absolute -top-40 left-6 z-[100]",
        // 포커스 시 표시
        "focus:top-6 focus:bg-primary focus:text-primary-foreground",
        "focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg",
        "transition-all duration-200",
        // 접근성
        "sr-only focus:not-sr-only focus:outline-none"
      )}
    >
      메인 콘텐츠로 이동
    </a>
  )
}

// App.tsx에서 사용
export default function App() {
  return (
    <>
      <SkipLink />
      <main id="main-content" role="main">
        {/* 메인 콘텐츠 */}
      </main>
    </>
  )
}
```

### 동적 뷰포트 높이 처리
```tsx
// 모바일 브라우저 주소창 고려
export function FullHeightSection({ children }) {
  return (
    <section className={cn(
      "min-h-screen", // 기본 fallback
      "min-h-[100dvh]", // 동적 뷰포트 (modern browsers)
      "supports-[height:100cqh]:min-h-[100cqh]" // container query 지원시
    )}>
      {children}
    </section>
  )
}
```

## 성능 최적화

### 섹션별 지연 로딩
```tsx
import { lazy, Suspense } from "react"

const Hero = lazy(() => import("@/components/Hero"))
const Features = lazy(() => import("@/components/Features"))
const Architecture = lazy(() => import("@/components/Architecture"))
const Roadmap = lazy(() => import("@/components/Roadmap"))

export function App() {
  return (
    <main>
      {/* Hero는 즉시 로딩 (Above-the-fold) */}
      <Hero />
      
      {/* 나머지 섹션은 지연 로딩 */}
      <Suspense fallback={<SectionSkeleton />}>
        <Features />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <Architecture />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <Roadmap />
      </Suspense>
    </main>
  )
}
```

### 이미지 최적화
```tsx
// 반응형 이미지 컴포넌트
interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean // LCP 이미지용
}

export function ResponsiveImage({ src, alt, className, priority = false }: ResponsiveImageProps) {
  const isMobile = useIsMobile()
  
  return (
    <img
      src={src}
      alt={alt}
      className={cn("w-full h-auto", className)}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      sizes={isMobile ? "100vw" : "50vw"}
      // 향후 srcSet 추가 예정
    />
  )
}
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- 현재 단일 페이지 구조 분석
- useIsMobile 훅 활용 방식 정리

### v1.1 (계획)
- AppShell 패턴 도입
- 라우팅 시스템 통합
- 성능 최적화 가이드 확장