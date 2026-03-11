import { describe, it, expect } from 'vitest';
import { parse } from '../../parser';
import { tokenize } from '../../tokenizer';
import { interpret, createGlobalEnvironment } from '../index';
import { type RuntimeValue, type StepResult } from '../types';

function run(source: string): { steps: StepResult[]; result: RuntimeValue; console: string[] } {
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

  return {
    steps,
    result,
    console: steps.flatMap((s) => (s.kind === 'console-output' ? [s.description.replace('console.log: ', '')] : [])),
  };
}

describe('interpreter', () => {
  it('evaluates numeric literal', () => {
    run('5;');
    // just ensure it doesn't throw
  });

  it('evaluates variable declaration', () => {
    const { steps } = run('let x = 42;');
    const declStep = steps.find((s) => s.kind === 'variable-declare');
    expect(declStep).toBeDefined();
    expect(declStep?.description).toContain('x');
  });

  it('evaluates arithmetic', () => {
    const { steps } = run('let x = 2 + 3 * 4;');
    const declStep = steps.find((s) => s.kind === 'variable-declare' && s.description.includes('x'));
    expect(declStep?.value).toEqual({ kind: 'number', value: 14 });
  });

  it('evaluates if statement true branch', () => {
    const { steps } = run('let x = 5; if (x > 0) { let y = 1; }');
    const condStep = steps.find((s) => s.kind === 'condition-test');
    expect(condStep?.description).toContain('true branch');
  });

  it('evaluates if-else false branch', () => {
    const { steps } = run('let x = -1; if (x > 0) { let a = 1; } else { let b = 2; }');
    const condStep = steps.find((s) => s.kind === 'condition-test');
    expect(condStep?.description).toContain('false branch');
  });

  it('executes while loop', () => {
    const { steps } = run('let i = 0; while (i < 3) { i++; }');
    const loopSteps = steps.filter((s) => s.kind === 'loop-test');
    expect(loopSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('executes for loop', () => {
    const { steps } = run('let sum = 0; for (let i = 0; i < 3; i++) { sum += i; }');
    const loopSteps = steps.filter((s) => s.kind === 'loop-test');
    expect(loopSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('calls function and returns value', () => {
    const { steps } = run('function add(a, b) { return a + b; } let result = add(2, 3);');
    const retStep = steps.find((s) => s.kind === 'return');
    expect(retStep?.value).toEqual({ kind: 'number', value: 5 });
  });

  it('console.log outputs to console', () => {
    const { console: output } = run('console.log("hello", 42);');
    expect(output[0]).toBe('hello 42');
  });

  it('supports closures', () => {
    const { steps } = run(`
      function makeCounter() {
        let count = 0;
        function increment() {
          count++;
          return count;
        }
        return increment;
      }
      let inc = makeCounter();
      let a = inc();
      let b = inc();
    `);
    const bDecl = steps.findLast((s) => s.kind === 'variable-declare' && s.description.includes(' b '));
    expect(bDecl?.value).toEqual({ kind: 'number', value: 2 });
  });

  it('supports recursive functions', () => {
    const { steps } = run(`
      function fib(n) {
        if (n <= 1) { return n; }
        return fib(n - 1) + fib(n - 2);
      }
      let result = fib(6);
    `);
    const resultDecl = steps.findLast((s) => s.kind === 'variable-declare' && s.description.includes(' result '));
    expect(resultDecl?.value).toEqual({ kind: 'number', value: 8 });
  });

  it('throws on const reassignment', () => {
    expect(() => run('const x = 1; x = 2;')).toThrow();
  });

  it('throws on undefined variable', () => {
    expect(() => run('console.log(y);')).toThrow();
  });

  it('tracks call stack during function call', () => {
    const { steps } = run('function foo() { return 1; } foo();');
    const enterStep = steps.find((s) => s.kind === 'enter-function');
    expect(enterStep?.callStack).toHaveLength(2); // global + foo
  });

  it('evaluates array literal', () => {
    const { steps } = run('let arr = [1, 2, 3];');
    const declStep = steps.find((s) => s.kind === 'variable-declare' && s.description.includes('arr'));
    expect(declStep?.value?.kind).toBe('array');
  });

  it('evaluates object literal', () => {
    const { steps } = run('let obj = { a: 1, b: "hi" };');
    const declStep = steps.find((s) => s.kind === 'variable-declare' && s.description.includes('obj'));
    expect(declStep?.value?.kind).toBe('object');
  });

  it('yields program-complete step', () => {
    const { steps } = run('let x = 1;');
    expect(steps[steps.length - 1].kind).toBe('program-complete');
  });

  it('supports += operator', () => {
    const { steps } = run('let x = 5; x += 3;');
    const assignStep = steps.find((s) => s.kind === 'variable-assign' && s.description.includes('+='));
    expect(assignStep?.value).toEqual({ kind: 'number', value: 8 });
  });
});
