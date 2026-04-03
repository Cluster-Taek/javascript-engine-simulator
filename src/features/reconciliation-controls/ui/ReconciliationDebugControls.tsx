'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { VscDebugStepBack, VscDebugStepOver } from 'react-icons/vsc';
import { RECONCILIATION_SCENARIOS } from '@/shared/config';
import { useReconciliationStore } from '@/shared/model';

export function ReconciliationDebugControls() {
  const t = useTranslations('reconciliationControls');
  const status = useReconciliationStore((s) => s.executionStatus);
  const stepForward = useReconciliationStore((s) => s.stepForward);
  const stepBack = useReconciliationStore((s) => s.stepBack);
  const run = useReconciliationStore((s) => s.run);
  const pause = useReconciliationStore((s) => s.pause);
  const reset = useReconciliationStore((s) => s.reset);
  const loadScenario = useReconciliationStore((s) => s.loadScenario);
  const executionSpeed = useReconciliationStore((s) => s.executionSpeed);
  const setExecutionSpeed = useReconciliationStore((s) => s.setExecutionSpeed);
  const currentStep = useReconciliationStore((s) => s.currentStep);
  const stepIndex = useReconciliationStore((s) => s.stepIndex);
  const currentScenario = useReconciliationStore((s) => s.currentScenario);

  // Load first scenario on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadScenario(RECONCILIATION_SCENARIOS[0]);
    }
  }, [loadScenario]);

  const isCompleted = status === 'completed';
  const isRunning = status === 'running';
  const canStepBack = stepIndex > 0;
  const hasScenario = currentScenario !== null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
      {/* Scenario selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{t('scenario')}</span>
        <select
          className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1 flex-1"
          onChange={(e) => {
            const scenario = RECONCILIATION_SCENARIOS.find((s) => s.name === e.target.value);
            if (scenario) {
              loadScenario(scenario);
            }
          }}
          value={currentScenario?.name ?? ''}
        >
          <option value="" disabled>
            {t('selectScenario')}
          </option>
          {RECONCILIATION_SCENARIOS.map((s) => (
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
