import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './ReportModal.css';

export default function ReportModal({ reportType, reportedId, reportedUser, currentUser, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    'Spam',
    'Harassment or bullying',
    'False information',
    'Hate speech or symbols',
    'Violence or dangerous content',
    'Intellectual property violation',
    'Sale of illegal goods',
    'Nudity or sexual activity',
    'Suicide or self-injury',
    'Scam or fraud',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert('Please select a reason');
      return;
    }

    setSubmitting(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        reported_type: reportType,
        reported_id: reportedId,
        reason: reason,
        description: description.trim() || null
      });

      alert('Thank you for your report. We will review it as soon as possible.');
      onClose();
    } catch (error) {
      console.error('Report error:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="report-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Report {reportType === 'user' ? `@${reportedUser?.username}` : reportType}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>Why are you reporting this?</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Select a reason...</option>
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about what happened..."
              rows={4}
              maxLength={500}
            />
            <div className="char-count">{description.length}/500</div>
          </div>

          <div className="report-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p>Your report is anonymous. If someone is in immediate danger, call local emergency services.</p>
          </div>

          <div className="form-actions">
            <button 
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-submit"
              disabled={!reason || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
