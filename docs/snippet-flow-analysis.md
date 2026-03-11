# Snippet Execution Flow Analysis

[한국어](./snippet-flow-analysis.ko.md)

This document verifies the execution flow of each snippet by comparing it with how real JavaScript engines work.

---

## Table of Contents

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

**Result: Matches real JS**

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

### Expected Console Output

```
fib(6) = 8
```

### Execution Flow

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

### Verification Points

| Feature                     | Engine Support | Matches Real JS |
| --------------------------- | :------------: | :-------------: |
| Function hoisting           |       ✅       |       ✅        |
| Recursive calls             |       ✅       |       ✅        |
| if/return                   |       ✅       |       ✅        |
| Binary operators (+, -, <=) |       ✅       |       ✅        |
| Call Stack push/pop         |       ✅       |       ✅        |
| console.log multiple args   |       ✅       |       ✅        |

### Call Stack Changes (max depth example)

```
[global] → [global, fibonacci(6)] → [global, fibonacci(6), fibonacci(5)]
→ ... → [global, fibonacci(6), fibonacci(5), fibonacci(4), fibonacci(3), fibonacci(2), fibonacci(1)]
→ (return) [global, fibonacci(6), fibonacci(5), fibonacci(4), fibonacci(3), fibonacci(2)]
→ ...
```

---

## 2. Closure Counter

**Result: Matches real JS**

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

### Expected Console Output

```
count: 3
```

### Execution Flow

```
1. Program Start
2. Function Declaration: makeCounter (hoisted)
3. let counter = makeCounter()
   ├─ Enter function makeCounter()
   ├─ let count = 0        ← bound in makeCounter's scope
   ├─ Function Declaration: increment (hoisted)
   │   └─ closure = makeCounter's Environment (includes count)
   ├─ return increment     ← returns FunctionValue (with closure)
   └─ Exit makeCounter → [Function: increment]
4. counter = [Function: increment]
5. let a = counter()
   ├─ Enter function increment()
   │   └─ Environment: function:increment → parent: function:makeCounter (count=0)
   ├─ count++ → count = 1  ← modifies closure's count
   ├─ return 1
   └─ Exit increment → 1
6. a = 1
7. let b = counter()
   ├─ Enter function increment()
   │   └─ Environment: function:increment → parent: function:makeCounter (count=1)
   ├─ count++ → count = 2  ← modifies same closure's count
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

### Verification Points

| Feature                                  | Engine Support | Matches Real JS |
| ---------------------------------------- | :------------: | :-------------: |
| Closure (lexical scope)                  |       ✅       |       ✅        |
| Returning function as value              |       ✅       |       ✅        |
| UpdateExpression (++)                    |       ✅       |       ✅        |
| Shared closure variable (same reference) |       ✅       |       ✅        |

### Scope Chain

```
When increment is called:
  [function:increment] → [function:makeCounter (count)] → [global]

Key point: increment's closure references makeCounter's Environment.
           count is the same object on the heap, so it accumulates across calls.
```

---

## 3. Arrow Function

**Result: Matches real JS**

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

### Expected Console Output

```
add: 7
double: 10
```

### Execution Flow

```
1. Program Start
2. Function Declaration: apply (hoisted)
3. let double = (x) => x * 2
   └─ ArrowFunctionExpression → body is an expression, wrapped as ReturnStatement
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

### Verification Points

| Feature                                         | Engine Support | Matches Real JS |
| ----------------------------------------------- | :------------: | :-------------: |
| Arrow function (expression body)                |       ✅       |       ✅        |
| Higher-order function (passing function as arg) |       ✅       |       ✅        |
| Automatic return wrapping in arrow functions    |       ✅       |       ✅        |

---

## 4. For Loop

**Result: Matches real JS**

```js
let sum = 0;
for (let i = 1; i <= 5; i++) {
  sum += i;
}
console.log('sum =', sum);
```

