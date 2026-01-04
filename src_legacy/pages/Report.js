import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import RadioGroup from '../components/RadioGroup';
import ConfirmDialog from '../components/ConfirmDialog';
import { supabase } from '../supabaseClient';
import './Report.css';

// Report reasons array
const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or misleading', icon: '🚫' },
  { id: 'harassment', label: 'Harassment or bullying', icon: '😠' },
  { id: 'hate_speech', label: 'Hate speech or symbols', icon: '⚠️' },
  { id: 'violence', label: 'Violence or dangerous content', icon: '🔴' },
  { id: 'nudity', label: 'Nudity or sexual content', icon: '🔞' },
  { id: 'false_info', label: 'False information', icon: '❌' },
  { id: 'intellectual_property', label: 'Intellectual property violation', icon: '©️' },
  { id: 'other', label: 'Other', icon: '💭' }
];

/**
 * Report - Report content or users
 * Features:
 * - Report reason selection
 * - Additional details textarea
 * - Submit button
 * - Confirmation message
 * 
 * Components:
 * - Layout
 * - RadioGroup
 * - ConfirmDialog
 * 
 * Hooks: None
 * Utils: None
 * Data: reasons array
 * Layout: Simple form, centered
 */
export default function Report({ user, userProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get report target from state or search params
  const reportTarget = location.state?.reportTarget || {
    type: searchParams.get('type') || 'post', // 'post', 'user', 'comment', 'message'
    id: searchParams.get('id'),
    contentOwnerId: searchParams.get('userId')
  };

  // State
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (!user) {
      setError('You must be logged in to report content');
      return;
    }

    if (!reportTarget.id) {
      setError('Invalid report target');
      return;
    }

    setShowConfirmDialog(true);
  };

  // Confirm and submit report
  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    setError(null);

    try {
      // Insert report into database
      const { data, error: reportError } = await supabase
        .from('reports')
        .insert([
          {
            reporter_id: user.id,
            reported_type: reportTarget.type,
            reported_id: reportTarget.id,
            reported_user_id: reportTarget.contentOwnerId,
            reason: selectedReason,
            details: additionalDetails.trim() || null,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (reportError) throw reportError;

      // Show success message
      setShowSuccessMessage(true);

      // Reset form
      setSelectedReason('');
      setAdditionalDetails('');

      // Redirect after a delay
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 2500);

    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel confirmation dialog
  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Get display name for report target
  const getTargetDisplayName = () => {
    const typeMap = {
      post: 'post',
      user: 'user',
      comment: 'comment',
      message: 'message',
      boltz: 'boltz'
    };
    return typeMap[reportTarget.type] || 'content';
  };

  return (
    <Layout layoutType="centered">
      <div className="report-page">
        <div className="report-container">
          {/* Header */}
          <div className="report-header">
            <button
              className="back-button"
              onClick={handleBack}
              aria-label="Go back"
              disabled={loading}
            >
              ← Back
            </button>
            <h1 className="report-title">Report {getTargetDisplayName()}</h1>
            <p className="report-subtitle">
              Help us keep Focus safe by reporting content that violates our community guidelines
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="success-message" role="alert">
              <span className="success-icon">✓</span>
              <div>
                <h3>Report submitted successfully</h3>
                <p>Thank you for helping keep our community safe. We'll review your report shortly.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message" role="alert">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Report Form */}
          {!showSuccessMessage && (
            <form className="report-form" onSubmit={handleSubmit}>
              {/* Reason Selection */}
              <div className="form-section">
                <label className="form-label" htmlFor="report-reason">
                  Why are you reporting this? <span className="required">*</span>
                </label>
                <RadioGroup
                  name="report-reason"
                  options={REPORT_REASONS}
                  value={selectedReason}
                  onChange={setSelectedReason}
                  disabled={loading}
                />
              </div>

              {/* Additional Details */}
              <div className="form-section">
                <label className="form-label" htmlFor="additional-details">
                  Additional details (optional)
                </label>
                <textarea
                  id="additional-details"
                  className="details-textarea"
                  placeholder="Provide any additional context that might help us review this report..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  maxLength={1000}
                  rows={6}
                  disabled={loading}
                  aria-describedby="char-count"
                />
                <div className="char-count" id="char-count">
                  {additionalDetails.length} / 1000 characters
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !selectedReason}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>

              {/* Info Footer */}
              <div className="report-info">
                <p>
                  <strong>What happens next?</strong>
                </p>
                <ul>
                  <li>Your report will be reviewed by our moderation team</li>
                  <li>Reports are confidential and anonymous</li>
                  <li>You may be contacted if additional information is needed</li>
                  <li>We'll take appropriate action based on our community guidelines</li>
                </ul>
              </div>
            </form>
          )}
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={showConfirmDialog}
          title="Submit Report?"
          message="Are you sure you want to submit this report? This action cannot be undone."
          onConfirm={handleConfirmSubmit}
          onCancel={handleCancelSubmit}
        />
      </div>
    </Layout>
  );
}
