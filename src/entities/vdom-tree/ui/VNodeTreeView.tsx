'use client';

import { useTranslations } from 'next-intl';
import { type VNode, type DiffOperation } from '@/shared/lib/reconciler';
import { VNodeView } from './VNodeView';

interface VNodeTreeViewProps {
  tree: VNode | null;
  focusedNodeId: string | null;
  diffOperations: DiffOperation[];
  label?: string;
}

export function VNodeTreeView({ tree, focusedNodeId, diffOperations, label }: VNodeTreeViewProps) {
  const t = useTranslations('reconciliationPanel');

  if (!tree) {
    return <div className="p-3 text-xs text-gray-500">{t('noTree')}</div>;
  }

  return (
    <div className="p-2 overflow-auto font-mono text-xs">
      {label && <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{label}</div>}
      <VNodeView node={tree} depth={0} focusedNodeId={focusedNodeId} diffOperations={diffOperations} />
    </div>
  );
}
