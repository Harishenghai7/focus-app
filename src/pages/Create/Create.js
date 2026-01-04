import React, { useState } from 'react';
import styles from './Create.module.css';
import MainLayout from '../../components/layout/MainLayout';
import TypeSelect from './TypeSelect';
import MediaSelect from './MediaSelect';
import EditMedia from './EditMedia';
import AddMusic from './AddMusic';
import PreviewPost from './PreviewPost';
import { AnimatePresence } from 'framer-motion';

const STEPS = {
    TYPE: 0,
    MEDIA: 1,
    EDIT: 2,
    MUSIC: 3,
    PREVIEW: 4
};

const Create = () => {
    const [step, setStep] = useState(STEPS.TYPE);
    const [createMode, setCreateMode] = useState(null); // 'post', 'boltz', 'flash'
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [postDetails, setPostDetails] = useState({
        caption: '',
        location: null,
        tags: [],
        audience: 'everyone',
        hideLikes: false,
        turnOffComments: false
    });

    const handleNext = () => {
        setStep(prev => Math.min(prev + 1, STEPS.PREVIEW));
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, STEPS.TYPE));
    };

    const updateMedia = (id, newEdits) => {
        setMediaFiles(prev => prev.map(item =>
            item.id === id ? { ...item, edits: { ...item.edits, ...newEdits } } : item
        ));
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.wizard}>
                    <AnimatePresence mode="wait">
                        {step === STEPS.TYPE && (
                            <TypeSelect
                                key="type"
                                onSelect={(type) => {
                                    setCreateMode(type);
                                    handleNext();
                                }}
                            />
                        )}
                        {step === STEPS.MEDIA && (
                            <MediaSelect
                                key="media"
                                mode={createMode}
                                onNext={(files) => {
                                    setMediaFiles(files);
                                    handleNext();
                                }}
                                onBack={handleBack}
                            />
                        )}
                        {step === STEPS.EDIT && (
                            <EditMedia
                                key="edit"
                                mode={createMode}
                                mediaFiles={mediaFiles}
                                onUpdateMedia={updateMedia}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {step === STEPS.MUSIC && (
                            <AddMusic
                                key="music"
                                selectedMusic={selectedMusic}
                                onSelect={setSelectedMusic}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {step === STEPS.PREVIEW && (
                            <PreviewPost
                                key="preview"
                                mediaFiles={mediaFiles}
                                details={postDetails}
                                music={selectedMusic}
                                createMode={createMode}
                                onBack={handleBack}
                                onUpdateDetails={setPostDetails}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
};

export default Create;
