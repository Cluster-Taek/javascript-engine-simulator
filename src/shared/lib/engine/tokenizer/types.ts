export type TokenType =
  | 'Number'
  | 'String'
  | 'Identifier'
  | 'Let'
  | 'Const'
  | 'Var'
  | 'Function'
  | 'Return'
  | 'If'
  | 'Else'
  | 'While'
  | 'For'
  | 'True'
  | 'False'
  | 'Null'
  | 'Undefined'
  | 'New'
  | 'Plus'
  | 'Minus'
  | 'Star'
  | 'Slash'
  | 'Percent'
  | 'Equals'
  | 'EqualEqual'
  | 'EqualEqualEqual'
  | 'BangEqual'
  | 'BangEqualEqual'
  | 'Less'
  | 'LessEqual'
  | 'Greater'
  | 'GreaterEqual'
  | 'Bang'
  | 'AmpersandAmpersand'
  | 'PipePipe'
  | 'PlusPlus'
  | 'MinusMinus'
  | 'PlusEquals'
  | 'MinusEquals'
  | 'Arrow'
  | 'OpenParen'
  | 'CloseParen'
  | 'OpenBrace'
  | 'CloseBrace'
  | 'OpenBracket'
  | 'CloseBracket'
  | 'Semicolon'
  | 'Colon'
  | 'Comma'
  | 'Dot'
  | 'Async'
  | 'Await'
  | 'EOF';

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly line: number;
  readonly column: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  let: 'Let',
  const: 'Const',
  var: 'Var',
  function: 'Function',
  return: 'Return',
  if: 'If',
  else: 'Else',
  while: 'While',
  for: 'For',
  true: 'True',
  false: 'False',
  null: 'Null',
  undefined: 'Undefined',
  new: 'New',
  async: 'Async',
  await: 'Await',
};
