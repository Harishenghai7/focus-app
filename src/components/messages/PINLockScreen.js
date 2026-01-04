import React, { useState, useEffect } from 'react';
import { useLockedChats } from '../../hooks/useLockedChats';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import styles from './PINLockScreen.module.css';

const PINLockScreen = ({ chatId, onUnlock, onClose, mode = 'verify' }) => {
    const { user } = useAuth();
    const { masterPin, verifyPin, setPin } = useLockedChats(user?.id);
    const [pin, setPinValue] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState(mode === 'setup' ? 'create' : 'verify');

    const handleKeyPress = (num) => {
        if (step === 'create') {
            if (pin.length < 4) {
                setPinValue(pin + num);
            }
        } else if (step === 'confirm') {
            if (confirmPin.length < 4) {
                setConfirmPin(confirmPin + num);
            }
        } else {
            if (pin.length < 4) {
                setPinValue(pin + num);
            }
        }
    };

    const handleDelete = () => {
        if (step === 'confirm') {
            setConfirmPin(confirmPin.slice(0, -1));
        } else {
            setPinValue(pin.slice(0, -1));
        }
    };

    useEffect(() => {
        if (step === 'create' && pin.length === 4) {
            setStep('confirm');
        } else if (step === 'confirm' && confirmPin.length === 4) {
            if (pin === confirmPin) {
                handleSetPin();
            } else {
                setError('PINs do not match');
                setTimeout(() => {
                    setPinValue('');
                    setConfirmPin('');
                    setStep('create');
                    setError('');
                }, 1500);
            }
        } else if (step === 'verify' && pin.length === 4) {
            handleVerify();
        }
    }, [pin, confirmPin, step]);

    const handleSetPin = async () => {
        const success = await setPin(pin);
        if (success) {
            onUnlock?.();
        }
    };

    const handleVerify = () => {
        const isValid = verifyPin(pin);
        if (isValid) {
            onUnlock?.();
        } else {
            setError('Incorrect PIN');
            setTimeout(() => {
                setPinValue('');
                setError('');
            }, 1000);
        }
    };

    const renderDots = () => {
        const currentPin = step === 'confirm' ? confirmPin : pin;
        return (
            <div className={styles.dots}>
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`${styles.dot} ${i < currentPin.length ? styles.filled : ''} ${error ? styles.error : ''}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.screen}>
                <div className={styles.header}>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="28" fill="rgba(139, 92, 246, 0.2)" />
                        <path d="M32 24v8M28 36h8M32 44h.01" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <h2>
                        {step === 'create' && 'Create PIN'}
                        {step === 'confirm' && 'Confirm PIN'}
                        {step === 'verify' && 'Enter PIN'}
                    </h2>
                    <p>
                        {step === 'create' && 'Enter a 4-digit PIN'}
                        {step === 'confirm' && 'Re-enter your PIN'}
                        {step === 'verify' && 'Enter your PIN to unlock'}
                    </p>
                </div>

                {renderDots()}

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.keypad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            className={styles.key}
                            onClick={() => handleKeyPress(num.toString())}
                        >
                            {num}
                        </button>
                    ))}
                    <button className={styles.key} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button className={styles.key} onClick={() => handleKeyPress('0')}>
                        0
                    </button>
                    <button className={styles.key} onClick={handleDelete}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 7l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7M10 11v6M14 11v6M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PINLockScreen;
