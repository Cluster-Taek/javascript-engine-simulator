'use client';

import { motion, type TargetAndTransition } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type EventLoopPhase } from '@/shared/lib/engine';

interface EventLoopIndicatorProps {
  phase: EventLoopPhase;
}

const PHASE_STYLE: Record<EventLoopPhase, { color: string; borderColor: string; animate: TargetAndTransition }> = {
  idle: {
    color: 'text-gray-400',
    borderColor: 'border-gray-600',
    animate: {},
  },
  'checking-stack': {
    color: 'text-blue-400',
    borderColor: 'border-blue-500',
    animate: { scale: [1, 1.05, 1] },
  },
  'draining-microtasks': {
    color: 'text-purple-400',
    borderColor: 'border-purple-500',
    animate: { rotate: [0, 360] },
  },
  'picking-task': {
    color: 'text-green-400',
    borderColor: 'border-green-500',
    animate: { scale: [1, 1.1, 1] },
  },
};

export function EventLoopIndicator({ phase }: EventLoopIndicatorProps) {
  const t = useTranslations('eventLoop');
  const style = PHASE_STYLE[phase];

  const phaseLabel: Record<EventLoopPhase, string> = {
    idle: t('phases.idle'),
    'checking-stack': t('phases.checkingStack'),
    'draining-microtasks': t('phases.drainingMicrotasks'),
    'picking-task': t('phases.pickingTask'),
  };

  return (
    <div className="flex items-center justify-center gap-3 px-3 py-2">
      <motion.div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${style.borderColor}`}
        animate={style.animate}
        transition={
          phase === 'draining-microtasks'
            ? { duration: 1, repeat: Infinity, ease: 'linear' }
            : { duration: 0.5, repeat: phase !== 'idle' ? Infinity : 0 }
        }
      >
        <div
          className={`w-3 h-3 rounded-full ${phase === 'idle' ? 'bg-gray-600' : style.color.replace('text-', 'bg-')}`}
        />
      </motion.div>
      <div className="text-center">
        <div className="text-xs font-mono font-bold text-gray-300">{t('title')}</div>
        <div className={`text-xs font-mono ${style.color}`}>{phaseLabel[phase]}</div>
      </div>
    </div>
  );
}
