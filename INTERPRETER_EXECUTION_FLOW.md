# JavaScript Engine Simulator — 인터프리터 단계별 실행 순서

## 전체 파이프라인 개요

```
Source Code (string)
    │
    ▼
┌─────────────────────────────┐
│  1. Tokenizer               │  tokenize(source) → Token[]
│     문자 단위 스캔            │  키워드, 식별자, 리터럴, 연산자 분류
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  2. Parser                  │  parse(tokens) → Program (AST)
│     재귀 하강 + Pratt 파싱   │  Statement[], Expression 트리 구성
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  3. AsyncRuntime            │  new AsyncRuntime(ast)
│     비동기 래퍼 생성          │  글로벌 환경 + Web API 내장함수 등록
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  4. interpret() Generator   │  function* interpret(program, globalEnv)
│     동기 코드 실행            │  yield StepResult per step
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  5. Event Loop              │  AsyncRuntime.run() 후반부
│     비동기 콜백 처리          │  Web API tick → microtask → task
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  6. Zustand Store           │  StepResult → 상태 업데이트
│     UI 패널 동기화            │  callStack, environments, closures, ...
└─────────────────────────────┘
```

---

## 1단계: Tokenizer (`tokenizer.ts`)

```
tokenize(source: string) → Token[]
```

- **문자 단위(char-by-char) 스캔** — `pos`, `line`, `column` 추적
- 공백/줄바꿈 건너뛰기, 주석(`//`, `/* */`) 건너뛰기
- 각 토큰에 `{ type, value, line, column }` 부여

| 토큰 타입     | 예시                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `Keyword`     | `function`, `let`, `const`, `var`, `if`, `for`, `return`, `async`, `await` |
| `Identifier`  | `fibonacci`, `counter`, `x`                                                |
| `Number`      | `42`, `3.14`                                                               |
| `String`      | `"hello"`, `'world'`                                                       |
| `Operator`    | `+`, `-`, `===`, `!==`, `=>`, `++`                                         |
| `Punctuation` | `(`, `)`, `{`, `}`, `;`, `,`                                               |

---

## 2단계: Parser (`parser.ts`)

```
parse(tokens: Token[]) → Program { type: 'Program', body: Statement[] }
```

- **재귀 하강(Recursive Descent)** — 문(Statement) 파싱
- **Pratt Parsing** — 연산자 우선순위 기반 표현식(Expression) 파싱

### 지원하는 Statement 노드

| AST 노드              | 구문                                           |
| --------------------- | ---------------------------------------------- |
| `VariableDeclaration` | `let x = 1`, `const y = 2`, `var z = 3`        |
| `FunctionDeclaration` | `function foo() {}`, `async function bar() {}` |
| `ReturnStatement`     | `return value`                                 |
| `IfStatement`         | `if / else if / else`                          |
| `WhileStatement`      | `while (cond) {}`                              |
| `ForStatement`        | `for (init; test; update) {}`                  |
| `BlockStatement`      | `{ ... }`                                      |
| `ExpressionStatement` | `foo()`, `x = 1`                               |
| `TryStatement`        | `try {} catch(e) {} finally {}`                |
| `ThrowStatement`      | `throw value`                                  |

### 지원하는 Expression 노드

