'use client';

import { useTranslations } from 'next-intl';
import { RULE_COLORS } from '@/entities/this-binding';
import { ExpandModal } from '@/shared/ui/expand-modal';

interface ThisHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const RULE_DOT_MAP: Array<{ key: string; rule: 'new' | 'implicit' | 'default' | 'arrow' | 'lost' }> = [
  { key: 'new', rule: 'new' },
  { key: 'implicit', rule: 'implicit' },
  { key: 'default', rule: 'default' },
  { key: 'arrow', rule: 'arrow' },
  { key: 'lost', rule: 'lost' },
];

export function ThisHelpModal({ open, onClose }: ThisHelpModalProps) {
  const t = useTranslations('thisHelp');

  return (
    <ExpandModal title={t('title')} open={open} onClose={onClose}>
      <div className="space-y-5 text-sm text-gray-300 p-4">
        {/* About */}
        <section>
          <h3 className="text-xs font-bold text-gray-100 uppercase mb-2">{t('about.heading')}</h3>
          <p className="text-gray-400 leading-relaxed">{t('about.description')}</p>
        </section>

        {/* 5 Binding Rules */}
        <section>
          <h3 className="text-xs font-bold text-gray-100 uppercase mb-2">{t('rules.heading')}</h3>
          <ul className="space-y-1.5 text-gray-400">
            {RULE_DOT_MAP.map(({ key, rule }) => {
              const colors = RULE_COLORS[rule];
              return (
                <li key={key} className="leading-relaxed">
                  <span className={`inline-block w-2 h-2 rounded-full ${colors.dot} mr-2`} />
                  {t(`rules.${key}`)}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Key Insight */}
        <section>
          <h3 className="text-xs font-bold text-gray-100 uppercase mb-2">{t('keyInsight.heading')}</h3>
          <p className="text-gray-400 leading-relaxed italic">{t('keyInsight.description')}</p>
        </section>
      </div>
    </ExpandModal>
  );
}
