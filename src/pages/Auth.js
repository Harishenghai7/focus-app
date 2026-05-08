import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaBolt,
    FaCheckCircle,
    FaEnvelope,
    FaFingerprint,
    FaLock,
    FaShieldAlt,
    FaUserCheck
} from 'react-icons/fa';
import AuthLayout from '../components/auth/AuthLayout';
import OAuthButtons from '../components/auth/OAuthButtons';
import SecurityPulse from '../components/auth/SecurityPulse';
import DeviceTrustBadge from '../components/auth/DeviceTrustBadge';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import Toast from '../components/shared/Toast';
import { resendVerificationEmail, resetPasswordForEmail, updateUserPassword } from '../utils/supabaseAuth';
import { validateEmail } from '../utils/validateEmail';
import { validatePassword } from '../utils/validatePassword';
import styles from './Auth/Auth.module.css';
import focusLogo from '../assets/focus-logo.png';

const MODE_PATHS = {
    login: '/auth',
    signup: '/signup',
    recovery: '/forgot-password',
    reset: '/reset-password',
    verify: '/verify-email'
};

const MODE_CONTENT = {
    login: {
        eyebrow: 'Trusted entry',
        title: 'Sign into a calmer social universe.',
        subtitle: 'Step into Focus through a trusted identity provider, then return to a safer, more emotionally intelligent social experience.'
    },
    signup: {
        eyebrow: 'Join Focus',
        title: 'Create your account through a trusted provider.',
        subtitle: 'Provider-first account creation keeps entry fast while Focus takes over onboarding, personalization, and Trust Shield next.'
    },
    recovery: {
        eyebrow: 'Account recovery',
        title: 'Reset access without losing trust.',
        subtitle: 'We will send a secure password reset link to your email so you can get back in quickly and safely.'
    },
    reset: {
        eyebrow: 'New password',
        title: 'Create a stronger password.',
        subtitle: 'Choose a fresh password that protects your account, sessions, and Trust Shield reputation.'
    },
    verify: {
        eyebrow: 'Email verification',
        title: 'Resend your verification email.',
        subtitle: 'Confirm your inbox so Focus can protect your identity, recovery paths, and suspicious login detection.'
    }
};

const signalCards = [
    {
        icon: <FaShieldAlt />,
        label: 'Trust Shield',
        value: 'Identity-first protection'
    },
    {
        icon: <FaFingerprint />,
        label: 'Login defense',
        value: 'Suspicious session detection'
    },
    {
        icon: <FaUserCheck />,
        label: 'Human-first',
        value: 'Healthy, real connection'
    }
];

const insightCards = [
    {
        title: 'Secure sessions',
        text: 'JWT auth, session persistence, and recovery flows designed for safety and continuity.'
    },
    {
        title: 'Wellbeing-led design',
        text: 'The entry experience sets the tone for calmer discovery, stronger moderation, and real identity.'
    }
];

const oauthPrinciples = [
    'Trusted-provider handoff instead of local password entry on the main auth surface',
    'New accounts continue directly into onboarding, personalization, and Trust Shield',
    'Healthy, secure entry built for real people instead of fake profile churn'
];

