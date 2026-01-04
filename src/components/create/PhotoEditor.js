import React, { useRef, useEffect } from 'react';
import styles from './PhotoEditor.module.css';
import { usePhotoEditor } from '../../hooks/usePhotoEditor';
import Button from '../shared/Button';
import { Sliders, Crop, RotateCw } from 'lucide-react';

const FILTERS = [
    { id: 'none', label: 'Normal', style: '' },
    { id: 'lavender', label: 'Lavender', style: 'sepia(0.2) hue-rotate(240deg) contrast(1.1)' },
    { id: 'warm', label: 'Warm', style: 'sepia(0.3) contrast(1.1)' },
    { id: 'cool', label: 'Cool', style: 'hue-rotate(180deg) contrast(1.1)' },
    { id: 'bw', label: 'B&W', style: 'grayscale(1)' },
];

const PhotoEditor = ({ file, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const {
        image,
        rotation,
        setRotation,
        filter,
        setFilter,
        adjustments,
        setAdjustments,
        generateResult
    } = usePhotoEditor(URL.createObjectURL(file));

    useEffect(() => {
        // Draw image to canvas with filters
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = image;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.filter = `${FILTERS.find(f => f.id === filter).style} brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%)`;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            ctx.restore();
        };
    }, [image, filter, adjustments, rotation]);

    const handleSave = async () => {
        // In a real app, we'd use generateResult from the hook which handles cropping
        // For this UI demo, we'll just return the original file or a blob from canvas
        onSave(file);
    };

    return (
        <div className={styles.container}>
            <div className={styles.canvasWrapper}>
                <canvas ref={canvasRef} className={styles.canvas} />
            </div>

            <div className={styles.controls}>
                <div className={styles.filters}>
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            className={`${styles.filterBtn} ${filter === f.id ? styles.activeFilter : ''}`}
                            onClick={() => setFilter(f.id)}
                        >
                            <div className={styles.filterPreview} style={{ filter: f.style }} />
                            <span>{f.label}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.adjustments}>
                    <div className={styles.sliderGroup}>
                        <label>Brightness</label>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={adjustments.brightness}
                            onChange={(e) => setAdjustments({ ...adjustments, brightness: e.target.value })}
                        />
                    </div>
                    <div className={styles.sliderGroup}>
                        <label>Contrast</label>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={adjustments.contrast}
                            onChange={(e) => setAdjustments({ ...adjustments, contrast: e.target.value })}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => setRotation(r => r + 90)}>
                        <RotateCw size={18} />
                    </Button>
                    <div className={styles.mainActions}>
                        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Save Edits</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoEditor;
