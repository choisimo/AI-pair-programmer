# Data Access & State Management Service PRD

## 1. 목적 및 범위 (Purpose & Scope)
데이터 접근 & 상태 관리(Data Access & State Management) 서비스는 클라이언트 애플리케이션 내 서버 상태(Server State)와 클라이언트 UI/세션 상태(Client State)를 일관성 있고 예측 가능하며 성능 최적화된 방식으로 제공하는 추상화 계층이다.  
Phase 1 목표는 TanStack Query 기반의 서버 상태 표준화, API 클라이언트(HTTP Layer) 초기 구현, 에러/로딩 상태 패턴 정립이다. Phase 2에서는 실시간 동기화(WebSocket/SSE), 옵티미스틱 업데이트, 오프라인/재시도 전략, 캐시 세분화가 추가된다. Phase 3에서는 다중 워크스페이스 컨텍스트, 권한(Authorization) 의존 조건부 쿼리, Embedding/검색 인덱스 프리페치 전략을 확장한다.

## 2. 범위 제외 사항 (Out of Scope)
- 멀티 언어 SDK 생성 (Deployment/SDK 팀 책임)
- 복잡한 도메인 모델 규칙(비즈니스 Rule 엔진)
- 서버 측 GraphQL Resolver / BFF 설계
- 대규모 Offline-first Conflict Resolution (Phase 3+)
- 실시간 CRDT 문서 데이터 (Realtime Collaboration 서비스 범위)

## 3. 현재 상태 (Current State)
- TanStack Query 설치만 되어 있고 Provider/QueryClient 미초기화
- API 클라이언트 추상화 미구현 (기본 fetch 사용 예정)
- 에러 카테고리 분류 / 재시도 정책 미정
- 전역 상태 관리(Zustand 등) 미도입
- Form 상태 관리 패턴(React Hook Form + Zod)은 패키지 수준만 설치

## 4. 기능 요구사항 (Functional Requirements)
FR-1: QueryClient 전역 초기화 및 기본 옵션(staleTime, retry, refetchOnWindowFocus=false) 구성  
FR-2: API 클라이언트(apiClient)에서 공통 헤더, 인증 토큰 주입, 표준 오류 객체 변환 수행  
FR-3: 공통 쿼리 키 팩토리(queryKeys) 제공 (features, users, settings 등)  
FR-4: useFeatures / useFeature / useCreateFeature / useUpdateFeature 표준 훅 구현  
FR-5: 에러 타입 분류(ErrorType: NETWORK, AUTHENTICATION, AUTHORIZATION, VALIDATION, SERVER, UNKNOWN) 및 사용자 친화 메시지 맵핑  
FR-6: Mutations: 낙관적 업데이트(optimistic update) 기본 패턴 정의 (Phase 2 적용)  
FR-7: 쿼리 무효화(invalidate) / 프리패칭(prefetch) 유틸 제공  
FR-8: 로딩/에러/빈(empty) UI 상태 표준 Skeleton/Placeholder 컴포넌트 규약 문서화  
FR-9: 네트워크 offline 감지 시 쿼리 일시 중단(enabled=false) 및 캐시 읽기 동작  
FR-10: 재시도 전략: 네트워크/서버 오류에 대해 지수 백오프(최대 3회)  
FR-11: 권한 기반 보호 데이터 요청 시 토큰 만료(401) → 재인증 이벤트 트리거(로그아웃 or Refresh Flow)  
FR-12: Telemetry 이벤트(쿼리 성공/실패 latency, mutation 결과)를 Observability 서비스로 전달 (Phase 2)  

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 동일 데이터 재요청 대비 캐시 히트율 80% 이상 (Phase 2)
- 주 사용 화면 초기 병렬 쿼리 5개 P95 완료 < 800ms (네트워크 100ms RTT 가정)
신뢰성:
- API 오류 시 사용자에게 2단계 메시지 (요약 + 상세 펼침) 제공
- 캐시 무효화 후 최신 데이터 반영 P95 < 2s
확장성:
- 쿼리 키 네임스페이스 충돌 0 (정적 타입 기반 as const)
보안:
- Authorization 헤더 외 민감 정보 로컬 스토리지 저장 금지 (토큰만)
- 에러 로그에 PII 필드 직접 포함 금지
관찰성:
- Metrics: query_success_count, query_error_count, avg_query_latency_ms
- Mutation Success/Error 이벤트 태깅(ruleId, entityType)
접근성:
- 로딩 Skeleton은 충분한 대비 비율, 애니메이션 초당 ≤ 60fps
- 에러 메시지 ARIA live region(polite) 노출

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 API 클라이언트 (Pseudo)
```ts
interface ApiClient {
  get<T>(path: string, config?: RequestConfig): Promise<T>
  post<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>
  put<T>(path: string, body: unknown, config?: RequestConfig): Promise<T>
  delete<T>(path: string, config?: RequestConfig): Promise<T>
}
```
에러 표준:
```json
{
  "error": {
    "code": "VALIDATION",
    "message": "필수 필드 누락",
    "details": { "field": "title" }
  }
}
```
### 6.2 React Query 훅 패턴
```ts
function useFeature(id: string) {
  return useQuery({
    queryKey: queryKeys.feature(id),
    queryFn: () => apiClient.get<Feature>(`/features/${id}`),
    enabled: !!id
  })
}
```
### 6.3 Optimistic Mutation (Phase 2)
```ts
const mutation = useMutation({
  mutationFn: (input: CreateFeatureInput) => apiClient.post('/features', input),
  onMutate: async (newItem) => { /* snapshot & optimistic append */ },
  onError: (err, newItem, ctx) => { /* rollback */ },
  onSettled: () => queryClient.invalidateQueries(queryKeys.features)
})
```
### 6.4 Offline Hook
```ts
function useOfflineAwareQuery<T>(key: QueryKey, fn: () => Promise<T>) { /* enabled: online */ }
```

