'use client';

import { createElement, type ReactNode } from 'react';
import { type DomSnapshot } from '@/shared/lib/reconciler';

interface DomElementViewProps {
  element: DomSnapshot;
}

const ALLOWED_TAGS = new Set([
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'button',
  'a',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'main',
  'aside',
  'label',
  'input',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'table',
  'tr',
  'td',
  'th',
]);

const SAFE_PROPS = new Set(['className']);

function sanitizeProps(props: Record<string, unknown>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (SAFE_PROPS.has(key) && typeof value === 'string') {
      safe[key] = value;
    }
  }
  return safe;
}

function renderSnapshot(element: DomSnapshot): ReactNode {
  if (element.tag === '#text') {
    return element.text ?? '';
  }

  const tag = ALLOWED_TAGS.has(element.tag) ? element.tag : 'div';
  const safeProps = sanitizeProps(element.props);
  const children = element.children.map((child, i) => <span key={child.id ?? i}>{renderSnapshot(child)}</span>);

  return createElement(tag, safeProps, ...children);
}

export function DomElementView({ element }: DomElementViewProps) {
  return (
    <div className="dom-preview-rendered text-sm text-gray-200 [&_button]:px-2 [&_button]:py-0.5 [&_button]:bg-gray-700 [&_button]:rounded [&_button]:text-xs [&_button]:border [&_button]:border-gray-600 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:py-0.5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_p]:py-0.5 [&_section]:border [&_section]:border-gray-700 [&_section]:rounded [&_section]:p-2 [&_article]:border [&_article]:border-gray-700 [&_article]:rounded [&_article]:p-2 [&_header]:border-b [&_header]:border-gray-700 [&_header]:pb-1 [&_header]:mb-1">
      {renderSnapshot(element)}
    </div>
  );
}
