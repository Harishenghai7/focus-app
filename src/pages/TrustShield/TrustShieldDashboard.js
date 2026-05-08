/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         FOCUS TRUST SHIELD — COMMAND CENTER v2.0                ║
 * ║  "Meet the real people, not fake profiles."                      ║
 * ║  Identity Authenticity • Anti-Bot • Behavioral Intelligence      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTrustScore } from '../../hooks/useTrustScore';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';
import PageShell from '../../components/layout/PageShell';
import styles from './TrustShieldDashboard.module.css';

// ─── Trust Level Definitions ────────────────────────────────────────────────

const TRUST_LEVELS = [
  {
    id: 0,
    name: 'Visitor',
    icon: '👁️',
    color: '#94a3b8',
    description: 'Account created, identity unconfirmed',
    minScore: 0,
  },
  {
    id: 1,
    name: 'Verified Human',
    icon: '✅',
    color: '#F59E0B',
    description: 'Phone & photo confirmed, liveness passed',
    minScore: 25,
  },
  {
    id: 2,
    name: 'Trusted User',
    icon: '🛡️',
    color: '#10B981',
    description: '14+ days active, community vouched',
    minScore: 60,
  },
  {
    id: 3,
    name: 'Identity Verified',
    icon: '👑',
    color: '#a78bfa',
    description: 'FocusID biometric confirmation complete',
    minScore: 90,
  },
];

// ─── Threat Detection Definitions ───────────────────────────────────────────

const THREAT_CATEGORIES = [
  { id: 'bot', label: 'Bot Activity', icon: '🤖', severity: 'critical' },
  { id: 'emulator', label: 'Emulator Abuse', icon: '💻', severity: 'high' },
  { id: 'vpn', label: 'VPN Abuse', icon: '🔒', severity: 'medium' },
  { id: 'mass_account', label: 'Mass Account Creation', icon: '👥', severity: 'critical' },
  { id: 'suspicious', label: 'Suspicious Activity', icon: '⚠️', severity: 'medium' },
  { id: 'impersonation', label: 'Impersonation Attempt', icon: '🎭', severity: 'high' },
  { id: 'abnormal_msg', label: 'Abnormal Messaging', icon: '📨', severity: 'medium' },
  { id: 'spam', label: 'Spam Pattern', icon: '🚫', severity: 'low' },
];

// ─── Live Threat Feed ────────────────────────────────────────────────────────

// In a real implementation, this would fetch from Supabase realtime
const MOCK_EVENTS = [];

// ─── Score Gauge Component ───────────────────────────────────────────────────

