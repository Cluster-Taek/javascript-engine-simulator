'use client';

import { motion } from 'motion/react';
import { type VNode, type DiffOperation } from '@/shared/lib/reconciler';

interface VNodeViewProps {
  node: VNode;
  depth: number;
  focusedNodeId: string | null;
  diffOperations: DiffOperation[];
}

function getNodeEffect(nodeId: string, ops: DiffOperation[]): DiffOperation | undefined {
  return ops.find((op) => op.nodeId === nodeId || op.newNode?.id === nodeId || op.oldNode?.id === nodeId);
}

const effectBg = {
  PLACEMENT: 'bg-green-500/10',
  UPDATE: 'bg-blue-500/10',
  DELETION: 'bg-red-500/10 opacity-60',
} as const;

const effectBadgeColors = {
  PLACEMENT: 'bg-green-700 text-green-200',
  UPDATE: 'bg-blue-700 text-blue-200',
  DELETION: 'bg-red-700 text-red-200',
} as const;

function JsonPunct({ children }: { children: string }) {
  return <span className="text-gray-500">{children}</span>;
}

function JsonKey({ children }: { children: string }) {
  return <span className="text-purple-400">&quot;{children}&quot;</span>;
}

function JsonString({ children }: { children: string }) {
  return <span className="text-green-300">&quot;{children}&quot;</span>;
}

function JsonValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-500">null</span>;
  }
  if (typeof value === 'string') {
    return <JsonString>{value}</JsonString>;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-amber-300">{String(value)}</span>;
  }
  return <span className="text-gray-400">{JSON.stringify(value)}</span>;
}

export function VNodeView({ node, depth, focusedNodeId, diffOperations }: VNodeViewProps) {
  const isFocused = node.id === focusedNodeId;
  const effect = getNodeEffect(node.id, diffOperations);
  const indent = depth * 12;

  const isText = node.type === '#text';
  const propEntries = Object.entries(node.props).filter(([key]) => key !== 'nodeValue');

  return (
    <motion.div
      layout
      className={`rounded ${effect ? effectBg[effect.type] : ''} ${isFocused ? 'ring-1 ring-yellow-400/50' : ''}`}
      animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="font-mono text-[11px] leading-relaxed" style={{ paddingLeft: indent }}>
        {/* Opening brace */}
        <div className="flex items-center gap-1">
          <JsonPunct>{'{'}</JsonPunct>
          {effect && (
            <span className={`text-[9px] px-1 py-0 rounded font-mono ${effectBadgeColors[effect.type]}`}>
              {effect.type}
            </span>
          )}
        </div>

        {/* type */}
        <div style={{ paddingLeft: 12 }}>
          <JsonKey>type</JsonKey>
          <JsonPunct>: </JsonPunct>
          <span className="text-cyan-300">&quot;{node.type}&quot;</span>
          <JsonPunct>,</JsonPunct>
        </div>

        {/* key (if exists) */}
        {node.key !== null && (
          <div style={{ paddingLeft: 12 }}>
            <JsonKey>key</JsonKey>
            <JsonPunct>: </JsonPunct>
            <JsonString>{node.key}</JsonString>
            <JsonPunct>,</JsonPunct>
          </div>
        )}

        {/* props */}
        {isText ? (
          <div style={{ paddingLeft: 12 }}>
            <JsonKey>props</JsonKey>
            <JsonPunct>{': { '}</JsonPunct>
            <JsonKey>nodeValue</JsonKey>
            <JsonPunct>: </JsonPunct>
            <JsonString>{node.props.nodeValue as string}</JsonString>
            <JsonPunct>{' },'}</JsonPunct>
          </div>
        ) : propEntries.length > 0 ? (
          <>
            <div style={{ paddingLeft: 12 }}>
              <JsonKey>props</JsonKey>
              <JsonPunct>{': {'}</JsonPunct>
            </div>
            {propEntries.map(([k, v]) => (
              <div key={k} style={{ paddingLeft: 24 }}>
                <JsonKey>{k}</JsonKey>
                <JsonPunct>: </JsonPunct>
                <JsonValue value={v} />
                <JsonPunct>,</JsonPunct>
              </div>
            ))}
            <div style={{ paddingLeft: 12 }}>
              <JsonPunct>{'},'}</JsonPunct>
            </div>
          </>
        ) : (
          <div style={{ paddingLeft: 12 }}>
            <JsonKey>props</JsonKey>
            <JsonPunct>{': {},'}</JsonPunct>
          </div>
        )}

        {/* children */}
        {node.children.length > 0 ? (
          <>
            <div style={{ paddingLeft: 12 }}>
              <JsonKey>children</JsonKey>
              <JsonPunct>{': ['}</JsonPunct>
            </div>
            {node.children.map((child) => (
              <VNodeView
                key={child.id}
                node={child}
                depth={depth + 1}
                focusedNodeId={focusedNodeId}
                diffOperations={diffOperations}
              />
            ))}
            <div style={{ paddingLeft: 12 }}>
              <JsonPunct>{']'}</JsonPunct>
            </div>
          </>
        ) : (
          <div style={{ paddingLeft: 12 }}>
            <JsonKey>children</JsonKey>
            <JsonPunct>{': []'}</JsonPunct>
          </div>
        )}

        {/* Closing brace */}
        <div>
          <JsonPunct>{'}'}</JsonPunct>
        </div>
      </div>
    </motion.div>
  );
}
