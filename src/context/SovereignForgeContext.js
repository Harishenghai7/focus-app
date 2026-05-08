import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { performPurityScan } from '../services/ContentModerationService';

const STORAGE_KEY = 'sovereign_forge_state';
const UPLOAD_QUEUE_KEY = 'sovereign_upload_queue';
const AUTOSAVE_INTERVAL = 3000;

const STEPS = {
    TYPE: 0,
    MEDIA: 1,
    EDIT: 2,
    DETAILS: 3,   // Merged Music + Details into one step
    PREVIEW: 4
};

const initialState = {
    step: STEPS.TYPE,
    createMode: null,
    mediaFiles: [],
    selectedMusic: null,
    postDetails: {
        caption: '',
        location: null,
        tags: [],
        audience: 'everyone',
        hideLikes: false,
        turnOffComments: false,
        mentions: [],
        scheduledAt: null
    },
    poll: {
        enabled: false,
        question: '',
        options: ['', ''],
        duration: '24h'
    },
    subtitles: [],
    effects: {
        speed: 1,
        reverse: false,
        loop: false,
        boomerang: false
    },
    transitions: [],
    thumbnailConfig: {
        type: 'auto',         // 'auto' | 'frame' | 'custom'
        frameTime: 0,
        customFile: null
    },
    shadowUpload: {
        inProgress: false,
        progress: 0,
        uploadedUrls: [],
        errors: [],
        stage: 'idle'         // 'idle' | 'optimizing' | 'uploading' | 'processing' | 'complete' | 'failed'
    },
    uploadRetry: {
        attempts: 0,
        maxAttempts: 3,
        lastError: null,
        canRetry: false
    },
    purityCheck: {
        isScanning: false,
        passed: null,
        violations: [],
        warnings: [],
        contentRating: 1.0
    },
    draftId: null,
    lastSaved: null,
    isRecovering: false,
    autosaveStatus: 'idle'    // 'idle' | 'saving' | 'saved' | 'error'
};

const actionTypes = {
    SET_STEP: 'SET_STEP',
    SET_CREATE_MODE: 'SET_CREATE_MODE',
    SET_MEDIA_FILES: 'SET_MEDIA_FILES',
    UPDATE_MEDIA_EDITS: 'UPDATE_MEDIA_EDITS',
    REORDER_MEDIA: 'REORDER_MEDIA',
    REMOVE_MEDIA: 'REMOVE_MEDIA',
    SET_MUSIC: 'SET_MUSIC',
    SET_POST_DETAILS: 'SET_POST_DETAILS',
    SET_POLL: 'SET_POLL',
    SET_SUBTITLES: 'SET_SUBTITLES',
    SET_EFFECTS: 'SET_EFFECTS',
    SET_TRANSITIONS: 'SET_TRANSITIONS',
    SET_THUMBNAIL_CONFIG: 'SET_THUMBNAIL_CONFIG',
    SET_SHADOW_UPLOAD: 'SET_SHADOW_UPLOAD',
    SET_UPLOAD_STAGE: 'SET_UPLOAD_STAGE',
    SET_PURITY_CHECK: 'SET_PURITY_CHECK',
    SET_UPLOAD_RETRY: 'SET_UPLOAD_RETRY',
    SET_DRAFT_ID: 'SET_DRAFT_ID',
    SET_AUTOSAVE_STATUS: 'SET_AUTOSAVE_STATUS',
    SAVE_STATE: 'SAVE_STATE',
    LOAD_STATE: 'LOAD_STATE',
    CLEAR_STATE: 'CLEAR_STATE',
    SET_RECOVERING: 'SET_RECOVERING',
    UPDATE_UPLOAD_PROGRESS: 'UPDATE_UPLOAD_PROGRESS',
    COMPLETE_UPLOAD: 'COMPLETE_UPLOAD',
    ADD_UPLOAD_ERROR: 'ADD_UPLOAD_ERROR'
};

const forgeReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_STEP:
            return { ...state, step: action.payload };
        case actionTypes.SET_CREATE_MODE:
            return { ...state, createMode: action.payload };
        case actionTypes.SET_MEDIA_FILES:
            return { ...state, mediaFiles: action.payload };
        case actionTypes.UPDATE_MEDIA_EDITS:
            return {
                ...state,
                mediaFiles: state.mediaFiles.map(item =>
                    item.id === action.payload.id
                        ? { ...item, edits: { ...item.edits, ...action.payload.edits } }
                        : item
                )
            };
        case actionTypes.REORDER_MEDIA: {
            const { fromIndex, toIndex } = action.payload;
            const newFiles = [...state.mediaFiles];
            const [moved] = newFiles.splice(fromIndex, 1);
            newFiles.splice(toIndex, 0, moved);
            return { ...state, mediaFiles: newFiles };
        }
        case actionTypes.REMOVE_MEDIA:
            return {
                ...state,
                mediaFiles: state.mediaFiles.filter(f => f.id !== action.payload)
            };
        case actionTypes.SET_MUSIC:
            return { ...state, selectedMusic: action.payload };
        case actionTypes.SET_POST_DETAILS:
            return { ...state, postDetails: { ...state.postDetails, ...action.payload } };
        case actionTypes.SET_POLL:
            return { ...state, poll: { ...state.poll, ...action.payload } };
        case actionTypes.SET_SUBTITLES:
            return { ...state, subtitles: action.payload };
        case actionTypes.SET_EFFECTS:
            return { ...state, effects: { ...state.effects, ...action.payload } };
        case actionTypes.SET_TRANSITIONS:
            return { ...state, transitions: action.payload };
        case actionTypes.SET_THUMBNAIL_CONFIG:
            return { ...state, thumbnailConfig: { ...state.thumbnailConfig, ...action.payload } };
        case actionTypes.SET_SHADOW_UPLOAD:
            return { ...state, shadowUpload: { ...state.shadowUpload, ...action.payload } };
        case actionTypes.SET_UPLOAD_STAGE:
            return { ...state, shadowUpload: { ...state.shadowUpload, stage: action.payload } };
        case actionTypes.UPDATE_UPLOAD_PROGRESS:
            return {
                ...state,
                shadowUpload: {
                    ...state.shadowUpload,
                    progress: action.payload.progress,
                    uploadedUrls: action.payload.urls || state.shadowUpload.uploadedUrls
                }
            };
        case actionTypes.COMPLETE_UPLOAD:
            return {
                ...state,
                shadowUpload: {
                    ...state.shadowUpload,
                    inProgress: false,
                    progress: 100,
                    uploadedUrls: action.payload.urls,
                    stage: 'complete'
                }
            };
        case actionTypes.ADD_UPLOAD_ERROR:
            return {
                ...state,
                shadowUpload: {
                    ...state.shadowUpload,
                    errors: [...state.shadowUpload.errors, action.payload],
                    stage: 'failed'
                }
            };
        case actionTypes.SET_UPLOAD_RETRY:
            return { ...state, uploadRetry: { ...state.uploadRetry, ...action.payload } };
        case actionTypes.SET_PURITY_CHECK:
            return { ...state, purityCheck: { ...state.purityCheck, ...action.payload } };
        case actionTypes.SET_DRAFT_ID:
            return { ...state, draftId: action.payload };
        case actionTypes.SET_AUTOSAVE_STATUS:
            return { ...state, autosaveStatus: action.payload };
        case actionTypes.SAVE_STATE:
            return { ...state, lastSaved: new Date().toISOString(), autosaveStatus: 'saved' };
        case actionTypes.LOAD_STATE:
            return { ...state, ...action.payload, isRecovering: false };
        case actionTypes.SET_RECOVERING:
            return { ...state, isRecovering: action.payload };
        case actionTypes.CLEAR_STATE:
            return { ...initialState };
        default:
            return state;
    }
};

