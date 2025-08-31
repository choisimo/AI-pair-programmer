# 콘텐츠 섹션 서비스 (Marketing Sections)

## 목적/역할
- 랜딩 페이지의 마케팅 섹션 컴포넌트 제공 (Hero, Features, Architecture, Roadmap)
- 반응형 그리드 시스템 및 시각적 계층 구조 구현
- 이미지 최적화 및 로딩 성능 관리
- 브랜드 일관성 유지 및 사용자 경험 향상

## 공개 API

### 섹션 컴포넌트
```tsx
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { Architecture } from "@/components/Architecture"
import { Roadmap } from "@/components/Roadmap"
import { CodeDemo } from "@/components/CodeDemo"

// 사용법
<main>
  <Hero />
  <Features />
  <Architecture />
  <Roadmap />
</main>
```

### 이미지 자산
```tsx
// 정적 임포트로 Vite 최적화 활용
import heroImage from "@/assets/hero-image.jpg"
import architectureImage from "@/assets/architecture.jpg"
import analysisImage from "@/assets/ai-analysis.jpg"
```

## 내부 설계

### 섹션 구조 패턴
모든 섹션은 일관된 구조를 따릅니다:

```tsx
export const SectionName = () => {
  return (
    <section className="py-24 px-6 [배경색상]">
      <div className="container mx-auto">
        {/* 헤더 영역 */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="...">
            <Icon className="w-4 h-4 mr-2" />
            섹션 라벨
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            메인 제목
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            설명문
          </p>
        </div>
        
        {/* 콘텐츠 영역 */}
        <div className="grid [반응형 그리드]">
          {/* 섹션별 고유 콘텐츠 */}
        </div>
      </div>
    </section>
  )
}
```

### Features 섹션 데이터 구조
```tsx
const features = [
  {
    icon: RefreshCcw, // Lucide 아이콘
    title: "기능 제목",
    description: "상세 설명",
    badge: "라벨", // 기능 타입
    color: "primary" | "success" | "accent" | "secondary" // 색상 테마
  }
  // ...
]

// 동적 색상 클래스 매핑
const colorClass = {
  primary: "text-primary border-primary/20 bg-primary/5",
  success: "text-success border-success/20 bg-success/5",
  accent: "text-accent border-accent/20 bg-accent/5",
  secondary: "text-secondary border-secondary/20 bg-secondary/5"
}[feature.color]
```

### Architecture 섹션 기술 스택
```tsx
const modules = [
  {
    icon: Eye,
    title: "모듈명",
    description: "간단 설명",
    details: "상세 설명",
    tech: ["기술1", "기술2", "기술3"], // 기술 스택 배열
    color: "primary" | "accent" | "secondary"
  }
  // ...
]
```

### 반응형 그리드 시스템
- **모바일**: `grid-cols-1` (세로 배치)
- **태블릿**: `md:grid-cols-2` (2열)
- **데스크톱**: `lg:grid-cols-3` (3열)
- **대형 화면**: `xl:grid-cols-4` (4열, 필요시)

## 의존성

### UI 컴포넌트
- **shadcn/ui**: Card, Badge, Button 컴포넌트
- **Lucide React**: 아이콘 시스템
- **Tailwind CSS**: 스타일링 및 반응형 그리드

### 자산 관리
- **Vite**: 이미지 정적 임포트 및 최적화
- **이미지 포맷**: JPG (사진), SVG (아이콘), PNG (필요시)

## 예외/에러 처리

### 이미지 최적화 및 접근성
```tsx
// 올바른 이미지 사용 예시
<img 
  src={heroImage} 
  alt="AI 페어 프로그래머 인터페이스" // 의미있는 대체 텍스트
  className="w-full h-auto"
  loading="lazy" // Hero 제외, 나머지는 지연 로딩
  decoding="async"
/>

// Hero 이미지는 LCP 최적화를 위해 eager loading
<img 
  src={heroImage}
  alt="..."
  loading="eager" // Above-the-fold는 즉시 로딩
  decoding="sync"
/>
```

### 빈 데이터 처리
```tsx
// 기능 목록이 비어있을 때 처리
const features = featuresData || []

return (
  <div className="grid md:grid-cols-2 gap-8">
    {features.length > 0 ? (
      features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))
    ) : (
      <div className="col-span-full text-center py-12">
        <p className="text-muted-foreground">기능 정보를 준비 중입니다.</p>
      </div>
    )}
  </div>
)
```

