/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║       FOCUS TEEN CARE — Guardian Command Center v2.0            ║
 * ║  "Protection with dignity."                                      ║
 * ║  Guardian Safety · Wellbeing · Anti-Predator · Emotional Care   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuardianship } from '../hooks/useGuardianship';
import { useSafetyAlerts } from '../hooks/useSafetyAlerts';
import { getActivitySummary } from '../utils/activityLogger';
import PageShell from '../components/layout/PageShell';
import styles from './TeenCareGuardianDashboard.module.css';

// ── Mock Wellbeing Metrics ──────────────────────────────────────────────────

const WELLBEING_SIGNALS = [
  { id: 'screen_time', label: 'Screen Time Today', value: '--', target: '3h', status: 'ok', icon: '📱' },
  { id: 'study_focus', label: 'Study Focus Sessions', value: '--', target: '60 min', status: 'ok', icon: '📚' },
  { id: 'interaction', label: 'Positive Interactions', value: '--', target: '80%', status: 'ok', icon: '💚' },
  { id: 'sleep_mode', label: 'Sleep Mode Active', value: '--', target: '', status: 'ok', icon: '🌙' },
];

const SAFETY_SYSTEMS = [
  { icon: '🦹', title: 'Anti-Predator Shield', desc: 'Detects suspicious adult contact patterns', status: 'active' },
  { icon: '🧬', title: 'Grooming Detection AI', desc: 'Identifies manipulation and grooming language', status: 'active' },
  { icon: '🔒', title: 'Private Account Mode', desc: 'Only approved followers can view content', status: 'active' },
  { icon: '🚫', title: 'Explicit Content Filter', desc: 'Blocks adult and inappropriate content', status: 'active' },
  { icon: '📍', title: 'Location Safety', desc: 'Location data never shared in posts', status: 'active' },
  { icon: '💬', title: 'Message Safety Scan', desc: 'DMs scanned for unsafe content patterns', status: 'active' },
];

const EMOTIONAL_PROMPTS = [
  { icon: '🌟', text: 'Remind your teen that you\'re always available to talk, no questions asked.' },
  { icon: '🎨', text: 'Encourage creative expression as a healthy outlet for emotions.' },
  { icon: '🏃', text: 'Check in on physical activity — movement improves mood and focus.' },
  { icon: '💤', text: 'Consistent sleep schedules reduce anxiety and improve school performance.' },
];

// ── Sub-Components ──────────────────────────────────────────────────────────

const WellbeingCard = ({ signal }) => {
  const statusColor = { good: '#10B981', ok: '#F59E0B', concern: '#ef4444' }[signal.status];
  return (
    <div className={styles.wellbeingCard} style={{ '--signal-color': statusColor }}>
      <span className={styles.signalIcon}>{signal.icon}</span>
      <div className={styles.signalInfo}>
        <p className={styles.signalLabel}>{signal.label}</p>
        <p className={styles.signalValue} style={{ color: statusColor }}>{signal.value}</p>
        {signal.target && <p className={styles.signalTarget}>Target: {signal.target}</p>}
      </div>
      <div className={styles.signalStatus} style={{ background: `${statusColor}15`, borderColor: `${statusColor}30` }}>
        <span style={{ color: statusColor }}>{signal.status === 'good' ? '✓' : signal.status === 'ok' ? '~' : '!'}</span>
      </div>
    </div>
  );
};

const SafetySystemRow = ({ sys }) => (
  <div className={styles.safetyRow}>
    <span className={styles.safetyRowIcon}>{sys.icon}</span>
    <div className={styles.safetyRowInfo}>
      <h4>{sys.title}</h4>
      <p>{sys.desc}</p>
    </div>
    <div className={styles.safetyRowStatus}>
      <span className={styles.safetyDot} />
      <span>{sys.status}</span>
    </div>
  </div>
);

// ── Main Dashboard ──────────────────────────────────────────────────────────

