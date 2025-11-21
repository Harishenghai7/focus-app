import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './VoiceRecorder.module.css';

/**
 * VoiceRecorder - Records audio from the user's microphone.
 * @component
 * @param {function} onRecordingComplete - Handler for completed recording
 * @param {function} onCancel - Handler to cancel recording
 * @returns {React.ReactElement}
 */
const VoiceRecorder = React.memo(function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob, recordingTime);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordingTime(0);
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <motion.div
      className={styles.voiceRecorder}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <div className={styles.recorderContent}>
        <div className={styles.recordingIndicator}>
          <div className={styles.pulseCircle} aria-hidden="true"></div>
          <span className={styles.recordingText}>Recording...</span>
        </div>

        <div className={styles.waveform}>
          {([...Array(20)] || []).map((_, i) => (
            <div key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.1}s` }}></div>
          ))}
        </div>

        <div className={styles.recordingTime} aria-label={`Recording time: ${formatTime(recordingTime)} seconds`}>
          {formatTime(recordingTime)} / 1:00
        </div>
      </div>

      <div className={styles.recorderActions}>
        <button className={styles.cancelBtn} onClick={cancelRecording} aria-label="Cancel recording">
          Cancel
        </button>
        <button className={styles.sendBtn} onClick={stopRecording} aria-label="Send recording">
          Send
        </button>
      </div>
    </motion.div>
  );
});

VoiceRecorder.displayName = 'VoiceRecorder';
VoiceRecorder.propTypes = {
  onRecordingComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default VoiceRecorder;