| AST 노드                                                                               | 구문                                                                    |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NumericLiteral`, `StringLiteral`, `BooleanLiteral`, `NullLiteral`, `UndefinedLiteral` | 리터럴                                                                  |
| `Identifier`                                                                           | 변수 참조                                                               |
| `BinaryExpression`                                                                     | `+`, `-`, `*`, `/`, `%`, `<`, `>`, `<=`, `>=`, `==`, `!=`, `===`, `!==` |
| `LogicalExpression`                                                                    | `&&`, `\|\|`                                                            |
| `UnaryExpression`                                                                      | `!`, `-`, `+`                                                           |
| `ConditionalExpression`                                                                | `a ? b : c`                                                             |
| `AssignmentExpression`                                                                 | `=`, `+=`, `-=`                                                         |
| `UpdateExpression`                                                                     | `i++`, `i--`, `++i`, `--i`                                              |
| `CallExpression`                                                                       | `foo(a, b)`                                                             |
| `MemberExpression`                                                                     | `obj.prop`, `arr[i]`                                                    |
| `ArrayExpression`                                                                      | `[1, 2, 3]`                                                             |
| `ObjectExpression`                                                                     | `{ key: value }`                                                        |
| `ArrowFunctionExpression`                                                              | `(x) => x * 2`, `(x) => { return x; }`                                  |
| `NewExpression`                                                                        | `new Foo()`                                                             |
| `AwaitExpression`                                                                      | `await promise`                                                         |

---

## 3단계: AsyncRuntime 초기화 (`async-runtime.ts`)

```
new AsyncRuntime(program)
  └── run() 호출 시: createGlobalEnvWithAsync()
```

### 글로벌 환경 생성 순서

```
createGlobalEnvWithAsync()
├── createGlobalEnvironment()         ← 기본 글로벌 환경
│   ├── console.log (native-function)
│   └── Math 객체 (PI, floor, ceil, round, abs, max, min, sqrt, pow)
│
├── setTimeout (native-function)      ← Web API 등록
│   호출 시 → webApis[] 에 WebApiEntry push
│   delay를 tick으로 변환 (100ms = 1tick)
│
├── queueMicrotask (native-function)
│   호출 시 → microtaskQueue[] 에 QueueEntry push
│
├── Promise 생성자 + Promise.resolve
│   Promise.resolve(value) → 즉시 resolved 상태의 PromiseValue
│   .then(callback) → resolved면 즉시 microtaskQueue에 push
│                    → pending이면 thenCallbacks에 등록
│
└── fetch (native-function)           ← 모의(mock) 구현
    호출 시 → webApis[] 에 3tick 짜리 WebApiEntry push
    완료 시 → { status: 200, ok: true, url: ... } 응답 resolve
```

---

## 4단계: interpret() — 동기 코드 실행 (`interpreter.ts`)

```
function* interpret(program: Program, globalEnv: Environment)
  → Generator<StepResult, RuntimeValue, void>
```

### 4.1 초기화

```
interpret() 진입
├── callStack = []                    콜 스택
├── consoleOutput = []                콘솔 출력 버퍼
├── envStack = [globalEnv]            환경 스택 (활성 스코프 추적)
├── environmentRegistry = Map         모든 환경을 ID로 추적 (힙 스냅샷용)
│   └── globalEnv 등록
├── closureRegistry = Map             클로저 추적 (alive/freed 판정용)
├── globalFrame 생성 → callStack에 push
└── yield "Program start"
```

### 4.2 executeBlock — 블록 실행 (핵심)

모든 블록(`{ ... }`)은 이 함수를 통과합니다. 프로그램 최상위, 함수 body, if/while/for body 등.

```
executeBlock(body: Statement[], env: Environment)
│
├── ① hoistVars(body, env)
│   └── collectVarDeclarations(): 재귀적으로 var 선언 수집
│       탐색 범위: BlockStatement, IfStatement(양쪽),
│                  WhileStatement, ForStatement(init + body),
│                  TryStatement(block + handler + finalizer)
│       ↓
│       env.declareVarIfAbsent(name)
│       → findFunctionScope()에서 가장 가까운 함수/글로벌 스코프 탐색
│       → 해당 스코프에 undefined로 선언 (이미 있으면 무시)
│
├── ② hoistLetConst(body, env)
│   └── 현재 블록의 직속 let/const만 탐색 (재귀 X — 블록 스코프)
│       env.declareTDZ(name, kind)
│       → initialized: false 상태로 등록
│       → 접근 시 "Cannot access before initialization" 에러
│
├── ③ FunctionDeclaration 호이스팅
│   └── body에서 FunctionDeclaration만 순회
│       FunctionValue 생성 {
│         kind: 'function',
│         id: nextFunctionId(),
│         name: stmt.id.name,
│         params: [...],
│         body: stmt.body,
│         closure: env          ← 현재 환경을 클로저로 캡처
│       }
│       registerClosure(fnVal)  ← closureRegistry에 등록 (글로벌 제외)
│       env.declare(name, 'var', fnVal)  ← 값까지 할당
│
├── yield "Hoisting: let x, const y (TDZ)"     (TDZ가 있을 때만)
│
└── body의 각 Statement를 순서대로 실행
    └── FunctionDeclaration은 skip (③에서 이미 처리)
