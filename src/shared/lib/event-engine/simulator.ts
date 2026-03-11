import {
  type DomTree,
  type VirtualDomNode,
  type VirtualEventListener,
  type PropagationStep,
  type EventPhase,
} from './types';

let stepIdCounter = 0;

function nextStepId(): string {
  return `es-${++stepIdCounter}`;
}

export function resetStepIdCounter(): void {
  stepIdCounter = 0;
}

function findPathToNode(node: VirtualDomNode, targetId: string): VirtualDomNode[] | null {
  if (node.id === targetId) return [node];
  for (const child of node.children) {
    const path = findPathToNode(child, targetId);
    if (path) return [node, ...path];
  }
  return null;
}

function createStep(
  kind: PropagationStep['kind'],
  phase: EventPhase,
  node: VirtualDomNode,
  description: string,
  state: {
    consoleOutput: string[];
    propagationStopped: boolean;
    defaultPrevented: boolean;
    capturePath: string[];
    bubblePath: string[];
    currentPathIndex: number;
  },
  listener?: VirtualEventListener
): PropagationStep {
  return {
    id: nextStepId(),
    kind,
    phase,
    nodeId: node.id,
    nodeLabel: node.label,
    listenerId: listener?.id,
    listenerName: listener?.handler,
    description,
    consoleOutput: [...state.consoleOutput],
    propagationStopped: state.propagationStopped,
    defaultPrevented: state.defaultPrevented,
    capturePath: state.capturePath,
    bubblePath: state.bubblePath,
    currentPathIndex: state.currentPathIndex,
  };
}

