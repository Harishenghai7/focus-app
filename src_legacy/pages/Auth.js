import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaGoogle, FaMicrosoft, FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';
import focusLogo from "../assets/focus-logo.png";
import "./Auth.css";
import { components, hooks, utils } from '@/importMap';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showMagicLink, setShowMagicLink] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ User already logged in, redirecting...');
          checkOnboardingAndRedirect(session.user.id);
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  // Check onboarding status
  const checkOnboardingAndRedirect = async (userId) => {
    try {
      console.log('🔍 Checking onboarding for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        navigate('/onboarding', { replace: true });
        return;
      }

      console.log('📊 Profile data:', profile);

      if (!profile?.onboarding_completed) {
        console.log('🎯 Redirecting to onboarding...');
        navigate('/onboarding', { replace: true });
      } else {
        console.log('🏠 Redirecting to home...');
        navigate('/home', { replace: true });
      }
    } catch (error) {
      console.error('❌ Onboarding check error:', error);
      navigate('/onboarding', { replace: true });
    }
  };

  // Username validation
  useEffect(() => {
    if (!username || isLogin || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setUsernameAvailable(!data);
      } catch (error) {
        console.error('❌ Username check error:', error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isLogin]);

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
    console.log(`📢 Message [${type}]:`, msg);
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 8000);
  };