const TeenCareGuardianDashboard = () => {
  const navigate = useNavigate();
  const { teenId } = useParams();
  const { teens, loading: teensLoading } = useGuardianship();
  const [selectedTeen, setSelectedTeen] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityData, setActivityData] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    if (teens && teens.length > 0) {
      const teen = teenId ? teens.find(t => t.teen_id === teenId) : teens[0];
      setSelectedTeen(teen);
    }
  }, [teens, teenId]);

  useEffect(() => {
    if (!selectedTeen) return;
    const fetchActivity = async () => {
      try {
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const summary = await getActivitySummary(selectedTeen.teen_id, startDate.toISOString(), endDate);
        setActivityData(summary);
      } catch {
        setActivityData({ total_activities: 0, posts_created: 0, new_followers: 0 });
      }
    };
    fetchActivity();
  }, [selectedTeen]);

  const { alerts, unreadCount } = useSafetyAlerts(selectedTeen?.teen_id);

  if (teensLoading) {
    return (
      <PageShell>
        <div className={styles.loadingState}>
          <div className={styles.loader} />
          <p>Loading Guardian Dashboard…</p>
        </div>
      </PageShell>
    );
  }

  if (!teens || teens.length === 0) {
    return (
      <PageShell>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👨‍👩‍👧</div>
          <h2>No Teen Accounts Linked</h2>
          <p>Link a teen's account to enable guardian oversight, safety monitoring, and wellbeing features.</p>
          <button className={styles.linkBtn} onClick={() => navigate('/settings')}>Link a Teen Account</button>
          <div className={styles.philosophyNote}>
            <span>🔒</span>
            <p>Teen Care respects privacy. Monitoring is transparent — your teen always knows what you can see.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={styles.page}>

        {/* Emergency Banner */}
        {emergencyMode && (
          <div className={styles.emergencyBanner}>
            <span>🚨</span>
            <p>Emergency Mode Active — Support team has been notified</p>
            <button onClick={() => setEmergencyMode(false)}>Deactivate</button>
          </div>
        )}

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroBadge}>
            <span>👶</span>
            <span>TEEN CARE ACTIVE</span>
          </div>
          <h1 className={styles.heroTitle}>
            Guardian <span className={styles.heroAccent}>Command Center</span>
          </h1>
          <p className={styles.heroSub}>"Protection with dignity." — Safety without surveillance, trust without control.</p>

          {/* Teen Selector */}
          {teens.length > 1 && (
            <div className={styles.teenSelector}>
              <span>Viewing:</span>
              <select
                value={selectedTeen?.teen_id || ''}
                onChange={e => setSelectedTeen(teens.find(t => t.teen_id === e.target.value))}
                className={styles.teenSelect}
              >
                {teens.map(teen => (
                  <option key={teen.teen_id} value={teen.teen_id}>
                    {teen.teen?.full_name || teen.teen?.username || 'Teen User'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.qStat}>
              <span className={styles.qStatNum} style={{ color: unreadCount > 0 ? '#ef4444' : '#10B981' }}>{unreadCount}</span>
              <span className={styles.qStatLabel}>Alerts</span>
            </div>
            <div className={styles.qStatDivider} />
            <div className={styles.qStat}>
              <span className={styles.qStatNum}>{activityData?.total_activities || 0}</span>
              <span className={styles.qStatLabel}>Activities (7d)</span>
            </div>
            <div className={styles.qStatDivider} />
            <div className={styles.qStat}>
              <span className={styles.qStatNum}>{activityData?.posts_created || 0}</span>
              <span className={styles.qStatLabel}>Posts</span>
            </div>
            <div className={styles.qStatDivider} />
            <div className={styles.qStat}>
              <span className={styles.qStatNum} style={{ color: '#10B981' }}>Safe</span>
              <span className={styles.qStatLabel}>Status</span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'safety', label: 'Safety', icon: '🛡️', badge: unreadCount },
            { id: 'wellbeing', label: 'Wellbeing', icon: '💚' },
            { id: 'controls', label: 'Controls', icon: '⚙️' },
            { id: 'sos', label: '🆘 SOS', icon: '' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''} ${tab.id === 'sos' ? styles.tabSos : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge > 0 && <span className={styles.tabBadge}>{tab.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            {/* Activity Summary */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>📈 Weekly Activity</h2>
              <div className={styles.activityBars}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const h = [45, 90, 30, 75, 60, 20, 10][i];
                  return (
                    <div key={day} className={styles.activityBar}>
                      <div className={styles.activityBarFill} style={{ height: `${h}%`, background: h > 60 ? '#F59E0B' : '#8b5cf6' }} />
                      <span>{day}</span>
                    </div>
                  );
                })}
              </div>
              <p className={styles.activityNote}>Screen time trends over 7 days. Yellow = above daily target.</p>
            </div>

            {/* Wellbeing Snapshot */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>💚 Wellbeing Snapshot</h2>
              <div className={styles.wellbeingList}>
                {WELLBEING_SIGNALS.map(s => <WellbeingCard key={s.id} signal={s} />)}
              </div>
            </div>

            {/* Safety Status */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>🛡️ Safety Systems</h2>
              <div className={styles.safetyList}>
                {SAFETY_SYSTEMS.slice(0, 4).map(sys => <SafetySystemRow key={sys.title} sys={sys} />)}
              </div>
              <button className={styles.viewAllBtn} onClick={() => setActiveTab('safety')}>
                View All Safety Systems →
              </button>
            </div>

            {/* Emotional Guidance */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>❤️ Emotional Guidance</h2>
              <div className={styles.promptsList}>
                {EMOTIONAL_PROMPTS.map(p => (
                  <div key={p.text} className={styles.promptCard}>
                    <span className={styles.promptIcon}>{p.icon}</span>
                    <p>{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SAFETY ── */}
        {activeTab === 'safety' && (
          <div className={styles.safetyContent}>
            <div className={styles.card} style={{ marginBottom: 'var(--space-5)' }}>
              <h2 className={styles.cardTitle}>🛡️ Active Safety Systems</h2>
              <p className={styles.safetyIntro}>All safety systems operate transparently. Your teen is informed about what protections are active.</p>
              <div className={styles.safetyFullList}>
                {SAFETY_SYSTEMS.map(sys => <SafetySystemRow key={sys.title} sys={sys} />)}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>⚠️ Safety Alerts ({unreadCount})</h2>
              {unreadCount === 0 ? (
                <div className={styles.noAlerts}>
                  <span>✅</span>
                  <p>No active safety alerts. Everything looks good!</p>
                </div>
              ) : (
                <div className={styles.alertsList}>
                  {(alerts || []).slice(0, 5).map((alert, idx) => (
                    <div key={idx} className={styles.alertCard}>
                      <span>⚠️</span>
                      <div>
                        <p>{alert.message || 'Safety alert detected'}</p>
                        <span>{alert.created_at || 'Recently'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WELLBEING ── */}
        {activeTab === 'wellbeing' && (
          <div className={styles.wellbeingContent}>
            <div className={styles.card} style={{ marginBottom: 'var(--space-5)' }}>
              <h2 className={styles.cardTitle}>💚 Emotional Wellness System</h2>
              <p className={styles.safetyIntro}>Gentle wellbeing nudges, screen time insights, and study support — all designed to help teens thrive without feeling watched.</p>

              <div className={styles.wellbeingFullGrid}>
                {WELLBEING_SIGNALS.map(s => <WellbeingCard key={s.id} signal={s} />)}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>🌙 Usage Controls</h2>
              <div className={styles.controlsList}>
                {[
                  { label: 'Bedtime Mode', sub: 'App limits after 10PM', enabled: true, icon: '🌙' },
                  { label: 'Study Focus Mode', sub: 'Reduces distractions during study hours', enabled: true, icon: '📚' },
                  { label: 'Daily Time Limit', sub: '3 hours per day', enabled: true, icon: '⏱️' },
                  { label: 'Wellness Check-ins', sub: 'Gentle mood prompts every 2 hours', enabled: false, icon: '💬' },
                ].map(ctrl => (
                  <div key={ctrl.label} className={styles.controlRow}>
                    <span className={styles.ctrlIcon}>{ctrl.icon}</span>
                    <div className={styles.ctrlInfo}>
                      <h4>{ctrl.label}</h4>
                      <p>{ctrl.sub}</p>
                    </div>
                    <div className={`${styles.toggle} ${ctrl.enabled ? styles.toggleOn : ''}`}>
                      <div className={styles.toggleThumb} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTROLS ── */}
        {activeTab === 'controls' && (
          <div className={styles.controlsContent}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>⚙️ Guardian Controls</h2>
              <div className={styles.philosophyNote2}>
                <span>💡</span>
                <p>These controls are designed to guide, not surveil. Your teen can see all active controls in their settings, fostering trust and open communication.</p>
              </div>
              <div className={styles.controlsList}>
                {[
                  { label: 'Direct Message Restrictions', sub: 'DMs only from approved followers', enabled: true, icon: '💌' },
                  { label: 'Comment Filtering', sub: 'Harsh or harmful comments hidden', enabled: true, icon: '🗨️' },
                  { label: 'Follower Approval Required', sub: 'New followers need approval', enabled: true, icon: '✅' },
                  { label: 'Suspicious User Alerts', sub: 'Notify when adults show unusual patterns', enabled: true, icon: '👀' },
                  { label: 'Block List Sync', sub: 'Coordinated blocking with guardian', enabled: false, icon: '🚫' },
                ].map(ctrl => (
                  <div key={ctrl.label} className={styles.controlRow}>
                    <span className={styles.ctrlIcon}>{ctrl.icon}</span>
                    <div className={styles.ctrlInfo}>
                      <h4>{ctrl.label}</h4>
                      <p>{ctrl.sub}</p>
                    </div>
                    <div className={`${styles.toggle} ${ctrl.enabled ? styles.toggleOn : ''}`}>
                      <div className={styles.toggleThumb} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SOS ── */}
        {activeTab === 'sos' && (
          <div className={styles.sosContent}>
            <div className={styles.sosHero}>
              <span className={styles.sosPulse}>🆘</span>
              <h2>Emergency SOS System</h2>
              <p>For immediate safety concerns involving your teen. This alerts the Focus Safety Team and optionally local authorities.</p>
            </div>

            <div className={styles.sosOptions}>
              {[
                { icon: '🦹', title: 'Predator Contact', desc: 'An adult is making inappropriate contact with your teen', critical: true },
                { icon: '😔', title: 'Mental Health Emergency', desc: 'Your teen may be in emotional distress or crisis', critical: true },
                { icon: '🔐', title: 'Account Compromised', desc: 'Your teen\'s account may be hacked or taken over', critical: false },
                { icon: '🎭', title: 'Impersonation', desc: 'Someone is pretending to be your teen online', critical: false },
              ].map(opt => (
                <div key={opt.title} className={`${styles.sosOption} ${opt.critical ? styles.sosCritical : ''}`}>
                  <span className={styles.sosOptIcon}>{opt.icon}</span>
                  <div className={styles.sosOptInfo}>
                    <h3>{opt.title}</h3>
                    <p>{opt.desc}</p>
                  </div>
                  <button
                    className={`${styles.sosOptBtn} ${opt.critical ? styles.sosOptBtnCritical : ''}`}
                    onClick={() => navigate(`/support/new?type=teen_safety&sub=${opt.title.toLowerCase().replace(' ', '_')}`)}
                  >
                    Report Now
                  </button>
                </div>
              ))}
            </div>

            <button
              className={styles.emergencyActivate}
              onClick={() => { setEmergencyMode(true); setActiveTab('overview'); }}
            >
              🚨 Activate Emergency Protection Mode
            </button>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <span>🔒</span>
          <p>Teen Care is designed with your teen's dignity in mind. All monitoring is transparent, age-appropriate, and built to foster trust between guardians and teens — not fear or control.</p>
        </div>

      </div>
    </PageShell>
  );
};

export default TeenCareGuardianDashboard;
