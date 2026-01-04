// Generate notification sounds programmatically using Web Audio API
// This creates the sound files on-the-fly so you don't need to download them

class NotificationSoundGenerator {
    constructor() {
        this.audioContext = null;
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Generate a pleasant notification sound
    generateSound(type) {
        const ctx = this.getAudioContext();
        const duration = 0.3;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Different sound profiles
        const sounds = {
            default: { freq: [800, 1000], type: 'sine' },
            chime: { freq: [523.25, 659.25, 783.99], type: 'sine' }, // C, E, G chord
            bell: { freq: [1000, 1200], type: 'triangle' },
            ping: { freq: [1200], type: 'sine' },
            pop: { freq: [400, 800], type: 'square' }
        };

        const sound = sounds[type] || sounds.default;

        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.freq[0], ctx.currentTime);

        // Create envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        // Play frequency sequence for chime
        if (sound.freq.length > 1) {
            const noteLength = duration / sound.freq.length;
            sound.freq.forEach((freq, index) => {
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime + (noteLength * index));
            });
        }

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);

        return new Promise(resolve => {
            setTimeout(resolve, duration * 1000);
        });
    }

    async playSound(type) {
        if (type === 'none') return;

        try {
            await this.generateSound(type);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
}

export const soundGenerator = new NotificationSoundGenerator();

export const playNotificationSound = async (soundType) => {
    const userSound = soundType || localStorage.getItem('notification_sound') || 'default';
    await soundGenerator.playSound(userSound);
};

export const updateNotificationSound = (soundId) => {
    localStorage.setItem('notification_sound', soundId);
};

export const getNotificationSound = () => {
    return localStorage.getItem('notification_sound') || 'default';
};
