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

## Simulators

|                         Engine                          |                          Closure                          |                        this Binding                         |                         Event                         |
| :-----------------------------------------------------: | :-------------------------------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------: |
| ![Engine Simulator](./docs/images/engine-simulator.png) | ![Closure Simulator](./docs/images/closure-simulator.png) | ![this Binding Simulator](./docs/images/this-simulator.png) | ![Event Simulator](./docs/images/event-simulator.png) |
|                 Sync & Async execution                  |                   Heap memory lifecycle                   |                    `this` rule detection                    |                 DOM event propagation                 |

### Engine Simulator

The core simulator. Visualizes synchronous and asynchronous JavaScript execution.

![Engine Simulator Detail](./docs/images/engine-detail.png)

**Sync mode** shows the fundamental execution model:

- **Tokens** — How source code is broken into keywords, identifiers, operators, and literals
- **AST** — The tree structure the parser builds from those tokens
- **Call Stack** — Function calls pushing and popping frames
- **Scope Chain** — How variables are resolved through lexical scoping
- **Console** — Output from `console.log`

**Async mode** adds the full asynchronous runtime:

- **Web APIs** — Where `setTimeout` and `fetch` register and wait
- **Task Queue** (Macrotask) — Callbacks ready to execute after timers/network
- **Microtask Queue** — `Promise.then`, `queueMicrotask`, `await` continuations
- **Event Loop** — The orchestrator that checks the call stack and drains queues in the correct priority order

### Closure Simulator

Dedicated page for understanding closures and memory lifecycle.

![Closure Simulator Detail](./docs/images/closure-detail.png)

- **Heap Memory** — Visualizes environment objects on the heap with active/retained/collected status
- **Scope Chain** — Shows how closures capture variables from enclosing scopes
- **Closure References** — Tracks which closures keep which environments alive
- **GC Visualization** — Watch environments get freed when no longer referenced

### This Binding Simulator

Visualizes how `this` is determined at call time with real-time rule detection.

![this Binding Simulator Detail](./docs/images/this-detail.png)

- **new** — Constructor calls via `new` keyword
- **implicit** — Method calls where `this` = the caller object
- **default** — Standalone calls where `this` = `undefined` (strict mode)
- **arrow** — Arrow functions that inherit `this` from the enclosing scope
- **lost** — Demonstrates broken `this` when methods are extracted

Each rule is color-coded in the source code and tracked through a flow panel.

### Event Simulator

Interactive DOM event propagation visualizer.

![Event Simulator Detail](./docs/images/event-detail.png)

- **DOM Tree** — Build and visualize a DOM structure
- **Propagation** — Watch events flow through capturing → target → bubbling phases

## Built-in Snippets

29 pre-built code examples across all simulators. All produce output identical to real JavaScript engines (V8/SpiderMonkey).

### Engine — Basics (6)

| Snippet           | Demonstrates                               |
| ----------------- | ------------------------------------------ |
| Fibonacci         | Recursion, call stack depth                |
| Closure Counter   | Closures, shared mutable state             |
| Arrow Function    | Arrow syntax, higher-order functions       |
| For Loop          | `for` statement, block scoping             |
| Scope Demo        | Nested scope chain resolution              |
| Conditional Logic | `if`/`else if`, logical `&&` short-circuit |

### Engine — Data & Control (4)

| Snippet          | Demonstrates                            |
| ---------------- | --------------------------------------- |
| Math             | Built-in Math object, `while` loop      |
| Array & Object   | Literals, index/property access         |
| Try/Catch        | Exception handling, `finally` cleanup   |
| Ternary Operator | Conditional expressions, nested ternary |

### Engine — Async Event Loop (7)

