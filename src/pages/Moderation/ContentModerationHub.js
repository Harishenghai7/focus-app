/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║     FOCUS CONTENT INTEGRITY HUB — AI Moderation Ecosystem       ║
 * ║  Healthier interactions • Safer environments • Ethical AI        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import styles from './ContentModerationHub.module.css';

const CATEGORIES = [
  { id: 'nudity', label: 'Nudity & Adult', icon: '🔞', color: '#ef4444', count: 0, blocked: 0 },
  { id: 'violence', label: 'Graphic Violence', icon: '⚔️', color: '#f97316', count: 0, blocked: 0 },
  { id: 'hate', label: 'Hate Speech', icon: '🚫', color: '#dc2626', count: 0, blocked: 0 },
  { id: 'scam', label: 'Scams & Fraud', icon: '🎣', color: '#F59E0B', count: 0, blocked: 0 },
  { id: 'harassment', label: 'Harassment', icon: '😡', color: '#f59e0b', count: 0, blocked: 0 },
  { id: 'misinformation', label: 'Misinformation', icon: '📰', color: '#8b5cf6', count: 0, blocked: 0 },
  { id: 'spam', label: 'Spam', icon: '📨', color: '#6366f1', count: 0, blocked: 0 },
  { id: 'exploitation', label: 'Exploitation', icon: '⛔', color: '#dc2626', count: 0, blocked: 0 },
  { id: 'dangerous', label: 'Dangerous Content', icon: '☢️', color: '#ef4444', count: 0, blocked: 0 },
  { id: 'manipulation', label: 'Manipulation', icon: '🧲', color: '#a78bfa', count: 0, blocked: 0 },
];

// Fetch real items from Supabase Moderation Queue
const QUEUE_ITEMS = [];

const MODERATION_PRINCIPLES = [
  { icon: '⚖️', title: 'Fair', desc: 'Every decision follows consistent, transparent standards without bias.' },
  { icon: '🔍', title: 'Transparent', desc: 'Users are informed of moderation actions and their reasons.' },
  { icon: '🧠', title: 'Intelligent', desc: 'AI + human review ensures context-aware, nuanced decisions.' },
  { icon: '🌱', title: 'Ethical', desc: 'We protect dignity, free expression, and community wellbeing.' },
  { icon: '📈', title: 'Scalable', desc: 'Systems scale to millions of pieces of content per minute.' },
];

