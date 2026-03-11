'use client';

import { type EventPhase, type VirtualDomNode } from '@/shared/lib/event-engine';
import { DomNodeView } from './DomNodeView';

interface DomTreeViewProps {
  node: VirtualDomNode;
  targetNodeId: string;
  activeNodeId: string | null;
  activePhase: EventPhase | null;
  highlightedListenerId: string | null;
  depth?: number;
}

export function DomTreeView({
  node,
  targetNodeId,
  activeNodeId,
  activePhase,
  highlightedListenerId,
  depth = 0,
}: DomTreeViewProps) {
  return (
    <div className={depth > 0 ? 'ml-4 border-l border-gray-700/50 pl-2' : ''}>
      <DomNodeView
        node={node}
        isActive={node.id === activeNodeId}
        isTarget={node.id === targetNodeId}
        activePhase={activePhase}
        highlightedListenerId={highlightedListenerId}
        depth={depth}
      />
      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <DomTreeView
              key={child.id}
              node={child}
              targetNodeId={targetNodeId}
              activeNodeId={activeNodeId}
              activePhase={activePhase}
              highlightedListenerId={highlightedListenerId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