```

### 4.3 호이스팅 비교

|                  | `var`                          | `let` / `const`  | `function` 선언       |
| ---------------- | ------------------------------ | ---------------- | --------------------- |
| **탐색 범위**    | 재귀 (중첩 블록 포함)          | 현재 블록만      | 현재 블록만           |
| **등록 위치**    | 가장 가까운 함수/글로벌 스코프 | 현재 블록 스코프 | 현재 블록 스코프      |
| **초기값**       | `undefined`                    | TDZ (접근 불가)  | 실제 함수 객체        |
| **선언 전 접근** | 가능 (`undefined`)             | `ReferenceError` | 가능 (함수 호출 가능) |

### 4.4 executeStatement — 문 실행 분기

```
executeStatement(stmt, env)
│
├── VariableDeclaration
│   ├── init 표현식이 있으면 evaluateExpression()
│   ├── let/const: env.hasOwn(name)이면 initialize(), 아니면 declare()
│   ├── var: env.assign(name, value)  (이미 hoistVars에서 선언됨)
│   └── yield "Declared let x = 10"
│
├── FunctionDeclaration
│   └── 이미 호이스팅됨, yield "Function declared: foo"만 출력
│
├── ReturnStatement
│   ├── argument 평가
│   ├── yield "return value"
│   └── throw ReturnSignal(value)    ← 호출자의 catch에서 포착
│
├── IfStatement
│   ├── test 표현식 평가
│   ├── yield "if condition: true → true branch"
│   └── true면 consequent, false면 alternate 블록 실행
│       (각 분기에 새 환경 생성: 'if-then' / 'if-else')
│
├── WhileStatement
│   ├── 최대 1000 반복 (무한루프 방지)
│   ├── 매 반복: test 평가 → yield → body 실행
│   ├── body마다 새 환경: 'while-body'
│   └── BreakSignal → 즉시 탈출, ContinueSignal → 다음 반복
│
├── ForStatement                     ← 아래 4.5에서 상세 설명
│
├── BlockStatement
│   └── createTrackedEnv('block', env) → executeBlock
│
├── ExpressionStatement
│   └── evaluateExpression(expr, env)
│
├── TryStatement                     ← 아래 4.7에서 상세 설명
│
└── ThrowStatement
    ├── argument 평가
    ├── yield "throw value"
    └── throw ThrowSignal(value)
```

### 4.5 ForStatement — 블록 스코핑 상세

```
executeForStatement(stmt, env)
│
├── loopEnv = createTrackedEnv('for-init', env)
│
├── isBlockScoped 판정
│   └── init이 let/const VariableDeclaration인지 확인
│
├── blockScopedVars[] 수집  (let/const인 경우의 변수명들)
│
├── init 실행 (loopEnv에서)
│
└── 반복 루프 (최대 1000회)
    │
    ├── test 평가 → yield "for condition: true/false"
    │
    ├── [let/const인 경우] 반복별 환경 생성
    │   iterationEnv = createTrackedEnv('for-iteration', env)  ← 부모는 외부 env!
    │   blockScopedVars 각각: loopEnv에서 현재값 읽어서 iterationEnv에 declare
    │   → 각 반복마다 독립 스코프 생성 (클로저가 각각의 값을 캡처)
    │
    ├── [var인 경우] iterationEnv = loopEnv (공유)
    │
    ├── bodyEnv = createTrackedEnv('for-body', iterationEnv)
    │   └── executeBlock(body, bodyEnv)
    │
    ├── [let/const인 경우] body 실행 후
    │   iterationEnv의 변경된 값 → loopEnv로 역복사 (update용)
    │
    └── update 표현식 실행 (i++ 등)
