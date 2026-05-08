/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║      FOCUS SOVEREIGN SUPPORT HUB — v2.0                         ║
 * ║  "No user should ever feel helpless or ignored."                 ║
 * ║  Responsive · Intelligent · Emotionally Supportive              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import styles from './SupportCenter.module.css';

const SUPPORT_CATEGORIES = [
  { id: 'fake_account', label: 'Fake Account', icon: '🎭', color: '#ef4444', desc: 'Report impersonation or fake profiles', route: '/support/new?type=fake_account', priority: 'high' },
  { id: 'harassment', label: 'Harassment', icon: '🛡️', color: '#f97316', desc: 'Bullying, threats, or targeted attacks', route: '/support/new?type=harassment', priority: 'high' },
  { id: 'suspicious', label: 'Suspicious Behavior', icon: '⚠️', color: '#F59E0B', desc: 'Unusual or threatening activity', route: '/support/new?type=suspicious', priority: 'medium' },
  { id: 'teen_safety', label: 'Teen Safety', icon: '👶', color: '#ec4899', desc: 'Concerns about minors\' safety', route: '/support/new?type=teen_safety', priority: 'critical' },
  { id: 'bug', label: 'Bug / Technical Issue', icon: '🐛', color: '#8b5cf6', desc: 'App errors or broken features', route: '/support/new?type=bug', priority: 'normal' },
  { id: 'appeal', label: 'Moderation Appeal', icon: '⚖️', color: '#3B82F6', desc: 'Contest a content moderation decision', route: '/support/new?type=appeal', priority: 'normal' },
  { id: 'recovery', label: 'Account Recovery', icon: '🔑', color: '#10B981', desc: 'Regain access to your account', route: '/support/new?type=recovery', priority: 'high' },
  { id: 'emergency', label: '🚨 Emergency', icon: '🆘', color: '#ef4444', desc: 'Immediate danger or safety threat', route: '/support/new?type=emergency', priority: 'critical' },
];

const TICKET_MOCK = [
  { id: 'TKT-00412', type: 'harassment', status: 'in_progress', created: '2 days ago', updated: '3 hrs ago', priority: 'high' },
  { id: 'TKT-00398', type: 'bug', status: 'resolved', created: '5 days ago', updated: '1 day ago', priority: 'normal' },
];

const STATUS_COLORS = { in_progress: '#F59E0B', resolved: '#10B981', pending: '#8b5cf6', closed: '#94a3b8' };
const STATUS_LABELS = { in_progress: 'In Progress', resolved: 'Resolved', pending: 'Pending Review', closed: 'Closed' };

const CategoryCard = ({ cat, onClick }) => (
  <button
    className={`${styles.catCard} ${cat.priority === 'critical' ? styles.catCritical : cat.priority === 'high' ? styles.catHigh : ''}`}
    onClick={() => onClick(cat)}
    style={{ '--cat-color': cat.color }}
  >
    {cat.priority === 'critical' && <span className={styles.urgentBadge}>URGENT</span>}
    <span className={styles.catIcon}>{cat.icon}</span>
    <div className={styles.catInfo}>
      <h3>{cat.label}</h3>
      <p>{cat.desc}</p>
    </div>
    <span className={styles.catArrow}>→</span>
  </button>
);

