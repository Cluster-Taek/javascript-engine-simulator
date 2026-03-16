'use client';

import { LayoutGroup } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CallStackPanel } from '@/entities/call-stack';
import { ScopePanel } from '@/entities/environment';
import {
  ThisBindingRuleIndicator,
  ThisFlowPanel,
  deriveThisBindingEntry,
  resetEntryCounter,
  RULE_COLORS,
  type ThisBindingEntry,
  type ThisBindingRule,
} from '@/entities/this-binding';
import { type StackFrame } from '@/shared/lib/engine';
import { engineStore, useEngineStore } from '@/shared/model';
import { ExpandModal } from '@/shared/ui/expand-modal';
import { Panel } from '@/shared/ui/panel';
import { ResizeHandle } from '@/shared/ui/resize-handle';

function IdleGuide() {
  const t = useTranslations('thisPanel');

  const rules = [
    { key: 'new' as const, emoji: '🟣', labelKey: 'newBinding', descKey: 'idleNewDesc' },
    { key: 'implicit' as const, emoji: '🔵', labelKey: 'implicit', descKey: 'idleImplicitDesc' },
    { key: 'default' as const, emoji: '⚪', labelKey: 'default', descKey: 'idleDefaultDesc' },
    { key: 'arrow' as const, emoji: '🟡', labelKey: 'arrow', descKey: 'idleArrowDesc' },
    { key: 'lost' as const, emoji: '🔴', labelKey: 'lost', descKey: 'idleLostDesc' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-6">
      <div className="space-y-3 max-w-md">
        <h3 className="text-sm font-bold text-gray-200">{t('idleTitle')}</h3>
        <div className="space-y-4 text-left">
          {rules.map(({ key, emoji, labelKey, descKey }) => {
            const colors = RULE_COLORS[key];
            return (
              <div key={key} className="flex gap-3 items-start">
                <div
                  className={`w-8 h-8 shrink-0 rounded border-2 ${colors.border} ${colors.bg} flex items-center justify-center`}
                >
                  <span className="text-xs">{emoji}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-300 font-semibold">{t(labelKey)}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-4 text-[10px] flex-wrap justify-center">
        {rules.map(({ key, labelKey }) => {
          const colors = RULE_COLORS[key];
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-gray-500">{t(labelKey)}</span>
            </span>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-600 italic">{t('idleStart')}</p>
    </div>
  );
}

// Map rule to Tailwind classes for ScopePanel this highlight
const SCOPE_HIGHLIGHT_MAP: Record<ThisBindingRule, { bg: string; border: string }> = {
  new: { bg: 'bg-purple-900/30', border: 'border-purple-500' },
  implicit: { bg: 'bg-blue-900/30', border: 'border-blue-500' },
  default: { bg: 'bg-gray-700/50', border: 'border-gray-500' },
  arrow: { bg: 'bg-amber-900/30', border: 'border-amber-500' },
  lost: { bg: 'bg-red-900/30', border: 'border-red-500' },
};

export function ThisVisualizationPanel() {
  const t = useTranslations('panels');
  const tFrame = useTranslations('frameDetail');
  const [selectedFrame, setSelectedFrame] = useState<StackFrame | null>(null);
  const [scopeHeight, setScopeHeight] = useState(160);
  const isDraggingScope = useRef(false);
  const [flowEntries, setFlowEntries] = useState<ThisBindingEntry[]>([]);

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
  const executionStatus = useEngineStore((s) => s.executionStatus);
  const pause = useEngineStore((s) => s.pause);

  const isIdle = executionStatus === 'idle';

  // Track this binding flow via store subscription (avoids setState-in-effect)
  useEffect(() => {
    let prevStepId: string | null = null;

    const unsub = engineStore.subscribe((state, prevState) => {
      if (state.executionStatus === 'idle' && prevState.executionStatus !== 'idle') {
        setFlowEntries([]);
        resetEntryCounter();
        prevStepId = null;
        return;
      }

      const step = state.currentStep;
      if (!step || step.id === prevStepId) return;
      prevStepId = step.id;

      if (step.kind === 'enter-function') {
        const entry = deriveThisBindingEntry(step);
        if (entry) {
          setFlowEntries((prev) => [...prev, entry]);
        }
      }

      if (step.kind === 'exit-function') {
        setFlowEntries((prev) => {
          const lastActiveIdx = prev.findLastIndex((e) => e.active);
          if (lastActiveIdx === -1) return prev;
          const updated = [...prev];
          updated[lastActiveIdx] = { ...updated[lastActiveIdx], active: false };
          return updated;
        });
      }
    });

    return unsub;
  }, []);

  // Get current active entry for the hero indicator
  const currentEntry = flowEntries.findLast((e) => e.active) ?? null;

  // Compute thisHighlight for ScopePanel
  const thisHighlight = currentEntry ? SCOPE_HIGHLIGHT_MAP[currentEntry.rule] : null;

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

        {/* Rule Indicator (hero component) */}
        <div className="shrink-0">
          <ThisBindingRuleIndicator entry={currentEntry} />
        </div>

        {/* Main area: Call Stack (1/3) + This Flow Timeline (2/3) */}
        <div className="flex gap-2 flex-1 min-h-0">
          <div className="w-1/3 min-h-0">
            <Panel title={t('callStack')} className="h-full">
              <CallStackPanel
                callStack={callStack}
                onFrameClick={handleFrameClick}
                selectedFrameId={selectedFrame?.id}
              />
            </Panel>
          </div>
          <div className="w-2/3 min-h-0">
            <Panel title="this Flow" className="h-full">
              <ThisFlowPanel entries={flowEntries} />
            </Panel>
          </div>
        </div>

        <ResizeHandle onMouseDown={onScopeResizeStart} />

        {/* Scope with this highlight */}
        <div style={{ height: scopeHeight }} className="shrink-0">
          <Panel title={t('scope')} className="h-full">
            <ScopePanel environments={environments} thisHighlight={thisHighlight} />
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
