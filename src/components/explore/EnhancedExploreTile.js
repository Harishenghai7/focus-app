// EnhancedExploreTile - Pro-Grade Grid Item
import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatNumber';
import styles from './EnhancedExploreTile.module.css';

const EnhancedExploreTile = ({ post, onClick }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const mediaUrl = post.media_urls?.[0] || post.video_url || post.thumbnail_url || post.media_url;
    const isVideo = post.type === 'boltz' || post.media_types?.[0] === 'video';
    const hasMultiple = post.media_urls?.length > 1;

    const viewCount = post.views_count || 0;
    const likeCount = post.likes_count || 0;
    const commentCount = post.comments_count || 0;

    return (
        <div className={styles.tile} onClick={onClick}>
            {/* Media */}
            <div className={styles.mediaContainer}>
                {!imageLoaded && (
                    <div className={styles.skeleton} />
                )}
                {isVideo ? (
                    <video
                        src={mediaUrl}
                        className={styles.media}
                        onLoadedData={() => setImageLoaded(true)}
                        muted
                        playsInline
                    />
                ) : (
                    <img
                        src={mediaUrl}
                        alt="Post"
                        className={styles.media}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                    />
                )}

                {/* Overlay on Hover */}
                <div className={styles.overlay}>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.icon}>❤️</span>
                            <span className={styles.count}>{formatNumber(likeCount)}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.icon}>💬</span>
                            <span className={styles.count}>{formatNumber(commentCount)}</span>
                        </div>
                        {viewCount > 0 && (
                            <div className={styles.stat}>
                                <span className={styles.icon}>👁️</span>
                                <span className={styles.count}>{formatNumber(viewCount)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Indicators */}
                <div className={styles.indicators}>
                    {isVideo && (
                        <div className={styles.indicator}>
                            <span className={styles.videoIcon}>▶️</span>
                        </div>
                    )}
                    {hasMultiple && (
                        <div className={styles.indicator}>
                            <span className={styles.multiIcon}>📷</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedExploreTile;
