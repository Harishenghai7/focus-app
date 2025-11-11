import { useState } from 'react';

/**
 * Optimistic UI Hook with Rollback
 * Provides instant UI updates with automatic rollback on errors
 */
const useOptimisticAction = (initialState, asyncAction) => {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const executeOptimistic = async (optimisticUpdate, actionData) => {
    // Store previousState for rollback on error
    const previousState = state;
    
    // Apply optimistic update immediately
    setState(optimisticUpdate);
    setLoading(true);
    setError(null);
    
    try {
      // Execute actual async action
      const result = await asyncAction(actionData);
      
      // Update with real result
      setState(result);
      setLoading(false);
      return result;
      
    } catch (err) {
      // Automatic rollback on error to previousState
      setState(previousState);
      setError(err);
      setLoading(false);
      throw err;
    }
  };
  
  return { state, loading, error, executeOptimistic };
};

export default useOptimisticAction;