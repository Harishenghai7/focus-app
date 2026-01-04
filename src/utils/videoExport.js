/**
 * Video Export Utility
 * Exports video with all edits applied: trim, crop, filters, text overlays, and stickers
 */

export const exportEditedVideo = async ({
    videoElement,
    trimRange,
    crop,
    filters,
    textOverlays,
    stickers,
    onProgress,
    getCurrentFilterString
}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const video = videoElement;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Calculate output dimensions based on crop
            const videoCropWidth = video.videoWidth * (crop.width / 100);
            const videoCropHeight = video.videoHeight * (crop.height / 100);
            canvas.width = videoCropWidth;
            canvas.height = videoCropHeight;

            // Setup MediaRecorder with fallback formats
            const stream = canvas.captureStream(30); // 30 FPS
            const chunks = [];

            let mediaRecorderOptions;
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mediaRecorderOptions = {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: 3000000 // 3 Mbps for better compatibility
                };
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mediaRecorderOptions = {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: 2000000 // 2 Mbps
                };
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mediaRecorderOptions = {
                    mimeType: 'video/webm',
                    videoBitsPerSecond: 2000000
                };
            } else {
                // Fallback to default
                mediaRecorderOptions = {
                    videoBitsPerSecond: 2000000
                };
            }

            console.log('Using MediaRecorder with:', mediaRecorderOptions);
            const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            mediaRecorder.onerror = (error) => {
                reject(error);
            };

            // Ensure video is ready and set to start position
            video.muted = true; // Mute to avoid audio issues
            video.currentTime = trimRange[0];

            await new Promise((resolveSeek, rejectSeek) => {
                let seekAttempts = 0;
                const maxSeekAttempts = 5;

                const attemptSeek = () => {
                    seekAttempts++;
                    
                    const onSeeked = () => {
                        video.removeEventListener('seeked', onSeeked);
                        console.log(`Video seeked to ${video.currentTime}s`);
                        resolveSeek();
                    };

                    const onError = (e) => {
                        video.removeEventListener('error', onError);
                        console.error('Video seek error:', e);
                        if (seekAttempts < maxSeekAttempts) {
                            setTimeout(attemptSeek, 100);
                        } else {
                            rejectSeek(new Error('Failed to seek video'));
                        }
                    };

                    // Check if already at correct time
                    if (Math.abs(video.currentTime - trimRange[0]) < 0.1) {
                        resolveSeek();
                        return;
                    }

                    video.addEventListener('seeked', onSeeked);
                    video.addEventListener('error', onError);
                    video.currentTime = trimRange[0];
                };

                attemptSeek();
            });

            // Start recording
            console.log('Starting MediaRecorder');
            mediaRecorder.start();

            // Helper to apply filters
            const applyFilters = () => {
                if (getCurrentFilterString) {
                    return getCurrentFilterString();
                }
                let filterString = '';
                if (filters.brightness !== 100) filterString += `brightness(${filters.brightness}%) `;
                if (filters.contrast !== 100) filterString += `contrast(${filters.contrast}%) `;
                if (filters.saturate !== 100) filterString += `saturate(${filters.saturate}%) `;
                if (filters.blur !== 0) filterString += `blur(${filters.blur}px) `;
                if (filters.sepia !== 0) filterString += `sepia(${filters.sepia}%) `;
                if (filters.hueRotate !== 0) filterString += `hue-rotate(${filters.hueRotate}deg) `;
                return filterString.trim() || 'none';
            };

            // Export configuration
            const fps = 30;
            const duration = trimRange[1] - trimRange[0];
            const totalFrames = Math.ceil(duration * fps);
            let currentFrame = 0;
            let exportTimeout;

            console.log(`Starting export: ${duration}s, ${totalFrames} frames`);

            // Safety timeout to prevent infinite export
            const safetyTimeout = setTimeout(() => {
                console.error('Export timeout - stopping');
                video.pause();
                mediaRecorder.stop();
                reject(new Error('Export timeout'));
            }, Math.max(duration * 2000, 30000)); // 2x expected time or min 30s

            const renderFrame = () => {
                try {
                    // Check if we've reached the end
                    if (video.currentTime >= trimRange[1] || video.ended || currentFrame >= totalFrames) {
                        console.log('Export complete');
                        clearTimeout(safetyTimeout);
                        video.pause();
                        mediaRecorder.stop();
                        return;
                    }

                    // Clear canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.save();

                    // Calculate current time for this frame
                    const frameTime = trimRange[0] + (currentFrame / fps);
                    video.currentTime = frameTime;

                    // Apply crop
                    const cropX = video.videoWidth * (crop.x / 100);
                    const cropY = video.videoHeight * (crop.y / 100);

                    // Apply filters
                    ctx.filter = applyFilters();

                    // Draw video with crop
                    ctx.drawImage(
                        video,
                        cropX, cropY, videoCropWidth, videoCropHeight,
                        0, 0, canvas.width, canvas.height
                    );

                    // Reset filter for overlays
                    ctx.filter = 'none';

                    // Draw text overlays
                    if (textOverlays && textOverlays.length > 0) {
                        textOverlays.forEach(overlay => {
                            ctx.save();
                            ctx.font = `bold ${overlay.fontSize || 32}px ${overlay.fontFamily || 'Arial'}`;
                            ctx.fillStyle = overlay.color || '#ffffff';
                            ctx.strokeStyle = '#000000';
                            ctx.lineWidth = 2;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';

                            const x = (overlay.x / 100) * canvas.width;
                            const y = (overlay.y / 100) * canvas.height;

                            ctx.strokeText(overlay.text, x, y);
                            ctx.fillText(overlay.text, x, y);
                            ctx.restore();
                        });
                    }

                    // Draw stickers
                    if (stickers && stickers.length > 0) {
                        stickers.forEach(sticker => {
                            if (sticker.image && sticker.image.complete) {
                                ctx.save();
                                const scale = sticker.scale || 1;
                                const stickerWidth = 80 * scale; // Slightly smaller
                                const stickerHeight = 80 * scale;
                                const stickerX = (sticker.x / 100) * canvas.width - stickerWidth / 2;
                                const stickerY = (sticker.y / 100) * canvas.height - stickerHeight / 2;

                                if (sticker.rotation) {
                                    ctx.translate(stickerX + stickerWidth / 2, stickerY + stickerHeight / 2);
                                    ctx.rotate((sticker.rotation * Math.PI) / 180);
                                    ctx.drawImage(
                                        sticker.image,
                                        -stickerWidth / 2,
                                        -stickerHeight / 2,
                                        stickerWidth,
                                        stickerHeight
                                    );
                                } else {
                                    ctx.drawImage(
                                        sticker.image,
                                        stickerX,
                                        stickerY,
                                        stickerWidth,
                                        stickerHeight
                                    );
                                }
                                ctx.restore();
                            }
                        });
                    }

                    ctx.restore();

                    // Report progress
                    if (onProgress) {
                        const progress = (currentFrame / totalFrames) * 100;
                        onProgress(Math.min(progress, 100));
                    }

                    currentFrame++;

                    // Continue to next frame
                    exportTimeout = setTimeout(() => {
                        requestAnimationFrame(renderFrame);
                    }, 1000 / fps);

                } catch (error) {
                    console.error('Frame render error:', error);
                    clearTimeout(safetyTimeout);
                    video.pause();
                    mediaRecorder.stop();
                    reject(error);
                }
            };

            // Start render loop
            renderFrame();

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Simple export for images (no processing needed)
 */
export const exportImage = async (file) => {
    // Images don't need processing, just return the original
    return file;
};
