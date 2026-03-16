'use client';

import { useState } from 'react';
import { type ValueNode } from '@/shared/lib/engine';

interface ValueTreeProps {
  node: ValueNode;
  depth?: number;
  maxDepth?: number;
}

export function ValueTree({ node, depth = 0, maxDepth }: ValueTreeProps) {
  const autoExpand = maxDepth !== undefined ? depth < maxDepth : depth < 1;
  const [expanded, setExpanded] = useState(autoExpand);
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
              <ValueTree node={child} depth={depth + 1} maxDepth={maxDepth} />
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