const handleOAuth = async (provider) => {
  console.log(`🔵 OAuth clicked: ${provider}`);
  
  try {
    setLoading(true);
    setMessage("");

    const providerMap = {
      'google': 'google',
      'microsoft': 'azure',
      'github': 'github',
      'discord': 'discord',
      'twitter': 'twitter'
    };

    const supabaseProvider = providerMap[provider.toLowerCase()] || provider;
    
    console.log('🎯 Provider:', supabaseProvider);
    console.log('📍 Redirect will be:', `${window.location.origin}/auth/callback`);

    // ✅ Use PKCE flow (default in latest Supabase)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false
      }
    });

    if (error) {
      console.error(`❌ OAuth error:`, error);
      displayMessage(error.message || `Failed to sign in with ${provider}`, "error");
      setLoading(false);
      return;
    }

    console.log('✅ OAuth initiated:', data);
    displayMessage(`Redirecting to ${provider}...`, "success");
    
    // Note: Don't set loading to false - browser will redirect
    
  } catch (error) {
    console.error(`❌ OAuth failed:`, error);
    displayMessage(error.message || `Failed to sign in with ${provider}`, "error");
    setLoading(false);
  }
};


  // ✅ FIXED: Sign Up Handler
  const handleSignUp = async (e) => {
    e.preventDefault();
    console.log('🔵 Sign Up clicked');
    
    if (loading) {
      console.log('⚠️ Already loading, skipping...');
      return;
    }

    // Validation
    if (!acceptedTerms || !acceptedPrivacy) {
      displayMessage("Please accept Terms of Service and Privacy Policy", "error");
      return;
    }

    if (password !== confirmPassword) {
      displayMessage("Passwords do not match", "error");
      return;
    }

    if (password.length < 8) {
      displayMessage("Password must be at least 8 characters", "error");
      return;
    }

    if (!usernameAvailable) {
      displayMessage("Username is not available", "error");
      return;
    }

    if (!birthDate) {
      displayMessage("Please enter your birth date", "error");
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 13) {
      displayMessage("You must be at least 13 years old", "error");
      return;
    }

    if (age < 18 && !guardianEmail) {
      displayMessage("Guardian email required for users under 18", "error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      console.log('🔄 Starting sign up...');

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            username: username.toLowerCase(),
            full_name: nickname || username,
            date_of_birth: birthDate,
            guardian_email: age < 18 ? guardianEmail : null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError);
        throw signUpError;
      }

      console.log('✅ Sign up successful:', authData);

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create profile
      console.log('📝 Creating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username.toLowerCase(),
          full_name: nickname || username,
          email: email.trim().toLowerCase(),
          date_of_birth: birthDate,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('⚠️ Profile creation error:', profileError);
        // Continue anyway - profile might already exist from trigger
      }

      displayMessage("Account created! Redirecting...", "success");
      
      setTimeout(() => {
        console.log('🎯 Navigating to onboarding...');
        navigate('/onboarding', { replace: true });
      }, 1500);

    } catch (error) {
      console.error('❌ Sign up failed:', error);
      displayMessage(error.message || "Sign up failed. Please try again.", "error");
      
      if (error.message?.includes('already registered')) {
        setShowResendEmail(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    console.log('🔵 Sign In clicked');
    
    if (loading) {
      console.log('⚠️ Already loading, skipping...');
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      console.log('🔄 Starting sign in...');

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        throw signInError;
      }

      console.log('✅ Sign in successful:', authData);

      if (!authData.user) {
        throw new Error('Failed to sign in');
      }

      if (rememberMe) {
        localStorage.setItem('focusRememberMe', 'true');
      }

      displayMessage("Sign in successful! Redirecting...", "success");

      setTimeout(() => {
        console.log('🎯 Checking onboarding status...');
        checkOnboardingAndRedirect(authData.user.id);
      }, 1000);

    } catch (error) {
      console.error('❌ Sign in failed:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        displayMessage("Invalid email or password", "error");
      } else if (error.message?.includes('Email not confirmed')) {
        displayMessage("Please verify your email first", "error");
        setShowResendEmail(true);
      } else {
        displayMessage(error.message || "Sign in failed. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Magic Link
  const handleMagicLink = async (e) => {
    e.preventDefault();
    console.log('🔵 Magic Link clicked');
    
    if (!email) {
      displayMessage("Please enter your email", "error");
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Sending magic link...');

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      console.log('✅ Magic link sent');
      displayMessage("Magic link sent! Check your email.", "success");
      setShowMagicLink(false);
      
    } catch (error) {
      console.error('❌ Magic link error:', error);
      displayMessage(error.message || "Failed to send magic link", "error");
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    console.log('🔵 Password Reset clicked');
    
    if (!resetEmail) {
      displayMessage("Please enter your email", "error");
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Sending reset email...');

      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) throw error;

      console.log('✅ Reset email sent');
      displayMessage("Password reset email sent!", "success");
      setShowForgotPassword(false);
      setResetEmail("");
      
    } catch (error) {
      console.error('❌ Password reset error:', error);
      displayMessage(error.message || "Failed to send reset email", "error");
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification
  const handleResendVerification = async () => {
    console.log('🔵 Resend Verification clicked');
    
    if (!email) {
      displayMessage("Please enter your email", "error");
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Resending verification...');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase()
      });

      if (error) throw error;

      console.log('✅ Verification email resent');
      displayMessage("Verification email resent!", "success");
      setShowResendEmail(false);
      
    } catch (error) {
      console.error('❌ Resend error:', error);
      displayMessage(error.message || "Failed to resend email", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Mode
  const toggleMode = () => {
    console.log(`🔄 Toggling to ${isLogin ? 'Sign Up' : 'Sign In'}`);
    setIsLogin(!isLogin);
    setMessage("");
    setShowResendEmail(false);
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setNickname("");
    setBirthDate("");
    setGuardianEmail("");
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
  };

  return (
    <div className="page-auth">
      {/* Navigation/Header */}
      <header className="visually-hidden auth-header-nav" role="banner">
        <nav role="navigation" aria-label="Authentication">
          <h1>Focus - Authentication</h1>
        </nav>
      </header>

      {/* Main content */}
      <main role="main" className="auth-main-wrapper">
        <motion.div 
          className="auth-container" 
          data-testid="auth-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
        {/* Logo & Header */}
        <motion.div 
          className="auth-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="focus-logo">
            <img 
              src={focusLogo} 
              alt="Focus Logo" 
              className="logo-image"
            />
          </div>

          <h1 className="auth-title">Focus</h1>
          <p className="auth-subtitle">Welcome back to Focus!</p>
          <p className="auth-tagline">Meet the real people, not the fake profiles.</p>
        </motion.div>

        {/* OAuth Buttons */}
        <motion.div 
          className="oauth-section"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="oauth-buttons">
            <button
              type="button"
              className="oauth-btn oauth-google"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <FaGoogle className="oauth-icon" />
              <span>Google</span>
            </button>

            <button
              type="button"
              className="oauth-btn oauth-microsoft"
              onClick={() => handleOAuth('microsoft')}
              disabled={loading}
            >
              <FaMicrosoft className="oauth-icon" />
              <span>Microsoft</span>
            </button>
          </div>

          <div className="oauth-buttons">
            <button
              type="button"
              className="oauth-btn oauth-github"
              onClick={() => handleOAuth('github')}
              disabled={loading}
            >
              <FaGithub className="oauth-icon" />
              <span>GitHub</span>
            </button>

            <button
              type="button"
              className="oauth-btn oauth-discord"
              onClick={() => handleOAuth('discord')}
              disabled={loading}
            >
              <FaDiscord className="oauth-icon" />
              <span>Discord</span>
            </button>
          </div>

          <button
            type="button"
            className="oauth-btn oauth-twitter"
            onClick={() => handleOAuth('twitter')}
            disabled={loading}
          >
            <FaTwitter className="oauth-icon" />
            <span>Twitter</span>
          </button>
        </motion.div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div 
              className={`auth-message ${messageType}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form 
          className={`auth-form ${isLogin ? 'login-form' : 'signup-form'}`}
          data-testid={isLogin ? 'login-form' : 'signup-form'}
          onSubmit={isLogin ? handleSignIn : handleSignUp}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          role="form"
          aria-label={isLogin ? 'Login Form' : 'Sign Up Form'}
        >
          {/* Email */}
          <div className="form-group">
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="focus.20252025@outlook.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              data-testid="email-input"
              id="email-input"
              aria-label="Email address"
            />
          </div>

          {/* Username (Sign Up) */}
          {!isLogin && (
            <div className="form-group">
              <div className="input-with-status">
                <input
                  type="text"
                  className={`form-input ${usernameAvailable === false ? 'error' : usernameAvailable === true ? 'success' : ''}`}
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  disabled={loading}
                  data-testid="username-input"
                  id="username-input"
                  aria-label="Username"
                />
                {checkingUsername && <span className="input-loader">⏳</span>}
                {usernameAvailable === true && <span className="input-success">✓</span>}
                {usernameAvailable === false && <span className="input-error">✗</span>}
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                data-testid="password-input"
                id="password-input"
                aria-label="Password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up) */}
          {!isLogin && (
            <>
              <div className="form-group">
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nickname (optional)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={50}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  type="date"
                  className="form-input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>

              {birthDate && calculateAge(birthDate) < 18 && (
                <div className="form-group">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Guardian Email (required for under 18)"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    disabled={loading}
                  />
                  <span>I accept the Terms of Service</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    required
                    disabled={loading}
                  />
                  <span>I accept the Privacy Policy</span>
                </label>
              </div>
            </>
          )}

          {/* Remember Me */}
          {isLogin && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" 
            data-testid={isLogin ? "login-button" : "signup-button"}
            className="btn-auth-submit login-btn signin-btn auth-submit submit-button"
            disabled={loading || (!isLogin && (!acceptedTerms || !acceptedPrivacy || usernameAvailable !== true))}
            id={isLogin ? "login-submit" : "signup-submit"}
            aria-label={isLogin ? "Sign In" : "Sign Up"}
          >
            {loading ? (
              <span className="loading-spinner-btn">⏳</span>
            ) : (
              isLogin ? 'SIGN IN TO FOCUS' : 'SIGN UP'
            )}
          </button>
        </motion.form>

        {/* Login Links */}
        {isLogin && (
          <div className="auth-links">
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowMagicLink(true)}
              disabled={loading}
            >
              Use magic link instead
            </button>
            
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Toggle */}
        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              type="button"
              className="link-btn-primary signup-link register-link"
              onClick={toggleMode}
              disabled={loading}
              data-testid={isLogin ? "register-link" : "login-link"}
              id={isLogin ? "register-link" : "login-link"}
              aria-label={isLogin ? 'Go to Sign Up' : 'Go to Sign In'}
            >
              {isLogin ? 'Sign up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Resend */}
        {showResendEmail && (
          <button
            type="button"
            className="btn-resend"
            onClick={handleResendVerification}
            disabled={loading}
          >
            Resend verification email
          </button>
        )}

        {/* Magic Link Modal */}
        <AnimatePresence>
        {showMagicLink && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMagicLink(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Magic Link Sign In</h3>
              <form onSubmit={handleMagicLink}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowMagicLink(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Magic Link
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

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
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Reset Password</h3>
              <form onSubmit={handlePasswordReset}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowForgotPassword(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Reset Link
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="visually-hidden auth-footer-nav">
        <p>&copy; 2025 Focus</p>
      </footer>
    </div>
  );
}
