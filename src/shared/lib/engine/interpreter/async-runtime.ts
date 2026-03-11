import { Environment, createGlobalEnvironment, runtimeValueToString } from './environment';
import { interpret } from './interpreter';
import {
  AwaitSignal,
  type RuntimeValue,
  type StepResult,
  type FunctionValue,
  type NativeFunctionValue,
  type PromiseValue,
  type WebApiEntry,
  type QueueEntry,
  type EventLoopPhase,
  type AsyncRuntimeSnapshot,
} from './types';
import { type Program, type Statement, type BlockStatement } from '../parser/types';

let asyncIdCounter = 0;
function nextAsyncId(): string {
  return `async-${++asyncIdCounter}`;
}

function makeAsyncSnapshot(
  webApis: WebApiEntry[],
  taskQueue: QueueEntry[],
  microtaskQueue: QueueEntry[],
  eventLoopPhase: EventLoopPhase
): AsyncRuntimeSnapshot {
  return {
    webApis: webApis.map((e) => ({ ...e })),
    taskQueue: taskQueue.map((e) => ({ ...e })),
    microtaskQueue: microtaskQueue.map((e) => ({ ...e })),
    eventLoopPhase,
  };
}

export class AsyncRuntime {
  private readonly webApis: WebApiEntry[] = [];
  private readonly taskQueue: QueueEntry[] = [];
  private readonly microtaskQueue: QueueEntry[] = [];
  private eventLoopPhase: EventLoopPhase = 'idle';
  private readonly consoleOutput: string[] = [];

  constructor(private readonly program: Program) {}

