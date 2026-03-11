'use client';

import dynamic from 'next/dynamic';
import { useEngineStore } from '@/shared/model';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  readonly?: boolean;
}

export function CodeEditor({ readonly = false }: CodeEditorProps) {
  const sourceCode = useEngineStore((s) => s.sourceCode);
  const setSourceCode = useEngineStore((s) => s.setSourceCode);
  const currentLine = useEngineStore((s) => s.currentLine);

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
      }}
      onMount={(editor, _monaco) => {
        if (currentLine !== null) {
          editor.revealLineInCenter(currentLine);
        }
        // Register highlight update on model change
        editor.onDidChangeModelContent(() => {});
      }}
    />
  );
}
