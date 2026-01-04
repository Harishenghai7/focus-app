import React from 'react';
import styles from './ExploreTile.module.css';
import Icon from '../ui/Icon';
import { formatNumber } from '../../utils/formatNumber';

const ExploreTile = ({ post, onClick }) => {
    const isVideo = post.type === 'video' || post.type === 'boltz';
    const isMultiple = (post.media_urls?.length > 1) || (post.media?.length > 1);

    const mediaUrl = post.media_urls?.[0] || post.media_url || post.media?.[0]?.url;

    return (
        <div className={styles.tile} onClick={onClick}>
            <div className={styles.mediaWrapper}>
                {isVideo ? (
                    <video
                        src={mediaUrl}
                        className={styles.media}
                        muted
                        loop
                        playsInline
                        onMouseOver={e => e.target.play()}
                        onMouseOut={e => {
                            e.target.pause();
                            e.target.currentTime = 0;
                        }}
                    />
                ) : (
                    <img
                        src={mediaUrl}
                        alt="Post content"
                        className={styles.media}
                        loading="lazy"
                    />
                )}

                {/* Type Indicators */}
                <div className={styles.indicators}>
                    {isMultiple && <Icon name="Layers" size={16} color="white" className={styles.icon} />}
                    {post.type === 'boltz' && <Icon name="Zap" size={16} color="white" className={styles.icon} />}
                    {post.type === 'video' && <Icon name="Play" size={16} color="white" className={styles.icon} />}
                </div>
            </div>

            {/* Hover Overlay */}
            <div className={styles.overlay}>
                <div className={styles.stat}>
                    <Icon name="Heart" size={20} fill="white" color="white" />
                    <span>{formatNumber(post.likes_count)}</span>
                </div>
                <div className={styles.stat}>
                    <Icon name="MessageCircle" size={20} fill="white" color="white" />
                    <span>{formatNumber(post.comments_count)}</span>
                </div>
            </div>
        </div>
    );
};

export default ExploreTile;
