import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { formatNumber } from '../../utils/formatNumber';
import styles from './ProfileGridTile.module.css';

const ProfileGridTile = ({ item, onClick }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isVideo = item.type === 'boltz' || item.media?.[0]?.type === 'video';

    return (
        <button className={styles.tile} onClick={onClick} aria-label="View post">
            <div className={styles.aspectRatio}>
                {!imageLoaded && <div className={styles.placeholder} />}
                <img
                    src={item.thumbnail || item.media?.[0]?.url}
                    alt="Post"
                    className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
                    onLoad={() => setImageLoaded(true)}
                    loading="lazy"
                />
                {isVideo && (
                    <div className={styles.videoIndicator}>
                        <Icon name="Play" size={20} />
                    </div>
                )}
                <div className={styles.overlay}>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <Icon name="Heart" size={20} fill="white" />
                            <span>{formatNumber(item.likes_count)}</span>
                        </div>
                        <div className={styles.stat}>
                            <Icon name="MessageCircle" size={20} fill="white" />
                            <span>{formatNumber(item.comments_count)}</span>
                        </div>
                        {item.views_count !== undefined && (
                            <div className={styles.stat}>
                                <Icon name="Eye" size={20} />
                                <span>{formatNumber(item.views_count)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ProfileGridTile;
