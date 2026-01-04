import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsSection from './SettingsSection';
import Button from '../ui/Button';
import FeedbackModal from './FeedbackModal';
import styles from './SupportSection.module.css';

const SupportSection = ({ isExpanded, onToggle }) => {
    const navigate = useNavigate();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <>
            <SettingsSection
                id="support"
                title="Support"
                description="Get help and learn more about Focus"
                icon={icon}
                isExpanded={isExpanded}
                onToggle={onToggle}
            >
                {/* My Reports */}
                <div className={styles.supportItem}>
                    <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>📋</div>
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>My Reports</h3>
                            <p className={styles.itemDescription}>View your submitted content reports</p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/my-reports')}
                    >
                        View
                    </Button>
                </div>

                {/* Support Center */}
                <div className={styles.supportItem}>
                    <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>📚</div>
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>Support Center</h3>
                            <p className={styles.itemDescription}>Browse FAQs and get help</p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/support')}
                    >
                        Visit
                    </Button>
                </div>

                {/* Contact Support */}
                <div className={styles.supportItem}>
                    <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>🎫</div>
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>Contact Support</h3>
                            <p className={styles.itemDescription}>Create a support ticket</p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/support/new')}
                    >
                        Contact
                    </Button>
                </div>

                <div className={styles.divider} />

                {/* Submit Feedback (existing) */}
                <div className={styles.supportItem}>
                    <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>💬</div>
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>Submit Feedback</h3>
                            <p className={styles.itemDescription}>Share your thoughts or report a bug</p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowFeedbackModal(true)}
                    >
                        Send
                    </Button>
                </div>

                <div className={styles.divider} />

                {/* Terms of Service */}
                <div className={styles.supportItem}>
                    <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>📄</div>
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>Terms of Service</h3>
                            <p className={styles.itemDescription}>Read our terms and conditions</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTerms(true)}
                    >
                        View
                    </Button>
                </div>

                {/* Privacy Policy */}
                <div className={styles.supportItem}>
                    <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>🔒</div>
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>Privacy Policy</h3>
                            <p className={styles.itemDescription}>Learn how we protect your data</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPrivacy(true)}
                    >
                        View
                    </Button>
                </div>
            </SettingsSection>

            <FeedbackModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
            />
        </>
    );
};

export default SupportSection;
