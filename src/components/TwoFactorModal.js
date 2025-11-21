import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyTOTP, verifyBackupCode } from '../utils/twoFactorAuth';
import styles from './TwoFactorModal.module.css';

/**
 * TwoFactorModal - Modal for verifying two-factor authentication codes.
 * @component
 * @param {boolean} show - Whether modal is shown
 * @param {function} onVerify - Handler for verification
 * @param {function} onCancel - Handler to cancel
 * @param {string} userId - User ID
 * @param {string} secret - 2FA secret
 * @returns {React.ReactElement}
 */
const TwoFactorModal = React.memo(function TwoFactorModal({ show, onVerify, onCancel, userId, secret }) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let isValid = false;

      if (useBackupCode) {
        isValid = await verifyBackupCode(userId, code.trim());
      } else {
        isValid = await verifyTOTP(secret, code.trim());
      }

      if (isValid) {
        onVerify(true);
      } else {
        setError(useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
        setLoading(false);
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9A-F-]/gi, '');
    
    if (useBackupCode) {
      // Format backup code: XXXX-XXXX-XXXX-XXXX
      const formatted = value.replace(/-/g, '').match(/.{1,4}/g)?.join('-') || value;
      setCode(formatted.substring(0, 19)); // Max length with dashes
    } else {
      // Only allow 6 digits for TOTP
      setCode(value.substring(0, 6));
    }
    
    setError('');
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
    setError('');
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className={styles.twoFactorModal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalHeader}>
            <h2>Two-Factor Authentication</h2>
            <button
              className={styles.modalClose}
              onClick={onCancel}
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.twoFactorIcon}>
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <p className={styles.twoFactorDescription}>
              {useBackupCode
                ? 'Enter one of your backup codes to sign in.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder={useBackupCode ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
                  className={styles.twoFactorInput}
                  autoFocus
                  disabled={loading}
                  maxLength={useBackupCode ? 19 : 6}
                  aria-label={useBackupCode ? 'Backup code' : 'Authenticator code'}
                />
              </div>

              {error && (
                <motion.div
                  className={styles.errorMessage}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className={styles.verifyButton}
                disabled={loading || (useBackupCode ? code.length < 19 : code.length !== 6)}
                aria-label="Verify code"
              >
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </form>

            <button
              type="button"
              className={styles.backupCodeToggle}
              onClick={toggleBackupCode}
              disabled={loading}
              aria-label={useBackupCode ? 'Switch to authenticator code' : 'Switch to backup code'}
            >
              {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

TwoFactorModal.displayName = 'TwoFactorModal';
TwoFactorModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onVerify: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  secret: PropTypes.string.isRequired
};

export default TwoFactorModal;
