'use client';

import { useState, useCallback, useRef } from 'react';

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  className?: string;
}

export function ResizableSplit({
  left,
  right,
  initialLeftPercent = 40,
  minLeftPercent = 20,
  maxLeftPercent = 80,
  className = '',
}: ResizableSplitProps) {
  const [leftPercent, setLeftPercent] = useState(initialLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPercent(Math.min(maxLeftPercent, Math.max(minLeftPercent, percent)));
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [minLeftPercent, maxLeftPercent]
  );

  return (
    <div ref={containerRef} className={`flex h-full ${className}`}>
      <div style={{ width: `${leftPercent}%` }} className="overflow-hidden">
        {left}
      </div>
      <div
        className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={onMouseDown}
      />
      <div style={{ width: `${100 - leftPercent}%` }} className="overflow-hidden">
        {right}
      </div>
    </div>
  );
}
