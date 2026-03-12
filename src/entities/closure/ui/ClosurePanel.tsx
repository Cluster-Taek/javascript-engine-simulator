'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type ClosureSnapshot, type ValueNode } from '@/shared/lib/engine';

interface ValueTreeProps {
  node: ValueNode;
}

function ValueTree({ node }: ValueTreeProps) {
  if (node.kind === 'primitive') {
    return <span className="text-green-300">{node.display}</span>;
  }
  if (node.kind === 'function') {
    return <span className="text-purple-300 italic">{node.display}</span>;
  }
  return <span className="text-cyan-300">{node.display}</span>;
}

interface ClosureCardProps {
  closure: ClosureSnapshot;
}

function ClosureCard({ closure }: ClosureCardProps) {
  const t = useTranslations('closurePanel');
  const isFreed = closure.status === 'freed';

  return (
    <motion.div
      layout
      layoutId={`closure-${closure.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isFreed ? 0.5 : 1,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`rounded border text-xs font-mono ${
        isFreed ? 'border-gray-700 bg-gray-900' : 'border-emerald-800 bg-gray-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="text-purple-400">f</span>
          <span className={`font-semibold ${isFreed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
            {closure.functionName}
          </span>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            isFreed ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'
          }`}
        >
          {isFreed ? t('freed') : t('alive')}
        </span>
      </div>

      {/* Captured scope label */}
      <div className="px-2 py-1 text-gray-500 text-[10px]">
        {t('capturedFrom')}: <span className="text-gray-400">{closure.capturedEnvLabel}</span>
      </div>

      {/* Captured variables */}
      {!isFreed && closure.capturedVariables.length > 0 && (
        <div className="px-2 pb-1.5">
          {closure.capturedVariables.map((binding) => (
            <div key={binding.name} className="flex items-center gap-1.5 py-0.5">
              <span
                className={`w-8 shrink-0 ${
                  binding.kind === 'const'
                    ? 'text-teal-400'
                    : binding.kind === 'let'
                      ? 'text-yellow-400'
                      : 'text-orange-400'
                }`}
              >
                {binding.kind}
              </span>
              <span className="text-gray-200">{binding.name}</span>
              <span className="text-gray-500">=</span>
              {binding.initialized ? (
                <ValueTree node={binding.valueNode} />
              ) : (
                <span className="text-red-400 italic">&lt;uninitialized&gt;</span>
              )}
            </div>
          ))}
        </div>
      )}

      {isFreed && <div className="px-2 pb-1.5 text-gray-600 italic text-[10px]">{t('memoryFreed')}</div>}
    </motion.div>
  );
}

interface ClosurePanelProps {
  closures: readonly ClosureSnapshot[];
}

export function ClosurePanel({ closures }: ClosurePanelProps) {
  const t = useTranslations('emptyStates');

  if (closures.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('closures')}</div>;
  }

  return (
    <div className="p-2 flex flex-col gap-1.5">
      <AnimatePresence mode="popLayout">
        {closures.map((closure) => (
          <ClosureCard key={closure.id} closure={closure} />
        ))}
      </AnimatePresence>
    </div>
  );
}
