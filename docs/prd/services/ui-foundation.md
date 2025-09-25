# UI Foundation Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
UI Foundation 서비스는 제품 전반에서 일관된 디자인 토큰(Design Tokens), 컴포넌트 추상화, 상호작용 패턴, 접근성 규칙, 다크 모드 및 반응형(Responsive) 기준을 제공하는 기반 계층이다.  
본 문서는 shadcn/ui + Radix UI primitives + Tailwind CSS + 내부 유틸리티(cn, class-variance-authority) 결합을 통한 디자인 시스템화 전략과 컴포넌트 라이프사이클(추가/변경/폐기) 및 확장 표준을 정의한다.  
Phase 1 목표는 마케팅/온보딩 단계의 핵심 UI 컴포넌트 안정화 및 접근성 준수, Phase 2 이후 대화형(AI Suggestion 표시, Realtime Presence Indicator) 확장을 수용하도록 컴포지션 구조를 확립하는 것이다.

## 2. 범위 제외 사항 (Out of Scope)
- 고급 데이터 시각화 대시보드(Analytics 전용 컴포넌트) (후속 Feature Team)
- IDE 임베디드/VSCode Extension UI (별도 채널)
- 3D/Canvas 기반 렌더링 (추후 성능 검토)
- 이메일/프린트 전용 레이아웃 템플릿
- 브라우저 외 플랫폼(모바일 네이티브) 전용 컴포넌트

## 3. 현재 상태 (Current State)
- shadcn/ui 기반 핵심 컴포넌트(Button, Card, Dialog, Badge 등) 이미 코드베이스 존재
- Variant 시스템(cva) 및 cn 유틸 사용 패턴 정립 중
- 접근성: Radix primitives 활용으로 기본 a11y 확보, 테스트 자동화 미구현
- 디자인 토큰(Tailwind 확장)을 통한 색상/간격 일부 적용, 세분화된 Semantic Tokens 부재
- 컴포넌트 버저닝/Deprecation 정책 미정
- Storybook / 시각적 회귀(Visual Regression) 환경 미구축