### Expected Console Output

```
sum = 15
```

### Execution Flow

```
1. Program Start
2. let sum = 0
3. ForStatement: let i = 1; i <= 5; i++
   ├─ Init: let i = 1  (declared in for-init scope)
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

### Verification Points

| Feature                          | Engine Support | Matches Real JS |
| -------------------------------- | :------------: | :-------------: |
| for statement (init/test/update) |       ✅       |       ✅        |
| let block scope (for-init)       |       ✅       |       ✅        |
| += compound assignment           |       ✅       |       ✅        |
| UpdateExpression (i++)           |       ✅       |       ✅        |

### Scope Structure

```
[global (sum=0)]
  └─ [for-init (i)]
       └─ [for-body] (new Environment per iteration)
```

---

## 5. Scope Demo

**Result: Matches real JS**

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

### Expected Console Output

```
result: 60
```

### Execution Flow

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

### Verification Points

| Feature               | Engine Support | Matches Real JS |
| --------------------- | :------------: | :-------------: |
| Nested functions      |       ✅       |       ✅        |
| Scope chain traversal |       ✅       |       ✅        |
| Lexical scoping       |       ✅       |       ✅        |

### Scope Chain Visualization

```
Variable resolution when inner is called:
  z → [function:inner] ✓
  y → [function:inner] ✗ → [function:outer] ✓
  x → [function:inner] ✗ → [function:outer] ✗ → [global] ✓
```

---

## 6. Conditional Logic

**Result: Matches real JS**

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

### Expected Console Output

```
grade: B
passed: true
```

### Execution Flow

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
   │   ├─ Left: 85 >= 60 → true  (truthy → evaluate right side)
   │   └─ Right: "B" !== "F" → true
   └─ Result: true
7. passed = true
8. console.log("grade:", "B")    →  "grade: B"
9. console.log("passed:", true)  →  "passed: true"
10. Program Complete
```

### Verification Points

| Feature                                   | Engine Support | Matches Real JS |
| ----------------------------------------- | :------------: | :-------------: |
| if / else if / else                       |       ✅       |       ✅        |
| Comparison operators (>=)                 |       ✅       |       ✅        |
| Logical AND (&&) short-circuit evaluation |       ✅       |       ✅        |
| !== (strict inequality)                   |       ✅       |       ✅        |
| Early return in function                  |       ✅       |       ✅        |

---

## 7. Math

**Result: Matches real JS**

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

### Expected Console Output

```
area: 79
sqrt: 4
sqrt: 5
sqrt: 6
```

### Execution Flow

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

### Verification Points

| Feature                         | Engine Support | Matches Real JS |
| ------------------------------- | :------------: | :-------------: |
| Math.PI                         |       ✅       |       ✅        |
| Math.pow()                      |       ✅       |       ✅        |
| Math.round()                    |       ✅       |       ✅        |
| Math.sqrt()                     |       ✅       |       ✅        |
| Array index access (numbers[i]) |       ✅       |       ✅        |
| Array.length                    |       ✅       |       ✅        |
| while statement                 |       ✅       |       ✅        |

---

## 8. Array & Object

**Result: Matches real JS**

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

### Expected Console Output

```
sum: 15
name: JS Engine
```

### Execution Flow

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

### Verification Points

| Feature                               | Engine Support | Matches Real JS |
| ------------------------------------- | :------------: | :-------------: |
| Array literal                         |       ✅       |       ✅        |
| Array index access                    |       ✅       |       ✅        |
| Object literal                        |       ✅       |       ✅        |
| Object property access (dot notation) |       ✅       |       ✅        |
| while + array traversal               |       ✅       |       ✅        |

---

## 9. setTimeout Demo

**Mode: Async** | **Result: Matches real JS**

```js
console.log('start');

setTimeout(function () {
  console.log('timeout callback');
}, 1000);

console.log('end');
```

### Expected Console Output

