# AI Pair Programmer PRD Overview

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 0 → Phase 1 전환 준비)

---

## 1. 프로덕트 비전 (Product Vision)
개발자가 IDE(브라우저 기반 Web IDE 또는 로컬 편집기 연계)에서 코드를 작성하는 전 과정(설계 → 구현 → 리팩터링 → 리뷰 → 유지보수)을 **지속적 코드 이해(Continuous Code Understanding)** 와 **맥락 일관 AI 지원(Context-Preserved AI Assistance)** 으로 가속·고도화하는 실시간 페어 파트너를 제공한다.  
핵심 가치는 다음 4축:
1. 신뢰(Trust): 예측 가능·근거·Explainability
2. 흐름(Flow): 인터럽션 최소화·Latency 감소·연속 제안
3. 품질(Quality): 코드 건강(Code Health)·일관성(Consistency) 강화
4. 협업(Collaboration): 팀 지식 공유·컨벤션 정렬

장기 목표: “단일 작업(함수 구현)” 수준이 아닌 “기능 단위(Feature Slice)”를 스스로 재구성·제안하고 위험(리그레션, API 파편화)을 사전 탐지하는 **Adaptive Engineering Copilot Workspace** 실현.

---

## 2. 제품 목표 (Product Objectives & KPIs)
| 목표 | 설명 | 대표 KPI (Phase별) |
| ---- | ---- | ------------------ |
| 개발 생산성 향상 | 반복/보일러플레이트 감소 | Phase1: 제안 적용률(Accept Rate) ≥ 25% → Phase3: ≥ 45% |
| 품질 안정화 | 린트/타입/계약 위반 감소 | 계약 위반 자동 탐지 후 평균 수정 시간(MTTR) 감소 30% |
| 맥락 유지 | 파일 이동/탭 전환 때 맥락 재구성 시간 최소화 | 제안 호출~응답 P95 < 2.0s |
| 팀 일관성 | API/패턴 편차 감소 | Breaking API 누락 검출 커버리지 ≥ 90% |
| 협업 강화 | 코드 변경 이해 공유 | 실시간 Presence 반영 지연 < 500ms |

추적 지표: 
- Suggestion Latency(P50/P95) 
- Suggestion Confidence Distribution
- Consistency Violations / Week
- Refactor Recommendation Adoption Rate
- Code Action Undo Ratio
- Notification Action Rate

---

## 3. 사용자 페르소나 (Personas)
| 페르소나 | 설명 | 1차 Pain Point | 핵심 가치 |
| -------- | ---- | -------------- | --------- |
| Individual Pro Dev | 중/대규모 TypeScript 프로젝트 유지보수 | 맥락 스위칭 비용 높음 | 빠른 국소 코드 제안 & 분석 |
| Tech Lead / Reviewer | 품질·일관성 보장 책임 | 리뷰 큐 길고 반복 코멘트 | 자동 일관성 검증 / Diff 인사이트 |
| Early Stage Startup Engineer | 속도·유연성 중시 | 도메인 지식 축적 부족 | 코드 베이스 가시화·의존 관계 파악 |
| DevRel / Educator | 패턴 교육·샘플 갱신 | 문서/코드 불일치 | 실시간 API 계약 검증 & 예시 싱크 |
| QA Automation Engineer | 시나리오 커버리지 확보 | 변경 영향 범위 불명확 | 변경 영향 그래프 & 리스크 포인트 |

---

## 4. 문제 정의 (Problem Definition)
현존 AI 코드 도구의 한계:
1. 단발성 프롬프트 → 응답: 지속적 상태(Stateful) 이해 부족  
2. 프로젝트 구조/빌드 메타데이터/타입 시스템의 정합 부족 → 잘못된 제안 빈도  
3. API 서명(Signature) 변경 / 컨벤션 위반 추적 어려움 → 런타임 오류 지연 발견  
4. 팀별 코드 스타일/Domain Pattern 반영 미흡  
5. 실시간 편집 협업(CRDT/Presence)과 AI 보조 통합 결여  

해결 전략:
- 증분 파서(Incremental Parser) & AST Delta Graph
- API Contract Registry + Diff Classification(Breaking/Non-breaking)
- 코드 행위 텔레메트리 기반 Suggestion Prioritization
- Consistency Validator + Refactor Candidate Extractor
- Realtime Presence + AI Suggestion Context Feed

