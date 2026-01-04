import { useEffect, useRef } from 'react';

export const useVideoPlayer = (currentIndex, videos, playing, muted) => {
    const videoRefs = useRef([]);

    useEffect(() => {
        // Pause all videos except current
        videoRefs.current.forEach((video, index) => {
            if (video) {
                if (index === currentIndex && playing) {
                    video.play().catch(err => {
                        if (err.name !== 'AbortError') {
                            console.error('Play error:', err);
                        }
                    });
                } else {
                    video.pause();
                }
                video.muted = muted;
            }
        });
    }, [currentIndex, playing, muted]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            videoRefs.current.forEach(video => {
                if (video) {
                    video.pause();
                    video.src = '';
                }
            });
        };
    }, []);

    const setVideoRef = (index) => (ref) => {
        videoRefs.current[index] = ref;
    };

    return { setVideoRef, videoRefs };
};
