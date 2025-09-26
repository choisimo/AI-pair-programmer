# Deployment & Ops Service PRD

문서 버전: v1.0 (초안)  
최초 작성: 2025-09-20  
상태: Draft (Phase 2 초기 자동화 목표)

---

## 1. 목적 및 범위 (Purpose & Scope)
Deployment & Ops 서비스는 애플리케이션(웹 클라이언트, API Gateway, Core AI Engine, Code Analysis Pipeline, Realtime, Telemetry 파이프라인)의 **빌드(Build), 배포(Deploy), 운영(Operate), 릴리즈(Release), 모니터링(Monitor)** 을 일관된 자동화 파이프라인으로 제공한다.  
핵심 목표:
1. 반복 가능(Repeatable)하고 선언적(Declarative)인 인프라/배포
2. 빠른 롤백 / 점진적 출시(Canary, Feature Flag 연계)
3. 관찰성(Telemetry) 및 성능 예산(Performance Budget) 연동
4. 보안/컴플라이언스 요구(Audit, Secret 관리) 내재화
5. 비용/성능/안정성 균형 (Scalable Worker & Queue 모델)

## 2. 범위 제외 사항 (Out of Scope)
- 세밀한 클라우드 비용 최적화(Reserved Instance 전략)
- 온프레미스 / 하이브리드 배치(Phase 5+ Enterprise)
- 완전한 GitOps(ArgoCD/Flux) 도입 (Phase 4)
- ML 모델 서빙 전용 인프라 세부 튜닝 (별도 ML Ops 문서)
- 대규모 Multi-region Active/Active (Phase 5+)

## 3. 현재 상태 (Current State)
- 프론트엔드 정적 빌드 가능 (Vite)
- 백엔드 서비스/워크플로 미구현
- CI/CD 파이프라인 정의 없음
- IaC(Terraform) / Helm 차트 / Secret 관리 전략 미정
- 모니터링/로그 수집/경보(Alerts) 파이프라인 미구축

## 4. 기능 요구사항 (Functional Requirements)
| ID | 요구 | 설명 |
|----|------|------|
| FR-1 | CI 파이프라인 | Lint → TypeCheck → Test → Build → Size Budget → Artifact 생성 |
| FR-2 | CD 전략 | main 머지 시 자동 Deploy (Preview → Staging → Prod 승인) |
| FR-3 | Preview 환경 | PR마다 임시 URL (자동 만료) |
| FR-4 | 환경 분리 | dev / preview / staging / production 네임스페이스 |
| FR-5 | IaC 정의 | Terraform (VPC, DB, Queue, Storage, Secrets) |
| FR-6 | 컨테이너 이미지 | 단일 repo 내 multi service build (docker buildx, layer cache) |
| FR-7 | 마이그레이션 실행 | DB schema migrate (idempotent) 전/후 Health Check |
| FR-8 | Canary 배포 (Phase3) | 5% → 25% → 100% 트래픽 전환 |
| FR-9 | 롤백 | 실패 시 마지막 정상 Artifact 즉시 재배포 (자동) |
| FR-10 | 헬스 체크 | /health (liveness) /ready (readiness) 분리 |
| FR-11 | 장애 격리 | Core AI Engine Worker 재시작 시 API 영향 최소화 (분리 서비스) |
| FR-12 | 로그 수집 | 구조화 JSON(Log Level, TraceId) → 중앙 Log Store |
| FR-13 | 메트릭 Export | Prometheus/OpenTelemetry → Telemetry 서비스 연계 |
| FR-14 | 비밀 관리 | 환경 변수 → (Phase3) Secret Provider Abstraction |
| FR-15 | 릴리즈 태깅 | Git tag + Changelog generate + SBOM 첨부 |
| FR-16 | SCA(라이브러리 취약점) | CI dependency audit 실패 시 차단 |
| FR-17 | 컨테이너 보안 스캔 | 이미지 스캔(Critical 취약점 차단) |
| FR-18 | 백업 전략 (Phase3) | DB 일일 스냅샷 + 7/30 보존 + 복구 테스트 |
| FR-19 | 스케일 아웃 | 워커 Autoscale (Queue length / CPU / Latency) |
| FR-20 | 배포 승인 게이트 | Staging → Prod 수동 승인 + 품질 메트릭 표시 |

