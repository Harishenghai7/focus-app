// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ CONTENT INTEGRITY MODAL - H2 Glassmorphism Warning System
// ═══════════════════════════════════════════════════════════════════════════════
// Layer 3: Ruthless User Feedback & Enforcement
// H2 Theme: 20px glass blur, satin borders, pulsing status indicators
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, 
    ShieldCheck, 
    ShieldX, 
    AlertTriangle, 
    Eye, 
    MessageSquare, 
    X,
    Info,
    Sparkles,
    Lock,
    RefreshCw
} from 'lucide-react';
import styles from './ContentIntegrityModal.module.css';

/**
 * ContentIntegrityModal - H2-themed moderation warning card
 * 
 * Displays:
 * - Violation warnings (red, critical)
 * - Quality issues (yellow, warnings)
 * - Success states (green, approved)
 * - Scanning progress (pulsing animation)
 */
const ContentIntegrityModal = ({
    isOpen,
    onClose,
    onRetry,
    onContinue,
    scanResult,
    scanProgress = 0,
    scanStage = '',
    isScanning = false,
    contentType = 'post' // 'post', 'boltz', 'flash', 'comment'
}) => {
    const [showDetails, setShowDetails] = useState(false);

    // Auto-show details if violations exist
    useEffect(() => {
        if (scanResult?.violations?.length > 0) {
            setShowDetails(true);
        }
    }, [scanResult]);

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isScanning) {
            onClose();
        }
    };

    // Get violation icon
    const getViolationIcon = (type) => {
        switch (type) {
            case 'NUDITY_PORN':
            case 'NUDITY_HENTAI':
                return <Eye className={styles.violationIcon} />;
            case 'VIOLENCE':
            case 'GORE':
                return <ShieldX className={styles.violationIcon} />;
            case 'THREAT':
                return <ShieldAlert className={styles.violationIcon} />;
            case 'TOXICITY':
            case 'INSULT':
            case 'IDENTITY_ATTACK':
                return <MessageSquare className={styles.violationIcon} />;
            default:
                return <AlertTriangle className={styles.violationIcon} />;
        }
    };

    // Get violation message
    const getViolationMessage = (violation) => {
        const messages = {
            NUDITY_PORN: 'Explicit adult content detected',
            NUDITY_HENTAI: 'Animated/mature content detected',
            VIOLENCE: 'Violent or graphic content detected',
            THREAT: 'Threatening language detected',
            TOXICITY: 'Toxic or harmful language detected',
            INSULT: 'Insulting content detected',
            IDENTITY_ATTACK: 'Hate speech or discrimination detected',
            SUGGESTIVE: 'Suggestive content detected',
            QUALITY_ISSUES: 'Content quality below standard',
            TOO_BLURRY: 'Image too blurry or unclear',
            TOO_DARK: 'Image too dark or underexposed',
            MISINFORMATION_RISK: 'Potential misinformation detected',
        };
        return messages[violation.type] || violation.type.replace(/_/g, ' ');
    };

    // Get modal type based on result
    const getModalType = () => {
        if (isScanning) return 'scanning';
        if (!scanResult) return 'idle';
        if (scanResult.blocked) return 'blocked';
        if (scanResult.violations?.length > 0) return 'warning';
        if (scanResult.warnings?.length > 0) return 'caution';
        return 'approved';
    };

    const modalType = getModalType();

    // Modal configuration based on type
    const modalConfig = {
        scanning: {
            icon: <RefreshCw className={`${styles.statusIcon} ${styles.spinning}`} />,
            title: 'Analyzing Content Integrity',
            subtitle: 'AI guardians are scanning your content...',
            color: 'blue',
            actions: ['cancel']
        },
        blocked: {
            icon: <ShieldX className={styles.statusIcon} />,
            title: 'Content Blocked',
            subtitle: 'This content violates Focus Community Standards',
            color: 'red',
            actions: ['retry', 'close']
        },
        warning: {
            icon: <ShieldAlert className={styles.statusIcon} />,
            title: 'Content Warning',
            subtitle: 'Issues detected that may limit visibility',
            color: 'orange',
            actions: ['continue', 'retry', 'close']
        },
        caution: {
            icon: <AlertTriangle className={styles.statusIcon} />,
            title: 'Quality Notice',
            subtitle: 'Your content has some quality issues',
            color: 'yellow',
            actions: ['continue', 'retry', 'close']
        },
        approved: {
            icon: <ShieldCheck className={styles.statusIcon} />,
            title: 'Content Approved',
            subtitle: 'Your content meets Focus quality standards',
            color: 'green',
            actions: ['continue', 'close']
        },
        idle: {
            icon: <Info className={styles.statusIcon} />,
            title: 'Content Moderation',
            subtitle: 'Ready to scan your content',
            color: 'gray',
            actions: ['close']
        }
    };

    const config = modalConfig[modalType];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.backdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        className={`${styles.modal} ${styles[`color${config.color}`]}`}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Satin border effect */}
                        <div className={styles.satinBorder} />
                        
                        {/* Glass blur background */}
                        <div className={styles.glassBackground} />

                        {/* Header */}
                        <div className={styles.header}>
                            <div className={`${styles.iconContainer} ${styles[`pulse${config.color}`]}`}>
                                {config.icon}
                            </div>
                            
                            <div className={styles.headerText}>
                                <h2 className={styles.title}>{config.title}</h2>
                                <p className={styles.subtitle}>{config.subtitle}</p>
                            </div>

                            {!isScanning && (
                                <button 
                                    className={styles.closeButton}
                                    onClick={onClose}
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Progress bar for scanning */}
                        {isScanning && (
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <motion.div
                                        className={styles.progressFill}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <div className={styles.progressInfo}>
                                    <span className={styles.progressText}>{scanStage}</span>
                                    <span className={styles.progressPercent}>{Math.round(scanProgress)}%</span>
                                </div>
                                
                                {/* Pulsing animation */}
                                <div className={styles.pulseContainer}>
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className={styles.pulseDot}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ 
                                                scale: [0, 1, 0], 
                                                opacity: [0, 1, 0] 
                                            }}
                                            transition={{ 
                                                duration: 1.5, 
                                                repeat: Infinity,
                                                delay: i * 0.3
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content Rating Badge */}
                        {!isScanning && scanResult && (
                            <div className={styles.ratingContainer}>
                                <div className={`${styles.ratingBadge} ${styles[`badge${config.color}`]}`}>
                                    <Sparkles size={14} />
                                    <span>Safety Score: {Math.round((scanResult.contentRating || 0) * 100)}%</span>
                                </div>
                            </div>
                        )}

                        {/* Violations List */}
                        {!isScanning && scanResult?.violations?.length > 0 && (
                            <div className={styles.violationsSection}>
                                <button
                                    className={styles.toggleDetails}
                                    onClick={() => setShowDetails(!showDetails)}
                                >
                                    <span>Detected Issues ({scanResult.violations.length})</span>
                                    <motion.span
                                        animate={{ rotate: showDetails ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        ▼
                                    </motion.span>
                                </button>

                                <AnimatePresence>
                                    {showDetails && (
                                        <motion.div
                                            className={styles.violationsList}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {scanResult.violations.map((violation, index) => (
                                                <motion.div
                                                    key={index}
                                                    className={`${styles.violationItem} ${styles[`severity${violation.severity || 'high'}`]}`}
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    {getViolationIcon(violation.type)}
                                                    <div className={styles.violationInfo}>
                                                        <span className={styles.violationType}>
                                                            {getViolationMessage(violation)}
                                                        </span>
                                                        <span className={styles.violationScore}>
                                                            Confidence: {Math.round((violation.score || 0) * 100)}%
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Quality Warnings */}
                        {!isScanning && scanResult?.warnings?.length > 0 && (
                            <div className={styles.warningsSection}>
                                <div className={styles.warningsHeader}>
                                    <Info size={16} />
                                    <span>Quality Suggestions</span>
                                </div>
                                <ul className={styles.warningsList}>
                                    {scanResult.warnings.map((warning, index) => (
                                        <li key={index} className={styles.warningItem}>
                                            {warning.type === 'QUALITY_ISSUES' 
                                                ? `Issues: ${warning.issues?.join(', ')}`
                                                : warning.message || warning.type
                                            }
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Community Standards Message */}
                        {(modalType === 'blocked' || modalType === 'warning') && (
                            <div className={styles.standardsMessage}>
                                <Lock size={16} />
                                <p>
                                    Focus is for growth, not toxicity. Repeated violations may 
                                    result in posting restrictions.
                                </p>
                            </div>
                        )}

                        {/* Success Message */}
                        {modalType === 'approved' && (
                            <div className={styles.successMessage}>
                                <Sparkles size={16} />
                                <p>
                                    Your content is ready to share! It will contribute to a 
                                    positive, purpose-driven community.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className={styles.actions}>
                            {config.actions.includes('cancel') && (
                                <button
                                    className={`${styles.button} ${styles.secondary}`}
                                    onClick={onClose}
                                    disabled={!isScanning}
                                >
                                    Cancel
                                </button>
                            )}
                            
                            {config.actions.includes('retry') && (
                                <button
                                    className={`${styles.button} ${styles.secondary}`}
                                    onClick={onRetry}
                                >
                                    <RefreshCw size={16} />
                                    Try Different Content
                                </button>
                            )}
                            
                            {config.actions.includes('continue') && modalType !== 'blocked' && (
                                <button
                                    className={`${styles.button} ${styles.primary} ${styles[`button${config.color}`]}`}
                                    onClick={onContinue}
                                >
                                    {modalType === 'approved' ? 'Continue to Upload' : 'Upload Anyway'}
                                </button>
                            )}
                            
                            {config.actions.includes('close') && (
                                <button
                                    className={`${styles.button} ${styles.ghost}`}
                                    onClick={onClose}
                                >
                                    {modalType === 'blocked' ? 'Close' : 'Go Back'}
                                </button>
                            )}
                        </div>

                        {/* Safety Footer */}
                        <div className={styles.footer}>
                            <div className={styles.safetyBadge}>
                                <ShieldCheck size={12} />
                                <span>Protected by Focus AI</span>
                            </div>
                            {!isScanning && scanResult?.safetyHash && (
                                <span className={styles.safetyHash}>
                                    Hash: {scanResult.safetyHash.substring(0, 8)}...
                                </span>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContentIntegrityModal;
