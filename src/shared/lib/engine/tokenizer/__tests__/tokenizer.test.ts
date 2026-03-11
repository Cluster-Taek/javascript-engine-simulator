import { describe, it, expect } from 'vitest';
import { tokenize } from '../tokenizer';

describe('tokenize', () => {
  it('tokenizes numbers', () => {
    const tokens = tokenize('42 3.14');
    expect(tokens[0]).toMatchObject({ type: 'Number', value: '42' });
    expect(tokens[1]).toMatchObject({ type: 'Number', value: '3.14' });
  });

  it('tokenizes strings', () => {
    const tokens = tokenize('"hello" \'world\'');
    expect(tokens[0]).toMatchObject({ type: 'String', value: 'hello' });
    expect(tokens[1]).toMatchObject({ type: 'String', value: 'world' });
  });

  it('tokenizes keywords', () => {
    const tokens = tokenize('let const var function return if else while for');
    expect(tokens[0]).toMatchObject({ type: 'Let' });
    expect(tokens[1]).toMatchObject({ type: 'Const' });
    expect(tokens[2]).toMatchObject({ type: 'Var' });
    expect(tokens[3]).toMatchObject({ type: 'Function' });
    expect(tokens[4]).toMatchObject({ type: 'Return' });
    expect(tokens[5]).toMatchObject({ type: 'If' });
    expect(tokens[6]).toMatchObject({ type: 'Else' });
    expect(tokens[7]).toMatchObject({ type: 'While' });
    expect(tokens[8]).toMatchObject({ type: 'For' });
  });

  it('tokenizes identifiers', () => {
    const tokens = tokenize('foo bar_baz $value');
    expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'foo' });
    expect(tokens[1]).toMatchObject({ type: 'Identifier', value: 'bar_baz' });
    expect(tokens[2]).toMatchObject({ type: 'Identifier', value: '$value' });
  });

  it('tokenizes operators', () => {
    const tokens = tokenize('+ - * / % === !== == != <= >= < > && || ++ -- += -= =');
    expect(tokens.map((t) => t.type)).toEqual([
      'Plus',
      'Minus',
      'Star',
      'Slash',
      'Percent',
      'EqualEqualEqual',
      'BangEqualEqual',
      'EqualEqual',
      'BangEqual',
      'LessEqual',
      'GreaterEqual',
      'Less',
      'Greater',
      'AmpersandAmpersand',
      'PipePipe',
      'PlusPlus',
      'MinusMinus',
      'PlusEquals',
      'MinusEquals',
      'Equals',
      'EOF',
    ]);
  });

  it('tokenizes punctuation', () => {
    const tokens = tokenize('( ) { } [ ] ; , . :');
    expect(tokens.map((t) => t.type)).toEqual([
      'OpenParen',
      'CloseParen',
      'OpenBrace',
      'CloseBrace',
      'OpenBracket',
      'CloseBracket',
      'Semicolon',
      'Comma',
      'Dot',
      'Colon',
      'EOF',
    ]);
  });

  it('tracks line and column', () => {
    const tokens = tokenize('let\nx');
    expect(tokens[0]).toMatchObject({ line: 1, column: 1 });
    expect(tokens[1]).toMatchObject({ line: 2, column: 1 });
  });

  it('skips line comments', () => {
    const tokens = tokenize('let x // this is a comment\nlet y');
    expect(tokens.map((t) => t.type)).toEqual(['Let', 'Identifier', 'Let', 'Identifier', 'EOF']);
  });

  it('skips block comments', () => {
    const tokens = tokenize('let /* hello */ x');
    expect(tokens.map((t) => t.type)).toEqual(['Let', 'Identifier', 'EOF']);
  });

  it('tokenizes boolean literals', () => {
    const tokens = tokenize('true false null undefined');
    expect(tokens[0]).toMatchObject({ type: 'True' });
    expect(tokens[1]).toMatchObject({ type: 'False' });
    expect(tokens[2]).toMatchObject({ type: 'Null' });
    expect(tokens[3]).toMatchObject({ type: 'Undefined' });
  });

  it('always ends with EOF', () => {
    const tokens = tokenize('');
    expect(tokens[tokens.length - 1]).toMatchObject({ type: 'EOF' });
    const tokens2 = tokenize('42');
    expect(tokens2[tokens2.length - 1]).toMatchObject({ type: 'EOF' });
  });

  it('tokenizes a complete variable declaration', () => {
    const tokens = tokenize('let x = 5;');
    expect(tokens.map((t) => t.type)).toEqual(['Let', 'Identifier', 'Equals', 'Number', 'Semicolon', 'EOF']);
  });

  it('tokenizes escape sequences in strings', () => {
    const tokens = tokenize('"hello\\nworld"');
    expect(tokens[0]).toMatchObject({ type: 'String', value: 'hello\nworld' });
  });
});