## 4. 기능 요구사항 (Functional Requirements)
FR-1: 모든 재사용 컴포넌트는 최소 (Props 타입 정의, variant/size 정의, a11y 속성 패스스루) 충족  
FR-2: Variant 변경은 class-variance-authority(cva) 기반으로만 관리 (임의 조건부 클래스 금지)  
FR-3: 다크 모드 전환은 html[data-theme] 또는 class('dark') 기반 토글 (System/Manual) 지원  
FR-4: 색상 / 공간 / 타이포그래피 / Radius / Shadow / Z-Index 토큰 정의 (Tailwind theme.extend)  
FR-5: 컴포넌트는 포커스 스타일(focus-visible) 일관 적용 및 명도 대비 WCAG 2.1 AA 준수  
FR-6: Loading / Disabled / Error / Empty 상태를 명시적으로 Props 혹은 Slot으로 표현  
FR-7: 컴포넌트 변경 시 BREAKING 여부를 PR 라벨 & CHANGELOG 섹션에 기록  
FR-8: 아이콘 시스템(Lucide) 래퍼 제공 (크기/색상 props 통일)  
FR-9: Skeleton / Suspense Placeholder 표준화 (로딩 상태 최소 3종: Text, Block, Avatar)  
FR-10: 반응형 규칙 최소 브레이크포인트(sm, md, lg, xl)에서 시각적 레이아웃 깨짐 없도록 시나리오 테스트  
FR-11: 접근성 속성 (aria-label/aria-describedby/role) 전파 (forward) 필수  
FR-12: AI 관련 하이라이트/인라인 Suggestion Badge 컴포넌트 슬롯 확장 포인트 정의 (Phase 2)  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능(Performance):
- 최초 의미 있는 컴포넌트 번들(LCP 영향) ≤ 70KB gzip (Phase 1)
- 지연 로딩(Lazy) 가능한 대화형(Form, Chart 등) 청크 분리
신뢰성(Reliability):
- 브레이킹 변경 도입 시 마이그레이션 가이드(Mapping Table) 포함
접근성(Accessibility):
- 핵심 상호작용 컴포넌트 (Button, Dialog, Menu, Tooltip, Tabs) Axe 자동 검사 0 중대 위반
- 키보드 전환(순환) 순서 논리적 유지
보안(Security):
- 사용자 입력 렌더링 시 HTML 인젝션 방지 (dangerouslySetInnerHTML 사용 제한 정책)
유지보수성(Maintainability):
- 컴포넌트 단위 JSDoc / Props 설명 100% (공개 컴포넌트 기준)
일관성(Consistency):
- Variant 명명 규칙: intent(primary/destructive/outline/ghost/link) + size(default/sm/lg/icon)
관찰성(Observability):
- 사용자 인터랙션(크리티컬 컴포넌트 클릭) Telemetry Hook 삽입 가능 구조 (Phase 2)
국제화(I18n Readiness):
- 하드코딩된 문자열 UI Foundation 내부 금지 (문자열은 상위 레이어에서 전달)

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 컴포넌트 표준 Props (예시: Button)
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  'aria-label'?: string
}
```
### 6.2 Icon Wrapper
```ts
interface IconProps {
  name: string // lucide icon key
  size?: number
  className?: string
  decorative?: boolean // 접근성: true면 aria-hidden
}
```
### 6.3 Theming Hook (Phase 2)
```ts
interface UseThemeResult {
  theme: 'light' | 'dark' | 'system'
  setTheme(theme: 'light' | 'dark' | 'system'): void
  isSystemDark: boolean
}
```
### 6.4 Design Token 접근 (Utility)
```ts
type SemanticColor = 'bg.surface' | 'bg.subtle' | 'text.primary' | 'text.muted' | 'border.default' | 'accent.primary'
function useToken(token: SemanticColor): string
```
(Phase 2: CSS Variable로 매핑)

## 7. 데이터 모델 (Data Model)
(주로 메타/관리 관점)
- ComponentMeta(name, version, status: 'stable'|'experimental'|'deprecated', firstIntroduced, lastModified, breakingChanges[])
- VariantMeta(componentName, variantName, semanticIntent, introducedIn)
- Token(name, category('color'|'space'|'radius'|'shadow'|'z'|'font'), value, darkValue?, description, deprecated?)
- ChangelogEntry(componentName, version, type('add'|'fix'|'break'|'deprecate'), summary, migrationGuide?)

인덱스/구조:
- ComponentMeta.name unique
- Token.name unique
- 검색: category별 grouping

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 새 컴포넌트 추가
1. 설계 검토 (이슈 Template: Use Cases, A11y, Variants, States)
2. 구현 (cva + forwardRef + displayName)
3. 문서화 (Props Table + 예시 + 사용 지침)
4. 스냅샷 테스트 + 접근성 검사
5. CHANGELOG 기록 & version tag (minor or patch)
6. Merge 후 배포 → Storybook 페이지 생성(Phase 2)

### 8.2 Variant 추가
1. 기존 variant 와 충돌 여부 검증 (이름/의미)
2. 디자인 토큰 참조 (색상/배경/테두리)
3. 테스트 (Hover/Focus/Disabled/Active)
4. 문서 variant matrix 업데이트

### 8.3 컴포넌트 폐기(Deprecation)
1. Deprecate 라벨 + 경고 콘솔 (개발 모드)
2. 대체 컴포넌트 마이그레이션 가이드 표
3. N 릴리즈 후 제거 (최소 2 minor grace)

### 8.4 다크 모드 토글
1. setTheme 호출 → html class 변경
2. CSS Variable 업데이트 → Transition(선택적)
3. 사용자 설정 로컬 저장 → 초기 hydration 시 적용

### 8.5 AI Suggestion Badge 삽입 (Phase 2 시나리오)
1. Core Engine 제안 수신 → 대상 라인/컴포넌트 anchor
2. UI BadgeSlot 렌더 (position overlay)
3. Hover / Focus 시 설명 Tooltip
4. Accept / Dismiss 액션 → Telemetry 이벤트

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Build & Environment (Tailwind config, vite alias)
- Configuration & Environment (테마/실험 플래그)
- Internationalization (문자열 주입 패턴)
Downstream:
- Layout & Navigation (AppShell slot)
- Routing & Application Shell (Suspense/Loader Wrapper)
- Notification & Feedback (Toast, Inline Alert)
- Realtime Collaboration (Presence Indicators)
- Core AI Engine (Suggestion Rendering Container)
외부 라이브러리:
- Radix UI (A11y primitives)
- shadcn/ui (Scaffold)
- Lucide React (Icons)
- class-variance-authority, tailwind-merge

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 무분별한 inline 스타일 | 테마/일관성 붕괴 | ESLint Rule + Style Review Checklist |
| Variant 남용 | 유지보수 비용 증가 | Variant 승인 프로세스 (디자인/엔지니어 동시) |
| 접근성 회귀 | 사용성 저하 | 자동 Axe CI + 수동 키보드 테스트 |
| 다크 모드 토큰 불일치 | 색 대비 문제 | Lighthouse/Axe 대비 검증 파이프라인 |
| 컴포넌트 중복 구현 | 번들 비대 | 컴포넌트 레지스트리 조회/재사용 Mandatory |
| Breaking 변경 미표기 | 빌드/런타임 오류 | CHANGELOG 템플릿 강제 & PR 체크 |
| 대형 번들 | 초기 로딩 지연 | 청크 스플리팅 + Lazy import 정책 |
| 아이콘 과다 로드 | 성능 저하 | Tree-shaking + Dynamic import map |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- Core Button / Input / Dialog / Card / Badge / Tooltip / Tabs 안정화
- A11y 검사(핵심 6 컴포넌트) 중대 위반 0
수락: Lighthouse A11y Score ≥ 95
M2:
- Theming Hook + Semantic Tokens(alpha)
- Skeleton / Loading 패턴 통일
수락: 토큰 기반 다크/라이트 전환 FCP 영향 < 50ms
M3:
- Storybook + Visual Regression(CI)
- Variant Matrix 자동 문서 생성 스크립트
수락: 주요 컴포넌트 회귀 스냅샷 실패율 < 2%
M4:
- AI Suggestion UI Slot / Presence Indicator Container
수락: 제안 Badge 삽입 시 레이아웃 Shift < 0.05 CLS
M5:
- Token Governance Dashboard (변경 Diff 출력)
수락: 토큰 변경 릴리즈 후 회귀 없음(시각적 테스트 통과)

## 12. 향후 확장 계획 (Future Extensions)
- Motion/Animation Tokens (Duration, Easing, Stagger)
- Density 모드(Compact / Comfortable) 전환
- Theme Package Export (외부 임베드 용)
- Design Token → Figma Sync (API)
- Accessibility Audit Dashboard(자동 스캔 결과 집계)
- Adaptive Color System (사용자 대비 설정 반영)
- Responsive Layout Primitives (Grid System Abstraction)
- Print-friendly Variant (문서 출력)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20