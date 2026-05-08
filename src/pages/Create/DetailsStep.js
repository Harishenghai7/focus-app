import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Hash, MapPin, Type, TrendingUp, X, Shield, AlertTriangle, Loader2, Users, Globe, Lock, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from './DetailsStep.module.css';
import PollCreator from '../../components/create/PollCreator';
import { useTrending } from '../../hooks/useTrending';
import { useToxicityScanner } from '../../hooks/useToxicityScanner';
import { useSovereignForge } from '../../context/SovereignForgeContext';
import { motion, AnimatePresence } from 'framer-motion';

const parseTags = (value) =>
    value.split(',').map((item) => item.trim().replace(/^#/, '')).filter(Boolean).slice(0, 10);

const PurityGateIndicator = ({ scanState }) => {
    const { isScanning, isClean, isQuestionable, isToxic, isBlocked, purityScore, violations } = scanState;
    if (isScanning) return (
        <motion.div className={styles.purityIndicator} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
            <Loader2 size={16} className={styles.spinIcon}/><span className={styles.purityText}>Scanning content...</span>
        </motion.div>
    );
    if (isBlocked || isToxic) return (
        <motion.div className={`${styles.purityIndicator} ${styles.purityBlocked}`} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}>
            <AlertTriangle size={18}/><span className={styles.purityText}>Content blocked - violates guidelines</span>
            {violations?.length > 0 && <span className={styles.violationCount}>{violations.length} violation{violations.length > 1 ? 's' : ''}</span>}
        </motion.div>
    );
    if (isQuestionable) return (
        <motion.div className={`${styles.purityIndicator} ${styles.purityWarning}`} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
            <Shield size={16}/><span className={styles.purityText}>May be flagged for review</span><span className={styles.purityScore}>{Math.round(purityScore * 100)}%</span>
        </motion.div>
    );
    if (isClean && purityScore < 1) return (
        <motion.div className={`${styles.purityIndicator} ${styles.purityClean}`} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}>
            <Shield size={16}/><span className={styles.purityText}>Purity Verified</span><span className={styles.purityScore}>{Math.round(purityScore * 100)}%</span>
        </motion.div>
    );
    return null;
};

const AUDIENCES = [
    { id: 'everyone', icon: Globe, label: 'Everyone', desc: 'Visible to all users' },
    { id: 'followers', icon: Users, label: 'Followers', desc: 'Only your followers' },
    { id: 'close_friends', icon: Lock, label: 'Close Friends', desc: 'Your inner circle only' },
];

