'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type WebApiEntry } from '@/shared/lib/engine';

interface WebApiPanelProps {
  webApis: WebApiEntry[];
}

export function WebApiPanel({ webApis }: WebApiPanelProps) {
  const tEmpty = useTranslations('emptyStates');
  const t = useTranslations('webApi');

  if (webApis.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{tEmpty('webApi')}</div>;
  }

  return (
    <div className="p-2 flex flex-col gap-2">
      <AnimatePresence>
        {webApis.map((entry) => {
          const progress = entry.delay > 0 ? ((entry.delay - entry.remainingTicks * 100) / entry.delay) * 100 : 100;
          const clampedProgress = Math.min(100, Math.max(0, progress));
          return (
            <motion.div
              key={entry.id}
              layoutId={`async-item-${entry.id}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="px-3 py-2 rounded border bg-amber-950 border-amber-700 text-amber-200"
            >
              <div className="text-xs font-mono font-semibold">{entry.label}</div>
              <div className="text-xs text-amber-400 mb-1">
                {t('callback')} {entry.callbackLabel}
              </div>
              <div className="w-full bg-amber-900 rounded-full h-1.5">
                <motion.div
                  className="bg-amber-400 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${clampedProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-xs text-amber-500 mt-1">{t('ticksRemaining', { count: entry.remainingTicks })}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
