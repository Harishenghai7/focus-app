import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './AudioRecorder.module.css';

/**
 * AudioRecorder
 * Voice message recorder with waveform.
 * @param {Function} onRecord - Callback with recorded audio blob
 * @example <AudioRecorder onRecord={handleAudio} />
 */
const AudioRecorder = ({ onRecord }) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(blob));
      if (onRecord) onRecord(blob);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.recordBtn}
        onClick={recording ? stopRecording : startRecording}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        {recording ? 'Stop' : 'Record'}
      </button>
      {audioUrl && (
        <audio controls src={audioUrl} className={styles.audio} />
      )}
      {/* Placeholder for waveform visualization */}
      <div className={styles.waveform} aria-hidden="true" />
    </div>
  );
};

AudioRecorder.propTypes = {
  onRecord: PropTypes.func.isRequired
};

export default React.memo(AudioRecorder);
