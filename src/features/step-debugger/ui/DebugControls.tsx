'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { VscDebugStepBack, VscDebugStepOver } from 'react-icons/vsc';
import { DEFAULT_SNIPPETS, type CodeSnippet } from '@/shared/config';
import { useEngineStore } from '@/shared/model';

interface DebugControlsProps {
  snippets?: CodeSnippet[];
  defaultSnippet?: string;
}

export function DebugControls({ snippets = DEFAULT_SNIPPETS, defaultSnippet }: DebugControlsProps) {
  const t = useTranslations('debugControls');
  const status = useEngineStore((s) => s.executionStatus);
  const stepForward = useEngineStore((s) => s.stepForward);
  const stepBack = useEngineStore((s) => s.stepBack);
  const run = useEngineStore((s) => s.run);
  const pause = useEngineStore((s) => s.pause);
  const reset = useEngineStore((s) => s.reset);
  const setSourceCode = useEngineStore((s) => s.setSourceCode);
  const executionSpeed = useEngineStore((s) => s.executionSpeed);
  const setExecutionSpeed = useEngineStore((s) => s.setExecutionSpeed);
  const currentStep = useEngineStore((s) => s.currentStep);
  const parseError = useEngineStore((s) => s.parseError);
  const stepIndex = useEngineStore((s) => s.stepIndex);
  const [selectedSnippet, setSelectedSnippet] = useState(defaultSnippet ?? '');

  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isRunning = status === 'running';
  const hasParseError = parseError !== null && status === 'idle';
  const canStepBack = stepIndex > 0;

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-800 border-t border-gray-700">
      {/* Snippet selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{t('example')}</span>
        <select
          className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1 flex-1"
          onChange={(e) => {
            const snippet = snippets.find((s) => s.name === e.target.value);
            if (snippet) {
              setSelectedSnippet(snippet.name);
              reset();
              setSourceCode(snippet.code);
            }
          }}
          value={selectedSnippet}
        >
          <option value="" disabled>
            {t('selectSnippet')}
          </option>
          {snippets.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={pause}
            className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded transition-colors"
          >
            {t('pause')}
          </button>
        ) : (
          <button
            onClick={run}
            disabled={isCompleted || isError || hasParseError}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded transition-colors"
          >
            {t('run')}
          </button>
        )}

        <button
          onClick={stepBack}
          disabled={!canStepBack || isRunning}
          className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded transition-colors flex items-center gap-1"
          title={t('stepBack')}
        >
          <VscDebugStepBack className="text-sm" />
          {t('stepBack')}
        </button>

        <button
          onClick={stepForward}
          disabled={isCompleted || isError || isRunning || hasParseError}
          className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded transition-colors flex items-center gap-1"
          title={t('step')}
        >
          <VscDebugStepOver className="text-sm" />
          {t('step')}
        </button>

        <button
          onClick={reset}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded border border-gray-600 transition-colors"
        >
          {t('reset')}
        </button>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">{t('speed')}</span>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={2050 - executionSpeed}
          onChange={(e) => setExecutionSpeed(2050 - Number(e.target.value))}
          disabled={isRunning}
          className="flex-1 accent-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <span className="text-xs text-gray-400 w-16">
          {executionSpeed}
          {t('msPerStep')}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono ${
            isError
              ? 'bg-red-900 text-red-300'
              : isCompleted
                ? 'bg-green-900 text-green-300'
                : isRunning
                  ? 'bg-yellow-900 text-yellow-300'
                  : status === 'paused'
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-gray-700 text-gray-400'
          }`}
        >
          {status}
        </span>
        {currentStep && <span className="text-xs text-gray-400 truncate">{currentStep.description}</span>}
      </div>

      {/* Error display */}
      {parseError && (
        <div className="text-xs text-red-400 bg-red-900/30 border border-red-800 rounded px-2 py-1 font-mono">
          {parseError}
        </div>
      )}
    </div>
  );
}
