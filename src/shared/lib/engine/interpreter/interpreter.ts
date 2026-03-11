import { Environment, runtimeValueToString } from './environment';
import { RuntimeError, ReturnSignal, BreakSignal, ContinueSignal, AwaitSignal, ThrowSignal } from './types';
import { type RuntimeValue, type StepResult, type StackFrame, type FunctionValue, type PromiseValue } from './types';
import {
  type Program,
  type Statement,
  type Expression,
  type VariableDeclaration,
  type FunctionDeclaration,
  type ReturnStatement,
  type IfStatement,
  type WhileStatement,
  type ForStatement,
  type BlockStatement,
  type ExpressionStatement,
  type TryStatement,
  type ThrowStatement,
  type BinaryExpression,
  type LogicalExpression,
  type UnaryExpression,
  type ConditionalExpression,
  type AssignmentExpression,
  type UpdateExpression,
  type CallExpression,
  type MemberExpression,
  type ArrayExpression,
  type ObjectExpression,
  type AwaitExpression,
} from '../parser/types';

let stepIdCounter = 0;
let frameIdCounter = 0;
let promiseIdCounter = 0;

function nextStepId(): string {
  return `step-${++stepIdCounter}`;
}

function nextFrameId(): string {
  return `frame-${++frameIdCounter}`;
}

function nextPromiseId(): string {
  return `promise-${++promiseIdCounter}`;
}

function isTruthy(value: RuntimeValue): boolean {
  switch (value.kind) {
    case 'boolean':
      return value.value;
    case 'number':
      return value.value !== 0 && !isNaN(value.value);
    case 'string':
      return value.value !== '';
    case 'null':
    case 'undefined':
      return false;
    default:
      return true;
  }
}

