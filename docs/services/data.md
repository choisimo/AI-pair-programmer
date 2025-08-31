# 데이터/상태 서비스 (Data & State Service) - 계획

## 목적/역할
- API 통신 및 서버 상태 관리 (TanStack Query 기반)
- 클라이언트 상태 관리 및 캐싱 전략
- 에러 처리 및 로딩 상태 표준화
- 실시간 데이터 동기화 (WebSocket 등)
- 데이터 변형 및 정규화 레이어

**현재 상태**: TanStack Query가 package.json에 설치되어 있으나 아직 활용되지 않음

## 공개 API (계획)

### 쿼리 훅
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 데이터 조회
const { data, isLoading, error } = useFeatures()
const { data: userProfile } = useUserProfile(userId)

// 데이터 변경
const createFeatureMutation = useCreateFeature()
const updateProfileMutation = useUpdateProfile()

// 캐시 조작
const queryClient = useQueryClient()
queryClient.invalidateQueries(['features'])
```

### API 클라이언트
```tsx
// API 기본 설정
import { apiClient } from '@/lib/api'

// 타입 안전한 API 호출
const features = await apiClient.get('/features')
const newFeature = await apiClient.post('/features', data)
```

### 상태 관리 훅
```tsx
// 전역 상태 (Zustand 등 도입 시)
const { theme, setTheme } = useThemeStore()
const { user, login, logout } = useAuthStore()
```

## 내부 설계 (계획)

### TanStack Query 설정
```tsx
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: (failureCount, error) => {
        // 4xx 에러는 재시도 안함
        if (error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: '데이터 로딩 오류',
          description: humanizeError(error)
        })
      }
    },
    mutations: {
      onError: (error) => {
        toast({
          variant: 'destructive', 
          title: '작업 실패',
          description: humanizeError(error)
        })
      }
    }
  }
})
```

### API 클라이언트 구조
```tsx
// src/lib/api.ts
interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

interface ApiError {
  message: string
  code: string
  details?: any
}

class ApiClient {
  private baseURL: string
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      },
      ...options
    }
    
    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response)
      }
      
      return await response.json()
    } catch (error) {
      throw this.handleNetworkError(error)
    }
  }
  
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // PUT, DELETE, PATCH 메서드...
  
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
  
  private async handleErrorResponse(response: Response): Promise<ApiError> {
    const errorData = await response.json().catch(() => ({}))
    return {
      message: errorData.message || `HTTP ${response.status}`,
      code: errorData.code || 'UNKNOWN_ERROR',
      details: errorData
    }
  }
  
  private handleNetworkError(error: any): ApiError {
    return {
      message: error.message || '네트워크 오류가 발생했습니다',
      code: 'NETWORK_ERROR',
      details: error
    }
  }
}

export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
)
```

### 쿼리 키 관리
```tsx
// src/lib/query-keys.ts
export const queryKeys = {
  // 기능 관련
  features: ['features'] as const,
  feature: (id: string) => ['features', id] as const,
  
  // 사용자 관련  
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  userProfile: (id: string) => ['users', id, 'profile'] as const,
  
  // 설정 관련
  settings: ['settings'] as const,
  userSettings: (userId: string) => ['settings', 'user', userId] as const,
}

// 타입 안전한 쿼리 키 유틸리티
type QueryKeyFactory = typeof queryKeys
export type QueryKey = ReturnType<QueryKeyFactory[keyof QueryKeyFactory]>
```

## 의존성 (계획)

### 핵심 의존성
- **@tanstack/react-query**: 서버 상태 관리 (이미 설치됨)
- **@tanstack/react-query-devtools**: 개발 도구 (추가 필요)

### 선택적 의존성
- **Zustand**: 클라이언트 전역 상태 (필요시)
- **React Hook Form + Zod**: 폼 상태 관리 (이미 설치됨)
- **WebSocket/SSE**: 실시간 데이터 (필요시)

## 예외/에러 처리 (계획)

### API 에러 분류
```tsx
// src/lib/error-handler.ts
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export function categorizeError(error: any): ErrorType {
  if (!navigator.onLine) return ErrorType.NETWORK
  if (error.status === 401) return ErrorType.AUTHENTICATION
  if (error.status === 403) return ErrorType.AUTHORIZATION
  if (error.status >= 400 && error.status < 500) return ErrorType.VALIDATION
  if (error.status >= 500) return ErrorType.SERVER
  return ErrorType.UNKNOWN
}

