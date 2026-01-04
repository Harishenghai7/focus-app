import React, { useState } from 'react';
import { playNotificationSound, updateNotificationSound } from '../../utils/notificationSound';
import styles from './NotificationSoundPicker.module.css';

const NOTIFICATION_SOUNDS = [
    { id: 'default', name: 'Default', emoji: '🔔' },
    { id: 'chime', name: 'Chime', emoji: '🎵' },
    { id: 'bell', name: 'Bell', emoji: '🔔' },
    { id: 'ping', name: 'Ping', emoji: '📍' },
    { id: 'pop', name: 'Pop', emoji: '💫' },
    { id: 'none', name: 'None (Silent)', emoji: '🔇' }
];

const NotificationSoundPicker = ({ value, onChange }) => {
    const [playing, setPlaying] = useState(null);

    const handleSoundSelect = async (soundId) => {
        console.log('🔊 Sound selected:', soundId);
        console.log('📝 Current value:', value);

        // Update database via parent component FIRST
        if (onChange) {
            onChange(soundId);
            console.log('✅ onChange called with:', soundId);
        }

        // Update localStorage for immediate access
        updateNotificationSound(soundId);

        if (soundId === 'none') return;

        setPlaying(soundId);

        // Play the sound preview
        try {
            await playNotificationSound(soundId);
        } catch (error) {
            console.error('Error playing sound:', error);
        }

        setTimeout(() => {
            setPlaying(null);
        }, 500);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Notification Sound</h3>
            <p className={styles.description}>Choose a sound for notifications</p>
            <div className={styles.soundGrid}>
                {NOTIFICATION_SOUNDS.map((sound) => (
                    <button
                        key={sound.id}
                        className={`${styles.soundCard} ${value === sound.id ? styles.active : ''} ${playing === sound.id ? styles.playing : ''}`}
                        onClick={() => handleSoundSelect(sound.id)}
                    >
                        <span className={styles.soundEmoji}>{sound.emoji}</span>
                        <span className={styles.soundName}>{sound.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NotificationSoundPicker;
