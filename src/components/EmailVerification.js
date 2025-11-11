import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './EmailVerification.css';

export default function EmailVerification({ user, onVerified }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      
      if (error) throw error;
      
      setMessage('Verification email sent! Check your inbox.');
      setCountdown(60);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email_confirmed_at) {
      onVerified();
    }
  };

  useEffect(() => {
    const interval = setInterval(checkVerification, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="email-verification"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="verification-card">
        <div className="verification-icon">📧</div>
        <h2>Verify Your Email</h2>
        <p>We sent a verification link to:</p>
        <strong>{user.email}</strong>
        
        <div className="verification-actions">
          <button 
            onClick={resendVerification}
            disabled={loading || countdown > 0}
            className="btn-primary"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
          </button>
          
          <button 
            onClick={checkVerification}
            className="btn-secondary"
          >
            I've Verified
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('sent') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </motion.div>
  );
}