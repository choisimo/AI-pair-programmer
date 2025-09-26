# Code Analysis Pipeline PRD

## 1. 목적 및 범위 (Purpose & Scope)
Code Analysis Pipeline은 소스 코드 변경을 실시간으로 수집·파싱·정규화하여 Core AI Engine 및 API Consistency Validator, Suggestion/Rule Engine, Telemetry 계층에 의미 있는 구조적/의미(Semantic) 데이터(추상 구문·타입·참조 그래프)를 제공하는 기반 처리 레이어이다.  
초기(Phase 1) 범위: TypeScript 코드베이스에 대해 Incremental Parsing + 기본 Symbol Graph + Interface/Type 추출 + 기본 Rule Hook.  
Phase 2 이후: Cross-file Call Graph, Data Flow (간단), 영향도(Impact) 계산 노출, Embedding 준비용 Normalized IR(Intermediate Representation) 확장.

## 2. 범위 제외 사항 (Out of Scope)
- 런타임 동적 트레이싱 (Runtime Instrumentation)
- 언어 다중 지원(Python/Go 등) – Phase 3 계획
- 고급 데이터 흐름(Def-Use, Taint) 분석 (Security 서비스로 이관 예정)
- 복잡한 Control Flow Graph 최적화
- 빌드 시스템 통합(Cache Reuse) 초반 도입 (후속)

## 3. 현재 상태 (Current State)
- 파이프라인 미구현
- AST/Type 추출 도구/전략 미선정 (ts-morph / TypeScript Compiler API 후보)
- Incremental Diff → Partial Rebuild 로직 미정
- Graph Schema 미정 (Symbol Node / Edge Type 표준화 필요)
- Telemetry 계측 포인트 미정

## 4. 기능 요구사항 (Functional Requirements)
FR-1: 파일 변경 이벤트 수신 시 AST 생성 또는 증분(AST Delta) 갱신을 수행한다.  
FR-2: 타입 정보(TypeChecker) 캐시를 재사용하며, 변경 영향 파일만 재평가한다.  
FR-3: Symbol Graph (Function, Class, Interface, Enum, TypeAlias, Variable) 노드를 구성한다.  
FR-4: Edge 종류: import, call(Phase 2), extend/implement, reference, export.  
FR-5: Interface/TypeSig 해시를 계산하고 Contract Registry에 전달 가능한 구조체 생성.  
FR-6: Parsing 오류 발생 시 Fallback: 이전 유효 AST + 오류 이벤트 발생 (Core에 알림).  
FR-7: 500 LOC 단위 변경에서 Parsing + Graph Refresh P95 < 120ms (Phase 1).  
FR-8: Graph 업데이트는 Atomic Versioning 적용 (graphVersion 증가).  
FR-9: Rule Engine Hook 인터페이스 제공 (AST Node 방문 / Symbol Completed 이벤트).  
FR-10: Graph Snapshot을 Core AI Engine이 요청 시 직렬화(JSON IR)로 제공.  
FR-11: 삭제된 파일/심볼은 Tombstone 플래그 → 정리(Compaction) 지연(배치) 처리.  
FR-12: Telemetry: parsing_latency_ms / graph_nodes / graph_edges / error_count 카운터 전송.

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- 증분 파싱 대상 파일 외 종속 파일 재파싱 비율 < 15% (Phase 1)
- 메모리 상주 Graph Heap 사용량: 50k Symbol 기준 < 250MB

신뢰성:
- Parsing Error Recovery 성공률 ≥ 95%
- Version Mismatch(동시 업데이트) 충돌률 < 0.5%

확장성:
- Repository 크기 5k 파일(평균 200 LOC) 초기 로드 ≤ 25s (Cold Load, Phase 2 목표)
- Sharding 준비: 워크스페이스 단위 분리

보안:
- 로깅 시 코드 내용(민감 가능) 직접 출력 금지(메타데이터 위주)
- External API 호출 없음 (로컬 처리 원칙)

관찰성:
- 단계별 시간 계측(파일 I/O, AST, TypeCheck, Graph Merge)
- 오류 클래스별 에러 코드 (PARSE_SYNTAX, TYPECHECK_FAIL, GRAPH_INTEGRITY)

접근성: (간접) — UI에 전달되는 디버그 메타는 요약 형태(라인 범위, 심볼 이름)

## 6. API/인터페이스 계약 (Interfaces)

### 6.1 입력 이벤트 (File Change)
```
{
  "type": "file_change",
  "filePath": "src/core/engine.ts",
  "language": "typescript",
  "changeKind": "incremental" | "full",
  "content": "<optional>",
  "patch": "<unified diff optional>",
  "timestamp": 1737449300000
}
```

### 6.2 파싱 결과 이벤트 (Internal Bus)
```
{
  "type": "ast_update",
  "filePath": "src/core/engine.ts",
  "astVersion": 145,
  "checksum": "sha256:...",
  "symbolsAdded": 5,
  "symbolsRemoved": 1,
  "errors": []
}
```

### 6.3 Graph Snapshot 요청/응답
Request:
```
{ "type": "graph_request", "scope": "workspace", "sinceVersion": 120 }
```
Response:
```
{
  "type": "graph_snapshot",
  "graphVersion": 145,
  "nodes": [{ "id":"sym_1", "kind":"function", "name":"parse", "file":"src/a.ts" }],
  "edges": [{ "from":"sym_1","to":"sym_9","type":"call"}],
  "contractHashes": [{ "symbol":"UserDTO","hash":"abc123" }]
}
```

