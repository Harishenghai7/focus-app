import { useEffect, useRef } from 'react';
import { useAITracker } from '../components/AITrackerProvider';

// Hook for automatic component tracking
export const useAITracking = (componentName, trackingOptions = {}) => {
  const { trackFeatureUsage, trackEngagement } = useAITracker();
  const mountTime = useRef(Date.now());
  const interactionCount = useRef(0);

  useEffect(() => {
    // Track component mount
    trackFeatureUsage(`component_${componentName}_mounted`, {
      options: trackingOptions
    });

    return () => {
      // Track component unmount and engagement
      const timeSpent = Date.now() - mountTime.current;
      trackEngagement(`component_${componentName}`, timeSpent, {
        interactions: interactionCount.current,
        options: trackingOptions
      });
    };
  }, [componentName, trackFeatureUsage, trackEngagement]);

  const trackInteraction = (interactionType, data = {}) => {
    interactionCount.current++;
    trackFeatureUsage(`${componentName}_${interactionType}`, data);
  };

  return { trackInteraction };
};

// Hook for tracking specific user flows
export const useFlowTracking = (flowName) => {
  const { trackUserAction } = useAITracker();
  const flowStart = useRef(null);
  const steps = useRef([]);

  const startFlow = (initialData = {}) => {
    flowStart.current = Date.now();
    steps.current = [];
    trackUserAction(`flow_${flowName}_started`, initialData);
  };

  const trackStep = (stepName, stepData = {}) => {
    const stepTime = Date.now();
    steps.current.push({
      step: stepName,
      timestamp: stepTime,
      data: stepData
    });
    
    trackUserAction(`flow_${flowName}_step_${stepName}`, {
      ...stepData,
      stepIndex: steps.current.length,
      timeFromStart: stepTime - (flowStart.current || stepTime)
    });
  };

  const completeFlow = (completionData = {}) => {
    const completionTime = Date.now();
    const totalTime = completionTime - (flowStart.current || completionTime);
    
    trackUserAction(`flow_${flowName}_completed`, {
      ...completionData,
      totalTime,
      stepCount: steps.current.length,
      steps: steps.current
    });
    
    // Reset flow
    flowStart.current = null;
    steps.current = [];
  };

  const abandonFlow = (reason = 'unknown') => {
    const abandonTime = Date.now();
    const timeSpent = abandonTime - (flowStart.current || abandonTime);
    
    trackUserAction(`flow_${flowName}_abandoned`, {
      reason,
      timeSpent,
      stepCount: steps.current.length,
      lastStep: steps.current[steps.current.length - 1]?.step,
      steps: steps.current
    });
    
    // Reset flow
    flowStart.current = null;
    steps.current = [];
  };

  return {
    startFlow,
    trackStep,
    completeFlow,
    abandonFlow
  };
};

// Hook for performance tracking
export const usePerformanceTracking = (operationName) => {
  const { trackFeatureUsage } = useAITracker();

  const trackOperation = async (operation, data = {}) => {
    const startTime = performance.now();
    let result, error;

    try {
      result = await operation();
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      trackFeatureUsage(`performance_${operationName}`, {
        duration,
        success: !error,
        error: error?.message,
        ...data
      });
    }
  };

  return { trackOperation };
};

export default useAITracking;