import React, { useRef, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Resizable } from 'react-resizable';
import { useWidgetBreakpoints } from '@hooks/useWidgetBreakpoints';
import 'react-resizable/css/styles.css';

const ResizableWidget = ({
  children,
  widget,
  onResize,
  onMove,
  gridUnit = 40,
  isEditMode = false
}) => {
  const ref = useRef(null);
  const { size, breakpoint } = useWidgetBreakpoints(ref);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
    disabled: !isEditMode
  });

  const style = useMemo(() => ({
    gridColumn: `${widget.x} / span ${widget.width}`,
    gridRow: `${widget.y} / span ${widget.height}`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: 'relative',
    minHeight: `${widget.height * gridUnit}px`,
    minWidth: `${widget.width * gridUnit}px`
  }), [widget.x, widget.y, widget.width, widget.height, transform, isDragging, gridUnit]);

  const handleResize = (event, { size: newSize }) => {
    const newWidth = Math.max(2, Math.round(newSize.width / gridUnit));
    const newHeight = Math.max(2, Math.round(newSize.height / gridUnit));
    onResize(widget.id, newWidth, newHeight);
  };

  const childrenWithProps = React.cloneElement(children, {
    breakpoint: breakpoint.breakpoint,
    availableColumns: breakpoint.columns,
    availableRows: breakpoint.rows,
    size,
    widgetConfig: widget.config
  });

  if (!isEditMode) {
    // Non-editable mode - just render the widget
    return (
      <div
        ref={ref}
        style={style}
        className="widget-container bg-white rounded-lg shadow-md border p-4 overflow-hidden"
      >
        {childrenWithProps}
      </div>
    );
  }

  // Editable mode with resize and drag
  return (
    <Resizable
      width={widget.width * gridUnit}
      height={widget.height * gridUnit}
      onResize={handleResize}
      minConstraints={[gridUnit * 2, gridUnit * 2]}
      maxConstraints={[gridUnit * 16, gridUnit * 12]}
      resizeHandles={['se']}
    >
      <div
        ref={(node) => {
          setNodeRef(node);
          ref.current = node;
        }}
        style={style}
        className={`widget-container bg-white rounded-lg shadow-md border overflow-hidden
          ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
          ${isEditMode ? 'cursor-move hover:shadow-lg' : ''}
        `}
        {...attributes}
        {...listeners}
      >
        {/* Edit mode indicators */}
        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
          </div>
        )}
        
        <div className="p-4 h-full">
          {childrenWithProps}
        </div>
      </div>
    </Resizable>
  );
};

export default ResizableWidget;
