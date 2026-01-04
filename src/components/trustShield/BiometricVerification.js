import React, { useState } from 'react';
import { FaFingerprint, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

const BiometricVerification = ({ onComplete }) => {
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    const handleVerify = async () => {
        setVerifying(true);

        // Simulate WebAuthn / Biometric API call
        // In a real app, we'd use navigator.credentials.create()

        setTimeout(async () => {
            try {
                // Mock success
                const { error } = await supabase.auth.updateUser({
                    data: { biometric_enabled: true }
                });

                if (!error) {
                    setVerified(true);
                    if (onComplete) onComplete();
                }
            } catch (err) {
                console.error(err);
            } finally {
                setVerifying(false);
            }
        }, 2000);
    };

    if (verified) {
        return (
            <div style={styles.container}>
                <FaCheckCircle size={48} color="#22c55e" />
                <h3 style={styles.title}>Biometrics Verified</h3>
                <p style={styles.text}>Your device is secured with biometrics.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.iconWrapper}>
                <FaFingerprint size={32} color="#4f46e5" />
            </div>
            <h3 style={styles.title}>Biometric Verification</h3>
            <p style={styles.text}>
                Use FaceID or TouchID to verify your identity and boost your trust score.
            </p>
            <button
                onClick={handleVerify}
                disabled={verifying}
                style={styles.button}
            >
                {verifying ? 'Verifying...' : 'Start Verification'}
            </button>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        margin: '0 auto'
    },
    iconWrapper: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#e0e7ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    title: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '8px'
    },
    text: {
        color: '#64748b',
        marginBottom: '24px',
        lineHeight: '1.5'
    },
    button: {
        padding: '12px 32px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    }
};

export default BiometricVerification;