export function getErrorMessage(error: any, type: ErrorType): string {
  const messages = {
    [ErrorType.NETWORK]: '인터넷 연결을 확인해주세요',
    [ErrorType.AUTHENTICATION]: '로그인이 필요합니다',
    [ErrorType.AUTHORIZATION]: '권한이 없습니다', 
    [ErrorType.VALIDATION]: '입력 정보를 확인해주세요',
    [ErrorType.SERVER]: '서버에 문제가 발생했습니다',
    [ErrorType.UNKNOWN]: '알 수 없는 오류가 발생했습니다'
  }
  
  return error.message || messages[type]
}
```

### 재시도 전략
```tsx
// src/hooks/use-retry-query.ts
export function useRetryQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    backoff?: boolean
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, backoff = true } = options
  
  return useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      const errorType = categorizeError(error)
      
      // 클라이언트 에러는 재시도 안함
      if ([ErrorType.AUTHENTICATION, ErrorType.AUTHORIZATION, ErrorType.VALIDATION].includes(errorType)) {
        return false
      }
      
      return failureCount < maxRetries
    },
    retryDelay: (attemptIndex) => {
      if (!backoff) return retryDelay
      return Math.min(retryDelay * Math.pow(2, attemptIndex), 30000) // 최대 30초
    }
  })
}
```

### 오프라인 지원
```tsx
// src/hooks/use-online-status.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

// TanStack Query와 연동
export function useOfflineAwareQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
) {
  const isOnline = useOnlineStatus()
  
  return useQuery({
    ...options,
    queryKey,
    queryFn,
    enabled: isOnline && (options.enabled ?? true),
    staleTime: isOnline ? options.staleTime : Infinity, // 오프라인시 무한 캐시
  })
}
```

## 테스트 포인트 (계획)

### 쿼리 훅 테스트
```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFeatures } from '@/hooks/use-features'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useFeatures', () => {
  test('기능 목록 조회 성공', async () => {
    // API 모킹
    server.use(
      rest.get('/api/features', (req, res, ctx) => {
        return res(ctx.json({ data: mockFeatures }))
      })
    )
    
    const { result } = renderHook(() => useFeatures(), {
      wrapper: createWrapper()
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toEqual(mockFeatures)
  })
  
  test('API 에러 처리', async () => {
    server.use(
      rest.get('/api/features', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server Error' }))
      })
    )
    
    const { result } = renderHook(() => useFeatures(), {
      wrapper: createWrapper()
    })
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    
    expect(result.current.error).toBeDefined()
  })
})
```

### API 클라이언트 테스트
```tsx
describe('ApiClient', () => {
  test('GET 요청 성공', async () => {
    fetchMock.get('/api/test', { data: 'success' })
    
    const result = await apiClient.get('/test')
    expect(result).toEqual({ data: 'success' })
  })
  
  test('인증 헤더 자동 추가', async () => {
    localStorage.setItem('authToken', 'test-token')
    
    fetchMock.get('/api/protected', { data: 'protected' })
    
    await apiClient.get('/protected')
    
    const lastCall = fetchMock.lastCall()
    expect(lastCall[1].headers.Authorization).toBe('Bearer test-token')
  })
  
  test('네트워크 오류 처리', async () => {
    fetchMock.get('/api/test', { throws: new Error('Network Error') })
    
    await expect(apiClient.get('/test')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('네트워크')
    })
  })
})
```

## 코드 리뷰 체크리스트 (계획)

### 쿼리 설계
- [ ] 쿼리 키가 일관되고 예측 가능한가?
- [ ] 적절한 staleTime/cacheTime 설정?
- [ ] 불필요한 re-fetch 방지?
- [ ] 의존성 쿼리가 올바르게 설계되었는가?

### 에러 처리
- [ ] API 에러가 사용자 친화적으로 변환되는가?
- [ ] 재시도 로직이 적절한가?
- [ ] 네트워크 상태 변화 대응?
- [ ] 로딩/에러 상태가 명확히 표시되는가?

### 성능
- [ ] 캐싱 전략이 효율적인가?
- [ ] 불필요한 API 호출 방지?
- [ ] 페이지네이션 고려?
- [ ] 백그라운드 업데이트 최적화?

### 타입 안전성
- [ ] API 응답 타입이 정의되었는가?
- [ ] 에러 타입이 명확한가?
- [ ] 쿼리 키 타입 안전성 보장?

## 확장 가이드 (계획)

### 실시간 데이터 연동
```tsx
// src/hooks/use-realtime-features.ts
export function useRealtimeFeatures() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL)
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      
      if (type === 'FEATURE_UPDATED') {
        queryClient.setQueryData(
          queryKeys.feature(data.id),
          data
        )
      }
      
      if (type === 'FEATURE_CREATED') {
        queryClient.invalidateQueries(queryKeys.features)
      }
    }
    
    return () => ws.close()
  }, [queryClient])
  
  return useQuery(queryKeys.features, fetchFeatures)
}
```

### 무한 스크롤
```tsx
// src/hooks/use-infinite-features.ts
export function useInfiniteFeatures(filter: FeatureFilter = {}) {
  return useInfiniteQuery({
    queryKey: ['features', 'infinite', filter],
    queryFn: ({ pageParam = 0 }) => 
      apiClient.get(`/features?page=${pageParam}&limit=20`, filter),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined
    }
  })
}

