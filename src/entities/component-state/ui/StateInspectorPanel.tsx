'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type StateTransition } from '@/shared/lib/reconciler';

interface StateInspectorPanelProps {
  componentState: Record<string, unknown>;
  transitions: StateTransition[];
  onTransition: (index: number) => void;
  disabled: boolean;
}

export function StateInspectorPanel({ componentState, transitions, onTransition, disabled }: StateInspectorPanelProps) {
  const t = useTranslations('reconciliationPanel');
  const entries = Object.entries(componentState);

  return (
    <div className="flex flex-col gap-2">
      {/* Current state */}
      <div className="space-y-1">
        <div className="text-[10px] text-gray-500 uppercase font-semibold">{t('currentState')}</div>
        <AnimatePresence initial={false}>
          {entries.map(([key, value]) => (
            <motion.div
              key={key}
              layout
              className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded font-mono text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-teal-400">{key}</span>
              <span className="text-gray-600">=</span>
              <motion.span
                key={`${key}-${JSON.stringify(value)}`}
                className="text-amber-300 truncate"
                initial={{ backgroundColor: 'rgba(234, 179, 8, 0.3)' }}
                animate={{ backgroundColor: 'rgba(234, 179, 8, 0)' }}
                transition={{ duration: 1 }}
              >
                {JSON.stringify(value)}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Transition buttons */}
      {transitions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-gray-500 uppercase font-semibold">{t('stateTransitions')}</div>
          <div className="flex flex-wrap gap-1">
            {transitions.map((tr, i) => (
              <button
                key={tr.labelKey}
                onClick={() => onTransition(i)}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-indigo-800 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-indigo-200 rounded transition-colors"
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
