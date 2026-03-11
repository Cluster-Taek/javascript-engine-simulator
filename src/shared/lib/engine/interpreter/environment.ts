import { RuntimeError } from './types';
import { type Binding, type EnvironmentSnapshot, type RuntimeValue, type ValueNode } from './types';

let envIdCounter = 0;

export class Environment {
  private readonly id: string;
  private readonly label: string;
  private readonly bindings = new Map<string, Binding>();
  private readonly parent: Environment | null;

  constructor(label: string, parent: Environment | null = null) {
    this.id = `env-${++envIdCounter}`;
    this.label = label;
    this.parent = parent;
  }

  declare(name: string, kind: 'var' | 'let' | 'const', value: RuntimeValue): void {
    if (kind === 'var') {
      // var hoisting: declare in function scope or global
      const fnEnv = this.findFunctionScope();
      fnEnv.bindings.set(name, { value, mutable: true, kind, initialized: true });
    } else {
      this.bindings.set(name, { value, mutable: kind !== 'const', kind, initialized: true });
    }
  }

  /** Pre-declare a var in function scope only if it doesn't already exist there */
  declareVarIfAbsent(name: string): void {
    const fnEnv = this.findFunctionScope();
    if (!fnEnv.bindings.has(name)) {
      fnEnv.bindings.set(name, { value: { kind: 'undefined' }, mutable: true, kind: 'var', initialized: true });
    }
  }

  /** Pre-declare let/const as uninitialized (TDZ) */
  declareTDZ(name: string, kind: 'let' | 'const'): void {
    this.bindings.set(name, {
      value: { kind: 'undefined' },
      mutable: kind !== 'const',
      kind,
      initialized: false,
    });
  }

  /** Initialize a TDZ binding when its declaration is reached */
  initialize(name: string, value: RuntimeValue): void {
    const binding = this.bindings.get(name);
    if (binding !== undefined) {
      binding.value = value;
      binding.initialized = true;
      return;
    }
    throw new RuntimeError(`ReferenceError: '${name}' is not defined`);
  }

  declareBuiltin(name: string, value: RuntimeValue): void {
    this.bindings.set(name, { value, mutable: false, kind: 'const', builtin: true, initialized: true });
  }

  resolve(name: string): RuntimeValue {
    const binding = this.bindings.get(name);
    if (binding !== undefined) {
      if (!binding.initialized) {
        throw new RuntimeError(`ReferenceError: Cannot access '${name}' before initialization`);
      }
      return binding.value;
    }
    if (this.parent !== null) return this.parent.resolve(name);
    throw new RuntimeError(`ReferenceError: '${name}' is not defined`);
  }

  assign(name: string, value: RuntimeValue): void {
    const binding = this.bindings.get(name);
    if (binding !== undefined) {
      if (!binding.initialized) {
        throw new RuntimeError(`ReferenceError: Cannot access '${name}' before initialization`);
      }
      if (!binding.mutable) {
        throw new RuntimeError(`TypeError: Assignment to constant variable '${name}'`);
      }
      binding.value = value;
      return;
    }
    if (this.parent !== null) {
      this.parent.assign(name, value);
      return;
    }
    throw new RuntimeError(`ReferenceError: '${name}' is not defined`);
  }

  has(name: string): boolean {
    if (this.bindings.has(name)) return true;
    return this.parent?.has(name) ?? false;
  }

  /** Check if a binding exists in this scope only (not parent) */
  hasOwn(name: string): boolean {
    return this.bindings.has(name);
  }

  snapshot(): EnvironmentSnapshot {
    return {
      id: this.id,
      label: this.label,
      bindings: Array.from(this.bindings.entries())
        .filter(([, binding]) => !binding.builtin)
        .map(([name, binding]) => ({
          name,
          value: binding.initialized ? runtimeValueToString(binding.value) : '<uninitialized>',
          valueNode: binding.initialized
            ? runtimeValueToValueNode(binding.value)
            : { kind: 'primitive' as const, display: '<uninitialized>' },
          kind: binding.kind,
          mutable: binding.mutable,
          initialized: binding.initialized,
        })),
    };
  }

  snapshotChain(): EnvironmentSnapshot[] {
    const chain: EnvironmentSnapshot[] = [this.snapshot()];
    if (this.parent !== null && this.parent.label !== '__global__') {
      chain.push(...this.parent.snapshotChain());
    } else if (this.parent !== null) {
      chain.push(this.parent.snapshot());
    }
    return chain;
  }

  private findFunctionScope(): Environment {
    if (this.label.startsWith('function:') || this.label.startsWith('new:') || this.label === 'global') return this;
    return this.parent?.findFunctionScope() ?? this;
  }

