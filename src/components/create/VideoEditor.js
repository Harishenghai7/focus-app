import React, { useState, useRef, useEffect } from 'react';
import styles from './VideoEditor.module.css';
import { useVideoEditor } from '../../hooks/useVideoEditor';
import { Play, Pause, X, Type, Sticker, Scissors, Sliders, Image as ImageIcon, Trash2, Crop as CropIcon, RotateCcw } from 'lucide-react';
import { formatDuration } from '../../utils/formatDuration';
import StickerPicker from './StickerPicker';
import VideoTimeline from './VideoTimeline';
import CropOverlay from './CropOverlay';
import ThumbnailSelector from './ThumbnailSelector';
import { VIDEO_FILTERS, getFilterString, applyFilterIntensity, getFilterById } from '../../utils/videoFilters';
import { ASPECT_RATIOS, calculateCropForAspectRatio } from '../../utils/cropUtils';
import { exportEditedVideo } from '../../utils/videoExport';

const FONTS = [
    { name: 'Arial', style: "'Arial', sans-serif" },
    { name: 'Impact', style: "'Impact', sans-serif" },
    { name: 'Georgia', style: "'Georgia', serif" },
    { name: 'Comic Sans', style: "'Comic Sans MS', cursive" },
    { name: 'Courier', style: "'Courier New', monospace" },
    { name: 'Verdana', style: "'Verdana', sans-serif" },
    { name: 'Times', style: "'Times New Roman', serif" },
    { name: 'Trebuchet', style: "'Trebuchet MS', sans-serif" },
    { name: 'Brush', style: "'Brush Script MT', cursive" },
    { name: 'Pacifico', style: "'Pacifico', cursive" },
];

