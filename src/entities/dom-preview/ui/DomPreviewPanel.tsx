'use client';

import { useTranslations } from 'next-intl';
import { type DomSnapshot } from '@/shared/lib/reconciler';
import { DomElementView } from './DomElementView';

interface DomPreviewPanelProps {
  dom: DomSnapshot | null;
}

export function DomPreviewPanel({ dom }: DomPreviewPanelProps) {
  const t = useTranslations('reconciliationPanel');

  if (!dom) {
    return <div className="p-3 text-xs text-gray-500">{t('noDom')}</div>;
  }

  return (
    <div className="p-3 overflow-auto">
      <DomElementView element={dom} />
    </div>
  );
}
