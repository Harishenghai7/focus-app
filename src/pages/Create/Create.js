import React, { useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Create.module.css';
import MainLayout from '../../components/layout/MainLayout';
import TypeSelect from './TypeSelect';
import MediaSelect from './MediaSelect';
import EditMedia from './EditMedia';
import PreviewPost from './PreviewPost';
import DetailsStep from './DetailsStep';
import { AnimatePresence, motion } from 'framer-motion';
import CreateStepper from '../../components/create/CreateStepper';
import { SovereignForgeProvider, useSovereignForge } from '../../context/SovereignForgeContext';
import { Shield, RotateCcw, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Recovery Modal Component
const RecoveryModal = ({ onResume, onDiscard }) => (
    <motion.div className={styles.recoveryOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={styles.recoveryCard} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className={styles.recoveryIcon}><RotateCcw size={32} /></div>
            <h3>Recover Your Creation?</h3>
            <p>We found an unfinished post in progress. Would you like to resume where you left off?</p>
            <div className={styles.recoveryActions}>
                <button className={styles.discardBtn} onClick={onDiscard}>Start Fresh</button>
                <button className={styles.resumeBtn} onClick={onResume}>Resume Creation</button>
            </div>
        </motion.div>
    </motion.div>
);

// Shadow Upload Indicator
const ShadowUploadIndicator = ({ progress, inProgress, stage }) => {
    if (!inProgress && stage !== 'processing') return null;

    const stageLabels = {
        optimizing: 'Optimizing media...',
        uploading: `Uploading: ${progress}%`,
        processing: 'Processing...',
        complete: 'Upload complete',
        failed: 'Upload failed'
    };

    return (
        <motion.div className={styles.shadowUploadBar} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className={styles.shadowUploadContent}>
                <Shield size={16} className={styles.shadowIcon} />
                <span className={styles.shadowText}>{stageLabels[stage] || `Shadow Upload: ${progress}%`}</span>
                <div className={styles.shadowProgress}>
                    <motion.div className={styles.shadowProgressFill} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
            </div>
        </motion.div>
    );
};

// Autosave Indicator
const AutosaveIndicator = ({ status }) => {
    if (status === 'idle') return null;
    return (
        <motion.div className={styles.autosaveIndicator} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
            {status === 'saving' && <><Save size={12} className={styles.autosaveSpin} /><span>Saving...</span></>}
            {status === 'saved' && <><CheckCircle size={12} /><span>Saved</span></>}
        </motion.div>
    );
};

// Inner Create Component with Forge Context
const CreateInner = () => {
    const location = useLocation();

    const { state, dispatch, STEPS: ForgeSteps, startShadowUpload, resetForge } = useSovereignForge();
    const { step, createMode, mediaFiles, selectedMusic, postDetails, shadowUpload, isRecovering, autosaveStatus } = state;

    const initialMode = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'flash' || tab === 'post' || tab === 'boltz') return tab;
        return null;
    }, [location.search]);

    useEffect(() => {
        if (initialMode && step === ForgeSteps.TYPE && !isRecovering) {
            dispatch({ type: 'SET_CREATE_MODE', payload: initialMode });
            dispatch({ type: 'SET_STEP', payload: ForgeSteps.MEDIA });
        }
    }, [initialMode, step, isRecovering, dispatch, ForgeSteps]);

    useEffect(() => {
        if (mediaFiles.length > 0 && !shadowUpload.inProgress && shadowUpload.progress === 0) {
            const files = mediaFiles.map(m => m.file).filter(Boolean);
            if (files.length > 0) startShadowUpload(files, supabase);
        }
    }, [mediaFiles, shadowUpload.inProgress, shadowUpload.progress, startShadowUpload]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (step < ForgeSteps.PREVIEW) {
                    dispatch({ type: 'SET_STEP', payload: Math.min(step + 1, ForgeSteps.PREVIEW) });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [step, dispatch, ForgeSteps]);

    const handleNext = () => dispatch({ type: 'SET_STEP', payload: Math.min(step + 1, ForgeSteps.PREVIEW) });
    const handleBack = () => dispatch({ type: 'SET_STEP', payload: Math.max(step - 1, ForgeSteps.TYPE) });
    const handleModeSelect = (type) => {
        dispatch({ type: 'SET_CREATE_MODE', payload: type });
        dispatch({ type: 'SET_STEP', payload: ForgeSteps.MEDIA });
    };
    const handleMediaSelect = (files) => {
        dispatch({ type: 'SET_MEDIA_FILES', payload: files });
        handleNext();
    };
    const updateMedia = (id, newEdits) => dispatch({ type: 'UPDATE_MEDIA_EDITS', payload: { id, edits: newEdits } });
    const handleDetailsUpdate = (details) => dispatch({ type: 'SET_POST_DETAILS', payload: details });
    const handleDiscardRecovery = () => { resetForge(); dispatch({ type: 'SET_RECOVERING', payload: false }); };
    const handleResumeRecovery = () => dispatch({ type: 'SET_RECOVERING', payload: false });

    const completedSteps = Array.from({ length: Math.max(0, step - 1) }, (_, i) => i);

    const stepTransition = { duration: 0.38, ease: [0.22, 1, 0.36, 1] };

    return (
        <MainLayout>
            <div className={styles.sovereignContainer}>
                {/* Ambient background */}
                <div className={styles.ambientBg}>
                    <div className={styles.ambientOrb1} />
                    <div className={styles.ambientOrb2} />
                    <div className={styles.ambientOrb3} />
                </div>

                {isRecovering && <RecoveryModal onResume={handleResumeRecovery} onDiscard={handleDiscardRecovery} />}

                <ShadowUploadIndicator progress={shadowUpload.progress} inProgress={shadowUpload.inProgress} stage={shadowUpload.stage} />

                <div className={styles.wizard}>
                    {/* Stepper + Autosave */}
                    <div className={styles.stepperShell}>
                        <CreateStepper currentStep={Math.max(0, step - 1)} completedSteps={completedSteps} />
                        <AnimatePresence>
                            <AutosaveIndicator status={autosaveStatus} />
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === ForgeSteps.TYPE && (
                            <motion.div key="type" className={styles.stepFrame} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }} transition={stepTransition}>
                                <TypeSelect onSelect={handleModeSelect} />
                            </motion.div>
                        )}
                        {step === ForgeSteps.MEDIA && (
                            <motion.div key="media" className={styles.stepFrame} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }} transition={stepTransition}>
                                <MediaSelect mode={createMode} onNext={handleMediaSelect} onBack={handleBack} />
                            </motion.div>
                        )}
                        {step === ForgeSteps.EDIT && (
                            <motion.div key="edit" className={styles.stepFrame} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }} transition={stepTransition}>
                                <EditMedia mode={createMode} mediaFiles={mediaFiles} onUpdateMedia={updateMedia} onNext={handleNext} onBack={handleBack} />
                            </motion.div>
                        )}
                        {step === ForgeSteps.DETAILS && (
                            <motion.div key="details" className={styles.stepFrame} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }} transition={stepTransition}>
                                <DetailsStep details={postDetails} onUpdateDetails={handleDetailsUpdate} onNext={handleNext} onBack={handleBack} />
                            </motion.div>
                        )}
                        {step === ForgeSteps.PREVIEW && (
                            <motion.div key="preview" className={styles.stepFrame} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }} transition={stepTransition}>
                                <PreviewPost mediaFiles={mediaFiles} details={postDetails} music={selectedMusic} createMode={createMode}
                                    onBack={handleBack} onUpdateDetails={handleDetailsUpdate} shadowUploadUrls={shadowUpload.uploadedUrls} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
};

const Create = () => (
    <SovereignForgeProvider>
        <CreateInner />
    </SovereignForgeProvider>
);

export default Create;
