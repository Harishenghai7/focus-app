import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import StatCard from '../components/StatCard';
import { formatNumber } from '../utils/formatters/formatNumber';

export default function TrustDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [stats, setStats] = useState({
    verifiedUsers: 0,
    blocks7d: 0,
    blocks30d: 0,
    reportsResolved7d: 0,
    avgResponseMins7d: 0,
    moderated30d: 0,
    safetyScore: 0,
  });

  const channelRef = useRef(null);

  const now = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), [now]);
  const thirtyDaysAgo = useMemo(() => new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), [now]);

  const loadStats = async () => {
    setError(null);
    try {
      // Verified users (support multiple possible column names)
      const verifiedReq = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('verified.eq.true,phone_verified.eq.true,isverified.eq.true');

      // Blocked users (7d and 30d)
      const blocks7Req = supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const blocks30Req = supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Reports resolved (7d) with response time
      const resolved7Req = supabase
        .from('reports')
        .select('id, created_at, reviewed_at', { count: 'exact' })
        .eq('status', 'resolved')
        .gte('reviewed_at', sevenDaysAgo.toISOString());

      // Moderated content (30d): resolved or dismissed reports
      const moderated30Req = supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .or('status.eq.resolved,status.eq.dismissed')
        .gte('updated_at', thirtyDaysAgo.toISOString());

      // For safety score: all vs resolved in last 30d
      const reports30AllReq = supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const reports30ResolvedReq = supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('reviewed_at', thirtyDaysAgo.toISOString());

      const [verified, blocks7, blocks30, resolved7, moderated30, reports30All, reports30Resolved] = await Promise.all([
        verifiedReq,
        blocks7Req,
        blocks30Req,
        resolved7Req,
        moderated30Req,
        reports30AllReq,
        reports30ResolvedReq,
      ]);

      // Average response time (mins) over last 7d
      let avgResponseMins7d = 0;
      if (Array.isArray(resolved7.data) && resolved7.data.length) {
        const diffs = resolved7.data
          .filter(r => r.reviewed_at && r.created_at)
          .map(r => (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60));
        if (diffs.length) avgResponseMins7d = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      }

      // Safety score (0-100): resolution rate + timeliness
      const total30 = reports30All.count || 0;
      const resolved30 = reports30Resolved.count || 0;
      const resolutionRate = total30 ? resolved30 / total30 : 1; // if no reports, treat as perfect
      // Favor fast responses (<= 60 mins gives full 40 pts)
      const timelinessPts = 40 * Math.max(0, Math.min(1, (60 - (avgResponseMins7d || 60)) / 60));
      const safetyScore = Math.round(60 * resolutionRate + timelinessPts);

      setStats({
        verifiedUsers: verified.count || 0,
        blocks7d: blocks7.count || 0,
        blocks30d: blocks30.count || 0,
        reportsResolved7d: resolved7.count || 0,
        avgResponseMins7d,
        moderated30d: moderated30.count || 0,
        safetyScore: Math.max(0, Math.min(100, safetyScore)),
      });

      setLastUpdated(new Date());
    } catch (e) {
      setError('Failed to load trust stats.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Live updates via Realtime (fallback to polling if unavailable)
    try {
      const channel = supabase
        .channel('trust-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadStats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_users' }, () => loadStats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => loadStats())
        .subscribe();
      channelRef.current = channel;
    } catch (e) {
      // ignore
    }

    const interval = setInterval(loadStats, 30000);
    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMins = (m) => {
    if (!m || m <= 0) return '—';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
  };

  return (
    <div className="page trust-dashboard" role="region" aria-label="Trust and Safety Transparency">
      <header className="page-header" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>
          Safest and Productive Social Media Platform for Everyone
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Trust & Safety Transparency</p>
      </header>

      {error && (
        <div role="alert" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>
      )}

      <section aria-label="Trust metrics" className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <StatCard icon="✅" label="Total Verified Users" value={formatNumber(stats.verifiedUsers)} color="success" />
        <StatCard icon="🛡️" label="Fake Accounts Blocked (7d)" value={formatNumber(stats.blocks7d)} color="danger" />
        <StatCard icon="🛡️" label="Fake Accounts Blocked (30d)" value={formatNumber(stats.blocks30d)} color="danger" />
        <StatCard icon="⚖️" label="Reports Resolved (7d)" value={formatNumber(stats.reportsResolved7d)} color="primary" />
        <StatCard icon="⏱️" label="Avg Response Time (7d)" value={formatMins(stats.avgResponseMins7d)} color="warning" />
        <StatCard icon="🧹" label="Content Moderated (30d)" value={formatNumber(stats.moderated30d)} color="secondary" />
        <StatCard icon="🔒" label="User Safety Score" value={`${stats.safetyScore}/100`} color="success" />
      </section>

      <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        {loading ? 'Loading…' : lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : null}
      </div>
    </div>
  );
}
