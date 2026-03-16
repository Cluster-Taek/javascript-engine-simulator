# JavaScript Engine Simulator — 개발 이력 정리

## 프로젝트 개요

JavaScript 엔진의 내부 동작(Tokenizer → Parser → Interpreter)을 단계별로 시각화하는 교육용 시뮬레이터.
추가로 이벤트 루프(비동기 런타임)와 이벤트 버블링/캡처링 시뮬레이터도 포함.

**기술 스택:** Next.js 16, TypeScript, Zustand, Monaco Editor, Framer Motion, next-intl, FSD 아키텍처

---

## 개발 순서

### Phase 1 — 초기 구축 (initial commit)

**포함된 기능:**

- Tokenizer: char-by-char 스캐너, `tokenize(source) → Token[]`
- Parser: 재귀 하강 + Pratt 파싱, `parse(tokens) → Program`
- Interpreter: Generator 기반 (`function*`), 매 실행 단계마다 `StepResult` yield
- Zustand vanilla store로 상태 관리 (parse, stepForward, run, pause, reset)
- Monaco 에디터 (dynamic import, SSR 비활성화)
- FSD 아키텍처 적용 (entities, features, widgets, shared 레이어)
- 비동기 런타임 시뮬레이터 (Event Loop, Task Queue, Microtask Queue, Web APIs)
- i18n 다국어 지원 (next-intl, 한국어/영어)
- 106개 테스트 (Vitest)

**아키텍처 결정 사항:**

- 엔진 로직은 `shared/lib/engine/`에 순수 TypeScript로 분리 (React 의존성 없음)
- `const enum` 사용 금지 → `isolatedModules: true` 제약으로 string union type 사용
- FSD 규칙: 같은 레이어 슬라이스 간 cross-import 금지 → 모든 패널을 `engine-dashboard` 위젯 내부에 배치
- i18n 미들웨어 파일명을 `proxy.ts`로 사용 (Next.js 16 `middleware.ts` 충돌 회피)

### Phase 2 — try/catch/finally, throw, 삼항 연산자

**요구사항:** 에러 핸들링 문법과 삼항 연산자 지원 추가

- 토크나이저에 `Try`, `Catch`, `Finally`, `Throw` 키워드 및 `?` 토큰 추가
- 파서에 `TryStatement`, `CatchClause`, `ThrowStatement`, `ConditionalExpression` 노드 추가
- 인터프리터에 try/catch/finally 실행 로직, throw 시그널, 삼항 평가 구현
- uncaught throw를 RuntimeError로 변환하여 에러 표시
- 예제 스니펫 추가 (Try/Catch, Ternary Operator)

### Phase 3 — 디버거 UX 개선

**요구사항:** VS Code 스타일의 디버깅 경험 제공

- **Step Back**: stepHistory 기반 상태 복원 (최대 500개 히스토리 제한)
- **Breakpoint**: Monaco 에디터 gutter 클릭으로 토글, 실행 중 자동 pause
- 실행 라인 하이라이트 (노란 화살표 + 배경색)
- 스니펫 변경 시 breakpoint 자동 클리어
- VS Code 스타일 아이콘 적용, running 중 속도 슬라이더 비활성화

### Phase 4 — 기타 개선

- Vercel Analytics 추가 (`@vercel/analytics`)
- 코드 에디터 수직 리사이즈 핸들 추가 (드래그로 에디터/콘솔 영역 비율 조절)

### Phase 5 — 호이스팅 및 TDZ 구현 (PR #1)

**요구사항:** JavaScript 호이스팅 동작을 정확히 재현

- `var` 선언을 중첩 블록(if/while/for/try) 내부에서 재귀적으로 수집 → function scope로 호이스팅
- `let`/`const`에 TDZ(Temporal Dead Zone) 구현: 초기화 전 접근 시 에러
- `new` 생성자 스코프를 `findFunctionScope()`에서 인식하도록 수정
- 함수 선언 호이스팅을 `let` → `var` 시맨틱으로 변경
- 테스트 9개 추가 (총 115개)

### Phase 6 — 이벤트 버블링/캡처링 시뮬레이터 (현재 브랜치)

**요구사항:** DOM 이벤트 전파 과정을 시각적으로 시뮬레이션

- 이벤트 전파 엔진 구현 (Capturing → Target → Bubbling 3단계)
- DOM 트리 시각화 및 라이브 프리뷰 컴포넌트
- 전파 경로 단계별 디버깅 컨트롤
- 시나리오 프리셋 및 이벤트 리스너 목록 패널
- i18n 다국어 메시지 추가

**버그 수정:**

- 전파 완료 시 노드 하이라이트가 타겟으로 되돌아가는 버그 → `propagation-complete` 스텝에서 `activeNodeId`/`activePhase`를 null로 초기화

---

## 주요 이슈 및 해결

| 이슈                              | 원인                                             | 해결                                                                             |
| --------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `const enum` 컴파일 에러          | `isolatedModules: true` 환경에서 const enum 불가 | string union type으로 대체                                                       |
| FSD 슬라이스 간 cross-import      | Steiger 린트 위반                                | snippets를 `shared/config`로 이동, 패널을 단일 위젯 내부에 배치                  |
| i18n 미들웨어 충돌                | Next.js 16의 `middleware.ts` 예약 파일명         | `proxy.ts`로 파일명 변경                                                         |
| FSD public API sidestep 경고      | `shared/config/i18n/`에서 직접 import            | 반드시 `@/shared/config` 경유하여 import하도록 통일                              |
| Step Back 메모리 이슈             | 무제한 히스토리 저장                             | stepHistory 최대 500개 제한                                                      |
| 전파 완료 후 하이라이트 복귀 버그 | `propagation-complete` 스텝에서 상태 초기화 누락 | `activeNodeId`/`activePhase`를 null로 설정, phase null일 때 캡처링 fallback 제거 |
| var 호이스팅 범위 오류            | 중첩 블록 내 var를 block scope로 처리            | 중첩 블록을 재귀적으로 탐색하여 function scope로 수집                            |
| TDZ 미구현                        | let/const 초기화 전 접근 허용                    | TDZ 플래그 추가, 초기화 전 접근 시 명확한 에러 메시지                            |

---

## 브랜치 구조

```
main ← e03b67f (코드 에디터 리사이즈까지)
├── feat/hoisting-tdz → PR #1로 머지 (aebdb70)
└── event-bubbling-simulator ← a2dea38 (현재 브랜치, 미머지)
```

---

## 사용 패키지 요약

| 패키지               | 버전  | 용도                                    |
| -------------------- | ----- | --------------------------------------- |
| zustand              | 5     | vanilla store + useStore hook           |
| @monaco-editor/react | 4     | 코드 에디터 (dynamic import, SSR off)   |
| motion               | 12    | 애니메이션 (import from 'motion/react') |
| next-intl            | 4.8.3 | i18n, path-based routing                |
| @vercel/analytics    | -     | 사용자 분석                             |
