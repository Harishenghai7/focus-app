import React, { useMemo, useState, useCallback, useEffect } from 'react';

import { ArrowLeft, ArrowRight, Hash, MapPin, Type, TrendingUp, X, Shield, AlertTriangle, Loader2 } from 'lucide-react';

import Button from '../../components/ui/Button';

import styles from './DetailsStep.module.css';

import { useTrending } from '../../hooks/useTrending';
import { useToxicityScanner } from '../../hooks/useToxicityScanner';

import { motion, AnimatePresence } from 'framer-motion';



const parseTags = (value) =>

    value

        .split(',')

        .map((item) => item.trim().replace(/^#/, ''))

        .filter(Boolean)

        .slice(0, 10);



const PurityGateIndicator = ({ scanState }) => {

    const { isScanning, isClean, isQuestionable, isToxic, isBlocked, purityScore, violations } = scanState;

    if (isScanning) {
        return (
            <motion.div
                className={styles.purityIndicator}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Loader2 size={16} className={styles.spinIcon} />
                <span className={styles.purityText}>Scanning content...</span>
            </motion.div>
        );
    }

    if (isBlocked || isToxic) {
        return (
            <motion.div
                className={`${styles.purityIndicator} ${styles.purityBlocked}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <AlertTriangle size={18} />
                <span className={styles.purityText}>Content blocked - violates guidelines</span>
                {violations?.length > 0 && (
                    <span className={styles.violationCount}>
                        {violations.length} violation{violations.length > 1 ? 's' : ''}
                    </span>
                )}
            </motion.div>
        );
    }

    if (isQuestionable) {
        return (
            <motion.div
                className={`${styles.purityIndicator} ${styles.purityWarning}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Shield size={16} />
                <span className={styles.purityText}>May be flagged for review</span>
                <span className={styles.purityScore}>{Math.round(purityScore * 100)}%</span>
            </motion.div>
        );
    }

    if (isClean && purityScore < 1) {
        return (
            <motion.div
                className={`${styles.purityIndicator} ${styles.purityClean}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Shield size={16} />
                <span className={styles.purityText}>Purity Verified</span>
                <span className={styles.purityScore}>{Math.round(purityScore * 100)}%</span>
            </motion.div>
        );
    }

    return null;
};


const DetailsStep = ({ details, onUpdateDetails, onBack, onNext }) => {

    const [caption, setCaption] = useState(details?.caption || '');

    const [tagInput, setTagInput] = useState((details?.tags || []).join(', '));

    const [location, setLocation] = useState(details?.location || '');

    const [showSuggestions, setShowSuggestions] = useState(false);



    const { trendingHashtags, loading: trendingLoading } = useTrending();

    const { scanText, ...scanState } = useToxicityScanner();

    useEffect(() => {
        scanText(caption);
    }, [caption, scanText]);



    const tagsPreview = useMemo(() => parseTags(tagInput), [tagInput]);



    // Get available trending tags (not already selected)

    const availableTrending = useMemo(() => {

        const selectedTags = tagsPreview.map(t => t.toLowerCase());

        return trendingHashtags

            .filter(t => !selectedTags.includes(t.tag.toLowerCase()))

            .slice(0, 8);

    }, [trendingHashtags, tagsPreview]);



    const addTag = useCallback((tag) => {

        const currentTags = parseTags(tagInput);

        if (currentTags.length >= 10) return;



        const newTags = [...currentTags, tag];

        setTagInput(newTags.join(', '));

    }, [tagInput]);



    const removeTag = useCallback((tagToRemove) => {

        const currentTags = parseTags(tagInput);

        const newTags = currentTags.filter(t => t !== tagToRemove);

        setTagInput(newTags.join(', '));

    }, [tagInput]);



    const handleContinue = () => {

        onUpdateDetails({

            ...details,

            caption: caption.trim(),

            tags: tagsPreview,

            location: location.trim() || null,

        });

        onNext?.();

    };



    return (

        <div className={styles.sovereignDetails}>

            <header className={styles.header}>

                <h2>Storytelling Layer</h2>

                <p>Add caption, hashtags, and location to complete your story.</p>

            </header>



            <div className={styles.formCard}>

                <AnimatePresence>
                    {(scanState.isScanning || scanState.isToxic || scanState.isBlocked || scanState.isQuestionable || (scanState.isClean && scanState.purityScore < 1)) && (
                        <PurityGateIndicator scanState={scanState} />
                    )}
                </AnimatePresence>

                <label className={styles.field}>

                    <span className={styles.fieldLabel}>

                        <Type size={16} />

                        Caption

                        <small className={styles.charCount}>{caption.length}/2200</small>

                    </span>

                    <textarea

                        value={caption}

                        onChange={(e) => setCaption(e.target.value)}

                        placeholder="Write something meaningful..."

                        maxLength={2200}

                        rows={5}

                        className={`${styles.sovereignInput} ${scanState.isToxic || scanState.isBlocked ? styles.inputToxic : ''} ${scanState.isQuestionable ? styles.inputWarning : ''}`}

                    />

                </label>



                <label className={styles.field}>

                    <span className={styles.fieldLabel}>

                        <Hash size={16} />

                        Tags

                        <small className={styles.tagCount}>{tagsPreview.length}/10</small>

                    </span>



                    <div className={styles.tagInputWrapper}>

                        <input

                            value={tagInput}

                            onChange={(e) => setTagInput(e.target.value)}

                            onFocus={() => setShowSuggestions(true)}

                            placeholder="Add tags, separated by commas..."

                            className={styles.sovereignInput}

                        />



                        {/* Trending Tags Suggestions */}

                        <AnimatePresence>

                            {showSuggestions && availableTrending.length > 0 && (

                                <motion.div

                                    className={styles.suggestionsPanel}

                                    initial={{ opacity: 0, y: -10 }}

                                    animate={{ opacity: 1, y: 0 }}

                                    exit={{ opacity: 0, y: -10 }}

                                    transition={{ duration: 0.2 }}

                                >

                                    <div className={styles.suggestionsHeader}>

                                        <TrendingUp size={14} />

                                        <span>Trending from Explore</span>

                                    </div>

                                    <div className={styles.suggestionsList}>

                                        {availableTrending.map((tag) => (

                                            <button

                                                key={tag.tag}

                                                className={styles.suggestionChip}

                                                onClick={() => addTag(tag.tag)}

                                                disabled={tagsPreview.length >= 10}

                                            >

                                                <span className={styles.suggestionTag}>#{tag.tag}</span>

                                                <span className={styles.suggestionCount}>{tag.post_count} posts</span>

                                            </button>

                                        ))}

                                    </div>

                                </motion.div>

                            )}

                        </AnimatePresence>

                    </div>



                    <small className={styles.inputHint}>

                        Click trending tags to add them, or type your own

                    </small>

                </label>



                {/* Selected Tags Display */}

                {tagsPreview.length > 0 && (

                    <motion.div

                        className={styles.selectedTags}

                        initial={{ opacity: 0 }}

                        animate={{ opacity: 1 }}

                    >

                        {tagsPreview.map((tag) => (

                            <span key={tag} className={styles.selectedTag}>

                                #{tag}

                                <button

                                    className={styles.removeTag}

                                    onClick={() => removeTag(tag)}

                                    aria-label={`Remove ${tag}`}

                                >

                                    <X size={12} />

                                </button>

                            </span>

                        ))}

                    </motion.div>

                )}



                <label className={styles.field}>

                    <span className={styles.fieldLabel}>

                        <MapPin size={16} />

                        Location

                    </span>

                    <input

                        value={location}

                        onChange={(e) => setLocation(e.target.value)}

                        placeholder="City, place, or event"

                        className={styles.sovereignInput}

                    />

                </label>

            </div>



            <footer className={styles.footer}>

                <Button variant="ghost" onClick={onBack}>

                    <ArrowLeft size={16} /> Back

                </Button>

                <Button onClick={handleContinue} disabled={caption.length > 2200 || scanState.isToxic || scanState.isBlocked}>

                    Preview <ArrowRight size={16} />

                </Button>

            </footer>

        </div>

    );

};



export default DetailsStep;



