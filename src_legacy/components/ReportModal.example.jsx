/**
 * ReportModal Usage Examples
 * 
 * This file demonstrates how to use the ReportModal component
 * in different scenarios throughout the application.
 */

import React, { useState } from 'react';
import ReportModal from './ReportModal';

// Example 1: Report a Post
export function ReportPostExample({ postId }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowReportModal(true)}>
        Report Post
      </button>

      {showReportModal && (
        <ReportModal
          contentType="post"
          contentId={postId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

// Example 2: Report a Comment
export function ReportCommentExample({ commentId }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowReportModal(true)}>
        Report Comment
      </button>

      {showReportModal && (
        <ReportModal
          contentType="comment"
          contentId={commentId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

// Example 3: Report a User
export function ReportUserExample({ userId }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowReportModal(true)}>
        Report User
      </button>

      {showReportModal && (
        <ReportModal
          contentType="user"
          contentId={userId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

// Example 4: Report with Dropdown Menu Integration
export function ReportWithDropdownExample({ contentType, contentId }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleReportClick = () => {
    setShowDropdown(false);
    setShowReportModal(true);
  };

  return (
    <>
      <div className="dropdown">
        <button onClick={() => setShowDropdown(!showDropdown)}>
          ⋯
        </button>

        {showDropdown && (
          <div className="dropdown-menu">
            <button onClick={handleReportClick}>
              🚩 Report {contentType}
            </button>
            {/* Other menu items */}
          </div>
        )}
      </div>

      {showReportModal && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

// Example 5: Using with Framer Motion AnimatePresence
import { AnimatePresence } from 'framer-motion';

export function ReportWithAnimationExample({ contentType, contentId }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowReportModal(true)}>
        Report
      </button>

      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            contentType={contentType}
            contentId={contentId}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Example 6: Conditional Report Button
export function ConditionalReportExample({ content, currentUserId }) {
  const [showReportModal, setShowReportModal] = useState(false);

  // Don't show report button for own content
  if (content.authorId === currentUserId) {
    return null;
  }

  return (
    <>
      <button 
        onClick={() => setShowReportModal(true)}
        className="report-button"
        aria-label={`Report this ${content.type}`}
      >
        Report
      </button>

      {showReportModal && (
        <ReportModal
          contentType={content.type}
          contentId={content.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

/**
 * Props Reference:
 * 
 * @param {string} contentType - Type of content being reported
 *   Examples: 'post', 'comment', 'user', 'message', 'boltz', etc.
 * 
 * @param {string} contentId - Unique identifier of the content
 *   This should be the database ID of the item being reported
 * 
 * @param {function} onClose - Callback function to close the modal
 *   Called when user clicks cancel, close button, or after successful submission
 * 
 * Features:
 * - Radio button selection for report reasons
 * - Optional additional details textarea
 * - Validation before submission
 * - Thank you message after successful report
 * - Smooth animations with Framer Motion
 * - Accessible keyboard navigation
 * - Responsive mobile design
 * - Dark mode support
 * 
 * Report Reasons Available:
 * - Spam
 * - Harassment
 * - False Information
 * - Hate Speech
 * - Violence
 * - Inappropriate Content
 * - Copyright Violation
 * - Self-Harm
 * - Scam or Fraud
 * - Other
 */
