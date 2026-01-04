// ═══════════════════════════════════════════════════════════════════════
// VOICE RECORDER - Record voice messages with Web Audio API
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from '../../../lib/supabase';

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
    }

    /**
     * Start recording
     */
    async startRecording() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];
            this.startTime = Date.now();

            // Collect audio data
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            // Start recording
            this.mediaRecorder.start();

            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            throw new Error('Failed to access microphone');
        }
    }

    /**
     * Stop recording
     */
    async stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('No active recording'));
                return;
            }

            this.mediaRecorder.onstop = async () => {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);

                // Create audio blob
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

                // Stop all tracks
                this.stream.getTracks().forEach(track => track.stop());

                resolve({
                    blob: audioBlob,
                    duration,
                    url: URL.createObjectURL(audioBlob)
                });
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Cancel recording
     */
    cancelRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.audioChunks = [];
    }

    /**
     * Get recording duration
     */
    getDuration() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

/**
 * Upload voice message to Supabase Storage
 */
export const uploadVoiceMessage = async (blob, userId, messageId, duration) => {
    try {
        // Generate unique filename
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
        const filePath = `messages/voice/${userId}/${messageId}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'audio/webm'
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        return {
            url: publicUrl,
            duration
        };
    } catch (error) {
        console.error('Error uploading voice message:', error);
        throw error;
    }
};

/**
 * Transcribe voice message (placeholder for future implementation)
 */
export const transcribeVoiceMessage = async (audioUrl) => {
    // TODO: Implement with Web Speech API or external service
    // For now, return null
    return null;
};

export default VoiceRecorder;
