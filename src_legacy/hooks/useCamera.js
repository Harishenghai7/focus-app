import { useState } from 'react';

/**
 * useCamera
 * Camera access and capture (mocked for demo).
 * @returns {Object} { openCamera, photo, error }
 * @example
 * const { openCamera, photo, error } = useCamera();
 */
export default function useCamera() {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const openCamera = async () => {
    // Replace with real camera logic
    setPhoto('mock-photo-url');
  };
  return { openCamera, photo, error };
}
