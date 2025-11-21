import React, { useState } from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  danger = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onCancel();
    }
  };

  return (
    <div 
      className="confirmation-modal-overlay" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className={`confirmation-modal ${danger ? 'danger' : ''}`}>
        <h2 id="modal-title" className="modal-title">{title}</h2>
        <p id="modal-description" className="modal-message">{message}</p>
        <div className="modal-actions">
          <button 
            className="modal-button cancel-button" 
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button 
            className={`modal-button confirm-button ${danger ? 'danger' : ''}`}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