---

## 5. 전체 시스템 아키텍처 (High-Level Architecture)
레이어 구분:
1. Client (React + TypeScript, Vite)  
   - App Shell / Routing / UI Foundation(shadcn 기반)  
   - Realtime Collaboration Subsystem (WebSocket/채널)  
   - Local AST Snapshot Cache & Pending Mutation Queue  
2. Edge / API Gateway  
   - Authentication / Session / Rate Limiting  
   - Feature Flag / Config Distribution  
3. Core AI Engine (모듈)
   - Context Builder (Symbol Graph / Dependency Graph / Recent Edit Window)  
   - Prompt Orchestrator & Strategy (Heuristic + Model Provider Abstraction)  
   - Suggestion Ranking & Filtering  
   - Explanation Layer (Rationale / Risk hint)  
4. Code Analysis Pipeline
   - Incremental Parser (TS / (미래) Python plugin)  
   - AST Normalization & Symbol Index  
   - Reference / Dependency Impact Analyzer  
   - Contract Extractor (API Signatures)  
5. API Consistency Validator
   - Contract Registry (Versioned)  
   - Diff Engine (Breaking Detection Rules)  
   - Linter / Build Hook Integration  
6. Data Access & State Layer
   - Query Caching (TanStack Query)  
   - Offline & Optimistic Mutation  
   - Event Bus (in-app)  
7. Telemetry & Observability
   - Metrics (Latency, Accept Rate)  
   - Structured Events (notification_shown, suggestion_accept)  
   - Error & Performance Traces  
8. Security & Compliance
   - Secure Token Exchange  
   - PII Redaction Pipeline (Prompt Sanitizer)  
9. Deployment & Ops
   - Containerized Services / IaC(Terraform 예정)  
   - Canary / Feature Flag Rollout  

아키텍처 다이어그램(개념):
Client ↔ Gateway ↔ (Core AI Engine / Analysis Pipeline / Consistency Validator / Telemetry Ingest / Auth Service / Storage)

---

## 6. 릴리즈 단계별 계획 (Release Phases Roadmap)
| Phase | 주요 초점 | 기능 범위 | NFR 목표 (대표) | 리스크 초점 |
| ----- | -------- | -------- | -------------- | ----------- |
| 0 (Current) | Landing & Foundation | UI Shell / Basic Sections / Toast | 빌드 속도 < 2s HMR | 아키텍처 과도 설계 |
| 1 | 초기 제안 & 코드 이해 기초 | Incremental Parsing / Simple AI Suggest / 기본 Consistency 체크 | Suggestion P95 < 3s | AST 정확도 |
| 2 | 실시간 협업 & 확장 분석 | Realtime Presence / Contract Diff / Refactor 후보 | Breaking Diff 검출 ≥ 80% | Sync 충돌 |
| 3 | 고도화 추천 & 품질 자동화 | Multi-step Suggestion / Risk Annotation / Notification Center | Accept Rate ≥ 35% | 모델 비용 |
| 4 | 팀 & 엔터프라이즈 | Policy Enforcement / Audit / i18n / Advanced Telemetry | SLA 가용성 99.5% | 컴플라이언스 |
| 5+ | 자율 최적화 | Auto Refactor Plans / Pattern Mining / Cross-lang | Accept Rate ≥ 45% | 과신(Hallucination) |

마일스톤 (요약):
- M1: 코드 파서 + 기본 Suggest Endpoint + Consistency Rule(함수 파라미터 수 변경 감지)
- M2: Realtime Cursor + Presence + Contract Registry Versioning
- M3: Ranked Suggestion + Refactor Recommendations + Notification Queue
- M4: Telemetry Dashboard + i18n + Performance Budget Enforcement
- M5: Security Hardening + Audit Logging + Policy-based Suggestion Filtering
- M6: Autonomous Refactor Draft Generation (PoC)

---

