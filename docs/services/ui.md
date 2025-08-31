# 디자인 시스템 서비스 (UI Components)

## 목적/역할
- shadcn/ui 기반 재사용 가능한 컴포넌트 제공
- 프로젝트 전반에 걸친 일관된 스타일 및 인터랙션 유지
- Radix UI의 접근성 기능을 활용한 사용자 친화적 인터페이스 구현

## 공개 API

### 컴포넌트 임포트
```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
// ... 기타 모든 shadcn/ui 컴포넌트
```

### 유틸리티
```tsx
import { cn } from "@/lib/utils"
```

## 내부 설계

### 컴포넌트 구조
- **기본 패턴**: Radix UI primitives + class-variance-authority + Tailwind
- **변형 관리**: `cva`를 사용한 variant/size 시스템
- **타입 안전성**: `VariantProps`로 variant/size를 union 타입으로 제한
- **접근성**: Radix UI의 내장 접근성 기능 활용

### 스타일 토큰 관리
- **색상/간격**: `tailwind.config.ts`의 theme 확장 사용
- **다크모드**: CSS 변수 기반 토큰 시스템
- **일관성**: shadcn/ui 기본 디자인 토큰 준수

### 예시: Button 컴포넌트 분석
```tsx
// src/components/ui/button.tsx 참조
const buttonVariants = cva(
  // 기본 클래스
  "inline-flex items-center justify-center gap-2 whitespace-nowrap...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground...",
        outline: "border border-input bg-background hover:bg-accent...",
        // ... 기타 variant
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

## 의존성

### 핵심 의존성
- **shadcn/ui**: 컴포넌트 기본 구조
- **Radix UI**: 접근성 primitives
- **class-variance-authority**: variant 시스템
- **tailwind-merge**: 클래스 충돌 해결
- **clsx**: 조건부 클래스 적용

### 개발 의존성
- **Tailwind CSS**: 스타일링 시스템
- **TypeScript**: 타입 안전성

## 예외/에러 처리

### 접근성 보장
```tsx
// disabled 상태 처리
<Button disabled aria-busy="true">
  Loading...
</Button>

// 스크린리더 지원
<Button aria-label="메뉴 열기">
  <MenuIcon />
</Button>
```

### 타입 안전성
```tsx
// variant 오타 방지 - 컴파일 타임 에러
<Button variant="primary" /> // ❌ 'primary'는 존재하지 않음
<Button variant="default" /> // ✅ 올바른 variant
```

### 로딩/비활성화 상태
```tsx
// 로딩 상태 표시
<Button disabled className="opacity-50 cursor-not-allowed">
  <Spinner className="mr-2" />
  처리중...
</Button>
```

## 테스트 포인트

### 접근성 테스트
- **키보드 내비게이션**: Tab, Enter, Space 키 동작
- **스크린리더**: aria-label, role 속성 확인
- **포커스 관리**: focus-visible, focus-within 스타일
- **색상 대비**: WCAG 2.1 AA 기준 준수

### 시각적 테스트
```tsx
// variant 및 size 조합 테스트
<Button variant="default" size="sm">Small Default</Button>
<Button variant="outline" size="lg">Large Outline</Button>
<Button variant="destructive" size="icon"><TrashIcon /></Button>
```

### 인터랙션 테스트
```tsx
// 클릭 이벤트 처리
<Button onClick={() => toast({ title: "클릭됨" })}>
  테스트 버튼
</Button>

// 비활성화 상태에서 클릭 방지
<Button disabled onClick={() => console.log("실행되지 않음")}>
  비활성화됨
</Button>
```

### Toast 시스템 테스트
```tsx
// 큐잉 동작 확인
const showMultipleToasts = () => {
  toast({ title: "첫 번째 알림" })
  toast({ title: "두 번째 알림" })
  toast({ title: "세 번째 알림" })
}

