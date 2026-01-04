import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useAuth } from '../hooks/useAuth';
import './TrustShieldAdminDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Trust Shield Admin Dashboard
 * 
 * Comprehensive admin interface for monitoring Trust Shield system
 * Features:
 * - Real-time statistics and metrics
 * - Suspicious activity monitoring
 * - Trust score distribution charts
 * - IP blocklist management
 * - User search and detail view
 * - Manual review queue
 * 
 * Access: Admin users only (checked via RLS policies)
 */
function TrustShieldAdminDashboard() {
  const { user } = useAuth();
  
  // Admin verification
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    verificationLevels: {},
    avgTrustScore: 0,
    botDetectionRate: 0,
    pendingReviews: 0
  });
  
  // Data collections
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [newBlockedIP, setNewBlockedIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  
  // Real-time subscriptions
  const eventsSubscriptionRef = useRef(null);
  const activitySubscriptionRef = useRef(null);

  /**
   * Check if current user is an admin
   */
  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Check user profile for admin role
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const hasAdminAccess = data?.role === 'admin' || data?.is_admin === true;
      setIsAdmin(hasAdminAccess);

      if (hasAdminAccess) {
        // Load initial data
        await Promise.all([
          loadStatistics(),
          loadSuspiciousActivity(),
          loadRecentEvents(),
          loadBlockedIPs()
        ]);
        
        // Set up real-time subscriptions
        setupRealtimeSubscriptions();
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load overall statistics
   */
  const loadStatistics = async () => {
    try {
      // Get total users and verification levels
      const { data: users, error: usersError } = await supabase
        .from('trust_verification_status')
        .select('verification_level, trust_score, bot_probability, requires_manual_review');

      if (usersError) throw usersError;

      // Calculate statistics
      const totalUsers = users.length;
      const verificationLevels = users.reduce((acc, user) => {
        const level = user.verification_level || 'unverified';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      const avgTrustScore = users.length > 0
        ? users.reduce((sum, u) => sum + (u.trust_score || 0), 0) / users.length
        : 0;

      const flaggedUsers = users.filter(u => u.bot_probability > 0.7).length;
      const botDetectionRate = totalUsers > 0 ? (flaggedUsers / totalUsers) * 100 : 0;

      const pendingReviews = users.filter(u => u.requires_manual_review).length;

      setStats({
        totalUsers,
        verificationLevels,
        avgTrustScore: Math.round(avgTrustScore * 10) / 10,
        botDetectionRate: Math.round(botDetectionRate * 10) / 10,
        pendingReviews
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  /**
   * Load suspicious activity from last 24 hours
   */
  const loadSuspiciousActivity = async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('trust_verification_status')
        .select(`
          user_id,
          trust_score,
          bot_probability,
          verification_level,
          flags,
          updated_at,
          profiles:user_id (username, email)
        `)
        .gte('bot_probability', 0.5)
        .gte('updated_at', yesterday)
        .order('bot_probability', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSuspiciousActivity(data || []);
    } catch (err) {
      console.error('Error loading suspicious activity:', err);
    }
  };

  /**
   * Load recent verification events
   */
  const loadRecentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_events')
        .select(`
          id,
          user_id,
          event_type,
          event_data,
          created_at,
          profiles:user_id (username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setRecentEvents(data || []);
    } catch (err) {
      console.error('Error loading recent events:', err);
    }
  };

  /**
   * Load blocked IPs
   */
  const loadBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBlockedIPs(data || []);
    } catch (err) {
      console.error('Error loading blocked IPs:', err);
    }
  };

  /**
   * Set up real-time subscriptions
   */
  const setupRealtimeSubscriptions = () => {
    // Subscribe to verification events
    eventsSubscriptionRef.current = supabase
      .channel('admin-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verification_events'
        },
        (payload) => {
          setRecentEvents(prev => [payload.new, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    // Subscribe to suspicious activity updates
    activitySubscriptionRef.current = supabase
      .channel('admin-suspicious')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trust_verification_status',
          filter: 'bot_probability=gte.0.5'
        },
        () => {
          loadSuspiciousActivity();
        }
      )
      .subscribe();
  };

  /**
   * Cleanup subscriptions
   */
  useEffect(() => {
    return () => {
      if (eventsSubscriptionRef.current) {
        supabase.removeChannel(eventsSubscriptionRef.current);
      }
      if (activitySubscriptionRef.current) {
        supabase.removeChannel(activitySubscriptionRef.current);
      }
    };
  }, []);

  /**
   * Search users
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          created_at,
          trust_verification_status (
            trust_score,
            verification_level,
            bot_probability,
            flags
          )
        `)
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  /**
   * View user details
   */
  const viewUserDetails = async (userId) => {
    try {
      // Get comprehensive user data
      const { data: trustData, error: trustError } = await supabase
        .from('trust_verification_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (trustError) throw trustError;

      const { data: profileData, error: profileError} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: eventsData, error: eventsError } = await supabase
        .from('verification_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      const { data: identityData, error: identityError } = await supabase
        .from('user_identity_verification')
        .select('*')
        .eq('user_id', userId)
        .single();

      setSelectedUser({
        profile: profileData,
        trust: trustData,
        identity: identityData || {},
        events: eventsData || []
      });

      setShowUserDetail(true);
    } catch (err) {
      console.error('Error loading user details:', err);
      alert('Error loading user details');
    }
  };

  /**
   * Manual action: Verify user
   */
  const handleVerifyUser = async (userId) => {
    if (!confirm('Are you sure you want to manually verify this user?')) return;

    try {
      // Update trust status
      const { error: updateError } = await supabase
        .from('trust_verification_status')
        .update({
          verification_level: 'verified',
          trust_score: 70,
          requires_manual_review: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log event
      await supabase
        .from('verification_events')
        .insert({
          user_id: userId,
          event_type: 'manual_verification',
          event_data: { admin_id: user.id, action: 'verified' },
          created_at: new Date().toISOString()
        });

      alert('User verified successfully');
      await loadStatistics();
      await loadSuspiciousActivity();
      setShowUserDetail(false);
    } catch (err) {
      console.error('Error verifying user:', err);
      alert('Error verifying user');
    }
  };

  /**
   * Manual action: Flag user
   */
  const handleFlagUser = async (userId, reason) => {
    if (!reason) {
      reason = prompt('Enter reason for flagging:');
      if (!reason) return;
    }

    try {
      const { error: updateError } = await supabase
        .from('trust_verification_status')
        .update({
          flags: supabase.raw(`flags || '{"admin_flag": "${reason}"}'::jsonb`),
          requires_manual_review: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log event
      await supabase
        .from('verification_events')
        .insert({
          user_id: userId,
          event_type: 'manual_flag',
          event_data: { admin_id: user.id, reason },
          created_at: new Date().toISOString()
        });

      alert('User flagged successfully');
      await loadSuspiciousActivity();
    } catch (err) {
      console.error('Error flagging user:', err);
      alert('Error flagging user');
    }
  };

  /**
   * Manual action: Block user
   */
  const handleBlockUser = async (userId) => {
    const reason = prompt('Enter reason for blocking:');
    if (!reason) return;

    if (!confirm('Are you sure you want to BLOCK this user? This action is severe.')) return;

    try {
      const { error: updateError } = await supabase
        .from('trust_verification_status')
        .update({
          verification_level: 'blocked',
          trust_score: 0,
          flags: supabase.raw(`flags || '{"blocked": true, "block_reason": "${reason}"}'::jsonb`),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log event
      await supabase
        .from('verification_events')
        .insert({
          user_id: userId,
          event_type: 'manual_block',
          event_data: { admin_id: user.id, reason },
          created_at: new Date().toISOString()
        });

      alert('User blocked successfully');
      await loadStatistics();
      await loadSuspiciousActivity();
      setShowUserDetail(false);
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Error blocking user');
    }
  };

  /**
   * Manual action: Unblock user
   */
  const handleUnblockUser = async (userId) => {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    try {
      const { error: updateError } = await supabase
        .from('trust_verification_status')
        .update({
          verification_level: 'basic',
          trust_score: 30,
          flags: supabase.raw(`flags - 'blocked' - 'block_reason'`),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log event
      await supabase
        .from('verification_events')
        .insert({
          user_id: userId,
          event_type: 'manual_unblock',
          event_data: { admin_id: user.id },
          created_at: new Date().toISOString()
        });

      alert('User unblocked successfully');
      await loadStatistics();
      setShowUserDetail(false);
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Error unblocking user');
    }
  };

  /**
   * Add IP to blocklist
   */
  const handleBlockIP = async (e) => {
    e.preventDefault();
    if (!newBlockedIP.trim() || !blockReason.trim()) {
      alert('Please enter both IP address and reason');
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: newBlockedIP.trim(),
          reason: blockReason.trim(),
          blocked_by: user.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('IP blocked successfully');
      setNewBlockedIP('');
      setBlockReason('');
      await loadBlockedIPs();
    } catch (err) {
      console.error('Error blocking IP:', err);
      alert('Error blocking IP');
    }
  };

  /**
   * Remove IP from blocklist
   */
  const handleUnblockIP = async (ipId) => {
    if (!confirm('Are you sure you want to unblock this IP?')) return;

    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', ipId);

      if (error) throw error;

      alert('IP unblocked successfully');
      await loadBlockedIPs();
    } catch (err) {
      console.error('Error unblocking IP:', err);
      alert('Error unblocking IP');
    }
  };

  /**
   * Export data to CSV
   */
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const keys = Object.keys(data[0]);
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(key => {
        const value = row[key];
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Prepare chart data
   */
  const getTrustScoreDistribution = () => {
    // This would use actual data - placeholder for now
    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    return {
      labels: Object.keys(ranges),
      datasets: [{
        label: 'Users by Trust Score',
        data: Object.values(ranges),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(16, 185, 129, 0.6)'
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
          'rgb(16, 185, 129)'
        ],
        borderWidth: 1
      }]
    };
  };

  const getVerificationLevelDistribution = () => {
    const { verificationLevels } = stats;
    
    return {
      labels: Object.keys(verificationLevels),
      datasets: [{
        label: 'Users by Verification Level',
        data: Object.values(verificationLevels),
        backgroundColor: [
          'rgba(148, 163, 184, 0.6)',
          'rgba(251, 146, 60, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(236, 72, 153, 0.6)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="trust-admin-dashboard loading">
        <div className="spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="trust-admin-dashboard access-denied">
        <h1>🔒 Access Denied</h1>
        <p>You do not have permission to access the Trust Shield Admin Dashboard.</p>
        <p>This area is restricted to administrators only.</p>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="trust-admin-dashboard">
      <header className="dashboard-header">
        <h1>🛡️ Trust Shield Admin Dashboard</h1>
        <div className="header-actions">
          <button onClick={() => {
            loadStatistics();
            loadSuspiciousActivity();
            loadRecentEvents();
            loadBlockedIPs();
          }} className="btn-refresh">
            🔄 Refresh All
          </button>
          <span className="admin-badge">Admin</span>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgTrustScore}</div>
            <div className="stat-label">Avg Trust Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{stats.botDetectionRate}%</div>
            <div className="stat-label">Bot Detection Rate</div>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingReviews}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'suspicious' ? 'active' : ''}
          onClick={() => setActiveTab('suspicious')}
        >
          Suspicious Activity ({suspiciousActivity.length})
        </button>
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Recent Events
        </button>
        <button
          className={activeTab === 'blocklist' ? 'active' : ''}
          onClick={() => setActiveTab('blocklist')}
        >
          IP Blocklist ({blockedIPs.length})
        </button>
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          User Search
        </button>
      </nav>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Trust Score Distribution</h3>
              <Bar
                data={getTrustScoreDistribution()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  }
                }}
              />
            </div>

            <div className="chart-container">
              <h3>Verification Levels</h3>
              <Pie
                data={getVerificationLevelDistribution()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'right' }
                  }
                }}
              />
            </div>
          </div>

          <div className="verification-breakdown">
            <h3>Verification Level Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.verificationLevels).map(([level, count]) => (
                  <tr key={level}>
                    <td className={`level-badge ${level}`}>{level}</td>
                    <td>{count}</td>
                    <td>
                      {stats.totalUsers > 0
                        ? ((count / stats.totalUsers) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspicious Activity Tab */}
      {activeTab === 'suspicious' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>🚨 Suspicious Activity (Last 24 Hours)</h3>
            <button
              onClick={() => exportToCSV(suspiciousActivity, 'suspicious_activity')}
              className="btn-secondary"
            >
              Export CSV
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Trust Score</th>
                  <th>Bot Probability</th>
                  <th>Level</th>
                  <th>Flags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suspiciousActivity.map((item) => (
                  <tr key={item.user_id}>
                    <td>{item.profiles?.username || 'N/A'}</td>
                    <td>{item.profiles?.email || 'N/A'}</td>
                    <td className="trust-score">{item.trust_score}</td>
                    <td className="bot-probability">
                      {(item.bot_probability * 100).toFixed(0)}%
                    </td>
                    <td>
                      <span className={`level-badge ${item.verification_level}`}>
                        {item.verification_level}
                      </span>
                    </td>
                    <td className="flags-cell">
                      {item.flags && Object.keys(item.flags).length > 0
                        ? Object.keys(item.flags).join(', ')
                        : 'None'}
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => viewUserDetails(item.user_id)}
                        className="btn-action btn-view"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleFlagUser(item.user_id)}
                        className="btn-action btn-flag"
                        title="Flag User"
                      >
                        🚩
                      </button>
                      <button
                        onClick={() => handleBlockUser(item.user_id)}
                        className="btn-action btn-block"
                        title="Block User"
                      >
                        🚫
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {suspiciousActivity.length === 0 && (
              <div className="empty-state">
                <p>No suspicious activity detected in the last 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Events Tab */}
      {activeTab === 'events' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>📋 Recent Verification Events</h3>
            <button
              onClick={() => exportToCSV(recentEvents, 'verification_events')}
              className="btn-secondary"
            >
              Export CSV
            </button>
          </div>

          <div className="events-feed">
            {recentEvents.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-icon">
                  {event.event_type.includes('flag') ? '🚩' :
                   event.event_type.includes('verify') ? '✅' :
                   event.event_type.includes('block') ? '🚫' :
                   event.event_type.includes('trust') ? '⭐' :
                   '📝'}
                </div>
                <div className="event-content">
                  <div className="event-header">
                    <span className="event-type">{event.event_type}</span>
                    <span className="event-time">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="event-user">
                    User: {event.profiles?.username || event.user_id}
                  </div>
                  {event.event_data && (
                    <div className="event-data">
                      {JSON.stringify(event.event_data, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {recentEvents.length === 0 && (
            <div className="empty-state">
              <p>No recent events.</p>
            </div>
          )}
        </div>
      )}

      {/* IP Blocklist Tab */}
      {activeTab === 'blocklist' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>🚫 IP Blocklist Management</h3>
          </div>

          <div className="add-blocked-ip">
            <h4>Add IP to Blocklist</h4>
            <form onSubmit={handleBlockIP} className="block-ip-form">
              <input
                type="text"
                placeholder="IP Address (e.g., 192.168.1.1)"
                value={newBlockedIP}
                onChange={(e) => setNewBlockedIP(e.target.value)}
                className="input-ip"
              />
              <input
                type="text"
                placeholder="Reason for blocking"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="input-reason"
              />
              <button type="submit" className="btn-primary">
                Block IP
              </button>
            </form>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Blocked Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map((ip) => (
                  <tr key={ip.id}>
                    <td className="ip-address">{ip.ip_address}</td>
                    <td>{ip.reason}</td>
                    <td>{new Date(ip.created_at).toLocaleString()}</td>
                    <td className="actions">
                      <button
                        onClick={() => handleUnblockIP(ip.id)}
                        className="btn-action btn-unblock"
                        title="Unblock IP"
                      >
                        ✅ Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {blockedIPs.length === 0 && (
              <div className="empty-state">
                <p>No blocked IPs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Search Tab */}
      {activeTab === 'search' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>🔍 User Search</h3>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Trust Score</th>
                    <th>Level</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td className="trust-score">
                        {user.trust_verification_status?.trust_score || 0}
                      </td>
                      <td>
                        <span className={`level-badge ${user.trust_verification_status?.verification_level}`}>
                          {user.trust_verification_status?.verification_level || 'new'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="actions">
                        <button
                          onClick={() => viewUserDetails(user.id)}
                          className="btn-action btn-view"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="empty-state">
              <p>No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetail(false)}>
          <div className="modal-content user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowUserDetail(false)}
            >
              ✕
            </button>

            <h2>User Details: {selectedUser.profile.username}</h2>

            <div className="user-detail-sections">
              {/* Profile Section */}
              <section className="detail-section">
                <h3>Profile Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Username:</strong> {selectedUser.profile.username}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {selectedUser.profile.email}
                  </div>
                  <div className="detail-item">
                    <strong>Joined:</strong> {new Date(selectedUser.profile.created_at).toLocaleString()}
                  </div>
                </div>
              </section>

              {/* Trust Status Section */}
              <section className="detail-section">
                <h3>Trust Shield Status</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Trust Score:</strong>
                    <span className="trust-score-large">{selectedUser.trust.trust_score}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Verification Level:</strong>
                    <span className={`level-badge ${selectedUser.trust.verification_level}`}>
                      {selectedUser.trust.verification_level}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Bot Probability:</strong>
                    <span className="bot-probability">
                      {(selectedUser.trust.bot_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Manual Review:</strong>
                    {selectedUser.trust.requires_manual_review ? '⚠️ Required' : '✅ Not Required'}
                  </div>
                </div>

                {selectedUser.trust.flags && Object.keys(selectedUser.trust.flags).length > 0 && (
                  <div className="flags-section">
                    <strong>Flags:</strong>
                    <ul>
                      {Object.entries(selectedUser.trust.flags).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {JSON.stringify(value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Verification Layers */}
              {selectedUser.identity && (
                <section className="detail-section">
                  <h3>7-Layer Verification Status</h3>
                  <div className="verification-layers">
                    <div className="layer-item">
                      <span className="layer-icon">📱</span>
                      <span className="layer-name">Device Fingerprint:</span>
                      <span className={selectedUser.identity.device_fingerprint ? 'verified' : 'unverified'}>
                        {selectedUser.identity.device_fingerprint ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="layer-item">
                      <span className="layer-icon">🌍</span>
                      <span className="layer-name">IP Intelligence:</span>
                      <span className={selectedUser.identity.ip_address ? 'verified' : 'unverified'}>
                        {selectedUser.identity.ip_address ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="layer-item">
                      <span className="layer-icon">📧</span>
                      <span className="layer-name">Email Verified:</span>
                      <span className={selectedUser.identity.email_verified ? 'verified' : 'unverified'}>
                        {selectedUser.identity.email_verified ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="layer-item">
                      <span className="layer-icon">📞</span>
                      <span className="layer-name">Phone Verified:</span>
                      <span className={selectedUser.identity.phone_verified ? 'verified' : 'unverified'}>
                        {selectedUser.identity.phone_verified ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="layer-item">
                      <span className="layer-icon">🤖</span>
                      <span className="layer-name">CAPTCHA Passed:</span>
                      <span className={selectedUser.identity.captcha_passed ? 'verified' : 'unverified'}>
                        {selectedUser.identity.captcha_passed ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Event History */}
              <section className="detail-section">
                <h3>Recent Events ({selectedUser.events.length})</h3>
                <div className="events-list">
                  {selectedUser.events.slice(0, 10).map((event) => (
                    <div key={event.id} className="event-item-small">
                      <span className="event-type">{event.event_type}</span>
                      <span className="event-time">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Admin Actions */}
              <section className="detail-section admin-actions">
                <h3>Admin Actions</h3>
                <div className="action-buttons">
                  <button
                    onClick={() => handleVerifyUser(selectedUser.profile.id)}
                    className="btn-action btn-verify"
                  >
                    ✅ Verify User
                  </button>
                  <button
                    onClick={() => handleFlagUser(selectedUser.profile.id)}
                    className="btn-action btn-flag"
                  >
                    🚩 Flag User
                  </button>
                  <button
                    onClick={() => handleBlockUser(selectedUser.profile.id)}
                    className="btn-action btn-block"
                  >
                    🚫 Block User
                  </button>
                  <button
                    onClick={() => handleUnblockUser(selectedUser.profile.id)}
                    className="btn-action btn-unblock"
                  >
                    ✅ Unblock User
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrustShieldAdminDashboard;
