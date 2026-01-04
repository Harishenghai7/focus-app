import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BoltzFeed.module.css';
import VideoPlayer from './VideoPlayer';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';

const BoltzFeed = ({ videos }) => {
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, clientHeight } = containerRef.current;
            const index = Math.round(scrollTop / clientHeight);
            if (index !== activeIndex) {
                setActiveIndex(index);
            }
        }
    };

    const handleProfileClick = (username) => {
        if (username) {
            navigate(`/profile/${username}`);
        }
    };

    return (
        <div
            className={styles.feedContainer}
            ref={containerRef}
            onScroll={handleScroll}
        >
            {videos.map((video, index) => (
                <div key={video.id} className={styles.videoWrapper}>
                    <VideoPlayer
                        src={video.url}
                        isActive={index === activeIndex}
                    />

                    <div className={styles.overlay}>
                        <div className={styles.sidebar}>
                            <div
                                className={styles.action}
                                onClick={() => handleProfileClick(video.user.username)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Avatar src={video.user.avatar_url} size="md" className={styles.avatar} />
                            </div>
                            <div className={styles.action}>
                                <Icon name="Heart" size={32} fill="white" />
                                <span>{video.likes_count}</span>
                            </div>
                            <div className={styles.action}>
                                <Icon name="MessageCircle" size={32} />
                                <span>{video.comments_count}</span>
                            </div>
                            <div className={styles.action}>
                                <Icon name="Share2" size={32} />
                                <span>Share</span>
                            </div>
                        </div>

                        <div className={styles.bottomInfo}>
                            <h3
                                className={styles.username}
                                onClick={() => handleProfileClick(video.user.username)}
                                style={{ cursor: 'pointer' }}
                            >
                                @{video.user.username}
                            </h3>
                            <p className={styles.caption}>{video.caption}</p>
                            <div className={styles.music}>
                                <Icon name="Music" size={16} />
                                <span>Original Audio - {video.user.username}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BoltzFeed;
