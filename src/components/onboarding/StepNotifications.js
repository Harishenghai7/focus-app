import React from 'react';
import styles from './StepNotifications.module.css';
import Button from '../shared/Button';
import { FaBell, FaHeart, FaComment, FaUserPlus, FaEnvelope } from 'react-icons/fa';

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
                <div className={styles.glowRing}>
                    <div className={styles.iconWrapper}>
                        <FaBell />
                    </div>
                </div>
                
                <h2 className={styles.title}>Stay updated with Focus</h2>
                <p className={styles.subtitle}>Don't miss a beat. We'll only send what matters.</p>

                <div className={styles.benefitsGrid}>
                    <div className={styles.benefitCard}>
                        <FaHeart className={styles.benefitIcon} style={{color: '#ec4899'}}/>
                        <span>Post Likes</span>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaComment className={styles.benefitIcon} style={{color: '#3b82f6'}}/>
                        <span>Comments</span>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaUserPlus className={styles.benefitIcon} style={{color: '#10b981'}}/>
                        <span>Followers</span>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaEnvelope className={styles.benefitIcon} style={{color: '#eab308'}}/>
                        <span>Messages</span>
                    </div>
                </div>

                <p className={styles.description}>
                    Enable notifications to instantly connect with your friends, community, and stay secure.
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
                <span>Step 6 of 6</span>
            </div>
        </div>
    );
};

export default StepNotifications;