```
start
end
timeout callback
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("start")  →  "start"
2. setTimeout(callback, 1000)
   └─ Registered in Web API: { label: "setTimeout(1000ms)", remainingTicks: 10 }
3. console.log("end")  →  "end"

=== Phase 2: Event Loop ===

4. [Event Loop Check] Main script complete. Call Stack empty. Event Loop starts.

5. [Tick 1~9] Web API tick: setTimeout(1000ms) countdown
   └─ remainingTicks: 10 → 9 → 8 → ... → 1

6. [Tick 10] setTimeout complete
   └─ Moved to Task Queue: "setTimeout(1000ms) callback"

7. [Task Dequeue] "setTimeout(1000ms) callback"
   ├─ Enter callback
   ├─ console.log("timeout callback")  →  "timeout callback"
   └─ Exit callback

8. [Program Complete] All queues empty.
```

### Event Loop State Changes

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

### Verification Points

| Feature                                     | Engine Support | Matches Real JS |
| ------------------------------------------- | :------------: | :-------------: |
| setTimeout → Web API registration           |       ✅       |       ✅        |
| Async callback runs after script completes  |       ✅       |       ✅        |
| Call Stack must be empty for Task execution |       ✅       |       ✅        |
| Console output order                        |       ✅       |       ✅        |

---

## 10. Multiple Timers

**Mode: Async** | **Result: Matches real JS**

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

### Expected Console Output

```
first
last
timer B fired
timer A fired
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("first")  →  "first"
2. setTimeout(callbackA, 200)
   └─ Web API registered: { label: "setTimeout(200ms)", remainingTicks: 2 }
3. setTimeout(callbackB, 100)
   └─ Web API registered: { label: "setTimeout(100ms)", remainingTicks: 1 }
4. console.log("last")  →  "last"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script complete.

6. [Event Loop Iter 1]
   ├─ Tick Web APIs:
   │   ├─ Timer A: 2 → 1 (still active)
   │   └─ Timer B: 1 → 0 (complete!)
   ├─ Timer B → moved to Task Queue
   ├─ Microtask drain: (none)
   └─ Task pick: Timer B callback
       └─ console.log("timer B fired")  →  "timer B fired"

7. [Event Loop Iter 2]
   ├─ Tick Web APIs:
   │   └─ Timer A: 1 → 0 (complete!)
   ├─ Timer A → moved to Task Queue
   ├─ Microtask drain: (none)
   └─ Task pick: Timer A callback
       └─ console.log("timer A fired")  →  "timer A fired"

8. [Program Complete]
```

### Key Principle

```
Same as real JS:
- Timer with shorter delay completes first
- Engine tick unit: 100ms → ticks = max(1, ceil(delay/100))
  • 200ms → 2 ticks
  • 100ms → 1 tick
- Timer B arrives in Task Queue first → executes first
```

### Verification Points

| Feature                      | Engine Support | Matches Real JS |
| ---------------------------- | :------------: | :-------------: |
| Timer delay comparison       |       ✅       |       ✅        |
| Shorter delay executes first |       ✅       |       ✅        |
| Console output order         |       ✅       |       ✅        |

---

## 11. Microtask vs Macrotask

**Mode: Async** | **Result: Matches real JS**

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

### Expected Console Output

```
script start
script end
microtask 1
microtask 2
setTimeout
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("script start")  →  "script start"
2. setTimeout(callback, 0)
   └─ Web API registered: { label: "setTimeout(0ms)", remainingTicks: 1 }
       ※ Even with delay 0, minimum 1 tick (similar to real JS's minimum 4ms delay)
3. queueMicrotask(callback1)
   └─ Added directly to Microtask Queue: [callback1]
4. queueMicrotask(callback2)
   └─ Added to Microtask Queue: [callback1, callback2]
5. console.log("script end")  →  "script end"

=== Phase 2: Event Loop ===

6. [Event Loop Check] Main script complete.

7. [Event Loop Iter 1]
   ├─ Tick Web APIs:
   │   └─ setTimeout(0ms): 1 → 0 (complete!)
   ├─ setTimeout callback → Task Queue
   ├─ Drain Microtask Queue:
   │   ├─ Dequeue callback1 → console.log("microtask 1")  →  "microtask 1"
   │   └─ Dequeue callback2 → console.log("microtask 2")  →  "microtask 2"
   └─ Task pick: setTimeout callback
       └─ console.log("setTimeout")  →  "setTimeout"

8. [Program Complete]
```

