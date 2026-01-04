import React from 'react';
import styles from './DraftsManager.module.css';
import { useDrafts } from '../../hooks/useDrafts';
import Button from '../shared/Button';
import { Trash2 } from 'lucide-react';

const DraftsManager = ({ onLoadDraft }) => {
    const { getDraft, clearDraft } = useDrafts();

    const drafts = ['post', 'boltz', 'flash']
        .map(type => ({ type, data: getDraft(type) }))
        .filter(d => d.data);

    if (drafts.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No saved drafts</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Saved Drafts</h3>
            <div className={styles.list}>
                {drafts.map(({ type, data }) => (
                    <div key={type} className={styles.draftItem}>
                        <div className={styles.info}>
                            <span className={styles.type}>{type.toUpperCase()}</span>
                            <span className={styles.date}>
                                {new Date(data.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <div className={styles.actions}>
                            <Button
                                size="sm"
                                onClick={() => onLoadDraft(type, data)}
                            >
                                Load
                            </Button>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => clearDraft(type)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DraftsManager;
