export interface CodeSnippet {
  name: string;
  code: string;
}

export interface SnippetGroup {
  labelKey: string;
  snippets: CodeSnippet[];
}

// ── Default snippet groups (Engine Simulator) ──────────────────────

export const DEFAULT_SNIPPET_GROUPS: SnippetGroup[] = [
  {
    labelKey: 'basics',
    snippets: [
      {
        name: 'Fibonacci',
        code: `function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

let result = fibonacci(6);
console.log("fib(6) =", result);
`,
      },
      {
        name: 'Closure Counter',
        code: `function makeCounter() {
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
console.log("count:", c);
`,
      },
      {
        name: 'Arrow Function',
        code: `let double = (x) => x * 2;
let add = (a, b) => a + b;

function apply(fn, x, y) {
  return fn(x, y);
}

let result = apply(add, 3, 4);
console.log("add:", result);
console.log("double:", double(5));
`,
      },
      {
        name: 'For Loop',
        code: `let sum = 0;
for (let i = 1; i <= 5; i++) {
  sum += i;
}
console.log("sum =", sum);
`,
      },
      {
        name: 'Scope Demo',
        code: `let x = 10;

function outer() {
  let y = 20;
  function inner() {
    let z = 30;
    return x + y + z;
  }
  return inner();
}

let result = outer();
console.log("result:", result);
`,
      },
      {
        name: 'Conditional Logic',
        code: `function classify(score) {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else {
    return "F";
  }
}

let score = 85;
let grade = classify(score);
let passed = score >= 60 && grade !== "F";
console.log("grade:", grade);
console.log("passed:", passed);
`,
      },
    ],
  },
  {
    labelKey: 'dataAndControl',
    snippets: [
      {
        name: 'Math',
        code: `let radius = 5;
let area = Math.PI * Math.pow(radius, 2);
console.log("area:", Math.round(area));

let numbers = [16, 25, 36];
let i = 0;
while (i < numbers.length) {
  console.log("sqrt:", Math.sqrt(numbers[i]));
  i++;
}
`,
      },
      {
        name: 'Array & Object',
        code: `let arr = [1, 2, 3, 4, 5];
let sum = 0;
let i = 0;
while (i < arr.length) {
  sum += arr[i];
  i++;
}

let obj = { name: "JS Engine", version: 1 };
console.log("sum:", sum);
console.log("name:", obj.name);
`,
      },
      {
        name: 'Try/Catch',
        code: `function divide(a, b) {
  if (b === 0) {
    throw "Division by zero";
  }
  return a / b;
}

try {
  let result = divide(10, 2);
  console.log("10 / 2 =", result);
  let bad = divide(5, 0);
  console.log("never reached");
} catch (e) {
  console.log("caught:", e);
} finally {
  console.log("cleanup done");
}
`,
      },
      {
        name: 'Ternary Operator',
        code: `function abs(n) {
  return n >= 0 ? n : -n;
}

let x = -7;
let result = abs(x);
console.log("abs:", result);

let grade = result > 5 ? "high" : "low";
console.log("grade:", grade);

// nested ternary
let label = x > 0 ? "positive" : x < 0 ? "negative" : "zero";
console.log("label:", label);
`,
      },
    ],
  },
  {
    labelKey: 'asyncEventLoop',
    snippets: [
      {
        name: 'setTimeout Demo',
        code: `console.log("start");

setTimeout(function() {
  console.log("timeout callback");
}, 1000);

console.log("end");
`,
      },
      {
        name: 'Multiple Timers',
        code: `console.log("first");

setTimeout(function() {
  console.log("timer A fired");
}, 200);

setTimeout(function() {
  console.log("timer B fired");
}, 100);

console.log("last");
`,
      },
      {
        name: 'Microtask vs Macrotask',
        code: `console.log("script start");

setTimeout(function() {
  console.log("setTimeout");
}, 0);

queueMicrotask(function() {
  console.log("microtask 1");
});

queueMicrotask(function() {
  console.log("microtask 2");
});

console.log("script end");
`,
      },
      {
        name: 'Promise Chain',
        code: `console.log("1. Script start");

Promise.resolve("hello").then(function(value) {
  console.log("3. Promise resolved:", value);
});

queueMicrotask(function() {
  console.log("4. Microtask");
});

console.log("2. Script end");
`,
      },
      {
        name: 'Fetch (async/await)',
        code: `console.log("1. Script start");

async function fetchTestData() {
  console.log("2. Async function start (Sync execution)");
  const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  console.log("4. Fetch finished (Microtask Queue)");
}

fetchTestData();

console.log("3. Script end");
`,
      },
      {
        name: 'Multiple Await',
        code: `console.log("start");

async function fetchSequential() {
  const first = await fetch("https://api.example.com/first");
  console.log("first response received");
  const second = await fetch("https://api.example.com/second");
  console.log("second response received");
  console.log("all done");
}

fetchSequential();

console.log("main script end");
`,
      },
      {
        name: 'All Queues Demo',
        code: `console.log("1. Script start");

// Web API \u2192 Task Queue (macrotask)
setTimeout(function() {
  console.log("5. Task: setTimeout fires");
  queueMicrotask(function() {
    console.log("6. Microtask queued inside task");
  });
}, 200);

// Microtask Queue (runs before task queue)
queueMicrotask(function() {
  console.log("3. Microtask: first");
});

queueMicrotask(function() {
  console.log("4. Microtask: second");
});

console.log("2. Script end");
`,
      },
    ],
  },
];

