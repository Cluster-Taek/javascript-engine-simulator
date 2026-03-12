import { createStore, useStore } from 'zustand';
import { AsyncRuntime } from '../lib/engine/interpreter';
import {
  type StepResult,
  type EnvironmentSnapshot,
  type StackFrame,
  type ClosureSnapshot,
  type HeapEnvironmentSnapshot,
  type WebApiEntry,
  type QueueEntry,
  type EventLoopPhase,
} from '../lib/engine/interpreter';
import { parse } from '../lib/engine/parser';
import { type Program } from '../lib/engine/parser';
import { tokenize } from '../lib/engine/tokenizer';
import { type Token } from '../lib/engine/tokenizer';

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

const MAX_STEP_HISTORY = 500;

interface EngineState {
  sourceCode: string;
  tokens: Token[];
  ast: Program | null;
  parseError: string | null;
  generator: Generator<StepResult, unknown, void> | null;
  currentStep: StepResult | null;
  stepHistory: StepResult[];
  stepIndex: number;
  callStack: readonly StackFrame[];
  environments: readonly EnvironmentSnapshot[];
  consoleOutput: string[];
  executionStatus: ExecutionStatus;
  currentLine: number | null;
  currentAstNodeId: string | null;
  executionSpeed: number;
  intervalId: ReturnType<typeof setInterval> | null;
  breakpoints: Set<number>;
  // Closure tracking
  closures: readonly ClosureSnapshot[];
  // Heap snapshot
  heapSnapshot: readonly HeapEnvironmentSnapshot[];
  // Async runtime state
  webApis: WebApiEntry[];
  taskQueue: QueueEntry[];
  microtaskQueue: QueueEntry[];
  eventLoopPhase: EventLoopPhase;
}

interface EngineActions {
  setSourceCode: (code: string) => void;
  parse: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
  run: () => void;
  pause: () => void;
  setExecutionSpeed: (ms: number) => void;
  toggleBreakpoint: (line: number) => void;
}

type EngineStore = EngineState & EngineActions;

const DEFAULT_CODE = `// JavaScript Engine Simulator
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

let result = fibonacci(6);
console.log("fib(6) =", result);
`;

const initialState: EngineState = {
  sourceCode: DEFAULT_CODE,
  tokens: [],
  ast: null,
  parseError: null,
  generator: null,
  currentStep: null,
  stepHistory: [],
  stepIndex: -1,
  callStack: [],
  environments: [],
  consoleOutput: [],
  executionStatus: 'idle',
  currentLine: null,
  currentAstNodeId: null,
  executionSpeed: 500,
  intervalId: null,
  breakpoints: new Set(),
  closures: [],
  heapSnapshot: [],
  webApis: [],
  taskQueue: [],
  microtaskQueue: [],
  eventLoopPhase: 'idle',
};