```

**var vs let 루프 환경 차이:**

```
for (var i = 0; i < 3; i++) { ... }
→ 모든 반복이 같은 loopEnv의 i를 공유
→ 클로저가 i를 캡처하면 최종값(3)만 보임

for (let i = 0; i < 3; i++) { ... }
→ 반복마다 새 for-iteration 환경 생성, i 값 복사
→ 클로저가 각 반복의 고유한 i를 캡처
```

### 4.6 evaluateExpression — 표현식 평가

```
evaluateExpression(expr, env)
│
├── 리터럴 (즉시 반환)
│   NumericLiteral  → { kind: 'number', value }
│   StringLiteral   → { kind: 'string', value }
│   BooleanLiteral  → { kind: 'boolean', value }
│   NullLiteral     → { kind: 'null' }
│   UndefinedLiteral → { kind: 'undefined' }
│
├── Identifier
│   └── env.resolve(name)
│       현재 env.bindings에서 탐색
│       → 없으면 parent.resolve(name) (스코프 체인 탐색)
│       → TDZ면 ReferenceError
│       → 끝까지 없으면 ReferenceError
│
├── BinaryExpression
│   ├── left 평가 → right 평가
│   └── 연산자별 처리 (+, -, *, /, %, <, >, <=, >=, ==, !=, ===, !==)
│       + 연산: string이 하나라도 있으면 문자열 연결
│
├── LogicalExpression
│   ├── &&: left가 falsy면 left 반환 (단축 평가), truthy면 right 평가
│   └── ||: left가 truthy면 left 반환, falsy면 right 평가
│
├── UnaryExpression
│   └── !expr, -expr, +expr
│
├── ConditionalExpression (삼항)
│   ├── test 평가
│   ├── yield "ternary: value → consequent/alternate"
│   └── truthy면 consequent, falsy면 alternate
│
├── AssignmentExpression
│   ├── Identifier 좌변: env.assign(name, value)
│   │   (assign은 스코프 체인을 따라 올라가며 해당 바인딩을 찾아 수정)
│   ├── MemberExpression 좌변: obj.properties.set / arr[idx] = value
│   └── yield "x = value"
│
├── UpdateExpression
│   ├── env.resolve → 현재값 → ±1 → env.assign
│   ├── yield "i++ → newValue"
│   └── prefix면 newVal 반환, postfix면 oldVal 반환
│
├── CallExpression                   ← 아래 4.7에서 상세 설명
│
├── MemberExpression
│   ├── object 평가
│   ├── computed면 property 표현식 평가, 아니면 Identifier.name
│   ├── object.kind === 'object' → properties.get(key)
│   ├── object.kind === 'array'
│   │   ├── 'length' → elements.length
│   │   ├── 숫자 인덱스 → elements[idx]
│   │   └── 'push', 'pop' → native-function 반환
│   ├── object.kind === 'string' → 'length' 지원
│   └── object.kind === 'promise' → methods.get(key) (.then)
│
├── ArrayExpression
│   └── 각 요소 평가 → { kind: 'array', elements: [...] }
│
├── ObjectExpression
│   └── 각 프로퍼티 key-value 평가 → { kind: 'object', properties: Map }
│
├── ArrowFunctionExpression
│   ├── expression body면 ReturnStatement로 래핑
│   ├── FunctionValue 생성 (name: '<arrow>', closure: env)
│   └── registerClosure()
│
├── FunctionDeclaration (표현식 위치)
│   └── FunctionValue 생성 + registerClosure()
│
├── NewExpression
│   ├── callee 평가 → args 평가
│   ├── native-function이면 즉시 호출
│   ├── function이면: fnEnv 생성 → callStack/envStack push
│   │   → body 실행 → callStack/envStack pop
│   └── yield "new Foo(args)"
│
└── AwaitExpression
    ├── argument 평가
    ├── promise가 아니면 값 그대로 반환
    └── yield "await: 비동기 대기" → throw AwaitSignal(promise)
