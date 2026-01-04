import React, { useState, useEffect } from 'react';
import { FaFingerprint, FaLock } from 'react-icons/fa';

const BiometricLock = ({ children }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if biometric lock is enabled in localStorage
        const lockEnabled = localStorage.getItem('biometric_lock_enabled') === 'true';
        if (lockEnabled) {
            setIsLocked(true);
            // Auto-prompt on load
            handleUnlock();
        }
    }, []);

    const handleUnlock = async () => {
        setLoading(true);
        setError(null);

        try {
            // Check if WebAuthn is supported
            if (!window.PublicKeyCredential) {
                throw new Error('Biometric authentication not supported on this device.');
            }

            // Challenge for authentication (in a real app, this comes from the server)
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: 'required',
                },
            });

            if (credential) {
                setIsLocked(false);
            }
        } catch (err) {
            console.error('Unlock failed:', err);
            setError('Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isLocked) {
        return children;
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                <div style={styles.iconWrapper}>
                    <FaLock size={40} color="#4f46e5" />
                </div>
                <h2 style={styles.title}>App Locked</h2>
                <p style={styles.subtitle}>Authentication required to access Focus</p>

                {error && <p style={styles.error}>{error}</p>}

                <button
                    onClick={handleUnlock}
                    disabled={loading}
                    style={styles.button}
                >
                    {loading ? 'Verifying...' : (
                        <>
                            <FaFingerprint size={20} />
                            Unlock with FaceID / TouchID
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    container: {
        background: 'white',
        padding: '40px',
        borderRadius: '24px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    iconWrapper: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#e0e7ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '8px',
    },
    subtitle: {
        color: '#64748b',
        marginBottom: '32px',
    },
    error: {
        color: '#ef4444',
        marginBottom: '16px',
        fontSize: '14px',
    },
    button: {
        width: '100%',
        padding: '16px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'background 0.2s',
    },
};

export default BiometricLock;
