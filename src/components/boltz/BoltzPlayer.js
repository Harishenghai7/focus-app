import React, { useRef, useState, useEffect } from 'react';
import styles from './BoltzPlayer.module.css';
import BoltzOverlay from './BoltzOverlay';
import BoltzUserInfo from './BoltzUserInfo';
import BoltzMusicInfo from './BoltzMusicInfo';
import BoltzActionsSidebar from './BoltzActionsSidebar';
import HeartAnimation from './HeartAnimation';
import VideoProgressBar from './VideoProgressBar';
import VolumeControl from './VolumeControl';
import { useViewTracking } from '../../hooks/useViewTracking';

const BoltzPlayer = ({
    boltz,
    isActive,
    playing,
    muted,
    onTogglePlay,
    onToggleMute,
    onLike,
    onComment,
    onShare,
    onSave,
    onFollow,
    onOpenOptions,
    onOpenMusic,
    showHeartAnimation,
    videoRef,
    currentUserId
}) => {
    const [lastTap, setLastTap] = useState(0);
    const [progress, setProgress] = useState(0);

    useViewTracking(boltz.id, isActive);

    const handleVideoTap = () => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        if (tapLength < 300 && tapLength > 0) {
            // Double tap - like
            onLike();
        } else {
            // Single tap - pause/play
            onTogglePlay();
        }

        setLastTap(currentTime);
    };

    const handleTimeUpdate = (e) => {
        const video = e.target;
        const progress = (video.currentTime / video.duration) * 100;
        setProgress(progress);
    };

    return (
        <div className={styles.container}>
            <video
                ref={videoRef}
                src={boltz.video_url}
                className={styles.video}
                loop
                playsInline
                muted={muted}
                autoPlay={playing}
                onClick={handleVideoTap}
                onTimeUpdate={handleTimeUpdate}
            />

            <BoltzOverlay />

            <BoltzUserInfo
                user={boltz.user}
                caption={boltz.caption}
                onFollow={() => onFollow(boltz.user.id)}
                isOwnContent={currentUserId === boltz.user_id}
            />

            {boltz.music && (
                <BoltzMusicInfo
                    music={boltz.music}
                    playing={playing}
                    onClick={onOpenMusic}
                />
            )}

            <BoltzActionsSidebar
                boltz={boltz}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onSave={onSave}
                onOpenOptions={onOpenOptions}
                onOpenMusic={onOpenMusic}
                playing={playing}
            />

            {showHeartAnimation && <HeartAnimation />}

            {onToggleMute && <VolumeControl muted={muted} onToggle={onToggleMute} />}

            <VideoProgressBar progress={progress} />
        </div>
    );
};

export default BoltzPlayer;