### 아이콘 컴포넌트 안전 처리
```tsx
// 아이콘이 없을 때 기본값 제공
const IconComponent = feature.icon || (() => null)

return (
  <div className="icon-container">
    {IconComponent && <IconComponent className="w-6 h-6" />}
  </div>
)
```

## 테스트 포인트

### 접근성 테스트
```tsx
describe("섹션 접근성", () => {
  test("시맨틱 구조", () => {
    render(<Features />)
    
    // 섹션 랜드마크 확인
    expect(screen.getByRole("region")).toBeInTheDocument()
    
    // 헤딩 계층 구조
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
    
    // 이미지 대체 텍스트
    const images = screen.getAllByRole("img")
    images.forEach(img => {
      expect(img).toHaveAttribute("alt")
      expect(img.getAttribute("alt")).not.toBe("")
    })
  })
  
  test("키보드 내비게이션", () => {
    render(<Features />)
    
    // 포커스 가능한 요소들 확인
    const buttons = screen.getAllByRole("button")
    const links = screen.getAllByRole("link")
    
    [...buttons, ...links].forEach(element => {
      expect(element).toBeVisible()
      expect(element).not.toHaveAttribute("tabindex", "-1")
    })
  })
})
```

### 반응형 테스트
```tsx
describe("반응형 디자인", () => {
  test("모바일 레이아웃", () => {
    const { container } = render(<Features />)
    
    // 모바일에서 세로 배치 확인
    const grid = container.querySelector(".grid")
    expect(grid).toHaveClass("grid-cols-1")
  })
  
  test("태블릿/데스크톱 레이아웃", () => {
    // viewport 1024px 설정
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    
    const { container } = render(<Features />)
    const grid = container.querySelector(".grid")
    expect(grid).toHaveClass("md:grid-cols-2")
  })
})
```

### 성능 테스트
```tsx
describe("성능 최적화", () => {
  test("이미지 lazy loading", () => {
    render(<Architecture />)
    
    const images = screen.getAllByRole("img")
    const nonHeroImages = images.slice(1) // Hero 제외
    
    nonHeroImages.forEach(img => {
      expect(img).toHaveAttribute("loading", "lazy")
    })
  })
  
  test("LCP 최적화 (Hero 이미지)", () => {
    render(<Hero />)
    
    const heroImage = screen.getByAltText(/AI 페어 프로그래머/)
    expect(heroImage).toHaveAttribute("loading", "eager")
  })
})
```

### 데이터 주입 테스트
```tsx
describe("데이터 주입", () => {
  test("커스텀 features 배열", () => {
    const customFeatures = [
      {
        icon: TestIcon,
        title: "테스트 기능",
        description: "테스트 설명",
        badge: "테스트",
        color: "primary"
      }
    ]
    
    // 향후 props로 데이터 주입 시
    // render(<Features features={customFeatures} />)
    
    expect(screen.getByText("테스트 기능")).toBeInTheDocument()
  })
})
```

## 코드 리뷰 체크리스트

### 접근성
- [ ] 섹션에 적절한 헤딩(h2) 사용
- [ ] 이미지에 의미있는 alt 텍스트 제공
- [ ] 색상만으로 정보 전달하지 않음 (텍스트/아이콘 병행)
- [ ] 충분한 색상 대비 (WCAG AA 기준)

### 성능
- [ ] Hero 이미지는 eager loading, 나머지는 lazy loading
- [ ] 이미지 크기/포맷 최적화 (WebP 고려)
- [ ] 불필요한 리렌더링 방지 (메모이제이션)

### 반응형
- [ ] 모든 브레이크포인트에서 레이아웃 확인
- [ ] 터치 타겟 최소 44px (모바일)
- [ ] 텍스트 가독성 (모바일에서 너무 작지 않음)

### 데이터 구조
- [ ] 하드코딩된 데이터의 외부화 가능성 검토
- [ ] 빈 배열/null 데이터 안전 처리
- [ ] 타입 안전성 (TypeScript 인터페이스)

### 스타일링
- [ ] Tailwind 유틸리티 우선 사용
- [ ] cn() 함수로 조건부 클래스 처리
- [ ] 일관된 색상 토큰 사용 (primary, accent 등)

## 확장 가이드

