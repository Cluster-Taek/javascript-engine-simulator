import {
  type Program,
  type Statement,
  type Expression,
  type VariableDeclaration,
  type VariableDeclarator,
  type FunctionDeclaration,
  type ReturnStatement,
  type IfStatement,
  type WhileStatement,
  type ForStatement,
  type BlockStatement,
  type ExpressionStatement,
  type BinaryExpression,
  type LogicalExpression,
  type UnaryExpression,
  type AssignmentExpression,
  type UpdateExpression,
  type CallExpression,
  type MemberExpression,
  type ArrayExpression,
  type ObjectExpression,
  type ObjectProperty,
  type Identifier,
  type NumericLiteral,
  type StringLiteral,
  type BooleanLiteral,
  type NullLiteral,
  type UndefinedLiteral,
  type ArrowFunctionExpression,
  type NewExpression,
  type AwaitExpression,
  type SourceLocation,
} from './types';
import { ParseError } from '../interpreter/types';
import { type Token } from '../tokenizer/types';

// Operator precedence
const PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '===': 3,
  '!==': 3,
  '<': 4,
  '>': 4,
  '<=': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
};

export function parse(tokens: Token[]): Program {
  let pos = 0;

  function peek(offset = 0): Token {
    return tokens[pos + offset] ?? tokens[tokens.length - 1];
  }

  function advance(): Token {
    return tokens[pos++] ?? tokens[tokens.length - 1];
  }

  function check(type: string): boolean {
    return peek().type === type;
  }

  function match(...types: string[]): boolean {
    for (const type of types) {
      if (check(type)) {
        advance();
        return true;
      }
    }
    return false;
  }

  function expect(type: string): Token {
    if (!check(type)) {
      const tok = peek();
      throw new ParseError(`Expected '${type}' but got '${tok.type}' ('${tok.value}')`, {
        start: { line: tok.line, column: tok.column },
        end: { line: tok.line, column: tok.column },
      });
    }
    return advance();
  }

  function loc(start: { line: number; column: number }, end?: { line: number; column: number }): SourceLocation {
    const endTok = end ?? { line: peek().line, column: peek().column };
    return { start, end: endTok };
  }

  // Look ahead to detect if current OpenParen is an arrow function param list
  function isArrowParams(): boolean {
    // pos is currently at OpenParen
    let i = pos + 1;
    // Check: (Identifier, Identifier, ...) Arrow
    // or () Arrow
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === 'CloseParen') {
        const next = tokens[i + 1];
        return next?.type === 'Arrow';
      }
      if (t.type === 'Identifier' || t.type === 'Comma') {
        i++;
        continue;
      }
      return false;
    }
    return false;
  }

  function parseArrowBody(): BlockStatement | Expression {
    if (check('OpenBrace')) {
      return parseBlockStatement();
    }
    return parseAssignment();
  }

  function parseProgram(): Program {
    const body: Statement[] = [];
    while (!check('EOF')) {
      body.push(parseStatement());
    }
    return { type: 'Program', body };
  }

  function parseStatement(): Statement {
    const tok = peek();
    if (tok.type === 'Let' || tok.type === 'Const' || tok.type === 'Var') {
      return parseVariableDeclaration();
    }
    if (tok.type === 'Async' && peek(1).type === 'Function') {
      advance(); // consume 'async'
      return parseFunctionDeclaration(true);
    }
    if (tok.type === 'Function') {
      return parseFunctionDeclaration();
    }
    if (tok.type === 'Return') {
      return parseReturnStatement();
    }
    if (tok.type === 'If') {
      return parseIfStatement();
    }
    if (tok.type === 'While') {
      return parseWhileStatement();
    }
    if (tok.type === 'For') {
      return parseForStatement();
    }
    if (tok.type === 'OpenBrace') {
      return parseBlockStatement();
    }
    return parseExpressionStatement();
  }

  function parseVariableDeclaration(): VariableDeclaration {
    const start = peek();
    const kind = advance().value as 'let' | 'const' | 'var';
    const declarations: VariableDeclarator[] = [];

    do {
      const idTok = peek();
      const id = parseIdentifier();
      let init: Expression | null = null;
      if (match('Equals')) {
        init = parseExpression();
      }
      declarations.push({
        type: 'VariableDeclarator',
        id,
        init,
        loc: loc({ line: idTok.line, column: idTok.column }),
      });
    } while (match('Comma'));

    match('Semicolon');
    return {
      type: 'VariableDeclaration',
      kind,
      declarations,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseFunctionDeclaration(isAsync = false): FunctionDeclaration {
    const start = peek();
    expect('Function');
    const id = parseIdentifier();
    expect('OpenParen');
    const params: Identifier[] = [];
    while (!check('CloseParen')) {
      params.push(parseIdentifier());
      if (!check('CloseParen')) expect('Comma');
    }
    expect('CloseParen');
    const body = parseBlockStatement();
    return {
      type: 'FunctionDeclaration',
      id,
      params,
      body,
      async: isAsync || undefined,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseReturnStatement(): ReturnStatement {
    const start = peek();
    expect('Return');
    let argument: Expression | null = null;
    if (!check('Semicolon') && !check('CloseBrace') && !check('EOF')) {
      argument = parseExpression();
    }
    match('Semicolon');
    return {
      type: 'ReturnStatement',
      argument,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseIfStatement(): IfStatement {
    const start = peek();
    expect('If');
    expect('OpenParen');
    const test = parseExpression();
    expect('CloseParen');
    const consequent = parseBlockStatement();
    let alternate: BlockStatement | IfStatement | null = null;
    if (match('Else')) {
      if (check('If')) {
        alternate = parseIfStatement();
      } else {
        alternate = parseBlockStatement();
      }
    }
    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseWhileStatement(): WhileStatement {
    const start = peek();
    expect('While');
    expect('OpenParen');
    const test = parseExpression();
    expect('CloseParen');
    const body = parseBlockStatement();
    return {
      type: 'WhileStatement',
      test,
      body,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseForStatement(): ForStatement {
    const start = peek();
    expect('For');
    expect('OpenParen');

    let init: VariableDeclaration | ExpressionStatement | null = null;
    if (!check('Semicolon')) {
      if (peek().type === 'Let' || peek().type === 'Const' || peek().type === 'Var') {
        init = parseVariableDeclaration();
        // semicolon was consumed by parseVariableDeclaration
      } else {
        init = parseExpressionStatement();
      }
    } else {
      expect('Semicolon');
    }

    let test: Expression | null = null;
    if (!check('Semicolon')) {
      test = parseExpression();
    }
    expect('Semicolon');

    let update: Expression | null = null;
    if (!check('CloseParen')) {
      update = parseExpression();
    }
    expect('CloseParen');
    const body = parseBlockStatement();

    return {
      type: 'ForStatement',
      init,
      test,
      update,
      body,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseBlockStatement(): BlockStatement {
    const start = peek();
    expect('OpenBrace');
    const body: Statement[] = [];
    while (!check('CloseBrace') && !check('EOF')) {
      body.push(parseStatement());
    }
    expect('CloseBrace');
    return {
      type: 'BlockStatement',
      body,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseExpressionStatement(): ExpressionStatement {
    const start = peek();
    const expression = parseExpression();
    match('Semicolon');
    return {
      type: 'ExpressionStatement',
      expression,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseExpression(): Expression {
    return parseAssignment();
  }

  function parseAssignment(): Expression {
    const left = parseBinary(0);

    const tok = peek();
    if (tok.type === 'Equals' || tok.type === 'PlusEquals' || tok.type === 'MinusEquals') {
      advance();
      const operator = tok.value as '=' | '+=' | '-=';
      const right = parseAssignment();
      if (left.type !== 'Identifier' && left.type !== 'MemberExpression') {
        throw new ParseError('Invalid assignment target');
      }
      const result: AssignmentExpression = {
        type: 'AssignmentExpression',
        operator,
        left: left as Identifier | MemberExpression,
        right,
        loc: left.loc,
      };
      return result;
    }

    return left;
  }

  function getOperator(tok: Token): string | null {
    switch (tok.type) {
      case 'Plus':
        return '+';
      case 'Minus':
        return '-';
      case 'Star':
        return '*';
      case 'Slash':
        return '/';
      case 'Percent':
        return '%';
      case 'Less':
        return '<';
      case 'LessEqual':
        return '<=';
      case 'Greater':
        return '>';
      case 'GreaterEqual':
        return '>=';
      case 'EqualEqual':
        return '==';
      case 'BangEqual':
        return '!=';
      case 'EqualEqualEqual':
        return '===';
      case 'BangEqualEqual':
        return '!==';
      case 'AmpersandAmpersand':
        return '&&';
      case 'PipePipe':
        return '||';
      default:
        return null;
    }
  }

  function parseBinary(minPrec: number): Expression {
    let left = parseUnary();

    while (true) {
      const op = getOperator(peek());
      if (op === null) break;
      const prec = PRECEDENCE[op] ?? 0;
      if (prec <= minPrec) break;

      advance();
      const right = parseBinary(prec);

      if (op === '&&' || op === '||') {
        const logResult: LogicalExpression = {
          type: 'LogicalExpression',
          operator: op,
          left,
          right,
          loc: left.loc,
        };
        left = logResult;
      } else {
        const binResult: BinaryExpression = {
          type: 'BinaryExpression',
          operator: op,
          left,
          right,
          loc: left.loc,
        };
        left = binResult;
      }
    }

    return left;
  }

  function parseUnary(): Expression {
    const tok = peek();
    if (tok.type === 'Await') {
      advance();
      const arg = parseUnary();
      const result: AwaitExpression = {
        type: 'AwaitExpression',
        argument: arg,
        loc: {
          start: { line: tok.line, column: tok.column },
          end: arg.loc?.end ?? { line: tok.line, column: tok.column },
        },
      };
      return result;
    }
    if (tok.type === 'Bang') {
      advance();
      const arg = parseUnary();
      const result: UnaryExpression = {
        type: 'UnaryExpression',
        operator: '!',
        argument: arg,
        loc: {
          start: { line: tok.line, column: tok.column },
          end: arg.loc?.end ?? { line: tok.line, column: tok.column },
        },
      };
      return result;
    }
    if (tok.type === 'Minus') {
      advance();
      const arg = parseUnary();
      const result: UnaryExpression = {
        type: 'UnaryExpression',
        operator: '-',
        argument: arg,
        loc: {
          start: { line: tok.line, column: tok.column },
          end: arg.loc?.end ?? { line: tok.line, column: tok.column },
        },
      };
      return result;
    }
    return parseUpdate();
  }

  function parseUpdate(): Expression {
    // Prefix ++/--
    const tok = peek();
    if (tok.type === 'PlusPlus' || tok.type === 'MinusMinus') {
      advance();
      const op = tok.value as '++' | '--';
      const arg = parseCallMember();
      if (arg.type !== 'Identifier' && arg.type !== 'MemberExpression') {
        throw new ParseError('Invalid update target');
      }
      const result: UpdateExpression = {
        type: 'UpdateExpression',
        operator: op,
        argument: arg as Identifier | MemberExpression,
        prefix: true,
        loc: {
          start: { line: tok.line, column: tok.column },
          end: arg.loc?.end ?? { line: tok.line, column: tok.column },
        },
      };
      return result;
    }

    const expr = parseCallMember();

    // Postfix ++/--
    if (peek().type === 'PlusPlus' || peek().type === 'MinusMinus') {
      const postTok = advance();
      const op = postTok.value as '++' | '--';
      if (expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
        throw new ParseError('Invalid update target');
      }
      const result: UpdateExpression = {
        type: 'UpdateExpression',
        operator: op,
        argument: expr as Identifier | MemberExpression,
        prefix: false,
        loc: expr.loc,
      };
      return result;
    }

    return expr;
  }

  function parseCallMember(): Expression {
    let expr = parsePrimary();

    while (true) {
      if (check('OpenParen')) {
        advance();
        const args: Expression[] = [];
        while (!check('CloseParen') && !check('EOF')) {
          args.push(parseExpression());
          if (!check('CloseParen')) expect('Comma');
        }
        expect('CloseParen');
        const callResult: CallExpression = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
          loc: expr.loc,
        };
        expr = callResult;
      } else if (check('Dot')) {
        advance();
        const propTok = peek();
        const prop = parseIdentifier();
        const memberResult: MemberExpression = {
          type: 'MemberExpression',
          object: expr,
          property: prop,
          computed: false,
          loc: {
            start: expr.loc?.start ?? { line: propTok.line, column: propTok.column },
            end: prop.loc?.end ?? { line: propTok.line, column: propTok.column },
          },
        };
        expr = memberResult;
      } else if (check('OpenBracket')) {
        advance();
        const prop = parseExpression();
        expect('CloseBracket');
        const memberResult: MemberExpression = {
          type: 'MemberExpression',
          object: expr,
          property: prop,
          computed: true,
          loc: expr.loc,
        };
        expr = memberResult;
      } else {
        break;
      }
    }

    return expr;
  }

  function parsePrimary(): Expression {
    const tok = peek();

    if (tok.type === 'Number') {
      advance();
      const result: NumericLiteral = {
        type: 'NumericLiteral',
        value: parseFloat(tok.value),
        loc: {
          start: { line: tok.line, column: tok.column },
          end: { line: tok.line, column: tok.column + tok.value.length },
        },
      };
      return result;
    }

    if (tok.type === 'String') {
      advance();
      const result: StringLiteral = {
        type: 'StringLiteral',
        value: tok.value,
        loc: {
          start: { line: tok.line, column: tok.column },
          end: { line: tok.line, column: tok.column + tok.value.length + 2 },
        },
      };
      return result;
    }

    if (tok.type === 'True') {
      advance();
      const result: BooleanLiteral = {
        type: 'BooleanLiteral',
        value: true,
        loc: { start: { line: tok.line, column: tok.column }, end: { line: tok.line, column: tok.column + 4 } },
      };
      return result;
    }

    if (tok.type === 'False') {
      advance();
      const result: BooleanLiteral = {
        type: 'BooleanLiteral',
        value: false,
        loc: { start: { line: tok.line, column: tok.column }, end: { line: tok.line, column: tok.column + 5 } },
      };
      return result;
    }

    if (tok.type === 'Null') {
      advance();
      const result: NullLiteral = {
        type: 'NullLiteral',
        loc: { start: { line: tok.line, column: tok.column }, end: { line: tok.line, column: tok.column + 4 } },
      };
      return result;
    }

    if (tok.type === 'Undefined') {
      advance();
      const result: UndefinedLiteral = {
        type: 'UndefinedLiteral',
        loc: { start: { line: tok.line, column: tok.column }, end: { line: tok.line, column: tok.column + 9 } },
      };
      return result;
    }

    // new Expression
    if (tok.type === 'New') {
      advance();
      // Parse the constructor name (simple identifier for now)
      const calleeTok = peek();
      const callee = parseIdentifier();
      const args: Expression[] = [];
      if (check('OpenParen')) {
        advance();
        while (!check('CloseParen') && !check('EOF')) {
          args.push(parseExpression());
          if (!check('CloseParen')) expect('Comma');
        }
        expect('CloseParen');
      }
      const result: NewExpression = {
        type: 'NewExpression',
        callee,
        arguments: args,
        loc: {
          start: { line: tok.line, column: tok.column },
          end: { line: calleeTok.line, column: calleeTok.column },
        },
      };
      return result;
    }

    if (tok.type === 'Identifier') {
      const id = parseIdentifier();
      // Check for single-param arrow function: x => body
      if (check('Arrow')) {
        advance(); // consume =>
        const body = parseArrowBody();
        const result: ArrowFunctionExpression = {
          type: 'ArrowFunctionExpression',
          params: [id],
          body,
          loc: {
            start: id.loc?.start ?? { line: tok.line, column: tok.column },
            end: (body as { loc?: { end: { line: number; column: number } } }).loc?.end ??
              id.loc?.end ?? { line: tok.line, column: tok.column },
          },
        };
        return result;
      }
      return id;
    }

    if (tok.type === 'OpenParen') {
      // Check if this is an arrow function: (params) => body
      if (isArrowParams()) {
        advance(); // consume (
        const params: Identifier[] = [];
        while (!check('CloseParen') && !check('EOF')) {
          params.push(parseIdentifier());
          if (!check('CloseParen')) expect('Comma');
        }
        expect('CloseParen');
        expect('Arrow');
        const body = parseArrowBody();
        const result: ArrowFunctionExpression = {
          type: 'ArrowFunctionExpression',
          params,
          body,
          loc: {
            start: { line: tok.line, column: tok.column },
            end: (body as { loc?: { end: { line: number; column: number } } }).loc?.end ?? {
              line: tok.line,
              column: tok.column,
            },
          },
        };
        return result;
      }
      // Regular grouped expression
      advance();
      const expr = parseExpression();
      expect('CloseParen');
      return expr;
    }

    if (tok.type === 'OpenBracket') {
      return parseArrayExpression();
    }

    if (tok.type === 'OpenBrace') {
      return parseObjectExpression();
    }

    if (tok.type === 'Function') {
      return parseFunctionExpression();
    }

    if (tok.type === 'Async') {
      if (peek(1).type === 'Function') {
        advance(); // consume 'async'
        return parseFunctionExpression(true);
      }
      throw new ParseError(`Unexpected 'async'`, {
        start: { line: tok.line, column: tok.column },
        end: { line: tok.line, column: tok.column },
      });
    }

    throw new ParseError(`Unexpected token '${tok.type}' ('${tok.value}')`, {
      start: { line: tok.line, column: tok.column },
      end: { line: tok.line, column: tok.column },
    });
  }

  function parseArrayExpression(): ArrayExpression {
    const start = peek();
    expect('OpenBracket');
    const elements: Expression[] = [];
    while (!check('CloseBracket') && !check('EOF')) {
      elements.push(parseExpression());
      if (!check('CloseBracket')) expect('Comma');
    }
    expect('CloseBracket');
    return {
      type: 'ArrayExpression',
      elements,
      loc: { start: { line: start.line, column: start.column }, end: { line: peek().line, column: peek().column } },
    };
  }

  function parseObjectExpression(): ObjectExpression {
    const start = peek();
    expect('OpenBrace');
    const properties: ObjectProperty[] = [];
    while (!check('CloseBrace') && !check('EOF')) {
      const keyTok = peek();
      let key: Identifier | StringLiteral;
      if (keyTok.type === 'Identifier') {
        key = parseIdentifier();
      } else if (keyTok.type === 'String') {
        advance();
        key = {
          type: 'StringLiteral',
          value: keyTok.value,
          loc: {
            start: { line: keyTok.line, column: keyTok.column },
            end: { line: keyTok.line, column: keyTok.column + keyTok.value.length + 2 },
          },
        };
      } else {
        throw new ParseError(`Expected object key, got '${keyTok.type}'`);
      }
      expect('Colon');
      const value = parseExpression();
      properties.push({ type: 'ObjectProperty', key, value });
      if (!check('CloseBrace')) match('Comma');
    }
    expect('CloseBrace');
    return {
      type: 'ObjectExpression',
      properties,
      loc: { start: { line: start.line, column: start.column }, end: { line: peek().line, column: peek().column } },
    };
  }

  function parseFunctionExpression(isAsync = false): FunctionDeclaration {
    // We reuse FunctionDeclaration structure but id may be missing
    const start = peek();
    expect('Function');
    let id: Identifier = { type: 'Identifier', name: '<anonymous>' };
    if (check('Identifier')) {
      id = parseIdentifier();
    }
    expect('OpenParen');
    const params: Identifier[] = [];
    while (!check('CloseParen')) {
      params.push(parseIdentifier());
      if (!check('CloseParen')) expect('Comma');
    }
    expect('CloseParen');
    const body = parseBlockStatement();
    return {
      type: 'FunctionDeclaration',
      id,
      params,
      body,
      async: isAsync || undefined,
      loc: loc({ line: start.line, column: start.column }),
    };
  }

  function parseIdentifier(): Identifier {
    const tok = expect('Identifier');
    return {
      type: 'Identifier',
      name: tok.value,
      loc: {
        start: { line: tok.line, column: tok.column },
        end: { line: tok.line, column: tok.column + tok.value.length },
      },
    };
  }

  return parseProgram();
}
