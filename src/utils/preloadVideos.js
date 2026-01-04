export const preloadVideos = (videos, currentIndex, count = 2) => {
    const videosToPreload = [];

    // Preload next videos
    for (let i = 1; i <= count; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < videos.length && videos[nextIndex]) {
            videosToPreload.push(videos[nextIndex]);
        }
    }

    // Preload previous video
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0 && videos[prevIndex]) {
        videosToPreload.push(videos[prevIndex]);
    }

    // Create video elements to trigger preload
    videosToPreload.forEach(video => {
        if (video.video_url) {
            const videoElement = document.createElement('video');
            videoElement.src = video.video_url;
            videoElement.preload = 'auto';
            videoElement.load();
        }
    });
};
