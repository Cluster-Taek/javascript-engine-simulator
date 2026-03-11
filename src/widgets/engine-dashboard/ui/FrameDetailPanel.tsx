'use client';

import { useTranslations } from 'next-intl';
import { AstTreeView } from '@/entities/ast';
import { ScopePanel } from '@/entities/environment';
import { type StackFrame, type Program } from '@/shared/lib/engine';

interface FrameDetailPanelProps {
  frame: StackFrame;
  ast: Program | null;
}

export function FrameDetailPanel({ frame, ast }: FrameDetailPanelProps) {
  const t = useTranslations('frameDetail');

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Frame info */}
      <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded border border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{t('frameLabel')}</span>
        <span className="text-xs text-blue-300 font-mono font-semibold">{frame.name}</span>
        {frame.loc && (
          <span className="text-xs text-gray-500 font-mono">{t('line', { line: frame.loc.start.line })}</span>
        )}
      </div>

      {/* AST */}
      <div>
        <div className="text-xs text-gray-500 font-mono font-semibold mb-1 px-1">{t('astTab')}</div>
        <div className="border border-gray-700 rounded overflow-auto max-h-64">
          <AstTreeView ast={ast} currentLine={frame.loc?.start.line} />
        </div>
      </div>

      {/* Scope */}
      <div>
        <div className="text-xs text-gray-500 font-mono font-semibold mb-1 px-1">{t('scopeTab')}</div>
        <div className="border border-gray-700 rounded overflow-auto max-h-48">
          <ScopePanel environments={[frame.environmentSnapshot]} />
        </div>
      </div>
    </div>
  );
}
