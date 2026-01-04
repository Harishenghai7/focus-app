import React from 'react';
import styles from './TrendingPostTile.module.css';
import { Heart } from 'lucide-react';

const TrendingPostTile = ({ post }) => {
    return (
        <div className={styles.tile}>
            <img src={post.media_url} alt={post.caption} className={styles.image} />
            <div className={styles.overlay}>
                <div className={styles.stats}>
                    <Heart size={14} fill="white" />
                    <span>{post.likes_count}</span>
                </div>
                <div className={styles.user}>
                    @{post.profiles?.username}
                </div>
            </div>
        </div>
    );
};

export default TrendingPostTile;