### Key Principle

```
Real JS Event Loop priority:
  1. Call Stack (current execution context)
  2. Microtask Queue (Promise.then, queueMicrotask)
  3. Task Queue / Macrotask Queue (setTimeout, setInterval)

The engine implements the same order:
  - Each Event Loop iteration drains the Microtask Queue first
  - Then picks one task from the Task Queue
```

### Verification Points

| Feature                                   | Engine Support | Matches Real JS |
| ----------------------------------------- | :------------: | :-------------: |
| queueMicrotask                            |       ✅       |       ✅        |
| Microtask > Macrotask priority            |       ✅       |       ✅        |
| setTimeout(fn, 0) still has minimum delay |       ✅       |       ✅        |
| Console output order                      |       ✅       |       ✅        |

---

## 12. Promise Chain

**Mode: Async** | **Result: Matches real JS**

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

### Expected Console Output

```
1. Script start
2. Script end
3. Promise resolved: hello
4. Microtask
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("1. Script start")  →  "1. Script start"

2. Promise.resolve("hello").then(callback)
   ├─ Promise.resolve("hello")
   │   └─ Creates immediately resolved Promise: { state: 'resolved', value: "hello" }
   ├─ .then(callback)
   │   └─ Promise already resolved → callback added to Microtask Queue immediately
   │      Microtask Queue: [{ label: "Promise.then callback", args: ["hello"] }]
   └─ return undefined

3. queueMicrotask(callback)
   └─ Microtask Queue: [Promise.then callback, queueMicrotask callback]

4. console.log("2. Script end")  →  "2. Script end"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script complete.

6. [Event Loop Iter 1]
   ├─ Tick Web APIs: (none)
   ├─ Drain Microtask Queue:
   │   ├─ Dequeue: Promise.then callback(value="hello")
   │   │   └─ console.log("3. Promise resolved:", "hello")  →  "3. Promise resolved: hello"
   │   └─ Dequeue: queueMicrotask callback
   │       └─ console.log("4. Microtask")  →  "4. Microtask"
   └─ Task Queue: (none)

7. [Program Complete]
```

### Key Principle

```
Both Promise.resolve().then() and queueMicrotask() add to the Microtask Queue.
Executed in FIFO order: .then callback entered the queue first, so it runs first.

Same as real JS behavior:
  - Promise.resolve() creates an immediately resolved Promise
  - .then() on a resolved Promise schedules a microtask immediately
  - Microtask Queue follows FIFO order
```

### Verification Points

| Feature                                 | Engine Support | Matches Real JS |
| --------------------------------------- | :------------: | :-------------: |
| Promise.resolve()                       |       ✅       |       ✅        |
| .then() on resolved Promise → microtask |       ✅       |       ✅        |
| .then callback argument passing         |       ✅       |       ✅        |
| Microtask FIFO order                    |       ✅       |       ✅        |
| Console output order                    |       ✅       |       ✅        |

---

## 13. Fetch (async/await)

**Mode: Async** | **Result: Matches real JS**

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

### Expected Console Output

