import React, { useState, useCallback } from 'react';
import { 
    FaRobot, 
    FaVolumeUp, 
    FaKeyboard, 
    FaSmile, 
    FaStar,
    FaMagic,
    FaCommentDots,
    FaMemory,
    FaHome,
    FaRunning,
    FaMicrophone,
    FaMusic
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import useFocuslySettings from '../../hooks/useFocuslySettings';
import { focusToast } from '../../utils/focusToast';
import { triggerHaptic } from '../../utils/haptics';
import sovereignStyles from './SovereignSettings.module.css';
import styles from './FocuslyAISection.module.css';

/**
 * Province 4: Focusly AI
 * 
 * Mascot emotions, Voice/Text preferences, Ambient Companion Mode
 */
const FocuslyAISection = () => {
    const {
        settings,
        updateSetting,
        updateSettings,
        toggleVoice,
        toggleSound,
        toggleProactiveMessages,
        toggleConversationMemory,
        toggleParticles,
        setVoiceRate,
        setVoicePitch,
        setVoiceVolume,
        setSoundVolume,
        setPersonalityMode,
        setAnimationSpeed
    } = useFocuslySettings();

    const [voiceRate, setLocalVoiceRate] = useState(settings.voice.rate);
    const [voicePitch, setLocalVoicePitch] = useState(settings.voice.pitch);
    const [voiceVolume, setLocalVoiceVolume] = useState(settings.voice.volume);
    const [soundVolume, setLocalSoundVolume] = useState(settings.sound.volume);

    // Personality modes
    const personalities = [
        { value: 'friendly', label: 'Friendly', icon: '😊', description: 'Warm and approachable' },
        { value: 'professional', label: 'Professional', icon: '👔', description: 'Formal and concise' },
        { value: 'playful', label: 'Playful', icon: '🎮', description: 'Fun and energetic' },
        { value: 'supportive', label: 'Supportive', icon: '💜', description: 'Caring and encouraging' }
    ];

    // Animation speeds
    const speeds = [
        { value: 0.5, label: 'Slow', description: 'Calm and relaxed' },
        { value: 1.0, label: 'Normal', description: 'Balanced pace' },
        { value: 1.5, label: 'Fast', description: 'Quick responses' }
    ];

    // Handle voice rate change
    const handleVoiceRateChange = useCallback((rate) => {
        setLocalVoiceRate(rate);
        setVoiceRate(rate);
        triggerHaptic('light');
    }, [setVoiceRate]);

    // Handle voice pitch change
    const handleVoicePitchChange = useCallback((pitch) => {
        setLocalVoicePitch(pitch);
        setVoicePitch(pitch);
        triggerHaptic('light');
    }, [setVoicePitch]);

    // Handle voice volume change
    const handleVoiceVolumeChange = useCallback((volume) => {
        setLocalVoiceVolume(volume);
        setVoiceVolume(volume);
    }, [setVoiceVolume]);

    // Handle sound volume change
    const handleSoundVolumeChange = useCallback((volume) => {
        setLocalSoundVolume(volume);
        setSoundVolume(volume);
    }, [setSoundVolume]);

    // Handle personality change
    const handlePersonalityChange = useCallback((mode) => {
        setPersonalityMode(mode);
        triggerHaptic('light');
        const personality = personalities.find(p => p.value === mode);
        focusToast.success(`Focusly personality set to ${personality?.label}`);
    }, [setPersonalityMode]);

    // Handle animation speed change
    const handleSpeedChange = useCallback((speed) => {
        setAnimationSpeed(speed);
        triggerHaptic('light');
    }, [setAnimationSpeed]);

    return (
        <div className={sovereignStyles.slideIn}>
            {/* Ambient Companion Mode */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaHome />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Ambient Companion Mode</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Let Focusly appear on your home screen
                        </p>
                    </div>
                </div>

                <div className={styles.companionPreview}>
                    <div className={styles.mascotPreview}>
                        <div className={styles.mascotAvatar}>
                            <FaRobot />
                        </div>
                        <div className={styles.mascotInfo}>
                            <p className={styles.mascotName}>Focusly AI</p>
                            <p className={styles.mascotStatus}>
                                {settings.behavior.proactiveMessages ? 'Active & Watching' : 'Standby Mode'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaMagic className={sovereignStyles.satinIcon} />
                            Enable Ambient Mode
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Focusly appears proactively on the home screen
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.behavior.proactiveMessages ? sovereignStyles.active : ''
                            }`}
                            onClick={toggleProactiveMessages}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaRunning className={sovereignStyles.satinIcon} />
                            Animation Effects
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Particle effects and transitions
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.animation.particlesEnabled ? sovereignStyles.active : ''
                            }`}
                            onClick={toggleParticles}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Personality Selection */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaSmile />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Mascot Personality</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Choose how Focusly interacts with you
                        </p>
                    </div>
                </div>

                <div className={styles.personalityGrid}>
                    {personalities.map((personality) => (
                        <button
                            key={personality.value}
                            className={`${styles.personalityCard} ${
                                settings.personality.mode === personality.value ? styles.active : ''
                            }`}
                            onClick={() => handlePersonalityChange(personality.value)}
                        >
                            <span className={styles.personalityIcon}>{personality.icon}</span>
                            <span className={styles.personalityLabel}>{personality.label}</span>
                            <span className={styles.personalityDescription}>{personality.description}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.personalityTraits}>
                    <div className={sovereignStyles.settingRow}>
                        <div className={sovereignStyles.settingInfo}>
                            <p className={sovereignStyles.settingLabel}>
                                <FaStar className={sovereignStyles.satinIcon} />
                                Emoji Responses
                            </p>
                            <p className={sovereignStyles.settingDescription}>
                                Include emojis in Focusly's messages
                            </p>
                        </div>
                        <div className={sovereignStyles.settingControl}>
                            <div 
                                className={`${sovereignStyles.toggleSwitch} ${
                                    settings.personality.emoji ? sovereignStyles.active : ''
                                }`}
                                onClick={() => updateSetting('personality', 'emoji', !settings.personality.emoji)}
                            >
                                <div className={sovereignStyles.toggleKnob} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voice Settings */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaVolumeUp />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Voice Preferences</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Customize Focusly's voice output
                        </p>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaMicrophone className={sovereignStyles.satinIcon} />
                            Voice Output
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Enable spoken responses
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.voice.enabled ? sovereignStyles.active : ''
                            }`}
                            onClick={toggleVoice}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                {settings.voice.enabled && (
                    <motion.div 
                        className={styles.voiceControls}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className={styles.sliderControl}>
                            <label>Speech Rate</label>
                            <div className={styles.sliderContainer}>
                                <span className={styles.sliderLabel}>Slow</span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={voiceRate}
                                    onChange={(e) => handleVoiceRateChange(parseFloat(e.target.value))}
                                    className={styles.slider}
                                />
                                <span className={styles.sliderLabel}>Fast</span>
                            </div>
                            <span className={styles.sliderValue}>{voiceRate.toFixed(1)}x</span>
                        </div>

                        <div className={styles.sliderControl}>
                            <label>Voice Pitch</label>
                            <div className={styles.sliderContainer}>
                                <span className={styles.sliderLabel}>Low</span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={voicePitch}
                                    onChange={(e) => handleVoicePitchChange(parseFloat(e.target.value))}
                                    className={styles.slider}
                                />
                                <span className={styles.sliderLabel}>High</span>
                            </div>
                            <span className={styles.sliderValue}>{voicePitch.toFixed(1)}</span>
                        </div>

                        <div className={styles.sliderControl}>
                            <label>Voice Volume</label>
                            <div className={styles.sliderContainer}>
                                <span className={styles.sliderLabel}>Min</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={voiceVolume}
                                    onChange={(e) => handleVoiceVolumeChange(parseFloat(e.target.value))}
                                    className={styles.slider}
                                />
                                <span className={styles.sliderLabel}>Max</span>
                            </div>
                            <span className={styles.sliderValue}>{Math.round(voiceVolume * 100)}%</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Sound Effects */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaMusic />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Sound Effects</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Audio feedback and notifications
                        </p>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaMusic className={sovereignStyles.satinIcon} />
                            Enable Sounds
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Play sound effects for interactions
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.sound.enabled ? sovereignStyles.active : ''
                            }`}
                            onClick={toggleSound}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                {settings.sound.enabled && (
                    <motion.div 
                        className={styles.soundControls}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className={styles.sliderControl}>
                            <label>Sound Volume</label>
                            <div className={styles.sliderContainer}>
                                <span className={styles.sliderLabel}>Min</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={soundVolume}
                                    onChange={(e) => handleSoundVolumeChange(parseFloat(e.target.value))}
                                    className={styles.slider}
                                />
                                <span className={styles.sliderLabel}>Max</span>
                            </div>
                            <span className={styles.sliderValue}>{Math.round(soundVolume * 100)}%</span>
                        </div>

                        <div className={styles.soundToggles}>
                            <div className={sovereignStyles.settingRow}>
                                <div className={sovereignStyles.settingInfo}>
                                    <p className={sovereignStyles.settingLabel}>Notification Sounds</p>
                                </div>
                                <div className={sovereignStyles.settingControl}>
                                    <div 
                                        className={`${sovereignStyles.toggleSwitch} ${
                                            settings.sound.notificationSounds ? sovereignStyles.active : ''
                                        }`}
                                        onClick={() => updateSetting('sound', 'notificationSounds', !settings.sound.notificationSounds)}
                                    >
                                        <div className={sovereignStyles.toggleKnob} />
                                    </div>
                                </div>
                            </div>

                            <div className={sovereignStyles.settingRow}>
                                <div className={sovereignStyles.settingInfo}>
                                    <p className={sovereignStyles.settingLabel}>Emotion Sounds</p>
                                </div>
                                <div className={sovereignStyles.settingControl}>
                                    <div 
                                        className={`${sovereignStyles.toggleSwitch} ${
                                            settings.sound.emotionSounds ? sovereignStyles.active : ''
                                        }`}
                                        onClick={() => updateSetting('sound', 'emotionSounds', !settings.sound.emotionSounds)}
                                    >
                                        <div className={sovereignStyles.toggleKnob} />
                                    </div>
                                </div>
                            </div>

                            <div className={sovereignStyles.settingRow}>
                                <div className={sovereignStyles.settingInfo}>
                                    <p className={sovereignStyles.settingLabel}>Event Sounds</p>
                                </div>
                                <div className={sovereignStyles.settingControl}>
                                    <div 
                                        className={`${sovereignStyles.toggleSwitch} ${
                                            settings.sound.eventSounds ? sovereignStyles.active : ''
                                        }`}
                                        onClick={() => updateSetting('sound', 'eventSounds', !settings.sound.eventSounds)}
                                    >
                                        <div className={sovereignStyles.toggleKnob} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Text/Chat Preferences */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaKeyboard />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Chat Preferences</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Text-based interaction settings
                        </p>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaCommentDots className={sovereignStyles.satinIcon} />
                            Conversation Memory
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Remember context across sessions
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.behavior.conversationMemory ? sovereignStyles.active : ''
                            }`}
                            onClick={toggleConversationMemory}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaMagic className={sovereignStyles.satinIcon} />
                            Context Awareness
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Adapt responses based on your activity
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.behavior.contextAwareness ? sovereignStyles.active : ''
                            }`}
                            onClick={() => updateSetting('behavior', 'contextAwareness', !settings.behavior.contextAwareness)}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaRobot className={sovereignStyles.satinIcon} />
                            Auto Greeting
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Welcome message when opening chat
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.behavior.autoGreeting ? sovereignStyles.active : ''
                            }`}
                            onClick={() => updateSetting('behavior', 'autoGreeting', !settings.behavior.autoGreeting)}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                {/* Verbosity */}
                <div className={styles.verbositySection}>
                    <h4 className={styles.subSectionTitle}>Response Length</h4>
                    <div className={styles.verbosityOptions}>
                        {['concise', 'medium', 'detailed'].map((level) => (
                            <button
                                key={level}
                                className={`${styles.verbosityButton} ${
                                    settings.personality.verbosity === level ? styles.active : ''
                                }`}
                                onClick={() => updateSetting('personality', 'verbosity', level)}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Animation Speed */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaRunning />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Animation Speed</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            How quickly Focusly responds and moves
                        </p>
                    </div>
                </div>

                <div className={styles.speedOptions}>
                    {speeds.map((speed) => (
                        <button
                            key={speed.value}
                            className={`${styles.speedButton} ${
                                settings.animation.speed === speed.value ? styles.active : ''
                            }`}
                            onClick={() => handleSpeedChange(speed.value)}
                        >
                            <motion.div 
                                className={styles.speedDemo}
                                animate={{ 
                                    x: settings.animation.speed === speed.value ? [0, 20, 0] : 0 
                                }}
                                transition={{ 
                                    duration: 1 / speed.value,
                                    repeat: settings.animation.speed === speed.value ? Infinity : 0
                                }}
                            >
                                <FaRobot />
                            </motion.div>
                            <span className={styles.speedLabel}>{speed.label}</span>
                            <span className={styles.speedDescription}>{speed.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Privacy */}
            <div className={sovereignStyles.glassTile}>
                <div className={sovereignStyles.glassTileHeader}>
                    <div className={sovereignStyles.glassTileIcon}>
                        <FaMemory />
                    </div>
                    <div>
                        <h3 className={sovereignStyles.glassTileTitle}>Conversation Privacy</h3>
                        <p className={sovereignStyles.glassTileDescription}>
                            Control how your conversations are stored
                        </p>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaCommentDots className={sovereignStyles.satinIcon} />
                            Save Conversations
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Store chat history locally
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.privacy.saveConversations ? sovereignStyles.active : ''
                            }`}
                            onClick={() => updateSetting('privacy', 'saveConversations', !settings.privacy.saveConversations)}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>

                <div className={sovereignStyles.settingRow}>
                    <div className={sovereignStyles.settingInfo}>
                        <p className={sovereignStyles.settingLabel}>
                            <FaMagic className={sovereignStyles.satinIcon} />
                            Usage Analytics
                        </p>
                        <p className={sovereignStyles.settingDescription}>
                            Help improve Focusly with anonymous data
                        </p>
                    </div>
                    <div className={sovereignStyles.settingControl}>
                        <div 
                            className={`${sovereignStyles.toggleSwitch} ${
                                settings.privacy.analytics ? sovereignStyles.active : ''
                            }`}
                            onClick={() => updateSetting('privacy', 'analytics', !settings.privacy.analytics)}
                        >
                            <div className={sovereignStyles.toggleKnob} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocuslyAISection;