const VideoEditor = ({ file, onSave, onCancel }) => {
    const {
        videoSrc, trimRange, updateTrim, duration, videoRef, handleLoadedMetadata,
        currentTime, setCurrentTime, filters, updateFilter, resetFilters,
        selectedFilter, setSelectedFilter, filterIntensity, setFilterIntensity,
        textOverlays, addTextOverlay, updateTextOverlay, removeTextOverlay,
        stickers, addSticker, updateSticker, removeSticker,
        activeTab, setActiveTab,
        aspectRatio, setAspectRatio, crop, setCrop
    } = useVideoEditor(URL.createObjectURL(file));

    const [isPlaying, setIsPlaying] = useState(false);
    const [activeOverlayId, setActiveOverlayId] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [newText, setNewText] = useState('');
    const [selectedFont, setSelectedFont] = useState('Arial');
    const [showCropOverlay, setShowCropOverlay] = useState(false);
    const [filterPreviews, setFilterPreviews] = useState({});
    const [selectedThumbnail, setSelectedThumbnail] = useState(null);

    const containerRef = useRef(null);

    // Video playback and trim range enforcement
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (!video.paused && !video.ended) {
                setCurrentTime(video.currentTime);
                if (video.currentTime >= trimRange[1]) {
                    video.currentTime = trimRange[0];
                    if (isPlaying && video.paused) {
                        video.play().catch(() => {});
                    }
                }
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [videoRef, setCurrentTime, trimRange, isPlaying]);

    // Crop overlay visibility
    useEffect(() => {
        setShowCropOverlay(activeTab === 'crop');
    }, [activeTab]);

    // Generate filter previews
    useEffect(() => {
        if (!videoRef.current || !duration) return;

        const generatePreviews = async () => {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 120;
            canvas.height = 67;

            video.currentTime = duration / 2;
            await new Promise(resolve => { video.onseeked = resolve; });

            const previews = {};
            VIDEO_FILTERS.forEach(filter => {
                ctx.filter = getFilterString(filter.values);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                previews[filter.id] = canvas.toDataURL('image/jpeg', 0.7);
            });

            setFilterPreviews(previews);
        };

        generatePreviews().catch(console.error);
    }, [videoRef, duration]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => {
                  // Autoplay prevented
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const getCurrentFilterString = () => {
        const filterPreset = getFilterById(selectedFilter);
        const filterValues = applyFilterIntensity(filterPreset.values, filterIntensity);
        const combinedFilters = { ...filterValues, ...filters };
        return getFilterString(combinedFilters);
    };

    const handleDragStart = (e, id) => {
        e.stopPropagation();
        setActiveOverlayId(id);
    };

    const handleDragMove = (e) => {
        if (!activeOverlayId || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const isText = textOverlays.find(t => t.id === activeOverlayId);
        if (isText) {
            updateTextOverlay(activeOverlayId, { x, y });
        } else {
            updateSticker(activeOverlayId, { x, y });
        }
    };

    const handleDragEnd = () => setActiveOverlayId(null);

    const handleAspectRatioChange = (ratioKey) => {
        setAspectRatio(ratioKey);
        const ratio = ASPECT_RATIOS[ratioKey];
        if (videoRef.current) {
            const newCrop = calculateCropForAspectRatio(
                videoRef.current.videoWidth,
                videoRef.current.videoHeight,
                ratio.value
            );
            setCrop(newCrop);
        }
    };

    const handleFilterSelect = (filterId) => {
        setSelectedFilter(filterId);
        const filter = getFilterById(filterId);
        Object.entries(filter.values).forEach(([key, value]) => {
            updateFilter(key, value);
        });
    };

    const handleExportAndSave = async () => {
        try {
            setIsExporting(true);
            setExportProgress(0);

            // Check if any edits were made
            const hasEdits = 
                trimRange[0] !== 0 || 
                trimRange[1] !== duration ||
                crop.x !== 0 || crop.y !== 0 || crop.width !== 100 || crop.height !== 100 ||
                selectedFilter !== 'normal' ||
                textOverlays.length > 0 ||
                stickers.length > 0;

            let exportedFile;

            if (!hasEdits) {
                // FAST PATH: No edits, use original file (instant!)

                exportedFile = file;
                setExportProgress(100);
            } else {
                // SLOW PATH: Process video with edits

                
                const stickersWithImages = await Promise.all(
                    stickers.map(async (sticker) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = sticker.url;
                        });
                        return { ...sticker, image: img };
                    })
                );

                const exportedBlob = await exportEditedVideo({
                    videoElement: videoRef.current,
                    trimRange,
                    crop,
                    filters,
                    textOverlays,
                    stickers: stickersWithImages,
                    onProgress: setExportProgress,
                    getCurrentFilterString
                });

                exportedFile = new File([exportedBlob], 'edited-video.webm', { type: 'video/webm' });
            }

            // Call onSave with the exported data
            onSave({
                file: exportedFile,
                trimRange,
                filters,
                textOverlays,
                stickers,
                crop,
                thumbnail: selectedThumbnail,
                isEdited: hasEdits
            });

        } catch (error) {
            console.error('Export failed:', error);
            let errorMessage = 'Failed to export video. ';
            
            if (error.message.includes('timeout')) {
                errorMessage += 'Export took too long. Try reducing video length or complexity.';
            } else if (error.message.includes('MediaRecorder')) {
                errorMessage += 'Your browser may not support video recording. Try using Chrome or Firefox.';
            } else if (error.message.includes('seek')) {
                errorMessage += 'Failed to process video timeline. Please try again.';
            } else {
                errorMessage += 'Please try again or use a different video.';
            }
            
            alert(errorMessage);
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.previewWrapper} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <div className={styles.videoPreviewArea} ref={containerRef}>
                    <div className={styles.videoContainer}>
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            className={styles.video}
                            style={{
                                filter: getCurrentFilterString(),
                                objectFit: 'contain',
                                clipPath: `inset(${crop.y}% ${100 - crop.x - crop.width}% ${100 - crop.y - crop.height}% ${crop.x}%)`
                            }}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            onClick={togglePlay}
                            playsInline
                            crossOrigin="anonymous"
                        />

                        {showCropOverlay && (
                            <CropOverlay
                                crop={crop}
                                onCropChange={setCrop}
                                aspectRatio={ASPECT_RATIOS[aspectRatio]?.value}
                                videoWidth={videoRef.current?.videoWidth || 1920}
                                videoHeight={videoRef.current?.videoHeight || 1080}
                                containerRef={containerRef}
                            />
                        )}

                        <div className={styles.overlayContainer}>
                            {stickers.map(sticker => (
                                <div
                                    key={sticker.id}
                                    className={`${styles.overlayItem} ${activeOverlayId === sticker.id ? styles.active : ''}`}
                                    style={{
                                        left: `${sticker.x}%`,
                                        top: `${sticker.y}%`,
                                        transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`
                                    }}
                                    onMouseDown={(e) => handleDragStart(e, sticker.id)}
                                >
                                    <img src={sticker.url} alt="sticker" className={styles.overlaySticker} />
                                    {activeOverlayId === sticker.id && (
                                        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {textOverlays.map(text => (
                                <div
                                    key={text.id}
                                    className={`${styles.overlayItem} ${activeOverlayId === text.id ? styles.active : ''}`}
                                    style={{
                                        left: `${text.x}%`,
                                        top: `${text.y}%`,
                                        transform: `translate(-50%, -50%) scale(${text.scale}) rotate(${text.rotation}deg)`,
                                        fontFamily: text.fontFamily || 'Arial'
                                    }}
                                    onMouseDown={(e) => handleDragStart(e, text.id)}
                                >
                                    <span className={styles.overlayText} style={{ color: text.color, fontSize: `${text.fontSize}px` }}>
                                        {text.text}
                                    </span>
                                    {activeOverlayId === text.id && (
                                        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); removeTextOverlay(text.id); }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!isPlaying && (
                            <div className={styles.playOverlay} onClick={togglePlay}>
                                <Play size={64} fill="white" />
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.previewFooter}>
                    <div className={styles.previewInfo}>
                        <span>⏱ {formatDuration(currentTime)} / {formatDuration(duration)}</span>
                        <span>✂️ {formatDuration(trimRange[1] - trimRange[0])}</span>
                    </div>
                    <button className={styles.playPauseButton} onClick={togglePlay}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>
            </div>

            <div className={styles.controls}>
                <VideoTimeline
                    videoRef={videoRef}
                    duration={duration}
                    currentTime={currentTime}
                    trimRange={trimRange}
                    onTrimChange={updateTrim}
                    onSeek={handleSeek}
                />

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'trim' ? styles.active : ''}`} onClick={() => setActiveTab('trim')}>
                        <Scissors size={20} /> Trim
                    </button>
                    <button className={`${styles.tab} ${activeTab === 'crop' ? styles.active : ''}`} onClick={() => setActiveTab('crop')}>
                        <CropIcon size={20} /> Crop
                    </button>
                    <button className={`${styles.tab} ${activeTab === 'filter' ? styles.active : ''}`} onClick={() => setActiveTab('filter')}>
                        <ImageIcon size={20} /> Filters
                    </button>
                    <button className={`${styles.tab} ${activeTab === 'adjust' ? styles.active : ''}`} onClick={() => setActiveTab('adjust')}>
                        <Sliders size={20} /> Adjust
                    </button>
                    <button className={`${styles.tab} ${activeTab === 'text' ? styles.active : ''}`} onClick={() => setActiveTab('text')}>
                        <Type size={20} /> Text
                    </button>
                    <button className={`${styles.tab} ${activeTab === 'sticker' ? styles.active : ''}`} onClick={() => setActiveTab('sticker')}>
                        <Sticker size={20} /> Sticker
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'trim' && (
                        <div className={styles.trimContent}>
                            <p className={styles.helpText}>Use the timeline above to trim your video. Drag the trim handles on the timeline or use the manual time inputs (Start/End) in the timeline header to precisely set trim points.</p>
                        </div>
                    )}

                    {activeTab === 'crop' && (
                        <div className={styles.cropContent}>
                            <div className={styles.aspectRatioButtons}>
                                {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                                    <button
                                        key={key}
                                        className={`${styles.ratioBtn} ${aspectRatio === key ? styles.active : ''}`}
                                        onClick={() => handleAspectRatioChange(key)}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                            <p className={styles.helpText}>Select an aspect ratio and drag the crop box on the video to reposition.</p>
                        </div>
                    )}

                    {activeTab === 'filter' && (
                        <div className={styles.filterContent}>
                            <div className={styles.filterGrid}>
                                {VIDEO_FILTERS.map(f => (
                                    <div key={f.id} className={`${styles.filterItem} ${selectedFilter === f.id ? styles.active : ''}`} onClick={() => handleFilterSelect(f.id)}>
                                        <div className={styles.filterPreview}>
                                            {filterPreviews[f.id] ? (
                                                <img src={filterPreviews[f.id]} alt={f.name} />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    filter: getFilterString(f.values)
                                                }} />
                                            )}
                                        </div>
                                        <span className={styles.filterName}>{f.name}</span>
                                    </div>
                                ))}
                            </div>
                            {selectedFilter !== 'normal' && (
                                <div className={styles.filterIntensity}>
                                    <div className={styles.adjustLabel}>
                                        <span>Intensity</span>
                                        <span>{filterIntensity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={filterIntensity}
                                        onChange={(e) => setFilterIntensity(parseInt(e.target.value))}
                                        className={styles.rangeInput}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'adjust' && (
                        <div className={styles.adjustContent}>
                            <div className={styles.adjustHeader}>
                                <h4>Manual Adjustments</h4>
                                <button variant="ghost" size="sm" onClick={resetFilters} className={styles.resetButton}>
                                    <RotateCcw size={14} /> Reset All
                                </button>
                            </div>
                            {[
                                { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%' },
                                { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
                                { key: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
                                { key: 'hueRotate', label: 'Hue', min: 0, max: 360, unit: '°' },
                                { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
                                { key: 'blur', label: 'Blur', min: 0, max: 10, unit: 'px', step: 0.1 }
                            ].map((adj) => (
                                <div key={adj.key} className={styles.adjustSlider}>
                                    <div className={styles.adjustLabel}>
                                        <span>{adj.label}</span>
                                        <span>{filters[adj.key]}{adj.unit}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={adj.min}
                                        max={adj.max}
                                        step={adj.step || 1}
                                        value={filters[adj.key]}
                                        onChange={(e) => updateFilter(adj.key, adj.step ? parseFloat(e.target.value) : parseInt(e.target.value))}
                                        className={styles.rangeInput}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className={styles.textContent}>
                            <div className={styles.fontPicker}>
                                {FONTS.map(font => (
                                    <button
                                        key={font.name}
                                        className={`${styles.fontBtn} ${selectedFont === font.name ? styles.active : ''}`}
                                        onClick={() => setSelectedFont(font.name)}
                                    >
                                        <span className={styles.fontPreview} style={{ fontFamily: font.style }}>Aa</span>
                                        <span className={styles.fontName}>{font.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className={styles.textInputRow}>
                                <input
                                    type="text"
                                    placeholder="Enter text..."
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newText.trim()) {
                                            addTextOverlay(newText, FONTS.find(f => f.name === selectedFont)?.style || 'Arial');
                                            setNewText('');
                                        }
                                    }}
                                    className={styles.textInput}
                                    style={{ fontFamily: FONTS.find(f => f.name === selectedFont)?.style || 'Arial' }}
                                />
                                <button className={styles.addButton} onClick={() => {
                                    if (newText.trim()) {
                                        addTextOverlay(newText, FONTS.find(f => f.name === selectedFont)?.style || 'Arial');
                                        setNewText('');
                                    }
                                }}>Add</button>
                            </div>
                            {textOverlays.length > 0 && (
                                <div className={styles.overlayList}>
                                    {textOverlays.map(text => (
                                        <div key={text.id} className={styles.overlayListItem}>
                                            <span style={{ fontFamily: text.fontFamily }}>{text.text}</span>
                                            <button onClick={() => removeTextOverlay(text.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'sticker' && (
                        <StickerPicker onSelect={addSticker} />
                    )}
                </div>

                <div className={styles.bottomBar}>
                    <ThumbnailSelector
                        videoRef={videoRef}
                        currentTime={currentTime}
                        getCurrentFilterString={getCurrentFilterString}
                        onThumbnailSelect={setSelectedThumbnail}
                        selectedThumbnail={selectedThumbnail}
                    />
                    <div className={styles.exportActions}>
                        <button onClick={onCancel} className={styles.cancelBtn} disabled={isExporting}>
                            Cancel
                        </button>
                        <button
                            onClick={handleExportAndSave}
                            className={styles.saveBtn}
                            disabled={isExporting}
                        >
                            {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Save Video'}
                        </button>
                    </div>
                </div>

                {isExporting && (
                    <div className={styles.exportOverlay}>
                        <div className={styles.exportProgress}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                            <p>Exporting video with all edits... {Math.round(exportProgress)}%</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoEditor;
