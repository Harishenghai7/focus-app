import React from 'react';
import styles from './VolumeControl.module.css';
import { Volume2, VolumeX } from 'lucide-react';

const VolumeControl = ({ muted, onToggle }) => (
    <button className={styles.container} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <div className={`${styles.icon} ${muted ? styles.muted : styles.unmuted}`}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </div>
    </button>
);

export default VolumeControl;