### CMS 연동 준비
```tsx
// 데이터 구조 인터페이스 정의
interface Feature {
  id: string
  icon: string // 아이콘 이름 또는 URL
  title: string
  description: string
  badge: string
  color: 'primary' | 'success' | 'accent' | 'secondary'
  order: number
}

interface FeaturesProps {
  features?: Feature[]
  title?: string
  description?: string
}

export const Features = ({ features = defaultFeatures, title, description }: FeaturesProps) => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          {/* CMS에서 제공하는 콘텐츠 사용 */}
          <h2 className="text-4xl font-bold mb-6">
            {title || "지능형 개발 동반자"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {description || "기본 설명..."}
          </p>
        </div>
        {/* ... */}
      </div>
    </section>
  )
}
```

### 아이콘 동적 로딩
```tsx
// 아이콘 맵 구성
const iconMap = {
  'refresh-ccw': RefreshCcw,
  'file-text': FileText,
  'search': Search,
  'monitor': Monitor,
  // ... 추가 아이콘
}

const DynamicIcon = ({ iconName, ...props }) => {
  const IconComponent = iconMap[iconName] || (() => null)
  return IconComponent ? <IconComponent {...props} /> : null
}

// 사용
<DynamicIcon iconName={feature.iconName} className="w-6 h-6" />
```

### 다국어화 지원
```tsx
import { useTranslation } from 'react-i18next'

export const Features = () => {
  const { t } = useTranslation()
  
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">
            {t('features.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('features.description')}
          </p>
        </div>
        {/* ... */}
      </div>
    </section>
  )
}
```

### 애니메이션 추가
```tsx
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export const Features = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        {/* ... 헤더 */}
        
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="...">
                {/* 기능 카드 내용 */}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

## 예시/스니펫

### 현재 Features 섹션 분석
```tsx
// src/components/Features.tsx의 핵심 구조
const features = [
  {
    icon: RefreshCcw,
    title: "API 일관성 실시간 검사",
    description: "함수 시그니처 변경 시 모든 호출부의 일관성을 실시간으로 검증...",
    badge: "실시간",
    color: "primary"
  },
  // ... 3개 더
]