const DetailsStep = ({ details, onUpdateDetails, onBack, onNext }) => {
    const [caption, setCaption] = useState(details?.caption || '');
    const [tagInput, setTagInput] = useState((details?.tags || []).join(', '));
    const [location, setLocation] = useState(details?.location || '');
    const [audience, setAudience] = useState(details?.audience || 'everyone');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hideLikes, setHideLikes] = useState(details?.hideLikes || false);
    const [turnOffComments, setTurnOffComments] = useState(details?.turnOffComments || false);

    const { state, dispatch } = useSovereignForge();
    const { trendingHashtags, loading: trendingLoading } = useTrending();
    const { scanText, ...scanState } = useToxicityScanner();

    useEffect(() => { scanText(caption); }, [caption, scanText]);

    const tagsPreview = useMemo(() => parseTags(tagInput), [tagInput]);
    const charPercent = Math.min((caption.length / 2200) * 100, 100);

    const availableTrending = useMemo(() => {
        const selected = tagsPreview.map(t => t.toLowerCase());
        return trendingHashtags.filter(t => !selected.includes(t.tag.toLowerCase())).slice(0, 8);
    }, [trendingHashtags, tagsPreview]);

    const addTag = useCallback((tag) => {
        const current = parseTags(tagInput);
        if (current.length >= 10) return;
        setTagInput([...current, tag].join(', '));
    }, [tagInput]);

    const removeTag = useCallback((tagToRemove) => {
        const current = parseTags(tagInput);
        setTagInput(current.filter(t => t !== tagToRemove).join(', '));
    }, [tagInput]);

    const handlePollUpdate = (updates) => {
        dispatch({ type: 'SET_POLL', payload: updates });
    };

    const handleContinue = () => {
        onUpdateDetails({
            ...details, caption: caption.trim(), tags: tagsPreview,
            location: location.trim() || null, audience, hideLikes, turnOffComments
        });
        onNext?.();
    };

    return (
        <div className={styles.sovereignDetails}>
            <header className={styles.header}>
                <h2>Storytelling Layer</h2>
                <p>Craft your caption, add tags, and configure your post</p>
            </header>

            <div className={styles.formCard}>
                <AnimatePresence>
                    {(scanState.isScanning || scanState.isToxic || scanState.isBlocked || scanState.isQuestionable || (scanState.isClean && scanState.purityScore < 1)) && (
                        <PurityGateIndicator scanState={scanState} />
                    )}
                </AnimatePresence>

                {/* Caption */}
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        <Type size={16}/> Caption
                        <div className={styles.charRing} style={{'--pct': `${charPercent}%`}}>
                            <small className={styles.charCount}>{caption.length}</small>
                        </div>
                    </span>
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write something meaningful..." maxLength={2200} rows={4}
                        className={`${styles.sovereignInput} ${styles.textArea} ${scanState.isToxic || scanState.isBlocked ? styles.inputToxic : ''} ${scanState.isQuestionable ? styles.inputWarning : ''}`}
                    />
                </label>

                {/* Tags */}
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        <Hash size={16}/> Tags <small className={styles.tagCount}>{tagsPreview.length}/10</small>
                    </span>
                    <div className={styles.tagInputWrapper}>
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                            onFocus={() => setShowSuggestions(true)} placeholder="Add tags, separated by commas..."
                            className={styles.sovereignInput}/>
                        <AnimatePresence>
                            {showSuggestions && availableTrending.length > 0 && (
                                <motion.div className={styles.suggestionsPanel} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                                    <div className={styles.suggestionsHeader}><TrendingUp size={14}/><span>Trending from Explore</span></div>
                                    <div className={styles.suggestionsList}>
                                        {availableTrending.map((tag) => (
                                            <button key={tag.tag} className={styles.suggestionChip} onClick={() => addTag(tag.tag)} disabled={tagsPreview.length >= 10}>
                                                <span className={styles.suggestionTag}>#{tag.tag}</span>
                                                <span className={styles.suggestionCount}>{tag.post_count} posts</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </label>

                {/* Selected Tags */}
                {tagsPreview.length > 0 && (
                    <motion.div className={styles.selectedTags} initial={{opacity:0}} animate={{opacity:1}}>
                        {tagsPreview.map((tag) => (
                            <span key={tag} className={styles.selectedTag}>
                                #{tag}
                                <button className={styles.removeTag} onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}><X size={12}/></button>
                            </span>
                        ))}
                    </motion.div>
                )}

                {/* Location */}
                <label className={styles.field}>
                    <span className={styles.fieldLabel}><MapPin size={16}/> Location</span>
                    <input value={location} onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, place, or event" className={styles.sovereignInput}/>
                </label>

                {/* Poll Creator */}
                <div className={styles.sectionDivider} />
                <PollCreator poll={state.poll} onUpdatePoll={handlePollUpdate} />

                {/* Audience & Privacy */}
                <div className={styles.sectionDivider} />
                <div className={styles.privacySection}>
                    <span className={styles.sectionTitle}>Audience & Privacy</span>
                    <div className={styles.audienceGrid}>
                        {AUDIENCES.map(a => (
                            <button key={a.id} className={`${styles.audienceBtn} ${audience === a.id ? styles.audienceActive : ''}`}
                                onClick={() => setAudience(a.id)}>
                                <a.icon size={18}/><span>{a.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <EyeOff size={16}/><span>Hide Likes</span>
                        </div>
                        <button className={`${styles.toggleSwitch} ${hideLikes ? styles.toggleOn : ''}`} onClick={() => setHideLikes(!hideLikes)}>
                            <div className={styles.toggleThumb}/>
                        </button>
                    </div>
                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <Lock size={16}/><span>Turn Off Comments</span>
                        </div>
                        <button className={`${styles.toggleSwitch} ${turnOffComments ? styles.toggleOn : ''}`} onClick={() => setTurnOffComments(!turnOffComments)}>
                            <div className={styles.toggleThumb}/>
                        </button>
                    </div>
                </div>
            </div>

            <footer className={styles.footer}>
                <Button variant="ghost" onClick={onBack}><ArrowLeft size={16}/> Back</Button>
                <Button onClick={handleContinue} disabled={caption.length > 2200 || scanState.isToxic || scanState.isBlocked}>
                    Preview <ArrowRight size={16}/>
                </Button>
            </footer>
        </div>
    );
};

export default DetailsStep;