// 컴포넌트에서 사용
export function FeaturesList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFeatures()
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.features.map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </Fragment>
      ))}
      
      <button 
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? '로딩중...' : '더 보기'}
      </button>
    </div>
  )
}
```

### 옵티미스틱 업데이트
```tsx
// src/hooks/use-create-feature.ts
export function useCreateFeature() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (newFeature: CreateFeatureInput) => 
      apiClient.post('/features', newFeature),
    
    onMutate: async (newFeature) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries(queryKeys.features)
      
      // 현재 데이터 스냅샷
      const previousFeatures = queryClient.getQueryData(queryKeys.features)
      
      // 옵티미스틱 업데이트
      queryClient.setQueryData(queryKeys.features, (old: Feature[]) => [
        ...old,
        { ...newFeature, id: 'temp-' + Date.now(), status: 'creating' }
      ])
      
      return { previousFeatures }
    },
    
    onError: (err, newFeature, context) => {
      // 에러 시 이전 상태로 롤백
      queryClient.setQueryData(queryKeys.features, context?.previousFeatures)
      
      toast({
        variant: 'destructive',
        title: '기능 생성 실패',
        description: '다시 시도해주세요'
      })
    },
    
    onSuccess: (data) => {
      toast({
        title: '기능 생성 완료',
        description: '새 기능이 추가되었습니다'
      })
    },
    
    onSettled: () => {
      // 최종적으로 서버 데이터로 동기화
      queryClient.invalidateQueries(queryKeys.features)
    }
  })
}
```

### 전역 상태 관리 (Zustand)
```tsx
// src/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        try {
          const response = await apiClient.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ user, token, isAuthenticated: true })
        } catch (error) {
          throw new Error('로그인에 실패했습니다')
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        // 쿼리 캐시도 정리
        queryClient.clear()
      },
      
      updateProfile: async (data) => {
        const currentUser = get().user
        if (!currentUser) throw new Error('로그인이 필요합니다')
        
        const updatedUser = await apiClient.put(`/users/${currentUser.id}`, data)
        set({ user: updatedUser.data })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)
