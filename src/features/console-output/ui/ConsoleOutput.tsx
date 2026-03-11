'use client';

import { useTranslations } from 'next-intl';
import { useEngineStore } from '@/shared/model';

export function ConsoleOutput() {
  const t = useTranslations('emptyStates');
  const consoleOutput = useEngineStore((s) => s.consoleOutput);

  if (consoleOutput.length === 0) {
    return <div className="p-3 text-gray-500 text-xs font-mono">{t('console')}</div>;
  }

  return (
    <div className="p-2 space-y-1">
      {consoleOutput.map((line, idx) => (
        <div key={idx} className="flex items-start gap-2 px-2 py-1 rounded bg-gray-800 font-mono text-xs">
          <span className="text-gray-500 shrink-0">{`>`}</span>
          <span className="text-green-300 break-all">{line}</span>
        </div>
      ))}
    </div>
  );
}
