/**
 * My Reports — Real-time ticket tracker
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import PageShell from '../components/layout/PageShell';
import styles from './MyReports.module.css';

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#8b5cf6', icon: '🔵' },
  in_progress: { label: 'In Review', color: '#F59E0B', icon: '🟡' },
  resolved: { label: 'Resolved', color: '#10B981', icon: '✅' },
  closed: { label: 'Closed', color: '#94a3b8', icon: '⚫' },
};

const REASON_LABELS = {
  fake_account: { label: 'Fake Account', icon: '🎭' },
  harassment: { label: 'Harassment', icon: '🛡️' },
  suspicious: { label: 'Suspicious Behavior', icon: '⚠️' },
  teen_safety: { label: 'Teen Safety', icon: '👶' },
  bug: { label: 'Bug / Technical', icon: '🐛' },
  appeal: { label: 'Moderation Appeal', icon: '⚖️' },
  recovery: { label: 'Account Recovery', icon: '🔑' },
  emergency: { label: 'Emergency', icon: '🆘' },
  other: { label: 'Other', icon: '💬' },
};

const MyReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('reporter_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) setReports(data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchReports();
  }, [user?.id]);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Recently'; }
  };

  return (
    <PageShell>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Reports</h1>
            <p className={styles.subtitle}>Track the status of your submitted reports</p>
          </div>
          <button className={styles.newBtn} onClick={() => navigate('/support/new')}>
            + New Report
          </button>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'in_progress', label: 'In Review' },
            { id: 'resolved', label: 'Resolved' },
          ].map(f => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className={styles.filterCount}>
                {f.id === 'all' ? reports.length : reports.filter(r => r.status === f.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loader} />
            <p>Loading your reports…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span>📭</span>
            <h3>{filter === 'all' ? 'No reports yet' : `No ${filter} reports`}</h3>
            <p>When you submit reports, they'll appear here with real-time status updates.</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/support/new')}>Submit a Report</button>
          </div>
        ) : (
          <div className={styles.reportsList}>
            {filtered.map((report, idx) => {
              const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.open;
              const reason = REASON_LABELS[report.reason] || REASON_LABELS.other;
              let details = {};
              try { details = JSON.parse(report.details || '{}'); } catch {}

              return (
                <div key={report.id || idx} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <div className={styles.reportType}>
                      <span>{reason.icon}</span>
                      <span>{reason.label}</span>
                    </div>
                    <div className={styles.reportStatus} style={{ color: status.color, borderColor: `${status.color}30`, background: `${status.color}10` }}>
                      {status.icon} {status.label}
                    </div>
                  </div>

                  {details.subject && (
                    <h3 className={styles.reportSubject}>{details.subject}</h3>
                  )}

                  <div className={styles.reportMeta}>
                    <span>Submitted {formatDate(report.created_at)}</span>
                    {report.updated_at && report.updated_at !== report.created_at && (
                      <span>· Updated {formatDate(report.updated_at)}</span>
                    )}
                  </div>

                  {report.status === 'resolved' && (
                    <div className={styles.resolvedNote}>
                      <span>✅</span>
                      <p>This report has been reviewed and resolved. Thank you for helping keep Focus safe.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className={styles.footer}>
          <span>ℹ️</span>
          <p>All reports are reviewed by trained human moderators. Standard response: 24 hours. Urgent reports: 2 hours. Emergency reports are escalated immediately.</p>
        </div>
      </div>
    </PageShell>
  );
};

export default MyReports;
