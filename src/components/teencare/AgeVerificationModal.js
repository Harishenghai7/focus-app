/**
 * Age Verification Modal
 * Collects and verifies user age, applies appropriate mode
 */

import React, { useState } from 'react';
import { verifyAge, getAccountType } from '../../utils/ageVerification';
import { useAuth } from '../../hooks/useAuth';
import styles from './AgeVerificationModal.module.css';

const AgeVerificationModal = ({ isOpen, onClose, onComplete }) => {
    const { user } = useAuth();
    const [birthDate, setBirthDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accountTypePreview, setAccountTypePreview] = useState(null);

    // Calculate age and preview account type as user types
    const handleDateChange = (e) => {
        const date = e.target.value;
        setBirthDate(date);
        setError('');

        if (date) {
            const age = calculateAge(date);
            if (age !== null) {
                const type = getAccountType(age);
                setAccountTypePreview({ age, ...type });
            }
        } else {
            setAccountTypePreview(null);
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!birthDate) {
            setError('Please enter your birth date');
            return;
        }

        const age = calculateAge(birthDate);

        if (age === null || age < 0) {
            setError('Please enter a valid birth date');
            return;
        }

        if (age > 120) {
            setError('Please enter a valid birth date');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await verifyAge(user.id, birthDate, 'self_reported');

            if (result.success) {
                onComplete(result);
            }
        } catch (err) {
            setError(err.message || 'Failed to verify age. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="age-verification-overlay">
            <div className="age-verification-modal">
                <div className="modal-header">
                    <h2>Welcome to Focus! 🎉</h2>
                    <p>To provide you with the best and safest experience, we need to verify your age.</p>
                </div>

                <form onSubmit={handleSubmit} className="verification-form">
                    <div className="form-group">
                        <label htmlFor="birthdate">
                            Date of Birth
                            <span className="required">*</span>
                        </label>
                        <input
                            type="date"
                            id="birthdate"
                            value={birthDate}
                            onChange={handleDateChange}
                            max={new Date().toISOString().split('T')[0]}
                            required
                            className="date-input"
                        />
                        <small className="form-hint">
                            We use this to provide age-appropriate features and comply with privacy laws.
                        </small>
                    </div>

                    {accountTypePreview && (
                        <div className={`account-type-preview ${accountTypePreview.type}`}>
                            <div className="preview-icon">
                                {accountTypePreview.type === 'coppa' && '👶'}
                                {accountTypePreview.type === 'teen' && '🧑'}
                                {accountTypePreview.type === 'adult' && '👤'}
                            </div>
                            <div className="preview-content">
                                <h3>{accountTypePreview.label}</h3>
                                <p className="age-display">Age: {accountTypePreview.age}</p>

                                {accountTypePreview.type === 'coppa' && (
                                    <div className="account-info">
                                        <p className="info-title">Your account will have:</p>
                                        <ul>
                                            <li>✅ Enhanced privacy protections</li>
                                            <li>✅ Guardian required for activation</li>
                                            <li>✅ Strict content filters</li>
                                            <li>✅ No ads</li>
                                            <li>✅ Private profile</li>
                                        </ul>
                                        <p className="coppa-notice">
                                            <strong>Parent/Guardian Required:</strong> Your account needs to be approved by a parent or guardian before you can use Focus.
                                        </p>
                                    </div>
                                )}

                                {accountTypePreview.type === 'teen' && (
                                    <div className="account-info">
                                        <p className="info-title">Your account will have:</p>
                                        <ul>
                                            <li>✅ Privacy protections enabled by default</li>
                                            <li>✅ Private account (approval required for followers)</li>
                                            <li>✅ Content filters</li>
                                            <li>✅ Screen time tools available</li>
                                            <li>✅ Optional guardian supervision</li>
                                        </ul>
                                        <p className="teen-notice">
                                            You can invite a parent/guardian to help monitor your safety (optional).
                                        </p>
                                    </div>
                                )}

                                {accountTypePreview.type === 'adult' && (
                                    <div className="account-info">
                                        <p className="info-title">Your account will have:</p>
                                        <ul>
                                            <li>✅ Full access to all features</li>
                                            <li>✅ Customizable privacy settings</li>
                                            <li>✅ Optional parental controls available</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="privacy-notice">
                        <p>
                            <strong>Privacy Commitment:</strong> Your birth date is used solely for age verification and safety features.
                            We comply with COPPA, GDPR, and other privacy regulations.
                        </p>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading || !birthDate}
                            className="submit-btn"
                        >
                            {loading ? 'Verifying...' : 'Continue'}
                        </button>
                    </div>
                </form>

                <div className="modal-footer">
                    <small>
                        By continuing, you agree to Focus's{' '}
                        <a href="/terms" target="_blank">Terms of Service</a> and{' '}
                        <a href="/privacy" target="_blank">Privacy Policy</a>
                    </small>
                </div>
            </div>
        </div>
    );
};

export default AgeVerificationModal;
