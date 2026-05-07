import React, { useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { SovereignForgeProvider, useSovereignForge, STEPS } from '../../context/SovereignForgeContext';
import { Shield, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Recovery Modal Component
const RecoveryModal = ({ onResume, onDiscard }) => (
    <motion.div
        className={styles.recoveryOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <motion.div
            className={styles.recoveryCard}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className={styles.recoveryIcon}>
                <RotateCcw size={32} />
            </div>
            <h3>Recover Your Creation?</h3>
            <p>We found an unfinished post in progress. Would you like to resume where you left off?</p>
            <div className={styles.recoveryActions}>
                <button className={styles.discardBtn} onClick={onDiscard}>
                    Start Fresh
                </button>
                <button className={styles.resumeBtn} onClick={onResume}>
                    Resume Creation
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// Shadow Upload Indicator
const ShadowUploadIndicator = ({ progress, inProgress }) => {
    if (!inProgress) return null;

    return (
        <motion.div
            className={styles.shadowUploadBar}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className={styles.shadowUploadContent}>
                <Shield size={16} className={styles.shadowIcon} />
                <span className={styles.shadowText}>Shadow Upload: {progress}%</span>
                <div className={styles.shadowProgress}>
                    <motion.div
                        className={styles.shadowProgressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// Inner Create Component with Forge Context
const CreateInner = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        state,
        dispatch,
        STEPS: ForgeSteps,
        startShadowUpload,
        resetForge
    } = useSovereignForge();

    const { step, createMode, mediaFiles, selectedMusic, postDetails, shadowUpload, isRecovering } = state;

    const initialMode = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'flash' || tab === 'post' || tab === 'boltz') return tab;
        return null;
    }, [location.search]);

    // Initialize from URL params
    useEffect(() => {
        if (initialMode && step === ForgeSteps.TYPE && !isRecovering) {
            dispatch({ type: 'SET_CREATE_MODE', payload: initialMode });
            dispatch({ type: 'SET_STEP', payload: ForgeSteps.MEDIA });
        }
    }, [initialMode, step, isRecovering, dispatch, ForgeSteps]);

    // Start shadow upload when media is selected
    useEffect(() => {
        if (mediaFiles.length > 0 && !shadowUpload.inProgress && shadowUpload.progress === 0) {
            // Start shadow upload in background
            const files = mediaFiles.map(m => m.file).filter(Boolean);
            if (files.length > 0) {
                startShadowUpload(files, supabase);
            }
        }
    }, [mediaFiles, shadowUpload.inProgress, shadowUpload.progress, startShadowUpload]);

    const handleNext = () => {
        dispatch({ type: 'SET_STEP', payload: Math.min(step + 1, ForgeSteps.PREVIEW) });
    };

    const handleBack = () => {
        dispatch({ type: 'SET_STEP', payload: Math.max(step - 1, ForgeSteps.TYPE) });
    };

    const handleModeSelect = (type) => {
        dispatch({ type: 'SET_CREATE_MODE', payload: type });
        dispatch({ type: 'SET_STEP', payload: ForgeSteps.MEDIA });
    };

    const handleMediaSelect = (files) => {
        dispatch({ type: 'SET_MEDIA_FILES', payload: files });
        handleNext();
    };

    const updateMedia = (id, newEdits) => {
        dispatch({ type: 'UPDATE_MEDIA_EDITS', payload: { id, edits: newEdits } });
    };

    const handleMusicSelect = (music) => {
        dispatch({ type: 'SET_MUSIC', payload: music });
    };

    const handleDetailsUpdate = (details) => {
        dispatch({ type: 'SET_POST_DETAILS', payload: details });
    };

    const handleDiscardRecovery = () => {
        resetForge();
        dispatch({ type: 'SET_RECOVERING', payload: false });
    };

    const handleResumeRecovery = () => {
        dispatch({ type: 'SET_RECOVERING', payload: false });
    };

    const completedSteps = Array.from({ length: Math.max(0, step - 1) }, (_, i) => i);

    return (
        <MainLayout>
            <div className={styles.sovereignContainer}>
                {/* Recovery Modal */}
                {isRecovering && (
                    <RecoveryModal
                        onResume={handleResumeRecovery}
                        onDiscard={handleDiscardRecovery}
                    />
                )}

                {/* Shadow Upload Indicator */}
                <ShadowUploadIndicator
                    progress={shadowUpload.progress}
                    inProgress={shadowUpload.inProgress}
                />

                <div className={styles.wizard}>
                    <div className={styles.stepperShell}>
                        <CreateStepper
                            currentStep={Math.max(0, step - 1)}
                            completedSteps={completedSteps}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === ForgeSteps.TYPE && (
                            <motion.div
                                key="type"
                                className={styles.stepFrame}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <TypeSelect onSelect={handleModeSelect} />
                            </motion.div>
                        )}

                        {step === ForgeSteps.MEDIA && (
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
                                    onNext={handleMediaSelect}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}

                        {step === ForgeSteps.EDIT && (
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

                        {step === ForgeSteps.MUSIC && (
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
                                    onSelect={handleMusicSelect}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}

                        {step === ForgeSteps.DETAILS && (
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
                                    onUpdateDetails={handleDetailsUpdate}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                />
                            </motion.div>
                        )}

                        {step === ForgeSteps.PREVIEW && (
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
                                    onUpdateDetails={handleDetailsUpdate}
                                    shadowUploadUrls={shadowUpload.uploadedUrls}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
};

// Wrap with Provider
const Create = () => (
    <SovereignForgeProvider>
        <CreateInner />
    </SovereignForgeProvider>
);

export default Create;
