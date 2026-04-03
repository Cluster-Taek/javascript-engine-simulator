'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { DiffOperationList } from '@/entities/diff-operation';
import { DomPreviewPanel } from '@/entities/dom-preview';
import { VNodeTreeView } from '@/entities/vdom-tree';
import { useReconciliationStore } from '@/shared/model';
import { Panel } from '@/shared/ui/panel';

function IdleGuide() {
  const t = useTranslations('reconciliationPanel');

  const steps = [
    { emoji: '🌳', titleKey: 'idleStep1Title' as const, descKey: 'idleStep1Desc' as const },
    { emoji: '🔄', titleKey: 'idleStep2Title' as const, descKey: 'idleStep2Desc' as const },
    { emoji: '🔍', titleKey: 'idleStep3Title' as const, descKey: 'idleStep3Desc' as const },
    { emoji: '✅', titleKey: 'idleStep4Title' as const, descKey: 'idleStep4Desc' as const },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <h2 className="text-lg font-bold text-gray-200">{t('idleTitle')}</h2>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <span className="text-2xl">{step.emoji}</span>
            <span className="text-xs font-semibold text-gray-200">{t(step.titleKey)}</span>
            <span className="text-[10px] text-gray-500 text-center">{t(step.descKey)}</span>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-gray-500">{t('idleStart')}</p>
    </div>
  );
}

export function ReconciliationVisualizationPanel() {
  const t = useTranslations('reconciliationPanel');
  const executionStatus = useReconciliationStore((s) => s.executionStatus);
  const oldTree = useReconciliationStore((s) => s.oldTree);
  const newTree = useReconciliationStore((s) => s.newTree);
  const focusedOldNodeId = useReconciliationStore((s) => s.focusedOldNodeId);
  const focusedNewNodeId = useReconciliationStore((s) => s.focusedNewNodeId);
  const diffOperations = useReconciliationStore((s) => s.diffOperations);
  const renderedDom = useReconciliationStore((s) => s.renderedDom);
  const currentStep = useReconciliationStore((s) => s.currentStep);

  const isIdle = executionStatus === 'idle';

  if (isIdle) {
    return <IdleGuide />;
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2">
      {/* Top: Old vs New VDom trees */}
      <div className="flex-1 flex gap-2 min-h-0">
        <Panel title={t('oldTree')} className="flex-1 overflow-auto">
          <VNodeTreeView tree={oldTree} focusedNodeId={focusedOldNodeId} diffOperations={[]} />
        </Panel>
        <Panel title={t('newTree')} className="flex-1 overflow-auto">
          <VNodeTreeView tree={newTree} focusedNodeId={focusedNewNodeId} diffOperations={diffOperations} />
        </Panel>
      </div>

      {/* Step description bar */}
      {currentStep && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded border border-gray-700">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
              currentStep.kind.startsWith('diff-')
                ? 'bg-purple-900 text-purple-300'
                : currentStep.kind.startsWith('commit-')
                  ? 'bg-orange-900 text-orange-300'
                  : 'bg-gray-700 text-gray-300'
            }`}
          >
            {currentStep.kind}
          </span>
          <span className="text-xs text-gray-300 truncate">{currentStep.description}</span>
        </div>
      )}

      {/* Bottom: Diff Operations + DOM Preview */}
      <div className="flex-1 flex gap-2 min-h-0">
        <Panel title={t('diffOperations')} className="flex-1 overflow-auto">
          <DiffOperationList operations={diffOperations} />
        </Panel>
        <Panel title={t('domPreview')} className="flex-1 overflow-auto">
          <DomPreviewPanel dom={renderedDom} />
        </Panel>
      </div>
    </div>
  );
}