```
1. Script start
2. Async function start (Sync execution)
3. Script end
4. Fetch finished (Microtask Queue)
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("1. Script start")  →  "1. Script start"

2. Function Declaration: fetchTestData (async, hoisted)

3. fetchTestData()
   ├─ Enter async function fetchTestData()
   ├─ console.log("2. Async function start (Sync execution)")
   │   →  "2. Async function start (Sync execution)"
   │   ※ Inside async function, code before await runs synchronously!
   ├─ const response = await fetch("https://...")
   │   ├─ fetch() call → registered in Web API
   │   │   └─ { label: "fetch(...)", kind: "fetch", remainingTicks: 3 }
   │   ├─ Promise returned by fetch() is in pending state
   │   ├─ await → AwaitSignal triggered!
   │   ├─ Continuation created:
   │   │   └─ { name: "<continuation:fetchTestData>", params: ["response"], body: [console.log("4. ...")] }
   │   ├─ Continuation → registered in fetchPromise.thenCallbacks
   │   └─ Async function paused → removed from Call Stack
   └─ Return: Promise (pending)

4. console.log("3. Script end")  →  "3. Script end"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script complete.

6. [Event Loop Iter 1~2]
   └─ Tick Web APIs: fetch countdown (3 → 2 → 1)

7. [Event Loop Iter 3]
   ├─ Tick: fetch 1 → 0 (complete!)
   ├─ fetch complete → resolve function moved to Task Queue
   ├─ Drain Microtask Queue: (none)
   └─ Task pick: resolve
       ├─ resolve executed: fetchPromise.state = 'resolved'
       ├─ thenCallbacks processed:
       │   └─ continuation → added to Microtask Queue

8. [Event Loop Iter 4]
   ├─ Drain Microtask Queue:
   │   └─ Dequeue: continuation(response=ResponseObject)
   │       ├─ response bound to { status: 200, ok: true, url: "..." }
   │       └─ console.log("4. Fetch finished (Microtask Queue)")
   │           →  "4. Fetch finished (Microtask Queue)"
   └─ Task Queue: (none)

9. [Program Complete]
```

### Key Principle

```
How async/await actually works:
  1. async function starts executing synchronously when called
  2. When it hits await, execution pauses and function is removed from Call Stack
  3. Control returns to the caller (→ "3. Script end" is printed)
  4. When the awaited Promise resolves, remaining code is scheduled as a Microtask

Engine implementation:
  - AwaitSignal halts function execution
  - Remaining code is captured as a continuation function
  - Continuation registered in Promise's thenCallbacks
  - When Promise resolves, continuation is added to Microtask Queue
```

### Verification Points

| Feature                            | Engine Support | Matches Real JS |
| ---------------------------------- | :------------: | :-------------: |
| async function declaration         |       ✅       |       ✅        |
| Synchronous execution before await |       ✅       |       ✅        |
| Function pauses at await           |       ✅       |       ✅        |
| fetch → Web API registration       |       ✅       |       ✅        |
| Resumes as Microtask after await   |       ✅       |       ✅        |
| Console output order               |       ✅       |       ✅        |

---

## 14. Multiple Await

**Mode: Async** | **Result: Matches real JS**

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

### Expected Console Output

