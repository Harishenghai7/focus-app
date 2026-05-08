import React, { useState, useRef, useEffect } from 'react';
import styles from './EditMedia.module.css';
import FilterGallery, { FILTERS } from '../../components/create/FilterGallery';
import AdjustmentPanel from '../../components/create/AdjustmentPanel';
import VideoEditor from '../../components/create/VideoEditor';
import FloatingToolbar from '../../components/create/FloatingToolbar';
import EffectsPanel from '../../components/create/EffectsPanel';
import TransitionsPanel from '../../components/create/TransitionsPanel';
import SubtitleEditor from '../../components/create/SubtitleEditor';
import Button from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSovereignForge } from '../../context/SovereignForgeContext';

const EditMedia = ({ mode, mediaFiles, onUpdateMedia, onNext, onBack }) => {
    const [activeTab, setActiveTab] = useState(mode === 'post' ? 'filter' : 'trim');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const canvasRef = useRef(null);
    const { state, dispatch } = useSovereignForge();

    const currentMedia = mediaFiles[currentMediaIndex];
    const edits = currentMedia?.edits || {};

    // Render photo preview on canvas
    useEffect(() => {
        if (!currentMedia || currentMedia.type === 'video') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = currentMedia.preview;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const filterStyle = FILTERS.find(f => f.id === edits.filter)?.style || '';
            const brightness = `brightness(${edits.brightness || 100}%)`;
            const contrast = `contrast(${edits.contrast || 100}%)`;
            const saturate = `saturate(${edits.saturation || 100}%)`;
            ctx.filter = `${filterStyle} ${brightness} ${contrast} ${saturate}`;
            ctx.drawImage(img, 0, 0);
        };
    }, [currentMedia, edits]);

    const handleEditChange = (key, value) => {
        onUpdateMedia(currentMedia.id, { [key]: value });
    };

    const handleVideoSave = (result) => {
        onUpdateMedia(currentMedia.id, {
            trim: result.trimRange, crop: result.crop, filters: result.filters,
            textOverlays: result.textOverlays, stickers: result.stickers,
            thumbnail: result.thumbnail, file: result.file, isEdited: true
        });
    };

    const handleEffectsUpdate = (updates) => {
        dispatch({ type: 'SET_EFFECTS', payload: updates });
    };

    const handleTransitionsUpdate = (transitions) => {
        dispatch({ type: 'SET_TRANSITIONS', payload: transitions });
    };

    const handleSubtitlesUpdate = (subtitles) => {
        dispatch({ type: 'SET_SUBTITLES', payload: subtitles });
    };

    // Render tool panel based on active tab
    const renderToolPanel = () => {
        switch (activeTab) {
            case 'filter':
                return (
                    <FilterGallery
                        activeFilter={edits.filter}
                        onSelect={(id) => handleEditChange('filter', id)}
                        previewImage={currentMedia?.preview}
                    />
                );
            case 'adjust':
                return <AdjustmentPanel values={edits} onChange={handleEditChange} />;
            case 'effects':
                return <EffectsPanel effects={state.effects} onUpdateEffects={handleEffectsUpdate} />;
            case 'transitions':
                return (
                    <TransitionsPanel
                        transitions={state.transitions}
                        onUpdateTransitions={handleTransitionsUpdate}
                    />
                );
            case 'subtitles':
                return (
                    <SubtitleEditor
                        subtitles={state.subtitles}
                        onUpdateSubtitles={handleSubtitlesUpdate}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={18} /> Back
                </Button>
                <h2 className={styles.headerTitle}>
                    {mode === 'flash' ? '✨ Edit Media' : mode === 'boltz' ? '⚡ Edit Video' : '🎨 Edit Photo'}
                </h2>
                <div className={styles.headerActions}>
                    {currentMedia?.type !== 'video' && (
                        <button
                            className={styles.fullscreenBtn}
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title="Toggle fullscreen"
                        >
                            <Maximize2 size={16} />
                        </button>
                    )}
                    <Button onClick={onNext}>
                        Next <ArrowRight size={16} />
                    </Button>
                </div>
            </div>

            {/* Editor workspace */}
            <div className={styles.workspace}>
                {currentMedia?.type === 'video' ? (
                    /* Full video editor */
                    <div className={styles.videoEditorWrapper}>
                        <VideoEditor
                            file={currentMedia.file}
                            onSave={handleVideoSave}
                            onCancel={() => {}}
                            initialTrim={edits.trim}
                        />
                    </div>
                ) : (
                    /* Photo editor with split pane */
                    <div className={styles.splitPane}>
                        {/* Left: Preview */}
                        <div className={styles.previewPane}>
                            <motion.div
                                className={styles.previewFrame}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <canvas ref={canvasRef} className={styles.mediaPreview} />

                                {/* Media navigation dots */}
                                {mediaFiles.length > 1 && (
                                    <div className={styles.mediaDots}>
                                        {mediaFiles.map((_, idx) => (
                                            <button
                                                key={idx}
                                                className={`${styles.dot} ${idx === currentMediaIndex ? styles.dotActive : ''}`}
                                                onClick={() => setCurrentMediaIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Floating toolbar */}
                            <div className={styles.floatingToolbarWrap}>
                                <FloatingToolbar
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    mode={mode}
                                />
                            </div>
                        </div>

                        {/* Right: Tool panel */}
                        <div className={styles.toolsPane}>
                            <div className={styles.toolsPaneHeader}>
                                <span className={styles.toolsPaneTitle}>
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </span>
                            </div>
                            <div className={styles.toolsPaneContent}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {renderToolPanel()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditMedia;
