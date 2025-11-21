import React, { useState } from 'react';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import { formatNumber } from '../../utils/formatNumber';

const BoltzControls = ({ 
  boltz, 
  currentUser, 
  isLiked, 
  isSaved, 
  onLike, 
  onSave 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <div className="boltz-controls">
        {/* Like Button */}
        <button
          className={`action-btn like-btn ${isLiked ? 'active' : ''}`}
          onClick={onLike}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          aria-pressed={isLiked}
        >
          <svg viewBox="0 0 24 24" className="action-icon">
            {isLiked ? (
              <path
                fill="currentColor"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            ) : (
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            )}
          </svg>
          <span className="action-count">{formatNumber(boltz.likes)}</span>
        </button>

        {/* Comment Button */}
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(true)}
          aria-label="Comments"
        >
          <svg viewBox="0 0 24 24" className="action-icon">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            />
          </svg>
          <span className="action-count">{formatNumber(boltz.comments)}</span>
        </button>

        {/* Share Button */}
        <button
          className="action-btn share-btn"
          onClick={() => setShowShare(true)}
          aria-label="Share"
        >
          <svg viewBox="0 0 24 24" className="action-icon">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
            />
          </svg>
          <span className="action-count">Share</span>
        </button>

        {/* Save Button */}
        <button
          className={`action-btn save-btn ${isSaved ? 'active' : ''}`}
          onClick={onSave}
          aria-label={isSaved ? 'Unsave' : 'Save'}
          aria-pressed={isSaved}
        >
          <svg viewBox="0 0 24 24" className="action-icon">
            {isSaved ? (
              <path
                fill="currentColor"
                d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"
              />
            ) : (
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
              />
            )}
          </svg>
          <span className="action-count">{formatNumber(boltz.saves)}</span>
        </button>

        {/* Views */}
        <div className="action-btn views-indicator">
          <svg viewBox="0 0 24 24" className="action-icon">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span className="action-count">{formatNumber(boltz.views)}</span>
        </div>
      </div>

      {/* Modals */}
      {showComments && (
        <CommentModal
          boltz={boltz}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
        />
      )}

      {showShare && (
        <ShareModal
          boltz={boltz}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
};

export default BoltzControls;
