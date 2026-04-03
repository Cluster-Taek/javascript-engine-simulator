// ─── Virtual DOM ───

export interface VNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  key: string | null;
  children: VNode[];
}

// ─── Fiber / Effects ───

export type EffectTag = 'PLACEMENT' | 'UPDATE' | 'DELETION';

export interface PropChange {
  prop: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface DiffOperation {
  type: EffectTag;
  nodeId: string;
  path: string;
  propChanges: PropChange[];
  oldNode?: VNode;
  newNode?: VNode;
}

// ─── DOM Snapshot ───

export interface DomSnapshot {
  id: string;
  tag: string;
  props: Record<string, unknown>;
  children: DomSnapshot[];
  text?: string;
}

// ─── Reconciliation Steps ───

export type ReconciliationStepKind =
  | 'initial-render'
  | 'state-change'
  | 'build-new-tree'
  | 'diff-begin'
  | 'diff-compare-node'
  | 'diff-same-type'
  | 'diff-different-type'
  | 'diff-key-match'
  | 'diff-key-new'
  | 'diff-key-removed'
  | 'diff-recurse-children'
  | 'commit-placement'
  | 'commit-update'
  | 'commit-deletion'
  | 'commit-complete'
  | 'reconciliation-complete';

export interface ReconciliationStep {
  id: string;
  kind: ReconciliationStepKind;
  description: string;
  oldTree: VNode | null;
  newTree: VNode | null;
  focusedOldNodeId: string | null;
  focusedNewNodeId: string | null;
  diffOperations: DiffOperation[];
  renderedDom: DomSnapshot | null;
  componentState: Record<string, unknown>;
  consoleOutput: string[];
}

// ─── Scenario ───

export interface StateTransition {
  label: string;
  labelKey: string;
  stateChanges: Record<string, unknown>;
}

export interface ReconciliationScenario {
  name: string;
  nameKey: string;
  code: string;
  initialState: Record<string, unknown>;
  stateTransitions: StateTransition[];
  renderFn: (state: Record<string, unknown>) => VNode;
}
