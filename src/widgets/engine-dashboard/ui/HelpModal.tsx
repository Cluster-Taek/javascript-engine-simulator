'use client';

import { useTranslations } from 'next-intl';
import { ExpandModal } from '@/shared/ui/expand-modal';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const t = useTranslations('help');

  return (
    <ExpandModal title={t('title')} open={open} onClose={onClose}>
      <div className="p-4 space-y-5 text-sm text-gray-300">
        {/* About */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('about.heading')}</h2>
          <p className="text-gray-300 leading-relaxed">{t('about.description')}</p>
        </section>

        {/* Simulator Notice */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {t('simulatorNotice.heading')}
          </h2>
          <ul className="space-y-1 list-disc list-inside text-gray-400">
            <li>
              {t.rich('simulatorNotice.virtualSimulatorText', {
                highlight: (chunks) => <span className="text-yellow-400">{chunks}</span>,
              })}
            </li>
            <li>
              {t.rich('simulatorNotice.fetchMocked', {
                code: (chunks) => <code className="text-blue-400">{chunks}</code>,
              })}
            </li>
            <li>
              {t.rich('simulatorNotice.setTimeoutTick', {
                code: (chunks) => <code className="text-blue-400">{chunks}</code>,
              })}
            </li>
          </ul>
        </section>

        {/* Supported Features */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {t('supportedFeatures.heading')}
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-1">{t('supportedFeatures.syntax')}</h3>
              <div className="flex flex-wrap gap-1">
                {['let / const / var', 'function', 'if / else', 'while', 'for', 'return', 'async / await'].map((s) => (
                  <code key={s} className="px-2 py-0.5 bg-gray-800 rounded text-blue-300 text-xs">
                    {s}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-1">{t('supportedFeatures.expressions')}</h3>
              <div className="flex flex-wrap gap-1">
                {[
                  'arithmetic / comparison / logical',
                  'arrow function',
                  'array literal',
                  'object literal',
                  'new keyword',
                ].map((s) => (
                  <code key={s} className="px-2 py-0.5 bg-gray-800 rounded text-green-300 text-xs">
                    {s}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-1">{t('supportedFeatures.builtins')}</h3>
              <div className="flex flex-wrap gap-1">
                {[
                  'console.log',
                  'Math.floor',
                  'Math.ceil',
                  'Math.round',
                  'Math.abs',
                  'Math.max',
                  'Math.min',
                  'Math.sqrt',
                  'Math.pow',
                  'Math.PI',
                ].map((s) => (
                  <code key={s} className="px-2 py-0.5 bg-gray-800 rounded text-purple-300 text-xs">
                    {s}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-1">{t('supportedFeatures.array')}</h3>
              <div className="flex flex-wrap gap-1">
                {['push', 'pop', 'length', 'index access []'].map((s) => (
                  <code key={s} className="px-2 py-0.5 bg-gray-800 rounded text-orange-300 text-xs">
                    {s}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-1">{t('supportedFeatures.asyncMode')}</h3>
              <div className="flex flex-wrap gap-1">
                {['setTimeout', 'queueMicrotask', 'Promise.resolve', '.then()', 'fetch (mocked)'].map((s) => (
                  <code key={s} className="px-2 py-0.5 bg-gray-800 rounded text-teal-300 text-xs">
                    {s}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </ExpandModal>
  );
}
