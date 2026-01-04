import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaUser, FaGoogle, FaFingerprint, FaMicrosoft, FaDiscord, FaGithub, FaTwitter } from 'react-icons/fa';
import VerificationStep from '../components/trustShield/VerificationStep';
import { useVerifications } from '../hooks/useVerifications';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import styles from './VerificationCenter.module.css';

const VerificationCenter = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { verifications, verifyStep, loading } = useVerifications();
    const [showOAuthOptions, setShowOAuthOptions] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [authLoading, user, navigate]);

    if (authLoading) return <div className={styles.loading}>Loading...</div>;
    if (!user) return null;

    const handleEmailVerify = async () => {
        if (verifications.email) return;

        const confirmed = window.confirm(`Send verification email to ${user?.email}?`);
        if (!confirmed) return;

        const result = await verifyStep('email');
        if (result?.success) toast.success(result.message);
        else if (result?.error) toast.error(result.error);
    };

    const handleProfileVerify = () => {
        navigate('/settings', { state: { section: 'profile' } });
    };

    const handleOAuthVerify = () => {
        setShowOAuthOptions(!showOAuthOptions);
    };

    const handleProviderLink = async (provider) => {
        const result = await verifyStep('oauth', { provider });
        if (result?.error) toast.error(result.error);
    };

    const handleBiometricVerify = async () => {
        const result = await verifyStep('biometric');
        if (result?.success) toast.success(result.message);
        else if (result?.error) toast.error(result.error);
    };

    const steps = [
        {
            id: 'email',
            title: 'Email Verification',
            description: `Verify your email address (${user?.email}) to secure your account.`,
            icon: FaEnvelope,
            points: 20,
            status: verifications.email ? 'completed' : 'pending',
            action: handleEmailVerify
        },
        {
            id: 'profile',
            title: 'Complete Profile',
            description: 'Add a profile picture, name, and bio.',
            icon: FaUser,
            points: 10,
            status: verifications.profile ? 'completed' : 'pending',
            action: handleProfileVerify
        },
        {
            id: 'government-id',
            title: 'Government ID Verification',
            description: 'Verify your identity with DigiLocker and face recognition',
            icon: FaFingerprint,
            points: 50,
            badge: 'Verified Human',
            status: user?.digilocker_verified && user?.face_verified ? 'completed' : 'pending',
            action: () => navigate('/verification/government-id')
        },
        {
            id: 'oauth',
            title: 'Link Social Accounts',
            description: 'Connect Google, Microsoft, Discord, GitHub, or Twitter.',
            icon: FaGoogle,
            points: 15,
            status: verifications.oauth ? 'completed' : 'pending',
            action: handleOAuthVerify
        },
        {
            id: 'biometric',
            title: 'Biometric Lock',
            description: 'Protect the app with FaceID or TouchID.',
            icon: FaFingerprint,
            points: 10,
            status: verifications.biometric ? 'completed' : 'pending',
            action: handleBiometricVerify
        }
    ];


    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Verification Center</h1>
                <p className={styles.subtitle}>Complete these steps to increase your Trust Score</p>
            </div>

            <div className={styles.list}>
                {steps.map(step => (
                    <div key={step.id}>
                        <VerificationStep
                            step={step}
                            loading={loading[step.id]}
                        />

                        {/* OAuth Options Expansion */}
                        {step.id === 'oauth' && showOAuthOptions && !verifications.oauth && (
                            <div className={styles.oauthGrid}>
                                <button className={styles.oauthBtn} onClick={() => handleProviderLink('google')}>
                                    <FaGoogle color="#DB4437" /> Google
                                </button>
                                <button className={styles.oauthBtn} onClick={() => handleProviderLink('azure')}>
                                    <FaMicrosoft color="#00A4EF" /> Microsoft
                                </button>
                                <button className={styles.oauthBtn} onClick={() => handleProviderLink('discord')}>
                                    <FaDiscord color="#5865F2" /> Discord
                                </button>
                                <button className={styles.oauthBtn} onClick={() => handleProviderLink('github')}>
                                    <FaGithub color="#181717" /> GitHub
                                </button>
                                <button className={styles.oauthBtn} onClick={() => handleProviderLink('twitter')}>
                                    <FaTwitter color="#1DA1F2" /> Twitter
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VerificationCenter;
