import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { 
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel
} from "../utils/validation";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getRateLimitMessage
} from "../utils/rateLimiter";
import { is2FAEnabled } from "../utils/twoFactorAuth";
import TwoFactorModal from "../components/TwoFactorModal";
import "./Auth.css";

// Use public logo path to avoid import errors
const focusLogo = "/focus-logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Real-time password validation
  useEffect(() => {
    if (!password) {
      setPasswordValidation(null);
      return;
    }
    
    const validation = validatePassword(password);
    setPasswordValidation(validation);
  }, [password]);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const displayMessage = (msg, type = "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 8000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setShowResendEmail(false);

    try {
      if (isLogin) {
        // Check rate limit before attempting login
        const identifier = email.trim().toLowerCase();
        const limitCheck = checkRateLimit(identifier);
        
        if (limitCheck.isLocked) {
          displayMessage(getRateLimitMessage(limitCheck), 'error');
          setRateLimitStatus(limitCheck);
          setLoading(false);
          return;
        }
        
        // Show warning if approaching limit
        if (limitCheck.remainingAttempts <= 2) {
          setRateLimitStatus(limitCheck);
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password
        });

        if (error) {
          console.error('Login error:', error);
          
          // Record failed attempt
          const newStatus = recordFailedAttempt(identifier);
          setRateLimitStatus(newStatus);
          
          if (error?.message?.includes('Email not confirmed') || 
              error?.message?.includes('email_not_confirmed')) {
            displayMessage('Please verify your email first. Check your inbox and spam folder.', 'info');
            setShowResendEmail(true);
          } else if (error?.message?.includes('Invalid login credentials')) {
            const warningMsg = getRateLimitMessage(newStatus);
            const baseMsg = 'Invalid email or password. Please check your credentials or verify your email.';
            displayMessage(warningMsg ? `${baseMsg} ${warningMsg}` : baseMsg, 'error');
            setShowResendEmail(true);
          } else if (error?.message?.includes('Email link is invalid')) {
            displayMessage('Email verification link expired. Please request a new one.', 'error');
            setShowResendEmail(true);
          } else {
            displayMessage(error?.message || 'Login failed. Please try again.', 'error');
          }
          
          setLoading(false);
          return;
        }

        if (data?.user) {
          // Check if user has 2FA enabled
          const has2FA = await is2FAEnabled(data.user.id);
          
          if (has2FA) {
            // Show 2FA modal
            setPendingAuth({ user: data.user, identifier });
            setShow2FAModal(true);
            setLoading(false);
          } else {
            // Reset rate limit on successful login
            resetRateLimit(identifier);
            setRateLimitStatus(null);
            displayMessage('Successfully logged in! Redirecting...', 'success');
          }
        }

      } else {
        if (!birthDate) {
          displayMessage('Please enter your date of birth.', 'error');
          setLoading(false);
          return;
        }

        const age = calculateAge(birthDate);
        
        if (age < 12) {
          displayMessage("You must be at least 12 years old to use Focus.", 'error');
          setLoading(false);
          return;
        }

        if (age < 18 && !guardianEmail) {
          displayMessage("Users under 18 require guardian email verification.", 'error');
          setLoading(false);
          return;
        }

        // Validate password strength
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
          displayMessage(
            `Password must meet all requirements: ${passwordCheck.feedback.join(', ')}`, 
            'error'
          );
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              username: nickname.trim() || email.split('@')[0],
              full_name: nickname.trim() || email.split('@')[0],
              age: age,
              guardian_email: guardianEmail || null
            }
          }
        });
        
        if (error) {
          if (error?.message?.includes('User already registered') || 
              error?.message?.includes('already been registered')) {
            displayMessage('This email is already registered. Please sign in or reset your password.', 'info');
            setIsLogin(true);
          } else {
            throw error;
          }
        } else if (data?.user) {
          displayMessage(
            "Account created successfully! Please check your email (including spam folder) to verify your account before signing in.", 
            'success'
          );
          setIsLogin(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      displayMessage(error.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    setMessage("");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('OAuth error:', error);
      displayMessage(`${provider} sign-in failed. Please try again.`, 'error');
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      displayMessage('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase()
      });
      
      if (error) throw error;
      
      displayMessage('Verification email sent! Please check your inbox and spam folder.', 'success');
      setShowResendEmail(false);
    } catch (error) {
      console.error('Resend error:', error);
      displayMessage('Failed to resend email. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setMessage("");
    setMessageType("");
    setShowResendEmail(false);
    setBirthDate("");
    setGuardianEmail("");
    setNickname("");
    setPassword("");
    setPasswordValidation(null);
  };

  const handle2FAVerification = (isValid) => {
    if (isValid && pendingAuth) {
      // Reset rate limit on successful 2FA
      resetRateLimit(pendingAuth.identifier);
      setRateLimitStatus(null);
      setShow2FAModal(false);
      setPendingAuth(null);
      displayMessage('Successfully logged in! Redirecting...', 'success');
    }
  };

  const handle2FACancel = async () => {
    setShow2FAModal(false);
    setPendingAuth(null);
    // Sign out the user since they didn't complete 2FA
    await supabase.auth.signOut();
    displayMessage('Login cancelled. Please try again.', 'info');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      displayMessage('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      
      if (error) throw error;
      
      displayMessage('Password reset email sent! Check your inbox and spam folder.', 'success');
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      displayMessage(error.message || 'Failed to send reset email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TwoFactorModal
        show={show2FAModal}
        onVerify={handle2FAVerification}
        onCancel={handle2FACancel}
        userId={pendingAuth?.user?.id}
        secret={null} // Will be fetched from database in the modal
      />
      <div className="auth-container" data-testid="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="auth-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.img 
            src={focusLogo} 
            alt="Focus Logo" 
            className="auth-logo"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <motion.h1 
            className="auth-title"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            Focus
          </motion.h1>
          <motion.p 
            className="auth-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isLogin ? 'Welcome back to Focus!' : 'Join the Focus community'}
          </motion.p>
          <motion.p 
            className="auth-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Meet the real people, not the fake profiles.
          </motion.p>
        </motion.div>

        {/* OAuth Section */}
        <motion.div 
          className="auth-oauth-top"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="oauth-buttons-grid">
            {/* Google */}
            <motion.button
              className="oauth-button oauth-google"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              aria-label="Continue with Google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </motion.button>

            {/* Microsoft */}
            <motion.button
              className="oauth-button oauth-microsoft"
              onClick={() => handleOAuth('azure')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              aria-label="Continue with Microsoft"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                <path fill="#7fba00" d="M13 1h10v10H13z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
              <span>Microsoft</span>
            </motion.button>

            {/* GitHub */}
            <motion.button
              className="oauth-button oauth-github"
              onClick={() => handleOAuth('github')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              aria-label="Continue with GitHub"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </motion.button>

            {/* Discord */}
            <motion.button
              className="oauth-button oauth-discord"
              onClick={() => handleOAuth('discord')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              aria-label="Continue with Discord"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Discord</span>
            </motion.button>

            {/* Twitter */}
            <motion.button
              className="oauth-button oauth-twitter"
              onClick={() => handleOAuth('twitter')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              aria-label="Continue with Twitter"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Twitter</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          className="auth-divider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span>or continue with email</span>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          noValidate
        >
          <motion.div 
            className="input-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="auth-input"
              data-testid="email-input"
              aria-label="Email address"
              aria-required="true"
            />
          </motion.div>

          <motion.div 
            className="input-group password-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="auth-input"
                data-testid="password-input"
                aria-label="Password"
                aria-required="true"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {!isLogin && password && passwordValidation && (
              <motion.div 
                className="password-strength"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordValidation.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordValidation.strength)
                    }}
                  />
                </div>
                <div className="strength-info">
                  <span 
                    className="strength-text"
                    style={{ color: getPasswordStrengthColor(passwordValidation.strength) }}
                  >
                    {getPasswordStrengthLabel(passwordValidation.strength)}
                  </span>
                  {!passwordValidation.isValid && (
                    <div className="password-requirements">
                      <p className="requirements-title">Password must include:</p>
                      <ul className="requirements-list">
                        {passwordValidation.feedback.map((req, index) => (
                          <li key={index} className="requirement-item">
                            <span className="requirement-icon">
                              {passwordValidation.requirements[Object.keys(passwordValidation.requirements)[index]] ? '✓' : '○'}
                            </span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {isLogin && rateLimitStatus && !rateLimitStatus.isLocked && rateLimitStatus.remainingAttempts <= 2 && (
            <motion.div 
              className="rate-limit-warning"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{rateLimitStatus.remainingAttempts} attempt{rateLimitStatus.remainingAttempts !== 1 ? 's' : ''} remaining</span>
            </motion.div>
          )}

          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="input-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label htmlFor="nickname" className="sr-only">Nickname</label>
                  <input
                    id="nickname"
                    type="text"
                    placeholder="Nickname (optional)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    autoComplete="nickname"
                    className="auth-input"
                    aria-label="Nickname (optional)"
                  />
                </motion.div>

                <motion.div 
                  className="input-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label htmlFor="birthdate" className="auth-label">
                    Date of Birth (Required)
                  </label>
                  <input
                    id="birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="auth-input"
                    aria-label="Date of birth"
                    aria-required="true"
                  />
                </motion.div>

                <AnimatePresence>
                  {birthDate && calculateAge(birthDate) < 18 && calculateAge(birthDate) >= 12 && (
                    <motion.div 
                      className="input-group"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label htmlFor="guardian-email" className="auth-label">
                        Guardian/Parent Email (Required)
                      </label>
                      <input
                        id="guardian-email"
                        type="email"
                        placeholder="Guardian's email address"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="auth-input"
                        aria-label="Guardian email address"
                        aria-required="true"
                      />
                      <p className="auth-helper-text">
                        Your guardian will receive an email to approve your account
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={
              loading || 
              !email || 
              !password ||
              (isLogin && password.length < 6) ||
              (!isLogin && (!passwordValidation || !passwordValidation.isValid || !birthDate))
            }
            className={`auth-button ${loading ? 'loading' : ''}`}
            data-testid="login-button"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            aria-busy={loading}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="button-loading"
                >
                  <div className="spinner" />
                  Please wait...
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isLogin ? 'Sign In to Focus' : 'Create Account'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.form>

        {/* Forgot Password Link */}
        {isLogin && (
          <motion.div 
            className="auth-forgot-password"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="forgot-password-link"
              data-testid="forgot-password-link"
            >
              Forgot your password?
            </button>
          </motion.div>
        )}

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPassword(false)}
            >
              <motion.div
                className="forgot-password-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Reset Password</h3>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <form onSubmit={handleForgotPassword}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="auth-input"
                    data-testid="reset-email-input"
                  />
                  <div className="modal-buttons">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="auth-button secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="auth-button"
                      disabled={loading || !resetEmail}
                      data-testid="send-reset-button"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResendEmail && (
            <motion.button
              className="auth-button resend-btn"
              onClick={handleResendEmail}
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              aria-label="Resend verification email"
            >
              Resend Verification Email
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {message && (
            <motion.div 
              className={`auth-message ${messageType}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              role="alert"
              aria-live="polite"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Mode Tabs */}
        <motion.div 
          className="auth-tabs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
            data-testid="login-tab"
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
            data-testid="signup-tab"
          >
            Sign Up
          </button>
        </motion.div>

        <motion.div 
          className="auth-switch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button
            type="button"
            onClick={toggleAuthMode}
            className="auth-switch-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </motion.button>
        </motion.div>
      </motion.div>
      
      <div className="auth-background" aria-hidden="true">
        <div className="auth-bg-shape auth-bg-shape-1" />
        <div className="auth-bg-shape auth-bg-shape-2" />
        <div className="auth-bg-shape auth-bg-shape-3" />
      </div>
    </div>
    </>
  );
}
