'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ValueTree } from '@/shared/ui/value-tree';
import { type ThisBindingEntry, RULE_COLORS } from '../lib/types';

interface ThisBindingRuleIndicatorProps {
  entry: ThisBindingEntry | null;
}

export function ThisBindingRuleIndicator({ entry }: ThisBindingRuleIndicatorProps) {
  const t = useTranslations('thisPanel');

  if (!entry) {
    return (
      <div className="px-4 py-3 bg-gray-800 rounded border border-gray-700 text-xs text-gray-500 font-mono">
        {t('noThisYet')}
      </div>
    );
  }

  const colors = RULE_COLORS[entry.rule];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={entry.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className={`flex items-start gap-3 px-4 py-3 rounded border ${colors.bg} ${colors.border}`}
      >
        {/* Rule badge */}
        <div
          className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${colors.border} ${colors.text}`}
        >
          {entry.rule === 'new' ? 'new' : entry.rule}
          <br />
          <span className="text-[9px] normal-case opacity-70">BINDING</span>
        </div>

        {/* Call info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-gray-200 truncate">{entry.callExpression}</p>

          {/* this value with ValueTree */}
          <div className="text-xs font-mono text-gray-400 mt-0.5 flex items-start gap-1">
            <span className="text-gray-500 shrink-0">{t('thisValueLabel')}</span>
            {entry.thisValueNode ? (
              <span className={colors.text}>
                <ValueTree node={entry.thisValueNode} maxDepth={1} />
              </span>
            ) : (
              <span className={colors.text}>{entry.thisValue}</span>
            )}
          </div>

          {/* Rule explanation */}
          <p className={`text-[10px] mt-1 ${colors.text} opacity-80`}>
            {t(entry.explanationKey, entry.explanationParams)}
          </p>

          {/* Arrow inherited scope info */}
          {entry.rule === 'arrow' && entry.inheritedFromScope && (
            <p className="text-[10px] text-amber-400/70 mt-0.5">
              {t('inheritedFrom', { scope: entry.inheritedFromScope })}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
