import { type StepResult, type EnvironmentSnapshot, type ValueNode } from '@/shared/lib/engine';
import { type ThisBindingRule, type ThisBindingEntry } from './types';

let entryCounter = 0;

export function resetEntryCounter(): void {
  entryCounter = 0;
}

interface ThisBindingInfo {
  found: boolean;
  value: string;
  valueNode?: ValueNode;
}

function findThisBinding(environments: readonly EnvironmentSnapshot[]): ThisBindingInfo {
  const topEnv = environments[0];
  if (!topEnv) return { found: false, value: 'undefined' };

  const thisBinding = topEnv.bindings.find((b) => b.name === 'this');
  if (!thisBinding) return { found: false, value: 'undefined' };

  return { found: true, value: thisBinding.value, valueNode: thisBinding.valueNode };
}

function resolveInheritedThis(
  environments: readonly EnvironmentSnapshot[]
): { value: string; valueNode?: ValueNode; scopeLabel: string } | null {
  // Walk outer scopes (skip [0] which is the arrow's own scope)
  for (let i = 1; i < environments.length; i++) {
    const env = environments[i];
    const thisBinding = env.bindings.find((b) => b.name === 'this');
    if (thisBinding) {
      return {
        value: thisBinding.value,
        valueNode: thisBinding.valueNode,
        scopeLabel: env.label,
      };
    }
  }
  return null;
}

function extractObjectName(callExpression: string): string {
  // "obj.method(args)" → "obj"
  const dotIdx = callExpression.indexOf('.');
  if (dotIdx > 0) return callExpression.slice(0, dotIdx);
  return callExpression;
}

function extractFnName(callExpression: string): string {
  // "funcName(args)" → "funcName"
  const parenIdx = callExpression.indexOf('(');
  if (parenIdx > 0) {
    const name = callExpression.slice(0, parenIdx);
    const dotIdx = name.lastIndexOf('.');
    return dotIdx >= 0 ? name.slice(dotIdx + 1) : name;
  }
  return callExpression;
}

export function deriveThisBindingRule(step: StepResult): ThisBindingRule | null {
  if (step.kind !== 'enter-function') return null;

  if (step.description.startsWith('new ')) return 'new';

  const { found, value } = findThisBinding(step.environments);

  if (!found) return 'arrow';
  if (value === 'undefined') return 'default';
  return 'implicit';
}

export function deriveThisBindingEntry(step: StepResult): ThisBindingEntry | null {
  const rule = deriveThisBindingRule(step);
  if (rule === null) return null;

  const { value, valueNode } = findThisBinding(step.environments);

  // Extract call expression from description
  let callExpression = step.description;
  if (callExpression.startsWith('Calling function: ')) {
    callExpression = callExpression.slice('Calling function: '.length);
  } else if (callExpression.startsWith('Calling async function: ')) {
    callExpression = callExpression.slice('Calling async function: '.length);
  }

  // Arrow: resolve inherited this
  let thisValue: string;
  let thisValueNode: ValueNode | undefined;
  let inheritedFromScope: string | undefined;
  let explanationKey: string;
  let explanationParams: Record<string, string> | undefined;

  if (rule === 'arrow') {
    const inherited = resolveInheritedThis(step.environments);
    if (inherited) {
      thisValue = inherited.value;
      thisValueNode = inherited.valueNode;
      inheritedFromScope = inherited.scopeLabel;
      explanationKey = 'explainArrow';
      explanationParams = { scope: inherited.scopeLabel };
    } else {
      thisValue = 'undefined';
      explanationKey = 'explainArrow';
      explanationParams = { scope: 'global' };
    }
  } else if (rule === 'new') {
    thisValue = value;
    thisValueNode = valueNode;
    explanationKey = 'explainNew';
  } else if (rule === 'implicit') {
    thisValue = value;
    thisValueNode = valueNode;
    const objName = extractObjectName(callExpression);
    explanationKey = 'explainImplicit';
    explanationParams = { object: objName };
  } else {
    // default / lost
    thisValue = value;
    thisValueNode = valueNode;
    const fnName = extractFnName(callExpression);
    explanationKey = 'explainDefault';
    explanationParams = { name: fnName };
  }

  return {
    id: `this-entry-${++entryCounter}`,
    callExpression,
    rule,
    thisValue,
    thisValueNode,
    inheritedFromScope,
    explanationKey,
    explanationParams,
    line: step.loc?.start.line,
    active: true,
  };
}
