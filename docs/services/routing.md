# 라우팅 서비스 (Routing Service)

## 목적/역할
- SPA(Single Page Application) 라우팅 관리
- 404 오류 페이지 처리 및 사용자 경험 개선
- 정적 호스팅 환경에서의 클라이언트 사이드 라우팅 지원
- 오류 로깅 및 디버깅 지원

## 공개 API

### 현재 페이지 컴포넌트
```tsx
import Index from "@/pages/Index"
import NotFound from "@/pages/NotFound"

// React Router 사용 중
import { useLocation } from "react-router-dom"
```

### 페이지 구조
```tsx
// src/pages/Index.tsx - 메인 랜딩 페이지
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <CodeDemo />
      <Architecture />
      <Roadmap />
    </div>
  )
}

// src/pages/NotFound.tsx - 404 오류 페이지
const NotFound = () => {
  // 오류 로깅 및 사용자 친화적 UI
}
```

## 내부 설계

### 현재 라우팅 구조
- **메인 페이지**: `/` → Index 컴포넌트
- **404 페이지**: 존재하지 않는 경로 → NotFound 컴포넌트
- **라우터**: React Router 사용 (package.json 확인 필요)

### 페이지 레이아웃 패턴
```tsx
// 모든 페이지는 최소 전체 화면 높이를 가짐
<div className="min-h-screen bg-background">
  {/* 페이지 콘텐츠 */}
</div>
```

### 404 오류 처리 로직
```tsx
const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    // 개발 환경에서 오류 경로 로깅
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    )
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* 중앙 정렬된 404 메시지 */}
    </div>
  )
}
```