```
start
main script end
first response received
second response received
all done
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("start")  →  "start"

2. Function Declaration: fetchSequential (async, hoisted)

3. fetchSequential()
   ├─ Enter async function fetchSequential()
   ├─ const first = await fetch(".../first")
   │   ├─ fetch(".../first") → Web API registered (3 ticks)
   │   ├─ await → AwaitSignal!
   │   ├─ Continuation 1 created:
   │   │   params: ["first"]
   │   │   body: [console.log("first..."), const second = await fetch(...), ...]
   │   └─ Async function paused
   └─ Return: Promise (pending)

4. console.log("main script end")  →  "main script end"

=== Phase 2: Event Loop ===

5. [Event Loop Check] Main script complete.

6. [Iter 1~2] Web API tick: fetch#1 countdown (3 → 2 → 1)

7. [Iter 3] fetch#1 complete
   ├─ resolve → Task Queue
   └─ Task pick: resolve#1
       ├─ fetchPromise#1 resolved
       └─ Continuation 1 → Microtask Queue

8. [Iter 4] Drain Microtask Queue
   ├─ Continuation 1 executed (first = ResponseObject)
   ├─ console.log("first response received")  →  "first response received"
   ├─ const second = await fetch(".../second")
   │   ├─ fetch(".../second") → Web API registered (3 ticks)  ← new fetch!
   │   ├─ await → AwaitSignal!
   │   └─ Continuation 2 created:
   │       params: ["second"]
   │       body: [console.log("second..."), console.log("all done")]
   └─ Continuation 1 terminated (suspended)

9. [Iter 5~6] Web API tick: fetch#2 countdown (3 → 2 → 1)

10. [Iter 7] fetch#2 complete
    ├─ resolve → Task Queue
    └─ Task pick: resolve#2
        ├─ fetchPromise#2 resolved
        └─ Continuation 2 → Microtask Queue

11. [Iter 8] Drain Microtask Queue
    ├─ Continuation 2 executed (second = ResponseObject)
    ├─ console.log("second response received")  →  "second response received"
    └─ console.log("all done")  →  "all done"

12. [Program Complete]
```

### Key Principle

```
How multiple await works:
  1. Function pauses at each await
  2. Remaining code is captured as a continuation
  3. When the first await's Promise resolves, continuation runs as a Microtask
  4. Inside that, the second await pauses the function again
  5. The second fetch follows the same process

This exactly matches real JS async/await behavior:
  - Sequential await = sequential async processing
  - Each await only starts the next operation after the previous result resolves
```

### Continuation Chain Visualization

```
fetchSequential()
  ├─ [sync] await fetch#1 → paused
  │
  ├─ [Continuation 1] (runs after fetch#1 resolves)
  │   ├─ "first response received"
  │   └─ await fetch#2 → paused
  │
  └─ [Continuation 2] (runs after fetch#2 resolves)
      ├─ "second response received"
      └─ "all done"
```

### Verification Points

| Feature                                       | Engine Support | Matches Real JS |
| --------------------------------------------- | :------------: | :-------------: |
| Multiple await                                |       ✅       |       ✅        |
| Sequential async execution                    |       ✅       |       ✅        |
| Continuation chaining                         |       ✅       |       ✅        |
| Second fetch registered after first completes |       ✅       |       ✅        |
| Console output order                          |       ✅       |       ✅        |

---

## 15. All Queues Demo

**Mode: Async** | **Result: Matches real JS**

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

### Expected Console Output

```
1. Script start
2. Script end
3. Microtask: first
4. Microtask: second
5. Task: setTimeout fires
6. Microtask queued inside task
```

### Execution Flow

```
=== Phase 1: Main Script ===

1. console.log("1. Script start")  →  "1. Script start"

2. setTimeout(callback, 200)
   └─ Web API registered: { label: "setTimeout(200ms)", remainingTicks: 2 }

3. queueMicrotask(callback1)
   └─ Microtask Queue: [callback1]

4. queueMicrotask(callback2)
   └─ Microtask Queue: [callback1, callback2]

5. console.log("2. Script end")  →  "2. Script end"

=== Phase 2: Event Loop ===

6. [Event Loop Check] Main script complete.

7. [Iter 1]
   ├─ Tick Web APIs: setTimeout 2 → 1 (still active)
   ├─ Web API tick step (1 tick remaining)
   ├─ Drain Microtask Queue:
   │   ├─ Dequeue callback1
   │   │   └─ console.log("3. Microtask: first")  →  "3. Microtask: first"
   │   └─ Dequeue callback2
   │       └─ console.log("4. Microtask: second")  →  "4. Microtask: second"
   └─ Task Queue: (none)

8. [Iter 2]
   ├─ Tick Web APIs: setTimeout 1 → 0 (complete!)
   ├─ setTimeout callback → Task Queue
   ├─ Drain Microtask Queue: (none)
   └─ Task pick: setTimeout callback
       ├─ console.log("5. Task: setTimeout fires")  →  "5. Task: setTimeout fires"
       └─ queueMicrotask(innerCallback)
           └─ Microtask Queue: [innerCallback]

9. [Iter 3]
   ├─ Tick Web APIs: (none)
   ├─ Drain Microtask Queue:
   │   └─ Dequeue innerCallback
   │       └─ console.log("6. Microtask queued inside task")
   │           →  "6. Microtask queued inside task"
   └─ Task Queue: (none)

10. [Program Complete]
```

