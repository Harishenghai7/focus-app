import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { applyTeenModeDefaults } from '../../utils/ageVerification';
import Button from '../shared/Button';
import { FaShieldAlt, FaUserShield, FaCommentSlash, FaEyeSlash } from 'react-icons/fa';
import styles from './StepAgeVerification.module.css';

const SAFETY_LEVELS = [
    { id: 'strict', label: 'Strict', desc: 'Maximum filtering — ideal for younger users', icon: <FaUserShield />, color: '#10b981' },
    { id: 'moderate', label: 'Moderate', desc: 'Balanced safety with freedom to explore', icon: <FaShieldAlt />, color: '#f59e0b' },
    { id: 'relaxed', label: 'Relaxed', desc: 'Minimal filtering — you control what you see', icon: <FaEyeSlash />, color: '#ef4444' },
];

const DM_OPTIONS = [
    { id: 'everyone', label: 'Everyone', desc: 'Anyone can message you' },
    { id: 'followers', label: 'Followers only', desc: 'Only people you follow back' },
    { id: 'nobody', label: 'Nobody', desc: 'DMs are turned off' },
];

const StepAgeVerification = ({ formData, updateFormData, onNext, onBack }) => {
    const { user } = useAuth();
    const [tier, setTier] = useState(formData.ageTier || null);
    const [dob, setDob] = useState(formData.ageInfo?.dateOfBirth || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const safety = formData.safetyPreferences || { contentSensitivity: 'moderate', dmAccess: 'followers', commentFiltering: true };

    const updateSafety = (key, value) => {
        updateFormData('safetyPreferences', { ...safety, [key]: value });
    };

    const calculateAge = (birthDateString) => {
        if (!birthDateString) return null;
        const today = new Date();
        const birth = new Date(birthDateString);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const handleVerify = async () => {
        setError('');
        if (!tier) return setError('Please select your age group.');
        if (!dob) return setError('Please enter your date of birth.');

        const age = calculateAge(dob);
        if (age === null || age < 0 || age > 120) return setError('Please enter a valid date of birth.');

        if (tier === 'adult' && age < 18) {
            setTier(null); setDob('');
            return setError('Your date of birth indicates you are under 18. Please select the correct tier.');
        }
        if (tier === 'teen' && (age < 13 || age >= 18)) {
            setTier(null); setDob('');
            return setError('Your date of birth is outside the 13–17 range. Please select the correct tier.');
        }

        setLoading(true);
        try {
            let accountType = age >= 18 ? 'adult' : 'teen';
            if (accountType === 'teen') await applyTeenModeDefaults(user?.id, 'teen');

            updateFormData('ageVerified', true);
            updateFormData('ageTier', tier);
            updateFormData('ageInfo', { dateOfBirth: dob, accountType: { type: accountType } });
            onNext();
        } catch (err) {
            setError(err.message || 'Failed to verify age.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>We protect you first 🛡️</h2>
                <p className={styles.subtitle}>Age verification activates the right safety systems and content controls for your experience.</p>
            </div>

            {/* Age tier selection */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Your age group</label>
                <div className={styles.tierGrid}>
                    <button
                        className={`${styles.tierCard} ${tier === 'teen' ? styles.tierActive : ''}`}
                        onClick={() => { setTier('teen'); setError(''); }}
                    >
                        <span className={styles.tierEmoji}>🧑</span>
                        <div className={styles.tierTitle}>13 – 17 Years</div>
                        <div className={styles.tierSub}>Enhanced safety & parental controls</div>
                    </button>
                    <button
                        className={`${styles.tierCard} ${tier === 'adult' ? styles.tierActive : ''}`}
                        onClick={() => { setTier('adult'); setError(''); }}
                    >
                        <span className={styles.tierEmoji}>👤</span>
                        <div className={styles.tierTitle}>18+ Years</div>
                        <div className={styles.tierSub}>Standard account with full access</div>
                    </button>
                </div>
            </div>

            {tier && (
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Date of birth</label>
                    <input
                        type="date"
                        className={styles.dobInput}
                        max={new Date().toISOString().split('T')[0]}
                        value={dob}
                        onChange={(e) => { setDob(e.target.value); setError(''); }}
                    />
                </div>
            )}

            {/* Safety preferences */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Content sensitivity</label>
                <div className={styles.safetyGrid}>
                    {SAFETY_LEVELS.map(level => (
                        <button
                            key={level.id}
                            className={`${styles.safetyCard} ${safety.contentSensitivity === level.id ? styles.safetyActive : ''}`}
                            onClick={() => updateSafety('contentSensitivity', level.id)}
                            style={{ '--safety-color': level.color }}
                        >
                            <span className={styles.safetyIcon}>{level.icon}</span>
                            <strong className={styles.safetyLabel}>{level.label}</strong>
                            <span className={styles.safetyDesc}>{level.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <label className={styles.sectionLabel}>Who can message you?</label>
                <div className={styles.dmGrid}>
                    {DM_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            className={`${styles.dmOption} ${safety.dmAccess === opt.id ? styles.dmActive : ''}`}
                            onClick={() => updateSafety('dmAccess', opt.id)}
                        >
                            <strong>{opt.label}</strong>
                            <span>{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <button
                    className={`${styles.toggleRow} ${safety.commentFiltering ? styles.toggleActive : ''}`}
                    onClick={() => updateSafety('commentFiltering', !safety.commentFiltering)}
                >
                    <FaCommentSlash className={styles.toggleIcon} />
                    <div>
                        <strong>Comment filtering</strong>
                        <span>Automatically hide potentially harmful comments</span>
                    </div>
                    <div className={`${styles.toggle} ${safety.commentFiltering ? styles.toggleOn : ''}`}>
                        <div className={styles.toggleDot} />
                    </div>
                </button>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={handleVerify} disabled={!tier || !dob || loading}>
                    {loading ? 'Verifying...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
};

export default StepAgeVerification;
