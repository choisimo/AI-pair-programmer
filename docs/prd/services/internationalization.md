# Internationalization (i18n) Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 3 대상 선제 설계)

---

## 1. 목적 및 범위 (Purpose & Scope)
Internationalization(i18n) 서비스는 애플리케이션 UI, 시스템 메시지, 알림, 오류 문구, 설명(Explanation Layer), 이메일/초대 메시지를 **다국어(Localization, L10n)** 로 확장 가능하도록 하는 기반 아키텍처를 정의한다.  
초기(Phase 2.5~3) 목표: 한국어(ko) + 영어(en) 동시 지원을 위한 구조 도입, 메시지 키(key) 정규화, Fallback 체계.  
중기(Phase 4): 추가 언어(일어/중국어) 후보, 날짜/시간/숫자/플랫폼 포맷 로캘 민감 처리, 번역 누락 탐지 자동 게이트.  
장기(Phase 5+): 도메인 가중치(개별 팀 사전), 사용자 선호톤(정중/간결) 변형, AI 기반 기계 번역 사후편집(Review) 워크플로.

## 2. 범위 제외 사항 (Out of Scope)
- 문서(Documentation Site) 다국어 정적 생성 (별도 Docs 파이프라인)
- 음성/오디오 TTS, RTL(우→좌) 레이아웃 대응 (Phase 5+)
- 자동 번역 승인 워크플로(Reviewer Dashboard) (Phase 4+)
- 지역화 통화/결제 표시 (Billing 서비스)
- 법적 약관 전문(Full Legal Document) 번역 품질 보증

## 3. 현재 상태 (Current State)
- UI 한글 하드코딩 비중 높음
- i18n 라이브러리 미도입 (react-i18next / lingui 등 없음)
- 메시지 키 네이밍 규칙/도메인 네임스페이스 부재
- 테스트(i18n 키 누락/unused 키) 인프라 부재
- 이메일/초대/알림 다국어 고려하지 않음

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | 메시지 키 네임스페이스 체계 | domain.segment.action 형태 (예: auth.login.button.label) |
| FR-2 | 런타임 로딩 | Lazy load per-locale JSON (코드 스플리팅) |
| FR-3 | Fallback 체계 | 요청 언어 → 기본(en) → 최종(key 자체) |
| FR-4 | 플로럴/카운트 처리 | count 기반 복수형 규칙 (영어 복수, 한국어 단수 fallback) |
| FR-5 | 날짜/시간 포맷 | Intl.DateTimeFormat 기반 (timezone 사용자 설정 연동) |
| FR-6 | 숫자/백분율 포맷 | Intl.NumberFormat, locale-aware separators |
| FR-7 | 에러 코드 변환 | 내부 error.code → i18n key 매핑 테이블 |
| FR-8 | 알림/토스트 번역 | notification.* 키 통일 & variant 기반 메시지 |
| FR-9 | Email/Invite 템플릿 키 | email.invite.subject / email.invite.body.intro |
| FR-10 | 키 누락 검사 | 빌드/CI 단계 missing / unused 키 리포트 |
| FR-11 | 번역 메모(Comment) 지원 | JSON alongside meta file (.notes) (Phase 3) |
| FR-12 | Lazy locale switch | 언어 변경 시 상태 유지(reload 없이) |
| FR-13 | Preload 우선 순위 | “현재 언어 + 영어” 2개 프리로딩 옵션 |
| FR-14 | Dynamic Injection | AI Explanation rationale 메시지 i18n 템플릿(placeholder) |
| FR-15 | Rich Text 안전 | 메시지 내 HTML 태그 화이트리스트 or jsx interpolation 제한 |
| FR-16 | RTL 준비 플래그 | direction=rtl 지원 placeholder (Phase 5) |
| FR-17 | Telemetry locale 태깅 | 이벤트 attributes.locale |
| FR-18 | i18n Test API | t('key', { count }) 호출 실패 감지 전용 mock 모드 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 초기 locale 번들(gzip) ≤ 25KB (ko/en 각각)  
- Lazy locale switch TTFB ≤ 400ms (CDN 캐시)  
신뢰성:
- 키 누락 이벤트율(missing / total lookups) ≤ 0.1%  
확장성:
- 언어 5개까지 추가 시 빌드 시간 증가 ≤ 10%  
보안:
- 번역 문자열에 임의 스크립트 삽입 금지 (escape / sanitize)  
국제화 품질:
- 키 일관성: snake_case vs dot.notation 혼용 금지 (dot.notation 고정)  
유지보수:
- 사용되지 않는 키 2 release 이상 유지 금지 (deprecated tagging)  
관찰성:
- telemetry: i18n_missing_key, i18n_fallback_used  
접근성:
- 언어 변경 시 스크린리더 “언어 변경됨” 라이브영역 안내  
데이터 무결성:
- JSON 스키마 검증 (type=string, placeholder 매칭)  
테스트:
- pseudo-locale(en-XA) 변형(문자 확장) 1회/주 Nightly

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 번역 파일 구조 (예시)
```
/locales
  /en
    auth.json
    common.json
    notification.json
  /ko
    auth.json
    common.json
    notification.json
```

