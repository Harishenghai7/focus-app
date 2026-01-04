import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for recording and sending video notes
 * WhatsApp-style short video messages (up to 60 seconds)
 */
export const useVideoNotes = () => {
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [duration, setDuration] = useState(0);

    const MAX_DURATION = 60; // 60 seconds

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 720, height: 720 },
                audio: true
            });

            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                setRecordedChunks(chunks);
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            setRecordedChunks([]);
            setDuration(0);
            recorder.start();
            setRecording(true);

            // Auto-stop after max duration
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    stopRecording();
                }
            }, MAX_DURATION * 1000);

        } catch (error) {
            console.error('Error starting video recording:', error);
            focusToast.error('Failed to start recording');
        }
    }, []);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setRecording(false);
        }
    }, [mediaRecorder]);

    // Send video note
    const sendVideoNote = useCallback(async (conversationId, senderId, receiverId) => {
        if (recordedChunks.length === 0) {
            focusToast.error('No video recorded');
            return null;
        }

        try {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const fileName = `video-note-${Date.now()}.webm`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('messages')
                .upload(`video-notes/${senderId}/${fileName}`, blob);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('messages')
                .getPublicUrl(uploadData.path);

            // Create message
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
                    conversation_id: conversationId,
                    message_type: 'video_note',
                    content: 'Video note',
                    attachments: [{
                        type: 'video_note',
                        url: publicUrl,
                        duration: duration
                    }]
                })
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Video note sent');
            setRecordedChunks([]);
            return data;
        } catch (error) {
            console.error('Error sending video note:', error);
            focusToast.error('Failed to send video note');
            return null;
        }
    }, [recordedChunks, duration]);

    return {
        recording,
        duration,
        startRecording,
        stopRecording,
        sendVideoNote,
        maxDuration: MAX_DURATION
    };
};
