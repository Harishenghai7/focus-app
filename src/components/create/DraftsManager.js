import React, { useState } from 'react';
import styles from './DraftsManager.module.css';
import { useDrafts } from '../../hooks/useDrafts';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, FileText, Image, Zap, Video, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_ICONS = { post: Image, boltz: Zap, flash: Video };
const TYPE_COLORS = { post: '#8b5cf6', boltz: '#f59e0b', flash: '#ec4899' };

const DraftsManager = ({ onLoadDraft }) => {
    const { getDraft, clearDraft } = useDrafts();
    const [isExpanded, setIsExpanded] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const drafts = ['post', 'boltz', 'flash']
        .map(type => ({ type, data: getDraft(type) }))
        .filter(d => d.data);

    if (drafts.length === 0) return null;

    return (
        <div className={styles.container}>
            <button className={styles.toggleBtn} onClick={() => setIsExpanded(!isExpanded)}>
                <FileText size={16} />
                <span>Drafts ({drafts.length})</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div className={styles.list} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                        {drafts.map(({ type, data }) => {
                            const Icon = TYPE_ICONS[type] || FileText;
                            const color = TYPE_COLORS[type] || '#8b5cf6';
                            return (
                                <motion.div key={type} className={styles.draftCard} initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }} style={{ '--draft-color': color }}>
                                    <div className={styles.draftIcon}><Icon size={18} /></div>
                                    <div className={styles.draftInfo}>
                                        <span className={styles.draftType}>{type.toUpperCase()}</span>
                                        <span className={styles.draftDate}>
                                            <Clock size={11} /> {new Date(data.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.draftActions}>
                                        <button className={styles.loadBtn} onClick={() => onLoadDraft(type, data)}>Load</button>
                                        {confirmDelete === type ? (
                                            <button className={styles.confirmDeleteBtn} onClick={() => { clearDraft(type); setConfirmDelete(null); }}>Confirm</button>
                                        ) : (
                                            <button className={styles.deleteBtn} onClick={() => setConfirmDelete(type)}><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DraftsManager;
