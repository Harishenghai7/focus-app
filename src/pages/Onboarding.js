import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Avatar,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Google,
  Email,
  Phone,
  CheckCircle,
  PhotoCamera,
  Person,
  Security,
  VerifiedUser,
  Close,
  GitHub,
  Shield,
  Laptop,
  LocationOn,
  SmartToy,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import { FaXTwitter, FaDiscord } from 'react-icons/fa6';
import { SiMicrosoft } from 'react-icons/si';
import { supabase } from '../supabaseClient';
import { sendOTP as sendOtpApi, verifyOTP as verifyOtpApi } from '../utils/phoneVerification';
import { 
  initializeTrustShield, 
  verifyWithCaptcha, 
  getTrustShieldStatus 
} from '../utils/trustShieldManager';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Confetti from 'react-confetti';

const STEPS = {
  WELCOME: 1,
  OAUTH: 2,
  TRUST_SHIELD: 3,
  CAPTCHA: 4,
  PHONE: 5,
  PROFILE: 6,
  COMPLETE: 7
};

const countryCodes = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [authMethod, setAuthMethod] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Trust Shield state
  const [trustShieldInit, setTrustShieldInit] = useState(null);
  const [trustShieldLoading, setTrustShieldLoading] = useState(false);
  const [trustShieldError, setTrustShieldError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [trustStatus, setTrustStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUser(session.user);

      // Check if onboarding is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_verified, username, onboarding_completed')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.onboarding_completed && profile?.phone_verified && profile?.username) {
        navigate('/home');
      } else {
        // Check if Trust Shield is already initialized
        const { data: verification } = await supabase
          .from('user_identity_verification')
          .select('trust_score')
          .eq('user_id', session.user.id)
          .single();

        if (!verification) {
          // Need to initialize Trust Shield
          const trustInitSuccess = await initializeTrustShieldForUser(session.user);
          if (trustInitSuccess) {
            setCurrentStep(STEPS.TRUST_SHIELD);
          }
        } else if (!profile?.phone_verified) {
          // Get trust status for later display
          const status = await getTrustShieldStatus(session.user.id);
          setTrustStatus(status);
          setCurrentStep(STEPS.PHONE);
        } else if (!profile?.username) {
          setCurrentStep(STEPS.PROFILE);
        }
      }
    }
  };

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();

        setUsernameAvailable(!data);
      } catch (err) {
        // If no match found, username is available
        setUsernameAvailable(true);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Trust Shield after OAuth login
  const initializeTrustShieldForUser = async (user) => {
    setTrustShieldLoading(true);
    setTrustShieldError('');
    try {
      // Get client IP and user agent
      const userAgent = navigator.userAgent;
      
      // Fetch client IP (you may want to use a service like ipify)
      let ipAddress = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.warn('Could not fetch IP:', ipError);
      }

      // Initialize Trust Shield
      const result = await initializeTrustShield(user.id, {
        email: user.email,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      setTrustShieldInit(result);
      setCurrentUser(user);

      // Check for immediate issues
      if (result.emailQuality?.isDisposable) {
        setTrustShieldError('Disposable email addresses are not allowed. Please use a permanent email address.');
        return false;
      }

      if (result.ipInfo?.isTor) {
        setTrustShieldError('Tor network detected. For security reasons, please disable Tor to create an account.');
        return false;
      }

      if (result.initialTrustScore < 20) {
        setTrustShieldError('Your account has been flagged for security review. Please contact support.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Trust Shield initialization error:', err);
      setTrustShieldError('Security check failed. Please try again.');
      return false;
    } finally {
      setTrustShieldLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });
      if (error) throw error;
      
      if (data.user) {
        setCurrentUser(data.user);
        // Initialize Trust Shield
        const trustInitSuccess = await initializeTrustShieldForUser(data.user);
        if (trustInitSuccess) {
          setCurrentStep(STEPS.TRUST_SHIELD);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle CAPTCHA verification
  const handleCaptchaVerify = async (token) => {
    setCaptchaToken(token);
    setLoading(true);
    setError('');
    try {
      const result = await verifyWithCaptcha(currentUser.id, token, 'hcaptcha');
      if (result.verified) {
        setCaptchaVerified(true);
        // Get updated trust status
        const status = await getTrustShieldStatus(currentUser.id);
        setTrustStatus(status);
        
        // Proceed to phone verification
        setTimeout(() => {
          setCurrentStep(STEPS.PHONE);
        }, 1500);
      }
    } catch (err) {
      setError('CAPTCHA verification failed. Please try again.');
      console.error('CAPTCHA error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      const res = await sendOtpApi(fullPhone);
      if (!res.ok) {
        throw new Error(res.error || 'Failed to send verification code');
      }
      if (res.devOtp) {
        // Dev only: expose OTP in console when SMS backend is not configured
        // Remove for production
        console.log('OTP sent (dev):', res.devOtp);
      }
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      const res = await verifyOtpApi(fullPhone, otp);
      if (!res.ok) {
        throw new Error(res.error || 'Verification failed');
      }
      setCurrentStep(STEPS.PROFILE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleCompleteProfile = async () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!usernameAvailable) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let profilePictureUrl = null;

      // Upload profile picture if provided
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profilePicture);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        profilePictureUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          bio: bio || null,
          profile_picture_url: profilePictureUrl,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setCurrentStep(STEPS.COMPLETE);
      setShowConfetti(true);
      
      setTimeout(() => {
        navigate('/home');
      }, 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (currentStep === STEPS.OAUTH && authMethod === 'email') {
      handleEmailSignUp();
    } else if (currentStep === STEPS.TRUST_SHIELD) {
      setCurrentStep(STEPS.CAPTCHA);
    } else if (currentStep === STEPS.PHONE && !otpSent) {
      handleSendOTP();
    } else if (currentStep === STEPS.PHONE && otpSent) {
      handleVerifyOTP();
    } else if (currentStep === STEPS.PROFILE) {
      handleCompleteProfile();
    } else if (currentStep < STEPS.COMPLETE) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > STEPS.WELCOME) {
      if (currentStep === STEPS.PHONE && otpSent) {
        setOtpSent(false);
        setOtp('');
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const getProgressValue = () => {
    return (currentStep / 7) * 100;
  };

  const canProceed = () => {
    switch (currentStep) {
      case STEPS.WELCOME:
        return true;
      case STEPS.OAUTH:
        if (authMethod === 'email') {
          return email && password && password.length >= 6;
        }
        return authMethod !== '';
      case STEPS.TRUST_SHIELD:
        return trustShieldInit && !trustShieldError;
      case STEPS.CAPTCHA:
        return captchaVerified;
      case STEPS.PHONE:
        if (!otpSent) {
          return phoneNumber.length >= 10;
        }
        return otp.length === 6;
      case STEPS.PROFILE:
        return username && username.length >= 3 && usernameAvailable;
      default:
        return true;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(80px)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(80px)'
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              elevation={24}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                overflow: 'visible'
              }}
            >
              {currentStep !== STEPS.WELCOME && currentStep !== STEPS.COMPLETE && (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressValue()}
                    sx={{
                      height: 6,
                      borderRadius: '4px 4px 0 0',
                      background: 'rgba(102, 126, 234, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      }
                    }}
                  />
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {currentStep > STEPS.WELCOME && (
                      <IconButton onClick={handleBack} size="small">
                        <ArrowBack />
                      </IconButton>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                      Step {currentStep} of 7
                    </Typography>
                  </Box>
                </>
              )}

              <CardContent sx={{ p: 4 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {/* Step 1: Welcome Screen */}
                {currentStep === STEPS.WELCOME && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          margin: '0 auto',
                          mb: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: '3rem'
                        }}
                      >
                        🎯
                      </Avatar>
                    </motion.div>

                    <Typography
                      variant="h3"
                      gutterBottom
                      sx={{
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 2
                      }}
                    >
                      Welcome to Focus
                    </Typography>

                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                      Meet real people, not fake profiles
                    </Typography>

                    <Chip
                      icon={<VerifiedUser />}
                      label="Verified Profiles - Making the safest social media platform possible"
                      color="primary"
                      sx={{
                        mt: 3,
                        mb: 4,
                        py: 3,
                        px: 2,
                        height: 'auto',
                        '& .MuiChip-label': {
                          display: 'block',
                          whiteSpace: 'normal',
                          textAlign: 'center'
                        }
                      }}
                    />

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => setCurrentStep(STEPS.OAUTH)}
                      endIcon={<ArrowForward />}
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)'
                        }
                      }}
                    >
                      Get Started
                    </Button>
                  </Box>
                )}

                {/* Step 2: OAuth Selection */}
                {currentStep === STEPS.OAUTH && (
                  <Box sx={{ py: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                      Create Your Account
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Google OAuth */}
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={<Google />}
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          borderWidth: 2,
                          borderColor: '#DB4437',
                          color: '#DB4437',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#C33D2E',
                            background: 'rgba(219, 68, 55, 0.05)'
                          }
                        }}
                      >
                        Continue with Google
                      </Button>

                      {/* Microsoft OAuth */}
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={<SiMicrosoft />}
                        onClick={() => handleOAuthSignIn('azure')}
                        disabled={loading}
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          borderWidth: 2,
                          borderColor: '#00A4EF',
                          color: '#00A4EF',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#0078D4',
                            background: 'rgba(0, 164, 239, 0.05)'
                          }
                        }}
                      >
                        Continue with Microsoft
                      </Button>

                      {/* X (Twitter) OAuth */}
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={<FaXTwitter style={{ fontSize: '1.25rem' }} />}
                        onClick={() => handleOAuthSignIn('twitter')}
                        disabled={loading}
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          borderWidth: 2,
                          borderColor: '#000000',
                          color: '#000000',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#000000',
                            background: 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      >
                        Continue with X
                      </Button>

                      {/* Discord OAuth */}
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={<FaDiscord style={{ fontSize: '1.5rem' }} />}
                        onClick={() => handleOAuthSignIn('discord')}
                        disabled={loading}
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          borderWidth: 2,
                          borderColor: '#5865F2',
                          color: '#5865F2',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#4752C4',
                            background: 'rgba(88, 101, 242, 0.05)'
                          }
                        }}
                      >
                        Continue with Discord
                      </Button>

                      {/* GitHub OAuth */}
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={<GitHub />}
                        onClick={() => handleOAuthSignIn('github')}
                        disabled={loading}
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          borderWidth: 2,
                          borderColor: '#24292e',
                          color: '#24292e',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#000000',
                            background: 'rgba(36, 41, 46, 0.05)'
                          }
                        }}
                      >
                        Continue with GitHub
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                        <Box sx={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                        <Typography sx={{ px: 2, color: 'text.secondary' }}>or</Typography>
                        <Box sx={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                      </Box>

                      {authMethod === 'email' ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            fullWidth
                            type="email"
                            label="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email />
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField
                            fullWidth
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            helperText="At least 6 characters"
                          />
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setAuthMethod('')}
                            startIcon={<Close />}
                            sx={{ textTransform: 'none' }}
                          >
                            Choose Different Method
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          size="large"
                          startIcon={<Email />}
                          onClick={() => setAuthMethod('email')}
                          sx={{
                            py: 2,
                            borderRadius: 3,
                            borderWidth: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          Continue with Email
                        </Button>
                      )}
                    </Box>

                    {authMethod === 'email' && (
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={handleNext}
                        disabled={!canProceed() || loading}
                        sx={{
                          mt: 3,
                          py: 2,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Continue'}
                      </Button>
                    )}
                  </Box>
                )}

                {/* Step 3: Trust Shield Initialization */}
                {currentStep === STEPS.TRUST_SHIELD && (
                  <Box sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Shield sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          Trust Shield
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Setting up your secure account...
                        </Typography>
                      </Box>
                    </Box>

                    {trustShieldLoading && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={60} sx={{ mb: 2 }} />
                        <Typography color="text.secondary">
                          Analyzing security factors...
                        </Typography>
                      </Box>
                    )}

                    {trustShieldError && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {trustShieldError}
                      </Alert>
                    )}

                    {trustShieldInit && !trustShieldError && (
                      <Box>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 3, 
                            mb: 3, 
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            border: '2px solid',
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            borderRadius: 3
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mr: 1 }}>
                              Trust Score:
                            </Typography>
                            <Chip 
                              label={`${trustShieldInit.initialTrustScore}/100`}
                              color={
                                trustShieldInit.initialTrustScore >= 70 ? 'success' :
                                trustShieldInit.initialTrustScore >= 40 ? 'warning' : 'error'
                              }
                              sx={{ fontSize: '1rem', fontWeight: 700 }}
                            />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={trustShieldInit.initialTrustScore} 
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              mb: 2,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: trustShieldInit.initialTrustScore >= 70 
                                  ? 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
                                  : trustShieldInit.initialTrustScore >= 40
                                  ? 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                                  : 'linear-gradient(90deg, #f44336 0%, #e57373 100%)'
                              }
                            }}
                          />
                        </Paper>

                        <List sx={{ mb: 2 }}>
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle sx={{ color: '#4caf50' }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Device Verified"
                              secondary={`Fingerprint: ${trustShieldInit.fingerprint.substring(0, 16)}...`}
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                          
                          <ListItem>
                            <ListItemIcon>
                              {trustShieldInit.ipInfo?.isVPN || trustShieldInit.ipInfo?.isProxy ? (
                                <Tooltip title="VPN/Proxy detected">
                                  <Warning sx={{ color: '#ff9800' }} />
                                </Tooltip>
                              ) : (
                                <CheckCircle sx={{ color: '#4caf50' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={`Location: ${trustShieldInit.ipInfo?.city || 'Unknown'}, ${trustShieldInit.ipInfo?.country || 'Unknown'}`}
                              secondary={
                                trustShieldInit.ipInfo?.isVPN 
                                  ? 'VPN detected - Proceeding with caution' 
                                  : trustShieldInit.ipInfo?.isProxy
                                  ? 'Proxy detected'
                                  : 'Direct connection'
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                          
                          <ListItem>
                            <ListItemIcon>
                              {trustShieldInit.emailQuality?.isDisposable ? (
                                <ErrorIcon sx={{ color: '#f44336' }} />
                              ) : (
                                <CheckCircle sx={{ color: '#4caf50' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary="Email Verified"
                              secondary={
                                trustShieldInit.emailQuality?.isDisposable
                                  ? 'Disposable email detected'
                                  : `Quality Score: ${trustShieldInit.emailQuality?.score}/100`
                              }
                            />
                          </ListItem>
                        </List>

                        {trustShieldInit.ipInfo?.isVPN && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            <strong>VPN Detected:</strong> We noticed you're using a VPN. 
                            While this is allowed, it may result in additional verification steps.
                          </Alert>
                        )}

                        <Alert severity="info" icon={<Shield />}>
                          Trust Shield protects Focus from bots and fake accounts. 
                          Your score improves as you use the platform authentically.
                        </Alert>

                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          onClick={handleNext}
                          disabled={!canProceed()}
                          endIcon={<ArrowForward />}
                          sx={{
                            mt: 3,
                            py: 2,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          Continue
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Step 4: CAPTCHA Verification */}
                {currentStep === STEPS.CAPTCHA && (
                  <Box sx={{ py: 2 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <SmartToy sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                        Quick Security Check
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Help us keep Focus safe from bots and automated accounts
                      </Typography>
                    </Box>

                    {!captchaVerified ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ mb: 3, transform: 'scale(0.9)', transformOrigin: 'center' }}>
                          <HCaptcha
                            sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'}
                            onVerify={handleCaptchaVerify}
                            onError={() => setError('CAPTCHA error occurred. Please try again.')}
                            onExpire={() => {
                              setCaptchaToken('');
                              setError('CAPTCHA expired. Please try again.');
                            }}
                          />
                        </Box>

                        {loading && (
                          <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <CircularProgress size={30} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Verifying...
                            </Typography>
                          </Box>
                        )}

                        <Alert severity="info" sx={{ mt: 3 }}>
                          This helps protect our community from spam and automated abuse.
                        </Alert>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                        >
                          <CheckCircle sx={{ fontSize: 100, color: '#4caf50', mb: 2 }} />
                        </motion.div>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#4caf50' }}>
                          ✓ Human Verified!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Trust score increased by +10
                        </Typography>
                        
                        {trustStatus && (
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 2, 
                              background: 'rgba(76, 175, 80, 0.1)',
                              border: '1px solid rgba(76, 175, 80, 0.3)',
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Current Trust Score
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                              {trustStatus.trustScore}/100
                            </Typography>
                            <Chip 
                              label={trustStatus.verificationLevel.toUpperCase()}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Paper>
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Redirecting to next step...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Step 5: Phone Verification */}
                {currentStep === STEPS.PHONE && (
                  <Box sx={{ py: 2 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Security sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                        Verify Your Phone
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        We verify every user for your safety
                      </Typography>
                      <Chip
                        label="One profile per number - No fake accounts"
                        color="success"
                        sx={{ mt: 2 }}
                      />
                    </Box>

                    {!otpSent ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <FormControl sx={{ minWidth: 120 }}>
                            <Select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              sx={{ borderRadius: 2 }}
                            >
                              {countryCodes.map((cc) => (
                                <MenuItem key={cc.code} value={cc.code}>
                                  {cc.flag} {cc.code}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            type="tel"
                            label="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            variant="outlined"
                            placeholder="1234567890"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Phone />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          onClick={handleNext}
                          disabled={!canProceed() || loading}
                          sx={{
                            py: 2,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="info">
                          We sent a 6-digit code to {countryCode}{phoneNumber}
                        </Alert>
                        <TextField
                          fullWidth
                          type="text"
                          label="Verification Code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          variant="outlined"
                          placeholder="000000"
                          inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
                        />
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          onClick={handleNext}
                          disabled={!canProceed() || loading}
                          sx={{
                            py: 2,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Verify Code'}
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Change Phone Number
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Step 4: Profile Setup */}
                {currentStep === STEPS.PROFILE && (
                  <Box sx={{ py: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                      Complete Your Profile
                    </Typography>
                    <Chip
                      label="Your data, your control - We value your privacy"
                      color="primary"
                      size="small"
                      sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Profile Picture */}
                      <Box sx={{ textAlign: 'center' }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-picture-upload"
                          type="file"
                          onChange={handleProfilePictureChange}
                        />
                        <label htmlFor="profile-picture-upload">
                          <Avatar
                            src={profilePicturePreview}
                            sx={{
                              width: 120,
                              height: 120,
                              margin: '0 auto',
                              cursor: 'pointer',
                              border: '4px dashed #667eea',
                              '&:hover': {
                                opacity: 0.8
                              }
                            }}
                          >
                            <PhotoCamera sx={{ fontSize: 40 }} />
                          </Avatar>
                        </label>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Click to upload profile picture (optional)
                        </Typography>
                      </Box>

                      {/* Username */}
                      <TextField
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        variant="outlined"
                        required
                        helperText={
                          checkingUsername
                            ? 'Checking availability...'
                            : usernameAvailable === true
                            ? '✓ Username is available'
                            : usernameAvailable === false
                            ? '✗ Username is taken'
                            : 'At least 3 characters (letters, numbers, underscores)'
                        }
                        error={usernameAvailable === false}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                          endAdornment: checkingUsername ? (
                            <InputAdornment position="end">
                              <CircularProgress size={20} />
                            </InputAdornment>
                          ) : usernameAvailable === true ? (
                            <InputAdornment position="end">
                              <CheckCircle color="success" />
                            </InputAdornment>
                          ) : null
                        }}
                      />

                      {/* Bio */}
                      <TextField
                        fullWidth
                        label="Bio (optional)"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 150))}
                        variant="outlined"
                        multiline
                        rows={3}
                        helperText={`${bio.length}/150 characters`}
                      />

                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={handleNext}
                        disabled={!canProceed() || loading}
                        sx={{
                          py: 2,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Complete Setup'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Step 7: Welcome to Focus - Complete */}
                {currentStep === STEPS.COMPLETE && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20
                      }}
                    >
                      <CheckCircle
                        sx={{
                          fontSize: 120,
                          color: '#4caf50',
                          mb: 3
                        }}
                      />
                    </motion.div>

                    <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, color: '#4caf50' }}>
                      You're Verified! ✓
                    </Typography>

                    <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                      Start exploring real connections
                    </Typography>

                    {/* Verification Badges Earned */}
                    {trustStatus && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          mb: 3,
                          background: 'rgba(102, 126, 234, 0.05)',
                          border: '2px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: 3
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          🎖️ Badges Earned
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
                          {trustStatus.badges && trustStatus.badges.map((badge) => (
                            <Tooltip key={badge.id} title={badge.name}>
                              <Chip
                                icon={<span>{badge.icon}</span>}
                                label={badge.name}
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                        
                        <Box sx={{ mt: 3, p: 2, background: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Trust Score
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 800, color: '#4caf50' }}>
                            {trustStatus.trustScore}/100
                          </Typography>
                          <Chip
                            label={trustStatus.verificationLevel.replace('_', ' ').toUpperCase()}
                            size="small"
                            color="success"
                            sx={{ mt: 1, fontWeight: 700 }}
                          />
                        </Box>

                        {trustStatus.nextStep && trustStatus.nextStep !== 'You have maximum trust!' && (
                          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                            <strong>Next Step:</strong> {trustStatus.nextStep}
                          </Alert>
                        )}
                      </Paper>
                    )}

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 3
                      }}
                    >
                      <Shield sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Protected by Trust Shield
                      </Typography>
                      <Typography variant="body2">
                        Welcome to Focus, where every profile is real and verified. 
                        Your account is protected by our 7-layer security system.
                      </Typography>
                    </Paper>

                    <Box sx={{ textAlign: 'left', mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        What's Next?
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Connect with real people"
                            secondary="No bots, no fake accounts"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Build your trust score"
                            secondary="Authentic engagement increases your reputation"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Enjoy a safe community"
                            secondary="Trust Shield monitors suspicious activity 24/7"
                          />
                        </ListItem>
                      </List>
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/home')}
                      endIcon={<ArrowForward />}
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)'
                        }
                      }}
                    >
                      Start Exploring Focus
                    </Button>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Redirecting automatically in 5 seconds...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default Onboarding;
