import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { enable2FA, confirm2FASetup, disable2FA } from '../utils/twoFactorAuth';
import styles from './TwoFactorSetup.module.css';

/**
 * TwoFactorSetup - Modal for setting up two-factor authentication.
 * @component
 * @param {Object} user - Current user object
 * @param {Object} userProfile - User profile object
 * @param {function} onUpdate - Handler for update
 * @returns {React.ReactElement}
 */
const TwoFactorSetup = React.memo(function TwoFactorSetup({ user, userProfile, onUpdate }) {
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await enable2FA(user.id, user.email);
      setSetupData(data);
      setShowSetup(true);
    } catch (err) {
      console.error('Error enabling 2FA:', err);
      setError('Failed to initialize 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await confirm2FASetup(user.id, verificationCode);

      if (isValid) {
        setSuccess('Two-factor authentication enabled successfully!');
        setShowBackupCodes(true);
        if (onUpdate) onUpdate();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await disable2FA(user.id);
      setSuccess('Two-factor authentication disabled.');
      setShowSetup(false);
      setSetupData(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `Focus - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Save these codes in a secure location.
Each code can only be used once.

${(setupData.backupCodes || []).map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to sign in.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focus-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const text = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Backup codes copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const handleClose = () => {
    setShowSetup(false);
    setSetupData(null);
    setVerificationCode('');
    setError('');
    setSuccess('');
    setShowBackupCodes(false);
  };

  return (
    <div className={styles.twoFactorSetup}>
      <div className={styles.settingItem}>
        <div className={styles.settingInfo}>
          <h3>Two-Factor Authentication</h3>
          <p>Add an extra layer of security to your account</p>
          {userProfile?.two_factor_enabled && (
            <span className={styles.statusBadgeEnabled}>Enabled</span>
          )}
        </div>
        <div className={styles.settingAction}>
          {userProfile?.two_factor_enabled ? (
            <button
              className={styles.buttonSecondary}
              onClick={handleDisable2FA}
              disabled={loading}
              aria-label="Disable two-factor authentication"
            >
              Disable
            </button>
          ) : (
            <button
              className={styles.buttonPrimary}
              onClick={handleEnable2FA}
              disabled={loading}
              aria-label="Enable two-factor authentication"
            >
              {loading ? 'Setting up...' : 'Enable'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSetup && setupData && (
          <motion.div
            className={styles.setupModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className={styles.setupModal}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!showBackupCodes ? (
                <>
                  <div className={styles.modalHeader}>
                    <h2>Set Up Two-Factor Authentication</h2>
                    <button className={styles.modalClose} onClick={handleClose} aria-label="Close">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className={styles.modalBody}>
                    <div className={styles.setupStep}>
                      <div className={styles.stepNumber}>1</div>
                      <div className={styles.stepContent}>
                        <h3>Scan QR Code</h3>
                        <p>Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code:</p>
                        <div className={styles.qrCodeContainer}>
                          <img src={setupData.qrCodeUrl} alt="QR Code" className={styles.qrCode} />
                        </div>
                        <details className={styles.manualEntry}>
                          <summary>Can't scan? Enter manually</summary>
                          <div className={styles.secretCode}>
                            <code>{setupData.secret}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(setupData.secret);
                                setSuccess('Secret copied!');
                                setTimeout(() => setSuccess(''), 2000);
                              }}
                              className={styles.copyButton}
                              aria-label="Copy secret code"
                            >
                              Copy
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>

                    <div className={styles.setupStep}>
                      <div className={styles.stepNumber}>2</div>
                      <div className={styles.stepContent}>
                        <h3>Verify Code</h3>
                        <p>Enter the 6-digit code from your authenticator app:</p>
                        <form onSubmit={handleVerifySetup}>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setVerificationCode(value.substring(0, 6));
                              setError('');
                            }}
                            placeholder="000000"
                            className={styles.verificationInput}
                            maxLength={6}
                            autoFocus
                            aria-label="Verification code"
                          />
                          {error && <div className={styles.errorMessage}>{error}</div>}
                          <button
                            type="submit"
                            className={styles.verifyButton}
                            disabled={loading || verificationCode.length !== 6}
                            aria-label="Verify and enable two-factor authentication"
                          >
                            {loading ? 'Verifying...' : 'Verify and Enable'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.modalHeader}>
                    <h2>Save Your Backup Codes</h2>
                    <button className={styles.modalClose} onClick={handleClose} aria-label="Close">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className={styles.modalBody}>
                    <div className={styles.successIcon}>
                      <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3>Two-Factor Authentication Enabled!</h3>
                    <p className={styles.backupCodesIntro}>
                      Save these backup codes in a secure location. You can use them to sign in if you lose access to your authenticator app.
                    </p>
                    <div className={styles.backupCodesList}>
                      {(setupData.backupCodes || []).map((code, index) => (
                        <div key={index} className={styles.backupCodeItem}>
                          <span className={styles.codeNumber}>{index + 1}.</span>
                          <code>{code}</code>
                        </div>
                      ))}
                    </div>
                    <div className={styles.backupCodesActions}>
                      <button onClick={handleDownloadBackupCodes} className={styles.buttonSecondary} aria-label="Download backup codes">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button onClick={handleCopyBackupCodes} className={styles.buttonSecondary} aria-label="Copy backup codes">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    {success && <div className={styles.successMessage}>{success}</div>}
                    <button onClick={handleClose} className={styles.buttonPrimaryDone} aria-label="Done">
                      Done
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TwoFactorSetup.displayName = 'TwoFactorSetup';
TwoFactorSetup.propTypes = {
  user: PropTypes.object.isRequired,
  userProfile: PropTypes.object,
  onUpdate: PropTypes.func
};

export default TwoFactorSetup;
