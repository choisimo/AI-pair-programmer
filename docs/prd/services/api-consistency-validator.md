# API Consistency Validator PRD

## 1. 목적 및 범위 (Purpose & Scope)
API Consistency Validator는 프론트엔드/백엔드 간 API 계약(Contract) 및 내부 타입/인터페이스, DTO, GraphQL/REST 스키마 간 불일치(Drift)를 조기 탐지하고, 변경 영향(Breaking Impact)을 정량화하여 개발 흐름 초기에 경고·수정 제안을 제공하는 서비스이다.  
초기(Phase 1) 범위는 TypeScript Interface / Type Alias / Exported Function Signature 비교를 중심으로 하며, Phase 2에서 GraphQL Schema / OpenAPI Diff, Phase 3에서 예측(Predictive) 변경 영향 시뮬레이션을 확장한다.

## 2. 범위 제외 사항 (Out of Scope)
- 런타임 응답 페이로드 샘플링 기반 동적 스키마 추론 (Phase 3+)
- 비 TypeScript 언어(Go/Python) 계약 분석
- 인증/권한 정책(ACL/RBAC) 일관성 검증 (Security 서비스)
- 데이터 마이그레이션 자동 스크립트 생성
- 완전 자동 Fix Patch 머지 (사용자 승인 필수 원칙)

## 3. 현재 상태 (Current State)
- 계약 레지스트리(Registry) 미구현
- Interface/Function 변경 감지 기능 없음 (Code Analysis Pipeline 의존)
- Breaking Rule 세트 미정 (Semantic vs Cosmetic)
- 영향도(참조 수) 계산 메트릭 부재
- UI 표시/요약 포맷 미정

## 4. 기능 요구사항 (Functional Requirements)
FR-1: Code Analysis Pipeline에서 제공하는 Contract Hash 이벤트(Interface/Type 변동)를 구독한다.  
FR-2: 이전 버전(이전 해시)과 신규 버전 Diff를 구조적으로 분석한다 (추가/삭제/필드 타입 변경).  
FR-3: 변경을 Breaking / Non-breaking / Potential 로 분류한다.  
FR-4: Breaking 기준(기본): 필드 삭제, 필수 필드를 선택→필수로 변경, 반환 타입 축소(협소화), 매개변수 시그니처 파괴.  
FR-5: Diff 결과에 영향도 메트릭(참조 심볼 수, 호출 파일 수, 발생 라인 수)을 포함한다.  
FR-6: 동일 엔티티 연속 변경 시 Consolidation Window(예: 30초) 내 중복 알림 억제.  
FR-7: 제안(Suggestion) 형태로 Core AI Engine에 전달 (카테고리=api_consistency).  
FR-8: UI용 요약 포맷(“UserProfile.name: string → string | null (Non-breaking: 확장)”) 생성.  
FR-9: 규칙별 Severity 설정 (critical/high/medium/low) 및 사용자 정책 Override 지원(Phase 2).  
FR-10: 계약 레지스트리 스냅샷을 Workspace 기준 버전 태깅 가능 (Tag/Release).  
FR-11: Drift 발생 빈도, 해결(Closed) 시간 메트릭 수집.  
FR-12: API 변경 이벤트에 대해 자동 문서화 Diff Stub 제공 (Phase 3).

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 단일 인터페이스 200 필드 Diff 계산 P95 < 30ms
- 1000 인터페이스 배치 비교(스냅샷) P95 < 3s

신뢰성:
- 해시 불일치(오류) 재시도 3회 후 Fallback (Full Rescan 요청)
- Diff 분류 정확도 (수동 검증 세트 기준) ≥ 90% (Phase 2 목표)

확장성:
- 인터페이스 10k 규모에서 메모리 상주 인덱스 < 300MB
- Multi-workspace 격리 (Namespace Prefix)

보안:
- 계약 데이터 내 민감 키 패턴( password / token / secret ) 마스킹 로그 처리
- 외부 전송(LLM)에 필드 이름만 제한적 포함 (Phase 3 정책)

관찰성:
- diff_compute_latency_ms, breaking_count, potential_count 메트릭
- 알림 억제(dedup_suppressed) 카운터

접근성:
- UI 요약 문구 140자 내, 색상 외 아이콘/텍스트 병행

## 6. API/인터페이스 계약 (Interfaces)

### 6.1 Contract Hash 이벤트 (입력 - Pipeline)
```
{
  "type": "api_contract_change",
  "entityKind": "interface" | "typeAlias" | "function",
  "name": "UserProfile",
  "filePath": "src/models/user.ts",
  "previousHash": "abc123",
  "currentHash": "def789",
  "timestamp": 1737449400000
}
```

### 6.2 Diff 요청 (내부 재구성 필요 시)
```
{ "type": "contract_diff_request", "name": "UserProfile", "versionFrom": "abc123", "versionTo": "def789" }
```

### 6.3 Diff 응답 (내부)
```
{
  "type": "contract_diff",
  "name": "UserProfile",
  "breaking": true,
  "classification": "breaking",
  "changes": [
    { "kind": "removed_field", "field": "displayName", "severity": "high" },
    { "kind": "type_widened", "field": "role", "from": "'admin' | 'user'", "to": "string", "severity": "low" }
  ],
  "impact": {
    "referenceCount": 12,
    "referencingFiles": 4,
    "callSites": 0
  },
  "summary": "Removed field displayName (breaking), widened role (non-breaking)",
  "generatedAt": 1737449400200
}
```

