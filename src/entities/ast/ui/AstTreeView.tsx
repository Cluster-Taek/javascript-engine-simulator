'use client';

import { useTranslations } from 'next-intl';
import { type Program } from '@/shared/lib/engine';
import { AstNodeView } from './AstNode';

interface AstTreeViewProps {
  ast: Program | null;
  currentLine?: number | null;
}

export function AstTreeView({ ast, currentLine }: AstTreeViewProps) {
  const t = useTranslations('emptyStates');

  if (!ast) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('astTree')}</div>;
  }
  return (
    <div className="p-2 overflow-auto font-mono text-xs">
      <AstNodeView node={ast} depth={0} currentLine={currentLine} />
    </div>
  );
}
