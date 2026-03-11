import { createStore, useStore } from 'zustand';
import { simulateEventPropagation } from '../lib/event-engine';
import { type EventScenario, type PropagationStep, type EventPhase } from '../lib/event-engine';

export type EventExecutionStatus = 'idle' | 'running' | 'paused' | 'completed';

const MAX_STEP_HISTORY = 500;

interface EventState {
  currentScenario: EventScenario | null;
  generator: Generator<PropagationStep, void, void> | null;
  currentStep: PropagationStep | null;
  stepHistory: PropagationStep[];
  stepIndex: number;
  consoleOutput: string[];
  executionStatus: EventExecutionStatus;
  executionSpeed: number;
  intervalId: ReturnType<typeof setInterval> | null;
  activeNodeId: string | null;
  activePhase: EventPhase | null;
  highlightedListenerId: string | null;
}

interface EventActions {
  loadScenario: (scenario: EventScenario) => void;
  triggerEvent: (targetNodeId: string) => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
  run: () => void;
  pause: () => void;
  setExecutionSpeed: (ms: number) => void;
}

type EventStore = EventState & EventActions;

const initialState: EventState = {
  currentScenario: null,
  generator: null,
  currentStep: null,
  stepHistory: [],
  stepIndex: -1,
  consoleOutput: [],
  executionStatus: 'idle',
  executionSpeed: 500,
  intervalId: null,
  activeNodeId: null,
  activePhase: null,
  highlightedListenerId: null,
};

export const eventStore = createStore<EventStore>()((set, get) => ({
  ...initialState,

  loadScenario: (scenario) => {
    const { intervalId } = get();
    if (intervalId !== null) clearInterval(intervalId);
    set({
      ...initialState,
      currentScenario: scenario,
    });
  },

  triggerEvent: (targetNodeId) => {
    const { intervalId, currentScenario, executionSpeed } = get();
    if (!currentScenario) return;
    if (intervalId !== null) clearInterval(intervalId);

    // Reset and set new target
    const updatedScenario = { ...currentScenario, targetNodeId };
    const gen = simulateEventPropagation(updatedScenario.tree, targetNodeId, updatedScenario.eventType);

    set({
      ...initialState,
      currentScenario: updatedScenario,
      generator: gen,
      executionStatus: 'running',
      executionSpeed,
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
        activeNodeId: step.nodeId,
        activePhase: step.phase,
        highlightedListenerId: step.listenerId ?? null,
        executionStatus: executionStatus === 'running' ? 'running' : 'paused',
      });
      return;
    }

    // Initialize generator
    if (generator === null) {
      generator = simulateEventPropagation(
        currentScenario.tree,
        currentScenario.targetNodeId,
        currentScenario.eventType
      );
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

    set({
      currentStep: step,
      stepHistory: newHistory,
      stepIndex: newIndex,
      consoleOutput: [...step.consoleOutput],
      activeNodeId: step.nodeId,
      activePhase: step.phase,
      highlightedListenerId: step.listenerId ?? null,
      executionStatus:
        step.kind === 'propagation-complete' ? 'completed' : executionStatus === 'running' ? 'running' : 'paused',
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
      activeNodeId: step.nodeId,
      activePhase: step.phase,
      highlightedListenerId: step.listenerId ?? null,
      executionStatus: 'paused',
    });
  },

  run: () => {
    const { intervalId, executionSpeed, currentScenario } = get();
    if (intervalId !== null || !currentScenario) return;

    // Initialize generator if needed
    if (get().generator === null) {
      const gen = simulateEventPropagation(
        currentScenario.tree,
        currentScenario.targetNodeId,
        currentScenario.eventType
      );
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

export function useEventStore<T>(selector: (state: EventStore) => T): T {
  return useStore(eventStore, selector);
}
