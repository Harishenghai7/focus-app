import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, BellOff, EyeOff, Link } from 'lucide-react';
import styles from './ActionSheet.module.css';

const ActionSheet = ({ isOpen, onClose, options, mode = 'auto' }) => {
    const sheetRef = useRef(null);
    const isDesktop = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false;
    const renderAsDropdown = mode === 'dropdown' || (mode === 'auto' && isDesktop);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        const handleClickOutside = (e) => {
            if (sheetRef.current && !sheetRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const defaultOptions = [
        { id: 'copy', label: 'Copy Link', icon: Link, onClick: () => console.log('Copied') },
        { id: 'hide', label: 'Hide Content', icon: EyeOff, onClick: () => console.log('Hidden') },
        { id: 'mute', label: 'Mute User', icon: BellOff, onClick: () => console.log('Muted') },
        { id: 'report', label: 'Report', icon: Flag, onClick: () => console.log('Reported'), danger: true },
    ];

    const displayOptions = options || defaultOptions;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        className={styles.sheet}
                        data-mode={renderAsDropdown ? 'dropdown' : 'sheet'}
                        ref={sheetRef}
                        initial={renderAsDropdown ? { y: -8, opacity: 0, scale: 0.98 } : { y: '100%', opacity: 0 }}
                        animate={renderAsDropdown ? { y: 0, opacity: 1, scale: 1 } : { y: 0, opacity: 1 }}
                        exit={renderAsDropdown ? { y: -8, opacity: 0, scale: 0.98 } : { y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {!renderAsDropdown && <div className={styles.handle} />}
                        <ul className={styles.optionsList}>
                            {displayOptions.map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <li key={opt.id}>
                                        <button 
                                            className={`${styles.optionBtn} ${opt.danger ? styles.danger : ''}`}
                                            onClick={() => { opt.onClick(); onClose(); }}
                                        >
                                            {Icon && <Icon size={20} />}
                                            <span>{opt.label}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ActionSheet;
