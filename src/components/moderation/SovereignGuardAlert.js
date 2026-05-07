import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocuslyLion from '../focusly-ai/FocuslyLion';
import styles from './SovereignGuardAlert.module.css';

const VIOLATION_LABELS = {
  SEVERE_TOXICITY: { icon: '🚫', label: 'Severe Toxicity' },
  HATE_SPEECH: { icon: '😢', label: 'Hate Speech' },
  PROFANITY: { icon: '💢', label: 'Profanity' },
  NSFW: { icon: '🔞', label: 'Adult Content' },
  VIOLATION: { icon: '⚠️', label: 'Violation' }
};

const getInterventionMessage = (violations) => {
  const first = (violations || [])[0];
  const type = first?.type || 'VIOLATION';

  if (type === 'SEVERE_TOXICITY') {
    return "Macha, this doesn't fit our Nation's vision. Let's keep the focus on growth and positivity. Your words have power—use them to lift others up.";
  }
  if (type === 'HATE_SPEECH') {
    return "Macha, Focus is a space where everyone belongs. Words that hurt have no place here. Let's choose kindness instead.";
  }
  if (type === 'PROFANITY') {
    return "Macha, our community appreciates thoughtful expression. There are more powerful ways to share your feelings.";
  }
  if (type === 'NSFW') {
    return "Macha, this type of content isn't aligned with our community values. Let's keep Focus a safe space for everyone.";
  }

  return "Macha, this content doesn't align with our community values. Let's keep Focus a positive space for growth.";
};

const SovereignGuardAlert = ({ isOpen, onClose, onEdit, violations = [], purityScore = 0, strikeNumber = 0 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 30);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const first = violations?.[0];
  const violationInfo = VIOLATION_LABELS[first?.type] || VIOLATION_LABELS.VIOLATION;
  const msg = getInterventionMessage(violations);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={styles.alertContainer}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.95, y: visible ? 0 : 12 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.header}>
              <div className={styles.violationBadge}>
                <span className={styles.violationIcon}>{violationInfo.icon}</span>
                <span className={styles.violationLabel}>{violationInfo.label}</span>
              </div>
              {strikeNumber > 0 && <div className={styles.strikeIndicator}>Strike {strikeNumber} of 3</div>}
            </div>

            <div className={styles.avatarSection}>
              <FocuslyLion emotion="sad" gesture="concerned" className={styles.focuslyAvatar} />
              <div className={styles.avatarGlow} />
            </div>

            <div className={styles.messageSection}>
              <h2 className={styles.title}>Focusly AI Intervention</h2>
              <p className={styles.message}>{msg}</p>
            </div>

            {violations?.length > 0 && (
              <div className={styles.violationsList}>
                <h4>Detected Issues:</h4>
                {violations.map((v, i) => (
                  <div key={i} className={styles.violationItem}>
                    <span className={styles.violationDot} />
                    {(VIOLATION_LABELS[v.type]?.label || v.type || 'Violation').toString().replace(/_/g, ' ')}
                    {typeof v.score === 'number' && (
                      <span className={styles.confidence}>{Math.round(v.score * 100)}% confidence</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.purityBar}>
              <div className={styles.purityLabel}>
                <span>Purity Score</span>
                <span className={styles.purityValue}>{Math.round(purityScore * 100)}%</span>
              </div>
              <div className={styles.purityTrack}>
                <motion.div
                  className={styles.purityFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(1, purityScore)) * 100}%` }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                />
              </div>
              {purityScore < 0.8 && <p className={styles.purityNote}>Content must score 80%+ to proceed</p>}
            </div>

            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={onEdit}>Edit My Content</button>
              <button className={styles.closeBtn} onClick={onClose}>Discard & Close</button>
            </div>

            <div className={styles.constitutionRef}>
              <span>📜</span>
              <span>Focus Community Constitution — Section 3: Respect & Growth</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SovereignGuardAlert;
