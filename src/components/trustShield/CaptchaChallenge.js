import React, { useRef, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTrustScore } from '../../hooks/useTrustScore';

const CaptchaChallenge = ({ onVerify, action = 'generic' }) => {
    const captchaRef = useRef(null);
    // In a real app, we would pass the user object here
    const { score } = useTrustScore(null);

    // Smart Triggering Logic
    // If score is high (>60), we might skip CAPTCHA or make it invisible
    // If score is low (<30), we force a challenge

    const shouldShowCaptcha = score < 60;

    const handleVerification = useCallback((token) => {
        if (onVerify) {
            onVerify(token);
        }
    }, [onVerify]);

    if (!shouldShowCaptcha) {
        // Auto-verify or skip for trusted users
        // In a real flow, the backend would also check the trust score
        return null;
    }

    return (
        <div style={styles.container}>
            <p style={styles.label}>Security Check Required</p>
            <HCaptcha
                sitekey="10000000-ffff-ffff-ffff-000000000001" // Test sitekey
                onVerify={handleVerification}
                ref={captchaRef}
            />
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    label: {
        fontSize: '14px',
        color: '#64748b',
        fontWeight: '500'
    }
};

export default CaptchaChallenge;
