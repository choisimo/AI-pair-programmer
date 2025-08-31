# 훅 서비스 (Hooks Service)

## 목적/역할
- 공통 브라우저 시그널 및 상태 로직 추상화
- 반응형 디자인을 위한 브레이크포인트 감지
- 재사용 가능한 비즈니스 로직 캡슐화
- 컴포넌트 간 상태 공유 및 동기화

## 공개 API

### 모바일 감지 훅
```tsx
import { useIsMobile } from "@/hooks/use-mobile"

const MyComponent = () => {
  const isMobile = useIsMobile()
  
  return (
    <div className={isMobile ? "p-4" : "p-8"}>
      {isMobile ? "모바일 뷰" : "데스크톱 뷰"}
    </div>
  )
}
```

### 토스트 훅 (재수출)
```tsx
import { useToast } from "@/hooks/use-toast"

const MyComponent = () => {
  const { toast } = useToast()
  
  const handleClick = () => {
    toast({ title: "성공", description: "작업이 완료되었습니다." })
  }
  
  return <button onClick={handleClick}>클릭</button>
}
```

## 내부 설계

### useIsMobile 구현 분석
```tsx
// src/hooks/use-mobile.tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile // undefined를 false로 변환
}
```

### 핵심 설계 원칙
1. **SSR 안전성**: 초기값을 undefined로 설정하여 hydration 불일치 방지
2. **이벤트 정리**: useEffect cleanup으로 메모리 누수 방지  
3. **이중 감지**: matchMedia + window.innerWidth로 정확성 향상
4. **타입 안전성**: boolean | undefined → boolean 변환

### 브레이크포인트 기준
- **모바일**: < 768px
- **데스크톱**: >= 768px  
- **기준값**: Tailwind CSS의 md 브레이크포인트와 일치

## 의존성

### 핵심 의존성
- **React**: useState, useEffect 훅
- **브라우저 API**: matchMedia, addEventListener

### 간접 의존성
- **Tailwind CSS**: 브레이크포인트 기준값
- **TypeScript**: 타입 안전성

## 예외/에러 처리

### SSR/SSG 안전성
```tsx
// 현재 구현의 SSR 대응
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

// 개선된 SSR 안전 버전
const useIsMobile = (defaultValue = false) => {
  const [isMobile, setIsMobile] = useState(defaultValue)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true) // 클라이언트 사이드임을 표시
    
    if (typeof window === 'undefined') return
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkIsMobile()
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener('change', checkIsMobile)
    
    return () => mql.removeEventListener('change', checkIsMobile)
  }, [])
  
  // SSR 중에는 기본값 반환, 클라이언트에서는 실제값
  return isClient ? isMobile : defaultValue
}
```

### 이벤트 리스너 정리
```tsx
// 현재 구현에서 정리 로직 확인
React.useEffect(() => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const onChange = () => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }
  mql.addEventListener("change", onChange)
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  
  // ✅ 정리 함수로 메모리 누수 방지
  return () => mql.removeEventListener("change", onChange)
}, [])
```

### 브라우저 호환성
```tsx
// matchMedia 미지원 브라우저 대응
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // matchMedia 지원 여부 확인
    const supportsMatchMedia = typeof window.matchMedia !== 'undefined'
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkIsMobile()
    
    if (supportsMatchMedia) {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener('change', checkIsMobile)
      return () => mql.removeEventListener('change', checkIsMobile)
    } else {
      // 폴백: resize 이벤트 사용
      window.addEventListener('resize', checkIsMobile)
      return () => window.removeEventListener('resize', checkIsMobile)
    }
  }, [])
  
  return !!isMobile
}
```

## 테스트 포인트

### 브레이크포인트 테스트
```tsx
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

// matchMedia 모킹
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('useIsMobile', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })
  
  test('767px에서 모바일로 감지', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })
    
    const { result } = renderHook(() => useIsMobile())
    
    act(() => {
      // 컴포넌트 마운트 후 값 확인
    })
    
    expect(result.current).toBe(true)
  })
  
  test('768px에서 데스크톱으로 감지', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })
})
```

