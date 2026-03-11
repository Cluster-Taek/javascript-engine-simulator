import { type Token, type TokenType } from '@/shared/lib/engine';

const TOKEN_COLORS: Partial<Record<TokenType, string>> = {
  Number: 'bg-blue-900 text-blue-300 border-blue-700',
  String: 'bg-green-900 text-green-300 border-green-700',
  Identifier: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  Let: 'bg-purple-900 text-purple-300 border-purple-700',
  Const: 'bg-purple-900 text-purple-300 border-purple-700',
  Var: 'bg-purple-900 text-purple-300 border-purple-700',
  Function: 'bg-indigo-900 text-indigo-300 border-indigo-700',
  Return: 'bg-indigo-900 text-indigo-300 border-indigo-700',
  If: 'bg-orange-900 text-orange-300 border-orange-700',
  Else: 'bg-orange-900 text-orange-300 border-orange-700',
  While: 'bg-orange-900 text-orange-300 border-orange-700',
  For: 'bg-orange-900 text-orange-300 border-orange-700',
  True: 'bg-teal-900 text-teal-300 border-teal-700',
  False: 'bg-teal-900 text-teal-300 border-teal-700',
  Null: 'bg-gray-800 text-gray-400 border-gray-600',
  EOF: 'bg-gray-800 text-gray-600 border-gray-700',
};

function getTokenColor(type: TokenType): string {
  return TOKEN_COLORS[type] ?? 'bg-gray-800 text-gray-300 border-gray-600';
}

interface TokenBadgeProps {
  token: Token;
  active?: boolean;
}

export function TokenBadge({ token, active }: TokenBadgeProps) {
  if (token.type === 'EOF') return null;
  const colorClass = getTokenColor(token.type);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-mono transition-all ${colorClass} ${
        active ? 'ring-2 ring-white scale-110' : ''
      }`}
      title={`${token.type} @ ${token.line}:${token.column}`}
    >
      {token.value || token.type}
    </span>
  );
}
