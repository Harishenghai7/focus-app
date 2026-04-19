// BoltzCommentsSheet - Updated with new CommentsSection
import React from 'react';
import styles from './BoltzCommentsSheet.module.css';
import CommentsDrawer from '../post/CommentsDrawer';
import { X } from 'lucide-react';

const BoltzCommentsSheet = ({ boltzId, boltzOwnerId, onClose, onCommentCountChange }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Comments</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.commentsContainer}>
                    <CommentsDrawer targetId={boltzId} targetType="boltz" onClose={onClose} />
                </div>
            </div>
        </div>
    );
};

export default BoltzCommentsSheet;