### 이벤트 리스너 테스트
```tsx
describe('useIsMobile 이벤트 처리', () => {
  test('컴포넌트 언마운트 시 리스너 정리', () => {
    const removeEventListenerSpy = jest.fn()
    
    mockMatchMedia(false)
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: removeEventListenerSpy,
    }))
    
    const { unmount } = renderHook(() => useIsMobile())
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
  })
  
  test('윈도우 리사이즈 시 값 업데이트', () => {
    const { result } = renderHook(() => useIsMobile())
    
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500 })
      window.dispatchEvent(new Event('resize'))
    })
    
    expect(result.current).toBe(true)
  })
})
```

### SSR 테스트
```tsx
describe('useIsMobile SSR', () => {
  test('서버 사이드에서 안전한 초기값', () => {
    // window 객체 제거로 SSR 환경 시뮬레이션
    const originalWindow = global.window
    delete global.window
    
    const { result } = renderHook(() => useIsMobile())
    
    // undefined 또는 기본값 반환 확인
    expect(typeof result.current).toBe('boolean')
    
    global.window = originalWindow
  })
  
  test('하이드레이션 불일치 방지', () => {
    // 서버와 클라이언트 초기값이 동일해야 함
    const serverResult = renderHook(() => useIsMobile())
    const clientResult = renderHook(() => useIsMobile())
    
    // 초기 렌더링에서는 같은 값
    expect(serverResult.result.current).toBe(clientResult.result.current)
  })
})
```

## 코드 리뷰 체크리스트

### 메모리 관리
- [ ] useEffect cleanup 함수로 이벤트 리스너 정리?
- [ ] 컴포넌트 언마운트 시 타이머나 구독 해제?
- [ ] 메모리 누수 가능성은 없는가?

### 성능
- [ ] 불필요한 리렌더링 방지 (useCallback, useMemo)?
- [ ] deps 배열이 올바르게 설정되었는가?
- [ ] throttle/debounce 적용이 필요한가?

### 타입 안전성
- [ ] 반환값의 타입이 명확한가?
- [ ] 매개변수 타입이 올바르게 정의되었는가?
- [ ] 제네릭 사용이 적절한가?

### 브라우저 호환성
- [ ] SSR/SSG 환경에서 안전한가?
- [ ] 구형 브라우저 API 지원 확인?
- [ ] window 객체 존재 여부 검사?

### 재사용성
- [ ] 다른 컴포넌트에서 쉽게 사용 가능한가?
- [ ] 설정 가능한 매개변수 제공?
- [ ] 커스터마이징 옵션이 충분한가?

## 확장 가이드

### 추가 브레이크포인트 훅
```tsx
// 다중 브레이크포인트 지원
type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const breakpoints = {
  sm: 640,
  md: 768, 
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export function useBreakpoint(): Breakpoint {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('sm')
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints['2xl']) setCurrentBreakpoint('2xl')
      else if (width >= breakpoints.xl) setCurrentBreakpoint('xl')
      else if (width >= breakpoints.lg) setCurrentBreakpoint('lg')
      else if (width >= breakpoints.md) setCurrentBreakpoint('md')
      else setCurrentBreakpoint('sm')
    }
    
    updateBreakpoint()
    
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])
  
  return currentBreakpoint
}

// 특정 브레이크포인트 이상 확인
export function useBreakpointValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint()
  
  // 현재 브레이크포인트부터 역순으로 값 찾기
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm']
  const currentIndex = breakpointOrder.indexOf(breakpoint)
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]!
    }
  }
  
  return defaultValue
}

// 사용 예시
const cols = useBreakpointValue(
  { sm: 1, md: 2, lg: 3, xl: 4 },
  1
)
```

### 로컬 스토리지 훅
```tsx
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  })
  
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])
  
  return [storedValue, setValue]
}

// 사용 예시
const [theme, setTheme] = useLocalStorage('theme', 'light')
```

### 디바운스 훅
```tsx
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// 검색 입력과 함께 사용
export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 300)
  
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    
    setIsLoading(true)
    
    // API 호출 로직
    performSearch(debouncedQuery)
      .then(setResults)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [debouncedQuery])
  
  return {
    query,
    setQuery,
    results,
    isLoading
  }
}
```

### 인터섹션 옵저버 훅
```tsx
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<Element>(null)
  
  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options
    )
    
    observer.observe(target)
    
    return () => {
      observer.unobserve(target)
      observer.disconnect()
    }
  }, [options])
  
  return [targetRef, isIntersecting]
}

// 지연 로딩 이미지 컴포넌트
export function LazyImage({ src, alt, ...props }) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })
  
  return (
    <div ref={ref} {...props}>
      {isVisible ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="bg-muted animate-pulse" />
      )}
    </div>
  )
}
```

