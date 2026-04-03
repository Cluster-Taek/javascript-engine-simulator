import { type VNode } from './types';

let nodeIdCounter = 0;

export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

function nextNodeId(): string {
  return `vn-${++nodeIdCounter}`;
}

export function h(type: string, props: Record<string, unknown> | null, ...children: (VNode | string)[]): VNode {
  const resolvedProps = props ?? {};
  const key = (resolvedProps.key as string | null) ?? null;
  const cleanProps = { ...resolvedProps };
  delete cleanProps.key;

  return {
    id: nextNodeId(),
    type,
    props: cleanProps,
    key,
    children: children.map((child) => (typeof child === 'string' ? text(child) : child)),
  };
}

export function text(content: string): VNode {
  return {
    id: nextNodeId(),
    type: '#text',
    props: { nodeValue: content },
    key: null,
    children: [],
  };
}
