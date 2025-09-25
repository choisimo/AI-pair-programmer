# Layout & Navigation Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
Layout & Navigation 서비스는 애플리케이션의 전역 구조(App Shell), 영역(헤더/사이드바/메인/푸터) 배치, 반응형(Responsive) 전환, 글로벌 내비게이션 패턴, Skip Link 및 접근성(Accessibility) 내비게이션 흐름, 전역 상태(테마 토글·알림 마운트 포인트) 배치를 표준화한다.  
Phase 1 목표: 단일 랜딩 페이지 중심 구조를 AppShell 패턴으로 이행 가능한 토대 마련.  
Phase 2: 라우팅 통합(RootLayout/Outlet), 사이드바/상단 바 동적 구성, Presence Indicator(협업), 상태 동기(테마/언어) 삽입.  
Phase 3+: Enterprise Workspace 전환(다중 프로젝트, 역할 기반 내비게이션), Lazy/Prefetch 전략 적용.

## 2. 범위 제외 사항 (Out of Scope)
- 세부 페이지 콘텐츠 구성(도메인 UI 로직)
- 복잡한 마이크로 프론트엔드(Micro-frontend) 통합
- IDE 스타일 다중 패널 리사이저(실시간 코드 편집 뷰는 별도)
- 인앱 온보딩 투어(별도 Guide/Help 서비스)
- 접근 제어(Role Enforcement) 세부 정책( Auth & User Management PRD )

## 3. 현재 상태 (Current State)
- App.tsx 내 섹션 직접 수직 배치(Hero, Features, Architecture, Roadmap)
- 재사용 가능한 AppShell 컴포넌트 미구현 (docs/services/layout.md에 설계 예시 존재)
- Skip Link 구현 없음
- 네비게이션 항목/모듈 분리 미흡
- 반응형 훅 useIsMobile 존재 (hooks 서비스)
- 향후 라우팅 확장(react-router-dom) 대비 RootLayout 부재
- 전역 Portal(Toaster, Dialog Root) 위치 분리 전략 미문서화

## 4. 기능 요구사항 (Functional Requirements)
FR-1: AppShell 컴포넌트는 header / sidebar / main / footer / toaster slot 제공  
FR-2: Skip Link(키보드 Tab 첫 진입 시 표시) 제공  
FR-3: 모바일( <768px )에서 sidebar 자동 숨김 + Drawer/Sheet 패턴 지원  
FR-4: Navigation 구조는 계층화(Primary, Secondary, Utility)된 데이터 기반 렌더링  
FR-5: 현재 활성 경로(active state) 시각적 강조 (ARIA states 적용)  
FR-6: focus-visible 스타일 글로벌 적용 및 키보드 순서 논리 보장  
FR-7: 전역 레이아웃은 ThemeProvider / QueryClientProvider / Toaster / ErrorBoundary 포괄  
FR-8: 라우트 변경 시 스크롤 복원 및 Skip Link 앵커 #main-content 포커스 가능  
FR-9: Lighthouse A11y Score ≥ 95 유지 (레이아웃 변경 시 회귀 검증)  
FR-10: 레이아웃 내 주요 영역 landmark(role="banner"|"navigation"|"main"|"contentinfo") 명시  
FR-11: 다크 모드 전환 시 레이아웃 FOUC(Flash) 최소화 (prefers-color-scheme 초기 적용)  
FR-12: Phase 2에서 Workspace Context에 따른 동적 메뉴 세트 구성 지원 (data-driven)  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 초기 렌더 LCP 영향 레이아웃 JS(순수) ≤ 5KB gzip (AppShell + Navigation)
- 사이드바/보조 패널 Lazy chunk 로드 (비가시 시 지연)
신뢰성:
- Navigation 데이터 주입 실패 시 안전한 Fallback (빈 상태 + 로깅)
접근성:
- 키보드 전용 탐색(Tab/Shift+Tab) 전체 상호작용 요소 순환 가능
- Skip Link 초점 도달 시간 < 1 Tab
보안:
- 메뉴 항목 권한 필터링 클라이언트에서만 의존 금지 (서버 제공 권한)
유지보수성:
- Navigation 항목은 JSON/구조화 config로 분리
관찰성:
- 페이지 전환/메뉴 클릭 Telemetry Hook (nav_click 이벤트)
확장성:
- 다중 Workspace 전환 시 레이아웃 리마운트 없이 메뉴 재구성
국제화:
- 레이블 문자열 외부 i18n 키 사용 (하드코딩 금지)
테마:
- 색상/간격 Token 기반 (UI Foundation PRD 참조)

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 AppShell Props (초안)
```ts
interface AppShellProps {
  navigation?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  withSkipLink?: boolean
  maxWidth?: 'full' | 'xl' | '2xl' | 'custom'
}
```
### 6.2 Navigation Item 모델
```ts
interface NavItem {
  id: string
  labelKey: string       // i18n key
  icon?: React.ComponentType<{ className?: string }>
  to?: string             // 내부 라우트
  href?: string           // 외부 링크
  children?: NavItem[]
  priority?: number
  roles?: string[]        // 접근 허용 역할 (undefined=공용)
  exact?: boolean
  badge?: { textKey: string; variant?: 'accent' | 'info' }
}
```
### 6.3 NavigationConfig Provider
```ts
interface NavigationConfig {
  primary: NavItem[]
  secondary?: NavItem[]
  utility?: NavItem[]
}
const NavigationContext = React.createContext<NavigationConfig | null>(null)
```
### 6.4 Scroll Restoration Hook
```ts
function useScrollRestore() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname])
}
```
### 6.5 Skip Link Element
```tsx
<a href="#main-content" className="skip-link">메인 콘텐츠로 건너뛰기</a>
```
### 6.6 Telemetry Hook (Phase 2)
```ts
function useNavTelemetry() {
  const track = (item: NavItem) => emit('nav_click', { id: item.id })
  return { track }
}
```

