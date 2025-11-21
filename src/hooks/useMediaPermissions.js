import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing camera and microphone permissions
 * 
 * Features:
 * - Check permission status for camera and microphone
 * - Request permissions dynamically
 * - Handle permission denial gracefully
 * - Support both camera and microphone separately
 * 
 * @returns {Object} Permission state and request functions
 */
const useMediaPermissions = () => {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [micPermission, setMicPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check if media devices API is supported
   */
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  /**
   * Query permission status using Permissions API
   */
  const queryPermissionStatus = useCallback(async (permissionName) => {
    try {
      if (!navigator.permissions) {
        return 'prompt';
      }

      const result = await navigator.permissions.query({ name: permissionName });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (err) {
      // Some browsers don't support querying certain permissions
      console.warn(`Could not query ${permissionName} permission:`, err);
      return 'prompt';
    }
  }, []);

  /**
   * Check current permission states
   */
  const checkPermissions = useCallback(async () => {
    if (!isSupported()) {
      setError('Media devices are not supported in this browser');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query camera permission
      const cameraStatus = await queryPermissionStatus('camera');
      setCameraPermission(cameraStatus === 'granted');

      // Query microphone permission
      const micStatus = await queryPermissionStatus('microphone');
      setMicPermission(micStatus === 'granted');

      setLoading(false);
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [isSupported, queryPermissionStatus]);

  /**
   * Request camera permission
   */
  const requestCamera = useCallback(async () => {
    if (!isSupported()) {
      throw new Error('Media devices are not supported in this browser');
    }

    try {
      setError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });

      // Stop all tracks immediately - we only needed permission
      stream.getTracks().forEach(track => track.stop());

      setCameraPermission(true);
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setCameraPermission(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please enable it in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera device found.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
      
      return false;
    }
  }, [isSupported]);

  /**
   * Request microphone permission
   */
  const requestMicrophone = useCallback(async () => {
    if (!isSupported()) {
      throw new Error('Media devices are not supported in this browser');
    }

    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: false,
        audio: true 
      });

      // Stop all tracks immediately - we only needed permission
      stream.getTracks().forEach(track => track.stop());

      setMicPermission(true);
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setMicPermission(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please enable it in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone device found.');
      } else if (err.name === 'NotReadableError') {
        setError('Microphone is already in use by another application.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }
      
      return false;
    }
  }, [isSupported]);

  /**
   * Request both camera and microphone permissions
   */
  const requestBoth = useCallback(async () => {
    if (!isSupported()) {
      throw new Error('Media devices are not supported in this browser');
    }

    try {
      setError(null);
      
      // Request both camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });

      // Stop all tracks immediately - we only needed permission
      stream.getTracks().forEach(track => track.stop());

      setCameraPermission(true);
      setMicPermission(true);
      return true;
    } catch (err) {
      console.error('Media permissions denied:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Media permissions were denied. Please enable them in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone device found.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera or microphone is already in use by another application.');
      } else {
        setError(`Media error: ${err.message}`);
      }
      
      return false;
    }
  }, [isSupported]);

  /**
   * Reset permission states
   */
  const resetPermissions = useCallback(() => {
    setCameraPermission(null);
    setMicPermission(null);
    setError(null);
  }, []);

  /**
   * Check permissions on mount
   */
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  /**
   * Listen for permission changes (if supported)
   */
  useEffect(() => {
    if (!navigator.permissions) return;

    const handlePermissionChange = () => {
      checkPermissions();
    };

    let cameraPermissionStatus = null;
    let micPermissionStatus = null;

    const setupListeners = async () => {
      try {
        // Listen for camera permission changes
        cameraPermissionStatus = await navigator.permissions.query({ name: 'camera' });
        cameraPermissionStatus.addEventListener('change', handlePermissionChange);

        // Listen for microphone permission changes
        micPermissionStatus = await navigator.permissions.query({ name: 'microphone' });
        micPermissionStatus.addEventListener('change', handlePermissionChange);
      } catch (err) {
        // Permission API not fully supported
        console.warn('Could not set up permission listeners:', err);
      }
    };

    setupListeners();

    return () => {
      if (cameraPermissionStatus) {
        cameraPermissionStatus.removeEventListener('change', handlePermissionChange);
      }
      if (micPermissionStatus) {
        micPermissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [checkPermissions]);

  return {
    // Permission states
    cameraPermission,
    micPermission,
    hasCamera: cameraPermission === true,
    hasMicrophone: micPermission === true,
    hasBoth: cameraPermission === true && micPermission === true,
    
    // Request functions
    requestCamera,
    requestMicrophone,
    requestBoth,
    
    // Utility functions
    checkPermissions,
    resetPermissions,
    
    // Status
    loading,
    error,
    isSupported: isSupported()
  };
};

export default useMediaPermissions;
