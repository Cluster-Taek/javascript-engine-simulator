'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { type HeapEnvironmentSnapshot } from '@/shared/lib/engine';
import { HeapEnvironmentCard } from './HeapEnvironmentCard';

interface HeapMemoryPanelProps {
  heapSnapshot: readonly HeapEnvironmentSnapshot[];
}

interface TreeNode {
  env: HeapEnvironmentSnapshot;
  children: TreeNode[];
  depth: number;
}

function buildTree(envs: readonly HeapEnvironmentSnapshot[]): TreeNode[] {
  const envMap = new Map<string, HeapEnvironmentSnapshot>();
  for (const env of envs) {
    envMap.set(env.id, env);
  }

  const childrenMap = new Map<string, HeapEnvironmentSnapshot[]>();
  const roots: HeapEnvironmentSnapshot[] = [];

  for (const env of envs) {
    if (env.parentId === null || !envMap.has(env.parentId)) {
      roots.push(env);
    } else {
      const siblings = childrenMap.get(env.parentId) ?? [];
      siblings.push(env);
      childrenMap.set(env.parentId, siblings);
    }
  }

  function buildNode(env: HeapEnvironmentSnapshot, depth: number): TreeNode {
    const children = (childrenMap.get(env.id) ?? []).map((child) => buildNode(child, depth + 1));
    return { env, children, depth };
  }

  return roots.map((r) => buildNode(r, 0));
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function walk(node: TreeNode) {
    result.push(node);
    for (const child of node.children) {
      walk(child);
    }
  }
  for (const node of nodes) {
    walk(node);
  }
  return result;
}

export function HeapMemoryPanel({ heapSnapshot }: HeapMemoryPanelProps) {
  const t = useTranslations('heapPanel');

  const envMap = useMemo(() => {
    const map = new Map<string, HeapEnvironmentSnapshot>();
    for (const env of heapSnapshot) {
      map.set(env.id, env);
    }
    return map;
  }, [heapSnapshot]);

  const flatNodes = useMemo(() => {
    const tree = buildTree(heapSnapshot);
    return flattenTree(tree);
  }, [heapSnapshot]);

  if (flatNodes.length === 0) {
    return <div className="text-xs text-gray-500 italic p-3">{t('emptyHeap')}</div>;
  }

  return (
    <div className="p-2 space-y-0.5">
      <AnimatePresence mode="popLayout">
        {flatNodes.map(({ env, depth }) => {
          const parentLabel = env.parentId ? envMap.get(env.parentId)?.label : undefined;
          return (
            <motion.div
              key={env.id}
              layout
              layoutId={`heap-env-${env.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
            >
              <HeapEnvironmentCard env={env} depth={depth} parentLabel={parentLabel} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