```

### 4.7 함수 호출 흐름 (CallExpression)

```
evaluateCallExpression(expr, env)
│
├── [특수 케이스] console.log
│   ├── args 평가
│   ├── string이면 값 그대로, 아니면 runtimeValueToString()
│   ├── consoleOutput[] 에 push
│   └── yield "console.log: output"
│
├── callee 평가 (MemberExpression이면 별도 처리)
├── args 각각 평가
│
├── [native-function]
│   └── callee.call(args) → 즉시 반환 (Math.*, Array.push 등)
│
├── [async function]
│   ├── PromiseValue 생성 (pending 상태)
│   ├── fnEnv = createTrackedEnv('function:name', callee.closure)
│   │   └── ↑ callee.closure = 함수가 정의된 시점의 환경 (렉시컬 스코프!)
│   ├── params를 fnEnv에 declare
│   ├── callStack.push(frame) + envStack.push(fnEnv)
│   ├── yield "Calling async function: name(args)"
│   ├── executeBlock(body, fnEnv)
│   │   ├── 정상 완료 → promise.state = 'resolved'
│   │   ├── ReturnSignal → promise.state = 'resolved', value 설정
│   │   └── AwaitSignal →
│   │       ├── continuation 함수 생성 (남은 statements + 캡처된 env)
│   │       ├── e.promise.thenCallbacks에 continuation 등록
│   │       ├── callStack/envStack pop
│   │       └── yield "Async function suspended at await"
│   ├── callStack.pop() + envStack.pop()
│   └── yield "Async function completed" → PromiseValue 반환
│
└── [sync function]
    ├── fnEnv = createTrackedEnv('function:name', callee.closure)
    │   └── ↑ 렉시컬 스코핑: 호출 위치가 아닌, 정의 위치의 환경을 부모로 설정
    ├── params를 fnEnv에 declare ('let'으로)
    ├── callStack.push(frame) + envStack.push(fnEnv)
    ├── yield "Calling function: name(args)"
    ├── executeBlock(body, fnEnv)
    │   ├── 정상 완료 → returnValue = undefined
    │   └── ReturnSignal catch → returnValue = signal.value
    ├── callStack.pop() + envStack.pop()
    └── yield "Function name returned: value"
```

### 4.8 TryStatement 실행

```
executeTryStatement(stmt, env)
│
├── yield "Entering try block"
│
├── try 블록 실행: executeBlock(block.body, createTrackedEnv('try', env))
│   │
│   ├── ThrowSignal catch → caughtError 설정
│   ├── RuntimeError catch → string으로 변환 후 caughtError 설정
│   └── ReturnSignal / BreakSignal / ContinueSignal / AwaitSignal
│       → finally 있으면 먼저 실행 후 재throw
│
├── catch 블록 (caughtError가 있고 handler가 있을 때)
│   ├── catchEnv = createTrackedEnv('catch', env)
│   ├── catch 파라미터(e)를 catchEnv에 declare
│   ├── yield "Caught: errorValue"
│   └── executeBlock(handler.body, catchEnv)
│
└── finally 블록 (항상 실행)
    ├── yield "Entering finally block"
    └── executeBlock(finalizer.body, createTrackedEnv('finally', env))
