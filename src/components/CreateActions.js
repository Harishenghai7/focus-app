import React from 'react';
import './CreateActions.css';

const CreateActions = ({
  currentStep,
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
  onCancel,
  onSaveDraft,
  onPublish,
  canProceed = true,
  isPublishing = false
}) => {
  return (
    <div className="create-actions-container" role="navigation" aria-label="Create post actions">
      <div className="actions-left">
        {!isFirstStep && (
          <button
            type="button"
            className="action-btn secondary"
            onClick={onBack}
            disabled={isPublishing}
            aria-label="Go back"
          >
            <span className="btn-icon">←</span>
            Back
          </button>
        )}
        <button
          type="button"
          className="action-btn secondary"
          onClick={onCancel}
          disabled={isPublishing}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>

      <div className="actions-center">
        <button
          type="button"
          className="action-btn tertiary"
          onClick={onSaveDraft}
          disabled={isPublishing}
          aria-label="Save as draft"
        >
          <span className="btn-icon">💾</span>
          Save Draft
        </button>
      </div>

      <div className="actions-right">
        {!isLastStep ? (
          <button
            type="button"
            className="action-btn primary"
            onClick={onNext}
            disabled={!canProceed || isPublishing}
            aria-label="Next step"
          >
            Next
            <span className="btn-icon">→</span>
          </button>
        ) : (
          <button
            type="button"
            className="action-btn primary publish-btn"
            onClick={onPublish}
            disabled={!canProceed || isPublishing}
            aria-label="Publish post"
          >
            {isPublishing ? (
              <>
                <span className="spinner" />
                Publishing...
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                Publish
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateActions;
