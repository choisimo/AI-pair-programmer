# 알림/피드백 서비스 (Toast Service)

## 목적/역할
- 사용자 행동 결과에 대한 시의적절한 피드백 제공
- 성공/오류/정보/경고 메시지의 일관된 표시
- 접근성을 고려한 알림 시스템 (스크린리더 지원)
- 비침해적(non-intrusive) 사용자 경험 보장

## 공개 API

### 기본 사용법
```tsx
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// App 루트에 Toaster 1회 마운트
<Toaster />

// 토스트 호출
toast({ title: "성공", description: "작업이 완료되었습니다." })
```

### Toast 함수 시그니처
```tsx
interface Toast {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" // 추가 variant 가능
  duration?: number // 향후 확장 예정
}

function toast(props: Toast): {
  id: string
  dismiss: () => void
  update: (props: ToasterToast) => void
}
```

### 훅 API
```tsx
import { useToast } from "@/components/ui/use-toast"

const { toast, dismiss, toasts } = useToast()
```

## 내부 설계

### 상태 관리 아키텍처
- **전역 상태**: 메모리 기반 상태 관리 (Redux 패턴)
- **구독자 패턴**: listeners 배열로 컴포넌트 업데이트
- **Action 타입**: ADD_TOAST, UPDATE_TOAST, DISMISS_TOAST, REMOVE_TOAST
- **큐 제한**: TOAST_LIMIT = 1 (동시 표시 개수)

### Reducer 구조
```tsx
// 현재 설정값
const TOAST_LIMIT = 1 // 동시 표시 가능한 토스트 수
const TOAST_REMOVE_DELAY = 1000000 // 제거 지연 시간 (매우 긴 값)

// 상태 구조
interface State {
  toasts: ToasterToast[]
}

type Action = 
  | { type: "ADD_TOAST", toast: ToasterToast }
  | { type: "UPDATE_TOAST", toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST", toastId?: string }
  | { type: "REMOVE_TOAST", toastId?: string }
```

### 타이머 관리
```tsx
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return
  
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  
  toastTimeouts.set(toastId, timeout)
}
```

### 고유 ID 생성
```tsx
let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}
```

## 의존성

### 핵심 의존성
- **React**: 상태 관리 및 훅
- **shadcn/ui**: Toast 컴포넌트 기본 구조
- **Radix UI**: Toast primitives (접근성 기능)

### 타입 의존성
```tsx
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
```

## 예외/에러 처리

### 중복 토스트 방지
```tsx
// 현재는 TOAST_LIMIT=1로 제한
// 동일 메시지 중복 방지 로직 (향후 확장)
const isDuplicateToast = (newToast: Toast, existingToasts: ToasterToast[]) => {
  return existingToasts.some(toast => 
    toast.title === newToast.title && 
    toast.description === newToast.description
  )
}
```

### 메모리 누수 방지
```tsx
// 컴포넌트 언마운트 시 리스너 정리
React.useEffect(() => {
  listeners.push(setState)
  return () => {
    const index = listeners.indexOf(setState)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}, [state])

// 타이머 정리
const cleanup = () => {
  toastTimeouts.forEach(timeout => clearTimeout(timeout))
  toastTimeouts.clear()
}
```

### 에러 객체 안전 처리
```tsx
// 에러 메시지 포맷터 (유틸리티로 분리 권장)
const humanizeError = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return '알 수 없는 오류가 발생했습니다'
}

// 사용 예시
try {
  await riskyOperation()
} catch (error) {
  toast({
    variant: "destructive",
    title: "오류 발생",
    description: humanizeError(error)
  })
}
```

## 테스트 포인트

### 기본 동작 테스트
```tsx
describe("Toast Service", () => {
  test("토스트 생성 및 표시", () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: "테스트 메시지" })
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe("테스트 메시지")
  })
  
  test("토스트 업데이트", () => {
    const { result } = renderHook(() => useToast())
    
    let toastInstance: any
    act(() => {
      toastInstance = result.current.toast({ title: "원본" })
    })
    
    act(() => {
      toastInstance.update({ title: "수정됨" })
    })
    
    expect(result.current.toasts[0].title).toBe("수정됨")
  })
  
  test("토스트 dismiss", () => {
    const { result } = renderHook(() => useToast())
    
    let toastInstance: any
    act(() => {
      toastInstance = result.current.toast({ title: "테스트" })
    })
    
    act(() => {
      toastInstance.dismiss()
    })
    
    expect(result.current.toasts[0].open).toBe(false)
  })
})
```

