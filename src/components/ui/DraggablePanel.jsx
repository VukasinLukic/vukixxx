import React, { useRef, useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { X, Minus, Maximize2, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import './DraggablePanel.css';

export const DraggablePanel = ({
    title,
    children,
    initialPosition = { x: 0, y: 0 },
    onClose,
    onFocus,
    width: initialWidth = '400px',
    height: initialHeight = 'auto',
    minWidth = 280,
    minHeight = 200,
    resizable = true,
    zIndex = 10,
    className
}) => {
    const nodeRef = useRef(null);
    const [size, setSize] = useState({
        width: typeof initialWidth === 'number' ? initialWidth : parseInt(initialWidth) || 400,
        height: typeof initialHeight === 'number' ? initialHeight : (initialHeight === 'auto' ? 'auto' : parseInt(initialHeight) || 300)
    });
    const [isResizing, setIsResizing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState(null);

    // Handle resize
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = typeof size.width === 'number' ? size.width : nodeRef.current?.offsetWidth || 400;
        const startHeight = typeof size.height === 'number' ? size.height : nodeRef.current?.offsetHeight || 300;

        const handleMouseMove = (moveEvent) => {
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

    // Handle maximize/restore
    const handleMaximize = useCallback(() => {
        if (isMaximized) {
            // Restore
            if (preMaximizeState) {
                setSize(preMaximizeState.size);
            }
            setIsMaximized(false);
        } else {
            // Maximize
            setPreMaximizeState({ size });
            setSize({ width: window.innerWidth - 40, height: window.innerHeight - 120 });
            setIsMaximized(true);
        }
    }, [isMaximized, preMaximizeState, size]);

    // Handle panel focus
    const handlePanelClick = useCallback(() => {
        if (onFocus) {
            onFocus();
        }
    }, [onFocus]);

    const panelStyle = {
        width: typeof size.width === 'number' ? `${size.width}px` : size.width,
        height: typeof size.height === 'number' ? `${size.height}px` : size.height,
        zIndex
    };

    return (
        <Draggable
            handle=".panel-header"
            defaultPosition={isMaximized ? { x: 20, y: 20 } : initialPosition}
            nodeRef={nodeRef}
            bounds="parent"
            disabled={isMaximized}
        >
            <div
                ref={nodeRef}
                className={cn(
                    "draggable-panel",
                    isResizing && "resizing",
                    isMaximized && "maximized",
                    className
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
                        <button
                            className="control-btn minimize"
                            title="Minimize"
                        >
                            <Minus size={8} />
                        </button>
                        <button
                            className="control-btn maximize"
                            onClick={(e) => { e.stopPropagation(); handleMaximize(); }}
                            title={isMaximized ? "Restore" : "Maximize"}
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

                {/* Resize handle */}
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
