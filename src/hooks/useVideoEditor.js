import { useState, useRef } from 'react';

export const useVideoEditor = (initialVideo) => {
    const [videoSrc, setVideoSrc] = useState(initialVideo);
    const [trimRange, setTrimRange] = useState([0, 60]); // Default 0-60s
    const [duration, setDuration] = useState(0);
    const [thumbnail, setThumbnail] = useState(null);
    const videoRef = useRef(null);

    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturate: 100,
        sepia: 0,
        grayscale: 0,
        blur: 0,
        hueRotate: 0,
        exposure: 0, // -100 to 100
        highlights: 0, // -100 to 100
        shadows: 0, // -100 to 100
        temperature: 0, // -100 to 100 (warmth)
        tint: 0, // -100 to 100
        sharpness: 0, // 0 to 100
        vignette: 0, // 0 to 100
        grain: 0 // 0 to 100
    });
    const [selectedFilter, setSelectedFilter] = useState('normal');
    const [filterIntensity, setFilterIntensity] = useState(100);
    const [aspectRatio, setAspectRatio] = useState('original');
    const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [textOverlays, setTextOverlays] = useState([]);
    const [stickers, setStickers] = useState([]);
    const [audioTrack, setAudioTrack] = useState(null); // { url, name, volume: 1, start: 0 }
    const [playbackRate, setPlaybackRate] = useState(1);
    const [activeTab, setActiveTab] = useState('trim'); // trim, filter, adjust, crop, text, sticker, music
    const [currentTime, setCurrentTime] = useState(0);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setTrimRange([0, Math.min(dur, 60)]);
        }
    };

    const updateTrim = (newRange) => {
        setTrimRange(newRange);
        if (videoRef.current) {
            videoRef.current.currentTime = newRange[0];
        }
    };

    const addTextOverlay = (text, fontFamily = 'Arial') => {
        setTextOverlays([...textOverlays, {
            id: Date.now(),
            text,
            x: 50, // percent
            y: 50, // percent
            color: '#ffffff',
            fontSize: 24,
            fontFamily,
            rotation: 0,
            scale: 1
        }]);
    };

    const updateTextOverlay = (id, updates) => {
        setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeTextOverlay = (id) => {
        setTextOverlays(textOverlays.filter(t => t.id !== id));
    };

    const addSticker = (url) => {
        setStickers([...stickers, {
            id: Date.now(),
            url,
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0
        }]);
    };

    const updateSticker = (id, updates) => {
        setStickers(stickers.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeSticker = (id) => {
        setStickers(stickers.filter(s => s.id !== id));
    };

    const updateFilter = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            brightness: 100,
            contrast: 100,
            saturate: 100,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0,
            exposure: 0,
            highlights: 0,
            shadows: 0,
            temperature: 0,
            tint: 0,
            sharpness: 0,
            vignette: 0,
            grain: 0
        });
        setSelectedFilter('normal');
        setFilterIntensity(100);
    };

    return {
        videoSrc,
        setVideoSrc,
        trimRange,
        updateTrim,
        duration,
        thumbnail,
        setThumbnail,
        videoRef,
        handleLoadedMetadata,
        currentTime,
        setCurrentTime,
        // Filter features
        filters,
        updateFilter,
        resetFilters,
        selectedFilter,
        setSelectedFilter,
        filterIntensity,
        setFilterIntensity,
        // Overlay features
        textOverlays,
        addTextOverlay,
        updateTextOverlay,
        removeTextOverlay,
        stickers,
        addSticker,
        updateSticker,
        removeSticker,
        // Audio
        audioTrack,
        setAudioTrack,
        playbackRate,
        setPlaybackRate,
        // UI
        activeTab,
        setActiveTab,
        // Crop
        aspectRatio,
        setAspectRatio,
        crop,
        setCrop
    };
};