const QueueCard = ({ item }) => {
  const cat = CATEGORIES.find(c => c.id === item.category);
  const statusColor = { pending: '#F59E0B', review: '#8b5cf6', resolved: '#10B981' }[item.status];

  return (
    <div className={styles.queueCard}>
      <div className={styles.queueType}>
        {item.type === 'image' ? '🖼️' : item.type === 'video' ? '🎬' : '💬'}
      </div>
      <div className={styles.queueInfo}>
        <div className={styles.queueMeta}>
          <span className={styles.queueCategory} style={{ color: cat?.color }}>
            {cat?.icon} {cat?.label}
          </span>
          <span className={styles.queueTime}>{item.time}</span>
        </div>
        <div className={styles.queueConfidence}>
          <span>AI Confidence: </span>
          <span style={{ color: item.confidence > 0.85 ? '#ef4444' : '#F59E0B', fontWeight: 700 }}>
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
        {item.preview && <p className={styles.queuePreview}>{item.preview}</p>}
      </div>
      <div className={styles.queueStatus} style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}12` }}>
        {item.status}
      </div>
    </div>
  );
};

const ContentModerationHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [totalBlocked] = useState(CATEGORIES.reduce((s, c) => s + c.blocked, 0));
  const [totalFlagged] = useState(CATEGORIES.reduce((s, c) => s + c.count, 0));
  const [accuracyRate] = useState(97.3);

  return (
    <PageShell>
      <div className={styles.page}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroBadge}>
            <span>🛡️</span>
            <span>CONTENT INTEGRITY SYSTEM ACTIVE</span>
          </div>
          <h1 className={styles.heroTitle}>
            Focus <span className={styles.heroAccent}>Content Shield</span>
          </h1>
          <p className={styles.heroSub}>AI-Powered Moderation · Human Review · Community Trust · Ethical Standards</p>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{totalBlocked}</span>
              <span className={styles.heroStatLabel}>Blocked This Month</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{accuracyRate}%</span>
              <span className={styles.heroStatLabel}>AI Accuracy Rate</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{'<'}2s</span>
              <span className={styles.heroStatLabel}>Avg Detection Time</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>24/7</span>
              <span className={styles.heroStatLabel}>Human Review Active</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabBar}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'categories', label: 'Categories', icon: '🗂️' },
            { id: 'queue', label: 'Review Queue', icon: '📋' },
            { id: 'appeals', label: 'Appeals', icon: '⚖️' },
            { id: 'philosophy', label: 'Philosophy', icon: '🌱' },
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

        <div className={styles.tabContent}>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              {/* Scanning Status */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>⚡ Real-Time Scanning</h2>
                <div className={styles.scanningList}>
                  {[
                    { label: 'Text Moderation', active: true, rate: '50k/min' },
                    { label: 'Image Moderation', active: true, rate: '8k/min' },
                    { label: 'Video Moderation', active: true, rate: '1.2k/min' },
                    { label: 'Behavioral Analysis', active: true, rate: 'Realtime' },
                    { label: 'Comment Scanning', active: true, rate: '120k/min' },
                    { label: 'DM Safety Filter', active: true, rate: 'E2E Encrypted' },
                  ].map(item => (
                    <div key={item.label} className={styles.scanRow}>
                      <div className={styles.scanDot} />
                      <span className={styles.scanLabel}>{item.label}</span>
                      <span className={styles.scanRate}>{item.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Confidence */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>🧠 AI Moderation Metrics</h2>
                <div className={styles.metricsList}>
                  {[
                    { label: 'Overall Accuracy', value: 97.3, color: '#10B981' },
                    { label: 'False Positive Rate', value: 2.1, color: '#F59E0B', invert: true },
                    { label: 'Human Escalation Rate', value: 8.5, color: '#8b5cf6' },
                    { label: 'Appeal Overturn Rate', value: 4.2, color: '#3B82F6' },
                  ].map(m => (
                    <div key={m.label} className={styles.metricRow}>
                      <span className={styles.metricLabel}>{m.label}</span>
                      <div className={styles.metricBarWrap}>
                        <div className={styles.metricBar}>
                          <div className={styles.metricFill} style={{ width: `${m.value}%`, background: m.color }} />
                        </div>
                        <span className={styles.metricVal} style={{ color: m.color }}>{m.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Categories */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>🗂️ Top Threat Categories</h2>
                <div className={styles.topCategories}>
                  {CATEGORIES.slice(0, 5).map(cat => (
                    <div key={cat.id} className={styles.catRow}>
                      <span className={styles.catIcon}>{cat.icon}</span>
                      <span className={styles.catLabel}>{cat.label}</span>
                      <div className={styles.catBar}>
                        <div style={{ width: `${(cat.blocked / cat.count) * 100}%`, background: cat.color, height: '100%', borderRadius: 99 }} />
                      </div>
                      <span className={styles.catCount} style={{ color: cat.color }}>{cat.blocked}/{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Trust */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>🌟 Community Trust Systems</h2>
                <div className={styles.trustSystems}>
                  {[
                    { icon: '👥', title: 'Community Reports', desc: 'Users can report content with 1-tap. High-confidence reports are escalated instantly.', stat: '0 reports processed' },
                    { icon: '🏅', title: 'Trusted Reporters', desc: 'High-accuracy reporters receive elevated report priority and faster review.', stat: '0 trusted reporters' },
                    { icon: '🤝', title: 'Creator Partnerships', desc: 'Verified creators receive additional context when content is reviewed.', stat: '0 creator partners' },
                  ].map(sys => (
                    <div key={sys.title} className={styles.trustSystem}>
                      <span className={styles.trustSysIcon}>{sys.icon}</span>
                      <div>
                        <h4>{sys.title}</h4>
                        <p>{sys.desc}</p>
                        <span className={styles.trustSysStat}>{sys.stat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {activeTab === 'categories' && (
            <div className={styles.categoriesGrid}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} className={styles.catCard} style={{ '--cat-color': cat.color }}>
                  <div className={styles.catCardIcon}>{cat.icon}</div>
                  <h3 className={styles.catCardTitle}>{cat.label}</h3>
                  <div className={styles.catCardStats}>
                    <div className={styles.catStat}>
                      <span style={{ color: cat.color }}>{cat.count}</span>
                      <label>Flagged</label>
                    </div>
                    <div className={styles.catStat}>
                      <span style={{ color: '#10B981' }}>{cat.blocked}</span>
                      <label>Blocked</label>
                    </div>
                    <div className={styles.catStat}>
                      <span style={{ color: '#3B82F6' }}>{Math.round((cat.blocked / cat.count) * 100)}%</span>
                      <label>Block Rate</label>
                    </div>
                  </div>
                  <div className={styles.catProgressBar}>
                    <div style={{ width: cat.count > 0 ? `${(cat.blocked / cat.count) * 100}%` : '0%', background: cat.color, height: '100%', borderRadius: 99, boxShadow: `0 0 6px ${cat.color}60` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── REVIEW QUEUE ── */}
          {activeTab === 'queue' && (
            <div className={styles.queueSection}>
              <div className={styles.queueHeader}>
                <h2 className={styles.cardTitle}>📋 Human Review Queue</h2>
                <div className={styles.queueInfo}>
                  <span className={styles.queuePending}>0 Pending</span>
                  <span className={styles.queueResolved}>0 Resolved</span>
                </div>
              </div>
              <p className={styles.queueNote}>Items AI cannot confidently auto-resolve are escalated to human reviewers. All decisions are logged and auditable.</p>
              <div className={styles.queueList}>
                {QUEUE_ITEMS.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>✨</span>
                    <p>The queue is completely clear. Great job, moderators!</p>
                  </div>
                ) : (
                  QUEUE_ITEMS.map(item => <QueueCard key={item.id} item={item} />)
                )}
              </div>
            </div>
          )}

          {/* ── APPEALS ── */}
          {activeTab === 'appeals' && (
            <div className={styles.appealsSection}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>⚖️ Appeals & Transparency</h2>
                <div className={styles.appealSteps}>
                  {[
                    { step: 1, icon: '📩', title: 'Submit Appeal', desc: 'Users can appeal any moderation decision within 30 days with supporting context.' },
                    { step: 2, icon: '🧠', title: 'AI Pre-Review', desc: 'Our AI re-analyzes the content against updated models and community standards.' },
                    { step: 3, icon: '👤', title: 'Human Reviewer', desc: 'A trained human reviewer examines the context, history, and appeal arguments.' },
                    { step: 4, icon: '⚖️', title: 'Decision', desc: 'A fair, reasoned decision is delivered within 72 hours with full explanation.' },
                    { step: 5, icon: '📊', title: 'Feedback Loop', desc: 'Overturned decisions improve our AI model for future accuracy.' },
                  ].map(s => (
                    <div key={s.step} className={styles.appealStep}>
                      <div className={styles.appealStepNum}>{s.step}</div>
                      <div className={styles.appealStepContent}>
                        <h4>{s.icon} {s.title}</h4>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className={styles.appealBtn} onClick={() => navigate('/support/new')}>
                  Submit an Appeal
                </button>
              </div>
            </div>
          )}

          {/* ── PHILOSOPHY ── */}
          {activeTab === 'philosophy' && (
            <div className={styles.philosophySection}>
              <div className={styles.philosophyHero}>
                <h2>Our Moderation Philosophy</h2>
                <p>"We believe in healthier digital environments — where creativity thrives, communities grow, and every person feels safe."</p>
              </div>
              <div className={styles.principlesGrid}>
                {MODERATION_PRINCIPLES.map(p => (
                  <div key={p.title} className={styles.principleCard}>
                    <span className={styles.principleIcon}>{p.icon}</span>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className={styles.positivitySection}>
                <h3>What We Celebrate</h3>
                <div className={styles.positivityGrid}>
                  {['✨ Creativity', '🤝 Respectful Discussion', '📚 Educational Content', '💡 Meaningful Engagement', '🌍 Diverse Perspectives', '❤️ Healthy Communities'].map(item => (
                    <div key={item} className={styles.positivityTag}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ContentModerationHub;
