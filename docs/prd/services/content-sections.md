# Content Sections Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
Content Sections 서비스는 마케팅/온보딩 맥락에서 Hero, Features, Architecture, CodeDemo, Roadmap 등 랜딩/프로덕트 소개 섹션을 재사용 가능한 구조(Section Pattern)와 데이터 주입(Headless) 가능 설계로 통합한다.  
Phase 1: 정적 하드코딩 데이터 기반(현재 구현) → 공통 레이아웃/접근성/이미지 최적화 패턴 정리.  
Phase 2: CMS/데이터 소스 연결(props 기반 주입), 다국어(i18n) 문자열 키 지원, 애니메이션/지연 로딩 전략 도입.  
Phase 3+: AB 테스트/퍼스널라이제이션(Feature Flag & Telemetry 기반 가중 로테이션), 실시간 업데이트(실험 배포) 확장.

## 2. 범위 제외 사항 (Out of Scope)
- 복잡한 대시보드/제품 내부 기능 영역(애플리케이션 운영 화면)
- CMS 자체 구축(Headless CMS 외부 연동)
- 실시간 협업 주석/주기적 에디트(Realtime Collaboration 범위)
- Search/Index 기능
- 동영상 스트리밍 플레이어(외부 위젯 활용)

## 3. 현재 상태 (Current State)
- Hero / Features / Architecture / Roadmap / CodeDemo 컴포넌트 존재
- 하드코딩된 배열(features 등) + 정적 이미지 import
- 반응형 그리드 규칙(Tailwind) 수동 적용
- 이미지 WebP 변환/Responsive srcset 미구현
- 다국어/동적 데이터 주입 props 미정
- 접근성 테스트(Axe) 자동화 없음
- Skeleton/Loading 상태 불필요(정적) → 동적화 시 필요

## 4. 기능 요구사항 (Functional Requirements)
FR-1: 모든 섹션 컴포넌트는 공통 SectionContainer / SectionHeader 추상화 사용  
FR-2: SectionHeader: badge(icon?, text), title, description, alignment, maxWidth 옵션  
FR-3: Features / Architecture 데이터는 props(features?: FeatureItem[])로 외부 주입 가능 (없을 시 기본값)  
FR-4: 이미지 컴포넌트 OptimizedImage: eager(Above-the-fold) / lazy(Else) 전략 + aspectRatio 지원  
FR-5: Light/Dark 모드 배경 대비 규칙 (gradient/overlay) 제공  
FR-6: 섹션 간 Vertical Rhythm(상하 패딩 규격: base 24 → md 32 → lg 48) 통일  
FR-7: i18n 적용 시 문자열은 translation key 기반 (fallback 한국어)  
FR-8: 애니메이션(Phase 2) framer-motion variants: section → stagger children 0.1s  
FR-9: Telemetry(Phase 2): 섹션 viewport 50% 이상 진입 시 impression 이벤트 1회 송신  
FR-10: Feature Card Hover 포커스 상태 키보드 접근(Enter/Space) 동일 시각 효과  
FR-11: 빈 데이터(0개)시 Graceful Empty UI (“콘텐츠 준비 중”) 노출  
FR-12: Roadmap 항목은 status(built/in-progress/planned) 뱃지 표준 variant 사용  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- Above-the-fold(Hero) LCP 이미지 preload 및 eager → LCP 목표 2.5s 이하(정적 호스팅 기준)
- 나머지 섹션 이미지 lazy + decoding="async" → 총 이미지 네트워크 전송량 30% 이상 감소 (Phase 2)
접근성:
- 모든 heading 계층(H1 → 섹션 H2) 논리 순서
- 카드 hover-only 정보 없음 (아이콘+텍스트 병행)
신뢰성:
- props 누락 시 타입 안전 기본값 반환
국제화:
- 다국어 도입 후 미번역 키 0 (fallback 로그)
관찰성:
- impression 이벤트 중복 송신률 < 3% (세션 단위 dedupe)
유지보수성:
- Feature/Architecture 데이터 스키마 단일 Type 정의
브랜딩 일관성:
- 색상 토큰(primary/accent/secondary) 외 직접 hex 하드코딩 금지
보안:
- 외부 이미지 도입 시 URL 허용 리스트(Phase 2)

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 SectionHeader Props
```ts
interface SectionHeaderProps {
  badge?: { text: string; icon?: React.ComponentType<{ className?: string }>; variant?: 'outline'|'secondary' }
  title: string
  description?: string
  align?: 'center' | 'start'
  gradientTitle?: boolean
  className?: string
}
```
### 6.2 FeatureItem / ArchitectureItem
```ts
interface FeatureItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: string
  color?: 'primary'|'success'|'accent'|'secondary'
  tags?: string[]
}

interface ArchitectureItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  details?: string
  tech?: string[]
  color?: 'primary'|'accent'|'secondary'
}
```
### 6.3 OptimizedImage Props
```ts
interface OptimizedImageProps {
  src: string
  alt: string
  priority?: boolean
  aspectRatio?: 'auto'|'square'|'video'
  className?: string
  sizes?: string // responsive sizes attribute
}
```
### 6.4 Telemetry Hook (Phase 2)
```ts
function useSectionImpression(sectionId: string) {
  // IntersectionObserver 50% threshold → emit('section_impression', { sectionId })
}
```
### 6.5 Data Injection (CMS Ready)
```ts
interface FeaturesSectionProps {
  items?: FeatureItem[]
  header?: Partial<SectionHeaderProps>
  onCardClick?: (item: FeatureItem) => void
}
```