## 7. 데이터 모델 (Data Model)
(렌더링/구성용)
- LayoutPreference(userId, theme, sidebarCollapsed, densityMode)
- NavItemRegistry(id, labelKey, path, parentId?, order, roles?)
- WorkspaceMenuMapping(workspaceId, navItemId, visibility)
- TelemetryNavEvent(id, navItemId, timestamp, userId, workspaceId)
인덱스:
- NavItemRegistry(parentId + order)
- WorkspaceMenuMapping(workspaceId)
TTL:
- TelemetryNavEvent: 90일 보존(집계 후 압축)

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 초기 로드
1. AppShell 마운트 → NavigationConfig fetch (또는 static import)  
2. 사용자 레이아웃 환경설정(Local Storage / Server) 로드  
3. Theme 적용 후 본문 렌더  
4. Skip Link 포커스 가능 상태 준비  
### 8.2 라우트 전환
1. NavItem 클릭 → Telemetry track  
2. react-router DOM Outlet 변경 → useScrollRestore 실행 → Top 이동  
3. Active NavItem 강조 (aria-current="page")  
### 8.3 사이드바 토글
1. 버튼 클릭 → collapsed 상태 저장(LayoutPreference)  
2. aria-expanded 속성 업데이트  
3. 뷰포트 폭 변경 시 useIsMobile 재평가 → Drawer 변환  
### 8.4 Workspace 전환 (Phase 2)
1. workspaceId 변경 이벤트 → NavigationConfig 재로드  
2. Diff 계산 → 필요한 부분만 재렌더  
3. Presence Indicator (협업) 영역 불변 유지  
### 8.5 접근성 탐색
1. Tab → Skip Link → Enter → #main-content 포커스  
2. h 키(스크린리더)로 랜드마크 이동  
3. 메뉴 아이템 키보드 Arrow Navigation (수직)  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (roles, userId)
- Projects & Workspaces (workspace context)
- Configuration & Environment (feature flags)
Downstream:
- Routing & Application Shell (Outlet 렌더링)
- UI Foundation (토큰/컴포넌트)
- Notification & Feedback (Toaster 위치)
- Realtime Collaboration (Presence 패널 삽입)
- Telemetry & Observability (nav_click 이벤트)
Cross:
- Performance Optimization (Prefetching Link)
외부:
- react-router-dom
- lucide-react (icons)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 과도한 재렌더(메뉴 재구성) | 성능 저하 | memo + 분리된 NavTree 컴포넌트 |
| 모바일 Drawer 포커스 트랩 실패 | 접근성 문제 | Radix Dialog/Sheet 활용 |
| 권한 없는 항목 노출 | 보안/혼란 | 서버 필터링 + 클라이언트 추가 필터 |
| Skip Link 누락 회귀 | A11y 점수 하락 | CI Axe 테스트 룰 |
| 사이드바 Collapse FOUC | 시각적 깜박임 | 초기 preference 동기 로드 |
| Prefetch 과다 호출 | 네트워크 낭비 | Intersection Observer + throttle |
| 다국어 라벨 길이 증가 | 레이아웃 깨짐 | min/max width + text-ellipsis |
| 활성 경로 매칭 실패 | 잘못된 강조 | exact/startsWith 규칙 명시 & 테스트 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- AppShell + Navigation Slot + Skip Link
- Active Nav Highlight & Scroll Restore
수락: 키보드 Tab 1회 후 Skip Link 포커스, Lighthouse A11y ≥ 95  
M2:
- Workspace-aware Navigation 재구성
- Sidebar Drawer(모바일) + Telemetry(nav_click)
수락: 메뉴 클릭 이벤트 100% 수집 / 모바일 전환 < 300ms  
M3:
- Prefetch(Link Hover/Viewport) 전략
- Collapsed Sidebar 상태 영속 저장
수락: Prefetch 후 첫 전환 TTFB 감소 로그명시 (≥20% 개선)  
M4:
- Dynamic Badge / Role-based Filter
- Presence Indicator Slot 통합
수락: 임의 Role 제한 테스트에서 숨김 항목 정확도 100%  
M5:
- Layout Theming Token 확장 + Density 모드
수락: Density 전환 CLS < 0.02  

## 12. 향후 확장 계획 (Future Extensions)
- Micro Layout Segment (좌/우 패널 동적 Attach)
- Command Palette Navigation (모달 기반)
- Breadcrumb 자동 생성(Graph 기반)
- Adaptive Navigation (빈도 기반 재정렬)
- Workspace Dock (다중 프로젝트 핀 고정)
- Layout Performance Budget 대시보드
- Offline Navigation Manifest (Pre-cache Routes)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20