## 5. 비기능 요구사항 (Non-Functional Requirements)
성능:
- CI 전체 소요(평균) ≤ 12분 (단위 테스트/빌드 포함)
- 프론트 빌드 캐시 히트 시 2분 내 완료  
신뢰성:
- 프로덕션 배포 실패율 < 3%
- 롤백 평균 시간(MTTR Deploy) < 5분  
가용성:
- API 가용성 Phase3 99% → Phase4 99.5% 목표  
보안:
- SBOM(Software Bill of Materials) 생성 및 저장
- 이미지 서명 (cosign) Phase3  
확장성:
- 대기열 기반 작업(분석/인덱싱) 워커 수 자동 확장 (지연 < 목표)
관찰성:
- 배포 이벤트 Telemetry(deploy.start, deploy.success, deploy.rollback)
데이터 안전:
- 마이그레이션 사전 Dry-run & Lock 보호
규정 준수:
- 감사 로그: 누가 언제 배포 승인했는지 기록
비용:
- Idle Worker scale down (5m 유휴)  
유지보수:
- IaC 변경 PR당 Plan 출력 & Diff 검증
테스트:
- Health Probe 시뮬레이션 E2E 파이프라인 단계
재현성:
- 빌드 결과 Artifact 해시 → 환경별 동일성 검증

## 6. API/인터페이스 계약 (Interfaces)
### 6.1 Health Check (예시)
GET /health  
```json
{ "status": "ok", "uptimeSec": 12345 }
```
GET /ready  
```json
{ "status": "ready", "dependencies": { "db": "ok", "queue": "ok" } }
```
### 6.2 배포 이벤트 Webhook (내부)
```json
{
  "event": "deploy.success",
  "service": "core-ai-engine",
  "env": "production",
  "commit": "abc123",
  "artifact": "core-ai-engine:1.2.0",
  "durationSec": 210
}
```
### 6.3 Autoscale Hint (Worker)
```json
{
  "queue": "analysis_jobs",
  "backlog": 420,
  "avgWaitMs": 8500,
  "currentWorkers": 6,
  "suggestedWorkers": 10
}
```
### 6.4 IaC Plan Summary (CI Artifact)
```json
{
  "add": 3,
  "change": 2,
  "destroy": 0,
  "riskLevel": "LOW"
}
```
### 6.5 Rollback Trigger (Manual API)
POST /api/ops/rollback
```json
{ "service":"api-gateway", "targetRelease":"2025-09-20_14-00" }
```

## 7. 데이터 모델 (Data Model)
엔티티:
- Deployment(id, service, env, commitSha, artifactRef, startedAt, finishedAt, status, triggeredBy, canaryPercent?, rollbackOf?)
- DeploymentMetric(id, deploymentId, latencyP95, errorRate, acceptRateDelta, collectedAt)
- ReleaseNote(id, version, commitRange, generatedAt, summary, sbomRef)
- RollbackEvent(id, sourceDeploymentId, triggeredAt, reason, actor)
- InfraChangePlan(id, planHash, added, changed, destroyed, riskLevel, createdAt)
- AutoscaleDecision(id, service, queue, backlog, suggestedWorkers, decidedWorkers, createdAt)
- BackupSnapshot(id, type(full|incremental), startedAt, durationSec, sizeMb, status)
- Incident(id, severity, startedAt, resolvedAt?, service, cause, postmortemLink?)
인덱스:
- Deployment(service, env, startedAt)
- AutoscaleDecision(queue, createdAt)
- Incident(service, startedAt)
보존:
- Deployment 365일
- AutoscaleDecision 90일
- BackupSnapshot 메타 180일
Derived Metrics:
- deploy_frequency = deployments(success)/week
- change_failure_rate = failedDeployments/totalDeployments
- mttr_deploy = avg(rollback duration)
- autoscale_accuracy = |suggested - decided| / suggested

## 8. 사용자 플로우 / 시퀀스 (Flows & Sequences)
### 8.1 기본 배포 (Staging)
1. main merge → CI 빌드 + 테스트
2. SBOM 생성 + 보안 스캔 (취약점 없음)
3. 컨테이너 푸시 (registry)
4. Terraform Plan (변경시 승인 필요)
5. Staging Deploy → health /ready 성공
6. Smoke Tests → Telemetry deploy.success

### 8.2 프로덕션 승격
1. Staging 성공 & 수동 승인(품질 메트릭 대시보드 확인)
2. Prod Canary 5% (10분) → 오류/latency 지표 정상
3. 25% → 100% 전환
4. 성공 → final deploy.success 이벤트

### 8.3 롤백
1. Latency/Error 임계 초과 Alert
2. 운영자: 최근 성공 Deployment 선택 → rollback API
3. Canary skip (긴급) → 이전 버전 readiness pass
4. rollback.success Telemetry + Incident 업데이트

### 8.4 Autoscale
1. Queue backlog / latency 수집
2. 정책(최소/최대/증분) 기반 결정
3. scale action → Worker 컨테이너 수 증가
4. 결정 기록 AutoscaleDecision 저장

