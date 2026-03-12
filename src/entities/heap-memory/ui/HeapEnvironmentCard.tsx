'use client';

import { useTranslations } from 'next-intl';
import { type HeapEnvironmentSnapshot } from '@/shared/lib/engine';

interface HeapEnvironmentCardProps {
  env: HeapEnvironmentSnapshot;
  depth: number;
  parentLabel?: string;
}

const statusStyles = {
  active: 'border-green-500/60 bg-green-950/30',
  retained: 'border-amber-500/60 bg-amber-950/30',
  collected: 'border-gray-600 border-dashed bg-gray-900/30 opacity-40',
} as const;

const badgeStyles = {
  active: 'bg-green-900 text-green-300',
  retained: 'bg-amber-900 text-amber-300',
  collected: 'bg-gray-700 text-gray-400',
} as const;

const kindColors: Record<string, string> = {
  const: 'text-purple-400',
  let: 'text-blue-400',
  var: 'text-yellow-400',
};

export function HeapEnvironmentCard({ env, depth, parentLabel }: HeapEnvironmentCardProps) {
  const t = useTranslations('heapPanel');

  const badgeText = env.status === 'active' ? t('onStack') : env.status === 'retained' ? t('retained') : t('collected');

  return (
    <div style={{ marginLeft: depth * 16 }} className="relative">
      {/* Connector line */}
      {depth > 0 && <div className="absolute -left-3 top-0 bottom-0 w-px bg-gray-700" />}
      {depth > 0 && <div className="absolute -left-3 top-4 w-3 h-px bg-gray-700" />}

      <div className={`border rounded text-xs font-mono mb-1.5 ${statusStyles[env.status]}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700/50">
          <span className="text-gray-200 font-semibold truncate">{env.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeStyles[env.status]}`}>{badgeText}</span>
        </div>

        {/* Bindings */}
        {env.status !== 'collected' && env.bindings.length > 0 && (
          <div className="px-2 py-1 space-y-0.5">
            {env.bindings.map((b) => (
              <div key={b.name} className="flex items-center gap-1.5">
                <span className={`${kindColors[b.kind] ?? 'text-gray-400'}`}>{b.kind}</span>
                <span className="text-gray-300">{b.name}</span>
                <span className="text-gray-600">=</span>
                <span className={`truncate ${b.initialized ? 'text-gray-400' : 'text-red-400 italic'}`}>
                  {b.initialized ? b.value : '<uninitialized>'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Referenced by closures */}
        {env.status === 'retained' && env.referencedByClosures.length > 0 && (
          <div className="px-2 py-1 border-t border-gray-700/50 text-[10px] text-amber-400">
            {t('referencedBy')}: {[...new Set(env.referencedByClosures)].join(', ')}
          </div>
        )}

        {/* Outer reference */}
        {parentLabel && env.status !== 'collected' && (
          <div className="px-2 py-1 border-t border-gray-700/50 text-[10px] text-gray-500">
            {t('outerRef')} → {parentLabel}
          </div>
        )}
      </div>
    </div>
  );
}
