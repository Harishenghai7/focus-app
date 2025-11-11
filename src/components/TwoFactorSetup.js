import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enable2FA, confirm2FASetup, disable2FA } from '../utils/twoFactorAuth';
import './TwoFactorSetup.css';

export default function TwoFactorSetup({ user, userProfile, onUpdate }) {
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

${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

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
    <div className="two-factor-setup">
      <div className="setting-item">
        <div className="setting-info">
          <h3>Two-Factor Authentication</h3>
          <p>Add an extra layer of security to your account</p>
          {userProfile?.two_factor_enabled && (
            <span className="status-badge enabled">Enabled</span>
          )}
        </div>
        <div className="setting-action">
          {userProfile?.two_factor_enabled ? (
            <button
              className="button-secondary"
              onClick={handleDisable2FA}
              disabled={loading}
            >
              Disable
            </button>
          ) : (
            <button
              className="button-primary"
              onClick={handleEnable2FA}
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Enable'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSetup && setupData && (
          <motion.div
            className="setup-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="setup-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!showBackupCodes ? (
                <>
                  <div className="modal-header">
                    <h2>Set Up Two-Factor Authentication</h2>
                    <button className="modal-close" onClick={handleClose}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="setup-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h3>Scan QR Code</h3>
                        <p>Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code:</p>
                        <div className="qr-code-container">
                          <img src={setupData.qrCodeUrl} alt="QR Code" className="qr-code" />
                        </div>
                        <details className="manual-entry">
                          <summary>Can't scan? Enter manually</summary>
                          <div className="secret-code">
                            <code>{setupData.secret}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(setupData.secret);
                                setSuccess('Secret copied!');
                                setTimeout(() => setSuccess(''), 2000);
                              }}
                              className="copy-button"
                            >
                              Copy
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>

                    <div className="setup-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
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
                            className="verification-input"
                            maxLength={6}
                            autoFocus
                          />
                          {error && <div className="error-message">{error}</div>}
                          <button
                            type="submit"
                            className="verify-button"
                            disabled={loading || verificationCode.length !== 6}
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
                  <div className="modal-header">
                    <h2>Save Your Backup Codes</h2>
                    <button className="modal-close" onClick={handleClose}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="success-icon">
                      <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3>Two-Factor Authentication Enabled!</h3>
                    <p className="backup-codes-intro">
                      Save these backup codes in a secure location. You can use them to sign in if you lose access to your authenticator app.
                    </p>
                    <div className="backup-codes-list">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="backup-code-item">
                          <span className="code-number">{index + 1}.</span>
                          <code>{code}</code>
                        </div>
                      ))}
                    </div>
                    <div className="backup-codes-actions">
                      <button onClick={handleDownloadBackupCodes} className="button-secondary">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button onClick={handleCopyBackupCodes} className="button-secondary">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    {success && <div className="success-message">{success}</div>}
                    <button onClick={handleClose} className="button-primary done-button">
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
}