### 접근성 테스트
```tsx
test("스크린리더 라이브 리전 동작", () => {
  render(<Toaster />)
  
  act(() => {
    toast({ title: "알림", description: "새 메시지입니다" })
  })
  
  // aria-live="polite" 영역에 메시지 표시 확인
  expect(screen.getByRole("status")).toBeInTheDocument()
  expect(screen.getByText("알림")).toBeInTheDocument()
})

test("키보드 인터랙션", () => {
  render(<Toaster />)
  
  act(() => {
    toast({ 
      title: "확인 필요", 
      action: <Button onClick={() => {}}>확인</Button>
    })
  })
  
  const actionButton = screen.getByRole("button", { name: "확인" })
  expect(actionButton).toBeInTheDocument()
  
  // Tab 키로 포커스 이동 가능
  userEvent.tab()
  expect(actionButton).toHaveFocus()
})
```

### 큐잉 동작 테스트
```tsx
test("토스트 제한(TOAST_LIMIT) 동작", () => {
  const { result } = renderHook(() => useToast())
  
  act(() => {
    result.current.toast({ title: "첫 번째" })
    result.current.toast({ title: "두 번째" })
    result.current.toast({ title: "세 번째" })
  })
  
  // TOAST_LIMIT=1이므로 최신 토스트만 표시
  expect(result.current.toasts).toHaveLength(1)
  expect(result.current.toasts[0].title).toBe("세 번째")
})
```

### 타이머 테스트
```tsx
test("자동 제거 타이머 동작", async () => {
  jest.useFakeTimers()
  
  const { result } = renderHook(() => useToast())
  
  act(() => {
    result.current.toast({ title: "타이머 테스트" })
  })
  
  expect(result.current.toasts).toHaveLength(1)
  
  // dismiss 호출 시 타이머 시작
  act(() => {
    result.current.dismiss(result.current.toasts[0].id)
  })
  
  // 타이머 완료 후 제거 확인
  act(() => {
    jest.advanceTimersByTime(TOAST_REMOVE_DELAY)
  })
  
  expect(result.current.toasts).toHaveLength(0)
  
  jest.useRealTimers()
})
```

## 코드 리뷰 체크리스트

### 상태 관리
- [ ] Toaster가 앱에서 1회만 마운트되었는가?
- [ ] 메모리 누수 방지를 위한 cleanup 로직이 있는가?
- [ ] 타이머 관리가 적절히 이뤄지는가?

### 사용자 경험
- [ ] 토스트 메시지가 명확하고 실행 가능한가?
- [ ] destructive variant 사용이 적절한가?
- [ ] 사용자 행동과 피드백 타이밍이 자연스러운가?

### 접근성
- [ ] 스크린리더 사용자를 위한 라이브 리전 적용?
- [ ] 키보드로만 상호작용 가능한가?
- [ ] action 버튼의 포커스 관리가 적절한가?

### 에러 처리
- [ ] Error 객체를 안전하게 문자열로 변환하는가?
- [ ] 네트워크 오류 등 공통 에러 포맷이 일관적인가?
- [ ] 중복 토스트 방지 로직이 필요한가?

### 성능
- [ ] 불필요한 리렌더링이 발생하지 않는가?
- [ ] 메모리 사용량이 적정한가? (긴 TOAST_REMOVE_DELAY 주의)

## 확장 가이드

### 새로운 Variant 추가
```tsx
// toast 컴포넌트에 variant 확장
const toastVariants = cva(
  "...", // 기본 클래스
  {
    variants: {
      variant: {
        default: "...",
        destructive: "...",
        // 새 variant 추가
        success: "bg-green-500 text-white border-green-600",
        warning: "bg-yellow-500 text-yellow-900 border-yellow-600",
        info: "bg-blue-500 text-white border-blue-600",
      }
    }
  }
)

// 사용
toast({ 
  variant: "success", 
  title: "성공", 
  description: "작업이 완료되었습니다" 
})
```

### Duration 기능 추가
```tsx
// Toast 인터페이스 확장
interface Toast {
  // ... 기존 props
  duration?: number // ms 단위
}

// toast 함수에서 duration 처리
function toast({ duration = 5000, ...props }: Toast) {
  const id = genId()
  
  // ... 기존 로직
  
  // duration이 설정된 경우 자동 dismiss
  if (duration > 0) {
    setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", toastId: id })
    }, duration)
  }
  
  return { id, dismiss, update }
}
```

### 위치별 토스트 (Multiple Containers)
```tsx
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface Toast {
  // ... 기존 props
  position?: ToastPosition
}

// 위치별 Toaster 컴포넌트
export function PositionalToaster({ position = 'top-right' }: { position?: ToastPosition }) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }
  
  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      {/* 토스트 렌더링 */}
    </div>
  )
}
```

