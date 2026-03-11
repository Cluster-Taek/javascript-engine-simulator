'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { type EnvironmentSnapshot, type ValueNode } from '@/shared/lib/engine';

// ─── ValueNode tree ────────────────────────────────────────────────────────

interface ValueTreeProps {
  node: ValueNode;
  depth?: number;
}

function ValueTree({ node, depth = 0 }: ValueTreeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const indent = depth * 12;

  if (node.kind === 'primitive') {
    return <span className="text-green-300">{node.display}</span>;
  }

  if (node.kind === 'function') {
    return <span className="text-purple-300 italic">{node.display}</span>;
  }

  const children: Array<{ label: string; node: ValueNode }> =
    node.kind === 'array'
      ? node.items.map((item, i) => ({ label: `${i}`, node: item }))
      : node.entries.map(([k, v]) => ({ label: k, node: v }));

  const hasChildren = children.length > 0;

  return (
    <span className="inline-block w-full">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) setExpanded((v) => !v);
        }}
        className="inline-flex items-center gap-1 hover:text-gray-100 transition-colors"
      >
        <span className="text-gray-500 w-3 text-center">{hasChildren ? (expanded ? '▼' : '▶') : '·'}</span>
        <span className="text-cyan-300">{node.display}</span>
      </button>

      {expanded && hasChildren && (
        <span className="block">
          {children.map(({ label, node: child }) => (
            <span key={label} className="flex items-start gap-1 py-0.5" style={{ paddingLeft: indent + 16 }}>
              <span className="text-gray-500 shrink-0">{label}:</span>
              <ValueTree node={child} depth={depth + 1} />
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

// ─── Binding row ─────────────────────────────────────────────────────────────

interface BindingRowProps {
  name: string;
  valueNode: ValueNode;
  kind: string;
  initialized: boolean;
}

function BindingRow({ name, valueNode, kind, initialized }: BindingRowProps) {
  const kindColor = kind === 'const' ? 'text-teal-400' : kind === 'let' ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div
      className={`flex items-start gap-2 px-3 py-1 hover:bg-gray-800 rounded text-xs font-mono ${!initialized ? 'opacity-60' : ''}`}
    >
      <span className={`${kindColor} w-10 shrink-0`}>{kind}</span>
      <span className="text-gray-200 shrink-0">{name}</span>
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
}

export function ScopePanel({ environments }: ScopePanelProps) {
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
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
