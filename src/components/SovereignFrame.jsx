/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔱 SOVEREIGN FRAME — Phase 2 Step 2: Camera Overlay with Alignment Feedback
 * Glassmorphism card frame with animated corners, edge detection glow, and
 * real-time alignment guidance for Trust Shield ID capture.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useState } from 'react';
import styles from './SovereignFrame.module.css';

const SovereignFrame = ({
  isActive = true,
  alignmentScore = 0, // 0-100
  sharpness = 0,      // 0-100
  luminance = 0,      // 0-100
  isScanning = false,
  documentDetected = false,
  ageGroup = '18+',   // '13-17' | '18+'
}) => {
  const [glowIntensity, setGlowIntensity] = useState(0);

  // Dynamic glow based on alignment quality
  useEffect(() => {
    const score = Math.min(100, Math.max(0, (sharpness + luminance + alignmentScore) / 3));
    setGlowIntensity(score / 100);
  }, [alignmentScore, sharpness, luminance]);

  const getAlignmentStatus = () => {
    if (documentDetected && sharpness > 80 && luminance > 60) {
      return { text: 'Perfect — Hold steady', color: '#22c55e', icon: '✨' };
    }
    if (sharpness < 50) return { text: 'Too blurry — hold steady', color: '#f59e0b', icon: '📷' };
    if (luminance < 50) return { text: 'Too dark — find more light', color: '#f59e0b', icon: '💡' };
    if (!documentDetected) return { text: 'Align ID within frame', color: '#a855f7', icon: '🎯' };
    return { text: 'Hold steady...', color: '#38bdf8', icon: '⏳' };
  };

  const status = getAlignmentStatus();

  return (
    <div className={styles.sovereignContainer} data-active={isActive}>
      {/* Main Frame with Glassmorphism */}
      <div
        className={styles.sovereignFrame}
        style={{
          boxShadow: `0 0 ${40 + glowIntensity * 60}px rgba(139, 92, 246, ${0.2 + glowIntensity * 0.4})`,
          borderColor: `rgba(${documentDetected ? '34, 197, 94' : '139, 92, 246'}, ${0.3 + glowIntensity * 0.5})`,
        }}
      >
        {/* Animated Corner Accents */}
        <div className={`${styles.corner} ${styles.cornerTL}`}>
          <div
            className={styles.cornerGlow}
            style={{
              opacity: glowIntensity,
              background: documentDetected
                ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            }}
          />
        </div>
        <div className={`${styles.corner} ${styles.cornerTR}`}>
          <div
            className={styles.cornerGlow}
            style={{
              opacity: glowIntensity,
              background: documentDetected
                ? 'linear-gradient(225deg, #22c55e, #4ade80)'
                : 'linear-gradient(225deg, #8b5cf6, #ec4899)',
            }}
          />
        </div>
        <div className={`${styles.corner} ${styles.cornerBL}`}>
          <div
            className={styles.cornerGlow}
            style={{
              opacity: glowIntensity,
              background: documentDetected
                ? 'linear-gradient(45deg, #22c55e, #4ade80)'
                : 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            }}
          />
        </div>
        <div className={`${styles.corner} ${styles.cornerBR}`}>
          <div
            className={styles.cornerGlow}
            style={{
              opacity: glowIntensity,
              background: documentDetected
                ? 'linear-gradient(315deg, #22c55e, #4ade80)'
                : 'linear-gradient(315deg, #8b5cf6, #ec4899)',
            }}
          />
        </div>

        {/* Inner ID Card Guide */}
        <div
          className={styles.idCardGuide}
          style={{
            opacity: 0.3 + glowIntensity * 0.4,
            borderColor: documentDetected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className={styles.idCardInner}>
            <span className={styles.idCardIcon}>
              {ageGroup === '13-17' ? '🎓' : '🪪'}
            </span>
            <span className={styles.idCardLabel}>
              {ageGroup === '13-17' ? 'Student ID' : 'Government ID'}
            </span>
          </div>
        </div>

        {/* Scanning Beam Animation */}
        {isScanning && (
          <div className={styles.scanBeam}>
            <div className={styles.scanBeamLine} />
          </div>
        )}
      </div>

      {/* Alignment Status HUD */}
      <div className={styles.alignmentHud}>
        <div
          className={styles.statusPill}
          style={{
            background: `rgba(${documentDetected ? '34, 197, 94' : '139, 92, 246'}, 0.15)`,
            borderColor: `rgba(${documentDetected ? '34, 197, 94' : '139, 92, 246'}, 0.4)`,
            color: status.color,
          }}
        >
          <span className={styles.statusIcon}>{status.icon}</span>
          <span className={styles.statusText}>{status.text}</span>
        </div>

        {/* Quality Meters */}
        <div className={styles.qualityMeters}>
          <QualityMeter label="Sharpness" value={sharpness} color="#22c55e" />
          <QualityMeter label="Lighting" value={luminance} color="#f59e0b" />
          <QualityMeter label="Alignment" value={alignmentScore} color="#8b5cf6" />
        </div>
      </div>

      {/* Edge Detection Glow Effect */}
      <div
        className={styles.edgeGlow}
        style={{
          opacity: documentDetected ? 0.6 : 0,
          background: `radial-gradient(ellipse at center, rgba(34, 197, 94, 0.3) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};

// Quality meter sub-component
const QualityMeter = ({ label, value, color }) => (
  <div className={styles.qualityMeter}>
    <div className={styles.qualityLabel}>{label}</div>
    <div className={styles.qualityBar}>
      <div
        className={styles.qualityFill}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  </div>
);

export default SovereignFrame;