```

### 4.9 제어 흐름 시그널 체계

인터프리터는 `throw`를 사용해 비정상 제어 흐름을 처리합니다:

| 시그널           | 발생 시점          | 포착 위치                        |
| ---------------- | ------------------ | -------------------------------- |
| `ReturnSignal`   | `return` 문 실행   | `evaluateCallExpression`의 catch |
| `BreakSignal`    | `break` 문 실행    | `while`/`for` 루프의 catch       |
| `ContinueSignal` | `continue` 문 실행 | `while`/`for` 루프의 catch       |
| `ThrowSignal`    | `throw` 문 실행    | `TryStatement`의 catch           |
| `AwaitSignal`    | `await expr` 실행  | async 함수 호출의 catch          |

---

## 5단계: Event Loop — 비동기 처리 (`async-runtime.ts`)

### Phase 1: 메인 스크립트 실행

```
AsyncRuntime.run()
├── interpret(program, globalEnv) 제너레이터 생성
├── 매 step yield마다:
│   └── asyncSnapshot 첨부 (webApis, taskQueue, microtaskQueue, eventLoopPhase)
├── 메인 스크립트 완료
└── yield "Main script complete. Call stack is empty. Event loop begins."
```

### Phase 2: 이벤트 루프 (최대 100회 반복)

```
while (webApis.length > 0 || taskQueue.length > 0 || microtaskQueue.length > 0)
│
├── ① eventLoopPhase = 'checking-stack'
│
├── ② Web API Tick
│   ├── 모든 webApis의 remainingTicks--
│   ├── remainingTicks ≤ 0인 항목 → completed[]로 이동
│   ├── webApis에서 제거
│   └── yield "Web API tick: setTimeout(200ms) (1 ticks left)"
│
├── ③ 완료된 Web API → Task Queue로 이동
│   ├── completed 각각에 대해 QueueEntry 생성
│   ├── taskQueue에 push
│   └── yield "Web API completed: setTimeout(200ms) → callback moved to Task Queue"
│
├── ④ eventLoopPhase = 'draining-microtasks'
│   └── microtaskQueue 전부 소진 (FIFO)
│       ├── microtask = microtaskQueue.shift()
│       ├── yield "Microtask dequeued: label"
│       └── executeCallback(microtask, env)
│           ├── native-function → 즉시 실행
│           └── FunctionValue →
│               ├── callbackEnv 생성 (closure 기반)
│               ├── miniProgram으로 래핑
│               ├── interpret(miniProgram, callbackEnv) 실행
│               └── 내부에서 또 AwaitSignal 발생 시
│                   → continuation 생성 → promise.thenCallbacks 등록
│
├── ⑤ eventLoopPhase = 'picking-task'
│   └── taskQueue에서 1개만 꺼내기 (FIFO)
│       ├── task = taskQueue.shift()
│       ├── yield "Task dequeued: label"
│       └── executeCallback(task, env)
│           (콜백 실행 중 queueMicrotask 호출 가능 → 다음 루프에서 처리)
│
└── ⑥ eventLoopPhase = 'idle'
    (다음 반복으로)

최종:
yield "All tasks completed. Event loop is empty."
```

### 이벤트 루프 우선순위

```
1. Microtask Queue 전부 소진 (Promise.then, queueMicrotask)
2. Task Queue에서 1개만 꺼내 실행 (setTimeout callback)
3. 다시 1번으로 (새로 추가된 microtask부터)
```

---

## 6단계: 스코프와 환경 관리 (`environment.ts`)

### Environment 클래스 구조

```
Environment {
  id: string              고유 ID (env-1, env-2, ...)
  label: string           "global", "function:foo", "for-init", "for-iteration", ...
  bindings: Map<string, Binding>
  parent: Environment | null   ← 스코프 체인 (렉시컬 스코핑)
}

