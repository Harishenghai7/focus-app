import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Notifications.css';

export default function Notifications({ user, userProfile }) {
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, likes, comments, follows, mentions, messages
  const [groupBy, setGroupBy] = useState('none'); // none, type, date
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    subscribeToNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // Fetch actor info
          const { data: actor } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_verified')
            .eq('id', payload.new.actor_id)
            .single();

          const newNotification = { ...payload.new, actor };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        user_uuid: user.id
      });

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleFollowRequest = async (notificationId, referenceId, action) => {
    try {
      if (action === 'approve') {
        // Update follow status to active
        const { error } = await supabase
          .from('follows')
          .update({ status: 'active' })
          .eq('id', referenceId);

        if (error) throw error;
      } else if (action === 'reject') {
        // Delete the follow request
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('id', referenceId);

        if (error) throw error;
      }

      // Remove the notification
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error handling follow request:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Don't navigate if it's a follow request (has action buttons)
    if (notification.type === 'follow_request') {
      return;
    }

    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
        if (notification.content_type === 'post') {
          navigate(`/post/${notification.content_id}`);
        } else if (notification.content_type === 'boltz') {
          navigate(`/boltz/${notification.content_id}`);
        }
        break;
      case 'comment':
        if (notification.content_type === 'post') {
          navigate(`/post/${notification.content_id}`);
        } else if (notification.content_type === 'boltz') {
          navigate(`/boltz/${notification.content_id}`);
        }
        break;
      case 'follow':
      case 'follow_request_accepted':
        navigate(`/profile/${notification.actor?.username}`);
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'group_message':
        navigate(`/group/${notification.reference_id}`);
        break;
      case 'mention':
        if (notification.content_type === 'post') {
          navigate(`/post/${notification.content_id}`);
        } else if (notification.content_type === 'comment') {
          navigate(`/post/${notification.content_id}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return (
          <div className="notification-icon like">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="notification-icon comment">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
        );
      case 'follow':
      case 'follow_request':
      case 'follow_request_accepted':
        return (
          <div className="notification-icon follow">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        );
      case 'mention':
        return (
          <div className="notification-icon mention">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
          </div>
        );
      case 'group_message':
        return (
          <div className="notification-icon group-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="notification-icon default">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'likes') return n.type === 'like';
    if (filter === 'comments') return n.type === 'comment';
    if (filter === 'follows') return n.type === 'follow' || n.type === 'follow_request' || n.type === 'follow_request_accepted';
    if (filter === 'mentions') return n.type === 'mention';
    if (filter === 'messages') return n.type === 'message';
    return true;
  });

  // Group notifications if needed
  const groupedNotifications = groupBy === 'type' 
    ? groupNotificationsByType(filteredNotifications)
    : groupBy === 'date'
    ? groupNotificationsByDate(filteredNotifications)
    : { 'All': filteredNotifications };

  function groupNotificationsByType(notifs) {
    const groups = {};
    notifs.forEach(n => {
      const type = n.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(n);
    });
    return groups;
  }

  function groupNotificationsByDate(notifs) {
    const groups = {
      'Today': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    notifs.forEach(n => {
      const date = new Date(n.created_at);
      if (date >= today) {
        groups['Today'].push(n);
      } else if (date >= weekAgo) {
        groups['This Week'].push(n);
      } else if (date >= monthAgo) {
        groups['This Month'].push(n);
      } else {
        groups['Older'].push(n);
      }
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });
    
    return groups;
  }

  const getTypeLabel = (type) => {
    const labels = {
      'like': 'Likes',
      'comment': 'Comments',
      'follow': 'Follows',
      'follow_request': 'Follow Requests',
      'follow_request_accepted': 'Follow Requests Accepted',
      'mention': 'Mentions',
      'message': 'Messages',
      'call': 'Calls',
      'call_missed': 'Missed Calls'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="mark-all-read" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'likes' ? 'active' : ''}
          onClick={() => setFilter('likes')}
        >
          Likes
        </button>
        <button
          className={filter === 'comments' ? 'active' : ''}
          onClick={() => setFilter('comments')}
        >
          Comments
        </button>
        <button
          className={filter === 'follows' ? 'active' : ''}
          onClick={() => setFilter('follows')}
        >
          Follows
        </button>
        <button
          className={filter === 'mentions' ? 'active' : ''}
          onClick={() => setFilter('mentions')}
        >
          Mentions
        </button>
        <button
          className={filter === 'messages' ? 'active' : ''}
          onClick={() => setFilter('messages')}
        >
          Messages
        </button>
      </div>

      <div className="notifications-group-options">
        <label>Group by:</label>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
          <option value="none">None</option>
          <option value="type">Type</option>
          <option value="date">Date</option>
        </select>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3>No notifications yet</h3>
            <p>When someone likes or comments on your posts, you'll see it here</p>
          </div>
        ) : (
          <AnimatePresence>
            {Object.entries(groupedNotifications).map(([groupName, groupNotifs]) => (
              <div key={groupName} className="notification-group">
                {groupBy !== 'none' && (
                  <h3 className="notification-group-title">
                    {groupBy === 'type' ? getTypeLabel(groupName) : groupName}
                  </h3>
                )}
                {groupNotifs.map((notification, index) => (
              <motion.div
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-avatar">
                  <img
                    src={notification.actor?.avatar_url || `https://ui-avatars.com/api/?name=${notification.actor?.username}`}
                    alt={notification.actor?.username}
                  />
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <p>
                    <strong>{notification.actor?.full_name || notification.actor?.username}</strong>
                    {notification.actor?.is_verified && (
                      <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                    {' '}
                    <span className="notification-text">{notification.text || notification.content}</span>
                  </p>
                  <span className="notification-time">{formatTime(notification.created_at)}</span>
                  
                  {notification.type === 'follow_request' && (
                    <div className="follow-request-actions">
                      <button
                        className="btn-approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowRequest(notification.id, notification.reference_id, 'approve');
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowRequest(notification.id, notification.reference_id, 'reject');
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {notification.type !== 'follow_request' && (
                  <button
                    className="delete-notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
