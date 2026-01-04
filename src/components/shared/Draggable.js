import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Draggable wrapper component
 * Makes child elements draggable with touch and mouse support
 */
const Draggable = ({
    children,
    initialPosition = { x: window.innerWidth - 120, y: window.innerHeight - 120 },
    bounds = 'viewport', // 'viewport' or custom { top, right, bottom, left }
    onDragStart,
    onDrag,
    onDragEnd,
    disabled = false,
    savePosition = false,
    storageKey = 'draggable_position',
    className = '',
    style = {}
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ x: 0, y: 0 });

    // Load saved position on mount
    useEffect(() => {
        if (savePosition && storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const savedPos = JSON.parse(saved);
                    setPosition(savedPos);
                }
            } catch (error) {
                console.error('Failed to load saved position:', error);
            }
        }
    }, [savePosition, storageKey]);

    // Save position when it changes
    useEffect(() => {
        if (savePosition && storageKey) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(position));
            } catch (error) {
                console.error('Failed to save position:', error);
            }
        }
    }, [position, savePosition, storageKey]);

    /**
     * Get boundary constraints
     */
    const getBounds = useCallback(() => {
        if (bounds === 'viewport') {
            const element = dragRef.current;
            if (!element) return { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0 };

            const rect = element.getBoundingClientRect();
            return {
                top: 0,
                right: window.innerWidth - rect.width,
                bottom: window.innerHeight - rect.height,
                left: 0
            };
        }
        return bounds;
    }, [bounds]);

    /**
     * Constrain position within bounds
     */
    const constrainPosition = useCallback((pos) => {
        const constraints = getBounds();
        return {
            x: Math.max(constraints.left, Math.min(constraints.right, pos.x)),
            y: Math.max(constraints.top, Math.min(constraints.bottom, pos.y))
        };
    }, [getBounds]);

    /**
     * Handle drag start
     */
    const handleDragStart = useCallback((clientX, clientY) => {
        if (disabled) return;

        setIsDragging(true);
        dragStartPos.current = { x: clientX, y: clientY };
        elementStartPos.current = { ...position };

        if (onDragStart) {
            onDragStart(position);
        }
    }, [disabled, position, onDragStart]);

    /**
     * Handle drag move
     */
    const handleDragMove = useCallback((clientX, clientY) => {
        if (!isDragging) return;

        const deltaX = clientX - dragStartPos.current.x;
        const deltaY = clientY - dragStartPos.current.y;

        const newPosition = constrainPosition({
            x: elementStartPos.current.x + deltaX,
            y: elementStartPos.current.y + deltaY
        });

        setPosition(newPosition);

        if (onDrag) {
            onDrag(newPosition);
        }
    }, [isDragging, constrainPosition, onDrag]);

    /**
     * Handle drag end
     */
    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);

        if (onDragEnd) {
            onDragEnd(position);
        }
    }, [isDragging, position, onDragEnd]);

    // Mouse events
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
    }, [handleDragStart]);

    const handleMouseMove = useCallback((e) => {
        handleDragMove(e.clientX, e.clientY);
    }, [handleDragMove]);

    const handleMouseUp = useCallback(() => {
        handleDragEnd();
    }, [handleDragEnd]);

    // Touch events
    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
    }, [handleDragStart]);

    const handleTouchMove = useCallback((e) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    }, [handleDragMove]);

    const handleTouchEnd = useCallback(() => {
        handleDragEnd();
    }, [handleDragEnd]);

    // Setup global event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return (
        <div
            ref={dragRef}
            className={`draggable ${isDragging ? 'dragging' : ''} ${className}`}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                ...style
            }}
        >
            {/* Drag handle - only this part is draggable */}
            <div
                style={{
                    cursor: disabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                    userSelect: 'none',
                    touchAction: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '60px', // Header area for dragging
                    zIndex: 1
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            />
            {children}
        </div>
    );
};

export default Draggable;