export function* interpret(program: Program, globalEnv: Environment): Generator<StepResult, RuntimeValue, void> {
  const callStack: StackFrame[] = [];
  const consoleOutput: string[] = [];

  const globalFrame: StackFrame = {
    id: nextFrameId(),
    name: 'global',
    environmentSnapshot: globalEnv.snapshot(),
  };
  callStack.push(globalFrame);

  function createStep(
    kind: StepResult['kind'],
    description: string,
    env: Environment,
    node?: StepResult['node'],
    value?: RuntimeValue
  ): StepResult {
    return {
      id: nextStepId(),
      kind,
      description,
      node,
      loc: node?.loc,
      value,
      environments: env.snapshotChain(),
      callStack: [...callStack],
      consoleOutput: [...consoleOutput],
    };
  }

  function hoistVars(body: readonly Statement[], env: Environment): void {
    for (const stmt of body) {
      if (stmt.type === 'VariableDeclaration' && stmt.kind === 'var') {
        for (const decl of stmt.declarations) {
          if (!env.has(decl.id.name)) {
            env.declare(decl.id.name, 'var', { kind: 'undefined' });
          }
        }
      } else if (stmt.type === 'FunctionDeclaration') {
        // function hoisting - handled in block execution
      }
    }
  }

  function* executeBlock(body: readonly Statement[], env: Environment): Generator<StepResult, RuntimeValue, void> {
    hoistVars(body, env);

    // Hoist function declarations first
    for (const stmt of body) {
      if (stmt.type === 'FunctionDeclaration') {
        const fnVal: RuntimeValue = {
          kind: 'function',
          name: stmt.id.name,
          params: stmt.params.map((p) => p.name),
          body: stmt.body,
          closure: env,
          async: stmt.async,
        };
        env.declare(stmt.id.name, 'let', fnVal);
      }
    }

    let lastValue: RuntimeValue = { kind: 'undefined' };
    for (let i = 0; i < body.length; i++) {
      const stmt = body[i];
      if (stmt.type === 'FunctionDeclaration') continue; // already hoisted
      try {
        lastValue = yield* executeStatement(stmt, env);
      } catch (e) {
        if (e instanceof AwaitSignal) {
          e.remainingStatements = body.slice(i + 1);
          e.env = env;
          throw e;
        }
        throw e;
      }
    }
    return lastValue;
  }

  function* executeStatement(stmt: Statement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    switch (stmt.type) {
      case 'VariableDeclaration':
        return yield* executeVariableDeclaration(stmt, env);
      case 'FunctionDeclaration':
        return yield* executeFunctionDeclaration(stmt, env);
      case 'ReturnStatement':
        return yield* executeReturnStatement(stmt, env);
      case 'IfStatement':
        return yield* executeIfStatement(stmt, env);
      case 'WhileStatement':
        return yield* executeWhileStatement(stmt, env);
      case 'ForStatement':
        return yield* executeForStatement(stmt, env);
      case 'BlockStatement':
        return yield* executeBlock(stmt.body, new Environment('block', env));
      case 'ExpressionStatement':
        return yield* executeExpressionStatement(stmt, env);
      case 'TryStatement':
        return yield* executeTryStatement(stmt, env);
      case 'ThrowStatement':
        return yield* executeThrowStatement(stmt, env);
    }
  }

  function* executeVariableDeclaration(
    stmt: VariableDeclaration,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    for (const decl of stmt.declarations) {
      let value: RuntimeValue = { kind: 'undefined' };
      if (decl.init !== null) {
        try {
          value = yield* evaluateExpression(decl.init, env);
        } catch (e) {
          if (e instanceof AwaitSignal) {
            e.variableName = decl.id.name;
            e.variableKind = stmt.kind;
            throw e;
          }
          throw e;
        }
      }
      if (stmt.kind !== 'var') {
        env.declare(decl.id.name, stmt.kind, value);
      } else {
        env.assign(decl.id.name, value);
      }
      yield createStep(
        'variable-declare',
        `Declared ${stmt.kind} ${decl.id.name} = ${runtimeValueToString(value)}`,
        env,
        stmt,
        value
      );
    }
    return { kind: 'undefined' };
  }

  function* executeFunctionDeclaration(
    stmt: FunctionDeclaration,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    // Already hoisted; just yield a step
    const fnVal = env.resolve(stmt.id.name);
    yield createStep('enter-statement', `Function declared: ${stmt.id.name}`, env, stmt, fnVal);
    return { kind: 'undefined' };
  }

  function* executeReturnStatement(stmt: ReturnStatement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    let value: RuntimeValue = { kind: 'undefined' };
    if (stmt.argument !== null) {
      value = yield* evaluateExpression(stmt.argument, env);
    }
    yield createStep('return', `return ${runtimeValueToString(value)}`, env, stmt, value);
    throw new ReturnSignal(value);
  }

  function* executeIfStatement(stmt: IfStatement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    const testVal = yield* evaluateExpression(stmt.test, env);
    yield createStep(
      'condition-test',
      `if condition: ${runtimeValueToString(testVal)} → ${isTruthy(testVal) ? 'true branch' : 'false branch'}`,
      env,
      stmt,
      testVal
    );

    if (isTruthy(testVal)) {
      return yield* executeBlock(stmt.consequent.body, new Environment('if-then', env));
    } else if (stmt.alternate !== null) {
      if (stmt.alternate.type === 'IfStatement') {
        return yield* executeIfStatement(stmt.alternate, env);
      }
      return yield* executeBlock(stmt.alternate.body, new Environment('if-else', env));
    }
    return { kind: 'undefined' };
  }

  function* executeWhileStatement(stmt: WhileStatement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    while (true) {
      if (++iterations > MAX_ITERATIONS) {
        throw new RuntimeError('Infinite loop detected (limit: 1000 iterations)');
      }

      const testVal = yield* evaluateExpression(stmt.test, env);
      yield createStep('loop-test', `while condition: ${runtimeValueToString(testVal)}`, env, stmt, testVal);

      if (!isTruthy(testVal)) break;

      try {
        yield* executeBlock(stmt.body.body, new Environment('while-body', env));
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof ContinueSignal) continue;
        throw e;
      }
    }
    return { kind: 'undefined' };
  }

  function* executeForStatement(stmt: ForStatement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    const loopEnv = new Environment('for-init', env);
    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    if (stmt.init !== null) {
      yield* executeStatement(stmt.init, loopEnv);
    }

    while (true) {
      if (++iterations > MAX_ITERATIONS) {
        throw new RuntimeError('Infinite loop detected (limit: 1000 iterations)');
      }

      if (stmt.test !== null) {
        const testVal = yield* evaluateExpression(stmt.test, loopEnv);
        yield createStep('loop-test', `for condition: ${runtimeValueToString(testVal)}`, loopEnv, stmt, testVal);
        if (!isTruthy(testVal)) break;
      }

      try {
        yield* executeBlock(stmt.body.body, new Environment('for-body', loopEnv));
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof ContinueSignal) {
          // still execute update
        } else {
          throw e;
        }
      }

      if (stmt.update !== null) {
        yield* evaluateExpression(stmt.update, loopEnv);
      }
    }
    return { kind: 'undefined' };
  }

  function* executeExpressionStatement(
    stmt: ExpressionStatement,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const value = yield* evaluateExpression(stmt.expression, env);
    return value;
  }

  function* executeTryStatement(stmt: TryStatement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    yield createStep('try-enter', 'Entering try block', env, stmt);

    let result: RuntimeValue = { kind: 'undefined' };
    let caughtError: RuntimeValue | null = null;

    try {
      result = yield* executeBlock(stmt.block.body, new Environment('try', env));
    } catch (e) {
      if (e instanceof ThrowSignal) {
        caughtError = e.value;
      } else if (e instanceof RuntimeError) {
        caughtError = { kind: 'string', value: e.message };
      } else if (
        e instanceof ReturnSignal ||
        e instanceof BreakSignal ||
        e instanceof ContinueSignal ||
        e instanceof AwaitSignal
      ) {
        if (stmt.finalizer) {
          yield createStep('finally-enter', 'Entering finally block', env, stmt);
          yield* executeBlock(stmt.finalizer.body, new Environment('finally', env));
        }
        throw e;
      } else {
        throw e;
      }
    }

    if (caughtError !== null && stmt.handler !== null) {
      const catchEnv = new Environment('catch', env);
      if (stmt.handler.param) {
        catchEnv.declare(stmt.handler.param.name, 'let', caughtError);
      }
      yield createStep('catch-enter', `Caught: ${runtimeValueToString(caughtError)}`, catchEnv, stmt.handler);
      result = yield* executeBlock(stmt.handler.body.body, catchEnv);
    } else if (caughtError !== null) {
      if (stmt.finalizer) {
        yield createStep('finally-enter', 'Entering finally block', env, stmt);
        yield* executeBlock(stmt.finalizer.body, new Environment('finally', env));
      }
      throw new ThrowSignal(caughtError);
    }

    if (stmt.finalizer) {
      yield createStep('finally-enter', 'Entering finally block', env, stmt);
      yield* executeBlock(stmt.finalizer.body, new Environment('finally', env));
    }

    return result;
  }

  function* executeThrowStatement(stmt: ThrowStatement, env: Environment): Generator<StepResult, RuntimeValue, void> {
    const value = yield* evaluateExpression(stmt.argument, env);
    yield createStep('throw', `throw ${runtimeValueToString(value)}`, env, stmt, value);
    throw new ThrowSignal(value);
  }

  function* evaluateExpression(expr: Expression, env: Environment): Generator<StepResult, RuntimeValue, void> {
    switch (expr.type) {
      case 'NumericLiteral':
        return { kind: 'number', value: expr.value };
      case 'StringLiteral':
        return { kind: 'string', value: expr.value };
      case 'BooleanLiteral':
        return { kind: 'boolean', value: expr.value };
      case 'NullLiteral':
        return { kind: 'null' };
      case 'UndefinedLiteral':
        return { kind: 'undefined' };

      case 'Identifier': {
        const val = env.resolve(expr.name);
        return val;
      }

      case 'ArrayExpression':
        return yield* evaluateArrayExpression(expr, env);
      case 'ObjectExpression':
        return yield* evaluateObjectExpression(expr, env);
      case 'BinaryExpression':
        return yield* evaluateBinaryExpression(expr, env);
      case 'LogicalExpression':
        return yield* evaluateLogicalExpression(expr, env);
      case 'UnaryExpression':
        return yield* evaluateUnaryExpression(expr, env);
      case 'AssignmentExpression':
        return yield* evaluateAssignmentExpression(expr, env);
      case 'UpdateExpression':
        return yield* evaluateUpdateExpression(expr, env);
      case 'CallExpression':
        return yield* evaluateCallExpression(expr, env);
      case 'MemberExpression':
        return yield* evaluateMemberExpression(expr, env);
      case 'ConditionalExpression': {
        const condExpr = expr as ConditionalExpression;
        const testVal = yield* evaluateExpression(condExpr.test, env);
        yield createStep(
          'condition-test',
          `ternary: ${runtimeValueToString(testVal)} → ${isTruthy(testVal) ? 'consequent' : 'alternate'}`,
          env,
          expr,
          testVal
        );
        if (isTruthy(testVal)) {
          return yield* evaluateExpression(condExpr.consequent, env);
        }
        return yield* evaluateExpression(condExpr.alternate, env);
      }

      case 'AwaitExpression': {
        const awaitedValue = yield* evaluateExpression((expr as AwaitExpression).argument, env);
        if (awaitedValue.kind === 'promise') {
          yield createStep('await-suspend', `await: 비동기 대기`, env, expr, awaitedValue);
          throw new AwaitSignal(awaitedValue);
        }
        return awaitedValue;
      }

      // FunctionDeclaration used as expression (arrow fn placeholder)
      case 'FunctionDeclaration': {
        const fnVal: RuntimeValue = {
          kind: 'function',
          name: expr.id.name,
          params: expr.params.map((p) => p.name),
          body: expr.body,
          closure: env,
          async: expr.async,
        };
        return fnVal;
      }

      case 'ArrowFunctionExpression': {
        // Wrap expression body in a return statement
        const body: BlockStatement =
          expr.body.type === 'BlockStatement'
            ? expr.body
            : {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: expr.body,
                  } as ReturnStatement,
                ],
              };
        const fnVal: RuntimeValue = {
          kind: 'function',
          name: '<arrow>',
          params: expr.params.map((p) => p.name),
          body,
          closure: env,
          async: expr.async,
        };
        return fnVal;
      }

      case 'NewExpression': {
        const callee = yield* evaluateExpression(expr.callee, env);
        const args: RuntimeValue[] = [];
        for (const arg of expr.arguments) {
          args.push(yield* evaluateExpression(arg, env));
        }
        if (callee.kind === 'native-function') {
          return callee.call(args);
        }
        if (callee.kind === 'function') {
          const fnEnv = new Environment(`new:${callee.name}`, callee.closure);
          for (let i = 0; i < callee.params.length; i++) {
            fnEnv.declare(callee.params[i], 'let', args[i] ?? { kind: 'undefined' });
          }
          const frame: StackFrame = {
            id: nextFrameId(),
            name: `new ${callee.name}`,
            loc: expr.loc,
            environmentSnapshot: fnEnv.snapshot(),
          };
          callStack.push(frame);
          yield createStep(
            'enter-function',
            `new ${callee.name}(${args.map(runtimeValueToString).join(', ')})`,
            fnEnv,
            expr
          );
          try {
            yield* executeBlock(callee.body.body, fnEnv);
          } catch (e) {
            if (!(e instanceof ReturnSignal)) {
              callStack.pop();
              throw e;
            }
          }
          callStack.pop();
          yield createStep('exit-function', `new ${callee.name} constructed`, env, expr);
          return { kind: 'undefined' };
        }
        throw new RuntimeError(`TypeError: '${runtimeValueToString(callee)}' is not a constructor`);
      }
    }
  }

  function* evaluateArrayExpression(
    expr: ArrayExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const elements: RuntimeValue[] = [];
    for (const el of expr.elements) {
      elements.push(yield* evaluateExpression(el, env));
    }
    return { kind: 'array', elements };
  }

  function* evaluateObjectExpression(
    expr: ObjectExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const properties = new Map<string, RuntimeValue>();
    for (const prop of expr.properties) {
      const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
      const val = yield* evaluateExpression(prop.value, env);
      properties.set(String(key), val);
    }
    return { kind: 'object', properties };
  }

  function* evaluateBinaryExpression(
    expr: BinaryExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const left = yield* evaluateExpression(expr.left, env);
    const right = yield* evaluateExpression(expr.right, env);

    const leftNum = left.kind === 'number' ? left.value : NaN;
    const rightNum = right.kind === 'number' ? right.value : NaN;
    const leftStr = left.kind === 'string' ? left.value : String(leftNum);
    const rightStr = right.kind === 'string' ? right.value : String(rightNum);

    let result: RuntimeValue;
    switch (expr.operator) {
      case '+':
        if (left.kind === 'string' || right.kind === 'string') {
          result = {
            kind: 'string',
            value: runtimeValueToString(left).replace(/^"|"$/g, '') + runtimeValueToString(right).replace(/^"|"$/g, ''),
          };
          // simpler string concat
          const lv =
            left.kind === 'string'
              ? left.value
              : left.kind === 'number'
                ? String(left.value)
                : runtimeValueToString(left);
          const rv =
            right.kind === 'string'
              ? right.value
              : right.kind === 'number'
                ? String(right.value)
                : runtimeValueToString(right);
          result = { kind: 'string', value: lv + rv };
        } else {
          result = { kind: 'number', value: leftNum + rightNum };
        }
        break;
      case '-':
        result = { kind: 'number', value: leftNum - rightNum };
        break;
      case '*':
        result = { kind: 'number', value: leftNum * rightNum };
        break;
      case '/':
        result = { kind: 'number', value: leftNum / rightNum };
        break;
      case '%':
        result = { kind: 'number', value: leftNum % rightNum };
        break;
      case '<':
        if (left.kind === 'string' && right.kind === 'string') {
          result = { kind: 'boolean', value: leftStr < rightStr };
        } else {
          result = { kind: 'boolean', value: leftNum < rightNum };
        }
        break;
      case '<=':
        result = { kind: 'boolean', value: leftNum <= rightNum };
        break;
      case '>':
        if (left.kind === 'string' && right.kind === 'string') {
          result = { kind: 'boolean', value: leftStr > rightStr };
        } else {
          result = { kind: 'boolean', value: leftNum > rightNum };
        }
        break;
      case '>=':
        result = { kind: 'boolean', value: leftNum >= rightNum };
        break;
      case '==':
        result = { kind: 'boolean', value: runtimeValueToString(left) === runtimeValueToString(right) };
        break;
      case '!=':
        result = { kind: 'boolean', value: runtimeValueToString(left) !== runtimeValueToString(right) };
        break;
      case '===': {
        if (left.kind !== right.kind) {
          result = { kind: 'boolean', value: false };
        } else if (left.kind === 'number' && right.kind === 'number') {
          result = { kind: 'boolean', value: left.value === right.value };
        } else if (left.kind === 'string' && right.kind === 'string') {
          result = { kind: 'boolean', value: left.value === right.value };
        } else if (left.kind === 'boolean' && right.kind === 'boolean') {
          result = { kind: 'boolean', value: left.value === right.value };
        } else {
          result = { kind: 'boolean', value: left.kind === right.kind };
        }
        break;
      }
      case '!==': {
        if (left.kind !== right.kind) {
          result = { kind: 'boolean', value: true };
        } else if (left.kind === 'number' && right.kind === 'number') {
          result = { kind: 'boolean', value: left.value !== right.value };
        } else if (left.kind === 'string' && right.kind === 'string') {
          result = { kind: 'boolean', value: left.value !== right.value };
        } else if (left.kind === 'boolean' && right.kind === 'boolean') {
          result = { kind: 'boolean', value: left.value !== right.value };
        } else {
          result = { kind: 'boolean', value: false };
        }
        break;
      }
      default:
        result = { kind: 'undefined' };
    }
    return result;
  }

  function* evaluateLogicalExpression(
    expr: LogicalExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const left = yield* evaluateExpression(expr.left, env);
    if (expr.operator === '&&') {
      if (!isTruthy(left)) return left;
      return yield* evaluateExpression(expr.right, env);
    } else {
      if (isTruthy(left)) return left;
      return yield* evaluateExpression(expr.right, env);
    }
  }

  function* evaluateUnaryExpression(
    expr: UnaryExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const arg = yield* evaluateExpression(expr.argument, env);
    switch (expr.operator) {
      case '!':
        return { kind: 'boolean', value: !isTruthy(arg) };
      case '-':
        return { kind: 'number', value: -(arg.kind === 'number' ? arg.value : NaN) };
      case '+':
        return { kind: 'number', value: +(arg.kind === 'number' ? arg.value : NaN) };
    }
  }

  function* evaluateAssignmentExpression(
    expr: AssignmentExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    let newVal: RuntimeValue;

    if (expr.left.type === 'Identifier') {
      const name = expr.left.name;
      if (expr.operator === '=') {
        newVal = yield* evaluateExpression(expr.right, env);
      } else {
        const current = env.resolve(name);
        const right = yield* evaluateExpression(expr.right, env);
        const currentNum = current.kind === 'number' ? current.value : NaN;
        const rightNum = right.kind === 'number' ? right.value : NaN;
        newVal = { kind: 'number', value: expr.operator === '+=' ? currentNum + rightNum : currentNum - rightNum };
      }
      env.assign(name, newVal);
      yield createStep(
        'variable-assign',
        `${name} ${expr.operator} ${runtimeValueToString(newVal)}`,
        env,
        expr,
        newVal
      );
    } else {
      // MemberExpression assignment
      const obj = yield* evaluateExpression(expr.left.object, env);
      const propKey = expr.left.computed
        ? runtimeValueToString(yield* evaluateExpression(expr.left.property, env))
        : expr.left.property.type === 'Identifier'
          ? expr.left.property.name
          : '';
      newVal = yield* evaluateExpression(expr.right, env);
      if (obj.kind === 'object') {
        obj.properties.set(propKey, newVal);
      } else if (obj.kind === 'array') {
        const idx = parseInt(propKey, 10);
        if (!isNaN(idx)) obj.elements[idx] = newVal;
      }
    }

    return newVal!;
  }

  function* evaluateUpdateExpression(
    expr: UpdateExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    if (expr.argument.type === 'Identifier') {
      const name = expr.argument.name;
      const current = env.resolve(name);
      const currentNum = current.kind === 'number' ? current.value : NaN;
      const newNum = expr.operator === '++' ? currentNum + 1 : currentNum - 1;
      const newVal: RuntimeValue = { kind: 'number', value: newNum };
      env.assign(name, newVal);
      yield createStep('variable-assign', `${name}${expr.operator} → ${newNum}`, env, expr, newVal);
      return expr.prefix ? newVal : { kind: 'number', value: currentNum };
    }
    return { kind: 'undefined' };
  }

  function* evaluateCallExpression(expr: CallExpression, env: Environment): Generator<StepResult, RuntimeValue, void> {
    // Special case: console.log
    if (
      expr.callee.type === 'MemberExpression' &&
      expr.callee.object.type === 'Identifier' &&
      expr.callee.object.name === 'console' &&
      expr.callee.property.type === 'Identifier' &&
      expr.callee.property.name === 'log'
    ) {
      const args: RuntimeValue[] = [];
      for (const arg of expr.arguments) {
        args.push(yield* evaluateExpression(arg, env));
      }
      const output = args
        .map((a) => {
          if (a.kind === 'string') return a.value;
          return runtimeValueToString(a);
        })
        .join(' ');
      consoleOutput.push(output);
      yield createStep('console-output', `console.log: ${output}`, env, expr, { kind: 'string', value: output });
      return { kind: 'undefined' };
    }

    // Evaluate callee
    let callee: RuntimeValue;

    if (expr.callee.type === 'MemberExpression') {
      callee = yield* evaluateMemberExpression(expr.callee, env);
    } else {
      callee = yield* evaluateExpression(expr.callee, env);
    }

    // Evaluate arguments
    const args: RuntimeValue[] = [];
    for (const arg of expr.arguments) {
      args.push(yield* evaluateExpression(arg, env));
    }

    if (callee.kind === 'native-function') {
      return callee.call(args);
    }

    if (callee.kind !== 'function') {
      throw new RuntimeError(`TypeError: '${runtimeValueToString(callee)}' is not a function`);
    }

    // Async function handling
    if (callee.async) {
      const asyncPromise: PromiseValue = {
        kind: 'promise',
        id: nextPromiseId(),
        state: 'pending',
        thenCallbacks: [],
      };

      const fnEnv = new Environment(`function:${callee.name}`, callee.closure);
      for (let i = 0; i < callee.params.length; i++) {
        fnEnv.declare(callee.params[i], 'let', args[i] ?? { kind: 'undefined' });
      }

      const asyncFrame: StackFrame = {
        id: nextFrameId(),
        name: callee.name,
        loc: expr.loc,
        environmentSnapshot: fnEnv.snapshot(),
      };
      callStack.push(asyncFrame);

      yield createStep(
        'enter-function',
        `Calling async function: ${callee.name}(${args.map(runtimeValueToString).join(', ')})`,
        fnEnv,
        expr
      );

      try {
        yield* executeBlock(callee.body.body, fnEnv);
        asyncPromise.state = 'resolved';
        asyncPromise.value = { kind: 'undefined' };
      } catch (e) {
        if (e instanceof AwaitSignal) {
          const remainingStatements = e.remainingStatements ?? [];
          const capturedEnv = e.env ?? fnEnv;

          const continuationBody: BlockStatement = {
            type: 'BlockStatement',
            body: remainingStatements,
          };

          const continuation: FunctionValue = {
            kind: 'function',
            name: `<continuation:${callee.name}>`,
            params: e.variableName ? [e.variableName] : [],
            body: continuationBody,
            closure: capturedEnv,
          };

          e.promise.thenCallbacks.push({ onFulfilled: continuation });

          callStack.pop();
          yield createStep(
            'exit-function',
            `Async function ${callee.name} suspended at await`,
            env,
            expr,
            asyncPromise
          );
          return asyncPromise;
        } else if (e instanceof ReturnSignal) {
          asyncPromise.state = 'resolved';
          asyncPromise.value = e.value;
        } else {
          callStack.pop();
          throw e;
        }
      }

      callStack.pop();
      yield createStep('exit-function', `Async function ${callee.name} completed`, env, expr, asyncPromise);
      return asyncPromise;
    }

    // Regular (sync) function handling
    const fnEnv = new Environment(`function:${callee.name}`, callee.closure);
    for (let i = 0; i < callee.params.length; i++) {
      fnEnv.declare(callee.params[i], 'let', args[i] ?? { kind: 'undefined' });
    }

    const frame: StackFrame = {
      id: nextFrameId(),
      name: callee.name,
      loc: expr.loc,
      environmentSnapshot: fnEnv.snapshot(),
    };
    callStack.push(frame);

    yield createStep(
      'enter-function',
      `Calling function: ${callee.name}(${args.map(runtimeValueToString).join(', ')})`,
      fnEnv,
      expr
    );

    let returnValue: RuntimeValue = { kind: 'undefined' };
    try {
      yield* executeBlock(callee.body.body, fnEnv);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        returnValue = e.value;
      } else {
        callStack.pop();
        throw e;
      }
    }

    callStack.pop();
    yield createStep(
      'exit-function',
      `Function ${callee.name} returned: ${runtimeValueToString(returnValue)}`,
      env,
      expr,
      returnValue
    );

    return returnValue;
  }

  function* evaluateMemberExpression(
    expr: MemberExpression,
    env: Environment
  ): Generator<StepResult, RuntimeValue, void> {
    const obj = yield* evaluateExpression(expr.object, env);
    let key: string;

    if (expr.computed) {
      const propVal = yield* evaluateExpression(expr.property, env);
      key =
        propVal.kind === 'number'
          ? String(propVal.value)
          : propVal.kind === 'string'
            ? propVal.value
            : runtimeValueToString(propVal);
    } else {
      key = expr.property.type === 'Identifier' ? expr.property.name : '';
    }

    if (obj.kind === 'object') {
      return obj.properties.get(key) ?? { kind: 'undefined' };
    }
    if (obj.kind === 'array') {
      if (key === 'length') return { kind: 'number', value: obj.elements.length };
      const idx = parseInt(key, 10);
      if (!isNaN(idx)) return obj.elements[idx] ?? { kind: 'undefined' };
      // Array methods
      if (key === 'push') {
        return {
          kind: 'native-function',
          name: 'Array.push',
          call: (args) => {
            obj.elements.push(...args);
            return { kind: 'number', value: obj.elements.length };
          },
        };
      }
      if (key === 'pop') {
        return {
          kind: 'native-function',
          name: 'Array.pop',
          call: () => obj.elements.pop() ?? { kind: 'undefined' },
        };
      }
      if (key === 'forEach') {
        // Can't easily make this a generator via native-function, skip for now
        return { kind: 'native-function', name: 'Array.forEach', call: () => ({ kind: 'undefined' }) };
      }
      if (key === 'map') {
        return { kind: 'native-function', name: 'Array.map', call: () => ({ kind: 'undefined' }) };
      }
    }
    if (obj.kind === 'string') {
      if (key === 'length') return { kind: 'number', value: obj.value.length };
    }
    if (obj.kind === 'native-function') {
      return obj.properties?.get(key) ?? { kind: 'undefined' };
    }
    if (obj.kind === 'promise') {
      return obj.methods?.get(key) ?? { kind: 'undefined' };
    }
    return { kind: 'undefined' };
  }

  // Start execution
  yield createStep('enter-statement', 'Program start', globalEnv, program);

  let lastValue: RuntimeValue = { kind: 'undefined' };
  try {
    lastValue = yield* executeBlock(program.body, globalEnv);
  } catch (e) {
    if (e instanceof ReturnSignal) {
      lastValue = e.value;
    } else if (e instanceof ThrowSignal) {
      throw new RuntimeError(`Uncaught: ${runtimeValueToString(e.value)}`);
    } else {
      throw e;
    }
  }

  yield createStep('program-complete', 'Program completed', globalEnv, program, lastValue);
  return lastValue;
}
