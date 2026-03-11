import { describe, it, expect } from 'vitest';
import { Environment } from '../environment';
import { type RuntimeValue } from '../types';

const num = (v: number): RuntimeValue => ({ kind: 'number', value: v });
const str = (v: string): RuntimeValue => ({ kind: 'string', value: v });

describe('Environment', () => {
  it('declares and resolves variables', () => {
    const env = new Environment('test');
    env.declare('x', 'let', num(42));
    expect(env.resolve('x')).toEqual(num(42));
  });

  it('assigns new value to mutable variable', () => {
    const env = new Environment('test');
    env.declare('x', 'let', num(1));
    env.assign('x', num(2));
    expect(env.resolve('x')).toEqual(num(2));
  });

  it('throws when assigning to const', () => {
    const env = new Environment('test');
    env.declare('x', 'const', num(1));
    expect(() => env.assign('x', num(2))).toThrow();
  });

  it('throws when resolving undefined variable', () => {
    const env = new Environment('test');
    expect(() => env.resolve('notDefined')).toThrow();
  });

  it('resolves variables from parent scope', () => {
    const parent = new Environment('parent');
    parent.declare('x', 'let', num(10));
    const child = new Environment('child', parent);
    expect(child.resolve('x')).toEqual(num(10));
  });

  it('shadows parent variable', () => {
    const parent = new Environment('parent');
    parent.declare('x', 'let', num(1));
    const child = new Environment('child', parent);
    child.declare('x', 'let', num(2));
    expect(child.resolve('x')).toEqual(num(2));
    expect(parent.resolve('x')).toEqual(num(1));
  });

  it('assigns to parent scope variable', () => {
    const parent = new Environment('parent');
    parent.declare('x', 'let', num(1));
    const child = new Environment('child', parent);
    child.assign('x', num(99));
    expect(parent.resolve('x')).toEqual(num(99));
  });

  it('throws when assigning to undefined variable', () => {
    const env = new Environment('test');
    expect(() => env.assign('y', num(1))).toThrow();
  });

  it('creates snapshot with bindings', () => {
    const env = new Environment('test');
    env.declare('a', 'let', num(1));
    env.declare('b', 'const', str('hello'));
    const snap = env.snapshot();
    expect(snap.label).toBe('test');
    expect(snap.bindings).toHaveLength(2);
    expect(snap.bindings.find((b) => b.name === 'a')).toBeDefined();
  });

  it('var hoisting goes to function scope', () => {
    const fnEnv = new Environment('function:test');
    const blockEnv = new Environment('block', fnEnv);
    blockEnv.declare('x', 'var', num(5));
    expect(fnEnv.resolve('x')).toEqual(num(5));
  });
});
