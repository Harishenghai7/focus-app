import React, { useState, useEffect } from 'react';
import styles from './DeviceTrustBadge.module.css';

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { browser, os };
};

const DeviceTrustBadge = () => {
    const [device, setDevice] = useState({ browser: '', os: '' });
    const [trustLevel, setTrustLevel] = useState('checking');

    useEffect(() => {
        const info = getDeviceInfo();
        setDevice(info);

        // Check if device fingerprint exists in localStorage (recognized device)
        const knownDevice = localStorage.getItem('focus_device_recognized');
        const timer = setTimeout(() => {
            setTrustLevel(knownDevice ? 'recognized' : 'new');
            if (!knownDevice) {
                localStorage.setItem('focus_device_recognized', Date.now().toString());
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    const isRecognized = trustLevel === 'recognized';
    const isChecking = trustLevel === 'checking';

    return (
        <div className={`${styles.badge} ${isChecking ? styles.checking : ''}`}>
            <div className={`${styles.indicator} ${isRecognized ? styles.recognized : styles.newDevice}`}>
                {isChecking ? (
                    <div className={styles.spinner} />
                ) : (
                    <svg viewBox="0 0 16 16" fill="none" className={styles.deviceIcon}>
                        {isRecognized ? (
                            <path
                                d="M2 3.5h12a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1v-6a1 1 0 011-1zM5 13.5h6M8 11.5v2"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ) : (
                            <>
                                <path
                                    d="M2 3.5h12a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1v-6a1 1 0 011-1zM5 13.5h6M8 11.5v2"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <circle cx="12" cy="4" r="2.5" fill="#F59E0B" stroke="#0f0a1e" strokeWidth="1" />
                            </>
                        )}
                    </svg>
                )}
            </div>
            <div className={styles.info}>
                <span className={styles.deviceName}>
                    {device.browser} · {device.os}
                </span>
                <span className={`${styles.trustStatus} ${isRecognized ? styles.trustedText : styles.newText}`}>
                    {isChecking ? 'Verifying device...' : isRecognized ? 'Recognized device' : 'New device'}
                </span>
            </div>
        </div>
    );
};

export default DeviceTrustBadge;