const SovereignForgeContext = createContext(null);

export const SovereignForgeProvider = ({ children }) => {
    const [state, dispatch] = useReducer(forgeReducer, initialState);
    const saveTimeoutRef = useRef(null);

    // Autosave with debounce — persists every 3 seconds
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (state.step === STEPS.TYPE && !state.createMode) return;

            dispatch({ type: actionTypes.SET_AUTOSAVE_STATUS, payload: 'saving' });

            const stateToSave = {
                step: state.step,
                createMode: state.createMode,
                mediaFiles: state.mediaFiles.map(f => ({
                    ...f,
                    preview: f.preview,
                    file: null
                })),
                selectedMusic: state.selectedMusic,
                postDetails: state.postDetails,
                poll: state.poll,
                subtitles: state.subtitles,
                effects: state.effects,
                transitions: state.transitions,
                thumbnailConfig: { ...state.thumbnailConfig, customFile: null },
                shadowUpload: state.shadowUpload,
                draftId: state.draftId,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            dispatch({ type: actionTypes.SAVE_STATE });

            // Reset status to idle after 2s
            setTimeout(() => {
                dispatch({ type: actionTypes.SET_AUTOSAVE_STATUS, payload: 'idle' });
            }, 2000);
        }, AUTOSAVE_INTERVAL);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [state.step, state.createMode, state.mediaFiles, state.selectedMusic, state.postDetails, state.poll, state.subtitles, state.effects, state.transitions, state.thumbnailConfig, state.shadowUpload, state.draftId]);

    // Recovery on mount
    useEffect(() => {
        const recoverState = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const lastSaved = new Date(parsed.lastSaved);
                    const now = new Date();
                    const hoursSinceSave = (now - lastSaved) / (1000 * 60 * 60);

                    if (hoursSinceSave < 24 && parsed.step > STEPS.TYPE) {
                        const sanitizedState = {
                            ...parsed,
                            selectedMusic: parsed.selectedMusic || null,
                            mediaFiles: Array.isArray(parsed.mediaFiles) ? parsed.mediaFiles : [],
                            postDetails: {
                                caption: '',
                                location: null,
                                tags: [],
                                audience: 'everyone',
                                hideLikes: false,
                                turnOffComments: false,
                                mentions: [],
                                scheduledAt: null,
                                ...parsed.postDetails
                            },
                            poll: {
                                enabled: false,
                                question: '',
                                options: ['', ''],
                                duration: '24h',
                                ...parsed.poll
                            },
                            subtitles: parsed.subtitles || [],
                            effects: {
                                speed: 1,
                                reverse: false,
                                loop: false,
                                boomerang: false,
                                ...parsed.effects
                            },
                            transitions: parsed.transitions || [],
                            thumbnailConfig: {
                                type: 'auto',
                                frameTime: 0,
                                customFile: null,
                                ...parsed.thumbnailConfig
                            }
                        };

                        dispatch({ type: actionTypes.SET_RECOVERING, payload: true });
                        dispatch({ type: actionTypes.LOAD_STATE, payload: sanitizedState });
                    }
                }
            } catch (error) {
                console.error('[SovereignForge] Recovery failed:', error);
            }
        };

        recoverState();
    }, []);

    // Shadow Upload Pipeline
    const startShadowUpload = useCallback(async (files, supabaseClient) => {
        dispatch({
            type: actionTypes.SET_SHADOW_UPLOAD,
            payload: { inProgress: true, progress: 0, uploadedUrls: [], errors: [], stage: 'optimizing' }
        });

        // Brief optimization stage
        await new Promise(resolve => setTimeout(resolve, 500));
        dispatch({ type: actionTypes.SET_UPLOAD_STAGE, payload: 'uploading' });

        const uploadedUrls = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `temp/${fileName}`;

                const { error } = await supabaseClient.storage
                    .from('shadow-uploads')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabaseClient.storage
                    .from('shadow-uploads')
                    .getPublicUrl(filePath);

                uploadedUrls.push({
                    originalId: file.id,
                    tempPath: filePath,
                    publicUrl,
                    status: 'uploaded'
                });

                dispatch({
                    type: actionTypes.UPDATE_UPLOAD_PROGRESS,
                    payload: {
                        progress: Math.round(((i + 1) / totalFiles) * 100),
                        urls: uploadedUrls
                    }
                });
            } catch (error) {
                console.error(`[ShadowUpload] Failed for ${file.name}:`, error);
                dispatch({
                    type: actionTypes.ADD_UPLOAD_ERROR,
                    payload: { file: file.name, error: error.message }
                });
                dispatch({
                    type: actionTypes.SET_UPLOAD_RETRY,
                    payload: { canRetry: true, lastError: error.message }
                });
            }
        }

        dispatch({ type: actionTypes.SET_UPLOAD_STAGE, payload: 'processing' });
        await new Promise(resolve => setTimeout(resolve, 300));

        dispatch({
            type: actionTypes.COMPLETE_UPLOAD,
            payload: { urls: uploadedUrls }
        });

        return uploadedUrls;
    }, []);

    // Retry failed uploads with exponential backoff
    const retryUpload = useCallback(async (files, supabaseClient) => {
        const { attempts, maxAttempts } = state.uploadRetry;
        if (attempts >= maxAttempts) return;

        const backoffMs = Math.min(1000 * Math.pow(2, attempts), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));

        dispatch({
            type: actionTypes.SET_UPLOAD_RETRY,
            payload: { attempts: attempts + 1, canRetry: false }
        });

        return startShadowUpload(files, supabaseClient);
    }, [state.uploadRetry, startShadowUpload]);

    // Purity Gate - Content Moderation
    const runPurityCheck = useCallback(async (content) => {
        dispatch({
            type: actionTypes.SET_PURITY_CHECK,
            payload: { isScanning: true, passed: null, violations: [], warnings: [] }
        });

        try {
            const results = await performPurityScan(content);

            dispatch({
                type: actionTypes.SET_PURITY_CHECK,
                payload: {
                    isScanning: false,
                    passed: results.passed && !results.blocked,
                    violations: results.violations,
                    warnings: results.warnings,
                    contentRating: results.contentRating
                }
            });

            return results;
        } catch (error) {
            console.error('[PurityCheck] Scan failed:', error);
            dispatch({
                type: actionTypes.SET_PURITY_CHECK,
                payload: {
                    isScanning: false,
                    passed: false,
                    violations: [{ type: 'SCAN_ERROR', message: error.message }],
                    contentRating: 0
                }
            });
            return { passed: false, error };
        }
    }, []);

    // Navigation helpers
    const goToStep = useCallback((step) => {
        dispatch({ type: actionTypes.SET_STEP, payload: step });
    }, []);

    const nextStep = useCallback(() => {
        dispatch({ type: actionTypes.SET_STEP, payload: Math.min(state.step + 1, STEPS.PREVIEW) });
    }, [state.step]);

    const prevStep = useCallback(() => {
        dispatch({ type: actionTypes.SET_STEP, payload: Math.max(state.step - 1, STEPS.TYPE) });
    }, [state.step]);

    const resetForge = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(UPLOAD_QUEUE_KEY);
        dispatch({ type: actionTypes.CLEAR_STATE });
    }, []);

    const value = {
        state,
        dispatch,
        STEPS,
        actionTypes,
        startShadowUpload,
        retryUpload,
        runPurityCheck,
        goToStep,
        nextStep,
        prevStep,
        resetForge
    };

    return (
        <SovereignForgeContext.Provider value={value}>
            {children}
        </SovereignForgeContext.Provider>
    );
};

export const useSovereignForge = () => {
    const context = useContext(SovereignForgeContext);
    if (!context) {
        throw new Error('useSovereignForge must be used within SovereignForgeProvider');
    }
    return context;
};

export { STEPS };
