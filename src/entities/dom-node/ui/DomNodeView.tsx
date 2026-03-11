'use client';

import { motion } from 'motion/react';
import { type EventPhase, type VirtualDomNode } from '@/shared/lib/event-engine';

const phaseColors: Record<EventPhase, string> = {
  capturing: 'border-blue-400 bg-blue-400/10',
  target: 'border-yellow-400 bg-yellow-400/10',
  bubbling: 'border-green-400 bg-green-400/10',
};

interface DomNodeViewProps {
  node: VirtualDomNode;
  isActive: boolean;
  isTarget: boolean;
  activePhase: EventPhase | null;
  highlightedListenerId: string | null;
  depth?: number;
}

export function DomNodeView({
  node,
  isActive,
  isTarget,
  activePhase,
  highlightedListenerId,
  depth = 0,
}: DomNodeViewProps) {
  const isHighlighted = isActive && activePhase;
  const hasActiveListener = node.listeners.some((l) => l.id === highlightedListenerId);

  return (
    <motion.div
      layout
      layoutId={`event-node-${node.id}`}
      className={`
        rounded border px-2 py-1.5 text-xs font-mono transition-colors
        ${isHighlighted ? phaseColors[activePhase!] : 'border-gray-700 bg-gray-800/50'}
        ${isTarget ? 'ring-1 ring-yellow-500/50' : ''}
        ${hasActiveListener ? 'shadow-md shadow-current' : ''}
      `}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-1.5">
        <span className={`${isTarget ? 'text-yellow-300' : 'text-gray-300'}`}>
          {isTarget ? '★ ' : ''}&lt;{node.tag}&gt;
        </span>
        <span className="text-gray-500 text-[10px]">{node.label}</span>
        {node.listeners.length > 0 && (
          <span className="text-[10px] px-1 rounded bg-gray-700 text-gray-400">
            {node.listeners.length} listener{node.listeners.length > 1 ? 's' : ''}
          </span>
        )}
        {node.hasDefaultBehavior && (
          <span className="text-[10px] px-1 rounded bg-orange-900/50 text-orange-400">{node.hasDefaultBehavior}</span>
        )}
      </div>
    </motion.div>
  );
}
