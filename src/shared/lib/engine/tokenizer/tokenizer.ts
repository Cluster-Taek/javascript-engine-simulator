import { type Token, type TokenType, KEYWORDS } from './types';

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;

  function peek(offset = 0): string {
    return source[pos + offset] ?? '';
  }

  function advance(): string {
    const ch = source[pos++];
    if (ch === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    return ch;
  }

  function addToken(type: TokenType, value: string, tokenLine: number, tokenColumn: number): void {
    tokens.push({ type, value, line: tokenLine, column: tokenColumn });
  }

  function skipWhitespace(): void {
    while (pos < source.length && /\s/.test(peek())) {
      advance();
    }
  }

  function skipLineComment(): void {
    while (pos < source.length && peek() !== '\n') {
      advance();
    }
  }

  function skipBlockComment(): void {
    advance(); // *
    while (pos < source.length) {
      if (peek() === '*' && peek(1) === '/') {
        advance();
        advance();
        break;
      }
      advance();
    }
  }

  function readString(quote: string): string {
    let value = '';
    while (pos < source.length && peek() !== quote) {
      if (peek() === '\\') {
        advance();
        const escaped = advance();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          default:
            value += escaped;
        }
      } else {
        value += advance();
      }
    }
    advance(); // closing quote
    return value;
  }

  function readNumber(): string {
    let value = '';
    while (pos < source.length && /[0-9.]/.test(peek())) {
      value += advance();
    }
    return value;
  }

  function readIdentifier(): string {
    let value = '';
    while (pos < source.length && /[a-zA-Z0-9_$]/.test(peek())) {
      value += advance();
    }
    return value;
  }

  while (pos < source.length) {
    skipWhitespace();
    if (pos >= source.length) break;

    const tokenLine = line;
    const tokenColumn = column;
    const ch = peek();

    // Line comment
    if (ch === '/' && peek(1) === '/') {
      advance();
      advance();
      skipLineComment();
      continue;
    }

    // Block comment
    if (ch === '/' && peek(1) === '*') {
      advance();
      skipBlockComment();
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(peek(1)))) {
      const value = readNumber();
      addToken('Number', value, tokenLine, tokenColumn);
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      advance();
      const value = readString(ch);
      addToken('String', value, tokenLine, tokenColumn);
      continue;
    }

    // Template literals (basic - no expressions)
    if (ch === '`') {
      advance();
      const value = readString('`');
      addToken('String', value, tokenLine, tokenColumn);
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(ch)) {
      const value = readIdentifier();
      const type: TokenType = KEYWORDS[value] ?? 'Identifier';
      addToken(type, value, tokenLine, tokenColumn);
      continue;
    }

    // Multi-char operators
    advance(); // consume ch

    switch (ch) {
      case '=':
        if (peek() === '=') {
          advance();
          if (peek() === '=') {
            advance();
            addToken('EqualEqualEqual', '===', tokenLine, tokenColumn);
          } else {
            addToken('EqualEqual', '==', tokenLine, tokenColumn);
          }
        } else if (peek() === '>') {
          advance();
          addToken('Arrow', '=>', tokenLine, tokenColumn);
        } else {
          addToken('Equals', '=', tokenLine, tokenColumn);
        }
        break;
      case '!':
        if (peek() === '=') {
          advance();
          if (peek() === '=') {
            advance();
            addToken('BangEqualEqual', '!==', tokenLine, tokenColumn);
          } else {
            addToken('BangEqual', '!=', tokenLine, tokenColumn);
          }
        } else {
          addToken('Bang', '!', tokenLine, tokenColumn);
        }
        break;
      case '<':
        if (peek() === '=') {
          advance();
          addToken('LessEqual', '<=', tokenLine, tokenColumn);
        } else {
          addToken('Less', '<', tokenLine, tokenColumn);
        }
        break;
      case '>':
        if (peek() === '=') {
          advance();
          addToken('GreaterEqual', '>=', tokenLine, tokenColumn);
        } else {
          addToken('Greater', '>', tokenLine, tokenColumn);
        }
        break;
      case '&':
        if (peek() === '&') {
          advance();
          addToken('AmpersandAmpersand', '&&', tokenLine, tokenColumn);
        }
        break;
      case '|':
        if (peek() === '|') {
          advance();
          addToken('PipePipe', '||', tokenLine, tokenColumn);
        }
        break;
      case '+':
        if (peek() === '+') {
          advance();
          addToken('PlusPlus', '++', tokenLine, tokenColumn);
        } else if (peek() === '=') {
          advance();
          addToken('PlusEquals', '+=', tokenLine, tokenColumn);
        } else {
          addToken('Plus', '+', tokenLine, tokenColumn);
        }
        break;
      case '-':
        if (peek() === '-') {
          advance();
          addToken('MinusMinus', '--', tokenLine, tokenColumn);
        } else if (peek() === '=') {
          advance();
          addToken('MinusEquals', '-=', tokenLine, tokenColumn);
        } else {
          addToken('Minus', '-', tokenLine, tokenColumn);
        }
        break;
      case '*':
        addToken('Star', '*', tokenLine, tokenColumn);
        break;
      case '/':
        addToken('Slash', '/', tokenLine, tokenColumn);
        break;
      case '%':
        addToken('Percent', '%', tokenLine, tokenColumn);
        break;
      case '(':
        addToken('OpenParen', '(', tokenLine, tokenColumn);
        break;
      case ')':
        addToken('CloseParen', ')', tokenLine, tokenColumn);
        break;
      case '{':
        addToken('OpenBrace', '{', tokenLine, tokenColumn);
        break;
      case '}':
        addToken('CloseBrace', '}', tokenLine, tokenColumn);
        break;
      case '[':
        addToken('OpenBracket', '[', tokenLine, tokenColumn);
        break;
      case ']':
        addToken('CloseBracket', ']', tokenLine, tokenColumn);
        break;
      case ';':
        addToken('Semicolon', ';', tokenLine, tokenColumn);
        break;
      case ':':
        addToken('Colon', ':', tokenLine, tokenColumn);
        break;
      case ',':
        addToken('Comma', ',', tokenLine, tokenColumn);
        break;
      case '.':
        addToken('Dot', '.', tokenLine, tokenColumn);
        break;
      case '?':
        addToken('Question', '?', tokenLine, tokenColumn);
        break;
      // ignore unknown characters
    }
  }

  addToken('EOF', '', line, column);
  return tokens;
}