## 7. 상위 기능 요구사항 (High-Level Functional Requirements)
| ID | 요약 | 설명 |
| -- | ---- | ---- |
| HFR-1 | 증분 코드 모델 | 저장/편집 시 AST Delta 계산 후 Symbol Graph 갱신 |
| HFR-2 | 제안 생성 API | /suggest 호출 → Ranked 후보 N개 반환 |
| HFR-3 | API Diff 검출 | 계약 변경 발생 시 Breaking 여부 라벨링 |
| HFR-4 | 실시간 Presence | 편집중 커서/선택 영역 Broadcast |
| HFR-5 | 알림 & 피드백 | Toast/Inline/Dialog/Progress 패턴 표준 |
| HFR-6 | 상태 관리 | Query Caching + Optimistic Mutation 재시도 |
| HFR-7 | 텔레메트리 | Suggestion/Notification/Event 전송 & 집계 |
| HFR-8 | 보안 필터 | 민감 문자열 마스킹 및 전송 제한 |
| HFR-9 | 국제화 | 언어 키 기반 UI & 메시지 출력 |
| HFR-10 | 배포 전략 | 환경 분리(Dev/Preview/Prod) + Canary |

---

## 8. 비기능 요구사항 (Non-Functional Overview)
| 영역 | 초기(Target) | Phase 확장 |
| ---- | ------------ | ---------- |
| 성능(Latency) | Suggest P95 < 3s | Phase3 < 2s |
| 신뢰성(Reliability) | Uptime 99% | Phase4 99.5% |
| 확장성(Scalability) | 동시 세션 100 | Phase4 1k+ |
| 보안(Security) | 최소 토큰 보호 | Phase4 정책/감사 |
| 접근성(A11y) | WCAG 2.1 A | Phase3 AA |
| 국제화(i18n) | 한국어/영어 구조 준비 | Phase4 다국어 |
| 관찰성(Observability) | 핵심 이벤트 로깅 | Phase3 지표 대시보드 |
| 성능(클라이언트) | 초기 번들 < 300KB gzip | Phase3 코드 스플릿 |

---

## 9. 서비스 PRD 매핑 (Mapping to Detail Docs)
| 도메인 | 상세 PRD 파일 |
| ------ | ------------- |
| Core AI Engine | services/core-ai-engine.md |
| Realtime Collaboration | services/realtime-collaboration.md |
| Code Analysis Pipeline | services/code-analysis-pipeline.md |
| API Consistency Validator | services/api-consistency-validator.md |
| Data Access & State | services/data-access-and-state.md |
| UI Foundation | services/ui-foundation.md |
| Layout & Navigation | services/layout-navigation.md |
| Routing & Application Shell | services/routing-and-application-shell.md |
| Content Sections | services/content-sections.md |
| Notification & Feedback | services/notification-feedback.md |
| Auth & User Management | services/auth-and-user-management.md |
| Projects & Workspaces | services/projects-workspaces.md |
| Telemetry & Observability | services/telemetry-observability.md |
| Performance Optimization | services/performance-optimization.md |
| Testing & Quality | services/testing-quality.md |
| Configuration & Environment | services/configuration-and-environment.md |
| Internationalization | services/internationalization.md |
| Deployment & Ops | services/deployment-and-ops.md |
| Security & Compliance | services/security-and-compliance.md |

---

## 10. 교차 의존성 (Cross-Domain Dependencies)
| Source | Depends On | 목적 |
| ------ | ---------- | ---- |
| Core AI Engine | Code Analysis Pipeline | AST/Graph 공급 |
| Suggestion Ranking | Telemetry | 피드백 기반 가중치 |
| Consistency Validator | Contract Registry | Diff 비교 |
| Realtime Collaboration | Auth & User | 세션 식별 |
| Notification & Feedback | Telemetry | 이벤트 로깅 |
| Projects & Workspaces | Auth & User | 접근 제어 |
| Deployment & Ops | Configuration | 환경 변수 주입 |
| Internationalization | UI Foundation | 문자열 바인딩 |
| Security & Compliance | All Services | 데이터 보호/감사 |

---

