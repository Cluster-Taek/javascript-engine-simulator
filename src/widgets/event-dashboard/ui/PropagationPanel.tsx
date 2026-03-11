'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { EventListenerList } from '@/entities/event-listener-list';
import { PropagationPathView } from '@/entities/propagation-path';
import { type VirtualDomNode, type VirtualEventListener } from '@/shared/lib/event-engine';
import { useEventStore } from '@/shared/model';
import { Panel } from '@/shared/ui/panel';

function collectAllListeners(node: VirtualDomNode): (VirtualEventListener & { nodeLabel: string })[] {
  const result: (VirtualEventListener & { nodeLabel: string })[] = [];
  for (const l of node.listeners) {
    result.push({ ...l, nodeLabel: node.label });
  }
  for (const child of node.children) {
    result.push(...collectAllListeners(child));
  }
  return result;
}

export function PropagationPanel() {
  const t = useTranslations('eventDashboard');
  const scenario = useEventStore((s) => s.currentScenario);
  const currentStep = useEventStore((s) => s.currentStep);
  const activePhase = useEventStore((s) => s.activePhase);
  const consoleOutput = useEventStore((s) => s.consoleOutput);
  const highlightedListenerId = useEventStore((s) => s.highlightedListenerId);

  const allListeners = scenario ? collectAllListeners(scenario.tree.root) : [];

  return (
    <div className="flex flex-col h-full gap-2 p-2">
      {/* Propagation Path + Event Listeners — 2 columns */}
      <div className="flex-1 flex gap-2 min-h-0">
        <Panel title={t('propagationPath')} className="flex-1 overflow-auto">
          <div className="p-3">
            {scenario ? (
              <PropagationPathView
                currentStep={currentStep}
                activePhase={activePhase}
                root={scenario.tree.root}
                targetNodeId={scenario.targetNodeId}
              />
            ) : (
              <p className="text-xs text-gray-500">{t('selectScenarioHint')}</p>
            )}
          </div>
        </Panel>

        <Panel title={t('listeners')} className="flex-1 overflow-auto">
          <EventListenerList listeners={allListeners} highlightedListenerId={highlightedListenerId} />
        </Panel>
      </div>

      {/* Console */}
      <Panel title={t('console')} className="flex-[0.4]">
        <div className="p-2 space-y-0.5 font-mono text-xs overflow-auto">
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
                    line.includes('[capture]')
                      ? 'text-blue-300'
                      : line.includes('[target]')
                        ? 'text-yellow-300'
                        : line.includes('[bubble]')
                          ? 'text-green-300'
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
  );
}
