'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useEngineStore } from '@/shared/model';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  readonly?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function CodeEditor({ readonly = false }: CodeEditorProps) {
  const sourceCode = useEngineStore((s) => s.sourceCode);
  const setSourceCode = useEngineStore((s) => s.setSourceCode);
  const currentLine = useEngineStore((s) => s.currentLine);
  const breakpoints = useEngineStore((s) => s.breakpoints);
  const toggleBreakpoint = useEngineStore((s) => s.toggleBreakpoint);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const decorations: any[] = [];

    // Current execution line highlight
    if (currentLine !== null) {
      decorations.push({
        range: new monaco.Range(currentLine, 1, currentLine, 1),
        options: {
          isWholeLine: true,
          className: 'current-line-highlight',
          glyphMarginClassName: 'current-line-glyph',
        },
      });
      editor.revealLineInCenter(currentLine);
    }

    // Breakpoint decorations
    for (const line of breakpoints) {
      decorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'breakpoint-glyph',
        },
      });
    }

    if (decorationsRef.current) {
      decorationsRef.current.set(decorations);
    } else {
      decorationsRef.current = editor.createDecorationsCollection(decorations);
    }
  }, [currentLine, breakpoints]);

  return (
    <MonacoEditor
      height="100%"
      language="javascript"
      theme="vs-dark"
      value={sourceCode}
      onChange={(value) => !readonly && setSourceCode(value ?? '')}
      options={{
        readOnly: readonly,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        glyphMargin: true,
      }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Handle gutter clicks for breakpoints
        editor.onMouseDown((e: any) => {
          if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
            const line = e.target.position?.lineNumber;
            if (line) toggleBreakpoint(line);
          }
        });
      }}
    />
  );
}
