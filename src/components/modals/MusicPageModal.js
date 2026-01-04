import React from 'react';
import styles from './MusicPageModal.module.css';
import { X } from 'lucide-react';

const MusicPageModal = ({ music, onClose }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{music.name}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <p className={styles.artist}>{music.artist}</p>
                <p className={styles.info}>All Boltz with this music will appear here</p>
            </div>
        </div>
    );
};

export default MusicPageModal;
