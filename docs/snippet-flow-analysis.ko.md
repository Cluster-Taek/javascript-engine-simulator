# Snippet 동작 플로우 분석

[English](./snippet-flow-analysis.md)

각 스니펫의 실행 흐름을 실제 JavaScript 동작 원리와 비교하여 검증한 문서입니다.

---

## 목차

### Sync Mode (1~8)

1. [Fibonacci](#1-fibonacci)
2. [Closure Counter](#2-closure-counter)
3. [Arrow Function](#3-arrow-function)
4. [For Loop](#4-for-loop)
5. [Scope Demo](#5-scope-demo)
6. [Conditional Logic](#6-conditional-logic)
7. [Math](#7-math)
8. [Array & Object](#8-array--object)

### Async Mode (9~15)

9. [setTimeout Demo](#9-settimeout-demo)
10. [Multiple Timers](#10-multiple-timers)
11. [Microtask vs Macrotask](#11-microtask-vs-macrotask)
12. [Promise Chain](#12-promise-chain)
13. [Fetch (async/await)](#13-fetch-asyncawait)
14. [Multiple Await](#14-multiple-await)
15. [All Queues Demo](#15-all-queues-demo)

---

## 1. Fibonacci

**결과: ✅ 실제 JS와 일치**

```js
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

let result = fibonacci(6);
console.log('fib(6) =', result);
```

### 예상 콘솔 출력

```
fib(6) = 8
```

### 실행 플로우

```
1. Program Start
2. Function Declaration: fibonacci (hoisted)
3. VariableDeclaration: let result = fibonacci(6)
   └─ CallExpression: fibonacci(6)
      ├─ Enter function fibonacci(n=6)
      ├─ Condition: n <= 1 → false
      ├─ BinaryExpression: fibonacci(5) + fibonacci(4)
      │   ├─ fibonacci(5)
      │   │   ├─ Condition: 5 <= 1 → false
      │   │   ├─ fibonacci(4) + fibonacci(3)
      │   │   │   ├─ fibonacci(4) → 3
      │   │   │   └─ fibonacci(3) → 2
      │   │   └─ return 5
      │   └─ fibonacci(4)
      │       ├─ Condition: 4 <= 1 → false
      │       ├─ fibonacci(3) + fibonacci(2)
      │       │   ├─ fibonacci(3) → 2
      │       │   └─ fibonacci(2) → 1
      │       └─ return 3
      └─ return 8
4. result = 8
5. console.log("fib(6) =", 8)  →  "fib(6) = 8"
6. Program Complete
```

### 검증 포인트

| 기능                  | 엔진 지원 | 실제 JS 동작 일치 |
| --------------------- | :-------: | :---------------: |
| 함수 호이스팅         |    ✅     |        ✅         |
| 재귀 호출             |    ✅     |        ✅         |
| if/return             |    ✅     |        ✅         |
| 이항 연산 (+, -, <=)  |    ✅     |        ✅         |
| Call Stack push/pop   |    ✅     |        ✅         |
| console.log 다중 인자 |    ✅     |        ✅         |

### 콜 스택 변화 (최대 깊이 예시)

```
[global] → [global, fibonacci(6)] → [global, fibonacci(6), fibonacci(5)]
→ ... → [global, fibonacci(6), fibonacci(5), fibonacci(4), fibonacci(3), fibonacci(2), fibonacci(1)]
→ (return) [global, fibonacci(6), fibonacci(5), fibonacci(4), fibonacci(3), fibonacci(2)]
→ ...
```

---

## 2. Closure Counter

**결과: ✅ 실제 JS와 일치**

```js
function makeCounter() {
  let count = 0;
  function increment() {
    count++;
    return count;
  }
  return increment;
}

let counter = makeCounter();
let a = counter();
let b = counter();
let c = counter();
console.log('count:', c);
```

### 예상 콘솔 출력

```
count: 3
```

### 실행 플로우

```
1. Program Start
2. Function Declaration: makeCounter (hoisted)
3. let counter = makeCounter()
   ├─ Enter function makeCounter()
   ├─ let count = 0        ← makeCounter 스코프에 바인딩
   ├─ Function Declaration: increment (hoisted)
   │   └─ closure = makeCounter의 Environment (count 포함)
   ├─ return increment     ← FunctionValue(closure 포함) 반환
   └─ Exit makeCounter → [Function: increment]
4. counter = [Function: increment]
5. let a = counter()
   ├─ Enter function increment()
   │   └─ Environment: function:increment → parent: function:makeCounter (count=0)
   ├─ count++ → count = 1  ← 클로저의 count를 수정
   ├─ return 1
   └─ Exit increment → 1
6. a = 1
7. let b = counter()
   ├─ Enter function increment()
   │   └─ Environment: function:increment → parent: function:makeCounter (count=1)
   ├─ count++ → count = 2  ← 동일한 클로저의 count 수정
   ├─ return 2
   └─ Exit increment → 2
8. b = 2
9. let c = counter()
   ├─ Enter function increment()
   │   └─ Environment: function:increment → parent: function:makeCounter (count=2)
   ├─ count++ → count = 3
   ├─ return 3
   └─ Exit increment → 3
10. c = 3
11. console.log("count:", 3) → "count: 3"
12. Program Complete
```

### 검증 포인트

| 기능                         | 엔진 지원 | 실제 JS 동작 일치 |
| ---------------------------- | :-------: | :---------------: |
| 클로저 (lexical scope)       |    ✅     |        ✅         |
| 함수를 값으로 반환           |    ✅     |        ✅         |
| UpdateExpression (++)        |    ✅     |        ✅         |
| 클로저 변수 공유 (동일 참조) |    ✅     |        ✅         |

### 스코프 체인

```
increment 호출 시:
  [function:increment] → [function:makeCounter (count)] → [global]

핵심: increment의 closure는 makeCounter의 Environment를 참조.
      count는 힙에 있는 동일 객체이므로 매 호출마다 누적됨.
```

---

## 3. Arrow Function

**결과: ✅ 실제 JS와 일치**

```js
let double = (x) => x * 2;
let add = (a, b) => a + b;

function apply(fn, x, y) {
  return fn(x, y);
}

let result = apply(add, 3, 4);
console.log('add:', result);
console.log('double:', double(5));
```

### 예상 콘솔 출력

```
add: 7
double: 10
```

### 실행 플로우

```
1. Program Start
2. Function Declaration: apply (hoisted)
3. let double = (x) => x * 2
   └─ ArrowFunctionExpression → body가 expression이므로 ReturnStatement로 래핑
      └─ FunctionValue { name: '<arrow>', params: ['x'], body: { return x * 2 } }
4. let add = (a, b) => a + b
   └─ FunctionValue { name: '<arrow>', params: ['a', 'b'], body: { return a + b } }
5. let result = apply(add, 3, 4)
   ├─ Enter function apply(fn=[Function: <arrow>], x=3, y=4)
   ├─ return fn(x, y) → fn = add
   │   ├─ Enter function <arrow>(a=3, b=4)
   │   ├─ return a + b → return 7
   │   └─ Exit <arrow> → 7
   ├─ return 7
   └─ Exit apply → 7
6. result = 7
7. console.log("add:", 7)  →  "add: 7"
8. let _ = double(5)
   ├─ Enter function <arrow>(x=5)
   ├─ return x * 2 → return 10
   └─ Exit <arrow> → 10
9. console.log("double:", 10)  →  "double: 10"
10. Program Complete
```

### 검증 포인트

| 기능                              | 엔진 지원 | 실제 JS 동작 일치 |
| --------------------------------- | :-------: | :---------------: |
| 화살표 함수 (expression body)     |    ✅     |        ✅         |
| 고차 함수 (함수를 인자로 전달)    |    ✅     |        ✅         |
| 화살표 함수 내부 return 자동 래핑 |    ✅     |        ✅         |

---

## 4. For Loop

**결과: ✅ 실제 JS와 일치**

```js
let sum = 0;
for (let i = 1; i <= 5; i++) {
  sum += i;
}
console.log('sum =', sum);
```

### 예상 콘솔 출력

```
sum = 15
```

### 실행 플로우

```
1. Program Start
2. let sum = 0
3. ForStatement: let i = 1; i <= 5; i++
   ├─ Init: let i = 1  (for-init 스코프에 선언)
   ├─ Iteration 1: test i(1) <= 5 → true
   │   ├─ Body: sum += 1 → sum = 1
   │   └─ Update: i++ → i = 2
   ├─ Iteration 2: test i(2) <= 5 → true
   │   ├─ Body: sum += 2 → sum = 3
   │   └─ Update: i++ → i = 3
   ├─ Iteration 3: test i(3) <= 5 → true
   │   ├─ Body: sum += 3 → sum = 6
   │   └─ Update: i++ → i = 4
   ├─ Iteration 4: test i(4) <= 5 → true
   │   ├─ Body: sum += 4 → sum = 10
   │   └─ Update: i++ → i = 5
   ├─ Iteration 5: test i(5) <= 5 → true
   │   ├─ Body: sum += 5 → sum = 15
   │   └─ Update: i++ → i = 6
   └─ Iteration 6: test i(6) <= 5 → false → break
4. console.log("sum =", 15)  →  "sum = 15"
5. Program Complete
```

### 검증 포인트

| 기능                       | 엔진 지원 | 실제 JS 동작 일치 |
| -------------------------- | :-------: | :---------------: |
| for 문 (init/test/update)  |    ✅     |        ✅         |
| let 블록 스코프 (for-init) |    ✅     |        ✅         |
| += 복합 할당               |    ✅     |        ✅         |
| UpdateExpression (i++)     |    ✅     |        ✅         |

### 스코프 구조

```
[global (sum=0)]
  └─ [for-init (i)]
       └─ [for-body] (매 반복마다 새 Environment)
```

---

## 5. Scope Demo

**결과: ✅ 실제 JS와 일치**

```js
let x = 10;

function outer() {
  let y = 20;
  function inner() {
    let z = 30;
    return x + y + z;
  }
  return inner();
}

let result = outer();
console.log('result:', result);
```

### 예상 콘솔 출력

```
result: 60
```

### 실행 플로우

```
1. Program Start
2. Function Declaration: outer (hoisted)
3. let x = 10
4. let result = outer()
   ├─ Enter function outer()
   │   └─ Environment: function:outer → parent: global (x=10)
   ├─ Function Declaration: inner (hoisted)
   ├─ let y = 20
   ├─ return inner()
   │   ├─ Enter function inner()
   │   │   └─ Environment: function:inner → parent: function:outer (y=20) → global (x=10)
   │   ├─ let z = 30
   │   ├─ return x + y + z
   │   │   ├─ x → resolve: global → 10
   │   │   ├─ y → resolve: outer → 20
   │   │   ├─ z → resolve: inner → 30
   │   │   └─ 10 + 20 + 30 = 60
   │   ├─ return 60
   │   └─ Exit inner → 60
   ├─ return 60
   └─ Exit outer → 60
5. result = 60
6. console.log("result:", 60)  →  "result: 60"
7. Program Complete
```

### 검증 포인트

| 기능             | 엔진 지원 | 실제 JS 동작 일치 |
| ---------------- | :-------: | :---------------: |
| 중첩 함수        |    ✅     |        ✅         |
| 스코프 체인 탐색 |    ✅     |        ✅         |
| 렉시컬 스코핑    |    ✅     |        ✅         |

### 스코프 체인 시각화

```
inner 호출 시 변수 해석:
  z → [function:inner] ✓
  y → [function:inner] ✗ → [function:outer] ✓
  x → [function:inner] ✗ → [function:outer] ✗ → [global] ✓
```

---

## 6. Conditional Logic

**결과: ✅ 실제 JS와 일치**

```js
function classify(score) {
  if (score >= 90) {
    return 'A';
  } else if (score >= 80) {
    return 'B';
  } else if (score >= 70) {
    return 'C';
  } else {
    return 'F';
  }
}

let score = 85;
let grade = classify(score);
let passed = score >= 60 && grade !== 'F';
console.log('grade:', grade);
console.log('passed:', passed);
```

### 예상 콘솔 출력

```
grade: B
passed: true
```

### 실행 플로우

```
1. Program Start
2. Function Declaration: classify (hoisted)
3. let score = 85
4. let grade = classify(85)
   ├─ Enter function classify(score=85)
   ├─ if (85 >= 90) → false
   ├─ else if (85 >= 80) → true
   │   └─ return "B"
   └─ Exit classify → "B"
5. grade = "B"
6. let passed = score >= 60 && grade !== "F"
   ├─ LogicalExpression (&&)
   │   ├─ Left: 85 >= 60 → true  (truthy → 오른쪽 평가)
   │   └─ Right: "B" !== "F" → true
   └─ Result: true
7. passed = true
8. console.log("grade:", "B")    →  "grade: B"
9. console.log("passed:", true)  →  "passed: true"
10. Program Complete
```

### 검증 포인트

| 기능                     | 엔진 지원 | 실제 JS 동작 일치 |
| ------------------------ | :-------: | :---------------: |
| if / else if / else      |    ✅     |        ✅         |
| 비교 연산 (>=)           |    ✅     |        ✅         |
| 논리 연산 (&&) 단축 평가 |    ✅     |        ✅         |
| !== (strict inequality)  |    ✅     |        ✅         |
| 함수 내 early return     |    ✅     |        ✅         |

---

## 7. Math

**결과: ✅ 실제 JS와 일치**

```js
let radius = 5;
let area = Math.PI * Math.pow(radius, 2);
console.log('area:', Math.round(area));

let numbers = [16, 25, 36];
let i = 0;
while (i < numbers.length) {
  console.log('sqrt:', Math.sqrt(numbers[i]));
  i++;
}
```

### 예상 콘솔 출력

```
area: 79
sqrt: 4
sqrt: 5
sqrt: 6
```

### 실행 플로우

```
1. Program Start
2. let radius = 5
3. let area = Math.PI * Math.pow(radius, 2)
   ├─ MemberExpression: Math.PI → 3.141592653589793
   ├─ MemberExpression: Math.pow → [NativeFunction: Math.pow]
   ├─ CallExpression: Math.pow(5, 2) → 25
   └─ 3.141592653589793 * 25 = 78.53981633974483
4. area = 78.53981633974483
5. console.log("area:", Math.round(78.5398...))
   ├─ Math.round(78.5398...) → 79
   └─ Output: "area: 79"
6. let numbers = [16, 25, 36]
7. let i = 0
8. WhileStatement: i < numbers.length
   ├─ Iteration 1: 0 < 3 → true
   │   ├─ Math.sqrt(numbers[0]) → Math.sqrt(16) → 4
   │   ├─ console.log("sqrt:", 4) → "sqrt: 4"
   │   └─ i++ → i = 1
   ├─ Iteration 2: 1 < 3 → true
   │   ├─ Math.sqrt(numbers[1]) → Math.sqrt(25) → 5
   │   ├─ console.log("sqrt:", 5) → "sqrt: 5"
   │   └─ i++ → i = 2
   ├─ Iteration 3: 2 < 3 → true
   │   ├─ Math.sqrt(numbers[2]) → Math.sqrt(36) → 6
   │   ├─ console.log("sqrt:", 6) → "sqrt: 6"
   │   └─ i++ → i = 3
   └─ Iteration 4: 3 < 3 → false → break
9. Program Complete
```

### 검증 포인트

| 기능                           | 엔진 지원 | 실제 JS 동작 일치 |
| ------------------------------ | :-------: | :---------------: |
| Math.PI                        |    ✅     |        ✅         |
| Math.pow()                     |    ✅     |        ✅         |
| Math.round()                   |    ✅     |        ✅         |
| Math.sqrt()                    |    ✅     |        ✅         |
| Array 인덱스 접근 (numbers[i]) |    ✅     |        ✅         |
| Array.length                   |    ✅     |        ✅         |
| while 문                       |    ✅     |        ✅         |

---

## 8. Array & Object

**결과: ✅ 실제 JS와 일치**

```js
let arr = [1, 2, 3, 4, 5];
let sum = 0;
let i = 0;
while (i < arr.length) {
  sum += arr[i];
  i++;
}

let obj = { name: 'JS Engine', version: 1 };
console.log('sum:', sum);
console.log('name:', obj.name);
```

### 예상 콘솔 출력

```
sum: 15
name: JS Engine
```

### 실행 플로우

```
1. Program Start
2. let arr = [1, 2, 3, 4, 5]
   └─ ArrayExpression → { kind: 'array', elements: [1, 2, 3, 4, 5] }
3. let sum = 0
4. let i = 0
5. WhileStatement: i < arr.length
   ├─ arr.length → 5
   ├─ Iteration 1: 0 < 5 → true
   │   ├─ sum += arr[0] → sum = 0 + 1 = 1
   │   └─ i++ → 1
   ├─ Iteration 2: 1 < 5 → true
   │   ├─ sum += arr[1] → sum = 1 + 2 = 3
   │   └─ i++ → 2
   ├─ Iteration 3: 2 < 5 → true
   │   ├─ sum += arr[2] → sum = 3 + 3 = 6
   │   └─ i++ → 3
   ├─ Iteration 4: 3 < 5 → true
   │   ├─ sum += arr[3] → sum = 6 + 4 = 10
   │   └─ i++ → 4
   ├─ Iteration 5: 4 < 5 → true
   │   ├─ sum += arr[4] → sum = 10 + 5 = 15
   │   └─ i++ → 5
   └─ Iteration 6: 5 < 5 → false → break
6. let obj = { name: "JS Engine", version: 1 }
   └─ ObjectExpression → { kind: 'object', properties: Map { name → "JS Engine", version → 1 } }
7. console.log("sum:", 15)       →  "sum: 15"
8. console.log("name:", obj.name)
   ├─ MemberExpression: obj.name → "JS Engine"
   └─ Output: "name: JS Engine"
9. Program Complete
```

### 검증 포인트

| 기능                              | 엔진 지원 | 실제 JS 동작 일치 |
| --------------------------------- | :-------: | :---------------: |
| 배열 리터럴                       |    ✅     |        ✅         |
| 배열 인덱스 접근                  |    ✅     |        ✅         |
| 객체 리터럴                       |    ✅     |        ✅         |
| 객체 프로퍼티 접근 (dot notation) |    ✅     |        ✅         |
| while + 배열 순회                 |    ✅     |        ✅         |

---

## 9. setTimeout Demo

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('start');

setTimeout(function () {
  console.log('timeout callback');
}, 1000);

console.log('end');
```

### 예상 콘솔 출력

```
start
end
timeout callback
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("start")  →  "start"
2. setTimeout(callback, 1000)
   └─ Web API에 등록: { label: "setTimeout(1000ms)", remainingTicks: 10 }
3. console.log("end")  →  "end"

=== Phase 2: Event Loop ===

4. [Event Loop Check] Main script 완료. Call Stack 비어있음. Event Loop 시작.

5. [Tick 1~9] Web API tick: setTimeout(1000ms) 카운트다운
   └─ remainingTicks: 10 → 9 → 8 → ... → 1

6. [Tick 10] setTimeout 완료
   └─ Task Queue로 이동: "setTimeout(1000ms) callback"

7. [Task Dequeue] "setTimeout(1000ms) callback"
   ├─ Enter callback
   ├─ console.log("timeout callback")  →  "timeout callback"
   └─ Exit callback

8. [Program Complete] 모든 큐 비어있음.
```

### 이벤트 루프 상태 변화

```
Step  | Call Stack   | Web APIs              | Task Queue | Microtask Queue
------|-------------|-----------------------|------------|----------------
  1   | [global]    | -                     | -          | -
  2   | [global]    | setTimeout(1000ms)    | -          | -
  3   | [global]    | setTimeout(1000ms)    | -          | -
  4   | (empty)     | setTimeout(1000ms)    | -          | -
 5~6  | (empty)     | (ticking...)          | -          | -
  7   | (empty)     | -                     | [callback] | -
  8   | [callback]  | -                     | -          | -
  9   | (empty)     | -                     | -          | -
```

### 검증 포인트

| 기능                                | 엔진 지원 | 실제 JS 동작 일치 |
| ----------------------------------- | :-------: | :---------------: |
| setTimeout → Web API 등록           |    ✅     |        ✅         |
| 비동기 콜백은 스크립트 완료 후 실행 |    ✅     |        ✅         |
| Call Stack 비어야 Task 실행         |    ✅     |        ✅         |
| 콘솔 출력 순서                      |    ✅     |        ✅         |

---

## 10. Multiple Timers

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('first');

setTimeout(function () {
  console.log('timer A fired');
}, 200);

setTimeout(function () {
  console.log('timer B fired');
}, 100);

console.log('last');
```

### 예상 콘솔 출력

```
first
last
timer B fired
timer A fired
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("first")  →  "first"
2. setTimeout(callbackA, 200)
   └─ Web API 등록: { label: "setTimeout(200ms)", remainingTicks: 2 }
3. setTimeout(callbackB, 100)
   └─ Web API 등록: { label: "setTimeout(100ms)", remainingTicks: 1 }
4. console.log("last")  →  "last"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script 완료.

6. [Event Loop Iter 1]
   ├─ Tick Web APIs:
   │   ├─ Timer A: 2 → 1 (아직 활성)
   │   └─ Timer B: 1 → 0 (완료!)
   ├─ Timer B → Task Queue로 이동
   ├─ Microtask drain: (없음)
   └─ Task pick: Timer B callback
       └─ console.log("timer B fired")  →  "timer B fired"

7. [Event Loop Iter 2]
   ├─ Tick Web APIs:
   │   └─ Timer A: 1 → 0 (완료!)
   ├─ Timer A → Task Queue로 이동
   ├─ Microtask drain: (없음)
   └─ Task pick: Timer A callback
       └─ console.log("timer A fired")  →  "timer A fired"

8. [Program Complete]
```

### 핵심 원리

```
실제 JS와 동일하게:
- delay가 짧은 타이머가 먼저 완료됨
- 엔진의 tick 단위: 100ms → ticks = max(1, ceil(delay/100))
  • 200ms → 2 ticks
  • 100ms → 1 tick
- Timer B가 먼저 Task Queue에 도착 → 먼저 실행
```

### 검증 포인트

| 기능                 | 엔진 지원 | 실제 JS 동작 일치 |
| -------------------- | :-------: | :---------------: |
| 타이머 지연 비교     |    ✅     |        ✅         |
| 짧은 delay 우선 실행 |    ✅     |        ✅         |
| 콘솔 출력 순서       |    ✅     |        ✅         |

---

## 11. Microtask vs Macrotask

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('script start');

setTimeout(function () {
  console.log('setTimeout');
}, 0);

queueMicrotask(function () {
  console.log('microtask 1');
});

queueMicrotask(function () {
  console.log('microtask 2');
});

console.log('script end');
```

### 예상 콘솔 출력

```
script start
script end
microtask 1
microtask 2
setTimeout
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("script start")  →  "script start"
2. setTimeout(callback, 0)
   └─ Web API 등록: { label: "setTimeout(0ms)", remainingTicks: 1 }
       ※ delay 0이어도 최소 1 tick (실제 JS의 최소 4ms 지연과 유사)
3. queueMicrotask(callback1)
   └─ Microtask Queue에 직접 추가: [callback1]
4. queueMicrotask(callback2)
   └─ Microtask Queue에 추가: [callback1, callback2]
5. console.log("script end")  →  "script end"

=== Phase 2: Event Loop ===

6. [Event Loop Check] Main script 완료.

7. [Event Loop Iter 1]
   ├─ Tick Web APIs:
   │   └─ setTimeout(0ms): 1 → 0 (완료!)
   ├─ setTimeout callback → Task Queue
   ├─ Drain Microtask Queue:
   │   ├─ Dequeue callback1 → console.log("microtask 1")  →  "microtask 1"
   │   └─ Dequeue callback2 → console.log("microtask 2")  →  "microtask 2"
   └─ Task pick: setTimeout callback
       └─ console.log("setTimeout")  →  "setTimeout"

8. [Program Complete]
```

### 핵심 원리

```
실제 JS Event Loop 우선순위:
  1. Call Stack (현재 실행 컨텍스트)
  2. Microtask Queue (Promise.then, queueMicrotask)
  3. Task Queue / Macrotask Queue (setTimeout, setInterval)

엔진도 동일한 순서를 구현:
  - 매 Event Loop 반복마다 Microtask Queue를 먼저 완전히 비움
  - 그 다음 Task Queue에서 하나를 꺼내 실행
```

### 검증 포인트

| 기능                           | 엔진 지원 | 실제 JS 동작 일치 |
| ------------------------------ | :-------: | :---------------: |
| queueMicrotask                 |    ✅     |        ✅         |
| Microtask > Macrotask 우선순위 |    ✅     |        ✅         |
| setTimeout(fn, 0)도 최소 지연  |    ✅     |        ✅         |
| 콘솔 출력 순서                 |    ✅     |        ✅         |

---

## 12. Promise Chain

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('1. Script start');

Promise.resolve('hello').then(function (value) {
  console.log('3. Promise resolved:', value);
});

queueMicrotask(function () {
  console.log('4. Microtask');
});

console.log('2. Script end');
```

### 예상 콘솔 출력

```
1. Script start
2. Script end
3. Promise resolved: hello
4. Microtask
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("1. Script start")  →  "1. Script start"

2. Promise.resolve("hello").then(callback)
   ├─ Promise.resolve("hello")
   │   └─ 즉시 resolved 상태의 Promise 생성: { state: 'resolved', value: "hello" }
   ├─ .then(callback)
   │   └─ Promise가 이미 resolved → callback을 Microtask Queue에 즉시 추가
   │      Microtask Queue: [{ label: "Promise.then callback", args: ["hello"] }]
   └─ return undefined

3. queueMicrotask(callback)
   └─ Microtask Queue: [Promise.then callback, queueMicrotask callback]

4. console.log("2. Script end")  →  "2. Script end"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script 완료.

6. [Event Loop Iter 1]
   ├─ Tick Web APIs: (없음)
   ├─ Drain Microtask Queue:
   │   ├─ Dequeue: Promise.then callback(value="hello")
   │   │   └─ console.log("3. Promise resolved:", "hello")  →  "3. Promise resolved: hello"
   │   └─ Dequeue: queueMicrotask callback
   │       └─ console.log("4. Microtask")  →  "4. Microtask"
   └─ Task Queue: (없음)

7. [Program Complete]
```

### 핵심 원리

```
Promise.resolve().then()과 queueMicrotask()는 모두 Microtask Queue에 추가됨.
FIFO 순서로 실행: .then callback이 먼저 큐에 들어갔으므로 먼저 실행됨.

실제 JS 동작과 동일:
  - Promise.resolve()는 즉시 resolved Promise 생성
  - .then()은 resolved Promise에 대해 microtask를 즉시 스케줄링
  - Microtask Queue는 FIFO 순서
```

### 검증 포인트

| 기능                                    | 엔진 지원 | 실제 JS 동작 일치 |
| --------------------------------------- | :-------: | :---------------: |
| Promise.resolve()                       |    ✅     |        ✅         |
| .then() on resolved Promise → microtask |    ✅     |        ✅         |
| .then callback 인자 전달                |    ✅     |        ✅         |
| Microtask FIFO 순서                     |    ✅     |        ✅         |
| 콘솔 출력 순서                          |    ✅     |        ✅         |

---

## 13. Fetch (async/await)

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('1. Script start');

async function fetchTestData() {
  console.log('2. Async function start (Sync execution)');
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  console.log('4. Fetch finished (Microtask Queue)');
}

fetchTestData();

console.log('3. Script end');
```

### 예상 콘솔 출력

```
1. Script start
2. Async function start (Sync execution)
3. Script end
4. Fetch finished (Microtask Queue)
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("1. Script start")  →  "1. Script start"

2. Function Declaration: fetchTestData (async, hoisted)

3. fetchTestData()
   ├─ Enter async function fetchTestData()
   ├─ console.log("2. Async function start (Sync execution)")
   │   →  "2. Async function start (Sync execution)"
   │   ※ async 함수 내부에서 await 전까지는 동기적으로 실행!
   ├─ const response = await fetch("https://...")
   │   ├─ fetch() 호출 → Web API에 등록
   │   │   └─ { label: "fetch(...)", kind: "fetch", remainingTicks: 3 }
   │   ├─ fetch()가 반환한 Promise는 pending 상태
   │   ├─ await → AwaitSignal 발생!
   │   ├─ Continuation 생성:
   │   │   └─ { name: "<continuation:fetchTestData>", params: ["response"], body: [console.log("4. ...")] }
   │   ├─ Continuation → fetchPromise.thenCallbacks에 등록
   │   └─ Async function 일시 정지 → Call Stack에서 제거
   └─ Return: Promise (pending)

4. console.log("3. Script end")  →  "3. Script end"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script 완료.

6. [Event Loop Iter 1~2]
   └─ Tick Web APIs: fetch 카운트다운 (3 → 2 → 1)

7. [Event Loop Iter 3]
   ├─ Tick: fetch 1 → 0 (완료!)
   ├─ fetch 완료 → resolve 함수가 Task Queue로 이동
   ├─ Drain Microtask Queue: (없음)
   └─ Task pick: resolve
       ├─ resolve 실행: fetchPromise.state = 'resolved'
       ├─ thenCallbacks 처리:
       │   └─ continuation → Microtask Queue에 추가

8. [Event Loop Iter 4]
   ├─ Drain Microtask Queue:
   │   └─ Dequeue: continuation(response=ResponseObject)
   │       ├─ response 변수에 { status: 200, ok: true, url: "..." } 바인딩
   │       └─ console.log("4. Fetch finished (Microtask Queue)")
   │           →  "4. Fetch finished (Microtask Queue)"
   └─ Task Queue: (없음)

9. [Program Complete]
```

### 핵심 원리

```
async/await의 실제 동작:
  1. async 함수는 호출되면 동기적으로 실행을 시작
  2. await를 만나면 함수 실행이 일시 정지되고, Call Stack에서 제거됨
  3. 제어권이 호출자에게 돌아감 (→ "3. Script end" 출력)
  4. await된 Promise가 resolve되면, 나머지 코드가 Microtask로 스케줄링됨

엔진의 구현:
  - AwaitSignal로 함수 실행을 중단
  - 나머지 코드를 continuation 함수로 캡처
  - Promise의 thenCallbacks에 continuation 등록
  - Promise resolve 시 Microtask Queue에 continuation 추가
```

### 검증 포인트

| 기능                      | 엔진 지원 | 실제 JS 동작 일치 |
| ------------------------- | :-------: | :---------------: |
| async 함수 선언           |    ✅     |        ✅         |
| await 전까지 동기 실행    |    ✅     |        ✅         |
| await에서 함수 일시 정지  |    ✅     |        ✅         |
| fetch → Web API 등록      |    ✅     |        ✅         |
| await 후 Microtask로 재개 |    ✅     |        ✅         |
| 콘솔 출력 순서            |    ✅     |        ✅         |

---

## 14. Multiple Await

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('start');

async function fetchSequential() {
  const first = await fetch('https://api.example.com/first');
  console.log('first response received');
  const second = await fetch('https://api.example.com/second');
  console.log('second response received');
  console.log('all done');
}

fetchSequential();

console.log('main script end');
```

### 예상 콘솔 출력

```
start
main script end
first response received
second response received
all done
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("start")  →  "start"

2. Function Declaration: fetchSequential (async, hoisted)

3. fetchSequential()
   ├─ Enter async function fetchSequential()
   ├─ const first = await fetch(".../first")
   │   ├─ fetch(".../first") → Web API 등록 (3 ticks)
   │   ├─ await → AwaitSignal!
   │   ├─ Continuation 1 생성:
   │   │   params: ["first"]
   │   │   body: [console.log("first..."), const second = await fetch(...), ...]
   │   └─ Async function 일시 정지
   └─ Return: Promise (pending)

4. console.log("main script end")  →  "main script end"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script 완료.

6. [Iter 1~2] Web API tick: fetch#1 카운트다운 (3 → 2 → 1)

7. [Iter 3] fetch#1 완료
   ├─ resolve → Task Queue
   └─ Task pick: resolve#1
       ├─ fetchPromise#1 resolved
       └─ Continuation 1 → Microtask Queue

8. [Iter 4] Drain Microtask Queue
   ├─ Continuation 1 실행 (first = ResponseObject)
   ├─ console.log("first response received")  →  "first response received"
   ├─ const second = await fetch(".../second")
   │   ├─ fetch(".../second") → Web API 등록 (3 ticks)  ← 새 fetch!
   │   ├─ await → AwaitSignal!
   │   └─ Continuation 2 생성:
   │       params: ["second"]
   │       body: [console.log("second..."), console.log("all done")]
   └─ Continuation 1 종료 (중단됨)

9. [Iter 5~6] Web API tick: fetch#2 카운트다운 (3 → 2 → 1)

10. [Iter 7] fetch#2 완료
    ├─ resolve → Task Queue
    └─ Task pick: resolve#2
        ├─ fetchPromise#2 resolved
        └─ Continuation 2 → Microtask Queue

11. [Iter 8] Drain Microtask Queue
    ├─ Continuation 2 실행 (second = ResponseObject)
    ├─ console.log("second response received")  →  "second response received"
    └─ console.log("all done")  →  "all done"

12. [Program Complete]
```

### 핵심 원리

```
Multiple await의 동작:
  1. 각 await마다 함수가 일시 정지됨
  2. 나머지 코드가 continuation으로 캡처됨
  3. 첫 번째 await의 Promise가 resolve되면, continuation이 Microtask로 실행됨
  4. 그 안에서 두 번째 await를 만나면 다시 일시 정지
  5. 두 번째 fetch도 동일한 과정 반복

이것은 실제 JS의 async/await 동작과 정확히 일치:
  - Sequential await = 순차적 비동기 처리
  - 각 await는 이전 결과가 resolve된 후에만 다음 작업 시작
```

### Continuation 체인 시각화

```
fetchSequential()
  ├─ [동기] await fetch#1 → 일시 정지
  │
  ├─ [Continuation 1] (fetch#1 resolve 후 실행)
  │   ├─ "first response received"
  │   └─ await fetch#2 → 일시 정지
  │
  └─ [Continuation 2] (fetch#2 resolve 후 실행)
      ├─ "second response received"
      └─ "all done"
```

### 검증 포인트

| 기능                                 | 엔진 지원 | 실제 JS 동작 일치 |
| ------------------------------------ | :-------: | :---------------: |
| 다중 await                           |    ✅     |        ✅         |
| 순차적 비동기 실행                   |    ✅     |        ✅         |
| Continuation 체이닝                  |    ✅     |        ✅         |
| 두 번째 fetch는 첫 번째 완료 후 등록 |    ✅     |        ✅         |
| 콘솔 출력 순서                       |    ✅     |        ✅         |

---

## 15. All Queues Demo

**모드: Async** | **결과: ✅ 실제 JS와 일치**

```js
console.log('1. Script start');

// Web API → Task Queue (macrotask)
setTimeout(function () {
  console.log('5. Task: setTimeout fires');
  queueMicrotask(function () {
    console.log('6. Microtask queued inside task');
  });
}, 200);

// Microtask Queue (runs before task queue)
queueMicrotask(function () {
  console.log('3. Microtask: first');
});

queueMicrotask(function () {
  console.log('4. Microtask: second');
});

console.log('2. Script end');
```

### 예상 콘솔 출력

```
1. Script start
2. Script end
3. Microtask: first
4. Microtask: second
5. Task: setTimeout fires
6. Microtask queued inside task
```

### 실행 플로우

```
=== Phase 1: Main Script ===

1. console.log("1. Script start")  →  "1. Script start"

2. setTimeout(callback, 200)
   └─ Web API 등록: { label: "setTimeout(200ms)", remainingTicks: 2 }

3. queueMicrotask(callback1)
   └─ Microtask Queue: [callback1]

4. queueMicrotask(callback2)
   └─ Microtask Queue: [callback1, callback2]

5. console.log("2. Script end")  →  "2. Script end"

=== Phase 2: Event Loop ===

6. [Event Loop Check] Main script 완료.

7. [Iter 1]
   ├─ Tick Web APIs: setTimeout 2 → 1 (아직 활성)
   ├─ Web API tick step (1 tick 남음)
   ├─ Drain Microtask Queue:
   │   ├─ Dequeue callback1
   │   │   └─ console.log("3. Microtask: first")  →  "3. Microtask: first"
   │   └─ Dequeue callback2
   │       └─ console.log("4. Microtask: second")  →  "4. Microtask: second"
   └─ Task Queue: (없음)

8. [Iter 2]
   ├─ Tick Web APIs: setTimeout 1 → 0 (완료!)
   ├─ setTimeout callback → Task Queue
   ├─ Drain Microtask Queue: (없음)
   └─ Task pick: setTimeout callback
       ├─ console.log("5. Task: setTimeout fires")  →  "5. Task: setTimeout fires"
       └─ queueMicrotask(innerCallback)
           └─ Microtask Queue: [innerCallback]

9. [Iter 3]
   ├─ Tick Web APIs: (없음)
   ├─ Drain Microtask Queue:
   │   └─ Dequeue innerCallback
   │       └─ console.log("6. Microtask queued inside task")
   │           →  "6. Microtask queued inside task"
   └─ Task Queue: (없음)

10. [Program Complete]
```

### 핵심 원리: 이벤트 루프의 전체 우선순위

```
┌─────────────────────────────────────────────────────────┐
│  1. Call Stack (현재 실행 중인 코드)                        │
│     └─ 스크립트 또는 콜백 실행                              │
│                                                         │
│  2. Microtask Queue (가장 높은 비동기 우선순위)               │
│     └─ Promise.then, queueMicrotask, await 재개           │
│     └─ Call Stack이 비면 즉시 전부 drain                   │
│                                                         │
│  3. Task Queue / Macrotask Queue                        │
│     └─ setTimeout, setInterval, I/O                      │
│     └─ 한 번에 하나만 실행 → 다시 Microtask 확인             │
│                                                         │
│  4. Web APIs (브라우저/런타임이 관리)                        │
│     └─ 타이머 카운트다운, 네트워크 요청 등                    │
│     └─ 완료 시 callback을 Task Queue로 이동                │
└─────────────────────────────────────────────────────────┘
```

### 검증 포인트

| 기능                                      | 엔진 지원 | 실제 JS 동작 일치 |
| ----------------------------------------- | :-------: | :---------------: |
| setTimeout + queueMicrotask 혼합          |    ✅     |        ✅         |
| Microtask가 Macrotask보다 먼저 실행       |    ✅     |        ✅         |
| Task 내부에서 queueMicrotask              |    ✅     |        ✅         |
| Task 내부 Microtask → 다음 Task 전에 실행 |    ✅     |        ✅         |
| 콘솔 출력 순서                            |    ✅     |        ✅         |

---

## 종합 결과

| #   | 스니펫                 | 모드  | 결과 | 주요 검증 항목                |
| --- | ---------------------- | ----- | :--: | ----------------------------- |
| 1   | Fibonacci              | Sync  |  ✅  | 재귀, 조건문, 콜 스택         |
| 2   | Closure Counter        | Sync  |  ✅  | 클로저, 렉시컬 스코프         |
| 3   | Arrow Function         | Sync  |  ✅  | 화살표 함수, 고차 함수        |
| 4   | For Loop               | Sync  |  ✅  | for 문, 블록 스코프           |
| 5   | Scope Demo             | Sync  |  ✅  | 중첩 스코프 체인              |
| 6   | Conditional Logic      | Sync  |  ✅  | if/else, 논리 연산            |
| 7   | Math                   | Sync  |  ✅  | Math 내장 객체, while         |
| 8   | Array & Object         | Sync  |  ✅  | 배열/객체 리터럴 및 접근      |
| 9   | setTimeout Demo        | Async |  ✅  | Web API, Task Queue           |
| 10  | Multiple Timers        | Async |  ✅  | 타이머 지연 비교              |
| 11  | Microtask vs Macrotask | Async |  ✅  | 큐 우선순위                   |
| 12  | Promise Chain          | Async |  ✅  | Promise.resolve, .then        |
| 13  | Fetch (async/await)    | Async |  ✅  | async/await, fetch Web API    |
| 14  | Multiple Await         | Async |  ✅  | 다중 await, continuation 체인 |
| 15  | All Queues Demo        | Async |  ✅  | 전체 이벤트 루프 동작         |

### 알려진 제한사항 (현재 스니펫에는 영향 없음)

1. **`==` (loose equality)**: `runtimeValueToString` 비교 사용 → 실제 JS의 타입 변환 규칙과 다름 (예: `0 == ""` → 엔진 false, 실제 JS true)
2. **`===` 객체 비교**: 항상 같은 kind면 true → 실제 JS의 참조 비교와 다름
3. **`+=` 문자열**: 숫자로만 처리 → 문자열 += 시 NaN 발생 (현재 스니펫에서 미사용)
4. **`const` in await continuation**: await 이후 변수가 `let`으로 재선언됨 (immutability 차이, 현재 스니펫에서 재할당 없어 무영향)
