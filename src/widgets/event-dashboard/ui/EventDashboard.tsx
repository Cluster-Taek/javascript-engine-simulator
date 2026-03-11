'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import { LanguageSwitcher } from '@/features/language-switcher';
import { Link } from '@/shared/config';
import { ResizableSplit } from '@/shared/ui/resizable-split';
import { DomTreePanel } from './DomTreePanel';
import { EventHelpModal } from './EventHelpModal';
import { PropagationPanel } from './PropagationPanel';

export function EventDashboard() {
  const t = useTranslations('eventDashboard');
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h1 className="text-sm font-bold text-gray-100">{t('title')}</h1>
        </div>
        <span className="text-xs text-gray-500 flex-1">{t('subtitle')}</span>
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 border border-gray-700 rounded"
        >
          {t('backToEngine')}
        </Link>
        <LanguageSwitcher />
        <button
          onClick={() => setHelpOpen(true)}
          className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          aria-label={t('helpAriaLabel')}
        >
          <FiHelpCircle size={18} />
        </button>
      </header>
      <EventHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ResizableSplit
          left={<DomTreePanel />}
          right={<PropagationPanel />}
          initialLeftPercent={40}
          className="h-full"
        />
      </div>
    </div>
  );
}
