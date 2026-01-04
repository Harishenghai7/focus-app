import { useState } from 'react';

export const useCreateStepper = (initialStep = 0) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [completedSteps, setCompletedSteps] = useState([]);

    const nextStep = () => {
        setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    const goToStep = (step) => {
        // Only allow going to completed steps or the next available step
        if (completedSteps.includes(step) || step === currentStep + 1 || step < currentStep) {
            setCurrentStep(step);
        }
    };

    const resetStepper = () => {
        setCurrentStep(0);
        setCompletedSteps([]);
    };

    return {
        currentStep,
        completedSteps,
        nextStep,
        prevStep,
        goToStep,
        resetStepper
    };
};
