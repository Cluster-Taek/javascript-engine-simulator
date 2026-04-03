'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type DiffOperation } from '@/shared/lib/reconciler';
import { DiffOperationBadge } from './DiffOperationBadge';

interface DiffOperationListProps {
  operations: DiffOperation[];
}

export function DiffOperationList({ operations }: DiffOperationListProps) {
  const t = useTranslations('reconciliationPanel');

  if (operations.length === 0) {
    return <div className="p-3 text-xs text-gray-500">{t('noDiffOps')}</div>;
  }

  return (
    <div className="p-2 space-y-1 overflow-auto">
      <AnimatePresence initial={false}>
        {operations.map((op, i) => (
          <motion.div
            key={`${op.type}-${op.nodeId}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <DiffOperationBadge operation={op} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
