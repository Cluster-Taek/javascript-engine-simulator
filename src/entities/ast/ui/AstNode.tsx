'use client';

import { useState } from 'react';
import { type AstNode as AstNodeType } from '@/shared/lib/engine';

const NODE_COLORS: Partial<Record<string, string>> = {
  Program: 'text-blue-400',
  FunctionDeclaration: 'text-purple-400',
  VariableDeclaration: 'text-yellow-400',
  VariableDeclarator: 'text-yellow-300',
  ExpressionStatement: 'text-gray-300',
  ReturnStatement: 'text-indigo-400',
  IfStatement: 'text-orange-400',
  WhileStatement: 'text-orange-400',
  ForStatement: 'text-orange-400',
  BlockStatement: 'text-gray-400',
  BinaryExpression: 'text-red-400',
  LogicalExpression: 'text-red-300',
  UnaryExpression: 'text-red-300',
  AssignmentExpression: 'text-teal-400',
  UpdateExpression: 'text-teal-300',
  CallExpression: 'text-green-400',
  MemberExpression: 'text-green-300',
  ArrayExpression: 'text-cyan-400',
  ObjectExpression: 'text-cyan-300',
  Identifier: 'text-yellow-200',
  NumericLiteral: 'text-blue-300',
  StringLiteral: 'text-green-200',
  BooleanLiteral: 'text-teal-200',
  NullLiteral: 'text-gray-400',
};

function getNodeLabel(node: AstNodeType): string {
  switch (node.type) {
    case 'Identifier':
      return `Identifier(${node.name})`;
    case 'NumericLiteral':
      return `Number(${node.value})`;
    case 'StringLiteral':
      return `String("${node.value}")`;
    case 'BooleanLiteral':
      return `Boolean(${node.value})`;
    case 'NullLiteral':
      return 'null';
    case 'VariableDeclaration':
      return `${node.type} [${node.kind}]`;
    case 'FunctionDeclaration':
      return `Function(${node.id.name})`;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return `${node.type} [${node.operator}]`;
    case 'AssignmentExpression':
      return `Assignment [${node.operator}]`;
    case 'UpdateExpression':
      return `Update [${node.operator}]`;
    default:
      return node.type;
  }
}

function getChildNodes(node: AstNodeType): Array<{ key: string; node: AstNodeType }> {
  const children: Array<{ key: string; node: AstNodeType }> = [];

  const add = (key: string, child: unknown) => {
    if (child && typeof child === 'object' && 'type' in child) {
      children.push({ key, node: child as AstNodeType });
    }
  };

  const addArr = (key: string, arr: readonly unknown[]) => {
    arr.forEach((item, i) => {
      if (item && typeof item === 'object' && 'type' in item) {
        children.push({ key: `${key}[${i}]`, node: item as AstNodeType });
      }
    });
  };

  switch (node.type) {
    case 'Program':
      addArr('body', node.body);
      break;
    case 'VariableDeclaration':
      addArr('declarations', node.declarations);
      break;
    case 'VariableDeclarator':
      add('id', node.id);
      if (node.init) add('init', node.init);
      break;
    case 'FunctionDeclaration':
      add('id', node.id);
      addArr('params', node.params);
      add('body', node.body);
      break;
    case 'ReturnStatement':
      if (node.argument) add('argument', node.argument);
      break;
    case 'IfStatement':
      add('test', node.test);
      add('consequent', node.consequent);
      if (node.alternate) add('alternate', node.alternate);
      break;
    case 'WhileStatement':
      add('test', node.test);
      add('body', node.body);
      break;
    case 'ForStatement':
      if (node.init) add('init', node.init);
      if (node.test) add('test', node.test);
      if (node.update) add('update', node.update);
      add('body', node.body);
      break;
    case 'BlockStatement':
      addArr('body', node.body);
      break;
    case 'ExpressionStatement':
      add('expression', node.expression);
      break;
    case 'BinaryExpression':
    case 'LogicalExpression':
      add('left', node.left);
      add('right', node.right);
      break;
    case 'UnaryExpression':
      add('argument', node.argument);
      break;
    case 'AssignmentExpression':
      add('left', node.left);
      add('right', node.right);
      break;
    case 'UpdateExpression':
      add('argument', node.argument);
      break;
    case 'CallExpression':
      add('callee', node.callee);
      addArr('arguments', node.arguments);
      break;
    case 'MemberExpression':
      add('object', node.object);
      add('property', node.property);
      break;
    case 'ArrayExpression':
      addArr('elements', node.elements);
      break;
    case 'ObjectExpression':
      addArr('properties', node.properties);
      break;
    case 'ObjectProperty':
      add('key', node.key);
      add('value', node.value);
      break;
  }

  return children;
}

interface AstNodeProps {
  node: AstNodeType;
  depth?: number;
  currentLine?: number | null;
}

export function AstNodeView({ node, depth = 0, currentLine }: AstNodeProps) {
  const [expanded, setExpanded] = useState(depth < 3);
  const children = getChildNodes(node);
  const hasChildren = children.length > 0;
  const isActive = currentLine !== null && currentLine !== undefined && node.loc?.start.line === currentLine;
  const colorClass = NODE_COLORS[node.type] ?? 'text-gray-300';
  const label = getNodeLabel(node);

  return (
    <div className={`ml-${depth === 0 ? 0 : 4}`} style={{ marginLeft: depth * 16 }}>
      <div
        className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-gray-800 ${
          isActive ? 'bg-blue-900 border border-blue-600' : ''
        }`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <span className="text-gray-500 text-xs w-3">{expanded ? '▼' : '▶'}</span>
        ) : (
          <span className="w-3" />
        )}
        <span className={`text-xs font-mono ${colorClass}`}>{label}</span>
        {node.loc && (
          <span className="text-gray-600 text-xs ml-1">
            {node.loc.start.line}:{node.loc.start.column}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {children.map(({ key, node: child }) => (
            <div key={key}>
              <div style={{ marginLeft: (depth + 1) * 16 }} className="text-gray-600 text-xs py-0.5">
                {key}:
              </div>
              <AstNodeView node={child} depth={depth + 1} currentLine={currentLine} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