Binding {
  value: RuntimeValue
  mutable: boolean        const면 false
  kind: 'var' | 'let' | 'const'
  builtin?: boolean
  initialized: boolean    TDZ면 false
}
```

### 환경 생성 시점과 라벨

| 라벨                        | 생성 시점                           |
| --------------------------- | ----------------------------------- |
| `global`                    | 프로그램 시작                       |
| `function:name`             | 함수 호출 시                        |
| `new:name`                  | new 키워드로 생성자 호출 시         |
| `block`                     | `{ }` 블록 진입                     |
| `for-init`                  | for 루프 시작 (init 변수용)         |
| `for-iteration`             | for 루프 매 반복 (let/const일 때만) |
| `for-body`                  | for 루프 body                       |
| `while-body`                | while 루프 body                     |
| `if-then` / `if-else`       | if/else 분기                        |
| `try` / `catch` / `finally` | 예외 처리 블록                      |
| `callback:name`             | 비동기 콜백 실행 시                 |

### 변수 탐색 (resolve)

```
env.resolve(name)
├── 현재 bindings에서 탐색
│   ├── 찾음 + initialized → 값 반환
│   ├── 찾음 + !initialized → ReferenceError (TDZ)
│   └── 못 찾음 → parent.resolve(name)   ← 스코프 체인 상위로
└── parent === null → ReferenceError: 'name' is not defined
```

### var의 함수 스코프 등록 (findFunctionScope)

```
env.declare(name, 'var', value)
└── findFunctionScope()
    현재 env.label이 'function:*' / 'new:*' / 'global'이면 → 현재 env
    아니면 → parent.findFunctionScope()    ← 가장 가까운 함수 스코프까지 올라감
    → 해당 스코프의 bindings에 등록
```

---

## 7단계: 클로저 & 힙 스냅샷 추적

### 클로저 등록

```
registerClosure(fn: FunctionValue)
├── fn.closure가 global이면 → 무시 (클로저 아님)
└── closureRegistry에 등록: { id, functionName, capturedEnv }
```

### 클로저 스냅샷 생성 (매 스텝)

```
buildClosureSnapshots()
├── collectReachableFnIds()
│   envStack의 모든 환경 + 바인딩의 함수값 → 재귀 탐색
│   → 도달 가능한 함수 ID 집합
│
└── closureRegistry 순회:
    ├── reachable → status: 'alive'   (변수에서 참조 가능)
    └── unreachable → status: 'freed' (GC 대상)
```

### 힙 스냅샷 생성 (매 스텝)

```
buildHeapSnapshot()
├── activeEnvIds = envStack에 있는 환경들
├── reachableFnIds = collectReachableFnIds()
├── retainedEnvIds = alive 클로저가 참조하는 환경 체인 전부
│
└── environmentRegistry 전체 순회:
    ├── envStack 위 → status: 'active' (초록)
    ├── 클로저가 참조 → status: 'retained' (앰버)
    └── 아무도 참조 안 함 → status: 'collected' (회색, GC 대상)
```

---

## 8단계: StepResult — 매 스텝의 출력

```
createStep(kind, description, env, node?, value?)
→ StepResult {
    id: string                     고유 스텝 ID
    kind: StepKind                 26가지 종류
    description: string            사람이 읽을 수 있는 설명
    node?: AstNode                 관련 AST 노드
    loc?: SourceLocation           소스 코드 위치 (line, column)
    value?: RuntimeValue           해당 스텝의 결과값
    environments: EnvironmentSnapshot[]   현재 스코프 체인 스냅샷
    callStack: StackFrame[]        콜 스택 복사
    consoleOutput: string[]        콘솔 출력 복사
    closures: ClosureSnapshot[]    클로저 alive/freed 상태
    heapSnapshot?: HeapEnvironmentSnapshot[]  전체 환경 active/retained/collected
    asyncSnapshot?: AsyncRuntimeSnapshot      Web API, Task Queue, Microtask Queue 상태
  }
