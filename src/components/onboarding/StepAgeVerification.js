import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { applyTeenModeDefaults } from '../../utils/ageVerification';
import Button from '../shared/Button';
import styles from './StepAgeVerification.module.css';

const StepAgeVerification = ({ formData, updateFormData, onNext, onBack }) => {
    const { user } = useAuth();
    const [tier, setTier] = useState(formData.ageTier || null);
    const [dob, setDob] = useState(formData.ageInfo?.dateOfBirth || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const calculateAge = (birthDateString) => {
        if (!birthDateString) return null;
        const today = new Date();
        const birth = new Date(birthDateString);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleVerify = async () => {
        setError('');
        if (!tier) return setError('Please select your age group.');
        if (!dob) return setError('Please enter your date of birth.');
        
        const age = calculateAge(dob);
        if (age === null || age < 0 || age > 120) {
            return setError('Please enter a valid date of birth.');
        }

        // STRICT Age Tier validation with resets
        if (tier === 'adult' && age < 18) {
            setTier(null);
            setDob('');
            return setError('You selected 18+ but your date of birth indicates otherwise. Please select the correct tier to continue.');
        }
        if (tier === 'teen' && (age < 13 || age >= 18)) {
            setTier(null);
            setDob('');
            return setError('You selected 13-17 but your date of birth is outside this range. Please select the correct tier to continue.');
        }

        setLoading(true);
        try {
            let accountType = age >= 18 ? 'adult' : 'teen';
            
            if (accountType === 'teen') {
                await applyTeenModeDefaults(user?.id, 'teen');
            }

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
                <h2 className={styles.title}>Verify your age</h2>
                <p className={styles.subtitle}>Age verification is required to keep Focus safe and comply with global laws.</p>
            </div>

            <div className={styles.formContent}>
                <label className={styles.sectionLabel}>Select your age group</label>
                <div className={styles.tierSelection}>
                    <button 
                        className={`${styles.tierBtn} ${tier === 'teen' ? styles.tierActive : ''}`}
                        onClick={() => { setTier('teen'); setError(''); }}
                    >
                        <div className={styles.tierTitle}>🧑 13 - 17 Years</div>
                        <div className={styles.tierSub}>Parental consent may apply</div>
                    </button>
                    <button 
                        className={`${styles.tierBtn} ${tier === 'adult' ? styles.tierActive : ''}`}
                        onClick={() => { setTier('adult'); setError(''); }}
                    >
                        <div className={styles.tierTitle}>👤 18+ Years</div>
                        <div className={styles.tierSub}>Standard Account</div>
                    </button>
                </div>

                {tier && (
                    <div className={styles.dobSection}>
                        <label className={styles.sectionLabel}>Date of Birth</label>
                        <input 
                            type="date" 
                            className={styles.dobInput}
                            max={new Date().toISOString().split('T')[0]}
                            value={dob}
                            onChange={(e) => { setDob(e.target.value); setError(''); }}
                        />
                    </div>
                )}
                
                {error && <div className={styles.errorBox}>{error}</div>}
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={handleVerify} disabled={!tier || !dob || loading}>
                    {loading ? 'Verifying...' : 'Continue'}
                </Button>
            </div>

            <div className={styles.progressInfo}>
                <span>Step 2 of 6</span>
            </div>
        </div>
    );
};
export default StepAgeVerification;