const getModeFromLocation = (location) => {
    const params = new URLSearchParams(location.search);
    const searchMode = params.get('mode');

    if (searchMode && MODE_PATHS[searchMode]) {
        return searchMode;
    }

    return Object.entries(MODE_PATHS).find(([, path]) => path === location.pathname)?.[0] || 'login';
};

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeMode, setActiveMode] = useState(() => getModeFromLocation(location));
    const [toast, setToast] = useState(null);
    const [supportLoading, setSupportLoading] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [verifyEmail, setVerifyEmail] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [modeTransition, setModeTransition] = useState(false);
    const locationMode = getModeFromLocation(location);

    useEffect(() => {
        if (locationMode !== activeMode) {
            setModeTransition(true);
            setTimeout(() => {
                setActiveMode(locationMode);
                setToast(null);
                setModeTransition(false);
            }, 250);
        }
    }, [locationMode, activeMode]);

    const navigateToMode = (mode) => {
        const nextPath = MODE_PATHS[mode] || MODE_PATHS.login;
        setToast(null);

        if (mode !== activeMode) {
            setModeTransition(true);
            setTimeout(() => {
                setActiveMode(mode);
                setModeTransition(false);
                if (location.pathname !== nextPath || location.search) {
                    navigate(nextPath);
                }
            }, 250);
        }
    };

    const handleRecoverySubmit = async (event) => {
        event.preventDefault();

        if (!validateEmail(recoveryEmail)) {
            setToast({ type: 'error', message: 'Enter a valid email address to receive a reset link.' });
            return;
        }

        setSupportLoading(true);
        try {
            const { error } = await resetPasswordForEmail(recoveryEmail.trim());
            if (error) {
                throw error;
            }

            setToast({
                type: 'success',
                message: 'Password reset link sent. Check your inbox and spam folder.'
            });
        } catch (error) {
            setToast({
                type: 'error',
                message: error.message || 'We could not send the reset email right now. Please try again.'
            });
        } finally {
            setSupportLoading(false);
        }
    };

    const handleResetSubmit = async (event) => {
        event.preventDefault();

        const passwordCheck = validatePassword(resetPassword);
        if (!passwordCheck.isValid) {
            setToast({ type: 'error', message: passwordCheck.errors[0] });
            return;
        }

        if (resetPassword !== confirmPassword) {
            setToast({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        setSupportLoading(true);
        try {
            const { error } = await updateUserPassword(resetPassword);
            if (error) {
                throw error;
            }

            setResetPassword('');
            setConfirmPassword('');
            setToast({ type: 'success', message: 'Password updated. You can sign in with your new credentials.' });
            navigateToMode('login');
        } catch (error) {
            setToast({
                type: 'error',
                message: error.message || 'We could not update your password. Open the reset link again and retry.'
            });
        } finally {
            setSupportLoading(false);
        }
    };

    const handleVerifySubmit = async (event) => {
        event.preventDefault();

        if (!validateEmail(verifyEmail)) {
            setToast({ type: 'error', message: 'Enter the email address linked to your Focus account.' });
            return;
        }

        setSupportLoading(true);
        try {
            const { error } = await resendVerificationEmail(verifyEmail.trim());
            if (error) {
                throw error;
            }

            setToast({ type: 'success', message: 'Verification email sent. Open your inbox to continue.' });
        } catch (error) {
            setToast({
                type: 'error',
                message: error.message || 'We could not resend the verification email right now.'
            });
        } finally {
            setSupportLoading(false);
        }
    };

    const renderSupportForm = () => {
        if (activeMode === 'recovery') {
            return (
                <form className={styles.inlineForm} onSubmit={handleRecoverySubmit}>
                    <Input
                        name="recoveryEmail"
                        type="email"
                        placeholder="Email address"
                        value={recoveryEmail}
                        onChange={(event) => setRecoveryEmail(event.target.value)}
                        icon={<FaEnvelope />}
                    />
                    <p className={styles.helperText}>
                        We send recovery links only to the email attached to your Focus account.
                    </p>
                    <Button type="submit" variant="primary" fullWidth isLoading={supportLoading}>
                        Send reset link
                    </Button>
                </form>
            );
        }

        if (activeMode === 'reset') {
            return (
                <form className={styles.inlineForm} onSubmit={handleResetSubmit}>
                    <Input
                        name="resetPassword"
                        type="password"
                        placeholder="New password"
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                        icon={<FaLock />}
                    />
                    <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        icon={<FaLock />}
                    />
                    <p className={styles.helperText}>
                        Use at least 8 characters with an uppercase letter, a number, and a special character.
                    </p>
                    <Button type="submit" variant="primary" fullWidth isLoading={supportLoading}>
                        Update password
                    </Button>
                </form>
            );
        }

        if (activeMode === 'verify') {
            return (
                <form className={styles.inlineForm} onSubmit={handleVerifySubmit}>
                    <Input
                        name="verifyEmail"
                        type="email"
                        placeholder="Email address"
                        value={verifyEmail}
                        onChange={(event) => setVerifyEmail(event.target.value)}
                        icon={<FaEnvelope />}
                    />
                    <p className={styles.helperText}>
                        Verification strengthens recovery, suspicious login alerts, and account authenticity.
                    </p>
                    <Button type="submit" variant="primary" fullWidth isLoading={supportLoading}>
                        Resend verification email
                    </Button>
                </form>
            );
        }

        const introCopy = activeMode === 'signup'
            ? 'Choose a provider to create your Focus identity and continue into onboarding.'
            : 'Choose a provider to securely continue into your Focus universe.';
        const supportCopy = activeMode === 'signup'
            ? 'Your provider handles the identity handshake. Focus takes over onboarding, safety setup, and Trust Shield next.'
            : 'Your provider verifies the entry point first. Focus layers trust, moderation, and wellbeing systems on top.';

        return (
            <div className={styles.oauthOnlyLayout}>
                <div className={styles.oauthOnlyIntro}>
                    <span className={styles.oauthOnlyPill}>
                        <FaCheckCircle />
                        OAuth-first entry
                    </span>
                    <h2 className={styles.oauthOnlyHeading}>
                        {activeMode === 'signup' ? 'Create your account without local password setup.' : 'Sign in without password fields on Focus.'}
                    </h2>
                    <p className={styles.oauthOnlyText}>{introCopy}</p>

                    <div className={styles.oauthPrinciples}>
                        {oauthPrinciples.map((item) => (
                            <div key={item} className={styles.oauthPrinciple}>
                                <span className={styles.oauthPrincipleDot}></span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <p className={styles.oauthSupportText}>{supportCopy}</p>
                </div>

                <div className={styles.oauthOnlyActions}>
                    <OAuthButtons mode={activeMode} />
                </div>
            </div>
        );
    };

    const modeCopy = MODE_CONTENT[activeMode];
    const showsOAuth = activeMode === 'login' || activeMode === 'signup';

    return (
        <AuthLayout>
            <section className={styles.shell}>
                {/* Hero badge with logo */}
                <div className={styles.heroBadge}>
                    <img src={focusLogo} alt="Focus" className={styles.heroBadgeLogo} />
                    <span>Identity-first social networking</span>
                </div>

                {/* Security + Device trust row */}
                <div className={styles.trustRow}>
                    <SecurityPulse compact />
                    <DeviceTrustBadge />
                </div>

                {/* Header */}
                <header className={styles.header}>
                    <p className={styles.eyebrow}>{modeCopy.eyebrow}</p>
                    <h1 className={styles.title}>{modeCopy.title}</h1>
                    <p className={styles.subtitle}>{modeCopy.subtitle}</p>
                </header>

                {/* Signal cards */}
                <div className={styles.signalGrid}>
                    {signalCards.map((card) => (
                        <article key={card.label} className={styles.signalCard}>
                            <span className={styles.signalIcon}>{card.icon}</span>
                            <div>
                                <p className={styles.signalLabel}>{card.label}</p>
                                <p className={styles.signalValue}>{card.value}</p>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Mode controls */}
                {showsOAuth ? (
                    <div className={styles.modeControls}>
                        <div className={styles.modeSlider} style={{ transform: activeMode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }} />
                        <button
                            type="button"
                            className={`${styles.modeTab} ${activeMode === 'login' ? styles.modeTabActive : ''}`}
                            onClick={() => navigateToMode('login')}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            className={`${styles.modeTab} ${activeMode === 'signup' ? styles.modeTabActive : ''}`}
                            onClick={() => navigateToMode('signup')}
                        >
                            Create account
                        </button>
                    </div>
                ) : (
                    <button type="button" className={styles.backButton} onClick={() => navigateToMode('login')}>
                        <FaArrowLeft />
                        Back to sign in
                    </button>
                )}

                {/* Form surface with transition */}
                <div className={`${styles.formSurface} ${modeTransition ? styles.formSurfaceTransition : ''}`}>
                    {renderSupportForm()}
                </div>

                {/* Footer */}
                <div className={styles.footerRow}>
                    {showsOAuth && (
                        <span className={styles.footerStatic}>
                            {activeMode === 'signup'
                                ? 'Provider chosen, onboarding next, Trust Shield immediately after.'
                                : 'Provider chosen, straight back into your trusted Focus identity and feed.'}
                        </span>
                    )}

                    {(activeMode === 'recovery' || activeMode === 'reset' || activeMode === 'verify') && (
                        <button type="button" className={styles.footerLink} onClick={() => navigateToMode('signup')}>
                            Need a new account instead?
                        </button>
                    )}
                </div>

                {/* Insight cards */}
                <div className={styles.auxiliaryGrid}>
                    {insightCards.map((card) => (
                        <article key={card.title} className={styles.auxiliaryCard}>
                            <div className={styles.auxiliaryHeader}>
                                <FaBolt className={styles.auxiliaryIcon} />
                                <h2 className={styles.auxiliaryTitle}>{card.title}</h2>
                            </div>
                            <p className={styles.auxiliaryText}>{card.text}</p>
                        </article>
                    ))}
                </div>

                {/* Legal note */}
                <div className={styles.legalNote}>
                    <FaShieldAlt className={styles.legalIcon} />
                    Focus uses secure authentication, refresh token rotation, and layered trust systems to protect your account and your community presence.
                </div>
            </section>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </AuthLayout>
    );
};

export default Auth;
