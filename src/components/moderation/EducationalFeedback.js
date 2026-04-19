/**
 * EducationalFeedback.js
 * ======================
 * "Education over Erasure" — shown when content is blocked
 * Focusly AI explains WHY a post was blocked with empathy
 *
 * H2 Innovative — Content Constitution
 */

import React, { useEffect, useState } from 'react';
import FocuslyLion from '../focusly-ai/FocuslyLion';
import styles from './EducationalFeedback.module.css';

const VIOLATION_ICONS = {
  hate_speech:     { icon: '🚫', color: '#ef4444', label: 'Hate Speech' },
  propaganda:      { icon: '📢', color: '#f59e0b', label: 'Misleading Content' },
  self_harm:       { icon: '💜', color: '#8b5cf6', label: 'Safety Concern' },
  violence:        { icon: '⚠️', color: '#ef4444', label: 'Violence' },
  nsfw:            { icon: '🔞', color: '#ef4444', label: 'Inappropriate Content' },
  spam:            { icon: '📵', color: '#f59e0b', label: 'Spam' },
  personal_attack: { icon: '💬', color: '#f59e0b', label: 'Personal Attack' },
  negative_loop:   { icon: '🌀', color: '#6366f1', label: 'Toxic Energy' },
};

const EducationalFeedback = ({
  isOpen,
  violationType = 'hate_speech',
  explanation = '',
  suggestion = '',
  strikeNumber = 1,
  onEdit,
  onAcknowledge,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setVisible(true), 50);
    else setVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const violation = VIOLATION_ICONS[violationType] || VIOLATION_ICONS.hate_speech;

  const getStrikeMessage = () => {
    switch (strikeNumber) {
      case 1: return { label: 'Strike 1 of 3', message: 'First warning. Learn and grow.', color: '#f59e0b' };
      case 2: return { label: 'Strike 2 of 3 — Ghost Protocol', message: 'Your posts are invisible to others for 24 hours.', color: '#ef4444' };
      case 3: return { label: 'Strike 3 — Quarantined', message: 'Your account has been permanently restricted.', color: '#dc2626' };
      default: return { label: `Strike ${strikeNumber}`, message: 'Please review the Focus Constitution.', color: '#ef4444' };
    }
  };

  const strikeInfo = getStrikeMessage();

  return (
    <div className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}>
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ''}`}>

        {/* Lion mascot */}
        <div className={styles.lionContainer}>
          <FocuslyLion emotion="sad" gesture="concerned" className={styles.lion} />
        </div>

        {/* Violation badge */}
        <div className={styles.violationBadge} style={{ borderColor: violation.color, color: violation.color }}>
          <span>{violation.icon}</span>
          <span>{violation.label}</span>
        </div>

        <h2 className={styles.title}>Post Blocked</h2>

        {/* Strike indicator */}
        <div className={styles.strikeBadge} style={{ background: `${strikeInfo.color}18`, borderColor: `${strikeInfo.color}40` }}>
          <span className={styles.strikeLabel} style={{ color: strikeInfo.color }}>{strikeInfo.label}</span>
          <p className={styles.strikeMsg}>{strikeInfo.message}</p>
        </div>

        {/* AI Explanation */}
        <div className={styles.explanationBox}>
          <p className={styles.explanationTitle}>🦁 Focusly says:</p>
          <p className={styles.explanationText}>
            {explanation || `This content violates the Focus ${violation.label} policy. Focus is built for real people who lift each other up. Let's try again with kindness.`}
          </p>
        </div>

        {/* Suggestion */}
        {suggestion && (
          <div className={styles.suggestionBox}>
            <p className={styles.suggestionTitle}>💡 Try this instead:</p>
            <p className={styles.suggestionText}>{suggestion}</p>
          </div>
        )}

        {/* Constitution Reference */}
        <div className={styles.constitutionRef}>
          <span>📜</span>
          <span>Focus Community Constitution — Article: {violation.label}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={onEdit}>
            ✏️ Edit My Post
          </button>
          <button className={styles.acknowledgeBtn} onClick={onAcknowledge}>
            I Understand — Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationalFeedback;
