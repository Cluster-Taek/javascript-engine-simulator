'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { type EnvironmentSnapshot, type ValueNode } from '@/shared/lib/engine';
import { ValueTree } from '@/shared/ui/value-tree';

// ─── Binding row ─────────────────────────────────────────────────────────────

interface BindingRowProps {
  name: string;
  valueNode: ValueNode;
  kind: string;
  initialized: boolean;
  highlight?: { bg: string; border: string } | null;
}

function BindingRow({ name, valueNode, kind, initialized, highlight }: BindingRowProps) {
  const kindColor = kind === 'const' ? 'text-teal-400' : kind === 'let' ? 'text-yellow-400' : 'text-orange-400';
  const isThisHighlighted = name === 'this' && highlight;

  return (
    <div
      className={`flex items-start gap-2 px-3 py-1 rounded text-xs font-mono ${!initialized ? 'opacity-60' : ''} ${
        isThisHighlighted ? `${highlight.bg} border-l-2 ${highlight.border}` : 'hover:bg-gray-800'
      }`}
    >
      <span className={`${kindColor} w-10 shrink-0`}>{kind}</span>
      <span className={`shrink-0 ${isThisHighlighted ? 'text-white font-bold' : 'text-gray-200'}`}>{name}</span>
      <span className="text-gray-500 shrink-0">=</span>
      {initialized ? (
        <ValueTree node={valueNode} />
      ) : (
        <span className="text-red-400 italic">&lt;uninitialized&gt;</span>
      )}
    </div>
  );
}

// ─── ScopePanel ──────────────────────────────────────────────────────────────

interface ScopePanelProps {
  environments: readonly EnvironmentSnapshot[];
  thisHighlight?: { bg: string; border: string } | null;
}

export function ScopePanel({ environments, thisHighlight }: ScopePanelProps) {
  const t = useTranslations('emptyStates');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.parentElement) {
      ref.current.parentElement.scrollTop = 0;
    }
  }, [environments.length]);

  if (environments.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('scope')}</div>;
  }

  return (
    <div ref={ref} className="p-2">
      {environments.map((env) => (
        <div key={env.id} className="mb-3">
          <div className="text-xs text-gray-400 font-semibold px-3 py-1 bg-gray-800 rounded mb-1">{env.label}</div>
          {env.bindings.length === 0 ? (
            <div className="text-xs text-gray-600 px-3 py-1">{t('scopeEmpty')}</div>
          ) : (
            env.bindings.map((binding) => (
              <BindingRow
                key={binding.name}
                name={binding.name}
                valueNode={binding.valueNode}
                kind={binding.kind}
                initialized={binding.initialized}
                highlight={thisHighlight}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
