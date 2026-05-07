import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { performPurityScan } from '../services/ContentModerationService';

const STORAGE_KEY = 'sovereign_forge_state';
const UPLOAD_QUEUE_KEY = 'sovereign_upload_queue';

const STEPS = {
    TYPE: 0,
    MEDIA: 1,
    EDIT: 2,
    MUSIC: 3,
    DETAILS: 4,
    PREVIEW: 5
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
        turnOffComments: false
    },
    shadowUpload: {
        inProgress: false,
        progress: 0,
        uploadedUrls: [],
        errors: []
    },
    purityCheck: {
        isScanning: false,
        passed: null,
        violations: [],
        warnings: [],
        contentRating: 1.0
    },
    lastSaved: null,
    isRecovering: false
};

const actionTypes = {
    SET_STEP: 'SET_STEP',
    SET_CREATE_MODE: 'SET_CREATE_MODE',
    SET_MEDIA_FILES: 'SET_MEDIA_FILES',
    UPDATE_MEDIA_EDITS: 'UPDATE_MEDIA_EDITS',
    SET_MUSIC: 'SET_MUSIC',
    SET_POST_DETAILS: 'SET_POST_DETAILS',
    SET_SHADOW_UPLOAD: 'SET_SHADOW_UPLOAD',
    SET_PURITY_CHECK: 'SET_PURITY_CHECK',
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
        case actionTypes.SET_MUSIC:
            return { ...state, selectedMusic: action.payload };
        case actionTypes.SET_POST_DETAILS:
            return { ...state, postDetails: { ...state.postDetails, ...action.payload } };
        case actionTypes.SET_SHADOW_UPLOAD:
            return { ...state, shadowUpload: { ...state.shadowUpload, ...action.payload } };
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
                    uploadedUrls: action.payload.urls
                }
            };
        case actionTypes.ADD_UPLOAD_ERROR:
            return {
                ...state,
                shadowUpload: {
                    ...state.shadowUpload,
                    errors: [...state.shadowUpload.errors, action.payload]
                }
            };
        case actionTypes.SET_PURITY_CHECK:
            return { ...state, purityCheck: { ...state.purityCheck, ...action.payload } };
        case actionTypes.SAVE_STATE:
            return { ...state, lastSaved: new Date().toISOString() };
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
    const uploadWorkerRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    // Persist state to localStorage with debounce
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
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
                shadowUpload: state.shadowUpload,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            dispatch({ type: actionTypes.SAVE_STATE });
        }, 500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [state.step, state.createMode, state.mediaFiles, state.selectedMusic, state.postDetails, state.shadowUpload]);

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
                        // Sanitize loaded state to prevent undefined/null issues
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
                                ...parsed.postDetails
                            }
                        };

                        dispatch({ type: actionTypes.SET_RECOVERING, payload: true });
                        dispatch({ type: actionTypes.LOAD_STATE, payload: sanitizedState });

                        setTimeout(() => {
                            dispatch({ type: actionTypes.SET_RECOVERING, payload: false });
                        }, 1500);
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
            payload: { inProgress: true, progress: 0, uploadedUrls: [], errors: [] }
        });

        const uploadedUrls = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `temp/${fileName}`;

                const { data, error } = await supabaseClient.storage
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
            }
        }

        dispatch({
            type: actionTypes.COMPLETE_UPLOAD,
            payload: { urls: uploadedUrls }
        });

        return uploadedUrls;
    }, []);

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
