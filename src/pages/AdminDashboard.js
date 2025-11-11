import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AdminDashboard.css';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
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
      const [usersCount, postsCount, reportsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalReports: reportsCount.count || 0,
        activeUsers: Math.floor((usersCount.count || 0) * 0.3) // Simulated
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      <h2>Pending Reports ({reports.length})</h2>
      {reports.length === 0 ? (
        <div className="empty-state">
          <p>No pending reports</p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <motion.div
              key={report.id}
              className="report-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="report-header">
                <div className="report-type">
                  <span className={`report-badge ${report.report_type}`}>
                    {report.report_type}
                  </span>
                  <span className="report-date">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="report-actions">
                  <button 
                    className="btn-success"
                    onClick={() => handleReport(report.id, 'resolved')}
                  >
                    Resolve
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleReport(report.id, 'dismissed')}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              
              <div className="report-content">
                <div className="report-details">
                  <p><strong>Reporter:</strong> @{report.reporter?.username}</p>
                  <p><strong>Reported User:</strong> @{report.reported_user?.username}</p>
                  <p><strong>Reason:</strong> {report.reason}</p>
                  {report.description && (
                    <p><strong>Description:</strong> {report.description}</p>
                  )}
                </div>
                
                {report.reported_post && (
                  <div className="reported-content">
                    <h4>Reported Post:</h4>
                    <div className="post-preview">
                      {report.reported_post.image_url && (
                        <img src={report.reported_post.image_url} alt="Reported post" />
                      )}
                      <p>{report.reported_post.caption}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
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

  const renderStats = () => (
    <div className="admin-section">
      <h2>Platform Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers?.toLocaleString()}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <h3>{stats.activeUsers?.toLocaleString()}</h3>
            <p>Active Users</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📸</div>
          <div className="stat-info">
            <h3>{stats.totalPosts?.toLocaleString()}</h3>
            <p>Total Posts</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{stats.totalReports?.toLocaleString()}</h3>
            <p>Total Reports</p>
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
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate('/home')} className="btn-secondary">
          Back to App
        </button>
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
  );
}