  private createGlobalEnvWithAsync(): Environment {
    const env = createGlobalEnvironment();

    // setTimeout
    const webApis = this.webApis;
    const microtaskQueue = this.microtaskQueue;
    const consoleOutput = this.consoleOutput;

    env.declareBuiltin('setTimeout', {
      kind: 'native-function',
      name: 'setTimeout',
      call: (args) => {
        const callback = args[0];
        const delay = args[1];
        if (
          (callback.kind === 'function' || callback.kind === 'native-function') &&
          (delay === undefined || delay.kind === 'number')
        ) {
          const delayMs = delay?.kind === 'number' ? delay.value : 0;
          const ticks = Math.max(1, Math.ceil(delayMs / 100));
          const id = nextAsyncId();
          const entry: WebApiEntry = {
            id,
            label: `setTimeout(${delayMs}ms)`,
            kind: 'timeout',
            callbackLabel: callback.kind === 'function' ? callback.name || '<callback>' : callback.name,
            delay: delayMs,
            remainingTicks: ticks,
            callback: callback as FunctionValue | NativeFunctionValue,
            callbackArgs: [],
          };
          webApis.push(entry);
        }
        return { kind: 'undefined' };
      },
    });

    // queueMicrotask
    env.declareBuiltin('queueMicrotask', {
      kind: 'native-function',
      name: 'queueMicrotask',
      call: (args) => {
        const callback = args[0];
        if (callback.kind === 'function' || callback.kind === 'native-function') {
          const id = nextAsyncId();
          const entry: QueueEntry = {
            id,
            label: `queueMicrotask(${callback.kind === 'function' ? callback.name || '<callback>' : callback.name})`,
            callback: callback as FunctionValue | NativeFunctionValue,
            callbackArgs: [],
          };
          microtaskQueue.push(entry);
        }
        return { kind: 'undefined' };
      },
    });

    // Helper: create a .then() NativeFunctionValue bound to a promise instance
    function makeThenMethod(promise: PromiseValue): NativeFunctionValue {
      return {
        kind: 'native-function',
        name: 'Promise.then',
        call: (thenArgs) => {
          const onFulfilled = thenArgs[0];
          if (onFulfilled && (onFulfilled.kind === 'function' || onFulfilled.kind === 'native-function')) {
            if (promise.state === 'resolved') {
              microtaskQueue.push({
                id: nextAsyncId(),
                label: 'Promise.then callback',
                callback: onFulfilled as FunctionValue | NativeFunctionValue,
                callbackArgs: [promise.value ?? { kind: 'undefined' }],
              });
            } else {
              promise.thenCallbacks.push({ onFulfilled: onFulfilled as FunctionValue | NativeFunctionValue });
            }
          }
          return { kind: 'undefined' };
        },
      };
    }

    // Promise static methods (Promise.resolve, etc.)
    const promiseStaticProps = new Map<string, RuntimeValue>();

    // Promise constructor
    env.declareBuiltin('Promise', {
      kind: 'native-function',
      name: 'Promise',
      properties: promiseStaticProps,
      call: (args) => {
        const executor = args[0];
        const promiseId = nextAsyncId();
        const methods = new Map<string, NativeFunctionValue>();
        const promise: PromiseValue = {
          kind: 'promise',
          id: promiseId,
          state: 'pending',
          thenCallbacks: [],
          methods,
        };

        const resolve: NativeFunctionValue = {
          kind: 'native-function',
          name: 'resolve',
          call: (resolveArgs) => {
            if (promise.state === 'pending') {
              promise.state = 'resolved';
              promise.value = resolveArgs[0] ?? { kind: 'undefined' };
              for (const cb of promise.thenCallbacks) {
                if (cb.onFulfilled) {
                  microtaskQueue.push({
                    id: nextAsyncId(),
                    label: 'Promise.then callback',
                    callback: cb.onFulfilled,
                    callbackArgs: [promise.value ?? { kind: 'undefined' }],
                  });
                }
              }
            }
            return { kind: 'undefined' };
          },
        };
        const reject: NativeFunctionValue = {
          kind: 'native-function',
          name: 'reject',
          call: () => {
            promise.state = 'rejected';
            return { kind: 'undefined' };
          },
        };

        methods.set('then', makeThenMethod(promise));

        if (executor.kind === 'native-function') {
          executor.call([resolve, reject]);
        }
        // For function kind, we can't call synchronously in this context
        // (we'd need a generator) - simplified for now

        return promise;
      },
    });

    // Promise.resolve static method
    promiseStaticProps.set('resolve', {
      kind: 'native-function',
      name: 'Promise.resolve',
      call: (args) => {
        const resolvedValue = args[0] ?? { kind: 'undefined' as const };
        const methods = new Map<string, NativeFunctionValue>();
        const promise: PromiseValue = {
          kind: 'promise',
          id: nextAsyncId(),
          state: 'resolved',
          value: resolvedValue,
          thenCallbacks: [],
          methods,
        };
        methods.set('then', makeThenMethod(promise));
        return promise;
      },
    });

    // fetch Web API
    env.declareBuiltin('fetch', {
      kind: 'native-function',
      name: 'fetch',
      call: (args) => {
        const urlArg = args[0];
        const urlStr = urlArg?.kind === 'string' ? urlArg.value : String(urlArg);
        const promiseId = nextAsyncId();
        const methods = new Map<string, NativeFunctionValue>();
        const fetchPromise: PromiseValue = {
          kind: 'promise',
          id: promiseId,
          state: 'pending',
          thenCallbacks: [],
          methods,
        };
        methods.set('then', makeThenMethod(fetchPromise));

        const responseObj: RuntimeValue = {
          kind: 'object',
          properties: new Map([
            ['status', { kind: 'number', value: 200 }],
            ['ok', { kind: 'boolean', value: true }],
            ['url', { kind: 'string', value: urlStr }],
          ]),
        };

        const resolve: NativeFunctionValue = {
          kind: 'native-function',
          name: 'resolve',
          call: (resolveArgs) => {
            const resolvedValue = resolveArgs[0] ?? { kind: 'undefined' as const };
            if (fetchPromise.state === 'pending') {
              fetchPromise.state = 'resolved';
              fetchPromise.value = resolvedValue;
              for (const cb of fetchPromise.thenCallbacks) {
                if (cb.onFulfilled) {
                  microtaskQueue.push({
                    id: nextAsyncId(),
                    label: 'fetch.then callback',
                    callback: cb.onFulfilled,
                    callbackArgs: [fetchPromise.value ?? { kind: 'undefined' }],
                  });
                }
              }
            }
            return { kind: 'undefined' as const };
          },
        };

        const id = nextAsyncId();
        const entry: WebApiEntry = {
          id,
          label: `fetch(${urlStr.length > 30 ? urlStr.slice(0, 30) + '...' : urlStr})`,
          kind: 'fetch',
          callbackLabel: 'resolve',
          delay: 300,
          remainingTicks: 3,
          callback: resolve,
          callbackArgs: [responseObj],
        };
        webApis.push(entry);

        return fetchPromise;
      },
    });

    // Override console.log to capture output
    env.declareBuiltin('console', {
      kind: 'object',
      properties: new Map([
        [
          'log',
          {
            kind: 'native-function' as const,
            name: 'console.log',
            call: (args: RuntimeValue[]) => {
              const output = args
                .map((a) => {
                  if (a.kind === 'string') return a.value;
                  return runtimeValueToString(a);
                })
                .join(' ');
              consoleOutput.push(output);
              return { kind: 'undefined' as const };
            },
          },
        ],
      ]),
    });

    return env;
  }

