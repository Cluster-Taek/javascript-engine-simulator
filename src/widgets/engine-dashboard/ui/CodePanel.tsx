'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
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

  const [editorHeight, setEditorHeight] = useState<number | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startY = e.clientY;
      const startHeight =
        editorHeight ??
        containerRef.current?.querySelector<HTMLElement>('[data-editor-panel]')
          ?.offsetHeight ??
        300;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = ev.clientY - startY;
        const containerHeight = containerRef.current?.offsetHeight ?? 600;
        const minH = 120;
        const maxH = containerHeight - 200;
        setEditorHeight(Math.min(maxH, Math.max(minH, startHeight + delta)));
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [editorHeight]
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div
        data-editor-panel
        className={editorHeight != null ? 'shrink-0' : 'flex-1 min-h-0'}
        style={editorHeight != null ? { height: editorHeight } : undefined}
      >
        <Panel title={t('codeEditor')} className="h-full">
          <CodeEditor readonly={status === 'running'} />
        </Panel>
      </div>

      {/* Editor resize handle */}
      <div
        className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize shrink-0 rounded transition-colors"
        onMouseDown={onResizeStart}
      />

      <DebugControls />
      {tokens.length > 0 && (
        <Panel title={t('tokenStream')} className="max-h-40 shrink-0">
          <TokenList tokens={tokens} currentLine={currentLine} />
        </Panel>
      )}
      <Panel
        title={t('console')}
        className={editorHeight != null ? 'flex-1 min-h-0' : 'h-36 shrink-0'}
      >
        <ConsoleOutput />
      </Panel>
    </div>
  );
}
