interface ResizeHandleProps {
  direction?: 'horizontal' | 'vertical';
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ResizeHandle({ direction = 'horizontal', onMouseDown }: ResizeHandleProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`group shrink-0 flex items-center justify-center ${
        isHorizontal ? 'cursor-row-resize' : 'cursor-col-resize py-2'
      }`}
      onMouseDown={onMouseDown}
    >
      <div
        className={`${
          isHorizontal ? 'h-[2px] w-full' : 'w-[2px] h-full'
        } bg-gray-700 group-hover:bg-blue-500 rounded transition-colors`}
      />
    </div>
  );
}
