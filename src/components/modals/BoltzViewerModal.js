import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './BoltzViewerModal.module.css';
import Avatar from '../shared/Avatar';
import InteractionBar from '../shared/InteractionBar';
import SovereignCommentSheet from '../comments/SovereignCommentSheet';

const BoltzViewerModal = ({ post, onClose }) => {
    const [showComments, setShowComments] = useState(false);
    
    if (!post) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.videoContainer}>
                    <video
                        src={post.media_url}
                        controls
                        autoPlay
                        loop
                        className={styles.video}
                    />
                </div>

                <div className={styles.overlayContent}>
                    <div className={styles.sidebar}>
                        <InteractionBar
                            item={post}
                            type="boltz"
                            onCommentsClick={() => setShowComments(true)}
                        />
                    </div>

                    <div className={styles.bottomInfo}>
                        <div className={styles.userInfo}>
                            <Avatar src={post.profiles?.avatar_url} size="md" />
                            <div className={styles.textInfo}>
                                <span className={styles.username}>@{post.profiles?.username}</span>
                                <p className={styles.caption}>{post.caption}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <SovereignCommentSheet
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    targetId={post.id}
                    targetType="boltz"
                />
            </div>
        </div>
    );
};

export default BoltzViewerModal;
