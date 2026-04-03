import { resetNodeIdCounter } from './builder';
import {
  type VNode,
  type DiffOperation,
  type DomSnapshot,
  type ReconciliationStep,
  type ReconciliationStepKind,
  type ReconciliationScenario,
  type PropChange,
} from './types';

let stepIdCounter = 0;

function nextStepId(): string {
  return `rs-${++stepIdCounter}`;
}

export function resetStepIdCounter(): void {
  stepIdCounter = 0;
}

// ─── VNode → DomSnapshot ───

function vnodeToDom(node: VNode): DomSnapshot {
  if (node.type === '#text') {
    return {
      id: node.id,
      tag: '#text',
      props: {},
      children: [],
      text: node.props.nodeValue as string,
    };
  }
  return {
    id: node.id,
    tag: node.type,
    props: { ...node.props },
    children: node.children.map(vnodeToDom),
  };
}

// ─── Step factory ───

function createStep(
  kind: ReconciliationStepKind,
  description: string,
  state: {
    oldTree: VNode | null;
    newTree: VNode | null;
    focusedOldNodeId: string | null;
    focusedNewNodeId: string | null;
    diffOperations: DiffOperation[];
    renderedDom: DomSnapshot | null;
    componentState: Record<string, unknown>;
    consoleOutput: string[];
  }
): ReconciliationStep {
  return {
    id: nextStepId(),
    kind,
    description,
    oldTree: state.oldTree,
    newTree: state.newTree,
    focusedOldNodeId: state.focusedOldNodeId,
    focusedNewNodeId: state.focusedNewNodeId,
    diffOperations: [...state.diffOperations],
    renderedDom: state.renderedDom,
    componentState: { ...state.componentState },
    consoleOutput: [...state.consoleOutput],
  };
}

// ─── Diff helpers ───

