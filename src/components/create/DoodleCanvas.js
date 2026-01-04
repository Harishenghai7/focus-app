import React, { useRef, useEffect, useState } from 'react';
import styles from './DoodleCanvas.module.css';
import Button from '../shared/Button';

const DoodleCanvas = ({ width, height, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FF0000');
    const [brushSize, setBrushSize] = useState(5);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [width, height]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleSave = () => {
        onSave(canvasRef.current.toDataURL());
    };

    return (
        <div className={styles.container}>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />

            <div className={styles.controls}>
                <div className={styles.colors}>
                    {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF', '#000000'].map(c => (
                        <button
                            key={c}
                            className={`${styles.colorBtn} ${color === c ? styles.activeColor : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
                <div className={styles.actions}>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Done</Button>
                </div>
            </div>
        </div>
    );
};

export default DoodleCanvas;
