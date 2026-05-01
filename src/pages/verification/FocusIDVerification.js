/**
 * FocusIDVerification — Focus App v2.0
 *
 * Step-by-step wizard showing the user their trust score
 * and guiding them through each verification step.
 *
 * Route: /verification/focus-id
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import FocusIDBadge from '../../components/ui/FocusIDBadge';
import { useFocusID, TIER_LABELS, TIER_ICONS, TIER_COLORS } from '../../hooks/useFocusID';
import styles from './FocusIDVerification.module.css';

/* ── Step card ──────────────────────────────────────────────── */
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function SignalRow({ label, earned, points, action, onAction }) {
    return (
        <div className={`${styles.signalRow} ${earned ? styles.earned : ''}`}>
            <div className={styles.signalLeft}>
                <span className={styles.signalCheck}>{earned ? '✅' : '⬜'}</span>
                <div>
                    <p className={styles.signalLabel}>{label}</p>
                    {!earned && action && (
                        <button className={styles.signalAction} onClick={onAction}>{action}</button>
                    )}
                </div>
            </div>
            <span className={styles.signalPoints}>+{points} pts</span>
        </div>
    );
}

/* ── Tier progress bar ──────────────────────────────────────── */
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function TierProgress({ score, tier, progressPct, nextTierScore }) {
    return (
        <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
                <span className={styles.progressCurrent}>
                    {TIER_ICONS[tier]} {TIER_LABELS[tier]}
                </span>
                <span className={styles.progressScore}>{score} / 100 pts</span>
            </div>
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${progressPct}%`, background: TIER_COLORS[tier] }}
                />
            </div>
            {tier < 4 && (
                <p className={styles.progressHint}>
                    {nextTierScore - score} more points to reach{' '}
                    <strong>{TIER_ICONS[tier + 1]} {TIER_LABELS[tier + 1]}</strong>
                </p>
            )}
            {tier === 4 && (
                <p className={styles.progressHint}>🎉 You have reached maximum trust!</p>
            )}
        </div>
    );
}

/* ── Main page ──────────────────────────────────────────────── */
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function FocusIDVerification() {
    const navigate = useNavigate();
    const {
        signals, score, tier, loading,
        tierLabel, tierIcon, progressPct, nextTierScore, refresh,
    } = useFocusID();

    const [phoneStep, setPhoneStep] = useState(false);

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.loadingPage}>
                    <div className={styles.loadingPulse} />
                    <p>Calculating your FocusID score...</p>
                </div>
            </MainLayout>
        );
    }

    const SIGNAL_CONFIG = [
        {
            key: 'phone_verified',
            label: 'Phone number verified',
            points: 25,
            action: 'Verify phone →',
            onAction: () => setPhoneStep(true),
        },
        {
            key: 'profile_photo',
            label: 'Profile photo uploaded',
            points: 15,
            action: 'Add profile photo →',
            onAction: () => navigate('/settings?section=profile'),
        },
        {
            key: 'bio_written',
            label: 'Bio written',
            points: 10,
            action: 'Write your bio →',
            onAction: () => navigate('/settings?section=profile'),
        },
        {
            key: 'account_age_7d',
            label: 'Account at least 7 days old',
            points: 10,
            action: null,
        },
        {
            key: 'account_age_30d',
            label: 'Account at least 30 days old',
            points: 10,
            action: null,
        },
        {
            key: 'active_posts',
            label: 'Posted at least 3 times',
            points: 10,
            action: 'Create a post →',
            onAction: () => navigate('/create'),
        },
        {
            key: 'not_flagged',
            label: 'Good standing (no flags/reports)',
            points: 10,
            action: null,
        },
        {
            key: 'community_vouched',
            label: 'Vouched by 3+ Confirmed users',
            points: 5,
            action: 'Share your profile to get vouched',
            onAction: null,
        },
        {
            key: 'cross_social_linked',
            label: 'Cross-platform social link added',
            points: 5,
            action: 'Link social profile →',
            onAction: () => navigate('/settings?section=profile'),
        },
    ];

    return (
        <MainLayout>
            <div className={styles.page}>
                {/* ── Header ──────────────────────────────── */}
                <div className={styles.pageHeader}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
                    <h1 className={styles.pageTitle}>FocusID</h1>
                    <div />
                </div>

                {/* ── Hero ────────────────────────────────── */}
                <div className={styles.hero}>
                    <div className={styles.heroBadge}>
                        <FocusIDBadge tier={tier} size="lg" showLabel />
                    </div>
                    <h2 className={styles.heroTagline}>
                        "Meet the real people; not the fake profiles"
                    </h2>
                    <p className={styles.heroSub}>
                        FocusID is Focus's authenticity layer — a multi-signal trust score 
                        that makes the platform genuinely safer without requiring a government ID.
                    </p>
                </div>

                {/* ── Tier map ─────────────────────────────── */}
                <div className={styles.tierMap}>
                    {TIER_LABELS.map((label, i) => (
                        <div
                            key={i}
                            className={`${styles.tierChip} ${i === tier ? styles.tierActive : ''} ${i < tier ? styles.tierDone : ''}`}
                            style={i === tier ? { borderColor: TIER_COLORS[i], color: TIER_COLORS[i] } : {}}
                        >
                            {TIER_ICONS[i]} {label}
                        </div>
                    ))}
                </div>

                {/* ── Progress bar ─────────────────────────── */}
                <div className={styles.section}>
                    <TierProgress
                        score={score}
                        tier={tier}
                        progressPct={progressPct}
                        nextTierScore={nextTierScore}
                    />
                </div>

                {/* ── Signal checklist ─────────────────────── */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Your Trust Signals</h3>
                    <p className={styles.sectionDesc}>
                        Complete more signals to increase your FocusID level.
                        Each signal independently makes the platform safer for everyone.
                    </p>
                    <div className={styles.signalList}>
                        {SIGNAL_CONFIG.map(cfg => (
                            <SignalRow
                                key={cfg.key}
                                label={cfg.label}
                                earned={signals?.[cfg.key] || false}
                                points={cfg.points}
                                action={cfg.action}
                                onAction={cfg.onAction}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Why no gov ID ─────────────────────────── */}
                <div className={styles.infoCard}>
                    <h4 className={styles.infoTitle}>🛡️ Why no Government ID required?</h4>
                    <p className={styles.infoText}>
                        A single document check is easy to bypass and creates privacy risks. 
                        FocusID uses many small, behavioral signals that are 
                        <strong> collectively much harder to fake</strong> — making it 
                        more reliable than a single document scan. Your safety doesn't 
                        require your Aadhaar card.
                    </p>
                </div>

                {/* Phone verification modal (inline for now) */}
                {phoneStep && (
                    <div className={styles.phoneModal}>
                        <div className={styles.phoneCard}>
                            <h3>📱 Verify Your Phone</h3>
                            <p>Phone verification adds <strong>25 trust points</strong> — the highest single signal.</p>
                            <p className={styles.phoneNote}>
                                Enter your phone number in Settings → Account → Phone Verification.
                            </p>
                            <button
                                className={styles.phoneCta}
                                onClick={() => { navigate('/settings?section=account'); }}
                            >
                                Go to Settings
                            </button>
                            <button className={styles.phoneCancel} onClick={() => setPhoneStep(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default FocusIDVerification;
