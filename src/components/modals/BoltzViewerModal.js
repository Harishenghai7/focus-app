import React from 'react';
import { X, Heart, MessageCircle, Share2 } from 'lucide-react';
import styles from './BoltzViewerModal.module.css';
import Avatar from '../shared/Avatar';

const BoltzViewerModal = ({ post, onClose }) => {
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
                        <div className={styles.actionButton}>
                            <Heart size={28} fill="white" />
                            <span>{post.likes_count}</span>
                        </div>
                        <div className={styles.actionButton}>
                            <MessageCircle size={28} fill="white" />
                            <span>{post.comments_count}</span>
                        </div>
                        <div className={styles.actionButton}>
                            <Share2 size={28} fill="white" />
                            <span>Share</span>
                        </div>
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
            </div>
        </div>
    );
};

export default BoltzViewerModal;
