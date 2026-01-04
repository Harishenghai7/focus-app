import React, { useState, useEffect } from 'react';
import Input from '../shared/Input';
import { checkUsernameAvailability } from '../../utils/checkUsername';
import styles from './UsernameCheck.module.css';
import { FaUser, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const UsernameCheck = ({ value, onChange, onValidityChange }) => {
    const [status, setStatus] = useState('idle'); // idle, checking, available, taken

    useEffect(() => {
        const check = async () => {
            if (!value || value.length < 3) {
                setStatus('idle');
                onValidityChange(false);
                return;
            }

            setStatus('checking');
            const isAvailable = await checkUsernameAvailability(value);

            setStatus(isAvailable ? 'available' : 'taken');
            onValidityChange(isAvailable);
        };

        const timeoutId = setTimeout(check, 500); // Debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [value, onValidityChange]);

    const getIcon = () => {
        switch (status) {
            case 'checking': return <FaSpinner className={styles.spinner} />;
            case 'available': return <FaCheck className={styles.available} />;
            case 'taken': return <FaTimes className={styles.taken} />;
            default: return null;
        }
    };

    return (
        <div className={styles.wrapper}>
            <Input
                name="username"
                placeholder="Username"
                value={value}
                onChange={onChange}
                icon={<FaUser />}
                rightElement={getIcon()}
                error={status === 'taken' ? 'Username is already taken' : null}
            />
        </div>
    );
};

export default UsernameCheck;
