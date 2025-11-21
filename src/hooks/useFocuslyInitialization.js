/**
 * Focusly Initialization Hook
 * Handles loading and initializing Focusly's visual reference when the app starts
 */

import { useEffect, useRef } from 'react';
import { initializeFocuslyWithReference, isFocuslyVisualizationReady } from '../services/focuslyAI';

/**
 * Hook to initialize Focusly with visual reference
 * Should be called once on app load
 * @param {boolean} enabled - Whether to enable initialization (default: true)
 * @returns {Object} Initialization state
 */
export const useFocuslyInitialization = (enabled = true) => {
  const initializeRef = useRef(false);
  const [status, setStatus] = React.useState('pending');

  useEffect(() => {
    if (!enabled || initializeRef.current) return;
    
    initializeRef.current = true;
    
    const initialize = async () => {
      try {
        setStatus('initializing');
        
        // Check if already initialized
        if (isFocuslyVisualizationReady()) {
          console.log('✅ Focusly already initialized');
          setStatus('ready');
          return;
        }

        // Initialize Focusly
        const success = await initializeFocuslyWithReference();
        
        if (success) {
          console.log('✅ Focusly initialized successfully');
          setStatus('ready');
        } else {
          console.warn('⚠️ Focusly initialization incomplete, using fallback');
          setStatus('partial');
        }
      } catch (error) {
        console.error('❌ Focusly initialization error:', error);
        setStatus('error');
      }
    };

    initialize();
  }, [enabled]);

  return {
    status, // 'pending' | 'initializing' | 'ready' | 'partial' | 'error'
    isReady: status === 'ready' || status === 'partial',
    isInitialized: initializeRef.current
  };
};

export default useFocuslyInitialization;
