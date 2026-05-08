import React, { useState, useRef, useEffect } from 'react';
import styles from './BoltzCommentsSheet.module.css';
import CommentsDrawer from '../post/CommentsDrawer';
import { X, ChevronDown } from 'lucide-react';

const BoltzCommentsSheet = ({ boltzId, boltzOwnerId, onClose, onCommentCountChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const sheetRef = useRef(null);
    const dragStartY = useRef(0);

    // Drag-to-dismiss gesture
    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY;
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        const currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const delta = Math.max(0, currentY - dragStartY.current);
        setDragY(delta);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (dragY > 150) {
            onClose();
        } else {
            setDragY(0);
        }
    };

    // Animate in on mount
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={sheetRef}
                className={styles.sheet}
                style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div
                    className={styles.dragHandle}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                >
                    <div className={styles.dragBar} />
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>Comments</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <ChevronDown size={24} />
                    </button>
                </div>

                {/* Comments Content */}
                <div className={styles.commentsContainer}>
                    <CommentsDrawer
                        targetId={boltzId}
                        targetType="boltz"
                        onClose={onClose}
                        onCommentCountChange={onCommentCountChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default BoltzCommentsSheet;
