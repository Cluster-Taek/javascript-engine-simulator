'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/features/language-switcher';
import { Link, SIMULATORS } from '@/shared/config';
import { Footer } from '@/widgets/footer';

export function LandingPage() {
  const t = useTranslations('simulatorNav');

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-100">JavaScript Engine Simulator</h1>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
          {SIMULATORS.map((sim) => (
            <Link
              key={sim.id}
              href={sim.href}
              className="group flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 hover:bg-gray-800/80 transition-all"
            >
              <span className="text-4xl">{sim.emoji}</span>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-100 group-hover:text-white">
                  {t(`items.${sim.id}.title`)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{t(`items.${sim.id}.description`)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="shrink-0">
        <Footer />
      </div>
    </div>
  );
}
