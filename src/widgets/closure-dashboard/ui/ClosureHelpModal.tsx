'use client';

import { useTranslations } from 'next-intl';
import { ExpandModal } from '@/shared/ui/expand-modal';

interface ClosureHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function ClosureHelpModal({ open, onClose }: ClosureHelpModalProps) {
  const t = useTranslations('closureHelp');

  return (
    <ExpandModal title={t('title')} open={open} onClose={onClose}>
      <div className="space-y-5 text-sm text-gray-300 p-4">
        {/* About */}
        <section>
          <h3 className="text-xs font-bold text-gray-100 uppercase mb-2">{t('about.heading')}</h3>
          <p className="text-gray-400 leading-relaxed">{t('about.description')}</p>
        </section>

        {/* Key Concepts */}
        <section>
          <h3 className="text-xs font-bold text-gray-100 uppercase mb-2">{t('concepts.heading')}</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="leading-relaxed">{t('concepts.lexicalEnv')}</li>
            <li className="leading-relaxed">{t('concepts.outerRef')}</li>
            <li className="leading-relaxed">{t('concepts.lifecycle')}</li>
          </ul>
        </section>

        {/* Statuses */}
        <section>
          <h3 className="text-xs font-bold text-gray-100 uppercase mb-2">{t('statuses.heading')}</h3>
          <ul className="space-y-1.5 text-gray-400">
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
              {t('statuses.active')}
            </li>
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2" />
              {t('statuses.retained')}
            </li>
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-2" />
              {t('statuses.collected')}
            </li>
          </ul>
        </section>
      </div>
    </ExpandModal>
  );
}
