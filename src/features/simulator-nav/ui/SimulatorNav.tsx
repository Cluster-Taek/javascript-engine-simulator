'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link, SIMULATORS, usePathname } from '@/shared/config';

export function SimulatorNav() {
  const t = useTranslations('simulatorNav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
        aria-label={t('menuAriaLabel')}
      >
        <FiMenu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Drawer */}
            <motion.nav
              className="fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-50 flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-sm font-bold text-gray-100">{t('title')}</span>
                <button
                  onClick={close}
                  className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  aria-label={t('closeAriaLabel')}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {SIMULATORS.map((sim) => {
                  const isActive = pathname === sim.href || (sim.href !== '/' && pathname.startsWith(sim.href));

                  return (
                    <Link
                      key={sim.id}
                      href={sim.href}
                      onClick={close}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-lg">{sim.emoji}</span>
                      <div>
                        <div className="font-medium">{t(`items.${sim.id}.title`)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t(`items.${sim.id}.description`)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
