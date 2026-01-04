import React from 'react';
import styles from './VolumeControl.module.css';
import { Volume2, VolumeX } from 'lucide-react';

const VolumeControl = ({ muted, onToggle }) => {
    return (
        <button className={styles.button} onClick={onToggle} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
    );
};

export default VolumeControl;
