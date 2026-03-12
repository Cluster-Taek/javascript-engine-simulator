import { describe, it, expect } from 'vitest';
import { parse } from '../../parser';
import { tokenize } from '../../tokenizer';
import { interpret, createGlobalEnvironment } from '../index';
import { type RuntimeValue, type StepResult, type ClosureSnapshot, type HeapEnvironmentSnapshot } from '../types';

function run(source: string): {
  steps: StepResult[];
  result: RuntimeValue;
  console: string[];
  lastClosures: readonly ClosureSnapshot[];
  lastHeapSnapshot: readonly HeapEnvironmentSnapshot[];
} {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const env = createGlobalEnvironment();
  const gen = interpret(ast, env);

  const steps: StepResult[] = [];
  let result: RuntimeValue = { kind: 'undefined' };

  while (true) {
    const { value, done } = gen.next();
    if (done) {
      result = value as RuntimeValue;
      break;
    }
    steps.push(value as StepResult);
  }

  const lastStep = steps[steps.length - 1];

  return {
    steps,
    result,
    console: steps.flatMap((s) => (s.kind === 'console-output' ? [s.description.replace('console.log: ', '')] : [])),
    lastClosures: lastStep?.closures ?? [],
    lastHeapSnapshot: lastStep?.heapSnapshot ?? [],
  };
}

// ========================================
// 1. Closure Snippet Execution Tests
// ========================================
describe('closure snippets - execution correctness', () => {
  it('Basic Closure: captures outer variable', () => {
    const { console: output } = run(`
      function outer() {
        let x = 10;
        function inner() {
          return x;
        }
        return inner;
      }

      let fn = outer();
      let result = fn();
      console.log("result:", result);
    `);
    expect(output[0]).toBe('result: 10');
  });

  it('Closure Memory: counter persists across calls, freed after null', () => {
    const { console: output } = run(`
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
      console.log("count:", b);

      counter = null;
      console.log("freed");
    `);
    expect(output[0]).toBe('count: 2');
    expect(output[1]).toBe('freed');
  });

  it('Closure in Loop: each closure captures its own block-scoped value', () => {
    const { console: output } = run(`
      function createFunctions() {
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
    `);
    expect(output[0]).toBe('fn0: 0');
    expect(output[1]).toBe('fn1: 1');
    expect(output[2]).toBe('fn2: 2');
  });

  it('var Loop Problem: all closures share the same i', () => {
    const { console: output } = run(`
      function createFuncs() {
        var funcs = [];
        for (var i = 0; i < 4; i++) {
          funcs.push(function() { return i; });
        }
        return funcs;
      }

      var fns = createFuncs();
      console.log("fn0:", fns[0]());
      console.log("fn1:", fns[1]());
      console.log("fn2:", fns[2]());
      console.log("fn3:", fns[3]());
    `);
    // All should return 4 (the final value of i after loop ends)
    expect(output[0]).toBe('fn0: 4');
    expect(output[1]).toBe('fn1: 4');
    expect(output[2]).toBe('fn2: 4');
    expect(output[3]).toBe('fn3: 4');
  });

  it('IIFE Fix: each IIFE captures current loop value', () => {
    const { console: output } = run(`
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
    `);
    expect(output[0]).toBe('fn0: 0');
    expect(output[1]).toBe('fn1: 1');
    expect(output[2]).toBe('fn2: 2');
    expect(output[3]).toBe('fn3: 3');
  });

  it('Shared Environment: increment and decrement share state', () => {
    const { console: output } = run(`
      function createPair() {
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
    `);
    expect(output[0]).toBe('inc: 1');
    expect(output[1]).toBe('inc: 2');
    expect(output[2]).toBe('dec: 1');
    expect(output[3]).toBe('inc: 2');
  });

  it('Surviving the Stack: independent closure instances', () => {
    const { console: output } = run(`
      function createGreeter(greeting) {
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
    `);
    expect(output[0]).toBe('Hello Alice (#1)');
    expect(output[1]).toBe('Hello Bob (#2)');
    expect(output[2]).toBe('Hi Charlie (#1)');
  });
});

