export type EventPhase = 'capturing' | 'target' | 'bubbling';

export interface VirtualEventListener {
  id: string;
  type: string;
  useCapture: boolean;
  handler: string;
  handlerBody: string;
  stopsPropagation?: boolean;
  stopsImmediatePropagation?: boolean;
  preventsDefault?: boolean;
}

export interface VirtualDomNode {
  id: string;
  tag: string;
  label: string;
  children: VirtualDomNode[];
  listeners: VirtualEventListener[];
  hasDefaultBehavior?: string;
}

export interface DomTree {
  root: VirtualDomNode;
}

export type PropagationStepKind =
  | 'phase-start'
  | 'node-enter'
  | 'listener-execute'
  | 'stop-propagation'
  | 'stop-immediate'
  | 'prevent-default'
  | 'node-skip'
  | 'propagation-complete';

export interface PropagationStep {
  id: string;
  kind: PropagationStepKind;
  phase: EventPhase;
  nodeId: string;
  nodeLabel: string;
  listenerId?: string;
  listenerName?: string;
  description: string;
  consoleOutput: string[];
  propagationStopped: boolean;
  defaultPrevented: boolean;
  capturePath: string[];
  bubblePath: string[];
  currentPathIndex: number;
}

export interface EventScenario {
  name: string;
  nameKey: string;
  tree: DomTree;
  targetNodeId: string;
  eventType: string;
  code: string;
}
