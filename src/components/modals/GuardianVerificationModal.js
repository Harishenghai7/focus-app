import React, { useState } from 'react';
import { useGuardianVerification } from '../../hooks/useGuardianVerification';
import styles from './GuardianVerificationModal.module.css';
import Button from '../shared/Button';

const GuardianVerificationModal = ({ isOpen, onClose, teenUserId, onVerified }) => {
    const [guardianEmail, setGuardianEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState('email'); // 'email' or 'otp'

    const {
        sending,
        verifying,
        otpSent,
        verified,
        error,
        sendOTP,
        verifyOTP,
        resendOTP
    } = useGuardianVerification();

    if (!isOpen) return null;

    const handleSendOTP = async (e) => {
        e.preventDefault();
        const result = await sendOTP(guardianEmail, teenUserId);
        if (result.success) {
            setStep('otp');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const result = await verifyOTP(guardianEmail, teenUserId, otpCode);
        if (result.success) {
            onVerified?.();
            setTimeout(() => onClose(), 1500);
        }
    };

    const handleResend = async () => {
        await resendOTP(guardianEmail, teenUserId);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Guardian Verification</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    {verified ? (
                        <div className={styles.success}>
                            <div className={styles.successIcon}>✓</div>
                            <h3>Verified!</h3>
                            <p>Guardian email has been verified successfully.</p>
                        </div>
                    ) : step === 'email' ? (
                        <form onSubmit={handleSendOTP}>
                            <div className={styles.info}>
                                <p>To ensure your safety, we need to verify your parent or guardian's email address.</p>
                                <p>They will receive a verification code to confirm their consent.</p>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="guardianEmail">Guardian's Email Address</label>
                                <input
                                    id="guardianEmail"
                                    type="email"
                                    value={guardianEmail}
                                    onChange={(e) => setGuardianEmail(e.target.value)}
                                    placeholder="parent@example.com"
                                    required
                                    className={styles.input}
                                />
                            </div>

                            {error && <div className={styles.error}>{error}</div>}

                            <Button
                                type="submit"
                                variant="primary"
                                loading={sending}
                                disabled={!guardianEmail || sending}
                                fullWidth
                            >
                                {sending ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP}>
                            <div className={styles.info}>
                                <p>We've sent a 6-digit code to:</p>
                                <p className={styles.email}>{guardianEmail}</p>
                                <p>Please enter the code below:</p>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="otpCode">Verification Code</label>
                                <input
                                    id="otpCode"
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    className={`${styles.input} ${styles.otpInput}`}
                                />
                            </div>

                            {error && <div className={styles.error}>{error}</div>}

                            <Button
                                type="submit"
                                variant="primary"
                                loading={verifying}
                                disabled={otpCode.length !== 6 || verifying}
                                fullWidth
                            >
                                {verifying ? 'Verifying...' : 'Verify Code'}
                            </Button>

                            <div className={styles.resend}>
                                <span>Didn't receive the code?</span>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className={styles.resendBtn}
                                    disabled={sending}
                                >
                                    Resend
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className={styles.backBtn}
                            >
                                ← Change Email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardianVerificationModal;
