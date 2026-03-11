export interface CodeSnippet {
  name: string;
  code: string;
}

export const DEFAULT_SNIPPETS: CodeSnippet[] = [
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

// Web API → Task Queue (macrotask)
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
];
