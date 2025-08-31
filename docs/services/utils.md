# 유틸리티 서비스 (Utils Service)

## 목적/역할
- 프로젝트 전반에서 사용되는 공통 헬퍼 함수 제공
- Tailwind CSS 클래스 조건부 병합 및 충돌 해결
- 타입 안전성을 고려한 유틸리티 함수 구현
- 코드 재사용성 극대화 및 중복 로직 제거

## 공개 API

### 클래스 병합 유틸리티
```tsx
import { cn } from "@/lib/utils"

// 기본 사용법
cn("base-class", condition && "conditional-class")

// 복잡한 조건부 클래스
cn(
  "flex items-center",
  isActive && "bg-primary text-primary-foreground", 
  isDisabled && "opacity-50 cursor-not-allowed",
  className // 외부에서 전달받은 클래스
)
```

### 타입 정의
```tsx
import type { ClassValue } from "clsx"

// cn 함수 시그니처
function cn(...inputs: ClassValue[]): string
```

## 내부 설계

### 핵심 구현
```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 작동 원리
1. **clsx**: 조건부 클래스명 처리 및 배열/객체 입력 정규화
2. **tailwind-merge**: Tailwind 클래스 충돌 감지 및 마지막 값 우선 적용
3. **조합**: 개발자 편의성 + Tailwind 최적화 동시 제공

### 처리 과정 예시
```tsx
// 입력
cn("px-4", "px-6", isActive && "bg-blue-500", { "text-white": isActive })

// clsx 결과 (조건부 처리)
"px-4 px-6 bg-blue-500 text-white"

