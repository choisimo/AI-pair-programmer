# Routing & Application Shell Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
Routing & Application Shell 서비스는 SPA 환경에서 경로 전환, 계층적 레이아웃(Outlet / Nested Routes), 코드 스플리팅(Code Splitting), 전역 에러/로딩 경계(Error & Loading Boundaries), SEO/Meta 관리, 접근성(스크롤/포커스 복원) 및 성능 최적화(Prefetch, Lazy, Suspense)를 표준화한다.  
Phase 1: 단일 랜딩 구조 → 기본 라우터 도입, 404 처리, AppShell 통합 구조 확립.  
Phase 2: 중첩 라우트 / 레이지 청크 / 메타데이터 관리(helmet), 스크롤 & 포커스 관리, 라우트 가드.  
Phase 3+: Prefetch 힌트, Progressive Data Fetch(병렬/지연), Dynamic Segment(Workspace/Project), Error Boundary 계층화, 국제화 경로(i18n locale prefix) 지원.

## 2. 범위 제외 사항 (Out of Scope)
- 서버 사이드 렌더링(SSR) / SSG (향후 별도 Feasibility)
- 멀티 탭 동기화(브라우저 세션 간 상태 공유)
- SEO 완전 대응(OG 이미지 동적 생성 등)
- Micro-frontend 라우팅 연동
- 브라우저 히스토리 이력 분석 기반 추천

## 3. 현재 상태 (Current State)
- React Router 의존성 존재 (package.json) → 실제 라우터 구성 파일 없음
- Index / NotFound 두 개 수준 페이지
- AppShell/RootLayout 미도입, 스크롤/포커스 복원 로직 부재
- 메타태그(helmet) 미사용
- 코드 스플리팅/lazy import 미적용
- 라우트 가드 / 권한 체계 미정

## 4. 기능 요구사항 (Functional Requirements)
FR-1: 기본 라우팅 구성 (/, * 404) + RootLayout(AppShell 래핑)  
FR-2: 404 페이지 사용자 친화 메시지 + 홈 복귀 버튼 + 개발 모드 디버그 경로 표시  
FR-3: 스크롤 복원: 라우트 변경 시 window.scrollTo(0,0) (애니메이션 옵션)  
FR-4: 포커스 관리: main landmark로 포커스 이동 (Skip Link 연계)  
FR-5: 코드 스플리팅: 주요 페이지 lazy + Suspense fallback 적용  
FR-6: 에러 바운더리: 라우트 레벨(루트 + 중첩) 최소 1단계 적용 (복구/새로고침 제공)  
FR-7: 라우트 가드 (ProtectedRoute) Auth 상태 기반 접근 제한 (Phase 2)  
FR-8: 메타데이터 관리 (helmet) - title, description, noindex 조건 처리  
FR-9: Prefetch 전략: 링크 Hover / 뷰포트 근접 시 dynamic import 호출 (Phase 2)  
FR-10: 다국어 준비: locale prefix(/:locale/) 구조 옵트인 가능 (Phase 3)  
FR-11: 라우트 변경 Telemetry(nav_transition) 이벤트 (pathFrom, pathTo, duration)  
FR-12: 중첩 레이아웃 지원(예: /projects/:id → 내부 탭)  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 초기 라우터 번들 + RootLayout JS ≤ 10KB gzip (Phase 1)
- 첫 전환(비방문 페이지) lazy 청크 로드 P95 < 250ms (동일 리전)
신뢰성:
- 에러 바운더리에서 치명 오류 발생 시 사용자 복구(홈 이동) 경로 제공
접근성:
- 라우트 전환 후 스크린 리더에 페이지 제목(heading level 1) 자동 노출
- 포커스 트랩 없는 경우 ESC / Tab 정상 흐름
보안:
- 보호 경로 미인증 접근 시 안전한 리다이렉트(/login 예정)
관찰성:
- 전환 이벤트 100% 수집, 누락률 < 1%
유지보수:
- 라우트 정의 단일 소스(router-config.ts) / TS 타입 안전성
확장성:
- 중첩 깊이 3단계까지 성능 회귀 없음 (Idle Task로 메타 업데이트)
국제화:
- locale prefix 비활성 시 불필요한 파라미터 파싱 없음
테스트 용이성:
- 라우트 컴포넌트 독립 테스트 가능(메타/가드 주입 모킹)

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 라우트 구성 (Pseudo)
```ts
// router-config.ts
interface AppRoute {
  path: string
  element: React.ReactNode
  lazy?: () => Promise<React.ComponentType<any>>
  children?: AppRoute[]
  protected?: boolean
  meta?: {
    title?: string
    description?: string
    noIndex?: boolean
  }
}

export const routes: AppRoute[] = [
  {
    path: "/",
    element: <HomePage />,
    meta: { title: "홈", description: "AI Pair Programmer 소개" }
  },
  {
    path: "*",
    element: <NotFoundPage />,
    meta: { title: "404 - Not Found", noIndex: true }
  }
]
```
### 6.2 ProtectedRoute Wrapper
```ts
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
```
### 6.3 Scroll & Focus Hook
```ts
function useRouteEffects() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
    const main = document.getElementById("main-content")
    if (main) {
      main.setAttribute("tabindex", "-1")
      main.focus()
    }
    emit("nav_transition", { to: location.pathname })
  }, [location.pathname])
}
```
### 6.4 Error Boundary (요약)
```tsx
class RouteErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <ErrorFallback />
    return this.props.children
  }
}
```
### 6.5 Helmet 메타 적용
```tsx
<Helmet>
  <title>{meta.title}</title>
  {meta.description && <meta name="description" content={meta.description} />}
  {meta.noIndex && <meta name="robots" content="noindex,nofollow" />}
</Helmet>
```

