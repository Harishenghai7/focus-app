/**
 * LikesModal Component
 * Shows users who liked a post with infinite scroll
 */

import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePostLikes } from '../../hooks/usePostLikes';
import { useRealtimeLikes } from '../../hooks/useRealtimeLikes';
import styles from './LikesModal.module.css';

const LikesModal = ({ postId, onClose }) => {
    const {
        likes,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = usePostLikes(postId);

    const { ref, inView } = useInView();

    // Enable real-time updates
    useRealtimeLikes(postId);

    // Fetch next page when scrolling near bottom
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Likes</h3>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <div className={styles.likesList}>
                    {isLoading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : likes.length === 0 ? (
                        <div className={styles.empty}>No likes yet</div>
                    ) : (
                        <>
                            {likes.map((like) => (
                                <LikeItem key={like.id} like={like} />
                            ))}

                            {/* Infinite scroll trigger */}
                            <div ref={ref} className={styles.loadTrigger}>
                                {isFetchingNextPage && (
                                    <div className={styles.loadingMore}>Loading more...</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Individual like item
const LikeItem = ({ like }) => {
    const user = like.profiles;

    return (
        <div className={styles.likeItem}>
            <img
                src={user?.avatar_url || '/default-avatar.png'}
                alt={user?.username}
                className={styles.avatar}
            />
            <div className={styles.userInfo}>
                <span className={styles.username}>
                    {user?.username}
                    {user?.is_verified && (
                        <span className={styles.verified}>✓</span>
                    )}
                </span>
            </div>
            <button className={styles.followBtn}>Follow</button>
        </div>
    );
};

export default LikesModal;
