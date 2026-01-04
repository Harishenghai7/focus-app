import React, { useState, useRef, useEffect } from 'react';
import styles from './EditMedia.module.css';
import FilterGallery, { FILTERS } from '../../components/create/FilterGallery';
import AdjustmentPanel from '../../components/create/AdjustmentPanel';
import VideoEditor from '../../components/create/VideoEditor';
import Button from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, Wand2, Sliders, Crop, Type, Smile } from 'lucide-react';

const TABS = [
    { id: 'filter', icon: Wand2, label: 'Filter' },
    { id: 'adjust', icon: Sliders, label: 'Adjust' },
];

const EditMedia = ({ mode, mediaFiles, onUpdateMedia, onNext, onBack }) => {
    const [activeTab, setActiveTab] = useState('filter');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const canvasRef = useRef(null);

    const currentMedia = mediaFiles[currentMediaIndex];
    const edits = currentMedia.edits;

    useEffect(() => {
        if (!currentMedia || currentMedia.type === 'video') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = currentMedia.preview;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            const filterStyle = FILTERS.find(f => f.id === edits.filter)?.style || '';
            const brightness = `brightness(${edits.brightness}%)`;
            const contrast = `contrast(${edits.contrast}%)`;
            const saturate = `saturate(${edits.saturation}%)`;

            ctx.filter = `${filterStyle} ${brightness} ${contrast} ${saturate}`;

            ctx.drawImage(img, 0, 0);
        };
    }, [currentMedia, edits]);

    const handleEditChange = (key, value) => {
        onUpdateMedia(currentMedia.id, { [key]: value });
    };

    const handleVideoSave = (result) => {
        // Update all video metadata
        onUpdateMedia(currentMedia.id, {
            trim: result.trimRange,
            crop: result.crop,
            filters: result.filters,
            textOverlays: result.textOverlays,
            stickers: result.stickers,
            thumbnail: result.thumbnail,
            file: result.file, // If exported, this is the new file
            isEdited: true
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <h2>Edit {mode === 'flash' ? 'Media' : mode === 'boltz' ? 'Video' : 'Photo'}</h2>
                <Button onClick={onNext}>
                    Next <ArrowRight size={16} />
                </Button>
            </div>

            <div className={styles.workspace}>
                {currentMedia.type === 'video' ? (
                    <div className={styles.videoEditorWrapper}>
                        <VideoEditor
                            file={currentMedia.file}
                            onSave={handleVideoSave}
                            onCancel={() => { }} // No cancel needed in this flow
                            initialTrim={edits.trim}
                        />
                    </div>
                ) : (
                    <>
                        <div className={styles.previewArea}>
                            <canvas ref={canvasRef} className={styles.mediaPreview} />

                            {mediaFiles.length > 1 && (
                                <div className={styles.dots}>
                                    {mediaFiles.map((_, idx) => (
                                        <button
                                            key={idx}
                                            className={`${styles.dot} ${idx === currentMediaIndex ? styles.activeDot : ''}`}
                                            onClick={() => setCurrentMediaIndex(idx)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.toolsPanel}>
                            <div className={styles.tabs}>
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <tab.icon size={20} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.toolContent}>
                                {activeTab === 'filter' && (
                                    <FilterGallery
                                        activeFilter={edits.filter}
                                        onSelect={(id) => handleEditChange('filter', id)}
                                        previewImage={currentMedia.preview}
                                    />
                                )}
                                {activeTab === 'adjust' && (
                                    <AdjustmentPanel
                                        values={edits}
                                        onChange={handleEditChange}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditMedia;
