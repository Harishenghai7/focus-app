import { useState, useRef } from 'react';

/**
 * useAudioRecorder
 * Record and upload audio (mocked for demo).
 * @returns {Object} { start, stop, audioUrl, recording }
 * @example
 * const { start, stop, audioUrl, recording } = useAudioRecorder();
 */
export default function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  const start = async () => {
    setRecording(true);
    // Replace with real recording logic
    setTimeout(() => {
      setAudioUrl('mock-audio-url');
      setRecording(false);
    }, 2000);
  };
  const stop = () => {
    setRecording(false);
  };
  return { start, stop, audioUrl, recording };
}