### 라우트 설정 (추정)
```tsx
// App.tsx 또는 main.tsx에서 설정
import { BrowserRouter, Routes, Route } from 'react-router-dom'

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

## 의존성

### 핵심 의존성
- **React Router**: 클라이언트 사이드 라우팅
- **React**: 컴포넌트 구조 및 훅

### 배포 의존성
- **정적 호스팅**: SPA 리라이트 규칙 필요
- **History API**: 브라우저 뒤로가기/앞으로가기 지원

## 예외/에러 처리

### 404 페이지 사용자 경험
```tsx
// 현재 구현 개선 제안
const NotFound = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-6">
        {/* 접근성 개선 */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        
        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/')} size="lg">
            홈으로 돌아가기
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            size="lg"
          >
            이전 페이지로
          </Button>
        </div>
        
        {/* 개발 환경에서만 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-sm">
            <p>요청된 경로: <code>{location.pathname}</code></p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 라우트 가드 (향후 확장)
```tsx
// 인증이 필요한 페이지 보호
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// 사용
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### 배포 환경별 라우팅 설정
```tsx
// 정적 호스팅 대응
// Netlify: _redirects 파일
/* /index.html 200

// Vercel: vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

// Apache: .htaccess
RewriteEngine On
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 테스트 포인트

### 라우팅 동작 테스트
```tsx
describe("라우팅", () => {
  test("메인 페이지 렌더링", () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
    )
    
    expect(screen.getByText(/AI 페어 프로그래머/)).toBeInTheDocument()
  })
  
  test("404 페이지 렌더링", () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    )
    
    expect(screen.getByText("404")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Return to Home/i })).toBeInTheDocument()
  })
})
```

### 네비게이션 테스트
```tsx
describe("네비게이션", () => {
  test("홈 링크 클릭 시 메인 페이지로 이동", () => {
    const { user } = setup(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    )
    
    // 존재하지 않는 경로로 이동
    window.history.pushState({}, 'Test', '/non-existent')
    
    // 404 페이지에서 홈 링크 클릭
    const homeLink = screen.getByRole("link", { name: /Return to Home/i })
    await user.click(homeLink)
    
    expect(screen.getByText(/AI 페어 프로그래머/)).toBeInTheDocument()
  })
})
```

### 접근성 테스트
```tsx
describe("404 페이지 접근성", () => {
  test("적절한 헤딩 구조", () => {
    render(<NotFound />)
    
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404")
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
  })
  
  test("키보드 내비게이션", () => {
    render(<NotFound />)
    
    const homeLink = screen.getByRole("link")
    expect(homeLink).toBeVisible()
    
    // Tab으로 포커스 가능
    homeLink.focus()
    expect(homeLink).toHaveFocus()
  })
})
```

### 배포 환경 테스트
```tsx
describe("SPA 라우팅", () => {
  test("직접 URL 접근 시 올바른 페이지 렌더링", async () => {
    // 프로그래틱 네비게이션
    window.history.pushState({}, 'Test', '/')
    
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    )
    
    expect(screen.getByText(/AI 페어 프로그래머/)).toBeInTheDocument()
  })
  
  test("새로고침 후에도 페이지 유지", () => {
    // 실제 배포 환경에서는 서버 설정 테스트 필요
    // E2E 테스트로 검증 권장
  })
})
```

## 코드 리뷰 체크리스트

### 라우트 구조
- [ ] 메인 라우트(`/`)가 올바르게 설정되었는가?
- [ ] 모든 미매치 경로가 404로 처리되는가?
- [ ] 라우트 컴포넌트가 lazy loading 적용 가능한가?

### 404 페이지
- [ ] 사용자 친화적인 메시지 제공?
- [ ] 홈으로 돌아가는 명확한 방법 제공?
- [ ] 접근성 고려 (헤딩 구조, 포커스 관리)?
- [ ] 개발 환경에서만 디버그 정보 표시?

### 배포 설정
- [ ] 정적 호스팅 환경의 리라이트 규칙 설정됨?
- [ ] History API fallback 동작 확인?
- [ ] SEO 고려사항 (meta tags, sitemap)?

### 성능
- [ ] 페이지 컴포넌트가 필요시 코드 스플리팅 적용?
- [ ] 불필요한 리렌더링 방지?
- [ ] 라우트 변경 시 스크롤 위치 관리?

## 확장 가이드

### 다중 페이지 구조
```tsx
// 페이지 확장 예시
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, // 공통 레이아웃
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: "about",
        element: <About />
      },
      {
        path: "docs",
        element: <DocsLayout />,
        children: [
          {
            path: "getting-started",
            element: <GettingStarted />
          },
          {
            path: "api",
            element: <APIReference />
          }
        ]
      },
      {
        path: "*",
        element: <NotFound />
      }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
```

### 코드 스플리팅
```tsx
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// 지연 로딩 컴포넌트
const Index = lazy(() => import('@/pages/Index'))
const About = lazy(() => import('@/pages/About'))
const Docs = lazy(() => import('@/pages/Docs'))

function App() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Index />
          </Suspense>
        } 
      />
      <Route 
        path="/about" 
        element={
          <Suspense fallback={<PageSkeleton />}>
            <About />
          </Suspense>
        } 
      />
      <Route 
        path="/docs/*" 
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Docs />
          </Suspense>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function PageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-16 bg-muted mb-8" />
      <div className="container mx-auto px-6 space-y-4">
        <div className="h-8 bg-muted w-1/2" />
        <div className="h-4 bg-muted w-3/4" />
        <div className="h-4 bg-muted w-1/2" />
      </div>
    </div>
  )
}
```

### 메타데이터 관리
```tsx
// react-helmet-async 사용
import { Helmet } from 'react-helmet-async'

const Index = () => {
  return (
    <>
      <Helmet>
        <title>AI 페어 프로그래머 - 지능형 개발 동반자</title>
        <meta 
          name="description" 
          content="실시간 코드 분석과 지능적인 피드백을 제공하는 혁신적인 개발 도구"
        />
        <meta property="og:title" content="AI 페어 프로그래머" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ai-pair-programmer.com" />
        <link rel="canonical" href="https://ai-pair-programmer.com" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* 페이지 콘텐츠 */}
      </div>
    </>
  )
}

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - 페이지를 찾을 수 없습니다 | AI 페어 프로그래머</title>
        <meta name="description" content="요청하신 페이지를 찾을 수 없습니다." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center">
        {/* 404 콘텐츠 */}
      </div>
    </>
  )
}
```

### 라우트 기반 권한 관리
```tsx
// 권한 체크 훅
function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 인증 상태 확인
    checkAuthStatus()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])
  
  return { user, loading, isAuthenticated: !!user }
}