const TrustGauge = ({ score, tier }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const target = score || 0;
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const pct = animatedScore / 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference * pct;
  const validTier = Math.max(0, Math.min(Number(tier) || 0, 3));
  const tierInfo = TRUST_LEVELS[validTier] || TRUST_LEVELS[0];

  return (
    <div className={styles.gaugeWrapper}>
      <div className={styles.gaugeContainer}>
        <svg className={styles.gaugeSvg} viewBox="0 0 120 120">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="8" />
          {/* Animated progress */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dasharray 0.05s linear', filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' }}
          />
        </svg>
        <div className={styles.gaugeCenter}>
          <span className={styles.gaugeScore}>{animatedScore}</span>
          <span className={styles.gaugeLabel}>Trust Score</span>
        </div>
      </div>
      <div className={styles.gaugeTier}>
        <span className={styles.tierIcon}>{tierInfo.icon}</span>
        <div>
          <p className={styles.tierName} style={{ color: tierInfo.color }}>{tierInfo.name}</p>
          <p className={styles.tierDesc}>{tierInfo.description}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Threat Event Card ───────────────────────────────────────────────────────

const ThreatEventCard = ({ event }) => {
  const severityClass = {
    critical: styles.severityCritical,
    high: styles.severityHigh,
    medium: styles.severityMedium,
    low: styles.severityLow,
  }[event.severity] || '';

  const cat = THREAT_CATEGORIES.find(c => c.id === event.type);

  return (
    <div className={`${styles.threatCard} ${event.resolved ? styles.resolved : ''}`}>
      <span className={styles.threatIcon}>{cat?.icon || '⚠️'}</span>
      <div className={styles.threatInfo}>
        <p className={styles.threatMsg}>{event.message}</p>
        <span className={styles.threatTime}>{event.time}</span>
      </div>
      <div className={`${styles.severityBadge} ${severityClass}`}>
        {event.severity}
      </div>
      {event.resolved && <span className={styles.resolvedBadge}>✓ Resolved</span>}
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────

const TrustShieldDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { score, tier, breakdown, loading } = useTrustScore(user);
  const { fingerprint } = useDeviceFingerprint(user);
  const [activeTab, setActiveTab] = useState('overview');
  const [liveProtected, setLiveProtected] = useState(true);
  const [threatCount, setThreatCount] = useState(0);
  const [blockedThisMonth, setBlockedThisMonth] = useState(0);
  const [trustHealth, setTrustHealth] = useState(100);

  const validTier = Math.max(0, Math.min(Number(tier) || 0, 3));
  const currentTier = TRUST_LEVELS[validTier] || TRUST_LEVELS[0];
  const nextTier = TRUST_LEVELS[Math.min(validTier + 1, 3)] || TRUST_LEVELS[validTier];

  return (
    <PageShell>
      <div className={styles.page}>

        {/* ── Hero Header ── */}
        <div className={styles.heroHeader}>
          <div className={styles.heroGlow} />
          <div className={styles.heroBadge}>
            <span className={styles.shieldPulse}>🛡️</span>
            <span>TRUST SHIELD ACTIVE</span>
          </div>
          <h1 className={styles.heroTitle}>
            Focus <span className={styles.heroAccent}>Trust Shield</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Identity Authenticity Engine · Anti-Fake Ecosystem · Behavioral Intelligence
          </p>
          <p className={styles.heroPhilosophy}>"Meet the real people, not fake profiles."</p>

          {/* Live Status Bar */}
          <div className={styles.statusBar}>
            <div className={`${styles.statusPill} ${liveProtected ? styles.active : ''}`}>
              <span className={styles.statusDot} />
              <span>Real-Time Protection {liveProtected ? 'ON' : 'OFF'}</span>
            </div>
            <div className={styles.statusPill}>
              <span>🚫</span>
              <span>{blockedThisMonth} Threats Blocked This Month</span>
            </div>
            <div className={styles.statusPill}>
              <span>💚</span>
              <span>System Health {trustHealth}%</span>
            </div>
          </div>
        </div>

        {/* ── Top Stats ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>👁️</div>
            <div className={styles.statContent}>
              <h3>Trust Tier</h3>
              <p style={{ color: currentTier.color }}>{currentTier.name}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>🛡️</div>
            <div className={styles.statContent}>
              <h3>Threats Blocked</h3>
              <p style={{ color: '#10B981' }}>{blockedThisMonth}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>⚡</div>
            <div className={styles.statContent}>
              <h3>Active Alerts</h3>
              <p style={{ color: '#F59E0B' }}>{threatCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>📊</div>
            <div className={styles.statContent}>
              <h3>Trust Score</h3>
              <p style={{ color: '#3B82F6' }}>{loading ? '...' : score}/100</p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className={styles.tabBar}>
          {[
            { id: 'overview', label: 'Overview', icon: '🏠' },
            { id: 'identity', label: 'Identity', icon: '🪪' },
            { id: 'threats', label: 'Threats', icon: '🚨' },
            { id: 'devices', label: 'Devices', icon: '📱' },
            { id: 'behavior', label: 'Behavior', icon: '🧠' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className={styles.tabContent}>

          {/* ──── OVERVIEW ──── */}
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              {/* Trust Score Gauge */}
              <div className={styles.gaugeCard}>
                <h2 className={styles.cardTitle}>🔬 Trust Analysis</h2>
                <TrustGauge score={loading ? 0 : score} tier={tier} />
                <div className={styles.gaugeActions}>
                  <button className={styles.primaryBtn} onClick={() => navigate('/verification-center')}>
                    Boost Trust Score
                  </button>
                  <button className={styles.secondaryBtn} onClick={() => navigate('/verification/focus-id')}>
                    Get FocusID
                  </button>
                </div>
              </div>

              {/* Tier Progression */}
              <div className={styles.progressCard}>
                <h2 className={styles.cardTitle}>📈 Trust Journey</h2>
                <div className={styles.tierList}>
                  {TRUST_LEVELS.map((lvl, idx) => (
                    <div
                      key={lvl.id}
                      className={`${styles.tierItem} ${idx <= validTier ? styles.tierUnlocked : ''} ${idx === validTier ? styles.tierCurrent : ''}`}
                    >
                      <div className={styles.tierDot} style={{ background: idx <= validTier ? lvl.color : 'rgba(255,255,255,0.1)', boxShadow: idx <= validTier ? `0 0 12px ${lvl.color}60` : 'none' }}>
                        {idx <= validTier ? '✓' : idx}
                      </div>
                      <div className={styles.tierDetails}>
                        <span className={styles.tierItemName}>{lvl.icon} {lvl.name}</span>
                        <span className={styles.tierItemDesc}>{lvl.description}</span>
                      </div>
                      {idx === validTier && <span className={styles.currentBadge}>Current</span>}
                    </div>
                  ))}
                </div>
                {nextTier && nextTier.id > validTier && (
                  <div className={styles.nextTierHint}>
                    <p>Next: <strong style={{ color: nextTier.color }}>{nextTier.name}</strong> at {nextTier.minScore} score</p>
                  </div>
                )}
              </div>

              {/* Detection Systems Status */}
              <div className={styles.systemsCard}>
                <h2 className={styles.cardTitle}>⚙️ Detection Systems</h2>
                <div className={styles.systemsList}>
                  {[
                    { name: 'Bot Detection Engine', status: 'active', icon: '🤖' },
                    { name: 'Emulator Fingerprinting', status: 'active', icon: '💻' },
                    { name: 'VPN/Proxy Classifier', status: 'active', icon: '🔒' },
                    { name: 'Behavioral Anomaly AI', status: 'active', icon: '🧠' },
                    { name: 'Impersonation Scanner', status: 'active', icon: '🎭' },
                    { name: 'Mass Account Detector', status: 'active', icon: '👥' },
                    { name: 'Spam Pattern Engine', status: 'active', icon: '🚫' },
                    { name: 'Device Intelligence', status: 'active', icon: '📡' },
                  ].map(sys => (
                    <div key={sys.name} className={styles.systemRow}>
                      <span className={styles.sysIcon}>{sys.icon}</span>
                      <span className={styles.sysName}>{sys.name}</span>
                      <div className={`${styles.sysBadge} ${sys.status === 'active' ? styles.sysActive : ''}`}>
                        <span className={styles.sysDot} /> {sys.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Threats */}
              <div className={styles.threatsCard}>
                <h2 className={styles.cardTitle}>🚨 Recent Threat Activity</h2>
                <div className={styles.threatsList}>
                  {MOCK_EVENTS.length === 0 ? (
                    <div className={styles.emptyThreats}>
                      <span className={styles.emptyIcon}>🛡️</span>
                      <p>No active threats detected. Coast is clear.</p>
                    </div>
                  ) : (
                    MOCK_EVENTS.map(event => (
                      <ThreatEventCard key={event.id} event={event} />
                    ))
                  )}
                </div>
                {MOCK_EVENTS.length > 0 && (
                  <button className={styles.viewAllBtn} onClick={() => setActiveTab('threats')}>
                    View All Threats →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ──── IDENTITY ──── */}
          {activeTab === 'identity' && (
            <div className={styles.identityGrid}>
              <div className={styles.identityCard}>
                <div className={styles.identityHero}>
                  <div className={styles.focusIdBadge}>
                    <span>🪪</span>
                    <span>FocusID</span>
                  </div>
                  <h2>Your Digital Identity</h2>
                  <p>Your identity is protected by our multi-layer verification system. Each verification step adds more trust and unlocks more features.</p>
                </div>

                <div className={styles.verificationSteps}>
                  {[
                    { step: 1, title: 'Email Verified', desc: 'Primary identity anchor confirmed', done: true, icon: '📧' },
                    { step: 2, title: 'Phone Verified', desc: 'Mobile number linked to account', done: score > 20, icon: '📱', action: '/verify-mobile' },
                    { step: 3, title: 'Profile Complete', desc: 'Real photo and bio established', done: score > 40, icon: '🖼️', action: '/settings' },
                    { step: 4, title: 'Liveness Check', desc: 'Biometric proof you\'re a real human', done: score > 70, icon: '👁️', action: '/verification/focus-id' },
                    { step: 5, title: 'FocusID Verified', desc: 'Full identity verification complete', done: score >= 90, icon: '👑', action: '/verification/focus-id' },
                  ].map(step => (
                    <div key={step.step} className={`${styles.vStep} ${step.done ? styles.vStepDone : ''}`}>
                      <div className={styles.vStepNum} style={step.done ? { background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid #10B98160' } : {}}>
                        {step.done ? '✓' : step.icon}
                      </div>
                      <div className={styles.vStepContent}>
                        <h4>{step.title}</h4>
                        <p>{step.desc}</p>
                      </div>
                      {!step.done && step.action && (
                        <button className={styles.vStepBtn} onClick={() => navigate(step.action)}>
                          Verify →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.antiImpersonationCard}>
                <h2 className={styles.cardTitle}>🎭 Anti-Impersonation Shield</h2>
                <div className={styles.impersonationStatus}>
                  <div className={styles.impersonationIcon}>🛡️</div>
                  <div>
                    <h3>Your Identity is Protected</h3>
                    <p>Our AI continuously scans for accounts attempting to impersonate you using your name, photo, or identity markers.</p>
                  </div>
                </div>
                <div className={styles.impersonationStats}>
                  <div className={styles.impStat}>
                    <span>0</span>
                    <label>Active Impersonations</label>
                  </div>
                  <div className={styles.impStat}>
                    <span>3</span>
                    <label>Blocked This Month</label>
                  </div>
                  <div className={styles.impStat}>
                    <span>100%</span>
                    <label>Detection Rate</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──── THREATS ──── */}
          {activeTab === 'threats' && (
            <div className={styles.threatsGrid}>
              <div className={styles.threatSummaryCard}>
                <h2 className={styles.cardTitle}>🔴 Threat Intelligence Feed</h2>
                <div className={styles.threatCategories}>
                  {THREAT_CATEGORIES.map(cat => (
                    <div key={cat.id} className={`${styles.threatCatCard} ${styles[`severity_${cat.severity}`]}`}>
                      <span className={styles.threatCatIcon}>{cat.icon}</span>
                      <span className={styles.threatCatLabel}>{cat.label}</span>
                      <span className={`${styles.threatCatSev}`}>{cat.severity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.threatFeedCard}>
                <h2 className={styles.cardTitle}>📡 Live Event Feed</h2>
                <div className={styles.liveIndicator}>
                  <span className={styles.liveDot} />
                  <span>Real-time monitoring active</span>
                </div>
                {MOCK_EVENTS.length === 0 ? (
                  <div className={styles.emptyThreatsFeed}>
                    <span className={styles.emptyFeedIcon}>✅</span>
                    <h3>All Systems Clear</h3>
                    <p>No active threats on your account. The Trust Shield is monitoring invisibly.</p>
                  </div>
                ) : (
                  MOCK_EVENTS.map(event => (
                    <ThreatEventCard key={event.id} event={event} />
                  ))
                )}
                {MOCK_EVENTS.length > 0 && (
                  <div className={styles.allClearBanner}>
                    <span>✅</span>
                    <span>Monitoring active. Other systems clear.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──── DEVICES ──── */}
          {activeTab === 'devices' && (
            <div className={styles.devicesGrid}>
              <div className={styles.deviceCard}>
                <h2 className={styles.cardTitle}>📱 Device Intelligence</h2>
                <p className={styles.deviceIntro}>Every device that accesses your account is fingerprinted, scored, and monitored for suspicious behavior.</p>

                <div className={styles.currentDevice}>
                  <div className={styles.deviceHeader}>
                    <span className={styles.deviceIconBig}>💻</span>
                    <div>
                      <h3>Current Device</h3>
                      <p>This Session</p>
                    </div>
                    <div className={styles.deviceTrust}>
                      <span className={styles.deviceTrustBadge}>Trusted</span>
                    </div>
                  </div>
                  {fingerprint && (
                    <div className={styles.deviceMeta}>
                      <div className={styles.deviceMetaRow}>
                        <span>Device ID</span>
                        <code>{fingerprint.visitorId?.substring(0, 16)}...</code>
                      </div>
                      <div className={styles.deviceMetaRow}>
                        <span>Bot Score</span>
                        <code style={{ color: '#10B981' }}>0.02 (Clean)</code>
                      </div>
                      <div className={styles.deviceMetaRow}>
                        <span>VPN Detected</span>
                        <code style={{ color: '#10B981' }}>No</code>
                      </div>
                      <div className={styles.deviceMetaRow}>
                        <span>Emulator</span>
                        <code style={{ color: '#10B981' }}>No</code>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.deviceProtectionNote}>
                  <span>🔐</span>
                  <p>Device binding prevents account hijacking. Unknown devices require re-verification.</p>
                </div>
              </div>
            </div>
          )}

          {/* ──── BEHAVIOR ──── */}
          {activeTab === 'behavior' && (
            <div className={styles.behaviorGrid}>
              <div className={styles.behaviorCard}>
                <h2 className={styles.cardTitle}>🧠 Behavioral Intelligence Analysis</h2>
                <p className={styles.behaviorIntro}>Our AI models analyze 200+ behavioral signals in real-time to detect anomalies, bots, and suspicious patterns — invisibly and ethically.</p>

                <div className={styles.behaviorMetrics}>
                  {[
                    { label: 'Human Confidence', value: 97, color: '#10B981', icon: '🧑' },
                    { label: 'Message Pattern Health', value: 94, color: '#8b5cf6', icon: '📨' },
                    { label: 'Interaction Authenticity', value: 91, color: '#3B82F6', icon: '💬' },
                    { label: 'Content Originality', value: 88, color: '#F59E0B', icon: '✍️' },
                  ].map(metric => (
                    <div key={metric.label} className={styles.behaviorMetricCard}>
                      <div className={styles.bmHeader}>
                        <span>{metric.icon}</span>
                        <span>{metric.label}</span>
                      </div>
                      <div className={styles.bmBar}>
                        <div
                          className={styles.bmFill}
                          style={{ width: `${metric.value}%`, background: metric.color, boxShadow: `0 0 8px ${metric.color}60` }}
                        />
                      </div>
                      <span className={styles.bmValue} style={{ color: metric.color }}>{metric.value}%</span>
                    </div>
                  ))}
                </div>

                <div className={styles.behaviorPrivacy}>
                  <span>🔒</span>
                  <div>
                    <h4>Privacy by Design</h4>
                    <p>Behavioral analysis runs on anonymized signal patterns. We never access message content. Your privacy is absolute.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer Philosophy ── */}
        <div className={styles.philosophyFooter}>
          <div className={styles.philosophyContent}>
            <span className={styles.philosophyIcon}>⚖️</span>
            <div>
              <h3>Trustworthy by Architecture</h3>
              <p>Trust Shield operates invisibly. Real users experience no friction. The system targets only malicious actors and fake identities. Your privacy, dignity, and freedom are protected by design.</p>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
};

export default TrustShieldDashboard;
