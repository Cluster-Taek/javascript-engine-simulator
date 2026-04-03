import { createStore, useStore } from 'zustand';
import { reconcile } from '../lib/reconciler';
import {
  type ReconciliationScenario,
  type ReconciliationStep,
  type VNode,
  type DiffOperation,
  type DomSnapshot,
} from '../lib/reconciler';

export type ReconciliationExecutionStatus = 'idle' | 'running' | 'paused' | 'completed';

const MAX_STEP_HISTORY = 500;

interface ReconciliationState {
  currentScenario: ReconciliationScenario | null;
  generator: Generator<ReconciliationStep, void, void> | null;
  currentStep: ReconciliationStep | null;
  stepHistory: ReconciliationStep[];
  stepIndex: number;
  consoleOutput: string[];
  executionStatus: ReconciliationExecutionStatus;
  executionSpeed: number;
  intervalId: ReturnType<typeof setInterval> | null;
  oldTree: VNode | null;
  newTree: VNode | null;
  diffOperations: DiffOperation[];
  renderedDom: DomSnapshot | null;
  focusedOldNodeId: string | null;
  focusedNewNodeId: string | null;
  componentState: Record<string, unknown>;
  pendingTransitionIndex: number;
}

interface ReconciliationActions {
  loadScenario: (scenario: ReconciliationScenario) => void;
  triggerStateChange: (transitionIndex: number) => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
  run: () => void;
  pause: () => void;
  setExecutionSpeed: (ms: number) => void;
}

type ReconciliationStore = ReconciliationState & ReconciliationActions;

const initialState: ReconciliationState = {
  currentScenario: null,
  generator: null,
  currentStep: null,
  stepHistory: [],
  stepIndex: -1,
  consoleOutput: [],
  executionStatus: 'idle',
  executionSpeed: 500,
  intervalId: null,
  oldTree: null,
  newTree: null,
  diffOperations: [],
  renderedDom: null,
  focusedOldNodeId: null,
  focusedNewNodeId: null,
  componentState: {},
  pendingTransitionIndex: 0,
};