### 6.2 번역 JSON (auth.json 예시)
```json
{
  "auth.login.title": "Sign In",
  "auth.login.button.label": "Log In",
  "auth.login.error.invalid": "Invalid email or password",
  "auth.reset.email.sent": "Password reset link has been sent.",
  "auth.invite.accept.success": "Invitation accepted"
}
```

### 6.3 i18n 초기화 (Pseudo TS)
```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

await i18n
  .use(initReactI18next)
  .init({
    lng: detectLocale(),
    fallbackLng: ['en'],
    supportedLngs: ['en','ko'],
    ns: ['auth','common','notification'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    load: 'currentOnly'
  })
```

### 6.4 번역 헬퍼
```ts
function tKey(key: string, options?: { count?: number; vars?: Record<string,string>}): string
```

### 6.5 에러 코드 매핑
```ts
const errorKeyMap: Record<string,string> = {
  AUTH_INVALID_CREDENTIALS: 'auth.login.error.invalid',
  AUTH_ACCOUNT_LOCKED: 'auth.login.error.locked'
}
```

### 6.6 Telemetry 이벤트
```json
{
  "name": "i18n_missing_key",
  "attributes": { "key": "auth.login.error.missing", "locale": "ko" }
}
```

### 6.7 Email 템플릿 (변수 인터폴레이션)
```txt
Subject: {{t('email.invite.subject')}} 
Body:
{{t('email.invite.greeting', { name })}}
{{t('email.invite.instructions')}}
{{invitationLink}}
```

## 7. 데이터 모델 (Data Model)
엔티티:
- LocaleBundle(id, locale, namespace, versionHash, sizeBytes, createdAt)
- MissingKeyLog(id, locale, key, firstSeenAt, lastSeenAt, count)
- DeprecatedKey(id, key, markedAt, removeAfter, lastUsedAt?)
- TranslationAudit(id, key, locale, oldValueHash, newValueHash, changedBy, changedAt)
- PseudoLocaleRun(id, locale, bundleVersion, mutatedAt)

인덱스:
- LocaleBundle(locale, namespace)
- MissingKeyLog(key, locale)
- DeprecatedKey(removeAfter)
보존:
- MissingKeyLog 90일
- TranslationAudit 365일
Derived Metrics:
- missing_key_rate = missingKeyCount / totalLookups
- fallback_usage_rate = fallbackHits / totalLookups

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 초기 로딩
1. detectLocale() (브라우저 설정 or 사용자 프로필)  
2. locale bundle fetch → cacheStorage 저장  
3. Fallback en 함께 프리로드 (옵션)  

### 8.2 언어 전환
1. 사용자 Settings → locale change  
2. 필요하면 en fallback 새로 fetch (이미 캐시면 skip)  
3. i18n instance reloadNamespaces → UI re-render without full page reload  
4. Live region: “언어가 변경되었습니다” 안내  

### 8.3 Missing Key 처리
1. tKey 호출 → key 미존재  
2. fallbackLng 탐색 → 미존재 시 key 그대로 반환  
3. MissingKeyLog enqueue → batch 전송  
4. CI 보고서(주간) 집계  

