import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaHeadset, 
    FaFileAlt, 
    FaShieldAlt, 
    FaGavel, 
    FaInfoCircle,
    FaExternalLinkAlt,
    FaChevronRight,
    FaEnvelope,
    FaBug,
    FaLightbulb,
    FaQuestion,
    FaHeart,
    FaCode,
    FaGithub,
    FaTwitter,
    FaGlobe,
    FaCertificate
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { focusToast } from '../../utils/focusToast';
import { triggerHaptic } from '../../utils/haptics';
import FeedbackModal from './FeedbackModal';
import sovereignStyles from './SovereignSettings.module.css';
import styles from './SovereignSupportSection.module.css';

/**
 * Province 5: Sovereign Support
 * 
 * Tickets, Legal, About h2 innovative
 */
const SovereignSupportSection = () => {
    const navigate = useNavigate();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [expandedLegal, setExpandedLegal] = useState(null);
    const appVersion = process.env.REACT_APP_VERSION || '2.0.0';
    const buildNumber = process.env.REACT_APP_BUILD_NUMBER || '2024.01';

    // Support options
    const supportOptions = [
        {
            id: 'ticket',
            icon: <FaHeadset />,
            title: 'Submit a Ticket',
            description: 'Get help from our support team',
            action: () => navigate('/support/new'),
            color: '#7E57C2'
        },
        {
            id: 'bug',
            icon: <FaBug />,
            title: 'Report a Bug',
            description: 'Help us fix issues quickly',
            action: () => {
                setShowFeedbackModal(true);
                triggerHaptic('light');
            },
            color: '#F44336'
        },
        {
            id: 'feature',
            icon: <FaLightbulb />,
            title: 'Feature Request',
            description: 'Suggest improvements',
            action: () => {
                setShowFeedbackModal(true);
                triggerHaptic('light');
            },
            color: '#FFC107'
        },
        {
            id: 'help',
            icon: <FaQuestion />,
            title: 'Help Center',
            description: 'Browse FAQs and guides',
            action: () => window.open('https://help.focusapp.com', '_blank'),
            color: '#2196F3'
        }
    ];

    // Legal documents
    const legalDocs = [
        {
            id: 'terms',
            icon: <FaFileAlt />,
            title: 'Terms of Service',
            description: 'The rules of the Nation',
            lastUpdated: 'January 2024'
        },
        {
            id: 'privacy',
            icon: <FaShieldAlt />,
            title: 'Privacy Policy',
            description: 'How we protect your data',
            lastUpdated: 'January 2024'
        },
        {
            id: 'conduct',
            icon: <FaGavel />,
            title: 'Code of Conduct',
            description: 'Community guidelines',
            lastUpdated: 'December 2023'
        },
        {
            id: 'cookies',
            icon: <FaInfoCircle />,
            title: 'Cookie Policy',
            description: 'How we use cookies',
            lastUpdated: 'January 2024'
        }
    ];

    // Social links
    const socialLinks = [
        { icon: <FaGlobe />, label: 'Website', url: 'https://h2innovative.com' },
        { icon: <FaTwitter />, label: 'Twitter', url: 'https://twitter.com/focusapp' },
        { icon: <FaGithub />, label: 'GitHub', url: 'https://github.com/focusapp' }
    ];

    // Handle legal doc click
    const handleLegalClick = useCallback((docId) => {
        if (expandedLegal === docId) {
            setExpandedLegal(null);
        } else {
            setExpandedLegal(docId);
            triggerHaptic('light');
        }
    }, [expandedLegal]);

    // Copy debug info
    const copyDebugInfo = useCallback(() => {
        const debugInfo = {
            version: appVersion,
            build: buildNumber,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
        };
        navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
        focusToast.success('Debug info copied to clipboard');
    }, [appVersion, buildNumber]);

    return (
        <div className={sovereignStyles.slideIn}>
            {/* Support Center */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaHeadset />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Sovereign Support</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            We're here to help you
                        </p>
                    </div>
                </div>

                <div className={styles.supportGrid}>
                    {supportOptions.map((option) => (
                        <button
                            key={option.id}
                            className={styles.supportCard}
                            onClick={option.action}
                        >
                            <div 
                                className={styles.supportIcon}
                                style={{ backgroundColor: `${option.color}20`, color: option.color }}
                            >
                                {option.icon}
                            </div>
                            <div className={styles.supportInfo}>
                                <h4 className={styles.supportTitle}>{option.title}</h4>
                                <p className={styles.supportDescription}>{option.description}</p>
                            </div>
                            <FaChevronRight className={styles.supportArrow} />
                        </button>
                    ))}
                </div>

                <div className={styles.supportContact}>
                    <p className={styles.contactText}>
                        Need immediate assistance?
                    </p>
                    <a 
                        href="mailto:support@focusapp.com" 
                        className={styles.contactLink}
                    >
                        <FaEnvelope />
                        support@focusapp.com
                    </a>
                </div>
            </div>

            {/* Legal Documents */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaGavel />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Legal & Governance</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            The laws of the Nation
                        </p>
                    </div>
                </div>

                <div className={styles.legalList}>
                    {legalDocs.map((doc) => (
                        <div key={doc.id} className={styles.legalItem}>
                            <button 
                                className={styles.legalButton}
                                onClick={() => handleLegalClick(doc.id)}
                            >
                                <div className={styles.legalIcon}>
                                    {doc.icon}
                                </div>
                                <div className={styles.legalInfo}>
                                    <h4 className={styles.legalTitle}>{doc.title}</h4>
                                    <p className={styles.legalDescription}>{doc.description}</p>
                                </div>
                                <FaChevronRight 
                                    className={`${styles.legalArrow} ${expandedLegal === doc.id ? styles.expanded : ''}`}
                                />
                            </button>
                            
                            <AnimatePresence>
                                {expandedLegal === doc.id && (
                                    <motion.div
                                        className={styles.legalContent}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className={styles.legalPreview}>
                                            <p className={styles.lastUpdated}>
                                                Last updated: {doc.lastUpdated}
                                            </p>
                                            <p className={styles.legalExcerpt}>
                                                This document outlines the {doc.title.toLowerCase()} for using Focus. 
                                                By using our services, you agree to these terms.
                                            </p>
                                            <button 
                                                className={styles.viewFullButton}
                                                onClick={() => navigate(`/legal/${doc.id}`)}
                                            >
                                                View Full Document
                                                <FaExternalLinkAlt />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* About h2 innovative */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaHeart />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>About h2 innovative</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Crafted with care in India
                        </p>
                    </div>
                </div>

                <div className={styles.aboutContent}>
                    <div className={styles.brandCard}>
                        <div className={styles.brandLogo}>
                            <span className={styles.logoText}>h2</span>
                            <span className={styles.logoSubtext}>innovative</span>
                        </div>
                        <p className={styles.brandTagline}>
                            "Meet the real people; not the fake profiles"
                        </p>
                        <p className={styles.brandDescription}>
                            Focus is built by h2 innovative, a technology company dedicated to 
                            creating authentic digital experiences. We believe in privacy, 
                            security, and real human connections.
                        </p>
                    </div>

                    <div className={styles.socialLinks}>
                        {socialLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </a>
                        ))}
                    </div>

                    <div className={styles.certifications}>
                        <div className={styles.certBadge}>
                            <FaCertificate />
                            <span>ISO 27001 Certified</span>
                        </div>
                        <div className={styles.certBadge}>
                            <FaShieldAlt />
                            <span>SOC 2 Type II</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Info */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaCode />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Application Info</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Version and build details
                        </p>
                    </div>
                </div>

                <div className={styles.appInfo}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Version</span>
                        <span className={styles.infoValue}>{appVersion}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Build</span>
                        <span className={styles.infoValue}>{buildNumber}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Platform</span>
                        <span className={styles.infoValue}>Web</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Environment</span>
                        <span className={styles.infoValue}>{process.env.NODE_ENV || 'production'}</span>
                    </div>
                </div>

                <button 
                    className={`${sovereignStyles.biometricButton} ${sovereignStyles.secondary}`}
                    onClick={copyDebugInfo}
                >
                    <FaCode />
                    Copy Debug Information
                </button>
            </div>

            {/* Credits */}
            <div className={styles.credits}>
                <p className={styles.creditsText}>
                    Made with <FaHeart className={styles.heartIcon} /> in India
                </p>
                <p className={styles.copyright}>
                    © {new Date().getFullYear()} h2 innovative. All rights reserved.
                </p>
            </div>

            {/* Feedback Modal */}
            <FeedbackModal 
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
            />
        </div>
    );
};

export default SovereignSupportSection;
