import { describe, it, expect } from 'vitest';
import { tokenize } from '../../tokenizer';
import { parse } from '../parser';
import { type VariableDeclaration, type IfStatement, type ObjectExpression } from '../types';

function p(source: string) {
  return parse(tokenize(source));
}

describe('parse', () => {
  it('parses empty program', () => {
    const ast = p('');
    expect(ast.type).toBe('Program');
    expect(ast.body).toHaveLength(0);
  });

  it('parses variable declaration with number', () => {
    const ast = p('let x = 5;');
    expect(ast.body[0]).toMatchObject({
      type: 'VariableDeclaration',
      kind: 'let',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'x' },
          init: { type: 'NumericLiteral', value: 5 },
        },
      ],
    });
  });

  it('parses const string declaration', () => {
    const ast = p('const name = "hello";');
    expect(ast.body[0]).toMatchObject({
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [{ init: { type: 'StringLiteral', value: 'hello' } }],
    });
  });

  it('parses binary expressions with precedence', () => {
    const ast = p('let x = 2 + 3 * 4;');
    const init = (ast.body[0] as VariableDeclaration).declarations[0].init;
    expect(init).toMatchObject({
      type: 'BinaryExpression',
      operator: '+',
      right: { type: 'BinaryExpression', operator: '*' },
    });
  });

  it('parses function declaration', () => {
    const ast = p('function add(a, b) { return a + b; }');
    expect(ast.body[0]).toMatchObject({
      type: 'FunctionDeclaration',
      id: { name: 'add' },
      params: [{ name: 'a' }, { name: 'b' }],
      body: { type: 'BlockStatement' },
    });
  });

  it('parses if statement', () => {
    const ast = p('if (x > 0) { let y = 1; }');
    expect(ast.body[0]).toMatchObject({
      type: 'IfStatement',
      test: { type: 'BinaryExpression', operator: '>' },
      consequent: { type: 'BlockStatement' },
      alternate: null,
    });
  });

  it('parses if-else statement', () => {
    const ast = p('if (x) { let a = 1; } else { let b = 2; }');
    const stmt = ast.body[0] as IfStatement;
    expect(stmt.alternate).toMatchObject({ type: 'BlockStatement' });
  });

  it('parses while loop', () => {
    const ast = p('while (i < 10) { i++; }');
    expect(ast.body[0]).toMatchObject({
      type: 'WhileStatement',
      test: { type: 'BinaryExpression', operator: '<' },
    });
  });

  it('parses for loop', () => {
    const ast = p('for (let i = 0; i < 3; i++) {}');
    expect(ast.body[0]).toMatchObject({
      type: 'ForStatement',
      init: { type: 'VariableDeclaration' },
      test: { type: 'BinaryExpression' },
      update: { type: 'UpdateExpression' },
    });
  });

  it('parses call expression', () => {
    const ast = p('foo(1, 2);');
    expect(ast.body[0]).toMatchObject({
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'foo' },
        arguments: [
          { type: 'NumericLiteral', value: 1 },
          { type: 'NumericLiteral', value: 2 },
        ],
      },
    });
  });

  it('parses member expression', () => {
    const ast = p('obj.foo;');
    expect(ast.body[0]).toMatchObject({
      type: 'ExpressionStatement',
      expression: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'obj' },
        property: { type: 'Identifier', name: 'foo' },
        computed: false,
      },
    });
  });

  it('parses array expression', () => {
    const ast = p('let arr = [1, 2, 3];');
    const init = (ast.body[0] as VariableDeclaration).declarations[0].init;
    expect(init).toMatchObject({
      type: 'ArrayExpression',
      elements: [
        { type: 'NumericLiteral', value: 1 },
        { type: 'NumericLiteral', value: 2 },
        { type: 'NumericLiteral', value: 3 },
      ],
    });
  });

  it('parses object expression', () => {
    const ast = p('let obj = { a: 1, b: "hi" };');
    const init = (ast.body[0] as VariableDeclaration).declarations[0].init as ObjectExpression;
    expect(init.type).toBe('ObjectExpression');
    expect(init.properties).toHaveLength(2);
  });

  it('parses boolean and null literals', () => {
    const ast = p('let a = true; let b = false; let c = null;');
    expect((ast.body[0] as VariableDeclaration).declarations[0].init).toMatchObject({
      type: 'BooleanLiteral',
      value: true,
    });
    expect((ast.body[1] as VariableDeclaration).declarations[0].init).toMatchObject({
      type: 'BooleanLiteral',
      value: false,
    });
    expect((ast.body[2] as VariableDeclaration).declarations[0].init).toMatchObject({ type: 'NullLiteral' });
  });

  it('parses assignment expression', () => {
    const ast = p('x = 10;');
    expect(ast.body[0]).toMatchObject({
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: { type: 'Identifier', name: 'x' },
        right: { type: 'NumericLiteral', value: 10 },
      },
    });
  });

  it('parses logical expressions', () => {
    const ast = p('let x = a && b;');
    const init = (ast.body[0] as VariableDeclaration).declarations[0].init;
    expect(init).toMatchObject({ type: 'LogicalExpression', operator: '&&' });
  });

  it('parses unary expression', () => {
    const ast = p('let x = !true;');
    const init = (ast.body[0] as VariableDeclaration).declarations[0].init;
    expect(init).toMatchObject({ type: 'UnaryExpression', operator: '!' });
  });
});