  *run(): Generator<StepResult, RuntimeValue, void> {
    const env = this.createGlobalEnvWithAsync();

    // Phase 1: Run main script
    const mainGen = interpret(this.program, env);
    let mainDone = false;
    let lastMainConsoleOutput: string[] = [];

    while (!mainDone) {
      const { value, done } = mainGen.next();
      mainDone = done ?? false;
      if (!mainDone && value) {
        const step = value as StepResult;
        lastMainConsoleOutput = step.consoleOutput as string[];
        // Attach async snapshot to each step
        yield {
          ...step,
          asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, this.eventLoopPhase),
        };
      }
    }

    // Sync main interpreter's console output into this.consoleOutput
    this.consoleOutput.push(...lastMainConsoleOutput);

    // Transition step: call stack is now empty, event loop is about to start
    if (this.webApis.length > 0 || this.taskQueue.length > 0 || this.microtaskQueue.length > 0) {
      yield {
        id: `step-async-${asyncIdCounter++}`,
        kind: 'event-loop-check',
        description: 'Main script complete. Call stack is empty. Event loop begins.',
        environments: [],
        callStack: [],
        consoleOutput: [...this.consoleOutput],
        asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, 'idle'),
      };
    }

    // Phase 2: Event loop
    let loopIterations = 0;
    const MAX_LOOP = 100;

    while (
      (this.webApis.length > 0 || this.taskQueue.length > 0 || this.microtaskQueue.length > 0) &&
      loopIterations++ < MAX_LOOP
    ) {
      this.eventLoopPhase = 'checking-stack';

      // Tick web APIs
      const completed: WebApiEntry[] = [];
      for (const entry of this.webApis) {
        entry.remainingTicks--;
        if (entry.remainingTicks <= 0) {
          completed.push(entry);
        }
      }

      // Remove completed entries from webApis first
      for (const entry of completed) {
        const idx = this.webApis.indexOf(entry);
        if (idx !== -1) this.webApis.splice(idx, 1);
      }

      // Yield tick step for still-active timers (after removing completed)
      if (this.webApis.length > 0) {
        yield {
          id: `step-async-${asyncIdCounter++}`,
          kind: 'web-api-tick',
          description: `Web API tick: ${this.webApis.map((e) => `${e.label} (${e.remainingTicks} ticks left)`).join(', ')}`,
          environments: [],
          callStack: [],
          consoleOutput: [...this.consoleOutput],
          asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, this.eventLoopPhase),
        };
      }

      // Move completed web APIs to task queue (atomic: remove already done above, now push + yield)
      for (const entry of completed) {
        const queueEntry: QueueEntry = {
          id: nextAsyncId(),
          label: `${entry.label} callback`,
          sourceWebApiId: entry.id,
          callback: entry.callback,
          callbackArgs: entry.callbackArgs,
        };

        this.taskQueue.push(queueEntry);

        yield {
          id: `step-async-${asyncIdCounter++}`,
          kind: 'task-enqueue',
          description: `Web API completed: ${entry.label} → callback moved to Task Queue`,
          environments: [],
          callStack: [],
          consoleOutput: [...this.consoleOutput],
          asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, this.eventLoopPhase),
        };
      }

      // Drain microtask queue
      this.eventLoopPhase = 'draining-microtasks';
      while (this.microtaskQueue.length > 0) {
        const microtask = this.microtaskQueue.shift()!;

        yield {
          id: `step-async-${asyncIdCounter++}`,
          kind: 'microtask-dequeue',
          description: `Microtask dequeued: ${microtask.label}`,
          environments: [],
          callStack: [],
          consoleOutput: [...this.consoleOutput],
          asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, this.eventLoopPhase),
        };

        // Execute the microtask callback
        yield* this.executeCallback(microtask, env);
      }

      // Pick one task from task queue
      if (this.taskQueue.length > 0) {
        this.eventLoopPhase = 'picking-task';
        const task = this.taskQueue.shift()!;

        yield {
          id: `step-async-${asyncIdCounter++}`,
          kind: 'task-dequeue',
          description: `Task dequeued: ${task.label}`,
          environments: [],
          callStack: [],
          consoleOutput: [...this.consoleOutput],
          asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, this.eventLoopPhase),
        };

        yield* this.executeCallback(task, env);
      }

      this.eventLoopPhase = 'idle';
    }

    yield {
      id: `step-async-${asyncIdCounter++}`,
      kind: 'program-complete',
      description: 'All tasks completed. Event loop is empty.',
      environments: [],
      callStack: [],
      consoleOutput: [...this.consoleOutput],
      asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, 'idle'),
    };

    return { kind: 'undefined' };
  }

  private *executeCallback(entry: QueueEntry, _parentEnv: Environment): Generator<StepResult, void, void> {
    const { callback, callbackArgs } = entry;

    if (callback.kind === 'native-function') {
      callback.call(callbackArgs);
      return;
    }

    // callback is a FunctionValue - create a mini-program from its body
    const callbackEnv = new Environment(`callback:${callback.name || 'anonymous'}`, callback.closure);
    for (let i = 0; i < callback.params.length; i++) {
      callbackEnv.declare(callback.params[i], 'let', callbackArgs[i] ?? { kind: 'undefined' });
    }

    const miniProgram: Program = {
      type: 'Program',
      body: callback.body.body as Statement[],
    };

    const gen = interpret(miniProgram, callbackEnv);
    let done = false;
    let lastCallbackConsoleOutput: string[] = [];
    while (!done) {
      let result: IteratorResult<StepResult, RuntimeValue>;
      try {
        result = gen.next();
      } catch (e) {
        if (e instanceof AwaitSignal) {
          // Another await encountered inside a continuation — create the next continuation
          this.consoleOutput.push(...lastCallbackConsoleOutput);
          const remainingStatements = e.remainingStatements ?? [];
          const capturedEnv = e.env ?? callbackEnv;
          const continuationBody: BlockStatement = {
            type: 'BlockStatement',
            body: remainingStatements,
          };
          const nextContinuation: FunctionValue = {
            kind: 'function',
            name: '<continuation>',
            params: e.variableName ? [e.variableName] : [],
            body: continuationBody,
            closure: capturedEnv,
          };
          e.promise.thenCallbacks.push({ onFulfilled: nextContinuation });
          return;
        }
        throw e;
      }
      done = result.done ?? false;
      if (!done && result.value) {
        const step = result.value as StepResult;
        lastCallbackConsoleOutput = step.consoleOutput as string[];
        yield {
          ...step,
          consoleOutput: [...this.consoleOutput, ...step.consoleOutput],
          asyncSnapshot: makeAsyncSnapshot(this.webApis, this.taskQueue, this.microtaskQueue, this.eventLoopPhase),
        };
      }
    }
    // Sync callback's new output into this.consoleOutput
    this.consoleOutput.push(...lastCallbackConsoleOutput);
  }
}