### Key Principle: Full Event Loop Priority

```
┌─────────────────────────────────────────────────────────┐
│  1. Call Stack (currently executing code)                │
│     └─ Script or callback execution                     │
│                                                         │
│  2. Microtask Queue (highest async priority)            │
│     └─ Promise.then, queueMicrotask, await resume       │
│     └─ Drains completely when Call Stack is empty        │
│                                                         │
│  3. Task Queue / Macrotask Queue                        │
│     └─ setTimeout, setInterval, I/O                     │
│     └─ One at a time → check Microtasks again           │
│                                                         │
│  4. Web APIs (managed by browser/runtime)               │
│     └─ Timer countdowns, network requests, etc.         │
│     └─ Moves callback to Task Queue on completion       │
└─────────────────────────────────────────────────────────┘
```

### Verification Points

| Feature                               | Engine Support | Matches Real JS |
| ------------------------------------- | :------------: | :-------------: |
| setTimeout + queueMicrotask mixed     |       ✅       |       ✅        |
| Microtask executes before Macrotask   |       ✅       |       ✅        |
| queueMicrotask inside a Task          |       ✅       |       ✅        |
| Inner Microtask runs before next Task |       ✅       |       ✅        |
| Console output order                  |       ✅       |       ✅        |

---

## Summary

| #   | Snippet                | Mode  | Result | Key Verification Items                  |
| --- | ---------------------- | ----- | :----: | --------------------------------------- |
| 1   | Fibonacci              | Sync  |   ✅   | Recursion, conditionals, call stack     |
| 2   | Closure Counter        | Sync  |   ✅   | Closures, lexical scope                 |
| 3   | Arrow Function         | Sync  |   ✅   | Arrow functions, higher-order functions |
| 4   | For Loop               | Sync  |   ✅   | for statement, block scope              |
| 5   | Scope Demo             | Sync  |   ✅   | Nested scope chains                     |
| 6   | Conditional Logic      | Sync  |   ✅   | if/else, logical operators              |
| 7   | Math                   | Sync  |   ✅   | Math built-in object, while             |
| 8   | Array & Object         | Sync  |   ✅   | Array/object literals and access        |
| 9   | setTimeout Demo        | Async |   ✅   | Web API, Task Queue                     |
| 10  | Multiple Timers        | Async |   ✅   | Timer delay comparison                  |
| 11  | Microtask vs Macrotask | Async |   ✅   | Queue priority                          |
| 12  | Promise Chain          | Async |   ✅   | Promise.resolve, .then                  |
| 13  | Fetch (async/await)    | Async |   ✅   | async/await, fetch Web API              |
| 14  | Multiple Await         | Async |   ✅   | Multiple await, continuation chain      |
| 15  | All Queues Demo        | Async |   ✅   | Full event loop behavior                |

### Known Limitations (not affecting current snippets)

1. **`==` (loose equality)**: Uses `runtimeValueToString` comparison → differs from real JS type coercion rules (e.g., `0 == ""` → engine: false, real JS: true)
2. **`===` object comparison**: Always true if same kind → differs from real JS reference comparison
3. **`+=` strings**: Treated as numbers only → string += results in NaN (unused in current snippets)
4. **`const` in await continuation**: Variables after await are redeclared as `let` (immutability difference, no reassignment in current snippets so no impact)