export const Features = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        {/* 헤더: Badge + Title + Description */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary/50 text-primary mb-4">
            <Brain className="w-4 h-4 mr-2" />
            핵심 기능
          </Badge>
          {/* ... 제목과 설명 */}
        </div>
        
        {/* 2열 그리드 */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            // 동적 색상 클래스
            const colorClass = {
              primary: "text-primary border-primary/20 bg-primary/5",
              success: "text-success border-success/20 bg-success/5",
              // ...
            }[feature.color]
            
            return (
              <Card className="group hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    {/* 아이콘 + Badge */}
                    <div className={`p-3 rounded-xl border ${colorClass}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary">{feature.badge}</Badge>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* 추가 혜택 섹션 */}
        <div className="mt-16 bg-gradient-to-r from-primary/10...">
          {/* 3열 그리드로 부가 정보 */}
        </div>
      </div>
    </section>
  )
}
```

### 재사용 가능한 섹션 컴포넌트
```tsx
interface SectionHeaderProps {
  badge?: {
    text: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: "outline" | "default"
  }
  title: string
  titleGradient?: boolean
  description: string
  className?: string
}

export function SectionHeader({ 
  badge, 
  title, 
  titleGradient = false, 
  description, 
  className 
}: SectionHeaderProps) {
  return (
    <div className={cn("text-center mb-16", className)}>
      {badge && (
        <Badge variant={badge.variant || "outline"} className="mb-4">
          {badge.icon && <badge.icon className="w-4 h-4 mr-2" />}
          {badge.text}
        </Badge>
      )}
      
      <h2 className="text-4xl font-bold mb-6">
        {titleGradient ? (
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            {title}
          </span>
        ) : (
          title
        )}
      </h2>
      
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
        {description}
      </p>
    </div>
  )
}

// 사용 예시
<SectionHeader
  badge={{
    text: "핵심 기능",
    icon: Brain,
    variant: "outline"
  }}
  title="지능형 개발 동반자"
  titleGradient
  description="AI 페어 프로그래머는 개발자의 작업 흐름을..."
/>
```

### 그리드 카드 컴포넌트
```tsx
interface GridCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: string
  color?: 'primary' | 'success' | 'accent' | 'secondary'
  className?: string
  children?: React.ReactNode
}

export function GridCard({ 
  icon: IconComponent, 
  title, 
  description, 
  badge, 
  color = 'primary', 
  className,
  children
}: GridCardProps) {
  const colorClasses = {
    primary: "text-primary border-primary/20 bg-primary/5",
    success: "text-success border-success/20 bg-success/5",
    accent: "text-accent border-accent/20 bg-accent/5",
    secondary: "text-secondary border-secondary/20 bg-secondary/5"
  }
  
  return (
    <Card className={cn(
      "group hover:shadow-elegant transition-all duration-300",
      "border-border/50 hover:border-primary/30",
      className
    )}>
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "p-3 rounded-xl border group-hover:shadow-glow transition-all duration-300",
            colorClasses[color]
          )}>
            <IconComponent className="w-6 h-6" />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed mb-4">
          {description}
        </CardDescription>
        {children}
      </CardContent>
    </Card>
  )
}

// 사용 예시
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  {items.map((item, index) => (
    <GridCard
      key={index}
      icon={item.icon}
      title={item.title}
      description={item.description}
      badge={item.badge}
      color={item.color}
    >
      {/* 추가 콘텐츠 */}
      <div className="flex flex-wrap gap-2 mt-4">
        {item.tags?.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </GridCard>
  ))}
</div>
```

### 이미지 최적화 컴포넌트
```tsx
interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean // LCP 최적화용
  aspectRatio?: 'square' | 'video' | 'auto'
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  priority = false, 
  aspectRatio = 'auto' 
}: OptimizedImageProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: ""
  }
  
  return (
    <div className={cn(
      "overflow-hidden rounded-lg",
      aspectClasses[aspectRatio],
      className
    )}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
      />
    </div>
  )
}

// 사용 예시
<OptimizedImage
  src={architectureImage}
  alt="시스템 아키텍처 다이어그램"
  aspectRatio="video"
  priority={false}
  className="border border-border/50 shadow-sm"
/>
```

## 성능 최적화

### 이미지 최적화 전략
```tsx
// 반응형 이미지 (향후 구현)
<picture>
  <source 
    media="(max-width: 768px)" 
    srcSet="hero-mobile.webp" 
    type="image/webp" 
  />
  <source 
    media="(max-width: 768px)" 
    srcSet="hero-mobile.jpg" 
    type="image/jpeg" 
  />
  <source 
    srcSet="hero-desktop.webp" 
    type="image/webp" 
  />
  <img 
    src="hero-desktop.jpg" 
    alt="AI 페어 프로그래머" 
    loading="eager"
    className="w-full h-auto"
  />
</picture>
```

### 컴포넌트 메모이제이션
```tsx
import { memo, useMemo } from 'react'

export const Features = memo(() => {
  // 정적 데이터이므로 메모이제이션으로 최적화
  const memoizedFeatures = useMemo(() => features, [])
  
  return (
    <section className="py-24 px-6">
      {/* ... */}
      <div className="grid md:grid-cols-2 gap-8">
        {memoizedFeatures.map((feature, index) => (
          <MemoizedFeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  )
})

const MemoizedFeatureCard = memo(({ icon, title, description, badge, color }) => {
  // 색상 클래스 계산 메모이제이션
  const colorClass = useMemo(() => ({
    primary: "text-primary border-primary/20 bg-primary/5",
    success: "text-success border-success/20 bg-success/5",
    // ...
  })[color], [color])
  
  return (
    <Card className="group hover:shadow-elegant transition-all duration-300">
      {/* ... */}
    </Card>
  )
})
```

### 지연 로딩 섹션
```tsx
import { lazy, Suspense } from 'react'

// 비필수 섹션들은 지연 로딩
const Architecture = lazy(() => import('@/components/Architecture'))
const Roadmap = lazy(() => import('@/components/Roadmap'))

// 섹션별 스켈레톤
function SectionSkeleton() {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="h-6 w-24 bg-muted rounded mx-auto mb-4" />
          <div className="h-8 w-64 bg-muted rounded mx-auto mb-6" />
          <div className="h-4 w-96 bg-muted rounded mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  )
}

// 앱에서 사용
export default function App() {
  return (
    <main>
      <Hero /> {/* 즉시 로딩 */}
      <Features /> {/* 즉시 로딩 */}
      
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

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- Hero, Features, Architecture 섹션 분석
- 반응형 그리드 시스템 정의

### v1.1 (계획)
- CMS 연동 준비를 위한 props 기반 설계
- 애니메이션 라이브러리 도입 (Framer Motion)
- 이미지 최적화 (WebP, 반응형 이미지)