const TicketCard = ({ ticket }) => {
  const cat = SUPPORT_CATEGORIES.find(c => c.id === ticket.type);
  const statusColor = STATUS_COLORS[ticket.status] || '#94a3b8';

  return (
    <div className={styles.ticketCard}>
      <div className={styles.ticketHeader}>
        <span className={styles.ticketId}>{ticket.id}</span>
        <div className={styles.ticketStatus} style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}12` }}>
          <span className={styles.ticketStatusDot} style={{ background: statusColor }} />
          {STATUS_LABELS[ticket.status]}
        </div>
      </div>
      <div className={styles.ticketBody}>
        <span className={styles.ticketType}>{cat?.icon} {cat?.label || ticket.type}</span>
        <div className={styles.ticketDates}>
          <span>Created {ticket.created}</span>
          <span>•</span>
          <span>Updated {ticket.updated}</span>
        </div>
      </div>
    </div>
  );
};

const SupportCenter = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);

  const handleCatClick = (cat) => {
    if (cat.id === 'emergency') {
      setActiveTab('emergency');
    } else {
      navigate(cat.route);
    }
  };

  const filteredCats = SUPPORT_CATEGORIES.filter(c =>
    !searchQuery || c.label.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell>
      <div className={styles.page}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroBadge}>💙 FOCUS SUPPORT</div>
          <h1 className={styles.heroTitle}>How can we <span className={styles.heroAccent}>help you?</span></h1>
          <p className={styles.heroSub}>Our team is here for you — every report is read by a real human within 24 hours.</p>

          {/* Search */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* Promise Pillars */}
          <div className={styles.promisePillars}>
            {[
              { icon: '⚡', label: 'Fast Response', sub: 'Avg 2 hr reply' },
              { icon: '🧑', label: 'Real Humans', sub: 'No bots' },
              { icon: '🔒', label: 'Confidential', sub: 'Privacy protected' },
              { icon: '❤️', label: 'Caring Support', sub: 'We listen' },
            ].map(p => (
              <div key={p.label} className={styles.promisePillar}>
                <span className={styles.promiseIcon}>{p.icon}</span>
                <span className={styles.promiseLabel}>{p.label}</span>
                <span className={styles.promiseSub}>{p.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Nav */}
        <div className={styles.tabBar}>
          {[
            { id: 'home', label: 'Get Help', icon: '🏠' },
            { id: 'tickets', label: 'My Reports', icon: '📋' },
            { id: 'emergency', label: '🚨 Emergency', icon: '' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''} ${tab.id === 'emergency' ? styles.tabEmergency : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <div className={styles.homeContent}>
            <div className={styles.sectionHeader}>
              <h2>What do you need help with?</h2>
              <p>Select a category to get started. Our AI will pre-route your request to the right team.</p>
            </div>

            <div className={styles.categoriesGrid}>
              {filteredCats.map(cat => (
                <CategoryCard key={cat.id} cat={cat} onClick={handleCatClick} />
              ))}
              {filteredCats.length === 0 && (
                <div className={styles.noResults}>
                  <span>🔍</span>
                  <p>No categories match "{searchQuery}". Try different keywords.</p>
                  <button className={styles.contactBtn} onClick={() => navigate('/support/new')}>
                    Submit a General Request
                  </button>
                </div>
              )}
            </div>

            {/* Smart Routing Banner */}
            <div className={styles.routingBanner}>
              <div className={styles.routingIcon}>🧠</div>
              <div>
                <h3>AI-Assisted Smart Routing</h3>
                <p>Our system automatically categorizes your request and routes it to the specialist team best equipped to help — moderation, security, technical, or teen safety.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TICKETS TAB ── */}
        {activeTab === 'tickets' && (
          <div className={styles.ticketsContent}>
            <div className={styles.ticketsHeader}>
              <h2>Your Support History</h2>
              <button className={styles.newTicketBtn} onClick={() => navigate('/support/new')}>
                + New Request
              </button>
            </div>

            {TICKET_MOCK.length > 0 ? (
              <div className={styles.ticketsList}>
                {TICKET_MOCK.map(t => <TicketCard key={t.id} ticket={t} />)}
              </div>
            ) : (
              <div className={styles.emptyTickets}>
                <span>📭</span>
                <p>No support requests yet. We hope that means everything is going great!</p>
              </div>
            )}

            <div className={styles.ticketsNote}>
              <span>ℹ️</span>
              <p>All reports are reviewed by trained human moderators. We aim to respond within 24 hours for standard requests and within 2 hours for urgent safety matters.</p>
            </div>
          </div>
        )}

        {/* ── EMERGENCY TAB ── */}
        {activeTab === 'emergency' && (
          <div className={styles.emergencyContent}>
            <div className={styles.emergencyHero}>
              <div className={styles.emergencyPulse}>🆘</div>
              <h2>Emergency Support</h2>
              <p>If you or someone you know is in immediate danger, please contact your local emergency services first.</p>
            </div>

            <div className={styles.emergencyOptions}>
              {[
                { icon: '🚔', title: 'Physical Danger', desc: 'Someone is threatening you offline', action: 'Call 911 or local emergency', external: true },
                { icon: '🧠', title: 'Mental Health Crisis', desc: 'Feeling overwhelmed or unsafe', action: 'Call a Crisis Line (988 in US)', external: true },
                { icon: '👶', title: 'Child Safety Emergency', desc: 'A minor is in immediate danger', action: 'Report to Focus Safety Team', route: '/support/new?type=emergency&sub=child' },
                { icon: '🎭', title: 'Predator / Grooming', desc: 'Suspicious adult targeting a teen', action: 'Escalate to Teen Safety Team', route: '/support/new?type=teen_safety&sub=predator' },
                { icon: '🔐', title: 'Account Hijacked', desc: 'Someone has taken over your account', action: 'Emergency Account Recovery', route: '/support/new?type=recovery&sub=hijack' },
              ].map(opt => (
                <div key={opt.title} className={styles.emergencyOption}>
                  <span className={styles.emergOptIcon}>{opt.icon}</span>
                  <div className={styles.emergOptInfo}>
                    <h3>{opt.title}</h3>
                    <p>{opt.desc}</p>
                  </div>
                  <button
                    className={styles.emergOptBtn}
                    onClick={() => opt.route ? navigate(opt.route) : null}
                    style={opt.external ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' } : {}}
                  >
                    {opt.action}
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.emergencyPanicMode}>
              <div className={styles.panicHeader}>
                <span>🔴</span>
                <div>
                  <h3>Emergency Protection Mode</h3>
                  <p>Instantly locks your account, alerts our safety team, and preserves all evidence.</p>
                </div>
              </div>
              <button className={styles.panicBtn} onClick={() => navigate('/support/new?type=emergency&mode=panic')}>
                Activate Emergency Mode
              </button>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
};

export default SupportCenter;
