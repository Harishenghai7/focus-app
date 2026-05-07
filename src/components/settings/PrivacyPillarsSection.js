import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaChild, 
    FaFilter, 
    FaUserSlash, 
    FaEye, 
    FaClock, 
    FaExclamationCircle,
    FaUserCheck,
    FaLink,
    FaUnlink
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeenCare } from '../../context/TeenCareContext';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import { triggerHaptic } from '../../utils/haptics';
import BlockedUsers from './BlockedUsers';
import sovereignStyles from './SovereignSettings.module.css';
import styles from './PrivacyPillarsSection.module.css';

/**
 * Province 2: Privacy & Pillars
 * 
 * Teen Care controls, Content Filter intensity, Blocked Users
 */
const PrivacyPillarsSection = ({ 
    settings, 
    onUpdateSetting 
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        isGuardian,
        isTeen,
        isCoppaMode,
        userAge,
        linkedTeens,
        myGuardians,
        safetySettings,
        generateInvitationCode,
        removeGuardian,
        updateSafetySettings,
        loading: teenCareLoading
    } = useTeenCare();

    const [contentFilterLevel, setContentFilterLevel] = useState(
        settings?.content_filter_level || 'balanced'
    );
    const [showingInvitationCode, setShowingInvitationCode] = useState(false);
    const [invitationCode, setInvitationCode] = useState(null);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    // Content filter levels
    const filterLevels = [
        { 
            value: 'relaxed', 
            label: 'Relaxed', 
            description: 'Minimal filtering',
            icon: '😌'
        },
        { 
            value: 'balanced', 
            label: 'Balanced', 
            description: 'Standard protection',
            icon: '⚖️'
        },
        { 
            value: 'strict', 
            label: 'Ruthless', 
            description: 'Maximum security',
            icon: '🛡️'
        }
    ];

    // Handle content filter change
    const handleFilterChange = useCallback((level) => {
        setContentFilterLevel(level);
        onUpdateSetting?.('content_filter_level', level);
        triggerHaptic('light');
        
        const levelNames = { relaxed: 'Relaxed', balanced: 'Balanced', strict: 'Ruthless' };
        focusToast.success(`Content filter set to ${levelNames[level]}`);
    }, [onUpdateSetting]);

    // Generate guardian invitation code
    const handleGenerateCode = useCallback(async () => {
        setIsGeneratingCode(true);
        try {
            const result = await generateInvitationCode();
            setInvitationCode(result);
            setShowingInvitationCode(true);
            triggerHaptic('success');
        } catch (err) {
            focusToast.error('Failed to generate code');
        } finally {
            setIsGeneratingCode(false);
        }
    }, [generateInvitationCode]);

    // Copy invitation code
    const copyCode = useCallback(() => {
        if (invitationCode?.code) {
            navigator.clipboard.writeText(invitationCode.code);
            focusToast.success('Code copied to clipboard');
        }
    }, [invitationCode]);

    // Remove guardian
    const handleRemoveGuardian = useCallback(async (guardianId) => {
        try {
            await removeGuardian(guardianId);
            focusToast.success('Guardian removed');
        } catch (err) {
            focusToast.error('Failed to remove guardian');
        }
    }, [removeGuardian]);

    // Update teen safety setting
    const handleSafetyToggle = useCallback(async (key, value) => {
        try {
            await updateSafetySettings({ [key]: value });
            focusToast.success('Safety setting updated');
        } catch (err) {
            focusToast.error('Failed to update setting');
        }
    }, [updateSafetySettings]);

    return (
        <div className={sovereignStyles.slideIn}>
            {/* Teen Care Section */}
            {(isTeen || isGuardian) && (
                <div className={sovereignStyles.glassTile}>
                    <div className={sovereignStyles.glassTileHeader}>
                        <div className={sovereignStyles.glassTileIcon}>
                            <FaChild />
                        </div>
                        <div>
                            <h3 className={sovereignStyles.glassTileTitle}>Teen Care</h3>
                            <p className={sovereignStyles.glassTileDescription}>
                                Guardian protection & safety controls
                            </p>
                        </div>
                    </div>

                    {/* Teen View */}
                    {isTeen && (
                        <div className={styles.teenSection}>
                            {/* Age Display */}
                            <div className={styles.ageBadge}>
                                <FaChild />
                                <span>Age: {userAge} years</span>
                                {isCoppaMode && (
                                    <span className={styles.coppaBadge}>COPPA Protected</span>
                                )}
                            </div>

                            {/* My Guardians */}
                            <div className={styles.guardianSection}>
                                <h4 className={styles.sectionSubheader}>My Guardians</h4>
                                {myGuardians.length > 0 ? (
                                    <div className={styles.guardianList}>
                                        {myGuardians.map((guardian) => (
                                            <div key={guardian.id} className={styles.guardianCard}>
                                                <div className={styles.guardianAvatar}>
                                                    {guardian.avatar_url ? (
                                                        <img src={guardian.avatar_url} alt={guardian.username} />
                                                    ) : (
                                                        <span>{guardian.username[0].toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className={styles.guardianInfo}>
                                                    <p className={styles.guardianName}>@{guardian.username}</p>
                                                </div>
                                                <button 
                                                    className={styles.unlinkButton}
                                                    onClick={() => handleRemoveGuardian(guardian.id)}
                                                >
                                                    <FaUnlink />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <FaUserCheck />
                                        <p>No guardians linked yet</p>
                                    </div>
                                )}

                                {/* Generate Invitation Code */}
                                <button 
                                    className={sovereignStyles.biometricButton}
                                    onClick={handleGenerateCode}
                                    disabled={isGeneratingCode}
                                >
                                    <FaLink />
                                    {isGeneratingCode ? 'Generating...' : 'Generate Guardian Code'}
                                </button>
                            </div>

                            {/* Safety Settings for Teens */}
                            <div className={styles.safetyToggles}>
                                <div className={sovereignStyles.settingRow}>
                                    <div className={sovereignStyles.settingInfo}>
                                        <p className={sovereignStyles.settingLabel}>
                                            <FaClock className={sovereignStyles.satinIcon} />
                                            Screen Time Limits
                                        </p>
                                        <p className={sovereignStyles.settingDescription}>
                                            Receive alerts when daily limits are reached
                                        </p>
                                    </div>
                                    <div className={sovereignStyles.settingControl}>
                                        <div 
                                            className={`${sovereignStyles.toggleSwitch} ${
                                                safetySettings?.screen_time_alerts ? sovereignStyles.active : ''
                                            }`}
                                            onClick={() => handleSafetyToggle('screen_time_alerts', !safetySettings?.screen_time_alerts)}
                                        >
                                            <div className={sovereignStyles.toggleKnob} />
                                        </div>
                                    </div>
                                </div>

                                <div className={sovereignStyles.settingRow}>
                                    <div className={sovereignStyles.settingInfo}>
                                        <p className={sovereignStyles.settingLabel}>
                                            <FaExclamationCircle className={sovereignStyles.satinIcon} />
                                            Panic Button
                                        </p>
                                        <p className={sovereignStyles.settingDescription}>
                                            Quick alert to all guardians
                                        </p>
                                    </div>
                                    <div className={sovereignStyles.settingControl}>
                                        <button 
                                            className={styles.panicButton}
                                            onClick={() => navigate('/guardian/dashboard')}
                                        >
                                            View Dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guardian View */}
                    {isGuardian && (
                        <div className={styles.guardianView}>
                            <p className={styles.guardianIntro}>
                                You are a guardian for {linkedTeens.length} teen{linkedTeens.length !== 1 ? 's' : ''}
                            </p>
                            
                            <div className={styles.linkedTeensList}>
                                {linkedTeens.map((teen) => (
                                    <div key={teen.id} className={styles.teenCard}>
                                        <div className={styles.teenAvatar}>
                                            {teen.avatar_url ? (
                                                <img src={teen.avatar_url} alt={teen.username} />
                                            ) : (
                                                <span>{teen.username[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className={styles.teenInfo}>
                                            <p className={styles.teenName}>@{teen.username}</p>
                                            <p className={styles.teenAge}>
                                                {teen.birth_date && `${calculateAge(teen.birth_date)} years old`}
                                            </p>
                                        </div>
                                        <button 
                                            className={styles.manageButton}
                                            onClick={() => navigate(`/guardian/dashboard/${teen.id}`)}
                                        >
                                            Manage
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                className={`${sovereignStyles.biometricButton} ${sovereignStyles.secondary}`}
                                onClick={() => navigate('/guardian/dashboard')}
                            >
                                Open Guardian Dashboard
                            </button>
                        </div>
                    )}

                    {/* Not enrolled yet */}
                    {!isTeen && !isGuardian && (
                        <div className={styles.enrollSection}>
                            <p className={styles.enrollText}>
                                Teen Care provides guardian oversight and safety features for users under 18.
                            </p>
                            <button 
                                className={sovereignStyles.biometricButton}
                                onClick={() => navigate('/verification/parent-consent')}
                            >
                                <FaChild />
                                Set Up Teen Care
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Content Filter */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaFilter />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>AI Content Filter</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Control the AI Moderator's strictness level
                        </p>
                    </div>
                </div>

                <div className={styles.filterSlider}>
                    {filterLevels.map((level) => (
                        <button
                            key={level.value}
                            className={`${styles.filterOption} ${
                                contentFilterLevel === level.value ? styles.active : ''
                            }`}
                            onClick={() => handleFilterChange(level.value)}
                        >
                            <span className={styles.filterIcon}>{level.icon}</span>
                            <span className={styles.filterLabel}>{level.label}</span>
                            <span className={styles.filterDescription}>{level.description}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.filterInfo}>
                    {contentFilterLevel === 'relaxed' && (
                        <p>🟡 <strong>Relaxed:</strong> Blocks only severe violations. Suitable for mature users.</p>
                    )}
                    {contentFilterLevel === 'balanced' && (
                        <p>🟢 <strong>Balanced:</strong> Standard protection against inappropriate content.</p>
                    )}
                    {contentFilterLevel === 'strict' && (
                        <p>🔴 <strong>Ruthless:</strong> Maximum filtering. Best for younger users or sensitive environments.</p>
                    )}
                </div>
            </div>

            {/* Privacy Controls */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaEye />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Privacy Controls</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Control your visibility and online presence
                        </p>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaEye className={sovereignStyles.satinIcon} />
                            Activity Status
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Let others see when you're online
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings?.show_activity_status ? sovereignStyles.active : ''
                            }`}
                            onClick={() => onUpdateSetting?.('show_activity_status', !settings?.show_activity_status)}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaUserSlash className={sovereignStyles.satinIcon} />
                            Public Account
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Allow anyone to see your profile and posts
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings?.account_visibility === 'public' ? sovereignStyles.active : ''
                            }`}
                            onClick={() => onUpdateSetting?.('account_visibility', 
                                settings?.account_visibility === 'public' ? 'private' : 'public'
                            )}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Blocked Users */}
            <BlockedUsers compact />

            {/* Invitation Code Modal */}
            <AnimatePresence>
                {showingInvitationCode && invitationCode && (
                    <motion.div 
                        className={styles.modal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className={styles.modalContent}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h3>Guardian Invitation Code</h3>
                            <p>Share this code with your guardian to link accounts</p>
                            
                            <div className={styles.codeDisplay} onClick={copyCode}>
                                <span className={styles.code}>{invitationCode.code}</span>
                                <span className={styles.copyHint}>Click to copy</span>
                            </div>
                            
                            <p className={styles.codeExpiry}>
                                Expires: {new Date(invitationCode.expiresAt).toLocaleDateString()}
                            </p>

                            <button 
                                className={sovereignStyles.biometricButton}
                                onClick={copyCode}
                            >
                                Copy Code
                            </button>
                            <button 
                                className={`${sovereignStyles.biometricButton} ${sovereignStyles.secondary}`}
                                onClick={() => setShowingInvitationCode(false)}
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper function to calculate age
const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export default PrivacyPillarsSection;
