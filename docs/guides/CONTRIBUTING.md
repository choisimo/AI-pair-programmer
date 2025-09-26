# Contributing to AI Pair Programmer

먼저, AI Pair Programmer에 기여하려고 하신 것에 감사드립니다! 🎉

다음은 프로젝트에 기여하는 방법에 대한 가이드라인입니다.

## 행동 강령

이 프로젝트에 참여함으로써, 귀하는 우리의 행동 강령을 준수하는 데 동의합니다.

## 기여 방법

### 🐛 버그 리포팅

버그를 발견하셨다면:

1. 먼저 [이슈 목록](https://github.com/your-org/ai-pair-programmer/issues)을 확인하여 이미 보고되었는지 확인하세요
2. 새로운 이슈라면, 이슈를 생성하고 다음 정보를 포함하세요:
   - 명확한 제목과 설명
   - 재현 가능한 단계
   - 예상 동작과 실제 동작
   - 스크린샷 (해당하는 경우)
   - 환경 정보 (OS, 브라우저, Node.js 버전 등)

### 💡 기능 제안

새로운 기능을 제안하려면:

1. [이슈 목록](https://github.com/your-org/ai-pair-programmer/issues)을 확인하여 유사한 제안이 있는지 확인하세요
2. 새로운 이슈를 생성하고 다음을 포함하세요:
   - 기능의 명확한 설명
   - 사용 사례와 이점
   - 가능한 구현 접근 방식

### 🔧 Pull Request 프로세스

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/ai-pair-programmer.git
   cd ai-pair-programmer
   ```

2. **브랜치 생성**
   ```bash
   git checkout -b feature/your-feature-name
   # 또는
   git checkout -b fix/issue-number
   ```

3. **개발 환경 설정**
   ```bash
   # 의존성 설치
   npm install
   
   # 환경 설정
   cp .env.example .env.local
   
   # 개발 서버 실행
   npm run dev
   ```

4. **변경사항 작성**
   - 코드 스타일 가이드를 따르세요
   - 테스트를 작성하거나 업데이트하세요
   - 문서를 업데이트하세요

5. **테스트 실행**
   ```bash
   # 모든 테스트 실행
   npm test
   
   # 특정 테스트 실행
   npm run test:unit
   npm run test:integration
   npm run test:security
   
   # 린트 체크
   npm run lint
   
   # 타입 체크
   npm run type-check
   ```

6. **커밋**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

7. **Push & PR 생성**
   ```bash
   git push origin feature/your-feature-name
   ```
   그 다음 GitHub에서 Pull Request를 생성하세요.

## 커밋 메시지 컨벤션

우리는 [Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다:

- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서만 변경
- `style:` 코드 의미에 영향을 주지 않는 변경 (공백, 포맷팅, 세미콜론 등)
- `refactor:` 버그를 수정하거나 기능을 추가하지 않는 코드 변경
- `perf:` 성능 개선
- `test:` 테스트 추가 또는 수정
- `chore:` 빌드 프로세스 또는 보조 도구 변경

예시:
```
feat: add real-time collaboration support
fix: resolve memory leak in context builder
docs: update API documentation
refactor: simplify symbol graph builder logic
test: add unit tests for PII redactor
```

## 코드 스타일

### TypeScript/JavaScript
- 함수형 프로그래밍 선호
- 명시적 타입 사용
- `async/await` 선호 (콜백이나 `.then()` 대신)
- 의미 있는 변수명 사용

### React
- 함수형 컴포넌트와 hooks 사용
- Props는 interface로 정의
- 컴포넌트는 단일 책임 원칙 준수

### CSS
- Tailwind CSS 유틸리티 클래스 사용
- 커스텀 CSS는 최소화
- 반응형 디자인 고려

## 테스트 가이드라인

### 단위 테스트
```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### 통합 테스트
- 실제 사용 시나리오 테스트
- 모킹은 최소화
- 엣지 케이스 포함

### 테스트 커버리지
- 새로운 코드는 최소 80% 커버리지 목표
- 중요 모듈은 90% 이상 커버리지 유지

## 문서화

### 코드 문서화
```typescript
/**
 * 컨텍스트 팩을 빌드합니다
 * @param filePath - 분석할 파일 경로
 * @param cursor - 현재 커서 위치
 * @param visibleRegion - 보이는 영역 (선택적)
 * @returns 빌드된 컨텍스트 팩
 * @throws {ContextBuildError} 컨텍스트 빌드 실패 시
 */
async function buildContext(
  filePath: string,
  cursor: Position,
  visibleRegion?: Range
): Promise<ContextPack> {
  // ...
}
```

### API 문서
- 모든 public API는 문서화
- 예제 코드 포함
- 매개변수와 반환값 명시

## 리뷰 프로세스

1. **자동 검사**: CI/CD 파이프라인이 자동으로 테스트와 린트 실행
2. **코드 리뷰**: 최소 1명의 메인테이너가 리뷰
3. **피드백 반영**: 리뷰 코멘트에 대응
4. **머지**: 모든 검사 통과 후 머지

## 릴리스 프로세스

- `main` 브랜치는 항상 배포 가능한 상태 유지
- `develop` 브랜치에서 기능 개발
- 버전은 [Semantic Versioning](https://semver.org/) 준수

## 도움 요청

질문이 있으시면:
- [Discussions](https://github.com/your-org/ai-pair-programmer/discussions) 활용
- Discord 채널 참여
- 이메일: support@aipairprogrammer.dev

## 라이선스

이 프로젝트에 기여함으로써, 귀하의 기여가 MIT 라이선스 하에 라이선스됨에 동의합니다.

---

감사합니다! 🚀
