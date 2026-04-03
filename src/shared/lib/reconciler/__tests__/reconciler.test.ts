import { describe, it, expect, beforeEach } from 'vitest';
import { reconcile, h, text, resetNodeIdCounter, resetStepIdCounter } from '../index';
import { type ReconciliationScenario, type ReconciliationStep } from '../types';

function collectSteps(gen: Generator<ReconciliationStep, void, void>): ReconciliationStep[] {
  const steps: ReconciliationStep[] = [];
  for (const step of gen) {
    steps.push(step);
  }
  return steps;
}

function makeScenario(overrides: Partial<ReconciliationScenario>): ReconciliationScenario {
  return {
    name: 'Test',
    nameKey: 'test',
    code: '',
    initialState: {},
    stateTransitions: [],
    renderFn: () => h('div', null),
    ...overrides,
  };
}

describe('reconciler', () => {
  beforeEach(() => {
    resetStepIdCounter();
    resetNodeIdCounter();
  });

  it('yields initial-render step', () => {
    const scenario = makeScenario({
      renderFn: () => h('div', { className: 'root' }, h('span', null, text('hello'))),
      stateTransitions: [{ label: 'test', labelKey: 'test', stateChanges: {} }],
    });

    const steps = collectSteps(reconcile(scenario, 0));
    expect(steps[0].kind).toBe('initial-render');
    expect(steps[0].renderedDom).toBeTruthy();
    expect(steps[0].renderedDom!.tag).toBe('div');
  });

  it('yields state-change and build-new-tree steps', () => {
    const scenario = makeScenario({
      initialState: { count: 0 },
      stateTransitions: [{ label: 'increment', labelKey: 'inc', stateChanges: { count: 1 } }],
      renderFn: (state) => h('div', null, text(`Count: ${state.count}`)),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const kinds = steps.map((s) => s.kind);
    expect(kinds).toContain('state-change');
    expect(kinds).toContain('build-new-tree');
  });

  it('detects same-type diffing with prop changes', () => {
    const scenario = makeScenario({
      initialState: { cls: 'red' },
      stateTransitions: [{ label: 'change class', labelKey: 'cls', stateChanges: { cls: 'blue' } }],
      renderFn: (state) => h('div', { className: state.cls }),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const sameType = steps.find((s) => s.kind === 'diff-same-type');
    expect(sameType).toBeTruthy();
    expect(sameType!.diffOperations.length).toBeGreaterThan(0);
    expect(sameType!.diffOperations[0].type).toBe('UPDATE');
  });

  it('detects different-type diffing', () => {
    const scenario = makeScenario({
      initialState: { tag: 'div' },
      stateTransitions: [{ label: 'change tag', labelKey: 'tag', stateChanges: { tag: 'span' } }],
      renderFn: (state) => h('div', null, state.tag === 'div' ? h('div', null, text('A')) : h('span', null, text('B'))),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const diffType = steps.find((s) => s.kind === 'diff-different-type');
    expect(diffType).toBeTruthy();
  });

  it('handles key-based reconciliation', () => {
    const scenario = makeScenario({
      initialState: { items: ['a', 'b', 'c'] },
      stateTransitions: [{ label: 'reorder', labelKey: 'reorder', stateChanges: { items: ['c', 'a'] } }],
      renderFn: (state) =>
        h('ul', null, ...(state.items as string[]).map((item) => h('li', { key: item }, text(item)))),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const keyMatch = steps.filter((s) => s.kind === 'diff-key-match');
    const keyRemoved = steps.filter((s) => s.kind === 'diff-key-removed');
    expect(keyMatch.length).toBeGreaterThan(0);
    expect(keyRemoved.length).toBe(1); // 'b' removed
  });

  it('handles children addition (unkeyed)', () => {
    const scenario = makeScenario({
      initialState: { count: 1 },
      stateTransitions: [{ label: 'add child', labelKey: 'add', stateChanges: { count: 3 } }],
      renderFn: (state) =>
        h('div', null, ...Array.from({ length: state.count as number }, (_, i) => h('p', null, text(`Item ${i}`)))),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const placements = steps.filter((s) => s.kind === 'commit-placement' && s.description.includes('New child'));
    expect(placements.length).toBe(2); // 2 new children added
  });

  it('handles children removal (unkeyed)', () => {
    const scenario = makeScenario({
      initialState: { count: 3 },
      stateTransitions: [{ label: 'remove', labelKey: 'rm', stateChanges: { count: 1 } }],
      renderFn: (state) =>
        h('div', null, ...Array.from({ length: state.count as number }, (_, i) => h('p', null, text(`Item ${i}`)))),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const deletions = steps.filter((s) => s.kind === 'commit-deletion' && s.description.includes('Removed child'));
    expect(deletions.length).toBe(2);
  });

  it('ends with reconciliation-complete', () => {
    const scenario = makeScenario({
      initialState: { x: 1 },
      stateTransitions: [{ label: 'change', labelKey: 'ch', stateChanges: { x: 2 } }],
      renderFn: (state) => h('div', null, text(`${state.x}`)),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    expect(steps[steps.length - 1].kind).toBe('reconciliation-complete');
  });

  it('commit phase applies all operations', () => {
    const scenario = makeScenario({
      initialState: { cls: 'red' },
      stateTransitions: [{ label: 'change', labelKey: 'ch', stateChanges: { cls: 'blue' } }],
      renderFn: (state) => h('div', { className: state.cls }, text('hello')),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    const commitComplete = steps.find((s) => s.kind === 'commit-complete');
    expect(commitComplete).toBeTruthy();
    expect(commitComplete!.renderedDom).toBeTruthy();
  });

  it('full scenario end-to-end produces valid step sequence', () => {
    const scenario = makeScenario({
      initialState: { count: 0, show: true },
      stateTransitions: [{ label: 'increment', labelKey: 'inc', stateChanges: { count: 1 } }],
      renderFn: (state) =>
        h(
          'div',
          { className: 'app' },
          h('h1', null, text('Counter')),
          h('span', null, text(`${state.count}`)),
          (state.show as boolean) ? h('p', null, text('visible')) : h('p', null, text('visible'))
        ),
    });

    const steps = collectSteps(reconcile(scenario, 0));

    // Must start with initial-render and end with reconciliation-complete
    expect(steps[0].kind).toBe('initial-render');
    expect(steps[steps.length - 1].kind).toBe('reconciliation-complete');

    // All steps have valid ids
    const ids = steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Console output accumulates
    const lastStep = steps[steps.length - 1];
    expect(lastStep.consoleOutput.length).toBeGreaterThan(0);
  });

  it('returns only initial-render when transitionIndex is out of bounds', () => {
    const scenario = makeScenario({
      stateTransitions: [],
      renderFn: () => h('div', null),
    });

    const steps = collectSteps(reconcile(scenario, 0));
    expect(steps.length).toBe(1);
    expect(steps[0].kind).toBe('initial-render');
  });
});
