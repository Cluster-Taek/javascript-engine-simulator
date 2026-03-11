'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type QueueEntry } from '@/shared/lib/engine';

interface TaskQueuePanelProps {
  queue: QueueEntry[];
}

export function TaskQueuePanel({ queue }: TaskQueuePanelProps) {
  const tEmpty = useTranslations('emptyStates');
  const t = useTranslations('taskQueueEntry');

  if (queue.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{tEmpty('taskQueue')}</div>;
  }

  return (
    <div className="p-2 flex flex-col gap-1">
      <AnimatePresence>
        {queue.map((entry, idx) => (
          <motion.div
            key={entry.id}
            layoutId={`async-item-${entry.id}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className={`px-3 py-2 rounded border text-xs font-mono ${
              idx === 0 ? 'bg-green-900 border-green-600 text-green-200' : 'bg-gray-800 border-gray-700 text-gray-300'
            }`}
          >
            <div className="font-semibold">{entry.label}</div>
            {entry.sourceWebApiId && (
              <div className="text-gray-500 text-xs">
                {t('from')} {entry.sourceWebApiId}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
