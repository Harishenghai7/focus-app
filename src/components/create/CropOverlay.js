import React, { useState, useRef, useEffect } from 'react';
import styles from './CropOverlay.module.css';
import { updateCropFromHandle } from '../../utils/cropUtils';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const CropOverlay = ({
    crop,
    onCropChange,
    aspectRatio,
    videoWidth,
    videoHeight,
    containerRef
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState(null); // 'move' or handle name
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const overlayRef = useRef(null);

    const handleMouseDown = (e, type) => {
        e.stopPropagation();
        setIsDragging(true);
        setDragType(type);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef?.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

        if (dragType === 'move') {
            // Move the entire crop region
            let newCrop = {
                x: crop.x + deltaX,
                y: crop.y + deltaY,
                width: crop.width,
                height: crop.height
            };

            // Bound to container
            if (newCrop.x < 0) newCrop.x = 0;
            if (newCrop.y < 0) newCrop.y = 0;
            if (newCrop.x + newCrop.width > 100) newCrop.x = 100 - newCrop.width;
            if (newCrop.y + newCrop.height > 100) newCrop.y = 100 - newCrop.height;

            onCropChange(newCrop);
        } else {
            // Resize using handle
            const newCrop = updateCropFromHandle(crop, dragType, deltaX, deltaY, aspectRatio);
            onCropChange(newCrop);
        }

        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragType(null);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart, crop]);

    return (
        <div ref={overlayRef} className={styles.overlay}>
            {/* Dimmed regions */}
            <div className={styles.dimmedRegions}>
                {/* Top */}
                <div
                    className={styles.dimmed}
                    style={{
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: `${crop.y}%`
                    }}
                />
                {/* Bottom */}
                <div
                    className={styles.dimmed}
                    style={{
                        left: 0,
                        top: `${crop.y + crop.height}%`,
                        width: '100%',
                        height: `${100 - crop.y - crop.height}%`
                    }}
                />
                {/* Left */}
                <div
                    className={styles.dimmed}
                    style={{
                        left: 0,
                        top: `${crop.y}%`,
                        width: `${crop.x}%`,
                        height: `${crop.height}%`
                    }}
                />
                {/* Right */}
                <div
                    className={styles.dimmed}
                    style={{
                        left: `${crop.x + crop.width}%`,
                        top: `${crop.y}%`,
                        width: `${100 - crop.x - crop.width}%`,
                        height: `${crop.height}%`
                    }}
                />
            </div>

            {/* Crop box */}
            <div
                className={styles.cropBox}
                style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
                {/* Rule of thirds grid */}
                <div className={styles.grid}>
                    <div className={styles.gridLine} style={{ left: '33.33%', top: 0, width: '1px', height: '100%' }} />
                    <div className={styles.gridLine} style={{ left: '66.66%', top: 0, width: '1px', height: '100%' }} />
                    <div className={styles.gridLine} style={{ left: 0, top: '33.33%', width: '100%', height: '1px' }} />
                    <div className={styles.gridLine} style={{ left: 0, top: '66.66%', width: '100%', height: '1px' }} />
                </div>

                {/* Resize handles */}
                {HANDLES.map(handle => (
                    <div
                        key={handle}
                        className={`${styles.handle} ${styles[`handle-${handle}`]}`}
                        onMouseDown={(e) => handleMouseDown(e, handle)}
                    />
                ))}

                {/* Corner decorations */}
                <div className={`${styles.corner} ${styles.cornerNW}`} />
                <div className={`${styles.corner} ${styles.cornerNE}`} />
                <div className={`${styles.corner} ${styles.cornerSE}`} />
                <div className={`${styles.corner} ${styles.cornerSW}`} />
            </div>
        </div>
    );
};

export default CropOverlay;
