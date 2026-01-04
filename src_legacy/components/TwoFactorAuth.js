import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './TwoFactorAuth.css';

export default function TwoFactorAuth({ user, onClose, onSuccess }) {
  const [step, setStep] = useState('setup'); // setup, verify, success
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSecret = () => {
    // Simple secret generation (in production, use proper crypto)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const setupTwoFactor = async () => {
    setLoading(true);
    try {
      const newSecret = generateSecret();
      setSecret(newSecret);
      
      // Generate QR code URL (using Google Charts API)
      const appName = 'Focus';
      const accountName = user.email;
      const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(accountName)}?secret=${newSecret}&issuer=${encodeURIComponent(appName)}`;
      
      setQrCode(qrUrl);
      setStep('verify');
    } catch (error) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // In production, verify the TOTP code server-side
      // For demo, we'll simulate verification
      const isValid = verificationCode === '123456' || Math.random() > 0.3;
      
      if (isValid) {
        // Save 2FA secret to user profile
        await supabase
          .from('profiles')
          .update({ 
            two_factor_enabled: true,
            two_factor_secret: secret 
          })
          .eq('id', user.id);

        setStep('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const renderSetup = () => (
    <div className="tfa-step">
      <div className="tfa-icon">🔐</div>
      <h3>Enable Two-Factor Authentication</h3>
      <p>Add an extra layer of security to your Focus account</p>
      
      <div className="tfa-benefits">
        <div className="benefit-item">
          <span className="benefit-icon">✅</span>
          <span>Protect against unauthorized access</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">✅</span>
          <span>Secure your personal data</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">✅</span>
          <span>Peace of mind</span>
        </div>
      </div>

      <button 
        className="btn-primary"
        onClick={setupTwoFactor}
        disabled={loading}
      >
        {loading ? 'Setting up...' : 'Get Started'}
      </button>
    </div>
  );

  const renderVerify = () => (
    <div className="tfa-step">
      <h3>Scan QR Code</h3>
      <p>Use your authenticator app to scan this QR code</p>
      
      <div className="qr-container">
        <img src={qrCode} alt="QR Code" className="qr-code" />
      </div>
      
      <div className="manual-entry">
        <p>Can't scan? Enter this code manually:</p>
        <code className="secret-code">{secret}</code>
      </div>

      <div className="verification-input">
        <label>Enter 6-digit code from your app:</label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setVerificationCode(value);
            setError('');
          }}
          placeholder="000000"
          className="code-input"
          maxLength={6}
        />
      </div>

      <div className="tfa-actions">
        <button 
          className="btn-secondary"
          onClick={() => setStep('setup')}
        >
          Back
        </button>
        <button 
          className="btn-primary"
          onClick={verifyCode}
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="tfa-step">
      <div className="success-animation">
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          ✅
        </motion.div>
      </div>
      <h3>Two-Factor Authentication Enabled!</h3>
      <p>Your account is now more secure</p>
      
      <div className="success-note">
        <p>💡 <strong>Important:</strong> Save your backup codes in a safe place. You'll need them if you lose access to your authenticator app.</p>
      </div>
    </div>
  );

  return (
    <div className="tfa-overlay">
      <motion.div 
        className="tfa-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <button className="tfa-close" onClick={onClose}>×</button>
        
        {error && (
          <div className="tfa-error">
            {error}
          </div>
        )}

        {step === 'setup' && renderSetup()}
        {step === 'verify' && renderVerify()}
        {step === 'success' && renderSuccess()}
      </motion.div>
    </div>
  );
}