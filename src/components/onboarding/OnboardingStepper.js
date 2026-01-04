import React from 'react';
import styles from './OnboardingStepper.module.css';
import ProgressBar from './ProgressBar';
import StepWelcome from './StepWelcome';
import StepInterests from './StepInterests';
import StepFollowUsers from './StepFollowUsers';
import StepNotifications from './StepNotifications';
import useOnboarding from '../../hooks/useOnboarding';
import Toast from '../shared/Toast';

const OnboardingStepper = () => {
    const {
        currentStep,
        totalSteps,
        formData,
        updateFormData,
        nextStep,
        prevStep,
        isSubmitting,
        error
    } = useOnboarding();

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepWelcome formData={formData} updateFormData={updateFormData} onNext={nextStep} />;
            case 2:
                return <StepInterests formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 3:
                return <StepFollowUsers formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 4:
                return <StepNotifications formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} isSubmitting={isSubmitting} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
                <div className={styles.stepContent}>
                    {renderStep()}
                </div>
            </div>
            {error && <Toast message={error} type="error" onClose={() => { }} />}
        </div>
    );
};

export default OnboardingStepper;