### 국제화 지원
```tsx
// i18n 키 기반 메시지
interface Toast {
  // ... 기존 props
  titleKey?: string // i18n 키
  descriptionKey?: string
  titleValues?: Record<string, any> // 템플릿 변수
}

// 사용 예시
toast({
  titleKey: "actions.save.success",
  descriptionKey: "actions.save.description", 
  titleValues: { itemName: "프로필" }
})
```

### 중복 토스트 방지
```tsx
// 중복 방지 로직
const toastCache = new Map<string, number>()
const DUPLICATE_THRESHOLD = 3000 // 3초

function toast({ ...props }: Toast) {
  // 중복 체크
  const cacheKey = `${props.title}-${props.description}`
  const now = Date.now()
  const lastTime = toastCache.get(cacheKey)
  
  if (lastTime && now - lastTime < DUPLICATE_THRESHOLD) {
    return { id: '', dismiss: () => {}, update: () => {} }
  }
  
  toastCache.set(cacheKey, now)
  
  // 기존 로직...
}
```

## 예시/스니펫

### 기본 사용 패턴
```tsx
import { toast } from "@/components/ui/use-toast"

// 성공 메시지
const handleSave = async () => {
  try {
    await saveData()
    toast({
      title: "저장 완료",
      description: "변경사항이 성공적으로 저장되었습니다."
    })
  } catch (error) {
    toast({
      variant: "destructive",
      title: "저장 실패", 
      description: humanizeError(error)
    })
  }
}

// 확인 액션이 있는 토스트
const handleDelete = async () => {
  const result = toast({
    title: "삭제하시겠습니까?",
    description: "이 작업은 되돌릴 수 없습니다.",
    action: (
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => {
          performDelete()
          result.dismiss()
        }}
      >
        삭제
      </Button>
    )
  })
}
```

### 커스텀 훅 패턴
```tsx
// API 호출과 토스트를 결합한 훅
function useApiWithToast() {
  const { toast } = useToast()
  
  const callApi = async (apiCall: () => Promise<any>, messages?: {
    loading?: string
    success?: string
    error?: string
  }) => {
    const loadingToast = messages?.loading ? toast({
      title: messages.loading,
      description: "처리 중입니다..."
    }) : null
    
    try {
      const result = await apiCall()
      
      loadingToast?.dismiss()
      
      if (messages?.success) {
        toast({
          title: "성공",
          description: messages.success
        })
      }
      
      return result
    } catch (error) {
      loadingToast?.dismiss()
      
      toast({
        variant: "destructive",
        title: "오류",
        description: messages?.error || humanizeError(error)
      })
      
      throw error
    }
  }
  
  return { callApi }
}

// 사용
const { callApi } = useApiWithToast()

const handleSubmit = () => {
  callApi(
    () => submitForm(data),
    {
      loading: "제출 중",
      success: "폼이 성공적으로 제출되었습니다",
      error: "폼 제출에 실패했습니다"
    }
  )
}
```

### 프로그래스 토스트
```tsx
// 진행률 표시 토스트
const showProgressToast = () => {
  let progress = 0
  const toastInstance = toast({
    title: "파일 업로드 중",
    description: `진행률: ${progress}%`,
    duration: 0 // 수동으로만 닫기
  })
  
  const interval = setInterval(() => {
    progress += 10
    
    toastInstance.update({
      description: `진행률: ${progress}%`
    })
    
    if (progress >= 100) {
      clearInterval(interval)
      toastInstance.update({
        title: "업로드 완료",
        description: "파일이 성공적으로 업로드되었습니다"
      })
      
      setTimeout(() => toastInstance.dismiss(), 3000)
    }
  }, 500)
}
```

## 성능 최적화

### 메모이제이션
```tsx
// 토스트 컴포넌트 메모이제이션
const ToastComponent = memo(({ toast: toastData }: { toast: ToasterToast }) => {
  return (
    <Toast {...toastData}>
      {/* 토스트 내용 */}
    </Toast>
  )
})

// 액션 메모이제이션
const MemoizedAction = memo(({ action, onAction }: { 
  action: React.ReactNode
  onAction: () => void 
}) => {
  const handleClick = useCallback(onAction, [onAction])
  return React.cloneElement(action as React.ReactElement, { onClick: handleClick })
})
```

### 배치 업데이트
```tsx
// 여러 토스트를 한 번에 처리
const batchToasts = (toasts: Toast[]) => {
  // 렌더링 최적화를 위한 배치 처리
  React.unstable_batchedUpdates(() => {
    toasts.forEach(toastData => toast(toastData))
  })
}
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- 기본 toast 시스템 분석
- 현재 TOAST_LIMIT=1 설정 문서화

### v1.1 (계획)
- duration 기능 추가
- 중복 방지 로직 도입
- 다양한 variant 추가 (success, warning, info)