import { useState, useEffect, useCallback, useRef } from 'react';

// Using a public client ID for Jamendo (or a placeholder that works for demo purposes)
// In production, this should be an environment variable
const CLIENT_ID = process.env.REACT_APP_JAMENDO_CLIENT_ID || 'c9720322';

export const useJamendo = () => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioElementRef = useRef(null);
    const [error, setError] = useState(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioElementRef.current) {
                try {
                    audioElementRef.current.pause();
                    audioElementRef.current.src = '';
                } catch (err) {
                    console.log('Cleanup error:', err);
                }
            }
        };
    }, []);

    const fetchTracks = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            // First try with the basic API without audiodownload restriction
            const queryParams = new URLSearchParams({
                client_id: CLIENT_ID,
                format: 'json',
                limit: 20,
                order: params.order || 'popularity_week',
                tags: params.tags || undefined,
                namesearch: params.namesearch || undefined,
            });

            // Remove undefined values
            for (let [key, value] of queryParams.entries()) {
                if (value === 'undefined') {
                    queryParams.delete(key);
                }
            }

            console.log('Fetching from:', `https://api.jamendo.com/v3.0/tracks/?${queryParams}`);
            const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${queryParams}`);
            const data = await response.json();

            console.log('API Response:', data);

            if (data.results && Array.isArray(data.results)) {


                // Map tracks and create audio URLs
                let tracksWithAudio = data.results
                    .map(track => {
                        // Use Jamendo's official streaming URL format
                        // Format: https://mp3d.jamendo.com/?trackid=TRACK_ID&format=mp32&from=app-CLIENT_ID
                        const audioUrl = track.audiodownload ||
                            track.audio ||
                            (track.id ? `https://mp3d.jamendo.com/?trackid=${track.id}&format=mp32&from=app-${CLIENT_ID}` : null);

                        console.log(`Track: ${track.name}, Audio URL:`, audioUrl);
                        return {
                            ...track,
                            audio: audioUrl
                        };
                    })
                    .filter(track => track.audio);

                // If no tracks with audio, use fallback
                if (tracksWithAudio.length === 0) {
                    console.log('No Jamendo tracks with audio');
                }

                console.log(`Loaded ${tracksWithAudio.length} tracks with audio`);
                setTracks(tracksWithAudio);

                if (tracksWithAudio.length === 0) {
                    setError('No audio tracks available. Please try again later.');
                }
            } else {
                console.error('Invalid API response format:', data);
                // Use fallback tracks on API error
                console.log('Using fallback tracks due to API error');
                setTracks([]);
            }
        } catch (err) {
            console.error('Jamendo API Error:', err);
            // Use local fallback on network error
            console.log('Network error, using fallback tracks');
            setTracks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Test if audio can be played at all
        const testAudio = () => {
            try {
                const audio = new Audio();
                audio.crossOrigin = 'anonymous';
                // Use a simple test audio data URL
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCzuJ0fPSeCgFJHfO8tiJOgkbaLjt55xMEw1Mp+XwtWEcBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFA==';

                audio.oncanplaythrough = () => {
                    console.log('Audio system working correctly');
                };

                audio.onerror = (e) => {
                    console.error('Basic audio test failed:', e);
                };

                audio.load();
            } catch (err) {
                console.error('Audio not supported:', err);
            }
        };

        // Run audio test then fetch tracks
        testAudio();
        fetchTracks({ order: 'popularity_week' });
    }, [fetchTracks]);

    const search = (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            // Debounce could be added here
            fetchTracks({ namesearch: query });
        } else if (query.length === 0) {
            fetchTracks({ order: 'popularity_week' });
        }
    };

    const filterByCategory = (tag) => {
        setSearchQuery('');
        if (tag === 'All') {
            fetchTracks({ order: 'popularity_week' });
        } else {
            fetchTracks({ tags: tag.toLowerCase() });
        }
    };

    const playPromiseRef = useRef(null);

    const playPreview = async (track) => {
        try {
            // If same track is already playing, stop it
            if (currentTrack?.id === track.id && isPlaying) {
                if (audioElementRef.current) {
                    audioElementRef.current.pause();
                }
                setIsPlaying(false);
                setCurrentTrack(null);
                return;
            }

            // Get audio URL with multiple fallbacks
            const audioUrl = track.audio || track.audiodownload || track.preview_url ||
                (track.id ? `https://mp3d.jamendo.com/?trackid=${track.id}&format=mp32&from=app-${CLIENT_ID}` : null);

            if (!audioUrl) {
                console.log('No audio URL available for track:', track.name);
                setError('This track does not have a playable preview');
                setIsPlaying(false);
                return;
            }

            console.log('Attempting to play audio from:', audioUrl);

            // Stop any currently playing audio WITHOUT creating new instance
            if (audioElementRef.current) {
                // If there is a pending play promise, wait for it to resolve before pausing
                if (playPromiseRef.current) {
                    try {
                        await playPromiseRef.current;
                    } catch (e) {
                        // Ignore abort errors from previous play attempts
                    }
                }
                audioElementRef.current.pause();
                audioElementRef.current.currentTime = 0;
            } else {
                // Create audio element only once
                audioElementRef.current = new Audio();
                audioElementRef.current.crossOrigin = 'anonymous';
            }

            // Set the source
            audioElementRef.current.src = audioUrl;
            console.log('Loading audio:', audioUrl);

            // Clear any previous handlers
            audioElementRef.current.onended = null;
            audioElementRef.current.onerror = null;

            // Set new handlers
            audioElementRef.current.onended = () => {
                console.log('Audio ended:', track.name);
                setIsPlaying(false);
                playPromiseRef.current = null;
            };

            audioElementRef.current.onerror = (e) => {
                console.error('Audio failed to load:', audioUrl, 'Error:', e);
                setIsPlaying(false);
                playPromiseRef.current = null;

                // Try to provide more specific error message
                if (audioElementRef.current.error) {
                    const errorCode = audioElementRef.current.error.code;
                    const errorMessages = {
                        1: 'Audio loading was aborted',
                        2: 'Network error occurred while loading audio',
                        3: 'Audio decoding failed',
                        4: 'Audio format not supported'
                    };
                    setError(`Audio error: ${errorMessages[errorCode] || 'Unknown error'}`);
                } else {
                    setError('Failed to load audio - source may be unavailable');
                }
            };

            // Update state BEFORE playing
            setCurrentTrack(track);

            // Play with proper error handling
            const playPromise = audioElementRef.current.play();
            playPromiseRef.current = playPromise;

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Playing:', track.name);
                        setIsPlaying(true);
                    })
                    .catch(error => {
                        // Auto-play policy or interrupted by pause
                        if (error.name === 'AbortError') {
                            console.log('Playback aborted (likely due to rapid switching)');
                        } else {
                            console.error('Play error:', error.message);
                            setError('Playback failed: ' + error.message);
                        }
                        setIsPlaying(false);
                        // Only reset current track if this specific play attempt failed
                        // and we haven't already switched to another track
                        if (currentTrack?.id === track.id) {
                            setCurrentTrack(null);
                        }
                    })
                    .finally(() => {
                        // Clear the promise ref if it's still the same promise
                        if (playPromiseRef.current === playPromise) {
                            playPromiseRef.current = null;
                        }
                    });
            } else {
                setIsPlaying(true);
            }
        } catch (err) {
            console.error('Exception in playPreview:', err);
            setIsPlaying(false);
            setError('Failed to play audio');
        }
    };

    // Function to stop audio playback (can be called externally)
    const stopPlayback = useCallback(() => {
        try {
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                audioElementRef.current.currentTime = 0;
                // Don't set to null - reuse the element
            }
        } catch (err) {
            console.log('Error in stopPlayback:', err);
        }
        setIsPlaying(false);
        setCurrentTrack(null);
    }, []);

    return {
        tracks,
        loading,
        error,
        search,
        filterByCategory,
        currentTrack,
        isPlaying,
        playPreview,
        stopPlayback,
        searchQuery
    };
};
