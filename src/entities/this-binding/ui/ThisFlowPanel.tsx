'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ValueTree } from '@/shared/ui/value-tree';
import { type ThisBindingEntry, RULE_COLORS } from '../lib/types';

interface ThisFlowPanelProps {
  entries: readonly ThisBindingEntry[];
}

export function ThisFlowPanel({ entries }: ThisFlowPanelProps) {
  const t = useTranslations('thisPanel');

  if (entries.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('noThisYet')}</div>;
  }

  // Show newest at top (reversed)
  const reversed = [...entries].reverse();

  return (
    <div className="p-2 overflow-auto h-full">
      <AnimatePresence mode="popLayout">
        {reversed.map((entry, idx) => {
          const colors = RULE_COLORS[entry.rule];
          const isLast = idx === reversed.length - 1;

          return (
            <motion.div
              key={entry.id}
              layoutId={`this-flow-${entry.id}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: entry.active ? 1 : 0.45, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 min-h-[40px]"
            >
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center shrink-0 w-5">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${colors.dot} ${entry.active ? '' : 'opacity-50'}`}
                />
                {!isLast && (
                  <div
                    className={`w-px flex-1 ${entry.active ? 'bg-gray-600' : 'bg-gray-700'} ${
                      !entry.active ? 'border-dashed' : ''
                    }`}
                  />
                )}
              </div>

              {/* Entry content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-mono truncate ${entry.active ? 'text-gray-200' : 'text-gray-500'}`}>
                    {entry.callExpression}
                  </span>
                  {entry.line && (
                    <span className="text-[10px] text-gray-600 shrink-0">{t('line', { line: entry.line })}</span>
                  )}
                </div>

                {/* this value with ValueTree (compact) */}
                <div className="flex items-start gap-1 mt-0.5 text-[10px]">
                  <span className="text-gray-500 shrink-0">this =</span>
                  {entry.thisValueNode ? (
                    <span className={colors.text}>
                      <ValueTree node={entry.thisValueNode} maxDepth={0} />
                    </span>
                  ) : (
                    <span className={colors.text}>{entry.thisValue}</span>
                  )}
                </div>

                {/* Rule explanation */}
                <p className={`text-[10px] ${colors.text} opacity-70 mt-0.5`}>
                  {t(entry.explanationKey, entry.explanationParams)}
                </p>

                {/* Arrow inherited scope */}
                {entry.rule === 'arrow' && entry.inheritedFromScope && (
                  <p className="text-[9px] text-amber-400/60">
                    {t('inheritedFrom', { scope: entry.inheritedFromScope })}
                  </p>
                )}

                {!entry.active && <span className="text-[9px] text-gray-600 italic">{t('returned')}</span>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