```

## 예시/스니펫 (계획)

### 기본 설정
```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* 앱 컴포넌트들 */}
      </Router>
      
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### 커스텀 훅 예시
```tsx
// src/hooks/use-features.ts
export function useFeatures(filter: FeatureFilter = {}) {
  return useQuery({
    queryKey: queryKeys.features.concat([filter]),
    queryFn: () => apiClient.get('/features', { params: filter }),
    select: (response) => response.data, // 응답에서 data만 추출
  })
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: queryKeys.feature(id),
    queryFn: () => apiClient.get(`/features/${id}`),
    enabled: !!id, // id가 있을 때만 실행
    select: (response) => response.data,
  })
}

export function useUpdateFeature() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeatureInput }) =>
      apiClient.put(`/features/${id}`, data),
    
    onSuccess: (response, { id }) => {
      // 개별 기능과 목록 모두 업데이트
      queryClient.setQueryData(queryKeys.feature(id), response.data)
      queryClient.invalidateQueries(queryKeys.features)
      
      toast({
        title: '업데이트 완료',
        description: '기능이 성공적으로 업데이트되었습니다'
      })
    }
  })
}
```

### 폼과 연동
```tsx
// src/components/FeatureForm.tsx
export function FeatureForm({ featureId }: { featureId?: string }) {
  const isEditing = !!featureId
  
  const { data: feature, isLoading } = useFeature(featureId!, {
    enabled: isEditing
  })
  
  const createMutation = useCreateFeature()
  const updateMutation = useUpdateFeature()
  
  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium'
    }
  })
  
  // 편집 모드일 때 폼에 기존 데이터 로드
  useEffect(() => {
    if (feature) {
      form.reset({
        title: feature.title,
        description: feature.description,
        priority: feature.priority
      })
    }
  }, [feature, form])
  
  const onSubmit = (data: FeatureFormData) => {
    if (isEditing) {
      updateMutation.mutate({ id: featureId!, data })
    } else {
      createMutation.mutate(data)
    }
  }
  
  const isSubmitting = createMutation.isLoading || updateMutation.isLoading
  
  if (isLoading) return <FormSkeleton />
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>제목</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* 기타 필드들 */}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '저장 중...' : isEditing ? '업데이트' : '생성'}
      </Button>
    </form>
  )
}
```

## 성능 최적화 (계획)

### 쿼리 최적화
```tsx
// 선택적 데이터 추출로 리렌더링 최소화
const feature = useFeature(id, {
  select: (data) => ({
    id: data.id,
    title: data.title
  })
})

// 조건부 쿼리 실행
const userProfile = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId && isAuthenticated
})

// 병렬 쿼리
const results = useQueries({
  queries: featureIds.map(id => ({
    queryKey: ['feature', id],
    queryFn: () => fetchFeature(id)
  }))
})
```

### 캐시 전략
```tsx
// 프리페칭
export function useFeatureListWithPrefetch() {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeatures
  })
  
  // 개별 기능들을 미리 캐싱
  useEffect(() => {
    if (query.data) {
      query.data.forEach(feature => {
        queryClient.setQueryData(['feature', feature.id], feature)
      })
    }
  }, [query.data, queryClient])
  
  return query
}

// 백그라운드 업데이트
const features = useQuery({
  queryKey: ['features'],
  queryFn: fetchFeatures,
  refetchInterval: 5 * 60 * 1000, // 5분마다 백그라운드 업데이트
  refetchIntervalInBackground: false // 탭이 활성화일 때만
})
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 계획 문서화
- TanStack Query 설치 확인 (package.json)
- API 클라이언트 및 에러 처리 전략 설계

### v1.1 (향후)
- TanStack Query 기본 설정 구현
- API 클라이언트 개발
- 기본 CRUD 훅 구현
- 에러 처리 시스템 도입

### v2.0 (향후)
- 실시간 데이터 연동 (WebSocket)
- 옵티미스틱 업데이트 패턴
- 오프라인 지원 및 동기화
- 전역 상태 관리 (Zustand) 통합