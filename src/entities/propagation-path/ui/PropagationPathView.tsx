'use client';

import { motion, AnimatePresence } from 'motion/react';
import { type EventPhase, type PropagationStep, type VirtualDomNode } from '@/shared/lib/event-engine';

const phaseConfig: Record<
  EventPhase,
  { border: string; bg: string; text: string; dot: string; glow: string; arrow: string }
> = {
  capturing: {
    border: 'border-blue-400',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
    glow: 'shadow-[0_0_12px_rgba(96,165,250,0.4)]',
    arrow: '↓',
  },
  target: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-300',
    dot: 'bg-yellow-400',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.4)]',
    arrow: '★',
  },
  bubbling: {
    border: 'border-green-400',
    bg: 'bg-green-500/15',
    text: 'text-green-300',
    dot: 'bg-green-400',
    glow: 'shadow-[0_0_12px_rgba(74,222,128,0.4)]',
    arrow: '↑',
  },
};

function findPathToNode(root: VirtualDomNode, targetId: string): VirtualDomNode[] | null {
  if (root.id === targetId) return [root];
  for (const child of root.children) {
    const path = findPathToNode(child, targetId);
    if (path) return [root, ...path];
  }
  return null;
}

interface PropagationPathViewProps {
  currentStep: PropagationStep | null;
  activePhase: EventPhase | null;
  root: VirtualDomNode;
  targetNodeId: string;
}

export function PropagationPathView({ currentStep, activePhase, root, targetNodeId }: PropagationPathViewProps) {
  const path = findPathToNode(root, targetNodeId) ?? [];
  const phase = activePhase ?? 'capturing';
  const style = phaseConfig[phase];

  return (
    <div className="space-y-3">
      {/* Phase indicator */}
      <div className="flex items-center gap-2 text-xs">
        {(['capturing', 'target', 'bubbling'] as const).map((p) => {
          const s = phaseConfig[p];
          const isActive = phase === p;
          return (
            <div
              key={p}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${
                isActive ? `${s.bg} ${s.text} ${s.border} font-semibold` : 'border-gray-700 text-gray-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? s.dot : 'bg-gray-600'}`} />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </div>
          );
        })}
      </div>

      {/* DOM path as nested boxes */}
      <div className="space-y-0">
        <PathNode
          path={path}
          index={0}
          targetNodeId={targetNodeId}
          currentStep={currentStep}
          activePhase={activePhase}
        />
      </div>

      {/* Current step description */}
      {currentStep && (
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs p-2 rounded border ${style.bg} ${style.text} ${style.border} font-mono`}
        >
          {currentStep.description}
          {currentStep.propagationStopped && <span className="ml-2 text-red-400">[propagation stopped]</span>}
          {currentStep.defaultPrevented && <span className="ml-2 text-orange-400">[default prevented]</span>}
        </motion.div>
      )}
    </div>
  );
}

interface PathNodeProps {
  path: VirtualDomNode[];
  index: number;
  targetNodeId: string;
  currentStep: PropagationStep | null;
  activePhase: EventPhase | null;
}

function PathNode({ path, index, targetNodeId, currentStep, activePhase }: PathNodeProps) {
  if (index >= path.length) return null;

  const node = path[index];
  const isActive = currentStep?.nodeId === node.id;
  const isTarget = node.id === targetNodeId;
  const isLast = index === path.length - 1;
  const phase = isActive && activePhase ? phaseConfig[activePhase] : null;
  const hasActiveListener = isActive && currentStep?.listenerId;

  return (
    <motion.div
      layout
      animate={isActive ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-lg border-2 p-2 transition-all duration-200
        ${
          isActive && phase
            ? `${phase.border} ${phase.bg} ${phase.glow}`
            : isTarget
              ? 'border-yellow-500/40 bg-yellow-500/5'
              : 'border-gray-700/60 bg-gray-800/30'
        }
      `}
    >
      {/* Node header */}
      <div className="flex items-center gap-1.5">
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
          &lt;{node.tag}&gt;
        </span>
        <span className="text-[10px] font-mono text-gray-500">{node.label}</span>

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
      </div>

      {/* Active listener badge */}
      <AnimatePresence>
        {isActive && hasActiveListener && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1"
          >
            {node.listeners
              .filter((l) => l.id === currentStep?.listenerId)
              .map((l) => (
                <span
                  key={l.id}
                  className="text-[10px] font-mono text-blue-300 bg-blue-900/30 rounded px-1.5 py-0.5 inline-block"
                >
                  {l.handler}() — {l.handlerBody}
                </span>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested child (next node in path) */}
      {!isLast && (
        <div className="mt-1.5">
          <PathNode
            path={path}
            index={index + 1}
            targetNodeId={targetNodeId}
            currentStep={currentStep}
            activePhase={activePhase}
          />
        </div>
      )}
    </motion.div>
  );
}
