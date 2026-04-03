'use client';

import { FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { type DiffOperation } from '@/shared/lib/reconciler';

const config = {
  PLACEMENT: { icon: FiPlus, bg: 'bg-green-900/60', text: 'text-green-300', label: 'INSERT' },
  UPDATE: { icon: FiRefreshCw, bg: 'bg-blue-900/60', text: 'text-blue-300', label: 'UPDATE' },
  DELETION: { icon: FiTrash2, bg: 'bg-red-900/60', text: 'text-red-300', label: 'DELETE' },
} as const;

interface DiffOperationBadgeProps {
  operation: DiffOperation;
}

export function DiffOperationBadge({ operation }: DiffOperationBadgeProps) {
  const { icon: Icon, bg, text: textColor, label } = config[operation.type];
  const nodeType = operation.newNode?.type ?? operation.oldNode?.type ?? '?';

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded ${bg}`}>
      <Icon className={`${textColor} text-sm shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-mono font-semibold ${textColor}`}>{label}</span>
          <span className="text-xs text-gray-300 font-mono">&lt;{nodeType}&gt;</span>
        </div>
        {operation.propChanges.length > 0 && (
          <div className="text-[10px] text-gray-500 truncate mt-0.5">
            {operation.propChanges
              .map((c) => `${c.prop}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`)
              .join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
