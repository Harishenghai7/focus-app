import React from 'react';
import styles from './TypeSelect.module.css';
import { Image, Video, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPES = [
    {
        id: 'post',
        label: 'Post',
        icon: Image,
        desc: 'Share photos with your followers',
        color: 'var(--primary-lavender)'
    },
    {
        id: 'boltz',
        label: 'Boltz',
        icon: Zap,
        desc: 'Create short, entertaining videos',
        color: '#FFD700' // Gold/Yellow for Boltz
    },
    {
        id: 'flash',
        label: 'Flash',
        icon: Video,
        desc: 'Share moments that disappear',
        color: '#FF4500' // Orange/Red for Flash
    }
];

const TypeSelect = ({ onSelect }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>What do you want to create?</h2>
            <div className={styles.grid}>
                {TYPES.map((type, index) => (
                    <motion.button
                        key={type.id}
                        className={styles.card}
                        onClick={() => onSelect(type.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className={styles.iconWrapper} style={{ background: type.color }}>
                            <type.icon size={32} color="white" />
                        </div>
                        <h3 className={styles.label}>{type.label}</h3>
                        <p className={styles.desc}>{type.desc}</p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default TypeSelect;
