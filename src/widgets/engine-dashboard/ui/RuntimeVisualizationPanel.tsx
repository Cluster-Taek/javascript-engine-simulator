'use client';

import { LayoutGroup } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { CallStackPanel } from '@/entities/call-stack';
import { ScopePanel } from '@/entities/environment';
import { EventLoopIndicator } from '@/entities/event-loop';
import { MicrotaskQueuePanel } from '@/entities/microtask-queue';
import { TaskQueuePanel } from '@/entities/task-queue';
import { WebApiPanel } from '@/entities/web-api';
import { type StackFrame } from '@/shared/lib/engine';
import { useEngineStore } from '@/shared/model';
import { ExpandModal } from '@/shared/ui/expand-modal';
import { Panel } from '@/shared/ui/panel';
import { FrameDetailPanel } from './FrameDetailPanel';

export function RuntimeVisualizationPanel() {
  const t = useTranslations('panels');
  const tFrame = useTranslations('frameDetail');
  const [selectedFrame, setSelectedFrame] = useState<StackFrame | null>(null);
  const [scopeHeight, setScopeHeight] = useState(192); // 12rem = h-48
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
  const ast = useEngineStore((s) => s.ast);
  const webApis = useEngineStore((s) => s.webApis);
  const taskQueue = useEngineStore((s) => s.taskQueue);
  const microtaskQueue = useEngineStore((s) => s.microtaskQueue);
  const eventLoopPhase = useEngineStore((s) => s.eventLoopPhase);
  const executionStatus = useEngineStore((s) => s.executionStatus);
  const pause = useEngineStore((s) => s.pause);

  function handleFrameClick(frame: StackFrame) {
    if (executionStatus === 'running') pause();
    setSelectedFrame((prev) => (prev?.id === frame.id ? null : frame));
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

        {/* Top row: Call Stack + Web APIs */}
        <div className="flex gap-2 flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <Panel title={t('callStack')} className="h-full">
              <CallStackPanel
                callStack={callStack}
                onFrameClick={handleFrameClick}
                selectedFrameId={selectedFrame?.id}
              />
            </Panel>
          </div>
          <div className="flex-1 min-h-0">
            <Panel title={t('webApis')} className="h-full">
              <WebApiPanel webApis={webApis} />
            </Panel>
          </div>
        </div>

        {/* Event Loop Indicator */}
        <div className="shrink-0 bg-gray-800 rounded border border-gray-700">
          <EventLoopIndicator phase={eventLoopPhase} />
        </div>

        {/* Bottom row: Task Queue + Microtask Queue */}
        <div className="flex gap-2 flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <Panel title={t('taskQueue')} className="h-full">
              <TaskQueuePanel queue={taskQueue} />
            </Panel>
          </div>
          <div className="flex-1 min-h-0">
            <Panel title={t('microtaskQueue')} className="h-full">
              <MicrotaskQueuePanel queue={microtaskQueue} />
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
        {selectedFrame && <FrameDetailPanel frame={selectedFrame} ast={ast} />}
      </ExpandModal>
    </LayoutGroup>
  );
}