  getId(): string {
    return this.id;
  }

  getLabel(): string {
    return this.label;
  }
}

export function runtimeValueToString(value: RuntimeValue): string {
  switch (value.kind) {
    case 'number':
      return String(value.value);
    case 'string':
      return `"${value.value}"`;
    case 'boolean':
      return String(value.value);
    case 'null':
      return 'null';
    case 'undefined':
      return 'undefined';
    case 'function':
      return `[Function: ${value.name}]`;
    case 'native-function':
      return `[NativeFunction: ${value.name}]`;
    case 'array':
      return `[${value.elements.map(runtimeValueToString).join(', ')}]`;
    case 'object': {
      const entries = Array.from(value.properties.entries())
        .map(([k, v]) => `${k}: ${runtimeValueToString(v)}`)
        .join(', ');
      return `{${entries}}`;
    }
    case 'promise':
      return `[Promise: ${value.state}]`;
  }
}

export function runtimeValueToValueNode(value: RuntimeValue): ValueNode {
  switch (value.kind) {
    case 'number':
    case 'boolean':
    case 'null':
    case 'undefined':
      return { kind: 'primitive', display: runtimeValueToString(value) };
    case 'string':
      return { kind: 'primitive', display: `"${value.value}"` };
    case 'function':
      return { kind: 'function', display: `[Function: ${value.name}]` };
    case 'native-function':
      return { kind: 'function', display: `[NativeFunction: ${value.name}]` };
    case 'promise':
      return { kind: 'primitive', display: `[Promise: ${value.state}]` };
    case 'array':
      return {
        kind: 'array',
        display: `Array(${value.elements.length})`,
        items: value.elements.map(runtimeValueToValueNode),
      };
    case 'object':
      return {
        kind: 'object',
        display: `{${Array.from(value.properties.keys()).join(', ')}}`,
        entries: Array.from(value.properties.entries()).map(([k, v]) => [k, runtimeValueToValueNode(v)]),
      };
  }
}

export function createGlobalEnvironment(): Environment {
  const env = new Environment('global');

  // console.log - handled specially in interpreter
  const undefinedVal: RuntimeValue = { kind: 'undefined' };
  env.declareBuiltin('console', {
    kind: 'object',
    properties: new Map([['log', { kind: 'native-function', name: 'console.log', call: () => undefinedVal }]]),
  });

  // Math object
  env.declareBuiltin('Math', {
    kind: 'object',
    properties: new Map<string, RuntimeValue>([
      ['PI', { kind: 'number', value: Math.PI }],
      [
        'floor',
        {
          kind: 'native-function',
          name: 'Math.floor',
          call: (args) => ({ kind: 'number', value: Math.floor((args[0] as { kind: 'number'; value: number }).value) }),
        },
      ],
      [
        'ceil',
        {
          kind: 'native-function',
          name: 'Math.ceil',
          call: (args) => ({ kind: 'number', value: Math.ceil((args[0] as { kind: 'number'; value: number }).value) }),
        },
      ],
      [
        'round',
        {
          kind: 'native-function',
          name: 'Math.round',
          call: (args) => ({ kind: 'number', value: Math.round((args[0] as { kind: 'number'; value: number }).value) }),
        },
      ],
      [
        'abs',
        {
          kind: 'native-function',
          name: 'Math.abs',
          call: (args) => ({ kind: 'number', value: Math.abs((args[0] as { kind: 'number'; value: number }).value) }),
        },
      ],
      [
        'max',
        {
          kind: 'native-function',
          name: 'Math.max',
          call: (args) => ({
            kind: 'number',
            value: Math.max(...args.map((a) => (a as { kind: 'number'; value: number }).value)),
          }),
        },
      ],
      [
        'min',
        {
          kind: 'native-function',
          name: 'Math.min',
          call: (args) => ({
            kind: 'number',
            value: Math.min(...args.map((a) => (a as { kind: 'number'; value: number }).value)),
          }),
        },
      ],
      [
        'sqrt',
        {
          kind: 'native-function',
          name: 'Math.sqrt',
          call: (args) => ({ kind: 'number', value: Math.sqrt((args[0] as { kind: 'number'; value: number }).value) }),
        },
      ],
      [
        'pow',
        {
          kind: 'native-function',
          name: 'Math.pow',
          call: (args) => ({
            kind: 'number',
            value: Math.pow(
              (args[0] as { kind: 'number'; value: number }).value,
              (args[1] as { kind: 'number'; value: number }).value
            ),
          }),
        },
      ],
    ]),
  });

  return env;
}
