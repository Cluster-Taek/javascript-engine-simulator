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
];
