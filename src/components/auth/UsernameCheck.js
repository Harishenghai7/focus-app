import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './UsernameCheck.module.css';

const UsernameCheck = ({ value, onChange, onValidityChange }) => {
    const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid
    const [message, setMessage] = useState('');

    const checkUsername = useCallback(async (username) => {
        if (!username || username.length < 3) {
            setStatus(username.length > 0 ? 'invalid' : 'idle');
            setMessage(username.length > 0 ? 'Must be at least 3 characters' : '');
            onValidityChange?.(false);
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setStatus('invalid');
            setMessage('Only letters, numbers, and underscores');
            onValidityChange?.(false);
            return;
        }

        if (username.length > 30) {
            setStatus('invalid');
            setMessage('Maximum 30 characters');
            onValidityChange?.(false);
            return;
        }

        setStatus('checking');
        setMessage('Checking availability...');

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', username)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setStatus('taken');
                setMessage('Username is taken');
                onValidityChange?.(false);
            } else {
                setStatus('available');
                setMessage('Available');
                onValidityChange?.(true);
            }
        } catch (err) {
            setStatus('idle');
            setMessage('');
            onValidityChange?.(true);
        }
    }, [onValidityChange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkUsername(value);
        }, 500);
        return () => clearTimeout(timer);
    }, [value, checkUsername]);

    const statusIcon = () => {
        switch (status) {
            case 'checking':
                return <span className={styles.spinnerIcon} />;
            case 'available':
                return (
                    <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="none">
                        <path d="M5 10l3.5 3.5L15 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'taken':
            case 'invalid':
                return (
                    <svg className={styles.crossIcon} viewBox="0 0 20 20" fill="none">
                        <path d="M6 6l8 8M14 6l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.inputContainer} ${styles[status]}`}>
                <span className={styles.atSign}>@</span>
                <input
                    type="text"
                    name="username"
                    className={styles.input}
                    placeholder="Choose your username"
                    value={value || ''}
                    onChange={onChange}
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={30}
                />
                <span className={styles.statusIcon}>
                    {statusIcon()}
                </span>
            </div>
            {message && (
                <span className={`${styles.message} ${styles[`message_${status}`]}`}>
                    {message}
                </span>
            )}
        </div>
    );
};

export default UsernameCheck;