### 6.4 오류 이벤트
```
{
  "type": "pipeline_error",
  "stage": "parsing" | "typecheck" | "graph_merge",
  "filePath": "src/core/engine.ts",
  "errorCode": "PARSE_SYNTAX",
  "message": "Unexpected token",
  "recoverable": true
}
```

### 6.5 Rule Hook 인터페이스 (Pseudo)
```ts
interface RuleHookContext {
  filePath: string
  ast: TsAst
  typeChecker: TsTypeChecker
  symbolGraph: SymbolGraph
  report(node: AstNode, finding: Partial<FindingInput>): void
}

type RuleHook = (ctx: RuleHookContext) => void
```

## 7. 데이터 모델 (Data Model)
엔티티:
- FileIndex(filePath, checksum, astVersion, symbolCount, lastUpdatedAt)
- SymbolNode(id, kind, name, filePath, range, modifiers, hash?, exported)
- Edge(id, from, to, type, createdAt)
- ContractHash(symbolName, filePath, interfaceVersion, hash, updatedAt)
- GraphVersion(version, createdAt, deltaSummary)
- ParseErrorLog(id, filePath, errorCode, recoverable, createdAt)

인덱스:
- SymbolNode(filePath + name)
- Edge(from + type), Edge(to + type)
- ContractHash(symbolName + hash)
- GraphVersion(version ascending)

TTL/정리:
- ParseErrorLog: 30일 보존
- Tombstoned SymbolNode: 7일 후 물리 삭제

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)

### 8.1 Incremental Update
1. file_change 수신  
2. Diff Parser → 영향 라인 범위 도출  
3. Partial AST 재생성  
4. TypeChecker incremental update  
5. Symbol Extraction & Hash → 변화 비교  
6. Graph Delta 계산 (Add/Remove edges)  
7. Contract 대상(interface/type) 변경 시 hash 이벤트 Emit  
8. Rule Hooks 실행 (Fast Path)  
9. ast_update, graph_delta 이벤트 Publish

### 8.2 Cold Workspace Load
1. 파일 목록 스캔 (I/O Queue)  
2. 병렬 AST 파싱 (워커 n개)  
3. Batch Type Resolution  
4. Symbol Graph Build (Topological Merge)  
5. Version = 1 스냅샷 Commit  
6. Ready 이벤트 Core Engine 알림

### 8.3 Recovery (Parse Error)
1. Parsing 실패 → pipeline_error(recoverable)  
2. 이전 유효 AST 유지  
3. 동일 파일 다음 변경 시 Full Re-parse Flag

### 8.4 Contract Hash 변화
1. Interface Symbol 해시 비교  
2. 변경 감지 → api_contract_change 이벤트로 Validator 전달

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- File System / Editor Client (파일 변경 소스)
- Auth (워크스페이스 접근 제어, 향후)
Downstream:
- Core AI Engine (Graph / Symbol Feed)
- API Consistency Validator (Contract Hash)
- Telemetry & Observability (Metrics)
- Performance Optimization (Prefetch / Lazy Build Trigger)

기술 선택 후보:
- TypeScript Compiler API + tsserver incremental
- ts-morph (개발 생산성) vs 직접 CompilerHost (성능) → Phase 1: ts-morph, Phase 2: 커스텀 전환 검토

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
| ------ | ---- | ---- |
| ts-morph 대규모 프로젝트 성능 저하 | 초기 로드 지연 | 파일 크기 임계치 경고 + 캐시 Warm 전략 |
| TypeChecker 재빌드 비용 과다 | 응답 지연 | Dependency Graph 기반 영향 집합 최소화 |
| Graph 동시 업데이트 Race | 데이터 불일치 | Versioned Merge + Mutex/Txn Queue |
| 잘못된 Symbol Hash | API Drift 탐지 오류 | Hash 테스트 벤치 (Fixture Set) |
| Memory Leak (AST Retain) | OOM 위험 | WeakMap + Periodic GC Trigger Hook |
| Full Re-parse 빈도 증가 | 성능 저하 | Incremental 실패 임계치 → 백오프 정책 |
| Rule Hook 무한 루프/지연 | 전체 파이프라인 블로킹 | 실행 타임아웃 + 격리 워커 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
M1:
- Incremental Parsing + Symbol Extraction
- GraphVersion 관리
- 3가지 Edge(import/export/extend)
- P95 증분 처리 < 200ms
수락: 데모 Repo(>20파일)에서 연속 5회 변경 모두 성공 처리

M2:
- Call Edge + Basic Impact Query
- Contract Hash 이벤트 연동
- Error Recovery 95% 성공
수락: Breaking Interface 케이스 감지 정확도 ≥ 85%

M3:
- Cross-file Call Graph 최적화
- Graph Snapshot Diff API
- Rule Hook Latency 계측
수락: Rule Hook 10개 삽입 후 평균 지연 < 50ms

M4:
- Embedding 준비용 Normalized IR Export
- Graph Compaction / Tombstone Clean
수락: 50k Symbol 환경 Heap 목표 내 유지

## 12. 향후 확장 계획 (Future Extensions)
- Data Flow / Side-effect Classification
- Unused Export / Dead Code 자동 감지
- Parallel Parsing Scheduler (Work-stealing)
- Multi-Language Adapter (LanguageService Abstraction)
- Persisted Graph (Warm Start)
- Semantic Change Classification (Refactor vs Behavior)

---
문서 버전: v1.0 (초안) / 최초 작성: 2025-09-20