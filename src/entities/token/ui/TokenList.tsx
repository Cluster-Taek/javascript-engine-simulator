'use client';

import { useTranslations } from 'next-intl';
import { type Token } from '@/shared/lib/engine';
import { TokenBadge } from './TokenBadge';

interface TokenListProps {
  tokens: Token[];
  currentLine?: number | null;
}

export function TokenList({ tokens, currentLine }: TokenListProps) {
  const t = useTranslations('emptyStates');
  const visible = tokens.filter((token) => token.type !== 'EOF');
  if (visible.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('tokenList')}</div>;
  }
  return (
    <div className="p-3 flex flex-wrap gap-1">
      {visible.map((token, idx) => (
        <TokenBadge
          key={idx}
          token={token}
          active={currentLine !== null && currentLine !== undefined && token.line === currentLine}
        />
      ))}
    </div>
  );
}
