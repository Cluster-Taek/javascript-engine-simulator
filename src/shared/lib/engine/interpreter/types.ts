import { type Environment } from './environment';
import { type AstNode, type SourceLocation, type Statement, type BlockStatement } from '../parser/types';

export type RuntimeValueKind =
  | 'number'
  | 'string'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'function'
  | 'native-function'
  | 'array'
  | 'object'
  | 'promise';

export interface NumberValue {
  readonly kind: 'number';
  readonly value: number;
}

export interface StringValue {
  readonly kind: 'string';
  readonly value: string;
}

export interface BooleanValue {
  readonly kind: 'boolean';
  readonly value: boolean;
}

export interface NullValue {
  readonly kind: 'null';
}

export interface UndefinedValue {
  readonly kind: 'undefined';
}

export interface FunctionValue {
  readonly kind: 'function';
  readonly name: string;
  readonly params: readonly string[];
  readonly body: BlockStatement;
  readonly closure: Environment;
  readonly async?: boolean;
}

export interface NativeFunctionValue {
  readonly kind: 'native-function';
  readonly name: string;
  readonly call: (args: RuntimeValue[]) => RuntimeValue;
  readonly properties?: Map<string, RuntimeValue>;
}

export interface ArrayValue {
  readonly kind: 'array';
  readonly elements: RuntimeValue[];
}

export interface ObjectValue {
  readonly kind: 'object';
  readonly properties: Map<string, RuntimeValue>;
}

export interface PromiseValue {
  readonly kind: 'promise';
  readonly id: string;
  state: 'pending' | 'resolved' | 'rejected';
  value?: RuntimeValue;
  readonly thenCallbacks: Array<{
    onFulfilled?: FunctionValue | NativeFunctionValue;
    onRejected?: FunctionValue | NativeFunctionValue;
  }>;
  readonly methods?: Map<string, NativeFunctionValue>;
}

export type RuntimeValue =
  | NumberValue
  | StringValue
  | BooleanValue
  | NullValue
  | UndefinedValue
  | FunctionValue
  | NativeFunctionValue
  | ArrayValue
  | ObjectValue
  | PromiseValue;

export interface Binding {
  value: RuntimeValue;
  readonly mutable: boolean;
  readonly kind: 'var' | 'let' | 'const';
  readonly builtin?: boolean;
}

export type ValueNode =
  | { kind: 'primitive'; display: string }
  | { kind: 'function'; display: string }
  | { kind: 'array'; display: string; items: ValueNode[] }
  | { kind: 'object'; display: string; entries: Array<[string, ValueNode]> };

export interface BindingSnapshot {
  readonly name: string;
  readonly value: string;
  readonly valueNode: ValueNode;
  readonly kind: 'var' | 'let' | 'const';
  readonly mutable: boolean;
}

export interface EnvironmentSnapshot {
  readonly id: string;
  readonly label: string;
  readonly bindings: readonly BindingSnapshot[];
}

export interface StackFrame {
  readonly id: string;
  readonly name: string;
  readonly loc?: SourceLocation;
  readonly environmentSnapshot: EnvironmentSnapshot;
}

export interface WebApiEntry {
  readonly id: string;
  readonly label: string;
  readonly kind: 'timeout' | 'interval' | 'fetch';
  readonly callbackLabel: string;
  readonly delay: number;
  remainingTicks: number;
  readonly callback: FunctionValue | NativeFunctionValue;
  readonly callbackArgs: RuntimeValue[];
}

export interface QueueEntry {
  readonly id: string;
  readonly label: string;
  readonly sourceWebApiId?: string;
  readonly callback: FunctionValue | NativeFunctionValue;
  readonly callbackArgs: RuntimeValue[];
}

export type EventLoopPhase = 'idle' | 'checking-stack' | 'draining-microtasks' | 'picking-task';

export interface AsyncRuntimeSnapshot {
  readonly webApis: readonly WebApiEntry[];
  readonly taskQueue: readonly QueueEntry[];
  readonly microtaskQueue: readonly QueueEntry[];
  readonly eventLoopPhase: EventLoopPhase;
}

export type StepKind =
  | 'enter-statement'
  | 'variable-declare'
  | 'variable-assign'
  | 'enter-function'
  | 'exit-function'
  | 'condition-test'
  | 'loop-test'
  | 'return'
  | 'console-output'
  | 'evaluate-expression'
  | 'program-complete'
  | 'web-api-register'
  | 'web-api-complete'
  | 'task-enqueue'
  | 'microtask-enqueue'
  | 'event-loop-check'
  | 'task-dequeue'
  | 'microtask-dequeue'
  | 'promise-resolve'
  | 'promise-create'
  | 'await-suspend'
  | 'web-api-tick'
  | 'try-enter'
  | 'catch-enter'
  | 'finally-enter'
  | 'throw';

export interface StepResult {
  readonly id: string;
  readonly kind: StepKind;
  readonly description: string;
  readonly node?: AstNode;
  readonly loc?: SourceLocation;
  readonly value?: RuntimeValue;
  readonly environments: readonly EnvironmentSnapshot[];
  readonly callStack: readonly StackFrame[];
  readonly consoleOutput: readonly string[];
  readonly asyncSnapshot?: AsyncRuntimeSnapshot;
}

export class EngineError extends Error {
  constructor(
    message: string,
    public readonly loc?: SourceLocation
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

export class ParseError extends EngineError {
  constructor(message: string, loc?: SourceLocation) {
    super(message, loc);
    this.name = 'ParseError';
  }
}

export class RuntimeError extends EngineError {
  constructor(message: string, loc?: SourceLocation) {
    super(message, loc);
    this.name = 'RuntimeError';
  }
}

export class ReturnSignal {
  constructor(public readonly value: RuntimeValue) {}
}

export class BreakSignal {}

export class ContinueSignal {}

export class ThrowSignal {
  constructor(public readonly value: RuntimeValue) {}
}

export class AwaitSignal {
  public variableName?: string;
  public variableKind?: 'let' | 'const' | 'var';
  public remainingStatements?: readonly Statement[];
  public env?: Environment;

  constructor(public readonly promise: PromiseValue) {}
}