### 8.4 번역 업데이트
1. 번역자 PR → auth.json 변경  
2. CI: JSON Schema 검증 + placeholder 정합 검사  
3. Merge → versionHash 변경 → CDN purge / ETag 갱신  

### 8.5 Deprecated Key 제거
1. DeprecatedKey.removeAfter 도래 → build 스크립트 경고  
2. 여전히 사용 → 실패(Exit 1)  
3. 제거 완료 후 audit 기록  

### 8.6 Pseudo Locale
1. Nightly job en→en-XA 변환 (문자 확장)  
2. 렌더 폭/줄바꿈 문제 수동 검토 or screenshot diff  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Auth & User Management (사용자 preferredLanguage)
- Configuration & Environment (supportedLngs, defaultLng)
Downstream:
- Notification & Feedback (알림 메시지 key)
- Telemetry & Observability (locale 태깅)
- Core AI Engine (Explanation 템플릿 변환)
Cross:
- Testing & Quality (missing key test)
- Security & Compliance (PII masking - 번역 문자열 내 미삽입 검증)
외부:
- Translation Memory System (Phase4)
- CDN (locale chunk 캐싱)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 키 스파게티(네임 중복) | 유지보수 비용 | namespace 규칙 + lint 검증 |
| Missing Key 다발 | UX 저하 | CI 보고 + pseudo locale 테스트 |
| 번역 문자열 XSS | 보안 위험 | escapeValue false → 입력값 sanitize, no raw HTML |
| 번역 지연 | 릴리즈 늦어짐 | fallback + translation diff 레포트 |
| 번들 크기 증가 | 초기 로딩 지연 | 다이나믹 namespace load |
| Hard-coded 문자열 재발 | 누락 위험 증가 | eslint-plugin-i18n no-literals 룰 |
| placeholder 불일치 | 런타임 오류 | build-time placeholder validator |
| Fallback 과도 의존 | 현지화 부실 | fallbackUsageRate 모니터링 & 목표 설정 |
| pseudo locale 미사용 | 레이아웃 깨짐 미검출 | 주간 강제 CI job |
| 다국어 Sorting 문제 | 잘못된 정렬 | localeCompare 사용, test 케이스 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase3) | i18n 라이브러리 도입, ko/en 이중 번들 | ko↔en 전환 1s 이하, missing key 로그 수집 |
| M2 | Error / Notification 메시지 전면 키화 | 하드코딩 문구 검사 통과(0) |
| M3 | Missing/Unused Key CI Gate | 릴리즈 브랜치 missing key 0 |
| M4 | Placeholder Validator / Pseudo Locale | en-XA 렌더 스위트 통과 |
| M5 (Phase4) | 추가 언어(ja or zh) PoC | 번역 fallback 사용률 ≤ 5% |
| M6 | Translation Audit & 변경 기록 | 변경 로그 100% 캡처 |
| M7 | % Coverage Dashboard | coverage metric 95% 이상 |
| M8 (Phase5) | Tone Variation / AI Assist 초안 | tone param 적용 문구 10개 이상 |

Acceptance 예시(M3):
- build 단계 missing 0, unused ≤ 10(자동 deprecated tagging), 실패 조건 초과 시 CI fail

## 12. 향후 확장 계획 (Future Extensions)
- AI Translation Suggest + Human Review Queue  
- Dynamic Tone (formal|casual) 변형 파라미터  
- Domain Glossary Enforcement (기술 용어 통일)  
- Per-Workspace Locale Override  
- Real-time Translation Patch (Hot reload)  
- RTL 지원(아랍어/히브리어) 레이아웃 토글  
- Screen Reader Friendly Alternative Strings  
- QA Screenshot Diff (언어별 시각 회귀)  
- Key Usage Heatmap (인기/미사용 판단)  

---

내부 검토 체크리스트:
- eslint no-literal rule 도입 여부
- placeholder validator 구현 ( {count} / {name} 일치 )
- fallbackUsageRate 목표 수치 정의
- pseudo locale 변환 스크립트 명세
- TranslationAudit 저장소 선택 (DB / git tracked)

(끝)