## 11. 상위 리스크 및 완화 (Top Risks & Mitigations)
| 리스크 | 설명 | 완화 |
| ------ | ---- | ---- |
| AST 불일치 | 파서 장애 → 잘못된 제안 | Incremental Fallback → Full Parse |
| 모델 할루시네이션 | 컴파일 불가 코드 | 사전 타입 시뮬레이션 & Confidence Score |
| 성능 저하 | 대형 프로젝트 Graph 갱신 지연 | Lazy Segment Load + Cache Layer |
| API 차단 비용 | 잦은 Diff → 경보 피로 | 중요도 레벨 분류 (Critical/Info) |
| 협업 충돌 | 동시 수정 | Range Lock (Soft) + Merge Hint |
| 보안 유출 | Prompt에 민감 데이터 | 토큰/PII 정규식 마스킹 |
| 유지보수 복잡성 | 서비스 분할 과도 | 모듈 경계 SLA + 문서화 |
| 종속성 업데이트 | 라이브러리 Break | Renovate & Contract Test |

---

## 12. 성공 기준 (Success Criteria)
- 3개월 내: Beta 사용자 Accept Rate ≥ 20%, Suggest 오류(컴파일 실패) 비율 ≤ 15%  
- 6개월 내: Breaking API 변경 사전 탐지 커버리지 ≥ 85%, Refactor Recommendation Adoption ≥ 25%  
- 12개월 내: Enterprise Onboarding (SAML/OIDC) + Policy 기반 Suggestion Filtering 구현  
- 장기(24M): Auto Refactor Plan 생성(함수 단위) 평균 정확도 ≥ 60% 사용자 승인

---

## 13. 거버넌스 & 변경 관리 (Governance & Change Management)
- PRD 변경: Change Log (docs/prd/CHANGELOG.md 예정)  
- 버전 태깅: overview.md 상단 version + Semantic Increment (vMajor.Minor.Patch)  
- 수락 기준(AC) 미달 시 롤백 또는 Feature Flag 비활성화  
- 실험적 기능: experimental_ 접두 i.e. experimental.multiStepSuggest.enabled  

---

## 14. 용어 사전 (Glossary Snapshot)
| 용어 | 정의 |
| ---- | ---- |
| AST Delta | 이전/현재 AST 간 구조 차이 |
| Symbol Graph | 함수/클래스/모듈 간 참조 관계 그래프 |
| Contract Registry | Exported API Signature 버전 기록 저장소 |
| Suggestion Confidence | 제안 품질 사전 추정 점수 |
| Breaking Change | Downstream 컴파일/런타임 실패 초래 계약 변경 |
| Presence | 협업 세션 내 사용자 상태(커서, 선택 범위) |
| Refactor Recommendation | 구조적 개선(추상화, 분리) 제안 |
| Telemetry Event | 계측/행동 기록 구조화 데이터 |

---

## 15. 오픈 질문 (Open Questions)
| 질문 | 필요 결정 시점 | 비고 |
| ---- | ------------- | ---- |
| 모델 제공자(LLM) abstraction 형태? | Phase1 종료 전 | Adapter vs Plugin |
| 다국어 우선 대상 언어? | Phase3 이전 | EN/KO/JP 후보 |
| Enterprise 인증 표준(SSO/SAML/OIDC)? | Phase4 초기 | 고객 요구 수집 |
| 저장소 규모 한도 정책? | Phase2 | Large Repo Segmenting |
| Refactor 추천 Explain 표현 방식? | Phase3 | Diff+Text vs Tree Visual |

---

## 16. 향후 확장 (Future Evolution)
- Polyglot Language Support (Python, Go)  
- Graph 기반 Semantic Search + Natural Language Query  
- Risk Heatmap (변경 영향 시각화)  
- Policy-driven Auto Enforcement (Commit Gate)  
- Offline Local Model Fallback  
- Live Pair Review Mode (Reviewer & AI Co-triad)  

---

## 17. 마일스톤 상위 타임라인 (Quarter View 예시)
| 분기 | 목표 | 핵심 납품 |
| ---- | ---- | -------- |
| Q1 | Foundation | Parsing MVP / Suggest API / Basic Consistency |
| Q2 | Collaboration | Realtime Presence / Contract Registry / Telemetry Core |
| Q3 | Quality+ | Refactor Recommendations / Ranking Engine / Queue Notification |
| Q4 | Enterprise | i18n / Security Hardening / Deployment Automation |
| Q5+ | Intelligence | Multi-step Planning / Auto Refactor Draft / Policy Engine |

---

## 18. 승인 (Approval)
Stakeholders (Role → 상태):
- Product Lead: Pending  
- Engineering Lead: Pending  
- Security Reviewer: Pending  
- UX Lead: Pending  

---

(끝)