## 7. 데이터 모델 (Data Model)
논리적 모델 (클라이언트 캐시 관점):
- Feature: { id, title, description, priority, updatedAt }
- User: { id, email, name, role }
- Settings: { theme, language, flags{} }
- QueryMeta: { key, status, lastFetchTime, errorType? }
- MutationQueue(Phase 2): { id, type, payload, status, retryCount }
보조 인덱스:
- featuresById (Map)
- pendingMutations (FIFO)
상태 레벨:
- Server State (React Query Cache)
- UI State (로컬 컴포넌트 / Context 최소화)
- Session/Auth State (Zustand 계획)

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
시나리오: 목록 → 상세 수정
1. 페이지 진입 → useFeatures 쿼리 로딩 → 캐시 Hit 시 즉시 Stale-While-Revalidate
2. 사용자 항목 클릭 → useFeature(id) 즉시 이전 캐시(placeholder) 표시 → 백그라운드 refetch
3. 사용자 수정 → updateFeature mutation(onMutate Optimistic) → UI 즉시 반영
4. 서버 응답 성공 → 캐시 확정 / 실패 → rollback + toast 오류
오프라인 시나리오(Phase 2):
1. Offline 감지 → mutation queue에 보류
2. Online 복귀 → 재전송 → 순차 처리 / 실패 항목 별도 표시

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (토큰/권한)
- Configuration & Environment (API Base URL / Feature Flags)
Downstream:
- UI Foundation (로딩/에러/빈 상태 컴포넌트)
- Notification & Feedback (토스트 알림)
- Telemetry & Observability (쿼리 메트릭)
- Core AI Engine (분석 데이터 요청 전 사전 캐싱 가능)
교차:
- API Consistency Validator (타입 변경 시 invalidate 전략)
- Performance Optimization (Prefetch/Lazy 분할)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 캐시 키 충돌 | 잘못된 데이터 표시 | queryKeys as const + 타입 제한 |
| 과도한 refetch | 네트워크 낭비 | staleTime 설정 + 배치 invalidate |
| Optimistic 실패 롤백 누락 | 데이터 불일치 | onMutate snapshot 필수 + try/catch |
| Offline queue 폭증 | 메모리 증가 | 최대 대기 길이 제한 + LRU drop |
| 에러 메시지 난립 | UX 저하 | 중앙 humanizeError + dedup |
| 보안 토큰 누출 콘솔 로그 | 위험 | Strict logger wrapper + 필터 |
| 대용량 리스트 초기 로딩 지연 | 첫 진입 UX 저하 | 페이지네이션 + skeleton windowing |
| 서드파티 LLM 호출 동시 | latency 상승 | 캐시 레이어 + prefetch gating |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1 (Phase 1):
- QueryClient 설정 + 기본 훅(useFeatures/useFeature)
- API 클라이언트 오류 분류
- 에러 & 로딩 UI 패턴 문서화
수락: 데모에서 동일 데이터 2회 방문 시 2번째 100ms 이내 캐시 즉시 렌더
M2:
- Optimistic Mutation + invalidate 전략
- Offline 감지 + enabled 토글
수락: 네트워크 끊김 상황에서도 대기→재연결 후 성공 처리 로그
M3:
- Mutation Queue 재시도 Backoff
- Prefetch(호버/가시 영역 예측) 도입
수락: Prefetch 적용 시 첫 상세 화면 TTFB 체감 감소(측정 로그)
M4:
- 실시간 이벤트(WebSocket) 기반 Cache Patch
- Selective Partial Update (setQueryData)
수락: 이벤트 기반 갱신에서 refetch 호출 감소 ≥ 40%

## 12. 향후 확장 계획 (Future Extensions)
- GraphQL Transport 추상화 (REST/GraphQL 양면 지원)
- Background Sync(Periodic) & Staleness Heuristic
- Priority 기반 Request Scheduler (UI Interactions 우선)
- 데이터 마이그레이션 Layer (버전업 스키마 Transform)
- 암호화 로컬 스토리지 캐시 (보안 민감 데이터 제외)
- 테스트용 Mock Layer (MSW 연계 시나리오 DSL)
- Usage-based Smart Prefetch (사용자 이동 패턴 분석)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20