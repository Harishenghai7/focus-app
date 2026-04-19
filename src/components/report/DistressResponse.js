/**
 * DistressResponse.js
 * ===================
 * Emergency support modal shown when distress is detected
 * Features: Focusly in guardian_mode, crisis helplines, breathing exercise
 *
 * H2 Innovative — Pillar 5: Safety Net
 */

import React, { useState, useEffect } from 'react';
import FocuslyLion from '../focusly-ai/FocuslyLion';
import { CRISIS_HELPLINES } from '../../hooks/useDistressDetection';
import styles from './DistressResponse.module.css';

const BREATHING_PHASES = [
  { label: 'Breathe In', duration: 4000, color: '#7c6bfe' },
  { label: 'Hold', duration: 7000, color: '#38bdf8' },
  { label: 'Breathe Out', duration: 8000, color: '#a78bfa' },
];

const DistressResponse = ({ isOpen, onClose, tier = 'high' }) => {
  const [visible, setVisible] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathCycle, setBreathCycle] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setVisible(true), 50);
    else setVisible(false);
  }, [isOpen]);

  // Breathing exercise loop
  useEffect(() => {
    if (!showBreathing) return;
    let idx = 0;
    setBreathingPhase(0);

    const next = () => {
      idx = (idx + 1) % BREATHING_PHASES.length;
      setBreathingPhase(idx);
    };

    const timers = [];
    let elapsed = 0;
    BREATHING_PHASES.forEach((phase, i) => {
      timers.push(setTimeout(() => {
        setBreathingPhase(i);
        setBreathCycle(c => !c);
      }, elapsed));
      elapsed += phase.duration;
    });

    const interval = setInterval(() => {
      elapsed = 0;
      BREATHING_PHASES.forEach((phase, i) => {
        timers.push(setTimeout(() => setBreathingPhase(i), elapsed));
        elapsed += phase.duration;
      });
    }, BREATHING_PHASES.reduce((s, p) => s + p.duration, 0));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [showBreathing]);

  if (!isOpen) return null;

  const phase = BREATHING_PHASES[breathingPhase];
  const isCritical = tier === 'critical';

  return (
    <div className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}>
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ''}`}>

        {/* Close — only for medium/low tier */}
        {!isCritical && (
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        )}

        {/* Focusly in guardian_mode */}
        <div className={styles.lionWrap}>
          <FocuslyLion emotion="guardian_mode" gesture="protective" className={styles.lion} />
          <div className={styles.shield}>🛡️</div>
        </div>

        <div className={styles.badge} style={{ background: isCritical ? 'rgba(239,68,68,0.12)' : 'rgba(124,107,254,0.12)', borderColor: isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(124,107,254,0.4)', color: isCritical ? '#f87171' : '#a78bfa' }}>
          {isCritical ? '🚨 Immediate Support Available' : '💜 Focusly is Here'}
        </div>

        <h2 className={styles.title}>You are not alone.</h2>

        <p className={styles.message}>
          {isCritical
            ? "Focusly noticed something concerning. Please reach out — there are real people here who care and real professionals ready to listen."
            : "It sounds like you're going through something difficult. That takes courage to share. Focusly is right here with you. 💜"}
        </p>

        {/* Helplines */}
        <div className={styles.helplinesSection}>
          <p className={styles.helplineTitle}>📞 Reach Out Right Now</p>
          <div className={styles.helplines}>
            {CRISIS_HELPLINES.map((h, i) => (
              <div key={i} className={styles.helpline}>
                <span className={styles.helplineFlag}>{h.flag}</span>
                <div className={styles.helplineInfo}>
                  <strong>{h.name}</strong>
                  {h.number && (
                    <a href={`tel:${h.number}`} className={styles.helplineNumber}>
                      📞 {h.number}
                    </a>
                  )}
                  {h.url && (
                    <a href={h.url} target="_blank" rel="noopener noreferrer" className={styles.helplineNumber}>
                      🌐 Open Chat
                    </a>
                  )}
                  <small>{h.available}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breathing exercise toggle */}
        {!showBreathing ? (
          <button className={styles.breathBtn} onClick={() => setShowBreathing(true)}>
            🌬️ Try a Breathing Exercise
          </button>
        ) : (
          <div className={styles.breathingBox}>
            <div
              className={styles.breathCircle}
              style={{
                borderColor: phase.color,
                boxShadow: `0 0 30px ${phase.color}40`,
                transform: breathingPhase === 0 ? 'scale(1.2)' : breathingPhase === 1 ? 'scale(1.2)' : 'scale(1)',
                transition: `transform ${phase.duration}ms ease-in-out, border-color 0.5s`,
              }}
            >
              <span className={styles.breathLabel}>{phase.label}</span>
              <span className={styles.breathCount}>
                {breathingPhase === 0 ? '4s' : breathingPhase === 1 ? '7s' : '8s'}
              </span>
            </div>
            <p className={styles.breathingInstruction}>4-7-8 Breathing Technique</p>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={onClose}>
            💜 I'm okay — Continue
          </button>
          {isCritical && (
            <p className={styles.disclaimer}>
              Our team has been notified and will check in with you shortly. You matter. 🦁
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistressResponse;
