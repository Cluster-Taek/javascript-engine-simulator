'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { RiExpandDiagonalLine } from 'react-icons/ri';
import { type StackFrame } from '@/shared/lib/engine';

interface CallStackPanelProps {
  callStack: readonly StackFrame[];
  onFrameClick?: (frame: StackFrame) => void;
  selectedFrameId?: string | null;
}

export function CallStackPanel({ callStack, onFrameClick, selectedFrameId }: CallStackPanelProps) {
  const t = useTranslations('emptyStates');

  if (callStack.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('callStack')}</div>;
  }

  const reversed = [...callStack].reverse();

  return (
    <div className="p-2 flex flex-col gap-1">
      <AnimatePresence>
        {reversed.map((frame, idx) => {
          const isSelected = selectedFrameId === frame.id;
          return (
            <motion.div
              key={frame.id}
              layoutId={`frame-${frame.id}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={() => onFrameClick?.(frame)}
              className={`group px-3 py-2 rounded border text-xs font-mono transition-all ${
                onFrameClick ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'bg-blue-800 border-blue-400 text-blue-100 ring-2 ring-blue-400'
                  : idx === 0
                    ? 'bg-blue-900 border-blue-600 text-blue-200 hover:border-blue-400'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{frame.name}</div>
                  {frame.loc && (
                    <div className="text-gray-500 text-xs">
                      line {frame.loc.start.line}:{frame.loc.start.column}
                    </div>
                  )}
                </div>
                {onFrameClick && (
                  <RiExpandDiagonalLine className="shrink-0 text-gray-500 group-hover:text-gray-300 transition-colors" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
