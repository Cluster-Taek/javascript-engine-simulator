'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RULE_INLINE_CLASSES, deriveThisBindingRule } from '@/entities/this-binding';
import { CodeEditor, type ExternalDecoration } from '@/features/code-editor';
import { ConsoleOutput } from '@/features/console-output';
import { DebugControls } from '@/features/step-debugger';
import { THIS_SNIPPET_GROUPS, THIS_SNIPPETS } from '@/shared/config';
import { useEngineStore } from '@/shared/model';
import { Panel } from '@/shared/ui/panel';

function useThisDecorations(): ExternalDecoration[] {
  const sourceCode = useEngineStore((s) => s.sourceCode);
  const currentStep = useEngineStore((s) => s.currentStep);
  const callStack = useEngineStore((s) => s.callStack);

  return useMemo(() => {
    if (!currentStep) return [];

    const rule = deriveThisBindingRule(currentStep);
    if (!rule) {
      // Even when not at enter-function, try to use the current environment's this
      // to highlight `this` keywords while stepping inside a function
      const topEnv = currentStep.environments[0];
      if (!topEnv) return [];
      const hasThis = topEnv.bindings.some((b) => b.name === 'this');
      if (!hasThis) return [];

      // No rule available from current step — skip highlighting
      return [];
    }

    const decorations: ExternalDecoration[] = [];
    const lines = sourceCode.split('\n');
    const cssClass = RULE_INLINE_CLASSES[rule];

    // Only highlight `this` within the current function body's range
    const topFrame = callStack[callStack.length - 1];
    const bodyLoc = topFrame?.bodyLoc;
    const startLine = bodyLoc?.start.line ?? 1;
    const endLine = bodyLoc?.end.line ?? lines.length;

    const regex = /\bthis\b/g;
    for (let lineIdx = startLine - 1; lineIdx < endLine && lineIdx < lines.length; lineIdx++) {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(lines[lineIdx])) !== null) {
        decorations.push({
          startLine: lineIdx + 1,
          startCol: match.index + 1,
          endLine: lineIdx + 1,
          endCol: match.index + 5, // "this" is 4 chars
          inlineClassName: cssClass,
        });
      }
    }

    // For arrow functions: highlight the enclosing scope's line
    if (rule === 'arrow' && callStack.length >= 2) {
      const enclosingFrame = callStack[callStack.length - 2];
      if (enclosingFrame?.loc) {
        decorations.push({
          startLine: enclosingFrame.loc.start.line,
          startCol: 1,
          endLine: enclosingFrame.loc.start.line,
          endCol: 1,
          className: 'this-inherited-scope',
        });
      }
    }

    return decorations;
  }, [sourceCode, currentStep, callStack]);
}

export function ThisCodePanel() {
  const t = useTranslations('panels');
  const status = useEngineStore((s) => s.executionStatus);
  const reset = useEngineStore((s) => s.reset);
  const setSourceCode = useEngineStore((s) => s.setSourceCode);
  const thisDecorations = useThisDecorations();

  // Load first this snippet on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      reset();
      setSourceCode(THIS_SNIPPETS[0].code);
    }
  }, [reset, setSourceCode]);

  const [editorHeight, setEditorHeight] = useState<number | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startY = e.clientY;
      const startHeight =
        editorHeight ?? containerRef.current?.querySelector<HTMLElement>('[data-editor-panel]')?.offsetHeight ?? 300;

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
          <CodeEditor readonly={status === 'running'} externalDecorations={thisDecorations} />
        </Panel>
      </div>

      {/* Editor resize handle */}
      <div
        className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize shrink-0 rounded transition-colors"
        onMouseDown={onResizeStart}
      />

      <DebugControls snippetGroups={THIS_SNIPPET_GROUPS} defaultSnippet={THIS_SNIPPETS[0].name} />
      <Panel title={t('console')} className={editorHeight != null ? 'flex-1 min-h-0' : 'h-36 shrink-0'}>
        <ConsoleOutput />
      </Panel>
    </div>
  );
}
