import { describe, it, expect } from 'vitest';
import { simulateEventPropagation } from '../simulator';
import { type DomTree, type PropagationStep } from '../types';

function collectSteps(tree: DomTree, targetId: string, eventType: string): PropagationStep[] {
  const steps: PropagationStep[] = [];
  for (const step of simulateEventPropagation(tree, targetId, eventType)) {
    steps.push(step);
  }
  return steps;
}

const basicTree: DomTree = {
  root: {
    id: 'window',
    tag: 'window',
    label: 'window',
    listeners: [],
    children: [
      {
        id: 'document',
        tag: 'document',
        label: 'document',
        listeners: [{ id: 'l-doc', type: 'click', useCapture: false, handler: 'onDocClick', handlerBody: 'log' }],
        children: [
          {
            id: 'div',
            tag: 'div',
            label: 'div',
            listeners: [{ id: 'l-div', type: 'click', useCapture: false, handler: 'onDivClick', handlerBody: 'log' }],
            children: [
              {
                id: 'btn',
                tag: 'button',
                label: 'button',
                listeners: [
                  { id: 'l-btn', type: 'click', useCapture: false, handler: 'onBtnClick', handlerBody: 'log' },
                ],
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe('simulateEventPropagation', () => {
  it('should generate steps for all three phases', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const phaseStarts = steps.filter((s) => s.kind === 'phase-start');
    expect(phaseStarts).toHaveLength(3);
    expect(phaseStarts[0].phase).toBe('capturing');
    expect(phaseStarts[1].phase).toBe('target');
    expect(phaseStarts[2].phase).toBe('bubbling');
  });

  it('should end with propagation-complete', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const last = steps[steps.length - 1];
    expect(last.kind).toBe('propagation-complete');
  });

  it('should execute bubble listeners in bubbling phase', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const bubbleExecutes = steps.filter((s) => s.phase === 'bubbling' && s.kind === 'listener-execute');
    expect(bubbleExecutes.length).toBeGreaterThanOrEqual(1);
    expect(bubbleExecutes.map((s) => s.listenerName)).toContain('onDivClick');
    expect(bubbleExecutes.map((s) => s.listenerName)).toContain('onDocClick');
  });

  it('should execute target listeners at target phase', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const targetExecutes = steps.filter((s) => s.phase === 'target' && s.kind === 'listener-execute');
    expect(targetExecutes).toHaveLength(1);
    expect(targetExecutes[0].listenerName).toBe('onBtnClick');
  });

  it('should skip nodes without matching listeners in capturing', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const captureSkips = steps.filter((s) => s.phase === 'capturing' && s.kind === 'node-skip');
    // window, document, div all have no capture listeners
    expect(captureSkips.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle stopPropagation', () => {
    const tree: DomTree = {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'parent',
            tag: 'div',
            label: 'div',
            listeners: [{ id: 'l-p', type: 'click', useCapture: false, handler: 'onParent', handlerBody: 'log' }],
            children: [
              {
                id: 'child',
                tag: 'button',
                label: 'button',
                listeners: [
                  {
                    id: 'l-c',
                    type: 'click',
                    useCapture: false,
                    handler: 'onChild',
                    handlerBody: 'stop',
                    stopsPropagation: true,
                  },
                ],
                children: [],
              },
            ],
          },
        ],
      },
    };
    const steps = collectSteps(tree, 'child', 'click');
    const stopStep = steps.find((s) => s.kind === 'stop-propagation');
    expect(stopStep).toBeDefined();
    // parent bubble listener should NOT execute
    const parentExec = steps.find((s) => s.phase === 'bubbling' && s.kind === 'listener-execute');
    expect(parentExec).toBeUndefined();
  });

  it('should handle stopImmediatePropagation', () => {
    const tree: DomTree = {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'btn',
            tag: 'button',
            label: 'button',
            listeners: [
              {
                id: 'l1',
                type: 'click',
                useCapture: false,
                handler: 'first',
                handlerBody: 'stop',
                stopsImmediatePropagation: true,
              },
              { id: 'l2', type: 'click', useCapture: false, handler: 'second', handlerBody: 'log' },
            ],
            children: [],
          },
        ],
      },
    };
    const steps = collectSteps(tree, 'btn', 'click');
    const executes = steps.filter((s) => s.kind === 'listener-execute');
    expect(executes).toHaveLength(1);
    expect(executes[0].listenerName).toBe('first');
    const stopImmediate = steps.find((s) => s.kind === 'stop-immediate');
    expect(stopImmediate).toBeDefined();
  });

  it('should handle preventDefault', () => {
    const tree: DomTree = {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'form',
            tag: 'form',
            label: 'form',
            listeners: [
              {
                id: 'l-f',
                type: 'submit',
                useCapture: false,
                handler: 'onSubmit',
                handlerBody: 'prevent',
                preventsDefault: true,
              },
            ],
            children: [],
            hasDefaultBehavior: 'Form submission',
          },
        ],
      },
    };
    const steps = collectSteps(tree, 'form', 'submit');
    const preventStep = steps.find((s) => s.kind === 'prevent-default');
    expect(preventStep).toBeDefined();
    const last = steps[steps.length - 1];
    expect(last.defaultPrevented).toBe(true);
  });

  it('should track console output across steps', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const lastExec = steps.filter((s) => s.kind === 'listener-execute').pop();
    expect(lastExec).toBeDefined();
    expect(lastExec!.consoleOutput.length).toBeGreaterThan(0);
  });

  it('should track capture and bubble paths', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const first = steps[0];
    expect(first.capturePath).toEqual(['window', 'document', 'div', 'btn']);
    expect(first.bubblePath).toEqual(['btn', 'div', 'document', 'window']);
  });

  it('should return no steps for invalid target', () => {
    const steps = collectSteps(basicTree, 'nonexistent', 'click');
    expect(steps).toHaveLength(0);
  });

  it('should handle capture listeners during capturing phase', () => {
    const tree: DomTree = {
      root: {
        id: 'window',
        tag: 'window',
        label: 'window',
        listeners: [],
        children: [
          {
            id: 'parent',
            tag: 'div',
            label: 'div',
            listeners: [
              { id: 'l-p-c', type: 'click', useCapture: true, handler: 'onParentCapture', handlerBody: 'log' },
            ],
            children: [
              {
                id: 'child',
                tag: 'button',
                label: 'button',
                listeners: [],
                children: [],
              },
            ],
          },
        ],
      },
    };
    const steps = collectSteps(tree, 'child', 'click');
    const captureExec = steps.filter((s) => s.phase === 'capturing' && s.kind === 'listener-execute');
    expect(captureExec).toHaveLength(1);
    expect(captureExec[0].listenerName).toBe('onParentCapture');
  });

  it('should assign unique ids to each step', () => {
    const steps = collectSteps(basicTree, 'btn', 'click');
    const ids = steps.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
