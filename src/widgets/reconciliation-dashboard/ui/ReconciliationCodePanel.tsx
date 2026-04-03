'use client';

import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { StateInspectorPanel } from '@/entities/component-state';
import { ReconciliationDebugControls } from '@/features/reconciliation-controls';
import { useReconciliationStore } from '@/shared/model';
import { Panel } from '@/shared/ui/panel';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function ReconciliationCodePanel() {
  const t = useTranslations('reconciliationPanel');
  const scenario = useReconciliationStore((s) => s.currentScenario);
  const componentState = useReconciliationStore((s) => s.componentState);
  const executionStatus = useReconciliationStore((s) => s.executionStatus);
  const triggerStateChange = useReconciliationStore((s) => s.triggerStateChange);
  const consoleOutput = useReconciliationStore((s) => s.consoleOutput);

  const isDisabled = executionStatus === 'running' || executionStatus === 'paused';

  const handleTransition = useCallback(
    (index: number) => {
      triggerStateChange(index);
    },
    [triggerStateChange]
  );

  return (
    <div className="flex flex-col h-full gap-1 p-2">
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-auto">
        {/* Code Editor (read-only) */}
        <Panel title={t('codeEditor')} className="flex-1">
          {scenario ? (
            <MonacoEditor
              height="100%"
              language="typescript"
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

        {/* State Inspector */}
        <Panel title={t('stateInspector')} className="shrink-0">
          <div className="p-2">
            {scenario ? (
              <StateInspectorPanel
                componentState={componentState}
                transitions={scenario.stateTransitions}
                onTransition={handleTransition}
                disabled={isDisabled}
              />
            ) : (
              <p className="text-xs text-gray-500">{t('selectScenarioHint')}</p>
            )}
          </div>
        </Panel>

        {/* Console */}
        <Panel title={t('console')} className="flex-[0.3] shrink-0">
          <div className="p-2 space-y-0.5 font-mono text-xs overflow-auto max-h-32">
            <AnimatePresence initial={false}>
              {consoleOutput.length === 0 ? (
                <p className="text-gray-500">{t('consoleEmpty')}</p>
              ) : (
                consoleOutput.map((line, i) => (
                  <motion.div
                    key={`${i}-${line}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`py-0.5 ${
                      line.includes('Insert') || line.includes('added')
                        ? 'text-green-300'
                        : line.includes('Remove') || line.includes('removed')
                          ? 'text-red-300'
                          : line.includes('Update') || line.includes('changed')
                            ? 'text-blue-300'
                            : 'text-gray-300'
                    }`}
                  >
                    {line}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      {/* Controls at bottom */}
      <ReconciliationDebugControls />
    </div>
  );
}
