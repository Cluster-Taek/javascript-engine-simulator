'use client';

import { useEffect } from 'react';

interface ExpandModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ExpandModal({ title, open, onClose, children }: ExpandModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col bg-gray-900 border border-gray-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 rounded-t-xl shrink-0">
          <span className="text-sm font-semibold text-gray-200 uppercase tracking-wider">{title}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-1">{children}</div>
      </div>
    </div>
  );
}
