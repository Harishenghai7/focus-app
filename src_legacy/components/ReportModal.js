import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import styles from './ReportModal.module.css';

/**
 * ReportModal - Modal for reporting content with various reasons.
 * @component
 * @param {string} contentType - Type of content being reported (post, comment, user, etc.)
 * @param {string} contentId - ID of the content being reported
 * @param {function} onClose - Handler to close modal
 * @returns {React.ReactElement}
 */
const ReportModal = React.memo(function ReportModal({ contentType, contentId, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reportReasons = [
    { id: 'spam', label: 'Spam', description: 'Repetitive or irrelevant content' },
    { id: 'harassment', label: 'Harassment', description: 'Bullying or targeting individuals' },
    { id: 'false-info', label: 'False Information', description: 'Misleading or fake content' },
    { id: 'hate-speech', label: 'Hate Speech', description: 'Discriminatory or offensive language' },
    { id: 'violence', label: 'Violence', description: 'Threatening or dangerous content' },
    { id: 'inappropriate', label: 'Inappropriate Content', description: 'Adult or explicit material' },
    { id: 'copyright', label: 'Copyright Violation', description: 'Unauthorized use of content' },
    { id: 'self-harm', label: 'Self-Harm', description: 'Content promoting harm to oneself' },
    { id: 'scam', label: 'Scam or Fraud', description: 'Deceptive or fraudulent activity' },
    { id: 'other', label: 'Other', description: 'Something else' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      return;
    }

    setSubmitting(true);
    try {
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to submit a report');
      }

      // Insert report into database
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_type: contentType,
        reported_id: contentId,
        reason: reason,
        description: details.trim() || null,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      // Show success state
      setSubmitted(true);

      // Auto-close after showing thank you message
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Report submission error:', error);
      alert(error.message || 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  // Show thank you message after successful submission
  if (submitted) {
    return (
      <motion.div 
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className={styles.reportModal}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="thank-you-title"
        >
          <div className={styles.thankYouContainer}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3 id="thank-you-title">Thank You!</h3>
            <p>Your report has been submitted successfully. Our team will review it and take appropriate action.</p>
            <p className={styles.subText}>Reports are typically reviewed within 24-48 hours.</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className={styles.reportModal}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="report-modal-title">Report {contentType}</h3>
          <button 
            className={styles.closeBtn} 
            onClick={onClose} 
            aria-label="Close report modal"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <fieldset className={styles.reasonsFieldset}>
            <legend>Why are you reporting this {contentType}?</legend>
            
            <div className={styles.radioGroup}>
              {reportReasons.map((reasonOption) => (
                <label 
                  key={reasonOption.id} 
                  className={`${styles.radioLabel} ${reason === reasonOption.id ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reasonOption.id}
                    checked={reason === reasonOption.id}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={submitting}
                  />
                  <div className={styles.radioContent}>
                    <span className={styles.radioTitle}>{reasonOption.label}</span>
                    <span className={styles.radioDescription}>{reasonOption.description}</span>
                  </div>
                  <span className={styles.radioIndicator}></span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.formGroup}>
            <label htmlFor="report-details">Additional details (optional)</label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional information that might help us understand the issue..."
              rows={4}
              maxLength={1000}
              aria-describedby="details-char-count"
              disabled={submitting}
            />
            <div id="details-char-count" className={styles.charCount}>
              {details.length}/1000
            </div>
          </div>

          <div className={styles.reportInfo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p>
              Your report helps keep our community safe. If someone is in immediate danger, 
              please contact local emergency services.
            </p>
          </div>

          <div className={styles.formActions}>
            <button 
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={styles.btnSubmit}
              disabled={!reason || submitting}
            >
              {submitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
});

ReportModal.displayName = 'ReportModal';
ReportModal.propTypes = {
  contentType: PropTypes.string.isRequired,
  contentId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReportModal;
