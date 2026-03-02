import React, { useRef, useState, useCallback, type ReactNode } from 'react';
import Draggable from 'react-draggable';
import { X, Minus, Maximize2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import './DraggablePanel.css';

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
  onFocus?: () => void;
  width?: number | string;
  height?: number | string | 'auto';
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  zIndex?: number;
  className?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  initialPosition = { x: 0, y: 0 },
  onClose,
  onFocus,
  width: initialWidth = 400,
  height: initialHeight = 'auto',
  minWidth = 280,
  minHeight = 200,
  resizable = true,
  zIndex = 10,
  className,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    width: typeof initialWidth === 'number' ? initialWidth : parseInt(String(initialWidth)) || 400,
    height: typeof initialHeight === 'number'
      ? initialHeight
      : (initialHeight === 'auto' ? 'auto' as const : parseInt(String(initialHeight)) || 300),
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<typeof size | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = typeof size.width === 'number' ? size.width : nodeRef.current?.offsetWidth || 400;
    const startHeight = typeof size.height === 'number' ? size.height : nodeRef.current?.offsetHeight || 300;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(minHeight, startHeight + (moveEvent.clientY - startY));
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [size, minWidth, minHeight]);

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      if (preMaximizeState) {
        setSize(preMaximizeState);
      }
      setIsMaximized(false);
    } else {
      setPreMaximizeState({ ...size });
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 120 });
      setIsMaximized(true);
    }
  }, [isMaximized, preMaximizeState, size]);

  const handlePanelClick = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const panelStyle: React.CSSProperties = {
    width: typeof size.width === 'number' ? `${size.width}px` : size.width,
    height: typeof size.height === 'number' ? `${size.height}px` : size.height,
    zIndex,
  };

  return (
    <Draggable
      handle=".panel-header"
      defaultPosition={isMaximized ? { x: 20, y: 20 } : initialPosition}
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      bounds="parent"
      disabled={isMaximized}
    >
      <div
        ref={nodeRef}
        className={cn(
          'draggable-panel',
          isResizing && 'resizing',
          isMaximized && 'maximized',
          className,
        )}
        style={panelStyle}
        onMouseDown={handlePanelClick}
      >
        <div className="panel-header">
          <div className="window-controls">
            <button
              className="control-btn close"
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              title="Close"
            >
              <X size={8} />
            </button>
            <button className="control-btn minimize" title="Minimize">
              <Minus size={8} />
            </button>
            <button
              className="control-btn maximize"
              onClick={(e) => { e.stopPropagation(); handleMaximize(); }}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              <Maximize2 size={8} />
            </button>
          </div>
          <span className="panel-title">{title}</span>
          <div className="header-spacer" />
        </div>
        <div className="panel-content">
          {children}
        </div>

        {resizable && !isMaximized && (
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          >
            <GripVertical size={12} />
          </div>
        )}
      </div>
    </Draggable>
  );
};