| Snippet                | Demonstrates                                    |
| ---------------------- | ----------------------------------------------- |
| setTimeout Demo        | Web API → Task Queue flow                       |
| Multiple Timers        | Shorter delay fires first                       |
| Microtask vs Macrotask | Microtask queue has priority over task queue    |
| Promise Chain          | `Promise.resolve().then()` schedules microtask  |
| Fetch (async/await)    | `await` suspends function, resumes as microtask |
| Multiple Await         | Continuation chaining across sequential awaits  |
| All Queues Demo        | Full event loop lifecycle with nested microtask |

### Engine — This Binding (6)

| Snippet                          | Demonstrates                                   |
| -------------------------------- | ---------------------------------------------- |
| Method Call (this)               | Implicit binding via object method call        |
| Constructor (new + this)         | `new` keyword creates and binds `this`         |
| Dynamic this                     | Same function, different `this` per caller     |
| Lost this                        | Extracting a method loses `this` binding       |
| Arrow vs Regular (this)          | Arrow inherits `this`, regular binds to caller |
| Literal vs Constructor vs Method | Three patterns of `this` behavior compared     |

### Closure Simulator (6)

| Snippet             | Demonstrates                                    |
| ------------------- | ----------------------------------------------- |
| Basic Closure       | Returned function captures outer variable       |
| Closure Memory      | Closure keeps env alive, `null` frees it        |
| Closure in Loop     | `let` creates a new binding per iteration       |
| var vs IIFE vs let  | Three approaches to the classic loop problem    |
| Shared Environment  | Multiple closures over one shared environment   |
| Surviving the Stack | Closures outlive the function that created them |

### This Binding Simulator (6)

| Snippet                          | Demonstrates                             |
| -------------------------------- | ---------------------------------------- |
| Method Call (this)               | Implicit `this` via dot notation         |
| Constructor (new + this)         | `new` creates a fresh object as `this`   |
| Dynamic this                     | `this` is determined at call time        |
| Lost this                        | Extracting a method breaks `this`        |
| Arrow vs Regular (this)          | Lexical vs dynamic `this`                |
| Literal vs Constructor vs Method | Comprehensive `this` behavior comparison |

> Step-by-step execution flow for every snippet: [docs/snippet-flow-analysis.md](./docs/snippet-flow-analysis.md)

## Tech Stack

| Category     | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | Next.js 16 (App Router)                     |
| Language     | TypeScript 5                                |
| UI           | React 19, Tailwind CSS v4                   |
| State        | Zustand (vanilla store)                     |
| Animation    | Motion (Framer Motion v12)                  |
| Editor       | Monaco Editor                               |
| i18n         | next-intl (English / Korean)                |
| Architecture | Feature-Sliced Design                       |
| Testing      | Vitest, Testing Library, Playwright         |
| Linting      | ESLint, Prettier, Steiger (FSD), Commitlint |

## Architecture

```
src/
├── app/[locale]/(main)/        # Next.js routes (engine, closure, this, event)
├── views/                      # Page-level components
├── widgets/                    # Dashboard compositions
├── features/                   # Code editor, debugger, console, language switcher
├── entities/                   # Token, AST, Environment, Call Stack, Closure, etc.
└── shared/
    ├── lib/engine/             # Pure TypeScript engine (no React dependency)
    │   ├── tokenizer/          # Character-by-character scanner
    │   ├── parser/             # Recursive descent + Pratt parsing
    │   └── interpreter/        # Generator-based, yields StepResult per step
    ├── model/                  # Zustand store
    └── config/                 # Snippets, i18n routing
```

The engine is implemented as a **generator-based interpreter** — each `yield` produces a `StepResult` that the UI consumes to animate the current execution state.

## Getting Started

```bash
pnpm install
pnpm dev
```

### Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `pnpm dev`        | Start dev server (port 3000)     |
| `pnpm build`      | Production build                 |
| `pnpm test`       | Run unit tests (Vitest)          |
| `pnpm test:e2e`   | Run e2e tests (Playwright)       |
| `pnpm lint`       | Lint with ESLint                 |
| `pnpm fsd`        | Check FSD architecture (Steiger) |
| `pnpm type-check` | TypeScript type checking         |

## License

MIT