// 자동 dismiss 타이밍
toast({ 
  title: "자동 사라짐", 
  description: "5초 후 자동으로 사라집니다" 
})
```

## 코드 리뷰 체크리스트

### 타입 안전성
- [ ] variant/size 타입이 union으로 제한되어 있는가?
- [ ] Props 인터페이스가 명시적으로 정의되어 있는가?
- [ ] `any` 타입 사용을 피했는가?

### 스타일링
- [ ] `cn` 유틸을 사용하여 클래스를 병합했는가?
- [ ] Tailwind 유틸리티 클래스를 우선 사용했는가?
- [ ] 커스텀 CSS 대신 variant 시스템을 활용했는가?

### 접근성
- [ ] aria-label, role 등 접근성 속성이 전달되는가?
- [ ] 키보드 포커스 스타일이 적용되어 있는가?
- [ ] 비활성화 상태가 명확히 표시되는가?

### 컴포넌트 설계
- [ ] 프레젠테이션과 비즈니스 로직이 분리되어 있는가?
- [ ] forwardRef를 사용하여 ref가 전달되는가?
- [ ] displayName이 설정되어 있는가?

### 성능
- [ ] 불필요한 리렌더링이 발생하지 않는가?
- [ ] 메모이제이션이 필요한 부분에 적용되었는가?

## 확장 가이드

### 새로운 컴포넌트 추가
1. **shadcn/ui 설치**: `npx shadcn@latest add [component-name]`
2. **커스터마이징**: variant/size 추가 또는 수정
3. **타입 정의**: Props 인터페이스 확장
4. **문서화**: JSDoc 주석 추가

```tsx
// 새로운 variant 추가 예시
const buttonVariants = cva(
  "...", // 기본 클래스
  {
    variants: {
      variant: {
        // 기존 variants...
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
        glass: "backdrop-blur-sm bg-white/10 border border-white/20",
      },
      // ...
    }
  }
)
```

### 다크모드 지원
- **토큰 기반**: CSS 변수를 통한 색상 관리
- **자동 전환**: `tailwind.config.ts`의 `darkMode: "class"` 활용
- **컴포넌트별 대응**: 각 variant에 다크모드 고려사항 반영

### 테마 커스터마이징
```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // 브랜드 색상 추가
        brand: {
          50: "#eff6ff",
          500: "#3b82f6",
          900: "#1e3a8a",
        }
      }
    }
  }
}
```

## 예시/스니펫

### 기본 사용법
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ProductCard({ product, className }) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{product.description}</p>
        <div className="flex gap-2 mt-4">
          <Button size="sm">구매하기</Button>
          <Button variant="outline" size="sm">위시리스트</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 복합 컴포넌트 패턴
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function ConfirmDialog({ children, onConfirm, title, description }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline">취소</Button>
          <Button variant="destructive" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 커스텀 훅과 조합
```tsx
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

export function ResponsiveActions() {
  const isMobile = useMobile()
  
  const handleAction = () => {
    toast({ 
      title: "작업 완료", 
      description: "성공적으로 처리되었습니다." 
    })
  }

  return (
    <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-row")}>
      <Button size={isMobile ? "default" : "sm"} onClick={handleAction}>
        주요 작업
      </Button>
      <Button variant="outline" size={isMobile ? "default" : "sm"}>
        보조 작업
      </Button>
    </div>
  )
}
```

## 성능 최적화

### 메모이제이션
```tsx
import { memo, useMemo } from "react"
import { Button } from "@/components/ui/button"

export const OptimizedButton = memo(({ 
  variant, 
  size, 
  children, 
  isLoading,
  ...props 
}) => {
  const buttonContent = useMemo(() => {
    if (isLoading) {
      return (
        <>
          <Spinner className="mr-2 h-4 w-4 animate-spin" />
          처리중...
        </>
      )
    }
    return children
  }, [isLoading, children])

  return (
    <Button variant={variant} size={size} disabled={isLoading} {...props}>
      {buttonContent}
    </Button>
  )
})
```

### 지연 로딩
```tsx
import { lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"

const HeavyDialog = lazy(() => import("./HeavyDialog"))

export function LazyDialogTrigger() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        다이얼로그 열기
      </Button>
      {isOpen && (
        <Suspense fallback={<div>로딩중...</div>}>
          <HeavyDialog onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- 기본 컴포넌트 API 정의
- 코드 리뷰 체크리스트 수립

### v1.1 (예정)
- 성능 최적화 가이드 추가
- 커스텀 variant 생성 가이드
- 테스트 케이스 확장