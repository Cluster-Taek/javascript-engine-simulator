'use client';

import { useTranslations } from 'next-intl';
import { VscDebugStepBack, VscDebugStepOver } from 'react-icons/vsc';
import { EVENT_PRESETS } from '@/shared/config';
import { useEventStore } from '@/shared/model';

export function EventDebugControls() {
  const t = useTranslations('eventControls');
  const status = useEventStore((s) => s.executionStatus);
  const stepForward = useEventStore((s) => s.stepForward);
  const stepBack = useEventStore((s) => s.stepBack);
  const run = useEventStore((s) => s.run);
  const pause = useEventStore((s) => s.pause);
  const reset = useEventStore((s) => s.reset);
  const loadScenario = useEventStore((s) => s.loadScenario);
  const executionSpeed = useEventStore((s) => s.executionSpeed);
  const setExecutionSpeed = useEventStore((s) => s.setExecutionSpeed);
  const currentStep = useEventStore((s) => s.currentStep);
  const stepIndex = useEventStore((s) => s.stepIndex);
  const currentScenario = useEventStore((s) => s.currentScenario);

  const isCompleted = status === 'completed';
  const isRunning = status === 'running';
  const canStepBack = stepIndex > 0;
  const hasScenario = currentScenario !== null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-800 border-b border-gray-700">
      {/* Scenario selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{t('scenario')}</span>
        <select
          className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1 flex-1"
          onChange={(e) => {
            const preset = EVENT_PRESETS.find((p) => p.name === e.target.value);
            if (preset) {
              loadScenario(preset);
            }
          }}
          value={currentScenario?.name ?? ''}
        >
          <option value="" disabled>
            {t('selectScenario')}
          </option>
          {EVENT_PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
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
            disabled={isCompleted || !hasScenario}
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
          disabled={isCompleted || isRunning || !hasScenario}
          className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded transition-colors flex items-center gap-1"
          title={t('step')}
        >
          <VscDebugStepOver className="text-sm" />
          {t('step')}
        </button>

        <button
          onClick={reset}
          disabled={!hasScenario}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-200 text-xs rounded border border-gray-600 transition-colors"
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
            isCompleted
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
    </div>
  );
}
