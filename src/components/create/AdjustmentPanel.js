import React from 'react';
import styles from './AdjustmentPanel.module.css';
import { Sun, Contrast, Droplet, Thermometer, BoxSelect, Maximize } from 'lucide-react';

const TOOLS = [
    { id: 'brightness', label: 'Brightness', icon: Sun, min: 50, max: 150, default: 100 },
    { id: 'contrast', label: 'Contrast', icon: Contrast, min: 50, max: 150, default: 100 },
    { id: 'saturation', label: 'Saturation', icon: Droplet, min: 0, max: 200, default: 100 },
    { id: 'warmth', label: 'Warmth', icon: Thermometer, min: -50, max: 50, default: 0 },
    { id: 'vignette', label: 'Vignette', icon: BoxSelect, min: 0, max: 100, default: 0 },
    { id: 'sharpen', label: 'Sharpen', icon: Maximize, min: 0, max: 100, default: 0 },
];

const AdjustmentPanel = ({ values, onChange }) => {
    return (
        <div className={styles.container}>
            {TOOLS.map(tool => {
                const Icon = tool.icon;
                const value = values[tool.id] ?? tool.default;

                return (
                    <div key={tool.id} className={styles.toolRow}>
                        <div className={styles.label}>
                            <Icon size={18} />
                            <span>{tool.label}</span>
                        </div>
                        <input
                            type="range"
                            min={tool.min}
                            max={tool.max}
                            value={value}
                            onChange={(e) => onChange(tool.id, parseFloat(e.target.value))}
                            className={styles.slider}
                        />
                        <span className={styles.value}>{Math.round(value)}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default AdjustmentPanel;
