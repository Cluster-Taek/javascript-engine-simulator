'use client';

import { LayoutGroup } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { CallStackPanel } from '@/entities/call-stack';
import { ClosurePanel } from '@/entities/closure';
import { ScopePanel } from '@/entities/environment';
import { HeapMemoryPanel } from '@/entities/heap-memory';
import { type StackFrame } from '@/shared/lib/engine';
import { useEngineStore } from '@/shared/model';
import { ExpandModal } from '@/shared/ui/expand-modal';
import { Panel } from '@/shared/ui/panel';

function IdleGuide() {
  const t = useTranslations('closureHelp');

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-6">
      <div className="space-y-3 max-w-md">
        <h3 className="text-sm font-bold text-gray-200">{t('concepts.heading')}</h3>
        <div className="space-y-4 text-left">
          {/* Lexical Environment */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 shrink-0 rounded border-2 border-green-500/60 bg-green-950/30 flex items-center justify-center">
              <span className="text-[10px] text-green-400 font-mono">env</span>
            </div>
            <div>
              <p className="text-xs text-gray-300 font-semibold">Lexical Environment</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{t('concepts.lexicalEnv')}</p>
            </div>
          </div>
          {/* Outer Reference */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 shrink-0 rounded border-2 border-amber-500/60 bg-amber-950/30 flex items-center justify-center">
              <span className="text-[10px] text-amber-400 font-mono">→</span>
            </div>
            <div>
              <p className="text-xs text-gray-300 font-semibold">[[Outer]] Reference</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{t('concepts.outerRef')}</p>
            </div>
          </div>
          {/* Memory Lifecycle */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 shrink-0 rounded border-2 border-gray-600 border-dashed bg-gray-900/30 flex items-center justify-center">
              <span className="text-[10px] text-gray-500 font-mono">GC</span>
            </div>
            <div>
              <p className="text-xs text-gray-300 font-semibold">Memory Lifecycle</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{t('concepts.lifecycle')}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex gap-4 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-500">On Stack</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-gray-500">Retained</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-gray-500">GC&apos;d</span>
        </span>
      </div>
      <p className="text-[11px] text-gray-600 italic">Press ▶ Run or Step to begin</p>
    </div>
  );
}

export function ClosureVisualizationPanel() {
  const t = useTranslations('panels');
  const tHeap = useTranslations('heapPanel');
  const tFrame = useTranslations('frameDetail');
  const [selectedFrame, setSelectedFrame] = useState<StackFrame | null>(null);
  const [scopeHeight, setScopeHeight] = useState(160);
  const isDraggingScope = useRef(false);

  const onScopeResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingScope.current = true;
      const startY = e.clientY;
      const startHeight = scopeHeight;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDraggingScope.current) return;
        const delta = startY - ev.clientY;
        setScopeHeight(Math.min(600, Math.max(80, startHeight + delta)));
      };

      const onMouseUp = () => {
        isDraggingScope.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [scopeHeight]
  );

  const currentStep = useEngineStore((s) => s.currentStep);
  const callStack = useEngineStore((s) => s.callStack);
  const environments = useEngineStore((s) => s.environments);
  const closures = useEngineStore((s) => s.closures);
  const heapSnapshot = useEngineStore((s) => s.heapSnapshot);
  const executionStatus = useEngineStore((s) => s.executionStatus);
  const pause = useEngineStore((s) => s.pause);

  const isIdle = executionStatus === 'idle';

  function handleFrameClick(frame: StackFrame) {
    if (executionStatus === 'running') pause();
    setSelectedFrame((prev) => (prev?.id === frame.id ? null : frame));
  }

  if (isIdle) {
    return <IdleGuide />;
  }

  return (
    <LayoutGroup>
      <div className="flex flex-col h-full gap-2 p-2">
        {/* Current Step Info */}
        {currentStep && (
          <div className="px-3 py-2 bg-gray-800 rounded text-xs font-mono border border-gray-700 shrink-0">
            <span className="text-blue-400">[{currentStep.kind}]</span>{' '}
            <span className="text-gray-300">{currentStep.description}</span>
          </div>
        )}

        {/* Main area: Call Stack + Heap Memory */}
        <div className="flex gap-2 flex-1 min-h-0">
          <div className="w-1/3 min-h-0 flex flex-col gap-2">
            <Panel title={t('callStack')} className="flex-1">
              <CallStackPanel
                callStack={callStack}
                onFrameClick={handleFrameClick}
                selectedFrameId={selectedFrame?.id}
              />
            </Panel>
            {/* Closures below call stack */}
            {closures.length > 0 && (
              <Panel title={t('closures')} className="max-h-48 shrink-0">
                <ClosurePanel closures={closures} />
              </Panel>
            )}
          </div>
          <div className="w-2/3 min-h-0">
            <Panel title={tHeap('title')} className="h-full">
              <HeapMemoryPanel heapSnapshot={heapSnapshot} />
            </Panel>
          </div>
        </div>

        {/* Scope resize handle */}
        <div
          className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize shrink-0 rounded transition-colors"
          onMouseDown={onScopeResizeStart}
        />

        {/* Scope */}
        <div style={{ height: scopeHeight }} className="shrink-0">
          <Panel title={t('scope')} className="h-full">
            <ScopePanel environments={environments} />
          </Panel>
        </div>
      </div>

      {/* Frame Detail Modal */}
      <ExpandModal
        title={selectedFrame ? `${tFrame('frameLabel')} ${selectedFrame.name}` : ''}
        open={selectedFrame !== null}
        onClose={() => setSelectedFrame(null)}
      >
        {selectedFrame && (
          <div className="p-4 text-xs font-mono text-gray-300">
            <p>{selectedFrame.name}</p>
            {selectedFrame.loc && (
              <p className="text-gray-500">{tFrame('line', { line: selectedFrame.loc.start.line })}</p>
            )}
          </div>
        )}
      </ExpandModal>
    </LayoutGroup>
  );
}
