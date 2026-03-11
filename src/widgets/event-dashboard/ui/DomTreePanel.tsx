'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { LiveDomPreview } from '@/entities/dom-node';
import { EventDebugControls } from '@/features/event-controls';
import { useEventStore } from '@/shared/model';
import { Panel } from '@/shared/ui/panel';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function DomTreePanel() {
  const t = useTranslations('eventDashboard');
  const scenario = useEventStore((s) => s.currentScenario);
  const activeNodeId = useEventStore((s) => s.activeNodeId);
  const activePhase = useEventStore((s) => s.activePhase);
  const highlightedListenerId = useEventStore((s) => s.highlightedListenerId);
  const executionStatus = useEventStore((s) => s.executionStatus);
  const triggerEvent = useEventStore((s) => s.triggerEvent);

  const isSimulating = executionStatus === 'running' || (executionStatus === 'paused' && activeNodeId !== null);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      triggerEvent(nodeId);
    },
    [triggerEvent]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-auto">
        {/* Live DOM Preview */}
        <Panel title={t('htmlStructure')} className="flex-1">
          {scenario ? (
            <div className="overflow-auto h-full">
              <LiveDomPreview
                root={scenario.tree.root}
                targetNodeId={scenario.targetNodeId}
                activeNodeId={activeNodeId}
                activePhase={activePhase}
                highlightedListenerId={highlightedListenerId}
                onNodeClick={handleNodeClick}
                isSimulating={executionStatus !== 'idle' && executionStatus !== 'completed'}
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500 p-3">{t('selectScenarioHint')}</p>
          )}
        </Panel>

        {/* JavaScript Code */}
        <Panel title={t('codeSnippet')} className="flex-1">
          {scenario ? (
            <MonacoEditor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={scenario.code}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                glyphMargin: false,
                folding: false,
                renderLineHighlight: 'none',
                domReadOnly: true,
              }}
            />
          ) : (
            <p className="text-xs text-gray-500 p-3">{t('selectScenarioHint')}</p>
          )}
        </Panel>
      </div>

      {/* Controls at bottom */}
      <EventDebugControls />
    </div>
  );
}