export const engineStore = createStore<EngineStore>()((set, get) => ({
  ...initialState,

  setSourceCode: (code) => {
    try {
      const tokens = tokenize(code);
      parse(tokens);
      set({ sourceCode: code, parseError: null });
    } catch (e) {
      set({ sourceCode: code, parseError: e instanceof Error ? e.message : String(e) });
    }
  },

  parse: () => {
    const { sourceCode } = get();
    try {
      const tokens = tokenize(sourceCode);
      const ast = parse(tokens);
      set({ tokens, ast, parseError: null });
    } catch (e) {
      set({ parseError: e instanceof Error ? e.message : String(e) });
    }
  },

  reset: () => {
    const { intervalId, sourceCode } = get();
    if (intervalId !== null) clearInterval(intervalId);
    let parseError: string | null = null;
    try {
      parse(tokenize(sourceCode));
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }
    set({
      tokens: [],
      ast: null,
      generator: null,
      currentStep: null,
      stepHistory: [],
      stepIndex: -1,
      callStack: [],
      environments: [],
      consoleOutput: [],
      executionStatus: 'idle',
      currentLine: null,
      currentAstNodeId: null,
      intervalId: null,
      breakpoints: new Set(),
      closures: [],
      heapSnapshot: [],
      webApis: [],
      taskQueue: [],
      microtaskQueue: [],
      eventLoopPhase: 'idle',
      parseError,
    });
  },

  stepForward: () => {
    const state = get();
    const { executionStatus, stepIndex, stepHistory } = state;
    let { generator, ast } = state;

    if (executionStatus === 'completed' || executionStatus === 'error') return;

    // If replaying history (stepped back earlier)
    if (stepIndex < stepHistory.length - 1) {
      const nextIndex = stepIndex + 1;
      const step = stepHistory[nextIndex];
      const asyncSnapshot = step.asyncSnapshot;
      set({
        stepIndex: nextIndex,
        currentStep: step,
        callStack: step.callStack,
        environments: step.environments,
        consoleOutput: [...step.consoleOutput],
        closures: step.closures,
        heapSnapshot: step.heapSnapshot ?? [],
        currentLine: step.loc?.start.line ?? null,
        executionStatus: executionStatus === 'running' ? 'running' : 'paused',
        ...(asyncSnapshot
          ? {
              webApis: [...asyncSnapshot.webApis] as WebApiEntry[],
              taskQueue: [...asyncSnapshot.taskQueue] as QueueEntry[],
              microtaskQueue: [...asyncSnapshot.microtaskQueue] as QueueEntry[],
              eventLoopPhase: asyncSnapshot.eventLoopPhase,
            }
          : {}),
      });
      return;
    }

    // Initialize generator if needed
    if (generator === null) {
      if (ast === null) {
        get().parse();
        ast = get().ast;
        if (ast === null) return;
      }
      try {
        const runtime = new AsyncRuntime(ast);
        const gen = runtime.run() as Generator<StepResult, unknown, void>;
        generator = gen;
        set({ generator: gen, executionStatus: 'paused', consoleOutput: [] });
      } catch (e) {
        set({ executionStatus: 'error', parseError: e instanceof Error ? e.message : String(e) });
        return;
      }
    }

    try {
      const { value, done } = generator.next();
      if (done) {
        set({ executionStatus: 'completed' });
        return;
      }
      const step = value as StepResult;
      let newHistory = [...stepHistory, step];
      let newIndex = newHistory.length - 1;

      // Trim history if exceeds limit
      if (newHistory.length > MAX_STEP_HISTORY) {
        newHistory = newHistory.slice(newHistory.length - MAX_STEP_HISTORY);
        newIndex = newHistory.length - 1;
      }

      const asyncSnapshot = step.asyncSnapshot;

      set({
        currentStep: step,
        stepHistory: newHistory,
        stepIndex: newIndex,
        callStack: step.callStack,
        environments: step.environments,
        consoleOutput: [...step.consoleOutput],
        closures: step.closures,
        heapSnapshot: step.heapSnapshot ?? [],
        currentLine: step.loc?.start.line ?? null,
        executionStatus: executionStatus === 'running' ? 'running' : 'paused',
        ...(asyncSnapshot
          ? {
              webApis: [...asyncSnapshot.webApis] as WebApiEntry[],
              taskQueue: [...asyncSnapshot.taskQueue] as QueueEntry[],
              microtaskQueue: [...asyncSnapshot.microtaskQueue] as QueueEntry[],
              eventLoopPhase: asyncSnapshot.eventLoopPhase,
            }
          : {}),
      });
    } catch (e) {
      set({
        executionStatus: 'error',
        parseError: e instanceof Error ? e.message : String(e),
      });
    }
  },

  run: () => {
    const { intervalId, executionSpeed } = get();
    if (intervalId !== null) return;

    // Initialize if needed
    const state = get();
    if (state.generator === null) {
      state.parse();
      const ast = get().ast;
      if (ast === null) return;
      const runtime = new AsyncRuntime(ast);
      const gen = runtime.run() as Generator<StepResult, unknown, void>;
      set({ generator: gen, consoleOutput: [] });
    }

    set({ executionStatus: 'running' });

    const id = setInterval(() => {
      const currentState = get();
      if (
        currentState.executionStatus === 'completed' ||
        currentState.executionStatus === 'error' ||
        currentState.executionStatus === 'paused'
      ) {
        clearInterval(id);
        set({ intervalId: null });
        return;
      }
      get().stepForward();
      const afterStep = get();
      if (afterStep.executionStatus === 'completed' || afterStep.executionStatus === 'error') {
        clearInterval(id);
        set({ intervalId: null });
      } else if (afterStep.currentLine !== null && afterStep.breakpoints.has(afterStep.currentLine)) {
        clearInterval(id);
        set({ intervalId: null, executionStatus: 'paused' });
      }
    }, executionSpeed);

    set({ intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId !== null) {
      clearInterval(intervalId);
      set({ intervalId: null, executionStatus: 'paused' });
    }
  },

  setExecutionSpeed: (ms) => {
    set({ executionSpeed: ms });
  },

  stepBack: () => {
    const { stepIndex, stepHistory, executionStatus, intervalId } = get();

    // Pause if running
    if (intervalId !== null) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }

    if (stepIndex <= 0 || stepHistory.length === 0) return;

    const prevIndex = stepIndex - 1;
    const step = stepHistory[prevIndex];
    const asyncSnapshot = step.asyncSnapshot;

    set({
      stepIndex: prevIndex,
      currentStep: step,
      callStack: step.callStack,
      environments: step.environments,
      consoleOutput: [...step.consoleOutput],
      closures: step.closures,
      heapSnapshot: step.heapSnapshot ?? [],
      currentLine: step.loc?.start.line ?? null,
      executionStatus: executionStatus === 'completed' || executionStatus === 'error' ? 'paused' : executionStatus,
      ...(asyncSnapshot
        ? {
            webApis: [...asyncSnapshot.webApis] as WebApiEntry[],
            taskQueue: [...asyncSnapshot.taskQueue] as QueueEntry[],
            microtaskQueue: [...asyncSnapshot.microtaskQueue] as QueueEntry[],
            eventLoopPhase: asyncSnapshot.eventLoopPhase,
          }
        : {}),
    });
  },

  toggleBreakpoint: (line) => {
    const { breakpoints } = get();
    const next = new Set(breakpoints);
    if (next.has(line)) {
      next.delete(line);
    } else {
      next.add(line);
    }
    set({ breakpoints: next });
  },
}));

// React hooks
export function useEngineStore<T>(selector: (state: EngineStore) => T): T {
  return useStore(engineStore, selector);
}
