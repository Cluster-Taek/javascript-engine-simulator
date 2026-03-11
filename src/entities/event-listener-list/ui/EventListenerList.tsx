'use client';

import { type VirtualEventListener } from '@/shared/lib/event-engine';

interface EventListenerListProps {
  listeners: VirtualEventListener[];
  highlightedListenerId: string | null;
}

export function EventListenerList({ listeners, highlightedListenerId }: EventListenerListProps) {
  if (listeners.length === 0) {
    return <p className="text-xs text-gray-500 p-2">No event listeners registered.</p>;
  }

  return (
    <div className="space-y-1 p-2">
      {listeners.map((l) => {
        const isActive = l.id === highlightedListenerId;
        return (
          <div
            key={l.id}
            className={`
              flex items-start gap-2 text-xs p-1.5 rounded border transition-colors
              ${isActive ? 'border-blue-500/50 bg-blue-900/20' : 'border-gray-700/50 bg-gray-800/30'}
            `}
          >
            <span className="text-gray-400 shrink-0">{l.useCapture ? '↓' : '↑'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-mono font-semibold ${isActive ? 'text-blue-300' : 'text-gray-200'}`}>
                  {l.handler}()
                </span>
                <span
                  className={`px-1 rounded text-[10px] ${l.useCapture ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'}`}
                >
                  {l.useCapture ? 'capture' : 'bubble'}
                </span>
                <span className="px-1 rounded text-[10px] bg-gray-700 text-gray-400">{l.type}</span>
                {l.stopsPropagation && (
                  <span className="px-1 rounded text-[10px] bg-red-900/50 text-red-400">stopPropagation</span>
                )}
                {l.stopsImmediatePropagation && (
                  <span className="px-1 rounded text-[10px] bg-red-900/50 text-red-400">stopImmediate</span>
                )}
                {l.preventsDefault && (
                  <span className="px-1 rounded text-[10px] bg-orange-900/50 text-orange-400">preventDefault</span>
                )}
              </div>
              <p className="text-gray-500 font-mono mt-0.5 truncate">{l.handlerBody}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
