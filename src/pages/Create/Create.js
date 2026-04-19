import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Create.module.css';
import MainLayout from '../../components/layout/MainLayout';
import TypeSelect from './TypeSelect';
import MediaSelect from './MediaSelect';
import EditMedia from './EditMedia';
import AddMusic from './AddMusic';
import PreviewPost from './PreviewPost';
import { AnimatePresence, motion } from 'framer-motion';
import CreateStepper from '../../components/create/CreateStepper';
import DetailsStep from './DetailsStep';

const STEPS = {
    TYPE: 0,
    MEDIA: 1,
    EDIT: 2,
    MUSIC: 3,
    DETAILS: 4,
    PREVIEW: 5
};

const Create = () => {
    const location = useLocation();
    const initialMode = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'flash' || tab === 'post' || tab === 'boltz') return tab;
        return null;
    }, [location.search]);

    const [step, setStep] = useState(initialMode ? STEPS.MEDIA : STEPS.TYPE);
    const [createMode, setCreateMode] = useState(initialMode); // 'post', 'boltz', 'flash'
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
                    <div className={styles.stepperShell}>
                        <CreateStepper
                            currentStep={Math.max(0, step - 1)}
                            completedSteps={Array.from({ length: Math.max(0, step - 1) }, (_, i) => i)}
                        />
                    </div>
                    <AnimatePresence mode="wait">
                        {step === STEPS.TYPE && (
                            <motion.div
                                key="type"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <TypeSelect
                                    onSelect={(type) => {
                                        setCreateMode(type);
                                        handleNext();
                                    }}
                                />
                            </motion.div>
                        )}
                        {step === STEPS.MEDIA && (
                            <motion.div
                                key="media"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <MediaSelect
                                    mode={createMode}
                                    onNext={(files) => {
                                        setMediaFiles(files);
                                        handleNext();
                                    }}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}
                        {step === STEPS.EDIT && (
                            <motion.div
                                key="edit"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <EditMedia
                                    mode={createMode}
                                    mediaFiles={mediaFiles}
                                    onUpdateMedia={updateMedia}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}
                        {step === STEPS.MUSIC && (
                            <motion.div
                                key="music"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <AddMusic
                                    selectedMusic={selectedMusic}
                                    onSelect={setSelectedMusic}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}
                        {step === STEPS.DETAILS && (
                            <motion.div
                                key="details"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <DetailsStep
                                    details={postDetails}
                                    onUpdateDetails={setPostDetails}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}
                        {step === STEPS.PREVIEW && (
                            <motion.div
                                key="preview"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <PreviewPost
                                    mediaFiles={mediaFiles}
                                    details={postDetails}
                                    music={selectedMusic}
                                    createMode={createMode}
                                    onBack={handleBack}
                                    onUpdateDetails={setPostDetails}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
};

export default Create;
