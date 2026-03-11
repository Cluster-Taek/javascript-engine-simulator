'use client';

import { motion, AnimatePresence } from 'motion/react';
import { type EventPhase, type VirtualDomNode } from '@/shared/lib/event-engine';

const phaseConfig: Record<EventPhase, { border: string; bg: string; text: string; glow: string; arrow: string }> = {
  capturing: {
    border: 'border-blue-400',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    glow: 'shadow-[0_0_12px_rgba(96,165,250,0.4)]',
    arrow: '↓',
  },
  target: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-300',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.4)]',
    arrow: '★',
  },
  bubbling: {
    border: 'border-green-400',
    bg: 'bg-green-500/15',
    text: 'text-green-300',
    glow: 'shadow-[0_0_12px_rgba(74,222,128,0.4)]',
    arrow: '↑',
  },
};

interface LiveDomNodeProps {
  node: VirtualDomNode;
  targetNodeId: string;
  activeNodeId: string | null;
  activePhase: EventPhase | null;
  highlightedListenerId: string | null;
  onNodeClick: (nodeId: string) => void;
  isSimulating: boolean;
  depth: number;
}

function LiveDomNode({
  node,
  targetNodeId,
  activeNodeId,
  activePhase,
  highlightedListenerId,
  onNodeClick,
  isSimulating,
  depth,
}: LiveDomNodeProps) {
  const isActive = node.id === activeNodeId;
  const isTarget = node.id === targetNodeId;
  const phase = isActive && activePhase ? phaseConfig[activePhase] : null;
  const hasActiveListener = node.listeners.some((l) => l.id === highlightedListenerId);
  const canClick = !isSimulating;
  const isLeaf = node.children.length === 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canClick) onNodeClick(node.id);
  };

  return (
    <motion.div
      layout
      animate={isActive ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`
        rounded-lg border-2 transition-all duration-200
        ${
          isActive && phase
            ? `${phase.border} ${phase.bg} ${phase.glow}`
            : isTarget
              ? 'border-yellow-500/40 bg-yellow-500/5'
              : 'border-gray-700/60 bg-gray-800/30'
        }
        ${isLeaf ? 'px-3 py-2' : 'p-2'}
        ${canClick ? 'cursor-pointer hover:border-gray-500 hover:bg-gray-700/30 active:scale-[0.99]' : ''}
      `}
    >
      {/* Node header */}
      <div className="flex items-center gap-1.5 mb-1">
        <AnimatePresence>
          {isActive && phase && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className={`text-sm font-bold ${phase.text}`}
            >
              {phase.arrow}
            </motion.span>
          )}
        </AnimatePresence>

        <span
          className={`text-xs font-mono font-bold ${isActive && phase ? phase.text : isTarget ? 'text-yellow-300' : 'text-gray-300'}`}
        >
          {node.tag === 'window' || node.tag === 'document' ? node.label : <>&lt;{node.tag}&gt;</>}
        </span>
        {node.tag !== 'window' && node.tag !== 'document' && (
          <span className="text-[10px] font-mono text-gray-500">{node.label}</span>
        )}

        {isTarget && (
          <span className="text-[10px] px-1 rounded bg-yellow-900/50 text-yellow-400 font-semibold">target</span>
        )}

        {node.listeners.length > 0 && (
          <span
            className={`text-[10px] px-1 rounded ${hasActiveListener ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-700/50 text-gray-400'}`}
          >
            {node.listeners.length} listener{node.listeners.length > 1 ? 's' : ''}
          </span>
        )}

        {node.hasDefaultBehavior && (
          <span className="text-[10px] px-1 rounded bg-orange-900/50 text-orange-400">{node.hasDefaultBehavior}</span>
        )}
      </div>

      {/* Active listener badge */}
      <AnimatePresence>
        {isActive && hasActiveListener && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-1"
          >
            {node.listeners
              .filter((l) => l.id === highlightedListenerId)
              .map((l) => (
                <div
                  key={l.id}
                  className="text-[10px] font-mono text-blue-300 bg-blue-900/30 rounded px-1.5 py-0.5 inline-block"
                >
                  {l.handler}() — {l.handlerBody}
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {node.children.map((child) => (
            <LiveDomNode
              key={child.id}
              node={child}
              targetNodeId={targetNodeId}
              activeNodeId={activeNodeId}
              activePhase={activePhase}
              highlightedListenerId={highlightedListenerId}
              onNodeClick={onNodeClick}
              isSimulating={isSimulating}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface LiveDomPreviewProps {
  root: VirtualDomNode;
  targetNodeId: string;
  activeNodeId: string | null;
  activePhase: EventPhase | null;
  highlightedListenerId: string | null;
  onNodeClick: (nodeId: string) => void;
  isSimulating: boolean;
}

export function LiveDomPreview({
  root,
  targetNodeId,
  activeNodeId,
  activePhase,
  highlightedListenerId,
  onNodeClick,
  isSimulating,
}: LiveDomPreviewProps) {
  return (
    <div className="p-3">
      {!isSimulating && (
        <p className="text-[10px] text-gray-500 mb-2">Click any element to trigger event propagation</p>
      )}
      <LiveDomNode
        node={root}
        targetNodeId={targetNodeId}
        activeNodeId={activeNodeId}
        activePhase={activePhase}
        highlightedListenerId={highlightedListenerId}
        onNodeClick={onNodeClick}
        isSimulating={isSimulating}
        depth={0}
      />
    </div>
  );
}
