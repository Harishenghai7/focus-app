import React, { useState, useRef, useEffect } from 'react';
import styles from './PreviewPost.module.css';
import Button from '../../components/ui/Button';
import { ArrowLeft, Calendar, Music, Play, Pause } from 'lucide-react';
import { usePublish } from '../../hooks/usePublish';
import { useNavigate } from 'react-router-dom';

const PreviewPost = ({ mediaFiles, details, music, createMode, onBack, onUpdateDetails }) => {
    const navigate = useNavigate();
    const { publish, loading, error } = usePublish();
    const [showConfetti, setShowConfetti] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(null);
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const currentMedia = mediaFiles[0];
    const isVideo = currentMedia?.type === 'video';
    const edits = currentMedia?.edits || {};

    // Cleanup audio/video on unmount
    useEffect(() => {
        return () => {
            try {
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                }
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            } catch (err) {
                console.log('Cleanup error:', err);
            }
        };
    }, []);

    // Sync audio with video time (only while playing)
    useEffect(() => {
        if (!videoRef.current || !audioRef.current || !music || !isPlaying) return;

        let syncTimeout;

        const handleTimeUpdate = () => {
            if (audioRef.current && videoRef.current && isPlaying) {
                const timeDiff = Math.abs(audioRef.current.currentTime - videoRef.current.currentTime);
                // Resync if drift is more than 1 second
                if (timeDiff > 1) {
                    try {
                        audioRef.current.currentTime = videoRef.current.currentTime;
                    } catch (err) {
                        // Ignore sync errors
                    }
                }
            }
        };

        videoRef.current.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            if (videoRef.current) {
                videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }
        };
    }, [music?.id, isPlaying]);

    // Handle video loading
    useEffect(() => {
        if (videoRef.current && isVideo) {
            const video = videoRef.current;

            const handleLoadedData = () => {
                console.log('Video loaded successfully');
                console.log('Video duration:', video.duration);
                console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            };

            const handleError = (e) => {
                console.error('Video loading error:', e);
                console.error('Video error details:', video.error);
                setVideoError('Failed to load video. The exported file may be corrupted.');
            };

            const handleCanPlay = () => {
                console.log('Video can play');
            };

            video.addEventListener('loadeddata', handleLoadedData);
            video.addEventListener('error', handleError);
            video.addEventListener('canplay', handleCanPlay);

            return () => {
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                video.removeEventListener('canplay', handleCanPlay);
            };
        }
    }, [currentMedia, edits.file, isVideo]);

    // Check if video has been exported (edits baked in)
    const hasExportedFile = edits.file && edits.isEdited;

    // Get the video source - use edited file if available, otherwise original preview
    const getVideoSource = () => {
        if (edits.file) {
            console.log('Using exported file:', edits.file);
            const url = URL.createObjectURL(edits.file);
            console.log('Generated URL:', url);
            return url;
        }
        console.log('Using original preview:', currentMedia.preview);
        return currentMedia.preview;
    };

    // Build filter string from edits (only apply if not already baked into exported file)
    const getFilterStyle = () => {
        if (hasExportedFile || !edits.filters) return 'none';
        const { brightness = 100, contrast = 100, saturate = 100, hueRotate = 0, sepia = 0, blur = 0 } = edits.filters;
        return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%) blur(${blur}px)`;
    };

    // Build crop clip-path from edits (only apply if not already baked into exported file)
    const getCropStyle = () => {
        if (hasExportedFile || !edits.crop) return 'none';
        const { x = 0, y = 0, width = 100, height = 100 } = edits.crop;
        return `inset(${y}% ${100 - x - width}% ${100 - y - height}% ${x}%)`;
    };

    const togglePlay = () => {
        if (!videoRef.current) {
            console.log('No video reference');
            return;
        }

        console.log('Toggle play - current state:', isPlaying);
        console.log('Video element:', videoRef.current);
        console.log('Video src:', videoRef.current.src);

        try {
            if (isPlaying) {
                // Pause both
                console.log('Pausing video and audio');
                videoRef.current.pause();
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
            } else {
                // Play both - with minimal delay
                console.log('Starting video playback');
                const videoPromise = videoRef.current.play();

                if (videoPromise) {
                    videoPromise.then(() => {
                        console.log('Video started playing successfully');
                        setIsPlaying(true);
                    }).catch(err => {
                        console.error('Video play failed:', err);
                        setIsPlaying(false);
                    });
                }

                if (audioRef.current && music) {
                    console.log('Starting audio playback');
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(err => {
                        console.log('Audio play error:', err);
                    });
                }
            }
        } catch (err) {
            console.error('Toggle play error:', err);
        }
    };

    const handlePublish = async () => {
        const success = await publish(mediaFiles, details, music, createMode);
        if (success) {
            setShowConfetti(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <h2>Preview & Share ({createMode || 'unknown'})</h2>
                <Button onClick={handlePublish} disabled={loading}>
                    {loading ? 'Sharing...' : 'Share'}
                </Button>
            </div>

            <div className={styles.content}>
                <div className={styles.previewCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.avatar} />
                        <div className={styles.headerInfo}>
                            <span className={styles.username}>You</span>
                            {music && (
                                <div className={styles.musicTag}>
                                    <Music size={12} />
                                    <span>{music.name} • {music.artist_name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.mediaWrapper}>
                        {videoError ? (
                            <div className={styles.errorContainer}>
                                <p className={styles.errorText}>{videoError}</p>
                                <button
                                    className={styles.retryBtn}
                                    onClick={() => {
                                        setVideoError(null);
                                        if (videoRef.current) {
                                            videoRef.current.load();
                                        }
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : isVideo ? (
                            <div className={styles.videoContainer}>
                                <video
                                    ref={videoRef}
                                    src={getVideoSource()}
                                    className={styles.media}
                                    style={{
                                        filter: getFilterStyle(),
                                        clipPath: getCropStyle()
                                    }}
                                    onEnded={() => {
                                        console.log('Video ended');
                                        setIsPlaying(false);
                                        if (audioRef.current) {
                                            audioRef.current.pause();
                                        }
                                    }}
                                    onPlay={() => {
                                        console.log('Video play event');
                                        setIsPlaying(true);
                                    }}
                                    onPause={() => {
                                        console.log('Video pause event');
                                        setIsPlaying(false);
                                    }}
                                    onError={(e) => {
                                        console.error('Video element error:', e);
                                    }}
                                    onLoadStart={() => {
                                        console.log('Video load start');
                                    }}
                                    preload="metadata"
                                    playsInline
                                    muted={!music} // Only mute if no music
                                />
                                <div className={styles.playOverlay} onClick={togglePlay}>
                                    {isPlaying ? <Pause size={48} /> : <Play size={48} fill="white" />}
                                </div>
                                {music && (
                                    <audio
                                        ref={audioRef}
                                        src={music.audio}
                                        loop
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                        ) : (
                            <img
                                src={currentMedia.preview}
                                className={styles.media}
                                style={{
                                    filter: edits.filter !== 'none'
                                        ? `url(#${edits.filter})`
                                        : 'none'
                                }}
                                alt="Preview"
                            />
                        )}
                    </div>

                    <div className={styles.captionInput}>
                        <textarea
                            className={styles.captionTextarea}
                            placeholder="Write a caption..."
                            value={details.caption || ''}
                            onChange={(e) => {
                                onUpdateDetails({ ...details, caption: e.target.value });
                            }}
                            maxLength={2200}
                            rows={3}
                        />
                        <div className={styles.captionCount}>
                            {(details.caption || '').length}/2200
                        </div>
                    </div>

                    <div className={styles.cardFooter}>
                        {details.caption && (
                            <p className={styles.caption}>
                                <span className={styles.username}>You</span> {details.caption}
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" className={styles.actionBtn}>
                        <Calendar size={18} /> Schedule
                    </Button>
                    <Button variant="secondary" className={styles.actionBtn}>
                        Save Draft
                    </Button>
                </div>

                {error && <p className={styles.error}>{error}</p>}
            </div>
        </div>
    );
};

export default PreviewPost;