## 7. 데이터 모델 (Data Model)
- RouteMeta(path, title, description, noIndex, updatedAt)
- RoutePerfSample(id, path, firstLoad, chunkLoadTimeMs, collectedAt)
- TransitionEvent(id, fromPath, toPath, startedAt, endedAt, durationMs)
- GuardDecision(id, path, allowed, reason, userRole, timestamp)
인덱스:
- RouteMeta.path unique
- TransitionEvent(toPath + startedAt)
Retention:
- TransitionEvent 30일(집계 후 요약)
Derived Metrics:
- avgTransitionDuration(path), firstPaintLatency, guardDenialsCount

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 최초 진입
1. BrowserRouter 초기화 → RootLayout 마운트  
2. 초기 경로 매칭 → Lazy 필요 시 Suspense 로딩 표시  
3. Helmet 메타 삽입 → main 포커스 이동  
4. Telemetry 전환 이벤트 기록  
### 8.2 코드 스플리팅 전환
1. Link Hover → Prefetch Trigger (dynamic import)  
2. 클릭 시 캐시된 모듈 즉시 실행 → Skeleton 최소 표시  
### 8.3 인증 보호 경로 접근
1. ProtectedRoute 진입 → useAuth 검사  
2. 미인증 → 로그인 라우트 리다이렉트  
3. 성공 → children 렌더  
### 8.4 에러 처리
1. 자식 트리 오류 throw → RouteErrorBoundary catch  
2. Fallback UI (재시도 / 홈 이동)  
3. Telemetry error_event 기록  
### 8.5 국제화 경로(Phase 3)
1. /ko/... /en/... locale segment 파싱  
2. Locale Provider 세팅 → 문자열 로드  
3. 경로 변경 시 locale 변경 감지 → 메타 갱신  
### 8.6 중첩 탭(Route Segment)
1. /projects/:id 로드 → Outlet → children 탭(/overview, /settings)  
2. 탭 클릭: 내부 Outlet 전환 / 상위 메타(Title suffix) 갱신  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (인증 상태, 역할)
- Configuration & Environment (기능 플래그, base path)
- Performance Optimization (Prefetch 정책)
Downstream:
- Layout & Navigation (AppShell 구조)
- UI Foundation (Skeleton / Error / Focus 스타일)
- Telemetry & Observability (전환/에러 메트릭)
- Internationalization (locale 경로 파싱)
교차:
- Projects & Workspaces (동적 세그먼트 :id)
외부:
- react-router-dom
- react-helmet-async

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| Lazy 청크 지연 | 첫 전환 UX 저하 | Hover Prefetch + Preload hint |
| 메타 누락 | SEO / 공유 미흡 | 라우트 메타 필수 스키마 ESLint Rule |
| 포커스 이동 실패 | 접근성 저하 | E2E a11y 테스트 + main tabindex 관리 |
| Guard 로직 과도 복잡 | 유지보수 비용 증가 | 단일 useAuth + 정책 Wrapper |
| 에러 바운더리 누락 | 빈 화면 | 라우트 선언 CI 검사 (hasBoundary) |
| 중첩 Outlet 성능 저하 | 렌더 딜레이 | memo + Suspense 분리 |
| Prefetch 과도 | 네트워크 낭비 | IntersectionObserver + Rate Limit |
| Locale 경로 파싱 실패 | 잘못된 번역 | 정규식 테스트 + Fallback locale |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- 기본 라우터 + 404 + Scroll & Focus + RootLayout
수락: 404 접근 시 홈 복귀 동작, Lighthouse A11y ≥ 95  
M2:
- Lazy Routes + ProtectedRoute + Helmet 메타
수락: Lazy 전환 P95 < 300ms / 미인증 보호 경로 리다이렉트 성공  
M3:
- Prefetch(Hover/Viewport) + Transition Telemetry
수락: Prefetch 적용 후 첫 전환 Time-to-Render 20%↓ 로그  
M4:
- 중첩 라우트 + Route Error Boundary 레벨링
수락: 강제 오류 시 Fallback 표시/복구 기능 정상  
M5:
- Locale Prefix + Dynamic Segment SEO 확장
수락: /en /ko 전환 시 메타(title lang 반영) 및 포커스 정상  

## 12. 향후 확장 계획 (Future Extensions)
- Streaming Data + Suspense(React 19) Progressive Hydration
- Navigation Intent Predictor (사용자 이동 확률 기반 Prefetch)
- Offline Route Manifest (Service Worker)
- Dynamic Breadcrumb Resolver (Symbol Graph 연계)
- Route-level Policy Attach (Security Compliance)
- Structured Data Injection (JSON-LD) 자동화
- A/B 실험 분기 라우팅 (Feature Flag Variation)
- Error Replay Deep-link (세션 상태 복구)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20