function diffProps(oldNode: VNode, newNode: VNode): PropChange[] {
  const changes: PropChange[] = [];
  const allKeys = new Set([...Object.keys(oldNode.props), ...Object.keys(newNode.props)]);

  for (const key of allKeys) {
    const oldVal = oldNode.props[key];
    const newVal = newNode.props[key];
    if (oldVal !== newVal) {
      changes.push({ prop: key, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}

function buildPath(ancestors: string[], nodeType: string): string {
  return [...ancestors, nodeType].join(' > ');
}

// ─── Apply DomSnapshot mutations ───

function applyOperationsToDom(dom: DomSnapshot, operations: DiffOperation[]): DomSnapshot {
  let result = structuredClone(dom);

  for (const op of operations) {
    if (op.type === 'UPDATE' && op.newNode) {
      result = updateDomNode(result, op.nodeId, op.newNode);
    } else if (op.type === 'PLACEMENT' && op.newNode) {
      result = placeDomNode(result, op.path, op.newNode);
    } else if (op.type === 'DELETION') {
      result = deleteDomNode(result, op.nodeId);
    }
  }

  return result;
}

function updateDomNode(dom: DomSnapshot, nodeId: string, newNode: VNode): DomSnapshot {
  if (dom.id === nodeId) {
    return vnodeToDom(newNode);
  }
  return {
    ...dom,
    children: dom.children.map((child) => updateDomNode(child, nodeId, newNode)),
  };
}

function placeDomNode(dom: DomSnapshot, path: string, newNode: VNode): DomSnapshot {
  // Find parent from path and add child
  const parts = path.split(' > ');
  const parentTag = parts[parts.length - 2];
  if (dom.tag === parentTag || parts.length <= 2) {
    return {
      ...dom,
      children: [...dom.children, vnodeToDom(newNode)],
    };
  }
  return {
    ...dom,
    children: dom.children.map((child) => placeDomNode(child, path, newNode)),
  };
}

function deleteDomNode(dom: DomSnapshot, nodeId: string): DomSnapshot {
  return {
    ...dom,
    children: dom.children.filter((child) => child.id !== nodeId).map((child) => deleteDomNode(child, nodeId)),
  };
}

// ─── Main reconciler generator ───

export function* reconcile(
  scenario: ReconciliationScenario,
  transitionIndex: number
): Generator<ReconciliationStep, void, void> {
  resetStepIdCounter();
  resetNodeIdCounter();

  const state = {
    oldTree: null as VNode | null,
    newTree: null as VNode | null,
    focusedOldNodeId: null as string | null,
    focusedNewNodeId: null as string | null,
    diffOperations: [] as DiffOperation[],
    renderedDom: null as DomSnapshot | null,
    componentState: { ...scenario.initialState },
    consoleOutput: [] as string[],
  };

  // 1. Initial render
  const initialTree = scenario.renderFn(state.componentState);
  state.oldTree = initialTree;
  state.renderedDom = vnodeToDom(initialTree);
  state.consoleOutput.push(`Initial render: built VNode tree (root: <${initialTree.type}>)`);

  yield createStep(
    'initial-render',
    `Initial render: <${initialTree.type}> with ${countNodes(initialTree)} nodes`,
    state
  );

  // 2. State change
  const transition = scenario.stateTransitions[transitionIndex];
  if (!transition) return;

  const prevState = { ...state.componentState };
  state.componentState = { ...state.componentState, ...transition.stateChanges };
  const changedKeys = Object.keys(transition.stateChanges);
  state.consoleOutput.push(
    `State change: ${changedKeys.map((k) => `${k}: ${JSON.stringify(prevState[k])} → ${JSON.stringify(state.componentState[k])}`).join(', ')}`
  );

  yield createStep('state-change', `State change: ${transition.label}`, state);

  // 3. Build new tree
  resetNodeIdCounter();
  const newTree = scenario.renderFn(state.componentState);
  state.newTree = newTree;
  state.consoleOutput.push(`New VNode tree built: <${newTree.type}> with ${countNodes(newTree)} nodes`);

  yield createStep('build-new-tree', `Build new VNode tree from updated state`, state);

  // 4. Diff begin
  state.diffOperations = [];

  yield createStep('diff-begin', 'Begin diffing old tree vs new tree', state);

  // 5. Recursive diff
  yield* diffNodes(state.oldTree!, state.newTree!, [], state);

  // 6. Commit phase
  if (state.diffOperations.length === 0) {
    state.consoleOutput.push('No changes detected — DOM unchanged');
    yield createStep('commit-complete', 'No changes to commit', state);
  } else {
    for (const op of state.diffOperations) {
      const nodeLabel = op.newNode?.type ?? op.oldNode?.type ?? 'unknown';

      if (op.type === 'PLACEMENT') {
        state.renderedDom = applyOperationsToDom(state.renderedDom!, [op]);
        state.consoleOutput.push(`DOM: Insert <${nodeLabel}> at ${op.path}`);
        yield createStep('commit-placement', `Commit: Insert <${nodeLabel}>`, state);
      } else if (op.type === 'UPDATE') {
        state.renderedDom = applyOperationsToDom(state.renderedDom!, [op]);
        const propStr = op.propChanges.map((c) => c.prop).join(', ');
        state.consoleOutput.push(`DOM: Update <${nodeLabel}> props: ${propStr}`);
        yield createStep('commit-update', `Commit: Update <${nodeLabel}> (${propStr})`, state);
      } else if (op.type === 'DELETION') {
        state.renderedDom = applyOperationsToDom(state.renderedDom!, [op]);
        state.consoleOutput.push(`DOM: Remove <${nodeLabel}>`);
        yield createStep('commit-deletion', `Commit: Remove <${nodeLabel}>`, state);
      }
    }

    yield createStep(
      'commit-complete',
      `Commit complete: ${state.diffOperations.length} DOM operations applied`,
      state
    );
  }

  // 7. Reconciliation complete
  state.oldTree = state.newTree;
  state.newTree = null;
  state.focusedOldNodeId = null;
  state.focusedNewNodeId = null;

  yield createStep('reconciliation-complete', 'Reconciliation complete', state);
}

// ─── Recursive diff generator ───

function* diffNodes(
  oldNode: VNode,
  newNode: VNode,
  ancestors: string[],
  state: {
    oldTree: VNode | null;
    newTree: VNode | null;
    focusedOldNodeId: string | null;
    focusedNewNodeId: string | null;
    diffOperations: DiffOperation[];
    renderedDom: DomSnapshot | null;
    componentState: Record<string, unknown>;
    consoleOutput: string[];
  }
): Generator<ReconciliationStep, void, void> {
  const path = buildPath(ancestors, newNode.type);

  // Compare node
  state.focusedOldNodeId = oldNode.id;
  state.focusedNewNodeId = newNode.id;

  yield createStep('diff-compare-node', `Compare: <${oldNode.type}> vs <${newNode.type}> at ${path}`, state);

  // Different type → replace entire subtree
  if (oldNode.type !== newNode.type) {
    state.consoleOutput.push(`Type changed: <${oldNode.type}> → <${newNode.type}> — replace subtree`);
    state.diffOperations.push({
      type: 'DELETION',
      nodeId: oldNode.id,
      path,
      propChanges: [],
      oldNode,
    });
    state.diffOperations.push({
      type: 'PLACEMENT',
      nodeId: newNode.id,
      path,
      propChanges: [],
      newNode,
    });

    yield createStep('diff-different-type', `Different type: <${oldNode.type}> → <${newNode.type}> — replace`, state);
    return;
  }

  // Same type → compare props
  const propChanges = diffProps(oldNode, newNode);
  if (propChanges.length > 0) {
    state.consoleOutput.push(
      `Same type <${oldNode.type}>: props changed (${propChanges.map((c) => c.prop).join(', ')})`
    );
    state.diffOperations.push({
      type: 'UPDATE',
      nodeId: oldNode.id,
      path,
      propChanges,
      oldNode,
      newNode,
    });
  } else {
    state.consoleOutput.push(`Same type <${oldNode.type}>: no prop changes`);
  }

  yield createStep(
    'diff-same-type',
    propChanges.length > 0
      ? `Same type <${oldNode.type}>: ${propChanges.length} prop(s) changed`
      : `Same type <${oldNode.type}>: identical props`,
    state
  );

  // Recurse children
  if (oldNode.children.length > 0 || newNode.children.length > 0) {
    yield createStep(
      'diff-recurse-children',
      `Recurse into children of <${oldNode.type}> (${oldNode.children.length} old, ${newNode.children.length} new)`,
      state
    );

    const hasKeys = oldNode.children.some((c) => c.key !== null) || newNode.children.some((c) => c.key !== null);

    if (hasKeys) {
      yield* diffKeyedChildren(oldNode, newNode, ancestors, state);
    } else {
      yield* diffUnkeyedChildren(oldNode, newNode, ancestors, state);
    }
  }
}

// ─── Keyed children diff ───

function* diffKeyedChildren(
  oldParent: VNode,
  newParent: VNode,
  ancestors: string[],
  state: {
    oldTree: VNode | null;
    newTree: VNode | null;
    focusedOldNodeId: string | null;
    focusedNewNodeId: string | null;
    diffOperations: DiffOperation[];
    renderedDom: DomSnapshot | null;
    componentState: Record<string, unknown>;
    consoleOutput: string[];
  }
): Generator<ReconciliationStep, void, void> {
  const oldByKey = new Map<string, VNode>();
  for (const child of oldParent.children) {
    if (child.key !== null) oldByKey.set(child.key, child);
  }

  const matchedOldKeys = new Set<string>();

  // Match new children to old by key
  for (const newChild of newParent.children) {
    if (newChild.key === null) continue;
    const oldChild = oldByKey.get(newChild.key);

    if (oldChild) {
      matchedOldKeys.add(newChild.key);
      state.focusedOldNodeId = oldChild.id;
      state.focusedNewNodeId = newChild.id;

      yield createStep('diff-key-match', `Key "${newChild.key}" matched — reuse <${oldChild.type}>`, state);

      yield* diffNodes(oldChild, newChild, [...ancestors, oldParent.type], state);
    } else {
      state.focusedOldNodeId = null;
      state.focusedNewNodeId = newChild.id;
      state.consoleOutput.push(`New key "${newChild.key}": insert <${newChild.type}>`);
      state.diffOperations.push({
        type: 'PLACEMENT',
        nodeId: newChild.id,
        path: buildPath([...ancestors, newParent.type], newChild.type),
        propChanges: [],
        newNode: newChild,
      });

      yield createStep('diff-key-new', `New key "${newChild.key}" — insert <${newChild.type}>`, state);
    }
  }

  // Removed keys
  for (const oldChild of oldParent.children) {
    if (oldChild.key !== null && !matchedOldKeys.has(oldChild.key)) {
      state.focusedOldNodeId = oldChild.id;
      state.focusedNewNodeId = null;
      state.consoleOutput.push(`Key "${oldChild.key}" removed: delete <${oldChild.type}>`);
      state.diffOperations.push({
        type: 'DELETION',
        nodeId: oldChild.id,
        path: buildPath([...ancestors, oldParent.type], oldChild.type),
        propChanges: [],
        oldNode: oldChild,
      });

      yield createStep('diff-key-removed', `Key "${oldChild.key}" removed — delete <${oldChild.type}>`, state);
    }
  }
}

// ─── Unkeyed children diff ───

function* diffUnkeyedChildren(
  oldParent: VNode,
  newParent: VNode,
  ancestors: string[],
  state: {
    oldTree: VNode | null;
    newTree: VNode | null;
    focusedOldNodeId: string | null;
    focusedNewNodeId: string | null;
    diffOperations: DiffOperation[];
    renderedDom: DomSnapshot | null;
    componentState: Record<string, unknown>;
    consoleOutput: string[];
  }
): Generator<ReconciliationStep, void, void> {
  const maxLen = Math.max(oldParent.children.length, newParent.children.length);

  for (let i = 0; i < maxLen; i++) {
    const oldChild = oldParent.children[i];
    const newChild = newParent.children[i];

    if (oldChild && newChild) {
      yield* diffNodes(oldChild, newChild, [...ancestors, oldParent.type], state);
    } else if (!oldChild && newChild) {
      // New child added
      state.focusedOldNodeId = null;
      state.focusedNewNodeId = newChild.id;
      state.consoleOutput.push(`Child added at index ${i}: <${newChild.type}>`);
      state.diffOperations.push({
        type: 'PLACEMENT',
        nodeId: newChild.id,
        path: buildPath([...ancestors, newParent.type], newChild.type),
        propChanges: [],
        newNode: newChild,
      });

      yield createStep('commit-placement', `New child at index ${i}: <${newChild.type}>`, state);
    } else if (oldChild && !newChild) {
      // Child removed
      state.focusedOldNodeId = oldChild.id;
      state.focusedNewNodeId = null;
      state.consoleOutput.push(`Child removed at index ${i}: <${oldChild.type}>`);
      state.diffOperations.push({
        type: 'DELETION',
        nodeId: oldChild.id,
        path: buildPath([...ancestors, oldParent.type], oldChild.type),
        propChanges: [],
        oldNode: oldChild,
      });

      yield createStep('commit-deletion', `Removed child at index ${i}: <${oldChild.type}>`, state);
    }
  }
}

// ─── Utility ───

function countNodes(node: VNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
