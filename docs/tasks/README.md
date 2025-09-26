# 작업 문서 가이드

## 1. 목적
이 디렉토리는 AI Pair Programmer 프로젝트의 구현 단위(Task)를 구조화하여 추적 가능성, 우선순위 관리, 의존성 해소, 모드별 실행 분리를 지원합니다.

## 2. 디렉토리 구조
```
docs/tasks/
├── README.md
├── master-task-list.md
├── task-template.md
└── services
    ├── p0-foundation
    ├── p1-scaling
    └── p2-advanced
```

## 3. 우선순위 정의
| 우선순위 | 의미 | 대표 특성 |
|----------|------|-----------|
| P0 | 필수 기반 | 아키텍처/보안/핵심 AI 파이프라인 |
| P1 | 제품 가용성 확장 | 협업, 워크스페이스, 성능 최적화 |
| P2 | 고도화 및 선택 기능 | 국제화, 고급 검증/AI 기능 |

## 4. 작업 ID 규칙
| 범위 | 구간 | 예시 |
|------|------|------|
| P0 | TASK-001 ~ TASK-099 | TASK-010 |
| P1 | TASK-101 ~ TASK-199 | TASK-145 |
| P2 | TASK-201 ~ TASK-299 | TASK-220 |

세분화: TASK-010-A, TASK-010-B 형태 (알파벳은 세부 분할).  
Epic 분할: 상위 Task 본문에 하위 Task 링크 목록 포함.

## 5. 의존성 표기
- 형식: ID 콤마 나열 (예: TASK-003, TASK-010-A)
- 정렬: 선행 → 병렬 그룹 → 후행
- 순환 금지 (발견 시 상위 Epic 재구성)

## 6. 모드별 역할
| 모드 | 역할 |
|------|------|
| architect | 아키텍처 설계, 상위 구조 결정 |
| code | 기능 구현 |
| debug | 오류 재현 및 수정 |
| documentation-writer | 문서/가이드 작성 |
| jest-test-engineer | 테스트 설계/구현 (Jest) |
| security-review | 보안 분석 및 개선 |
| devops | 배포/CI/CD/인프라 |
| project-research | 리서치/레퍼런스 구조 분석 |

## 7. 작성 흐름
1. 필요 작업 식별
2. task-template.md 복사 → 새 파일 생성
3. ID/우선순위/의존성 확정
4. master-task-list.md 표에 행 추가
5. 상태 진행: Planned → In Progress → Review → Done

## 8. 상태 필드 표준
Planned / In Progress / Blocked / Review / Done

## 9. 네이밍 규칙
- 파일명: 서비스명 kebab-case (예: core-ai-engine.md)
- 제목: 동사 + 목적 (예: "분석 파이프라인 초기 스캐폴드 구축")

## 10. 공통 Definition of Done
- 수락 기준 100% 충족
- 관련 테스트 작성 및 통과
- 문서/README 반영
- 린트/타입/보안 스캔 통과

## 11. 마스터 목록 관리
- 단일 진실 소스: master-task-list.md
- 정렬: 우선순위 → ID
- 완료 항목: Completed 섹션 이동 (삭제 금지)

## 12. 향후 확장 (Reserved)
- 자동 상태 대시보드
- 의존성 그래프 시각화
- 진행률 메트릭 (예상 vs 실제)

## 13. 관련 파일
- 템플릿: task-template.md
- 마스터 목록: master-task-list.md
