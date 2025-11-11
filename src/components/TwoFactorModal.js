import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyTOTP, verifyBackupCode } from '../utils/twoFactorAuth';
import './TwoFactorModal.css';

export default function TwoFactorModal({ show, onVerify, onCancel, userId, secret }) {
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
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="two-factor-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Two-Factor Authentication</h2>
            <button
              className="modal-close"
              onClick={onCancel}
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="two-factor-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <p className="two-factor-description">
              {useBackupCode
                ? 'Enter one of your backup codes to sign in.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder={useBackupCode ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
                  className="two-factor-input"
                  autoFocus
                  disabled={loading}
                  maxLength={useBackupCode ? 19 : 6}
                />
              </div>

              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="verify-button"
                disabled={loading || (useBackupCode ? code.length < 19 : code.length !== 6)}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </form>

            <button
              type="button"
              className="backup-code-toggle"
              onClick={toggleBackupCode}
              disabled={loading}
            >
              {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
