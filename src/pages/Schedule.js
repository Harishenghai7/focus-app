import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSend, 
  FiClock,
  FiImage,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import Layout from '../components/Layout/Layout';
import PostCard from '../components/PostCard';
import DateTimePicker from '../components/DateTimePicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/formatters/formatDate';
import './Schedule.css';

/**
 * Schedule.js (P11-C)
 * 
 * Manage scheduled posts for future publishing.
 * 
 * Features:
 * - List of scheduled posts
 * - Schedule new post button
 * - Edit scheduled post
 * - Delete scheduled post
 * - Post immediately option
 * - Schedule date/time picker
 * 
 * Components:
 * - Layout
 * - PostCard (preview)
 * - DateTimePicker
 * - ConfirmDialog
 * 
 * Hooks: None
 * Utils: formatDate
 * Data: scheduledPosts array
 * Safety: (scheduledPosts || []).map()
 * Layout: List view with timestamps
 */
export default function Schedule({ user }) {
  const navigate = useNavigate();
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, postId: null });
  const [publishDialog, setPublishDialog] = useState({ open: false, postId: null });
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [sortBy, setSortBy] = useState('date-asc'); // 'date-asc', 'date-desc', 'created'

  useEffect(() => {
    if (user?.id) {
      fetchScheduledPosts();
    }
  }, [user]);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      // In production, this would fetch from your backend/database
      const mockScheduledPosts = [
        {
          id: '1',
          caption: 'Excited to share this new feature! 🚀 #development #coding',
          media_url: 'https://picsum.photos/600/400?random=1',
          media_type: 'image',
          scheduled_for: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'scheduled',
          profiles: {
            id: user?.id,
            username: user?.username || 'user',
            full_name: user?.full_name || 'User Name',
            avatar_url: user?.avatar_url
          }
        },
        {
          id: '2',
          caption: 'Weekend vibes ☀️ Looking forward to some relaxation time',
          media_url: 'https://picsum.photos/600/400?random=2',
          media_type: 'image',
          scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'scheduled',
          profiles: {
            id: user?.id,
            username: user?.username || 'user',
            full_name: user?.full_name || 'User Name',
            avatar_url: user?.avatar_url
          }
        },
        {
          id: '3',
          caption: 'New blog post coming soon! Stay tuned for updates 📝',
          media_url: 'https://picsum.photos/600/400?random=3',
          media_type: 'image',
          scheduled_for: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'scheduled',
          profiles: {
            id: user?.id,
            username: user?.username || 'user',
            full_name: user?.full_name || 'User Name',
            avatar_url: user?.avatar_url
          }
        }
      ];

      setScheduledPosts(mockScheduledPosts);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPosts = () => {
    if (!scheduledPosts) return [];
    
    const now = new Date();
    let filtered = [...scheduledPosts];

    // Apply time filter
    if (filter === 'today') {
      filtered = filtered.filter(post => {
        const scheduledDate = new Date(post.scheduled_for);
        return scheduledDate.toDateString() === now.toDateString();
      });
    } else if (filter === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(post => {
        const scheduledDate = new Date(post.scheduled_for);
        return scheduledDate >= now && scheduledDate <= weekFromNow;
      });
    } else if (filter === 'month') {
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(post => {
        const scheduledDate = new Date(post.scheduled_for);
        return scheduledDate >= now && scheduledDate <= monthFromNow;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date-asc') {
        return new Date(a.scheduled_for) - new Date(b.scheduled_for);
      } else if (sortBy === 'date-desc') {
        return new Date(b.scheduled_for) - new Date(a.scheduled_for);
      } else if (sortBy === 'created') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

    return filtered;
  };

  const handleScheduleNew = () => {
    navigate('/create', { state: { scheduleMode: true } });
  };

  const handleEditSchedule = (post) => {
    setEditingPost(post);
  };

  const handleUpdateSchedule = (newDate) => {
    if (editingPost && newDate) {
      setScheduledPosts(prev => 
        (prev || []).map(post => 
          post.id === editingPost.id 
            ? { ...post, scheduled_for: newDate }
            : post
        )
      );
      setEditingPost(null);
    }
  };

  const handleDeleteClick = (postId) => {
    setDeleteDialog({ open: true, postId });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.postId) {
      setScheduledPosts(prev => 
        (prev || []).filter(post => post.id !== deleteDialog.postId)
      );
    }
    setDeleteDialog({ open: false, postId: null });
  };

  const handlePublishClick = (postId) => {
    setPublishDialog({ open: true, postId });
  };

  const handlePublishConfirm = async () => {
    if (publishDialog.postId) {
      // In production, this would call your API to publish the post immediately
      const post = scheduledPosts.find(p => p.id === publishDialog.postId);
      if (post) {
        console.log('Publishing post immediately:', post);
        // Remove from scheduled posts
        setScheduledPosts(prev => 
          (prev || []).filter(p => p.id !== publishDialog.postId)
        );
      }
    }
    setPublishDialog({ open: false, postId: null });
  };

  const handleRefresh = () => {
    fetchScheduledPosts();
  };

  const formatScheduleTime = (date) => {
    const scheduledDate = new Date(date);
    const now = new Date();
    const diff = scheduledDate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} from now`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} from now`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''} from now`;
    }
  };

  const filteredPosts = getFilteredPosts();

  if (loading) {
    return (
      <Layout>
        <div className="schedule-page">
          <div className="schedule-loading">
            <FiRefreshCw className="loading-spinner" />
            <p>Loading scheduled posts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="schedule-page">
        {/* Header */}
        <div className="schedule-header">
          <div className="header-title">
            <FiCalendar className="title-icon" />
            <h1>Scheduled Posts</h1>
          </div>
          <button 
            className="schedule-new-btn"
            onClick={handleScheduleNew}
            aria-label="Schedule new post"
          >
            <FiPlus />
            Schedule New
          </button>
        </div>

        {/* Filters and Sort */}
        <div className="schedule-controls">
          <div className="filter-tabs">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
              aria-label="Show all scheduled posts"
            >
              All
            </button>
            <button
              className={filter === 'today' ? 'active' : ''}
              onClick={() => setFilter('today')}
              aria-label="Show today's scheduled posts"
            >
              Today
            </button>
            <button
              className={filter === 'week' ? 'active' : ''}
              onClick={() => setFilter('week')}
              aria-label="Show this week's scheduled posts"
            >
              This Week
            </button>
            <button
              className={filter === 'month' ? 'active' : ''}
              onClick={() => setFilter('month')}
              aria-label="Show this month's scheduled posts"
            >
              This Month
            </button>
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort scheduled posts"
            >
              <option value="date-asc">Earliest First</option>
              <option value="date-desc">Latest First</option>
              <option value="created">Recently Created</option>
            </select>
          </div>

          <button
            className="refresh-btn"
            onClick={handleRefresh}
            aria-label="Refresh scheduled posts"
          >
            <FiRefreshCw />
          </button>
        </div>

        {/* Posts List */}
        <div className="schedule-list">
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <FiCalendar className="empty-icon" />
              <h2>No Scheduled Posts</h2>
              <p>
                {filter === 'all' 
                  ? "You don't have any scheduled posts yet."
                  : `No posts scheduled for ${filter === 'today' ? 'today' : filter === 'week' ? 'this week' : 'this month'}.`
                }
              </p>
              <button 
                className="schedule-new-btn"
                onClick={handleScheduleNew}
              >
                <FiPlus />
                Schedule Your First Post
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {(filteredPosts || []).map((post, index) => (
                <motion.div
                  key={post.id}
                  className="schedule-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {/* Scheduled Time Badge */}
                  <div className="schedule-time-badge">
                    <FiClock />
                    <div className="time-info">
                      <span className="time-relative">
                        {formatScheduleTime(post.scheduled_for)}
                      </span>
                      <span className="time-absolute">
                        {formatDate(post.scheduled_for, 'long')}
                      </span>
                    </div>
                  </div>

                  {/* Post Preview */}
                  <div className="post-preview">
                    {post.media_url && (
                      <div className="preview-media">
                        {post.media_type === 'video' ? (
                          <video src={post.media_url} />
                        ) : (
                          <img src={post.media_url} alt="Post preview" />
                        )}
                      </div>
                    )}
                    <div className="preview-content">
                      <p className="preview-caption">
                        {post.caption?.substring(0, 150)}
                        {post.caption?.length > 150 ? '...' : ''}
                      </p>
                      <div className="preview-meta">
                        <span className="created-time">
                          Created {formatDate(post.created_at, 'relative')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="schedule-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditSchedule(post)}
                      aria-label="Edit schedule time"
                      title="Edit schedule time"
                    >
                      <FiEdit2 />
                      Reschedule
                    </button>
                    <button
                      className="action-btn publish-btn"
                      onClick={() => handlePublishClick(post.id)}
                      aria-label="Post immediately"
                      title="Post immediately"
                    >
                      <FiSend />
                      Post Now
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClick(post.id)}
                      aria-label="Delete scheduled post"
                      title="Delete scheduled post"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Info Banner */}
        {filteredPosts.length > 0 && (
          <div className="schedule-info">
            <FiAlertCircle />
            <p>
              Posts will be automatically published at their scheduled time. 
              You can reschedule or delete them at any time.
            </p>
          </div>
        )}

        {/* Edit Schedule Dialog */}
        {editingPost && (
          <div className="edit-schedule-dialog">
            <div className="dialog-overlay" onClick={() => setEditingPost(null)} />
            <motion.div
              className="dialog-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h2>Reschedule Post</h2>
              <p className="dialog-description">
                Choose a new date and time to publish this post.
              </p>
              
              <DateTimePicker
                value={editingPost.scheduled_for}
                onChange={handleUpdateSchedule}
                minDate={new Date()}
                label="New Schedule Time"
              />

              <div className="dialog-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setEditingPost(null)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialog.open}
          title="Delete Scheduled Post?"
          message="This post will be permanently deleted and won't be published. This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog({ open: false, postId: null })}
        />

        {/* Publish Confirmation Dialog */}
        <ConfirmDialog
          open={publishDialog.open}
          title="Post Immediately?"
          message="This will publish your post right now instead of at the scheduled time. Continue?"
          onConfirm={handlePublishConfirm}
          onCancel={() => setPublishDialog({ open: false, postId: null })}
        />
      </div>
    </Layout>
  );
}
