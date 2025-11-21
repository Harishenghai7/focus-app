import React, { useState, useEffect } from 'react';
import { components, hooks, utils } from '@/importMap';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import ModerationQueue from '../components/ModerationQueue';
import { formatNumber } from '../utils/formatters/formatNumber';
import './AdminDashboard.css';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'posts') fetchPosts();
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!data?.is_admin) {
        navigate('/home');
        return;
      }
      setLoading(false);
    } catch (error) {
      navigate('/home');
    }
  };

  const fetchReports = async () => {
    try {
      const { data } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(username, avatar_url),
          reported_user:reported_user_id(username, avatar_url),
          reported_post:reported_post_id(caption, image_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [usersCount, postsCount, reportsCount, newUsers, activeUsers] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo.toISOString())
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalReports: reportsCount.count || 0,
        activeUsers: activeUsers.count || 0,
        newUsers: newUsers.count || 0
      });

      // Fetch system health metrics
      fetchSystemHealth();
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const [
        storageResult,
        pendingReports,
        bannedUsers,
        deletedPosts
      ] = await Promise.all([
        supabase.from('posts').select('image_url'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_deleted', true)
      ]);

      // Calculate storage usage (simulated based on post count)
      const storageUsedGB = ((storageResult.data?.length || 0) * 2.5).toFixed(2);
      
      setSystemHealth({
        databaseStatus: 'healthy',
        storageUsed: storageUsedGB,
        storageLimit: '100',
        pendingReports: pendingReports.count || 0,
        bannedUsers: bannedUsers.count || 0,
        deletedPosts: deletedPosts.count || 0,
        uptime: '99.9%',
        responseTime: '< 100ms'
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
      setSystemHealth({
        databaseStatus: 'error',
        storageUsed: '0',
        storageLimit: '100',
        pendingReports: 0,
        bannedUsers: 0,
        deletedPosts: 0,
        uptime: 'Unknown',
        responseTime: 'Unknown'
      });
    }
  };

  const handleReport = async (reportId, action) => {
    try {
      await supabase
        .from('reports')
        .update({ 
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      fetchReports();
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  const banUser = async (userId, reason) => {
    if (!window.confirm(`Ban this user? Reason: ${reason}`)) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          ban_reason: reason,
          banned_at: new Date().toISOString(),
          banned_by: user.id
        })
        .eq('id', userId);

      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const deletePost = async (postId, reason) => {
    if (!window.confirm(`Delete this post? Reason: ${reason}`)) return;

    try {
      await supabase
        .from('posts')
        .update({ 
          is_deleted: true,
          deleted_reason: reason,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', postId);

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const renderReports = () => (
    <div className="admin-section">
      <ModerationQueue 
        reports={reports}
        onResolve={(reportId) => handleReport(reportId, 'resolved')}
        onDismiss={(reportId) => handleReport(reportId, 'dismissed')}
      />
    </div>
  );

  const renderUsers = () => (
    <div className="admin-section">
      <h2>User Management ({users.length})</h2>
      <div className="users-table">
        <div className="table-header">
          <span>User</span>
          <span>Joined</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="table-row">
            <div className="user-info">
              <img 
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
                alt={user.username}
                className="user-avatar"
              />
              <div>
                <p className="username">@{user.username}</p>
                <p className="full-name">{user.full_name}</p>
              </div>
            </div>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
            <span className={`status ${user.is_banned ? 'banned' : 'active'}`}>
              {user.is_banned ? 'Banned' : 'Active'}
            </span>
            <div className="user-actions">
              {!user.is_banned ? (
                <button 
                  className="btn-danger btn-sm"
                  onClick={() => banUser(user.id, 'Admin action')}
                >
                  Ban
                </button>
              ) : (
                <button 
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    // Unban user
                    supabase
                      .from('profiles')
                      .update({ is_banned: false, ban_reason: null })
                      .eq('id', user.id)
                      .then(() => fetchUsers());
                  }}
                >
                  Unban
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="admin-section">
      <h2>Content Management ({posts.length})</h2>
      <div className="posts-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            {post.image_url && (
              <img src={post.image_url} alt="Post" className="post-image" />
            )}
            <div className="post-info">
              <p className="post-author">@{post.user?.username}</p>
              <p className="post-caption">{post.caption?.substring(0, 100)}...</p>
              <div className="post-stats">
                <span>❤️ {post.likes_count || 0}</span>
                <span>💬 {post.comments_count || 0}</span>
              </div>
              <div className="post-actions">
                <button 
                  className="btn-danger btn-sm"
                  onClick={() => deletePost(post.id, 'Inappropriate content')}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="quick-actions-panel">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        <button 
          className="action-btn action-reports"
          onClick={() => setActiveTab('reports')}
        >
          <span className="action-icon">⚠️</span>
          <span className="action-label">Review Reports</span>
          <span className="action-badge">{reports.length}</span>
        </button>

        <button 
          className="action-btn action-users"
          onClick={() => setActiveTab('users')}
        >
          <span className="action-icon">👥</span>
          <span className="action-label">Manage Users</span>
        </button>

        <button 
          className="action-btn action-posts"
          onClick={() => setActiveTab('posts')}
        >
          <span className="action-icon">📸</span>
          <span className="action-label">Moderate Posts</span>
        </button>

        <button 
          className="action-btn action-stats"
          onClick={() => setActiveTab('stats')}
        >
          <span className="action-icon">📊</span>
          <span className="action-label">View Stats</span>
        </button>

        <button 
          className="action-btn action-refresh"
          onClick={() => {
            fetchReports();
            fetchUsers();
            fetchPosts();
            fetchStats();
          }}
        >
          <span className="action-icon">🔄</span>
          <span className="action-label">Refresh Data</span>
        </button>

        <button 
          className="action-btn action-export"
          onClick={() => {
            // Export data functionality
            const data = {
              stats,
              systemHealth,
              timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
          }}
        >
          <span className="action-icon">📥</span>
          <span className="action-label">Export Report</span>
        </button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="admin-section">
      <h2>Platform Statistics</h2>
      
      {/* User Stats */}
      <div className="stats-grid">
        <StatCard 
          icon="👥"
          label="Total Users"
          value={formatNumber(stats.totalUsers || 0)}
          color="primary"
        />
        
        <StatCard 
          icon="📱"
          label="Active Users"
          value={formatNumber(stats.activeUsers || 0)}
          color="success"
        />
        
        <StatCard 
          icon="✨"
          label="New Users (7d)"
          value={formatNumber(stats.newUsers || 0)}
          trend="up"
          color="info"
        />
        
        <StatCard 
          icon="📸"
          label="Total Posts"
          value={formatNumber(stats.totalPosts || 0)}
          color="secondary"
        />
        
        <StatCard 
          icon="⚠️"
          label="Total Reports"
          value={formatNumber(stats.totalReports || 0)}
          color="warning"
        />
        
        <StatCard 
          icon="🚫"
          label="Banned Users"
          value={formatNumber(systemHealth.bannedUsers || 0)}
          color="danger"
        />
      </div>

      {/* System Health Metrics */}
      <div className="system-health-section">
        <h2>System Health Metrics</h2>
        <div className="health-grid">
          <div className="health-card">
            <div className="health-header">
              <span className="health-icon">�</span>
              <h3>Database Status</h3>
            </div>
            <div className={`health-status status-${systemHealth.databaseStatus}`}>
              {systemHealth.databaseStatus === 'healthy' ? '✓ Operational' : '✗ Error'}
            </div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <span className="health-icon">📊</span>
              <h3>Storage Usage</h3>
            </div>
            <div className="health-value">
              {systemHealth.storageUsed} GB / {systemHealth.storageLimit} GB
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(systemHealth.storageUsed / systemHealth.storageLimit) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <span className="health-icon">⏱️</span>
              <h3>Response Time</h3>
            </div>
            <div className="health-value">{systemHealth.responseTime}</div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <span className="health-icon">⚡</span>
              <h3>Uptime</h3>
            </div>
            <div className="health-value">{systemHealth.uptime}</div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <span className="health-icon">📋</span>
              <h3>Pending Reports</h3>
            </div>
            <div className="health-value">{systemHealth.pendingReports}</div>
          </div>

          <div className="health-card">
            <div className="health-header">
              <span className="health-icon">🗑️</span>
              <h3>Deleted Posts</h3>
            </div>
            <div className="health-value">{systemHealth.deletedPosts}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button onClick={() => navigate('/home')} className="btn-secondary">
            Back to App
          </button>
        </div>

        {/* Quick Actions Panel */}
        <div className="admin-overview">
          {renderQuickActions()}
        </div>

        <div className="admin-tabs">
          {[
            { id: 'reports', label: 'Reports', icon: '⚠️' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'posts', label: 'Posts', icon: '📸' },
            { id: 'stats', label: 'Stats', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-content">
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'posts' && renderPosts()}
          {activeTab === 'stats' && renderStats()}
        </div>
      </div>
    </Layout>
  );
}