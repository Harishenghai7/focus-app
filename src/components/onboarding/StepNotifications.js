import React from 'react';
import styles from './StepNotifications.module.css';
import Button from '../shared/Button';
import { FaBell } from 'react-icons/fa';

const StepNotifications = ({ formData, updateFormData, onNext, onBack, isSubmitting }) => {
    const handleEnable = () => {
        updateFormData('notificationsEnabled', true);
        onNext();
    };

    const handleSkip = () => {
        updateFormData('notificationsEnabled', false);
        onNext();
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <FaBell />
                </div>
                <h2 className={styles.title}>Stay updated with Focus! 🔔</h2>
                <p className={styles.subtitle}>Get notified when:</p>

                <ul className={styles.benefitsList}>
                    <li>✓ Someone likes your post</li>
                    <li>✓ Someone comments on your content</li>
                    <li>✓ Someone follows you</li>
                    <li>✓ You get a new message</li>
                </ul>

                <p className={styles.description}>
                    We'll send you notifications to keep you connected
                    with your friends and community.
                </p>
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                    Maybe Later
                </Button>
                <Button
                    variant="primary"
                    onClick={handleEnable}
                    isLoading={isSubmitting}
                >
                    Enable Notifications
                </Button>
            </div>

            <div className={styles.progressInfo}>
                <span>Step 4 of 4</span>
            </div>
        </div>
    );
};

export default StepNotifications;