// ========================================
// 2. Closure Snapshot Tracking Tests
// ========================================
describe('closure snapshots - tracking & status', () => {
  it('registers closures that capture non-global scopes', () => {
    const { lastClosures } = run(`
      function outer() {
        let x = 10;
        function inner() {
          return x;
        }
        return inner;
      }
      let fn = outer();
    `);
    expect(lastClosures.length).toBeGreaterThanOrEqual(1);
    const innerClosure = lastClosures.find((c) => c.functionName === 'inner');
    expect(innerClosure).toBeDefined();
    expect(innerClosure!.status).toBe('alive');
  });

  it('marks closure as freed after variable reassignment to null', () => {
    const { steps } = run(`
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
      counter = null;
    `);

    // Find last step before null assignment (closure should be alive)
    const callStep = steps.findLast((s) => s.kind === 'exit-function' && s.closures.length > 0);
    if (callStep) {
      const incrementClosure = callStep.closures.find((c) => c.functionName === 'increment');
      expect(incrementClosure?.status).toBe('alive');
    }

    // After null assignment, closure should be freed
    const lastStep = steps[steps.length - 1];
    const freedClosure = lastStep.closures.find((c) => c.functionName === 'increment');
    expect(freedClosure?.status).toBe('freed');
  });

  it('captures correct variables in closure snapshot', () => {
    const { lastClosures } = run(`
      function outer() {
        let x = 42;
        let y = "hello";
        function inner() {
          return x + y;
        }
        return inner;
      }
      let fn = outer();
    `);
    const innerClosure = lastClosures.find((c) => c.functionName === 'inner');
    expect(innerClosure).toBeDefined();
    const varNames = innerClosure!.capturedVariables.map((v) => v.name);
    expect(varNames).toContain('x');
    expect(varNames).toContain('y');
  });

  it('shared environment shows both closures referencing same env', () => {
    const { lastClosures } = run(`
      function createPair() {
        let shared = 0;
        function inc() { shared++; return shared; }
        function dec() { shared--; return shared; }
        return { increment: inc, decrement: dec };
      }
      let pair = createPair();
    `);
    const incClosure = lastClosures.find((c) => c.functionName === 'inc');
    const decClosure = lastClosures.find((c) => c.functionName === 'dec');
    expect(incClosure).toBeDefined();
    expect(decClosure).toBeDefined();
    // Both should capture the same environment
    expect(incClosure!.capturedEnvId).toBe(decClosure!.capturedEnvId);
    expect(incClosure!.status).toBe('alive');
    expect(decClosure!.status).toBe('alive');
  });

  it('multiple independent closure instances have different env IDs', () => {
    const { lastClosures } = run(`
      function createGreeter(greeting) {
        let count = 0;
        function greet(name) {
          count++;
          return greeting + " " + name;
        }
        return greet;
      }
      let hello = createGreeter("Hello");
      let hi = createGreeter("Hi");
    `);
    const greetClosures = lastClosures.filter((c) => c.functionName === 'greet');
    expect(greetClosures.length).toBe(2);
    // Each instance captures a different environment
    expect(greetClosures[0].capturedEnvId).not.toBe(greetClosures[1].capturedEnvId);
    expect(greetClosures[0].status).toBe('alive');
    expect(greetClosures[1].status).toBe('alive');
  });

  it('does not register global-scoped functions as closures', () => {
    const { lastClosures } = run(`
      function globalFunc() {
        return 42;
      }
      let x = globalFunc();
    `);
    const globalClosure = lastClosures.find((c) => c.functionName === 'globalFunc');
    expect(globalClosure).toBeUndefined();
  });
});