## 7. 데이터 모델 (Data Model)
- SectionRegistry(id, type, order, enabled, createdAt, updatedAt)
- FeatureRecord(id, title, description, color, badge, tags[], order)
- ArchitectureRecord(id, title, description, details, tech[], color, order)
- RoadmapEntry(id, quarter, title, status, order)
- ImpressionEvent(id, sectionId, userId?, timestamp)
인덱스:
- FeatureRecord(order)
- RoadmapEntry(quarter + order)
- ImpressionEvent(sectionId + timestamp)
보존:
- ImpressionEvent 90일(집계 후 요약)
Derived Metrics:
- section_view_rate, feature_card_click_rate

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 초기 렌더 (정적)
1. 섹션 컴포넌트 import  
2. Hero eager 이미지 로드  
3. Features/Architecture 정적 배열 렌더  
4. Roadmap 상태 색상 토큰 반영  
### 8.2 데이터 동적 로드 (Phase 2)
1. CMS fetch → items 주입  
2. 로딩 중 Skeleton Grid 표시  
3. 빈 배열 → Empty State  
4. i18n 키 변환 후 표시  
### 8.3 Impression 추적
1. useSectionImpression Hook attach  
2. 첫 50% viewport 진입 -> 이벤트 송신 & local state dedupe  
3. Telemetry 집계 (방문당 unique)  
### 8.4 Card 상호작용
1. 키보드 포커스 → Enter → onCardClick 호출  
2. hover/ focus 동일 스타일  
3. 클릭 이벤트 Telemetry(feature_card_click)  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- UI Foundation (Badge, Card, Typography, cn)
- Build & Environment (이미지 경로/압축 전략)
Downstream:
- Telemetry & Observability (impression/click)
- Performance Optimization (lazy, prefetch)
- Internationalization (문자열 키 변환)
- Notification & Feedback (선택적 강조/배지 안내)
Cross:
- Core AI Engine (Architecture 시각 노출)
외부:
- framer-motion (애니메이션)
- IntersectionObserver (브라우저 API)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 이미지 LCP 지연 | 초기 이탈 | preload + 적절한 해상도 + WebP |
| i18n 번역 누락 | UI 불완전 | fallback 로그 + 빌드 시 키 검증 |
| 애니메이션 과다 | 성능/가독성 저하 | reduce-motion 설정 존중 |
| 데이터 비어있음 | 어색한 레이아웃 | Empty State 컴포넌트 |
| 카드 포커스 스타일 누락 | 접근성 저하 | focus-visible 강제 스타일 |
| 과도한 IntersectionObserver | 메모리/성능 | 단일 관리자 패턴 (observer registry) |
| 컬러 대비 낮음 | 접근성 실패 | WCAG 대비 자동 테스트 |
| 하드코딩 문자열 증가 | 다국어 확장 비용 | lint rule (raw string detect) |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- SectionHeader / OptimizedImage / Features 리팩터
- Hero LCP 최적화
수락: Lighthouse LCP ≤ 2.5s, A11y Score ≥ 95  
M2:
- CMS-ready props + Empty/Skeleton 상태
- Impression Hook
수락: CMS mock 주입 시 코드 수정 ≤ 5줄  
M3:
- i18n 키 통합 + framer-motion 애니메이션
수락: reduce-motion 시 애니메이션 비활성  
M4:
- Roadmap 동적 데이터 + Telemetry 클릭율 측정
수락: 클릭 이벤트 누락 < 1% (세션 로그)  
M5:
- AB 테스트(Variant A/B Section 차등)
수락: 실험 전환 구성 toggle 후 재배포 없이 반영  

## 12. 향후 확장 계획 (Future Extensions)
- Dynamic Personalization (사용자 역할/역할별 섹션 순서 조정)
- Server Components(향후 Next.js 전환 고려) 버전
- Progressive Image(LQIP / Blur-up)
- Section Composition Schema(JSON → 자동 렌더)
- Scroll-driven Animation (performance budget 내)
- AI Generated Micro Copy (Experiment)
- Real-time Roadmap 업데이트 (WebSocket Feed)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20