// twMerge 결과 (충돌 해결)
"px-6 bg-blue-500 text-white" // px-4가 px-6으로 덮어쓰기됨
```

## 의존성

### 핵심 의존성
- **clsx**: 조건부 클래스명 유틸리티
- **tailwind-merge**: Tailwind 클래스 충돌 해결
- **class-variance-authority**: shadcn/ui 컴포넌트에서 간접 사용

### 개발 의존성
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 클래스명 규칙 정의

## 예외/에러 처리

### Falsy 값 안전 처리
```tsx
// clsx가 자동으로 falsy 값 필터링
cn(
  "base-class",
  null,           // 무시됨
  undefined,      // 무시됨  
  false,          // 무시됨
  "",            // 무시됨
  0,             // 무시됨
  "valid-class"  // 적용됨
)
// 결과: "base-class valid-class"
```

### 타입 안전성
```tsx
// ClassValue 타입으로 다양한 입력 지원
cn(
  "string-class",                    // string
  ["array", "of", "classes"],       // string[]
  { "conditional": isTrue },         // Record<string, boolean>
  condition && "conditional-string", // string | false
  variableClass                      // string | undefined
)
```

### 무효한 클래스명 처리
```tsx
// Tailwind 설정에 없는 클래스는 그대로 유지
cn("valid-tailwind-class", "custom-css-class")
// twMerge는 Tailwind 클래스만 병합, 커스텀 클래스는 보존
```

## 테스트 포인트

### 기본 병합 테스트
```tsx
describe("cn 함수", () => {
  test("기본 클래스 병합", () => {
    expect(cn("class1", "class2")).toBe("class1 class2")
  })
  
  test("조건부 클래스 처리", () => {
    expect(cn("base", true && "conditional")).toBe("base conditional")
    expect(cn("base", false && "conditional")).toBe("base")
  })
  
  test("객체 형태 입력", () => {
    expect(cn({ "class1": true, "class2": false })).toBe("class1")
  })
  
  test("배열 입력", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2")
  })
})
```

### Tailwind 충돌 해결 테스트
```tsx
describe("Tailwind 클래스 충돌 처리", () => {
  test("패딩 충돌 해결", () => {
    expect(cn("p-4", "p-6")).toBe("p-6")
    expect(cn("px-2", "px-4", "py-3")).toBe("px-4 py-3")
  })
  
  test("색상 충돌 해결", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500")
    expect(cn("text-gray-600", "text-white")).toBe("text-white")
  })
  
  test("반응형 충돌 해결", () => {
    expect(cn("md:p-4", "md:p-6")).toBe("md:p-6")
    expect(cn("sm:text-sm", "md:text-base", "sm:text-lg")).toBe("sm:text-lg md:text-base")
  })
})
```

### 복합 시나리오 테스트
```tsx
describe("복합 사용 시나리오", () => {
  test("컴포넌트 기본 클래스와 props 병합", () => {
    const baseClasses = "flex items-center justify-center"
    const propsClasses = "bg-primary text-white"
    const conditionalClasses = true && "hover:bg-primary/90"
    
    const result = cn(baseClasses, propsClasses, conditionalClasses)
    expect(result).toBe("flex items-center justify-center bg-primary text-white hover:bg-primary/90")
  })
  
  test("variant 클래스와 커스텀 클래스 병합", () => {
    const variantClasses = "bg-primary text-primary-foreground px-4 py-2"
    const customClasses = "bg-secondary px-6" // 일부 충돌
    
    const result = cn(variantClasses, customClasses)
    expect(result).toBe("text-primary-foreground py-2 bg-secondary px-6")
  })
})
```

### 성능 테스트
```tsx
describe("성능", () => {
  test("대량 클래스 처리", () => {
    const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`)
    const start = performance.now()
    cn(...manyClasses)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(10) // 10ms 이내
  })
  
  test("복잡한 조건부 클래스", () => {
    const conditions = Array.from({ length: 50 }, (_, i) => i % 2 === 0)
    const classes = conditions.map((condition, i) => condition && `conditional-${i}`)
    
    expect(() => cn(...classes)).not.toThrow()
  })
})
```

## 코드 리뷰 체크리스트

### 사용법 검증
- [ ] cn() 함수를 일관되게 사용하고 있는가?
- [ ] 문자열 연결 대신 cn() 사용하는가?
- [ ] 조건부 클래스에 적절히 활용하는가?

### 성능 고려사항
- [ ] 불필요한 cn() 호출이 많지 않은가?
- [ ] 정적 클래스는 컴파일 타임에 최적화 가능한가?
- [ ] 거대한 배열이나 객체를 전달하고 있지 않은가?

### 타입 안전성
- [ ] ClassValue 타입을 올바르게 활용하는가?
- [ ] 조건부 클래스에서 올바른 타입 가드 사용?

### 코드 가독성
- [ ] 복잡한 cn() 호출이 적절히 분리되어 있는가?
- [ ] 의미있는 변수명으로 클래스 그룹 분리?

## 확장 가이드

### 추가 유틸리티 함수
```tsx
// src/lib/utils.ts 확장

// 조건부 props 헬퍼
export function conditionalProps<T extends Record<string, any>>(
  condition: boolean,
  props: T
): T | {} {
  return condition ? props : {}
}

// 사용 예시
<div 
  {...conditionalProps(isInteractive, {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    tabIndex: 0
  })}
/>

// 스타일 객체를 클래스명으로 변환
export function styleToClass(styles: Record<string, string | number>): string {
  return Object.entries(styles)
    .map(([property, value]) => {
      // CSS 속성을 Tailwind 클래스로 매핑 (부분 구현 예시)
      if (property === 'marginTop') return `mt-[${value}px]`
      if (property === 'padding') return `p-[${value}px]`
      // ... 추가 매핑
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

// 반응형 클래스 헬퍼
export function responsive(
  base: string,
  breakpoints: Partial<Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string>>
): string {
  return cn(
    base,
    breakpoints.sm && `sm:${breakpoints.sm}`,
    breakpoints.md && `md:${breakpoints.md}`,
    breakpoints.lg && `lg:${breakpoints.lg}`,
    breakpoints.xl && `xl:${breakpoints.xl}`,
    breakpoints['2xl'] && `2xl:${breakpoints['2xl']}`
  )
}

// 사용 예시
const responsiveText = responsive('text-base', {
  sm: 'text-sm',
  md: 'text-lg', 
  lg: 'text-xl'
})
```

### 테마 기반 클래스 헬퍼
```tsx
// 테마 변수 기반 클래스 생성
export function themeClass(
  base: string,
  theme: 'light' | 'dark' | 'auto' = 'auto'
): string {
  const themeClasses = {
    light: 'light',
    dark: 'dark',
    auto: '' // 시스템 기본값 사용
  }
  
  return cn(base, themeClasses[theme])
}

// 색상 팔레트 헬퍼
type ColorVariant = 'primary' | 'secondary' | 'accent' | 'destructive'
type ColorShade = '50' | '100' | '500' | '600' | '900'

export function colorClass(
  variant: ColorVariant,
  type: 'bg' | 'text' | 'border' = 'bg',
  shade: ColorShade = '500'
): string {
  return `${type}-${variant}-${shade}`
}

// 사용 예시
const buttonClass = cn(
  "px-4 py-2 rounded-md",
  colorClass('primary', 'bg'),
  colorClass('primary', 'text', '50'),
  "hover:" + colorClass('primary', 'bg', '600')
)
```

### 커스텀 Tailwind 클래스 병합 규칙
```tsx
// tailwind-merge 설정 확장
import { extendTailwindMerge } from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // 커스텀 간격 클래스
      'font-size': [{ text: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'] }],
      // 커스텀 색상 클래스
      'text-color': [{ text: ['brand-primary', 'brand-secondary'] }],
      // 커스텀 그림자 클래스
      'box-shadow': [{ shadow: ['glow', 'elegant'] }],
    },
    conflictingClassGroups: {
      'font-size': ['text-color'], // 예시: 폰트 크기와 색상이 충돌할 때
    }
  }
})

export function cnCustom(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
```

### 성능 최적화된 클래스 캐싱
```tsx
// 자주 사용되는 클래스 조합 캐싱
const classCache = new Map<string, string>()

export function cnCached(...inputs: ClassValue[]): string {
  const key = JSON.stringify(inputs)
  
  if (classCache.has(key)) {
    return classCache.get(key)!
  }
  
  const result = cn(...inputs)
  classCache.set(key, result)
  
  // 캐시 크기 제한
  if (classCache.size > 1000) {
    const firstKey = classCache.keys().next().value
    classCache.delete(firstKey)
  }
  
  return result
}

// 컴포넌트에서 사용
const MyComponent = ({ variant, size, className }) => {
  // 정적 클래스는 캐싱 효과 극대화
  const baseClasses = cnCached(
    "flex items-center justify-center rounded-md",
    variantClasses[variant],
    sizeClasses[size],
    className
  )
  
  return <div className={baseClasses}>...</div>
}
```

## 예시/스니펫

### 컴포넌트에서의 활용
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CustomButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  className?: string
  children: React.ReactNode
}

export function CustomButton({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className, 
  children,
  ...props 
}: CustomButtonProps) {
  return (
    <Button
      className={cn(
        // 기본 스타일
        "font-medium transition-colors",
        
        // variant별 스타일
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === 'primary',
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === 'secondary',
          "border border-input bg-background hover:bg-accent": variant === 'outline'
        },
        
        // size별 스타일  
        {
          "h-8 px-3 text-sm": size === 'sm',
          "h-10 px-4": size === 'md', 
          "h-12 px-6 text-lg": size === 'lg'
        },
        
        // 상태별 스타일
        isLoading && "opacity-50 cursor-not-allowed",
        
        // 외부에서 전달된 커스텀 클래스
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          로딩중...
        </div>
      ) : (
        children
      )}
    </Button>
  )
}
```

### 동적 그리드 시스템
```tsx
import { cn } from "@/lib/utils"

interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg'
  responsive?: boolean
  className?: string
  children: React.ReactNode
}

export function Grid({ 
  cols = 1, 
  gap = 'md', 
  responsive = true, 
  className, 
  children 
}: GridProps) {
  return (
    <div className={cn(
      "grid",
      
      // 컬럼 수
      {
        "grid-cols-1": cols === 1,
        "grid-cols-2": cols === 2,
        "grid-cols-3": cols === 3,
        "grid-cols-4": cols === 4,
        "grid-cols-6": cols === 6,
        "grid-cols-12": cols === 12
      },
      
      // 반응형 처리
      responsive && {
        "md:grid-cols-2": cols >= 2,
        "lg:grid-cols-3": cols >= 3,
        "xl:grid-cols-4": cols >= 4
      },
      
      // 간격
      {
        "gap-2": gap === 'sm',
        "gap-4": gap === 'md', 
        "gap-6": gap === 'lg'
      },
      
      className
    )}>
      {children}
    </div>
  )
}

// 사용 예시
<Grid cols={3} gap="lg" responsive>
  <div>아이템 1</div>
  <div>아이템 2</div>
  <div>아이템 3</div>
</Grid>
```

### 조건부 애니메이션
```tsx
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface AnimatedCardProps {
  isVisible?: boolean
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
  children: React.ReactNode
}

export function AnimatedCard({ 
  isVisible = true, 
  delay = 0, 
  direction = 'up', 
  className, 
  children 
}: AnimatedCardProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(isVisible)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [isVisible, delay])
  
  return (
    <div 
      className={cn(
        "transition-all duration-500 ease-out",
        
        // 초기 상태 (애니메이션 전)
        !shouldAnimate && [
          "opacity-0",
          {
            "translate-y-4": direction === 'up',
            "-translate-y-4": direction === 'down',
            "translate-x-4": direction === 'left',
            "-translate-x-4": direction === 'right'
          }
        ],
        
        // 최종 상태 (애니메이션 후)
        shouldAnimate && "opacity-100 translate-x-0 translate-y-0",
        
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
```

### 테마 기반 스타일링
```tsx
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"

interface ThemedCardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  className?: string
  children: React.ReactNode
}

export function ThemedCard({ variant = 'default', className, children }: ThemedCardProps) {
  const { theme } = useTheme()
  
  return (
    <div className={cn(
      "rounded-lg p-6 transition-colors",
      
      // 베이스 스타일
      "bg-card text-card-foreground",
      
      // variant별 스타일
      {
        "border": variant === 'outlined',
        "shadow-lg": variant === 'elevated',
        "shadow-sm border": variant === 'default'
      },
      
      // 테마별 추가 스타일
      theme === 'dark' && {
        "border-border/50": variant !== 'default',
        "shadow-black/20": variant === 'elevated'
      },
      
      theme === 'light' && {
        "border-border": variant !== 'default', 
        "shadow-gray-200/50": variant === 'elevated'
      },
      
      className
    )}>
      {children}
    </div>
  )
}
```

## 성능 최적화

### 컴파일 타임 최적화
```tsx
// 정적 클래스 상수화 (권장)
const BUTTON_BASE = "inline-flex items-center justify-center rounded-md font-medium"
const BUTTON_VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
} as const

// 런타임에서 최적화
function optimizedCn(baseClass: string, ...conditionals: ClassValue[]) {
  if (conditionals.length === 0) return baseClass
  return cn(baseClass, ...conditionals)
}
```

### 메모이제이션 패턴
```tsx
import { useMemo } from "react"

function ExpensiveComponent({ variant, size, isActive, className }) {
  // 복잡한 클래스 계산을 메모이제이션
  const computedClassName = useMemo(() => {
    return cn(
      BASE_CLASSES,
      VARIANT_MAP[variant],
      SIZE_MAP[size],
      isActive && ACTIVE_CLASSES,
      className
    )
  }, [variant, size, isActive, className])
  
  return <div className={computedClassName}>...</div>
}
```

### 조건부 렌더링 최적화
```tsx
// 조건이 복잡할 때는 미리 계산
function ComplexComponent({ status, priority, user, ...props }) {
  const statusClasses = useMemo(() => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800', 
      'rejected': 'bg-red-100 text-red-800'
    }
    return statusMap[status] || ''
  }, [status])
  
  const priorityClasses = useMemo(() => {
    return priority === 'high' ? 'border-l-4 border-red-500' : ''
  }, [priority])
  
  const userRoleClasses = useMemo(() => {
    return user.role === 'admin' ? 'ring-2 ring-blue-500' : ''
  }, [user.role])
  
  return (
    <div className={cn(
      "p-4 rounded-lg",
      statusClasses,
      priorityClasses, 
      userRoleClasses,
      props.className
    )}>
      {/* 컴포넌트 내용 */}
    </div>
  )
}
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- cn() 함수 구현 및 사용법 정의
- clsx + tailwind-merge 조합 분석

### v1.1 (계획)
- 성능 최적화 유틸리티 추가
- 커스텀 Tailwind 클래스 지원 확장
- 테마 기반 클래스 헬퍼 구현