export const reconciliationStore = createStore<ReconciliationStore>()((set, get) => ({
  ...initialState,

  loadScenario: (scenario) => {
    const { intervalId } = get();
    if (intervalId !== null) clearInterval(intervalId);
    set({
      ...initialState,
      currentScenario: scenario,
      componentState: { ...scenario.initialState },
    });
  },

  triggerStateChange: (transitionIndex) => {
    const { intervalId, currentScenario, executionSpeed } = get();
    if (!currentScenario) return;
    if (intervalId !== null) clearInterval(intervalId);

    const gen = reconcile(currentScenario, transitionIndex);

    set({
      ...initialState,
      currentScenario,
      generator: gen,
      executionStatus: 'running',
      executionSpeed,
      pendingTransitionIndex: transitionIndex,
      componentState: { ...currentScenario.initialState },
    });

    // Auto-run
    const id = setInterval(() => {
      const currentState = get();
      if (currentState.executionStatus === 'completed' || currentState.executionStatus === 'paused') {
        clearInterval(id);
        set({ intervalId: null });
        return;
      }
      get().stepForward();
      const afterStep = get();
      if (afterStep.executionStatus === 'completed') {
        clearInterval(id);
        set({ intervalId: null });
      }
    }, get().executionSpeed);

    set({ intervalId: id });
  },

  reset: () => {
    const { intervalId, currentScenario } = get();
    if (intervalId !== null) clearInterval(intervalId);
    set({
      ...initialState,
      currentScenario,
      componentState: currentScenario ? { ...currentScenario.initialState } : {},
    });
  },

  stepForward: () => {
    const state = get();
    const { executionStatus, stepIndex, stepHistory, currentScenario } = state;
    let { generator } = state;

    if (executionStatus === 'completed' || !currentScenario) return;

    // Replay history if stepped back
    if (stepIndex < stepHistory.length - 1) {
      const nextIndex = stepIndex + 1;
      const step = stepHistory[nextIndex];
      set({
        stepIndex: nextIndex,
        currentStep: step,
        consoleOutput: [...step.consoleOutput],
        oldTree: step.oldTree,
        newTree: step.newTree,
        diffOperations: [...step.diffOperations],
        renderedDom: step.renderedDom,
        focusedOldNodeId: step.focusedOldNodeId,
        focusedNewNodeId: step.focusedNewNodeId,
        componentState: { ...step.componentState },
        executionStatus: executionStatus === 'running' ? 'running' : 'paused',
      });
      return;
    }

    // Initialize generator
    if (generator === null) {
      generator = reconcile(currentScenario, state.pendingTransitionIndex);
      set({ generator, executionStatus: 'paused', consoleOutput: [] });
    }

    const { value, done } = generator.next();
    if (done) {
      set({ executionStatus: 'completed' });
      return;
    }

    const step = value;
    let newHistory = [...stepHistory, step];
    let newIndex = newHistory.length - 1;

    if (newHistory.length > MAX_STEP_HISTORY) {
      newHistory = newHistory.slice(newHistory.length - MAX_STEP_HISTORY);
      newIndex = newHistory.length - 1;
    }

    const isComplete = step.kind === 'reconciliation-complete';

    set({
      currentStep: step,
      stepHistory: newHistory,
      stepIndex: newIndex,
      consoleOutput: [...step.consoleOutput],
      oldTree: step.oldTree,
      newTree: step.newTree,
      diffOperations: [...step.diffOperations],
      renderedDom: step.renderedDom,
      focusedOldNodeId: isComplete ? null : step.focusedOldNodeId,
      focusedNewNodeId: isComplete ? null : step.focusedNewNodeId,
      componentState: { ...step.componentState },
      executionStatus: isComplete ? 'completed' : executionStatus === 'running' ? 'running' : 'paused',
    });
  },

  stepBack: () => {
    const { stepIndex, stepHistory, intervalId } = get();

    if (intervalId !== null) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }

    if (stepIndex <= 0 || stepHistory.length === 0) return;

    const prevIndex = stepIndex - 1;
    const step = stepHistory[prevIndex];

    set({
      stepIndex: prevIndex,
      currentStep: step,
      consoleOutput: [...step.consoleOutput],
      oldTree: step.oldTree,
      newTree: step.newTree,
      diffOperations: [...step.diffOperations],
      renderedDom: step.renderedDom,
      focusedOldNodeId: step.focusedOldNodeId,
      focusedNewNodeId: step.focusedNewNodeId,
      componentState: { ...step.componentState },
      executionStatus: 'paused',
    });
  },

  run: () => {
    const { intervalId, executionSpeed, currentScenario, pendingTransitionIndex } = get();
    if (intervalId !== null || !currentScenario) return;

    // Initialize generator if needed
    if (get().generator === null) {
      const gen = reconcile(currentScenario, pendingTransitionIndex);
      set({ generator: gen, consoleOutput: [] });
    }

    set({ executionStatus: 'running' });

    const id = setInterval(() => {
      const currentState = get();
      if (currentState.executionStatus === 'completed' || currentState.executionStatus === 'paused') {
        clearInterval(id);
        set({ intervalId: null });
        return;
      }
      get().stepForward();
      const afterStep = get();
      if (afterStep.executionStatus === 'completed') {
        clearInterval(id);
        set({ intervalId: null });
      }
    }, executionSpeed);

    set({ intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId !== null) {
      clearInterval(intervalId);
      set({ intervalId: null, executionStatus: 'paused' });
    }
  },

  setExecutionSpeed: (ms) => {
    set({ executionSpeed: ms });
  },
}));

export function useReconciliationStore<T>(selector: (state: ReconciliationStore) => T): T {
  return useStore(reconciliationStore, selector);
}