// 보호된 라우트 컴포넌트
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, isAuthenticated } = useAuth()
  
  if (loading) {
    return <PageSkeleton />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

// 라우트에 적용
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### 스크롤 복원 관리
```tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 스크롤 복원 훅
function useScrollToTop() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    // 새 페이지로 이동 시 상단으로 스크롤
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }, [pathname])
}

// 페이지 컴포넌트에서 사용
const Index = () => {
  useScrollToTop()
  
  return (
    <div className="min-h-screen bg-background">
      {/* 콘텐츠 */}
    </div>
  )
}

// 또는 전역으로 적용
function ScrollToTop() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  
  return null
}

// App에서 사용
<BrowserRouter>
  <ScrollToTop />
  <Routes>
    {/* 라우트들 */}
  </Routes>
</BrowserRouter>
```

## 예시/스니펫

### 개선된 404 페이지
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, ArrowLeft, Search } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleGoHome = () => navigate('/')
  const handleGoBack = () => window.history.back()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6 space-y-6">
          {/* 404 아이콘과 숫자 */}
          <div className="space-y-2">
            <div className="text-6xl font-bold text-muted-foreground/50">
              404
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              페이지를 찾을 수 없습니다
            </h1>
            <p className="text-muted-foreground">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGoHome} size="sm">
              <Home className="w-4 h-4 mr-2" />
              홈으로 가기
            </Button>
            <Button variant="outline" onClick={handleGoBack} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지
            </Button>
          </div>

          {/* 유용한 링크들 */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm text-muted-foreground">다음 페이지들을 둘러보세요:</p>
            <div className="flex justify-center gap-2 text-sm">
              <Button variant="link" size="sm" onClick={() => navigate('/')}>
                홈
              </Button>
              <Button variant="link" size="sm" onClick={() => navigate('/about')}>
                소개
              </Button>
              <Button variant="link" size="sm" onClick={() => navigate('/contact')}>
                문의
              </Button>
            </div>
          </div>

          {/* 개발 환경에서만 디버그 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-muted rounded text-xs text-left">
              <strong>Debug Info:</strong>
              <br />
              <code>pathname: {location.pathname}</code>
              <br />
              <code>search: {location.search}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound
```

### 에러 바운더리와 통합
```tsx
import { Component } from 'react'
import { Button } from '@/components/ui/button'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // 실제 서비스에서는 에러 리포팅 서비스로 전송
    // reportError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-destructive">
                앗, 뭔가 잘못됐네요!
              </h1>
              <p className="text-muted-foreground">
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 보세요.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                페이지 새로고침
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                홈으로 가기
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 p-4 bg-muted rounded text-left text-sm">
                <summary className="cursor-pointer font-medium">
                  오류 세부사항 (개발 모드)
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error?.toString()}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 라우터에 적용
<BrowserRouter>
  <ErrorBoundary>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </ErrorBoundary>
</BrowserRouter>
```

### 페이지 전환 로딩
```tsx
import { Suspense, useTransition } from 'react'
import { useNavigation } from 'react-router-dom'

function NavigationProgress() {
  const navigation = useNavigation()
  const isNavigating = navigation.state === 'loading'

  return (
    <>
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-primary animate-pulse" />
        </div>
      )}
    </>
  )
}

// 페이지 전환 시 로딩 표시
function App() {
  return (
    <BrowserRouter>
      <NavigationProgress />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

## 성능 최적화

### 프리로딩
```tsx
// 마우스 호버 시 페이지 프리로드
import { Link } from 'react-router-dom'

function NavigationLink({ to, children, ...props }) {
  const [shouldPreload, setShouldPreload] = useState(false)
  
  useEffect(() => {
    if (shouldPreload) {
      // 동적 임포트로 프리로드
      import(`../pages/${to.slice(1) || 'Index'}.tsx`)
    }
  }, [shouldPreload, to])
  
  return (
    <Link
      to={to}
      onMouseEnter={() => setShouldPreload(true)}
      {...props}
    >
      {children}
    </Link>
  )
}
```

### 라우트 기반 코드 스플리팅
```tsx
// 페이지별 청크 분리
const pages = {
  Index: lazy(() => import('@/pages/Index')),
  About: lazy(() => import('@/pages/About')),
  Contact: lazy(() => import('@/pages/Contact')),
  NotFound: lazy(() => import('@/pages/NotFound'))
}

const PageSuspense = ({ children }) => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  }>
    {children}
  </Suspense>
)

// 라우트 설정
<Routes>
  <Route path="/" element={
    <PageSuspense>
      <pages.Index />
    </PageSuspense>
  } />
  <Route path="/about" element={
    <PageSuspense>
      <pages.About />
    </PageSuspense>
  } />
  {/* ... */}
</Routes>
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- React Router 기반 현재 구조 분석
- 404 페이지 개선 방안 제시

### v1.1 (계획)
- 코드 스플리팅 도입
- 메타데이터 관리 (react-helmet-async)
- 에러 바운더리 통합