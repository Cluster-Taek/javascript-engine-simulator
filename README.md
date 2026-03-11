# JavaScript Engine Simulator

An interactive simulator that visualizes how JavaScript actually works under the hood.

[한국어](./README.ko.md)

![JavaScript Engine Simulator](./docs/images/hero-banner.png)

## What It Does

Write JavaScript code and watch it execute step by step through the real engine pipeline:

```
Source Code → Tokenizer → Parser → Interpreter
```

Each stage is visualized in real time — you can see tokens being generated, the AST being built, the call stack growing and shrinking, scope chains forming, and variables changing as the code runs.

### Sync Mode

Visualizes the core execution model:

- **Tokens** — How source code is broken into keywords, identifiers, operators, and literals
- **AST** — The tree structure the parser builds from those tokens
- **Call Stack** — Function calls pushing and popping frames
- **Scope Chain** — How variables are resolved through lexical scoping and closures
- **Console** — Output from `console.log`

### Async Mode

Adds the full asynchronous runtime visualization:

- **Web APIs** — Where `setTimeout` and `fetch` register and wait
- **Task Queue** (Macrotask) — Callbacks ready to execute after timers/network
- **Microtask Queue** — `Promise.then`, `queueMicrotask`, `await` continuations
- **Event Loop** — The orchestrator that checks the call stack and drains queues in the correct priority order

## Built-in Snippets

15 pre-built code examples covering key JavaScript concepts. All produce output identical to real JavaScript engines (V8/SpiderMonkey).

### Sync (8 snippets)

| Snippet           | Demonstrates                               |
| ----------------- | ------------------------------------------ |
| Fibonacci         | Recursion, call stack depth                |
| Closure Counter   | Closures, shared mutable state             |
| Arrow Function    | Arrow syntax, higher-order functions       |
| For Loop          | `for` statement, block scoping             |
| Scope Demo        | Nested scope chain resolution              |
| Conditional Logic | `if`/`else if`, logical `&&` short-circuit |
| Math              | Built-in Math object, `while` loop         |
| Array & Object    | Literals, index/property access            |

### Async (7 snippets)

| Snippet                | Demonstrates                                    |
| ---------------------- | ----------------------------------------------- |
| setTimeout Demo        | Web API → Task Queue flow                       |
| Multiple Timers        | Shorter delay fires first                       |
| Microtask vs Macrotask | Microtask queue has priority over task queue    |
| Promise Chain          | `Promise.resolve().then()` schedules microtask  |
| Fetch (async/await)    | `await` suspends function, resumes as microtask |
| Multiple Await         | Continuation chaining across sequential awaits  |
| All Queues Demo        | Full event loop lifecycle with nested microtask |

> Step-by-step execution flow for every snippet: [docs/snippet-flow-analysis.md](./docs/snippet-flow-analysis.md)

## Getting Started

```bash
pnpm install
pnpm dev
```

## License

MIT