// ========================================
// 3. Heap Snapshot & GC Simulation Tests
// ========================================
describe('heap snapshots - GC status', () => {
  it('shows function environment as retained when closure alive', () => {
    const { lastHeapSnapshot } = run(`
      function outer() {
        let x = 10;
        function inner() { return x; }
        return inner;
      }
      let fn = outer();
    `);
    // Find the function:outer environment
    const outerEnv = lastHeapSnapshot.find((e) => e.label.includes('outer'));
    expect(outerEnv).toBeDefined();
    // outer() has returned so it's not on the call stack, but closure retains it
    expect(outerEnv!.status).toBe('retained');
    expect(outerEnv!.referencedByClosures.length).toBeGreaterThan(0);
  });

  it('shows environment as collected after closure freed', () => {
    const { lastHeapSnapshot } = run(`
      function outer() {
        let x = 10;
        function inner() { return x; }
        return inner;
      }
      let fn = outer();
      fn = null;
    `);
    const outerEnv = lastHeapSnapshot.find((e) => e.label.includes('outer'));
    expect(outerEnv).toBeDefined();
    expect(outerEnv!.status).toBe('collected');
  });

  it('global environment is always active', () => {
    const { lastHeapSnapshot } = run(`
      function outer() {
        let x = 10;
        function inner() { return x; }
        return inner;
      }
      let fn = outer();
    `);
    const globalEnv = lastHeapSnapshot.find((e) => e.label === 'global');
    expect(globalEnv).toBeDefined();
    expect(globalEnv!.status).toBe('active');
  });

  it('function environment is active during execution', () => {
    const { steps } = run(`
      function outer() {
        let x = 10;
        return x;
      }
      let result = outer();
    `);
    // Find a step while inside outer()
    const insideOuter = steps.find(
      (s) => s.kind === 'variable-declare' && s.description.includes(' x ') && s.callStack.length > 1
    );
    if (insideOuter?.heapSnapshot) {
      const outerEnv = insideOuter.heapSnapshot.find((e) => e.label.includes('outer'));
      if (outerEnv) {
        expect(outerEnv.status).toBe('active');
      }
    }
  });

  it('shared environment retained by multiple closures', () => {
    const { lastHeapSnapshot } = run(`
      function createPair() {
        let shared = 0;
        function inc() { shared++; return shared; }
        function dec() { shared--; return shared; }
        return { increment: inc, decrement: dec };
      }
      let pair = createPair();
    `);
    const pairEnv = lastHeapSnapshot.find((e) => e.label.includes('createPair'));
    expect(pairEnv).toBeDefined();
    expect(pairEnv!.status).toBe('retained');
    // Both inc and dec reference this environment
    expect(pairEnv!.referencedByClosures.length).toBe(2);
  });

  it('loop creates per-iteration environments', () => {
    const { lastHeapSnapshot } = run(`
      function createFunctions() {
        let funcs = [];
        for (let i = 0; i < 3; i++) {
          let val = i;
          funcs.push(() => val);
        }
        return funcs;
      }
      let fns = createFunctions();
    `);
    // Should have multiple for-body or block environments
    const iterationEnvs = lastHeapSnapshot.filter(
      (e) => e.label.includes('for-body') || (e.label.includes('block') && e.bindings.some((b) => b.name === 'val'))
    );
    expect(iterationEnvs.length).toBeGreaterThanOrEqual(3);
  });
});

// ========================================
// 4. Closure Edge Cases
// ========================================
describe('closure edge cases', () => {
  it('nested closures: inner closure captures outer closure variable', () => {
    const { console: output } = run(`
      function outer() {
        let x = 1;
        function middle() {
          let y = 2;
          function inner() {
            return x + y;
          }
          return inner;
        }
        return middle;
      }
      let mid = outer();
      let inn = mid();
      console.log(inn());
    `);
    expect(output[0]).toBe('3');
  });

  it('closure captures updated value (not snapshot at creation time)', () => {
    const { console: output } = run(`
      function createCounter() {
        let count = 0;
        function get() { return count; }
        function inc() { count++; }
        return { get: get, inc: inc };
      }
      let c = createCounter();
      c.inc();
      c.inc();
      c.inc();
      console.log(c.get());
    `);
    expect(output[0]).toBe('3');
  });

  it('closure in array element access works correctly', () => {
    const { console: output } = run(`
      function make() {
        let arr = [];
        for (let i = 0; i < 3; i++) {
          arr.push(() => i * 10);
        }
        return arr;
      }
      let fns = make();
      console.log(fns[2]());
    `);
    expect(output[0]).toBe('20');
  });

  it('returned closure modifies captured variable across multiple calls', () => {
    const { console: output } = run(`
      function accumulator(initial) {
        let total = initial;
        function add(n) {
          total += n;
          return total;
        }
        return add;
      }
      let acc = accumulator(100);
      console.log(acc(10));
      console.log(acc(20));
      console.log(acc(30));
    `);
    expect(output[0]).toBe('110');
    expect(output[1]).toBe('130');
    expect(output[2]).toBe('160');
  });

  it('closure captures function parameter correctly', () => {
    const { console: output } = run(`
      function multiplier(factor) {
        return function(x) {
          return x * factor;
        };
      }
      let double = multiplier(2);
      let triple = multiplier(3);
      console.log(double(5));
      console.log(triple(5));
    `);
    expect(output[0]).toBe('10');
    expect(output[1]).toBe('15');
  });
});
