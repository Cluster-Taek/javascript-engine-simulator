export interface SourceLocation {
  readonly start: { readonly line: number; readonly column: number };
  readonly end: { readonly line: number; readonly column: number };
}

interface BaseNode {
  readonly loc?: SourceLocation;
}

export interface Program extends BaseNode {
  readonly type: 'Program';
  readonly body: readonly Statement[];
}

export interface VariableDeclaration extends BaseNode {
  readonly type: 'VariableDeclaration';
  readonly kind: 'let' | 'const' | 'var';
  readonly declarations: readonly VariableDeclarator[];
}

export interface VariableDeclarator extends BaseNode {
  readonly type: 'VariableDeclarator';
  readonly id: Identifier;
  readonly init: Expression | null;
}

export interface FunctionDeclaration extends BaseNode {
  readonly type: 'FunctionDeclaration';
  readonly id: Identifier;
  readonly params: readonly Identifier[];
  readonly body: BlockStatement;
  readonly async?: boolean;
}

export interface ReturnStatement extends BaseNode {
  readonly type: 'ReturnStatement';
  readonly argument: Expression | null;
}

export interface IfStatement extends BaseNode {
  readonly type: 'IfStatement';
  readonly test: Expression;
  readonly consequent: BlockStatement;
  readonly alternate: BlockStatement | IfStatement | null;
}

export interface WhileStatement extends BaseNode {
  readonly type: 'WhileStatement';
  readonly test: Expression;
  readonly body: BlockStatement;
}

export interface ForStatement extends BaseNode {
  readonly type: 'ForStatement';
  readonly init: VariableDeclaration | ExpressionStatement | null;
  readonly test: Expression | null;
  readonly update: Expression | null;
  readonly body: BlockStatement;
}

export interface BlockStatement extends BaseNode {
  readonly type: 'BlockStatement';
  readonly body: readonly Statement[];
}

export interface ExpressionStatement extends BaseNode {
  readonly type: 'ExpressionStatement';
  readonly expression: Expression;
}

export interface BinaryExpression extends BaseNode {
  readonly type: 'BinaryExpression';
  readonly operator: string;
  readonly left: Expression;
  readonly right: Expression;
}

export interface LogicalExpression extends BaseNode {
  readonly type: 'LogicalExpression';
  readonly operator: '&&' | '||';
  readonly left: Expression;
  readonly right: Expression;
}

export interface UnaryExpression extends BaseNode {
  readonly type: 'UnaryExpression';
  readonly operator: '!' | '-' | '+';
  readonly argument: Expression;
}

export interface AssignmentExpression extends BaseNode {
  readonly type: 'AssignmentExpression';
  readonly operator: '=' | '+=' | '-=';
  readonly left: Identifier | MemberExpression;
  readonly right: Expression;
}

export interface UpdateExpression extends BaseNode {
  readonly type: 'UpdateExpression';
  readonly operator: '++' | '--';
  readonly argument: Identifier | MemberExpression;
  readonly prefix: boolean;
}

export interface CallExpression extends BaseNode {
  readonly type: 'CallExpression';
  readonly callee: Expression;
  readonly arguments: readonly Expression[];
}

export interface MemberExpression extends BaseNode {
  readonly type: 'MemberExpression';
  readonly object: Expression;
  readonly property: Expression;
  readonly computed: boolean;
}

export interface ArrayExpression extends BaseNode {
  readonly type: 'ArrayExpression';
  readonly elements: readonly Expression[];
}

export interface ObjectExpression extends BaseNode {
  readonly type: 'ObjectExpression';
  readonly properties: readonly ObjectProperty[];
}

export interface ObjectProperty extends BaseNode {
  readonly type: 'ObjectProperty';
  readonly key: Identifier | StringLiteral;
  readonly value: Expression;
}

export interface Identifier extends BaseNode {
  readonly type: 'Identifier';
  readonly name: string;
}

export interface NumericLiteral extends BaseNode {
  readonly type: 'NumericLiteral';
  readonly value: number;
}

export interface StringLiteral extends BaseNode {
  readonly type: 'StringLiteral';
  readonly value: string;
}

export interface BooleanLiteral extends BaseNode {
  readonly type: 'BooleanLiteral';
  readonly value: boolean;
}

export interface NullLiteral extends BaseNode {
  readonly type: 'NullLiteral';
}

export interface UndefinedLiteral extends BaseNode {
  readonly type: 'UndefinedLiteral';
}

export interface ArrowFunctionExpression extends BaseNode {
  readonly type: 'ArrowFunctionExpression';
  readonly params: readonly Identifier[];
  readonly body: BlockStatement | Expression;
  readonly async?: boolean;
}

export interface AwaitExpression extends BaseNode {
  readonly type: 'AwaitExpression';
  readonly argument: Expression;
}

export interface NewExpression extends BaseNode {
  readonly type: 'NewExpression';
  readonly callee: Expression;
  readonly arguments: readonly Expression[];
}

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | BlockStatement
  | ExpressionStatement;

export type Expression =
  | BinaryExpression
  | LogicalExpression
  | UnaryExpression
  | AssignmentExpression
  | UpdateExpression
  | CallExpression
  | MemberExpression
  | ArrayExpression
  | ObjectExpression
  | Identifier
  | NumericLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | FunctionDeclaration
  | ArrowFunctionExpression
  | NewExpression
  | AwaitExpression;

export type AstNode = Program | Statement | Expression | VariableDeclarator | ObjectProperty;