### 6.4 Suggestion 전달 (Core Engine 연계)
```
{
  "type": "suggestions",
  "items": [
    {
      "id": "api_sg_1001",
      "category": "api_consistency",
      "ruleId": "api.breaking.removed_field",
      "message": "UserProfile.displayName 필드 제거는 호환성 파손 위험",
      "explain": "4개 파일에서 참조. 문서/사용 코드 업데이트 필요",
      "patch": null,
      "confidence": 0.93,
      "metadata": { "entity": "UserProfile", "field": "displayName" }
    }
  ]
}
```

### 6.5 Registry Snapshot Export
```
{
  "type": "contract_registry_snapshot",
  "workspaceId": "ws_1",
  "versionTag": "v0.3.0",
  "interfaces": [
    { "name":"UserProfile", "hash":"def789", "fields":[ {"name":"id","type":"string"} ] }
  ],
  "exportedAt": 1737449500000
}
```

### 오류 형식
```
{ "error": { "code":"DIFF_PARSE_FAIL", "message":"Previous version not found" } }
```

## 7. 데이터 모델 (Data Model)
엔티티:
- ContractVersion(id, name, kind, hash, filePath, createdAt, fieldCount)
- ContractField(id, contractVersionId, name, typeSig, optional, deprecated, tags[])
- ContractDiff(id, baseHash, targetHash, classification, breaking, summary, impactScore)
- ContractChange(id, diffId, changeKind, field, fromType?, toType?, severity)
- ImpactMetric(contractName, hash, referenceCount, referencingFiles, callSites, updatedAt)
- DedupWindowKey(contractName, hash, openedAt, expiresAt)

인덱스:
- ContractVersion(name + hash) unique
- ContractDiff(baseHash + targetHash)
- ImpactMetric(contractName + hash)
- ContractField(contractVersionId + name)

도출 필드:
- impactScore = referenceCount * (breaking ? 2 : 0.5) + (severityWeight 합산)

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)

### 8.1 Breaking Change 감지
1. Code Analysis Pipeline → api_contract_change 이벤트  
2. 이전/신규 해시 로드 → 구조 Diff  
3. Change Set → Classification (Ruleset)  
4. ImpactMetric 조회 (없으면 계산)  
5. Dedup Window 체크 (중복 알림 억제)  
6. Suggestion 이벤트 생성 → Core Engine → UI  
7. Telemetry 기록 (breaking_count++)  

### 8.2 Registry 스냅샷 태깅
1. 사용자(or CI) 태그 생성 요청  
2. 현재 최신 ContractVersion 집계  
3. Snapshot JSON Serialize → 저장  
4. Tag Index 추가, 감사 로그 기록  

### 8.3 Impact Recompute (수동/주기)
1. 변경 누적 > 임계치 → Recompute Queue  
2. 참조 그래프 조회 (Symbol Graph)  
3. Metrics 업데이트, diffs 재평가(옵션)  

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Code Analysis Pipeline (Interface 해시/심볼 참조)
- Auth & User Management (권한: 태깅/내보내기)
Downstream:
- Core AI Engine (Suggestion 통로)
- Telemetry & Observability (메트릭)
- Documentation Generator (필드 Diff 텍스트)
- Projects & Workspaces (Workspace 경계)

외부(미래):
- OpenAPI / GraphQL SDL 소스 (Phase 2)
- Git Provider (태그/릴리즈 정보 매핑)

구성 요소:
- Diff Engine (Structure Comparator)
- Severity Classifier
- Impact Evaluator
- Dedup Manager
- Registry Store (KV + Relational)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| 과잉 Breaking 분류 (False Positive) | 개발 피로 | 샘플·Ground Truth Suite + 사용자 Feedback Override |
| 참조 계산 비용 급증 | 성능 저하 | 캐시 Layer + Incremental 참조 업데이트 |
| 해시 충돌(이론상 낮음) | 잘못된 Diff | sha256 + 필드 소팅·정규화 |
| 중복 알림 스팸 | UX 저하 | Dedup Window + Merge Summary |
| 대형 Interface Diff 가독성 저하 | 이해 어려움 | 중요(Severity High) 5개 상단 요약 |
| Snapshot 태그 남용 | 저장소 부피 | 정책(최대 n/일) + LRU Cleanup |
| Graph 미동기 업데이트 시 Impact 오류 | 잘못된 우선순위 | GraphVersion 동기화 / Stale 버전 재시도 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- Interface/TypeAlias Diff (추가/삭제/타입변경)  
- Breaking 분류 규칙 최소 5개  
- Suggestion 생성 및 UI 전달  
수락: 테스트 피쳐 세트(>10 Diff)에서 정확도 ≥ 80%

M2:
- Function Signature Diff  
- ImpactMetric 기본 (referenceCount, files)  
- Dedup Window 구현  
수락: 중복 이벤트 50% 이상 억제

M3:
- GraphQL Schema / OpenAPI Diff (선택 한 종류)  
- Severity 사용자 커스터마이징  
- Snapshot 태깅 & Export  
수락: Snapshot Export 후 재현성(Hash 매칭) 100%

M4:
- Predictive Impact(변경 전 시뮬레이션 기본)  
- 문서 자동 Diff Narrative Stub  
수락: Narrative Stub 70% 이상 문서 리뷰 승인

## 12. 향후 확장 계획 (Future Extensions)
- Multi-language Signatures (Go struct → TS interface 매핑)
- Behavior Change Heuristics (함수 반환 타입 외 로직 변경 특징점)
- Drift Trend Dashboard (주간/월간 변화율)
- Policy-as-Code (조직 단위 Breaking 허용 정책)
- Risk Scoring (복합 지표: 영향 * 변경 빈도)
- Auto Fix Proposals (Deprecated 필드 마이그레이션 패턴)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20