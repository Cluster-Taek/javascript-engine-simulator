'use client';

import { useTranslations } from 'next-intl';
import { ExpandModal } from '@/shared/ui/expand-modal';

interface ReconciliationHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReconciliationHelpModal({ open, onClose }: ReconciliationHelpModalProps) {
  const t = useTranslations('reconciliationHelp');

  return (
    <ExpandModal title={t('title')} open={open} onClose={onClose}>
      <div className="p-4 space-y-4 text-sm text-gray-300">
        {/* About */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('about.heading')}</h3>
          <p className="text-gray-300 text-xs leading-relaxed">{t('about.description')}</p>
        </section>

        {/* Algorithm Steps */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('algorithm.heading')}</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-gray-800 rounded text-[10px] font-bold text-gray-300 shrink-0">
                1
              </span>
              <span className="text-gray-400">{t('algorithm.step1')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-gray-800 rounded text-[10px] font-bold text-gray-300 shrink-0">
                2
              </span>
              <span className="text-gray-400">{t('algorithm.step2')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-gray-800 rounded text-[10px] font-bold text-gray-300 shrink-0">
                3
              </span>
              <span className="text-gray-400">{t('algorithm.step3')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-gray-800 rounded text-[10px] font-bold text-gray-300 shrink-0">
                4
              </span>
              <span className="text-gray-400">{t('algorithm.step4')}</span>
            </div>
          </div>
        </section>

        {/* Operations */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('operations.heading')}</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 mt-1 rounded-full bg-green-400 shrink-0" />
              <div>
                <span className="font-semibold text-green-300">PLACEMENT</span>
                <span className="text-gray-400"> — {t('operations.placement')}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 mt-1 rounded-full bg-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-blue-300">UPDATE</span>
                <span className="text-gray-400"> — {t('operations.update')}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 mt-1 rounded-full bg-red-400 shrink-0" />
              <div>
                <span className="font-semibold text-red-300">DELETION</span>
                <span className="text-gray-400"> — {t('operations.deletion')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Key Insight */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('keyInsight.heading')}</h3>
          <p className="text-gray-400 text-xs leading-relaxed">{t('keyInsight.description')}</p>
        </section>
      </div>
    </ExpandModal>
  );
}