```

### StepKind 전체 목록 (26가지)

| 카테고리      | Kind                  | 발생 시점                |
| ------------- | --------------------- | ------------------------ |
| **프로그램**  | `enter-statement`     | 프로그램/문 시작         |
|               | `program-complete`    | 프로그램 종료            |
| **호이스팅**  | `hoisting`            | TDZ 바인딩 등록          |
| **변수**      | `variable-declare`    | 변수 선언 + 초기화       |
|               | `variable-assign`     | 변수 값 변경             |
| **함수**      | `enter-function`      | 함수 호출 시작           |
|               | `exit-function`       | 함수 반환                |
|               | `return`              | return 문 실행           |
| **제어 흐름** | `condition-test`      | if/삼항 조건 평가        |
|               | `loop-test`           | while/for 조건 평가      |
| **출력**      | `console-output`      | console.log 호출         |
| **표현식**    | `evaluate-expression` | 표현식 평가              |
| **예외 처리** | `try-enter`           | try 블록 진입            |
|               | `catch-enter`         | catch 블록 진입          |
|               | `finally-enter`       | finally 블록 진입        |
|               | `throw`               | throw 문 실행            |
| **비동기**    | `web-api-register`    | Web API 등록             |
|               | `web-api-tick`        | Web API 타이머 틱        |
|               | `web-api-complete`    | Web API 완료             |
|               | `task-enqueue`        | Task Queue에 추가        |
|               | `task-dequeue`        | Task Queue에서 꺼냄      |
|               | `microtask-enqueue`   | Microtask Queue에 추가   |
|               | `microtask-dequeue`   | Microtask Queue에서 꺼냄 |
|               | `event-loop-check`    | 이벤트 루프 체크         |
|               | `promise-resolve`     | Promise resolve          |
|               | `promise-create`      | Promise 생성             |
|               | `await-suspend`       | await에서 중단           |

---

## 9단계: Store → UI 연결 (`engine-store.ts`)

### stepForward() 흐름

```
stepForward()
├── [히스토리 재생] stepIndex < stepHistory.length - 1
│   └── 이전에 저장된 StepResult 복원 (generator.next() 호출 안 함)
│
├── [제너레이터 초기화] generator === null
│   ├── parse() 호출 (tokenize + parse)
│   ├── new AsyncRuntime(ast)
│   └── runtime.run() → Generator 생성
│
└── [새 스텝 실행] generator.next()
    ├── { value: StepResult, done: false }
    │   └── Store 상태 업데이트:
    │       callStack, environments, consoleOutput, closures,
    │       heapSnapshot, currentLine, webApis, taskQueue,
    │       microtaskQueue, eventLoopPhase
    │       → stepHistory에 push (최대 500개)
    └── { done: true }
        └── executionStatus = 'completed'
```

### run() — 자동 실행

```
run()
├── generator 없으면 초기화
├── executionStatus = 'running'
└── setInterval(stepForward, executionSpeed)
    ├── 매 인터벌마다 stepForward() 1회 호출
    ├── completed/error → clearInterval
    └── breakpoint 도달 → clearInterval + 'paused'
```

### stepBack() — 히스토리 되감기

```
stepBack()
├── running이면 먼저 pause
├── stepIndex > 0 확인
└── stepHistory[stepIndex - 1] 복원
    (generator.next()를 거꾸로 되돌리는 게 아니라,
     저장된 스냅샷을 복원하는 방식)
```

---

## 부록: RuntimeValue 타입 체계

```
RuntimeValue
├── NumberValue      { kind: 'number', value: number }
├── StringValue      { kind: 'string', value: string }
├── BooleanValue     { kind: 'boolean', value: boolean }
├── NullValue        { kind: 'null' }
├── UndefinedValue   { kind: 'undefined' }
├── FunctionValue    { kind: 'function', id, name, params, body, closure, async? }
│                    └── closure: Environment ← 정의 시점의 렉시컬 환경 캡처
├── NativeFunctionValue  { kind: 'native-function', name, call: (args) => RuntimeValue }
├── ArrayValue       { kind: 'array', elements: RuntimeValue[] }
├── ObjectValue      { kind: 'object', properties: Map<string, RuntimeValue> }
└── PromiseValue     { kind: 'promise', id, state, value?, thenCallbacks[], methods? }
```

## 부록: Truthiness 판정

```
isTruthy(value)
├── boolean → value
├── number  → value !== 0 && !isNaN(value)
├── string  → value !== ''
├── null    → false
├── undefined → false
└── 그 외 (function, array, object, promise) → true
```