export function* simulateEventPropagation(
  tree: DomTree,
  targetNodeId: string,
  eventType: string
): Generator<PropagationStep, void, void> {
  resetStepIdCounter();

  const path = findPathToNode(tree.root, targetNodeId);
  if (!path || path.length === 0) return;

  const capturePath = path.map((n) => n.id);
  const bubblePath = [...capturePath].reverse();

  const state = {
    consoleOutput: [] as string[],
    propagationStopped: false,
    defaultPrevented: false,
    capturePath,
    bubblePath,
    currentPathIndex: 0,
  };

  const targetNode = path[path.length - 1];

  // === CAPTURING PHASE ===
  yield createStep('phase-start', 'capturing', path[0], `Capturing phase begins (${eventType} event)`, {
    ...state,
    currentPathIndex: 0,
  });

  // Traverse from root to parent of target (exclude target itself)
  for (let i = 0; i < path.length - 1; i++) {
    const node = path[i];
    state.currentPathIndex = i;

    if (state.propagationStopped) break;

    yield createStep('node-enter', 'capturing', node, `Capturing: enter ${node.label}`, state);

    const captureListeners = node.listeners.filter((l) => l.type === eventType && l.useCapture);

    if (captureListeners.length === 0) {
      yield createStep('node-skip', 'capturing', node, `No capture listener on ${node.label}`, state);
    } else {
      for (const listener of captureListeners) {
        if (state.propagationStopped) break;

        state.consoleOutput.push(`[capture] ${node.label}: ${listener.handler}() — ${listener.handlerBody}`);
        yield createStep(
          'listener-execute',
          'capturing',
          node,
          `Execute ${listener.handler}() on ${node.label} (capture)`,
          state,
          listener
        );

        if (listener.stopsImmediatePropagation) {
          state.propagationStopped = true;
          yield createStep(
            'stop-immediate',
            'capturing',
            node,
            `stopImmediatePropagation() called in ${listener.handler}()`,
            state,
            listener
          );
          break;
        }

        if (listener.stopsPropagation) {
          state.propagationStopped = true;
          yield createStep(
            'stop-propagation',
            'capturing',
            node,
            `stopPropagation() called in ${listener.handler}()`,
            state,
            listener
          );
          break;
        }

        if (listener.preventsDefault) {
          state.defaultPrevented = true;
          yield createStep(
            'prevent-default',
            'capturing',
            node,
            `preventDefault() called in ${listener.handler}()`,
            state,
            listener
          );
        }
      }
    }
  }

  // === TARGET PHASE ===
  if (!state.propagationStopped) {
    state.currentPathIndex = path.length - 1;

    yield createStep('phase-start', 'target', targetNode, `Target phase on ${targetNode.label}`, state);

    yield createStep('node-enter', 'target', targetNode, `Target: enter ${targetNode.label}`, state);

    // At target: all listeners fire regardless of useCapture, in registration order
    const targetListeners = targetNode.listeners.filter((l) => l.type === eventType);

    if (targetListeners.length === 0) {
      yield createStep('node-skip', 'target', targetNode, `No listener on target ${targetNode.label}`, state);
    } else {
      for (const listener of targetListeners) {
        if (state.propagationStopped) break;

        const phaseLabel = listener.useCapture ? 'capture' : 'bubble';
        state.consoleOutput.push(`[target] ${targetNode.label}: ${listener.handler}() — ${listener.handlerBody}`);
        yield createStep(
          'listener-execute',
          'target',
          targetNode,
          `Execute ${listener.handler}() on ${targetNode.label} (target, ${phaseLabel})`,
          state,
          listener
        );

        if (listener.stopsImmediatePropagation) {
          state.propagationStopped = true;
          yield createStep(
            'stop-immediate',
            'target',
            targetNode,
            `stopImmediatePropagation() called in ${listener.handler}()`,
            state,
            listener
          );
          break;
        }

        if (listener.stopsPropagation) {
          state.propagationStopped = true;
          yield createStep(
            'stop-propagation',
            'target',
            targetNode,
            `stopPropagation() called in ${listener.handler}()`,
            state,
            listener
          );
          break;
        }

        if (listener.preventsDefault) {
          state.defaultPrevented = true;
          yield createStep(
            'prevent-default',
            'target',
            targetNode,
            `preventDefault() called in ${listener.handler}()`,
            state,
            listener
          );
        }
      }
    }
  }

  // === BUBBLING PHASE ===
  if (!state.propagationStopped) {
    yield createStep('phase-start', 'bubbling', targetNode, `Bubbling phase begins`, state);

    // Traverse from parent of target back to root
    for (let i = path.length - 2; i >= 0; i--) {
      const node = path[i];
      state.currentPathIndex = capturePath.length - 1 - i; // index within bubblePath

      if (state.propagationStopped) break;

      yield createStep('node-enter', 'bubbling', node, `Bubbling: enter ${node.label}`, state);

      const bubbleListeners = node.listeners.filter((l) => l.type === eventType && !l.useCapture);

      if (bubbleListeners.length === 0) {
        yield createStep('node-skip', 'bubbling', node, `No bubble listener on ${node.label}`, state);
      } else {
        for (const listener of bubbleListeners) {
          if (state.propagationStopped) break;

          state.consoleOutput.push(`[bubble] ${node.label}: ${listener.handler}() — ${listener.handlerBody}`);
          yield createStep(
            'listener-execute',
            'bubbling',
            node,
            `Execute ${listener.handler}() on ${node.label} (bubble)`,
            state,
            listener
          );

          if (listener.stopsImmediatePropagation) {
            state.propagationStopped = true;
            yield createStep(
              'stop-immediate',
              'bubbling',
              node,
              `stopImmediatePropagation() called in ${listener.handler}()`,
              state,
              listener
            );
            break;
          }

          if (listener.stopsPropagation) {
            state.propagationStopped = true;
            yield createStep(
              'stop-propagation',
              'bubbling',
              node,
              `stopPropagation() called in ${listener.handler}()`,
              state,
              listener
            );
            break;
          }

          if (listener.preventsDefault) {
            state.defaultPrevented = true;
            yield createStep(
              'prevent-default',
              'bubbling',
              node,
              `preventDefault() called in ${listener.handler}()`,
              state,
              listener
            );
          }
        }
      }
    }
  }

  // === COMPLETE ===
  const completeDesc = state.propagationStopped
    ? `Propagation stopped${state.defaultPrevented ? ', default prevented' : ''}`
    : state.defaultPrevented
      ? 'Propagation complete, default prevented'
      : 'Propagation complete';

  yield createStep('propagation-complete', 'bubbling', targetNode, completeDesc, state);
}
