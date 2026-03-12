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
        className="p-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100 hover:border-gray-600 transition-all cursor-pointer"
        aria-label={t('menuAriaLabel')}
      >
        <FiMenu size={16} />
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
              className="fixed top-3 left-3 bottom-3 w-72 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl z-50 flex flex-col shadow-2xl shadow-black/40"
              initial={{ x: '-110%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-110%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
                <span className="text-sm font-bold text-gray-100">{t('title')}</span>
                <button
                  onClick={close}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all cursor-pointer"
                  aria-label={t('closeAriaLabel')}
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {SIMULATORS.map((sim) => {
                  const isActive = pathname === sim.href || (sim.href !== '/' && pathname.startsWith(sim.href));

                  return (
                    <Link
                      key={sim.id}
                      href={sim.href}
                      onClick={close}
                      className={`flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all ${
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
