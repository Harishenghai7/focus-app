import React from 'react';
import styles from './TrendingHashtags.module.css';
import { Hash } from 'lucide-react';

const TrendingHashtags = ({ hashtags = [] }) => {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Trending Tags</h3>
            <div className={styles.list}>
                {hashtags.map((tag, index) => (
                    <div key={index} className={styles.tagItem}>
                        <div className={styles.iconWrapper}>
                            <Hash size={14} />
                        </div>
                        <div className={styles.tagInfo}>
                            <span className={styles.tagName}>{tag.name}</span>
                            <span className={styles.tagCount}>{tag.count} posts</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrendingHashtags;
