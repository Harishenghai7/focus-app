import React, { useState, useEffect } from 'react';
import styles from './StepNotifications.module.css';
import Button from '../shared/Button';
import { FaBell, FaHeart, FaComment, FaUserPlus, FaEnvelope, FaRocket, FaShieldAlt, FaCompass, FaRobot } from 'react-icons/fa';

const StepNotifications = ({ formData, updateFormData, onNext, onBack, isSubmitting }) => {
    const [showSummary, setShowSummary] = useState(false);
    const [launchReady, setLaunchReady] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setShowSummary(true), 300);
        const t2 = setTimeout(() => setLaunchReady(true), 800);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const handleEnable = () => {
        updateFormData('notificationsEnabled', true);
        onNext();
    };

    const handleSkip = () => {
        updateFormData('notificationsEnabled', false);
        onNext();
    };

    const interestCount = formData.interests?.length || 0;
    const followCount = formData.followedUsers?.length || 0;
    const aiPersonality = formData.focuslyAI?.personality || 'friendly';
    const trustStatus = formData.trustShieldStatus === 'VERIFIED' ? 'Verified' : formData.trustShieldStatus === 'PENDING_REVIEW' ? 'Reviewing' : 'Pending';
    const languageName = { en: 'English', hi: 'हिन्दी', es: 'Español', fr: 'Français', de: 'Deutsch', ja: '日本語', ko: '한국어', pt: 'Português', ar: 'العربية', zh: '中文', ta: 'தமிழ்', te: 'తెలుగు' }[formData.languagePreference] || 'English';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Your universe is ready 🚀</h2>
                <p className={styles.subtitle}>
                    Review your setup, enable notifications, and launch into Focus — a calmer, more authentic social experience.
                </p>
            </div>

            {/* Journey summary */}
            {showSummary && (
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Your Focus Setup</span>

                    <div className={styles.summaryProfile}>
                        <div className={styles.summaryAvatar}>
                            {formData.avatarPreview ? (
                                <img src={formData.avatarPreview} alt="" className={styles.summaryAvatarImg} />
                            ) : (
                                <span>{(formData.full_name || formData.username || '?')[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <p className={styles.summaryName}>{formData.full_name || 'Focus User'}</p>
                            <p className={styles.summaryHandle}>@{formData.username || 'username'}</p>
                        </div>
                    </div>

                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <FaCompass className={styles.summaryIcon} />
                            <span>{interestCount} interests</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <FaUserPlus className={styles.summaryIcon} />
                            <span>{followCount} following</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <FaShieldAlt className={styles.summaryIcon} />
                            <span>Shield: {trustStatus}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <FaRobot className={styles.summaryIcon} />
                            <span>AI: {aiPersonality}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <FaComment className={styles.summaryIcon} />
                            <span>Lang: {languageName}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <FaHeart className={styles.summaryIcon} />
                            <span>Safety: {formData.safetyPreferences?.contentSensitivity || 'moderate'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            <div className={styles.notifSection}>
                <div className={styles.notifHeader}>
                    <div className={styles.glowRing}>
                        <div className={styles.bellIcon}><FaBell /></div>
                    </div>
                    <h3 className={styles.notifTitle}>Stay connected</h3>
                    <p className={styles.notifDesc}>We only send what matters — no spam, ever.</p>
                </div>

                <div className={styles.benefitsGrid}>
                    <div className={styles.benefitCard}>
                        <FaHeart className={styles.benefitIcon} style={{ color: '#ec4899' }} />
                        <span>Likes</span>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaComment className={styles.benefitIcon} style={{ color: '#3b82f6' }} />
                        <span>Comments</span>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaUserPlus className={styles.benefitIcon} style={{ color: '#10b981' }} />
                        <span>Followers</span>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaEnvelope className={styles.benefitIcon} style={{ color: '#f59e0b' }} />
                        <span>Messages</span>
                    </div>
                </div>
            </div>

            {/* Launch actions */}
            {launchReady && (
                <div className={styles.launchSection}>
                    <div className={styles.emotionalCopy}>
                        <FaRocket className={styles.rocketIcon} />
                        <p>Everything is configured. Your feed is personalized. Your safety is activated. <strong>Step into your universe.</strong></p>
                    </div>

                    <div className={styles.actions}>
                        <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                            Skip notifications
                        </Button>
                        <button
                            className={styles.launchButton}
                            onClick={handleEnable}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className={styles.launchSpinner} />
                            ) : (
                                <>
                                    <FaRocket />
                                    <span>Enable & Launch Focus</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepNotifications;
