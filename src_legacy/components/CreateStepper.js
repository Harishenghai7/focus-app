import React from 'react';
import './CreateStepper.css';

const STEPS = [
  { id: 0, label: 'Type', icon: '📝' },
  { id: 1, label: 'Media', icon: '🎬' },
  { id: 2, label: 'Edit', icon: '✨' },
  { id: 3, label: 'Details', icon: '📋' },
  { id: 4, label: 'Review', icon: '🚀' }
];

const CreateStepper = ({ currentStep, completedSteps, onStepClick }) => {
  return (
    <div className="create-stepper" role="navigation" aria-label="Create post steps">
      <div className="stepper-progress-bg">
        <div 
          className="stepper-progress-fill"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      
      <div className="stepper-steps">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.has(step.id);
          const isClickable = isCompleted || currentStep >= step.id;
          
          return (
            <div
              key={step.id}
              className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => isClickable && onStepClick && onStepClick(step.id)}
              role="button"
              tabIndex={isClickable ? 0 : -1}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${step.id + 1}: ${step.label}`}
            >
              <div className="step-indicator">
                {isCompleted ? (
                  <span className="step-check">✓</span>
                ) : (
                  <span className="step-icon">{step.icon}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
              {index < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreateStepper;
