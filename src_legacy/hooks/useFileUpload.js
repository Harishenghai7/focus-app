import { useState } from 'react';

/**
 * useFileUpload
 * Generic file upload handler (mocked for demo).
 * @returns {Object} { uploadFile, progress, error }
 * @example
 * const { uploadFile, progress, error } = useFileUpload();
 */
export default function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const uploadFile = async (file) => {
    setProgress(0);
    setError(null);
    // Replace with real upload logic
    for (let i = 1; i <= 10; i++) {
      await new Promise(res => setTimeout(res, 80));
      setProgress(i * 10);
    }
    // Simulate success
    return 'uploaded-file-url';
  };
  return { uploadFile, progress, error };
}
