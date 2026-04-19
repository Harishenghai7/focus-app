import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { applyTeenModeDefaults } from '../../utils/ageVerification';
import AgeVerificationModal from '../teencare/AgeVerificationModal';
import Button from '../shared/Button';
import styles from './StepAgeVerification.module.css';

const StepAgeVerification = ({ formData, updateFormData, onNext, onBack }) => {
    const { user } = useAuth();
    const [error, setError] = useState('');

    const handleComplete = async (result) => {
        if (result?.accountType?.type === 'teen' || result?.accountType?.type === 'coppa') {
            try {
                await applyTeenModeDefaults(user.id, result.accountType.type);
            } catch (err) {
                setError(err.message || 'Safety defaults could not be applied.');
            }
        }

        updateFormData('ageVerified', true);
        updateFormData('ageInfo', result);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Verify your age</h2>
                <p className={styles.subtitle}>Age verification is required to keep Focus safe.</p>
            </div>

            <AgeVerificationModal
                isOpen={!formData.ageVerified}
                onClose={() => {}}
                onComplete={handleComplete}
            />

            {formData.ageVerified && (
                <div className={styles.verified}>
                    <p>Age verified successfully.</p>
                    {formData.ageInfo?.accountType && (
                        <p>Account type: {formData.ageInfo.accountType.type}</p>
                    )}
                </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={onNext} disabled={!formData.ageVerified}>
                    Continue
                </Button>
            </div>

            <div className={styles.progressInfo}>
                <span>Step 3 of 6</span>
            </div>
        </div>
    );
};

export default StepAgeVerification;