### 8.5 마이그레이션
1. Deployment 시작 전 migrate dry-run
2. 실패 시 배포 중단
3. 성공 후 실제 migrate → readiness 재검증
4. Schema version Telemetry(report)

### 8.6 백업 (Phase3)
1. 스케줄러 일 1회 full / 시간단위 incremental
2. Snapshot 완료 → 무결성 검증(hash)
3. 실패 시 Alert + Retry 1회
4. 주간 복구 테스트 일부 샘플

## 9. 의존성 및 통합 (Dependencies & Integration)
Upstream:
- Configuration & Environment (환경 변수, feature flags)
- Security & Compliance (Secret 관리, 감사 로그)
Downstream:
- Telemetry & Observability (deploy / autoscale 이벤트)
- Performance Optimization (배포 전 성능 예산 검증)
- Testing & Quality (릴리즈 게이트 테스트 결과)
Cross:
- Auth & User (승인/롤백 권한)
- Projects & Workspaces (환경 분리된 데이터)
외부:
- Container Registry
- Terraform / Cloud Provider APIs
- CI 서비스 (GitHub Actions 등)
- Artifact Storage / SBOM Store
- Alerting 채널(Slack/Webhook)

## 10. 리스크 및 완화 방안 (Risks & Mitigations)
| 리스크 | 영향 | 완화 |
|--------|------|------|
| 미검증 마이그레이션 | 데이터 손상 | Dry-run + 백업 선행 |
| Canary 무시 전면 배포 | 대규모 장애 | 정책 강제(override audit) |
| 롤백 지연 | MTTR 증가 | 이전 Artifact 캐시 + 단일 명령 |
| Secret 노출 로그 | 보안 사고 | Redaction + 보안 스캔 |
| IaC Drift | 환경 불일치 | Terraform Plan 매 PR |
| Autoscale 과잉 | 비용 증가 | 상한선 & Cooldown |
| 취약 이미지 배포 | 보안 위험 | 이미지 스캔 Gate |
| 장기 빌드 캐시 오염 | 예측 불가 | 주기적 캐시 무효화 |
| Queue 폭증 처리 지연 | 사용자 경험 저하 | 우선순위 큐 + 긴급 워커 |
| Backup 무효(복구 불가) | 데이터 손실 | 정기 복구 연습 + 검증 해시 |

## 11. 마일스톤 및 수락 기준 (Milestones & Acceptance Criteria)
| Milestone | 범위 | 수락 기준 |
|-----------|------|-----------|
| M1 (Phase2) | CI(Build/Test/Lint) + Staging Deploy + Health | Staging 배포 평균 < 15m |
| M2 | Preview 환경 + IaC 기본 + Structured Logs | PR Preview 자동 URL, 7일 후 제거 |
| M3 | Prod 배포 + Canary + Rollback | Canary 지표 정상 후 자동 100% |
| M4 | Autoscale(Queue) + Metrics Export | 대기열 증가시 5분 내 처리율 정상화 |
| M5 (Phase3) | Backup + SBOM + 이미지 서명 | 복구 테스트 100% 성공 |
| M6 | Terraform Drift 감시 + 성능 게이트 | Drift 발견 시 CI 실패 |
| M7 (Phase4) | GitOps PoC + Multi-service Blue/Green | 무중단 전환 성공 |
| M8 | Cross-region Failover 계획 초안 | DR 문서 승인 |

Acceptance 예시(M3):
- 장애 시 롤백 명령 후 5분 내 이전 버전 readiness=ready
- Canary 5% 단계에서 Error Rate > 임계 → 자동 중단

## 12. 향후 확장 계획 (Future Extensions)
- GitOps (ArgoCD) 정식 도입 / Drift 실시간 감시  
- Progressive Delivery (Flag 기반 + 자동 메트릭 검증)  
- Multi-region Active/Passive DR 자동 전환  
- Automated Chaos Testing (Fault Injection)  
- Policy as Code(OPA) 배포 정책  
- KEDA 기반 이벤트 드리븐 Autoscale  
- Layered SBOM 비교(변경 위험 지표)  
- Supply Chain Security (SLSA Level 향상)  
- SLA/SLO Error Budget 추적 및 자동 Freeze  
- Green / Shadow Deploy 모델 비교 (AI Engine)  

---

내부 검토 체크리스트:
- Terraform 모듈 구조 확정(vpc, db, queue, storage)
- 배포 승인 절차 문서/역할(Role) 매핑
- Canary Abort 임계값(Error, Latency) 수치 정의
- Autoscale 정책: 지표, 최소/최대, 히스테리시스
- Backup 복구 테스트 주기 표준화

(끝)