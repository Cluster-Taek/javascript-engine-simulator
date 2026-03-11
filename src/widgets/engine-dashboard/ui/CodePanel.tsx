'use client';

import { useTranslations } from 'next-intl';
import { TokenList } from '@/entities/token';
import { CodeEditor } from '@/features/code-editor';
import { ConsoleOutput } from '@/features/console-output';
import { DebugControls } from '@/features/step-debugger';
import { useEngineStore } from '@/shared/model';
import { Panel } from '@/shared/ui/panel';

export function CodePanel() {
  const t = useTranslations('panels');
  const tokens = useEngineStore((s) => s.tokens);
  const currentLine = useEngineStore((s) => s.currentLine);
  const status = useEngineStore((s) => s.executionStatus);

  return (
    <div className="flex flex-col h-full">
      <Panel title={t('codeEditor')} className="flex-1 min-h-0">
        <CodeEditor readonly={status === 'running'} />
      </Panel>
      <DebugControls />
      {tokens.length > 0 && (
        <Panel title={t('tokenStream')} className="max-h-40 shrink-0">
          <TokenList tokens={tokens} currentLine={currentLine} />
        </Panel>
      )}
      <Panel title={t('console')} className="h-36 shrink-0">
        <ConsoleOutput />
      </Panel>
    </div>
  );
}