export const DEFAULT_SNIPPETS: CodeSnippet[] = DEFAULT_SNIPPET_GROUPS.flatMap((g) => g.snippets);

// ── Closure snippet groups (Closure Simulator) ─────────────────────

export const CLOSURE_SNIPPET_GROUPS: SnippetGroup[] = [
  {
    labelKey: 'closureBasics',
    snippets: [
      {
        name: 'Basic Closure',
        code: `function outer() {
  let x = 10;
  function inner() {
    return x;
  }
  return inner;
}

let fn = outer();
let result = fn();
console.log("result:", result);
`,
      },
      {
        name: 'Closure Memory',
        code: `function makeCounter() {
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
console.log("count:", b);

// counter still holds closure
// count lives in memory
counter = null;
// now closure is freed!
console.log("freed");
`,
      },
    ],
  },
  {
    labelKey: 'loopClosures',
    snippets: [
      {
        name: 'Closure in Loop',
        code: `function createFunctions() {
  let funcs = [];
  for (let i = 0; i < 3; i++) {
    let val = i;
    funcs.push(() => val);
  }
  return funcs;
}

let fns = createFunctions();
console.log("fn0:", fns[0]());
console.log("fn1:", fns[1]());
console.log("fn2:", fns[2]());
`,
      },
      {
        name: 'var Loop Problem',
        code: `// var is function-scoped, not block-scoped
// All closures share the SAME "i"
function createFuncs() {
  var funcs = [];
  for (var i = 0; i < 4; i++) {
    funcs.push(function() { return i; });
  }
  return funcs;
}

var fns = createFuncs();
// All return 4 (the final value of i)
console.log("fn0:", fns[0]());
console.log("fn1:", fns[1]());
console.log("fn2:", fns[2]());
console.log("fn3:", fns[3]());
`,
      },
      {
        name: 'IIFE Fix',
        code: `// Fix: wrap in IIFE to capture each value
function createFuncs() {
  var funcs = [];
  for (var i = 0; i < 4; i++) {
    (function(captured) {
      funcs.push(function() { return captured; });
    })(i);
  }
  return funcs;
}

var fns = createFuncs();
console.log("fn0:", fns[0]());
console.log("fn1:", fns[1]());
console.log("fn2:", fns[2]());
console.log("fn3:", fns[3]());
`,
      },
    ],
  },
  {
    labelKey: 'closureAdvanced',
    snippets: [
      {
        name: 'Shared Environment',
        code: `function createPair() {
  let shared = 0;
  function increment() {
    shared++;
    return shared;
  }
  function decrement() {
    shared--;
    return shared;
  }
  return { increment: increment, decrement: decrement };
}

let pair = createPair();
console.log("inc:", pair.increment());
console.log("inc:", pair.increment());
console.log("dec:", pair.decrement());
console.log("inc:", pair.increment());
`,
      },
      {
        name: 'Surviving the Stack',
        code: `function createGreeter(greeting) {
  let count = 0;
  function greet(name) {
    count++;
    return greeting + " " + name + " (#" + count + ")";
  }
  return greet;
}

let hello = createGreeter("Hello");
let hi = createGreeter("Hi");
console.log(hello("Alice"));
console.log(hello("Bob"));
console.log(hi("Charlie"));
`,
      },
    ],
  },
];

export const CLOSURE_SNIPPETS: CodeSnippet[] = CLOSURE_SNIPPET_GROUPS.flatMap((g) => g.snippets);
