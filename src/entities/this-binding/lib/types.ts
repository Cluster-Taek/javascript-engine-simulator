import { type ValueNode } from '@/shared/lib/engine';

export type ThisBindingRule = 'new' | 'implicit' | 'default' | 'arrow' | 'lost';

export interface ThisBindingEntry {
  readonly id: string;
  readonly callExpression: string;
  readonly rule: ThisBindingRule;
  readonly thisValue: string;
  readonly thisValueNode?: ValueNode;
  readonly inheritedFromScope?: string;
  readonly explanationKey: string;
  readonly explanationParams?: Record<string, string>;
  readonly line?: number;
  readonly active: boolean;
}

export const RULE_COLORS: Record<ThisBindingRule, { bg: string; border: string; dot: string; text: string }> = {
  new: {
    bg: 'bg-purple-900/60',
    border: 'border-purple-500',
    dot: 'bg-purple-500',
    text: 'text-purple-400',
  },
  implicit: {
    bg: 'bg-blue-900/60',
    border: 'border-blue-500',
    dot: 'bg-blue-500',
    text: 'text-blue-400',
  },
  default: {
    bg: 'bg-gray-800',
    border: 'border-gray-600',
    dot: 'bg-gray-500',
    text: 'text-gray-400',
  },
  arrow: {
    bg: 'bg-amber-900/60',
    border: 'border-amber-500',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
  },
  lost: {
    bg: 'bg-red-900/60',
    border: 'border-red-500',
    dot: 'bg-red-500',
    text: 'text-red-400',
  },
};

export const RULE_INLINE_CLASSES: Record<ThisBindingRule, string> = {
  new: 'this-kw-new',
  implicit: 'this-kw-implicit',
  default: 'this-kw-default',
  arrow: 'this-kw-arrow',
  lost: 'this-kw-lost',
};
