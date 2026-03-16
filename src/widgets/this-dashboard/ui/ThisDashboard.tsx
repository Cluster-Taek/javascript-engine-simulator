'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import { LanguageSwitcher } from '@/features/language-switcher';
import { SimulatorTabBar } from '@/features/simulator-nav';
import { ResizableSplit } from '@/shared/ui/resizable-split';
import { ThisCodePanel } from './ThisCodePanel';
import { ThisHelpModal } from './ThisHelpModal';
import { ThisVisualizationPanel } from './ThisVisualizationPanel';

export function ThisDashboard() {
  const t = useTranslations('thisDashboard');
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <SimulatorTabBar
        actions={
          <>
            <LanguageSwitcher />
            <button
              onClick={() => setHelpOpen(true)}
              className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              aria-label={t('helpAriaLabel')}
            >
              <FiHelpCircle size={18} />
            </button>
          </>
        }
      />
      <ThisHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ResizableSplit
          left={<ThisCodePanel />}
          right={<ThisVisualizationPanel />}
          initialLeftPercent={40}
          className="h-full"
        />
      </div>
    </div>
  );
}
