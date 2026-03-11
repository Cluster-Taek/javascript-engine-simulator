'use client';

import { useTranslations } from 'next-intl';
import { ExpandModal } from '@/shared/ui/expand-modal';

interface EventHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function EventHelpModal({ open, onClose }: EventHelpModalProps) {
  const t = useTranslations('eventHelp');

  return (
    <ExpandModal title={t('title')} open={open} onClose={onClose}>
      <div className="p-4 space-y-4 text-sm text-gray-300">
        {/* About */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('about.heading')}</h3>
          <p className="text-gray-300 text-xs leading-relaxed">{t('about.description')}</p>
        </section>

        {/* Phases */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('phases.heading')}</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 mt-1 rounded-full bg-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-blue-300">{t('phases.capturing')}</span>
                <span className="text-gray-400"> — {t('phases.capturingDesc')}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 mt-1 rounded-full bg-yellow-400 shrink-0" />
              <div>
                <span className="font-semibold text-yellow-300">{t('phases.target')}</span>
                <span className="text-gray-400"> — {t('phases.targetDesc')}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 mt-1 rounded-full bg-green-400 shrink-0" />
              <div>
                <span className="font-semibold text-green-300">{t('phases.bubbling')}</span>
                <span className="text-gray-400"> — {t('phases.bubblingDesc')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Key Concepts */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('concepts.heading')}</h3>
          <ul className="space-y-1 text-xs text-gray-400 list-disc list-inside">
            <li>{t('concepts.stopPropagation')}</li>
            <li>{t('concepts.stopImmediate')}</li>
            <li>{t('concepts.preventDefault')}</li>
            <li>{t('concepts.delegation')}</li>
          </ul>
        </section>
      </div>
    </ExpandModal>
  );
}
