import { useState, useCallback } from 'react';

export const useStepper = (initialStep = 0, totalSteps = 5) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  const goToStep = useCallback((step) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      return true;
    }
    return false;
  }, [totalSteps]);

  const completeStep = useCallback((step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const isStepCompleted = useCallback((step) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setCompletedSteps(new Set());
    setStepData({});
  }, [initialStep]);

  const updateStepData = useCallback((step, data) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...(prev[step] || {}), ...data }
    }));
  }, []);

  return {
    currentStep,
    completedSteps,
    stepData,
    nextStep,
    prevStep,
    goToStep,
    completeStep,
    isStepCompleted,
    reset,
    updateStepData,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    progress: ((currentStep + 1) / totalSteps) * 100
  };
};
