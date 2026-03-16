'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Link, SIMULATORS, usePathname } from '@/shared/config';

export function SimulatorTabBar() {
  const t = useTranslations('simulatorNav');
  const pathname = usePathname();

  return (
    <nav className="flex items-end bg-gray-950 shrink-0 overflow-x-auto">
      {SIMULATORS.map((sim) => {
        const isActive = pathname === sim.href || (sim.href !== '/' && pathname.startsWith(sim.href));

        return (
          <Link
            key={sim.id}
            href={sim.href}
            className={`relative flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap transition-colors ${
              isActive ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="simulator-tab-active"
                className="absolute inset-0 bg-gray-900 rounded-t-lg border-t border-x border-gray-800"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative text-sm">{sim.emoji}</span>
            <span className="relative">{t(`items.${sim.id}.title`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
