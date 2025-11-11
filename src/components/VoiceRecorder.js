import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './VoiceRecorder.css';

export default function VoiceRecorder({ onRecordingComplete, onCancel }) {
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
      className="voice-recorder"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <div className="recorder-content">
        <div className="recording-indicator">
          <div className="pulse-circle"></div>
          <span className="recording-text">Recording...</span>
        </div>

        <div className="waveform">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
          ))}
        </div>

        <div className="recording-time">{formatTime(recordingTime)} / 1:00</div>
      </div>

      <div className="recorder-actions">
        <button className="cancel-btn" onClick={cancelRecording}>
          Cancel
        </button>
        <button className="send-btn" onClick={stopRecording}>
          Send
        </button>
      </div>
    </motion.div>
  );
}