### 다크모드 훅
```tsx
type Theme = 'light' | 'dark' | 'system'

export function useDarkMode(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system')
  
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])
  
  // 시스템 테마 변경 감지
  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(mediaQuery.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
  
  return [theme, setTheme]
}
```

## 예시/스니펫

### 반응형 네비게이션
```tsx
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function Navigation() {
  const isMobile = useIsMobile()
  
  const navigationItems = [
    { label: '홈', href: '/' },
    { label: '기능', href: '/features' },
    { label: '문서', href: '/docs' },
    { label: '문의', href: '/contact' }
  ]
  
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="flex flex-col gap-4 mt-8">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-lg font-medium hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    )
  }
  
  return (
    <nav className="flex items-center gap-6">
      {navigationItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
```

### 커스텀 폼 훅
```tsx
import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => Record<string, string>
  onSubmit?: (values: T) => Promise<void> | void
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // 에러가 있다면 제거
    if (errors[name as string]) {
      setErrors(prev => {
        const { [name as string]: removed, ...rest } = prev
        return rest
      })
    }
  }, [errors])
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }
    
    if (!onSubmit) return
    
    try {
      setIsSubmitting(true)
      await onSubmit(values)
      toast({
        title: '성공',
        description: '폼이 성공적으로 제출되었습니다.'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '폼 제출 중 오류가 발생했습니다.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])
  
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setIsSubmitting(false)
  }, [initialValues])
  
  return {
    values,
    errors,
    isSubmitting,
    setValue,
    handleSubmit,
    reset
  }
}

// 사용 예시
export function ContactForm() {
  const { values, errors, isSubmitting, setValue, handleSubmit } = useForm({
    initialValues: {
      name: '',
      email: '',
      message: ''
    },
    validate: (values) => {
      const errors: Record<string, string> = {}
      
      if (!values.name.trim()) {
        errors.name = '이름을 입력해주세요.'
      }
      
      if (!values.email.trim()) {
        errors.email = '이메일을 입력해주세요.'
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = '유효한 이메일을 입력해주세요.'
      }
      
      if (!values.message.trim()) {
        errors.message = '메시지를 입력해주세요.'
      }
      
      return errors
    },
    onSubmit: async (values) => {
      // API 호출
      await submitContactForm(values)
    }
  })
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="이름"
          value={values.name}
          onChange={(e) => setValue('name', e.target.value)}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>
      
      {/* 이메일, 메시지 필드 */}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '제출 중...' : '제출'}
      </Button>
    </form>
  )
}
```

## 성능 최적화

### 메모이제이션 패턴
```tsx
import { useMemo, useCallback } from 'react'

// 복잡한 계산 결과 캐싱
export function useExpensiveCalculation(data: any[]) {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      // 복잡한 계산 로직
      return acc + item.value
    }, 0)
  }, [data])
}

// 이벤트 핸들러 최적화
export function useOptimizedHandlers(onSave: (data: any) => void) {
  const handleSave = useCallback((data: any) => {
    // 추가 로직 처리 후 호출
    console.log('Saving data:', data)
    onSave(data)
  }, [onSave])
  
  const handleCancel = useCallback(() => {
    // 취소 로직
    console.log('Operation cancelled')
  }, [])
  
  return { handleSave, handleCancel }
}
```

### 조건부 훅 최적화
```tsx
// 조건부 실행을 내부에서 처리
export function useConditionalEffect(
  effect: () => void | (() => void),
  deps: any[],
  condition: boolean
) {
  useEffect(() => {
    if (!condition) return
    return effect()
  }, [...deps, condition])
}

// 지연 초기화
export function useLazyInitialization<T>(
  initializer: () => T,
  shouldInitialize: boolean
): T | null {
  const [value, setValue] = useState<T | null>(null)
  
  useEffect(() => {
    if (shouldInitialize && value === null) {
      setValue(initializer())
    }
  }, [shouldInitialize, initializer, value])
  
  return value
}
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- useIsMobile 훅 분석
- MOBILE_BREAKPOINT = 768 설정 확인

### v1.1 (계획)
- 추가 브레이크포인트 훅 구현
- SSR 안전성 개선
- 성능 최적화 패턴 적용