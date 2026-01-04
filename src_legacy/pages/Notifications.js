import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { useNotifications } from '../hooks/useNotifications';
import { useRealtimeConnection } from '../hooks/useRealtimeConnection';
import { notificationService } from '../utils/notificationService';
import { formatDate } from '../utils/formatters/formatDate';
import './Notifications.css';

export default function Notifications({ user, userProfile }) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const pullToRefreshRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  
  // Use custom hooks
  const {
    notifications,
    unreadCount,
    loading,
    error: notificationError,
    markAsRead,
    markAllAsRead: markAllReadHook,
    deleteNotification: deleteNotificationHook,
    refetch
  } = useNotifications(user?.id);
  
  const { isConnected } = useRealtimeConnection();
  
  const [filter, setFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('date');
  const [error, setError] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Set error from hook
  useEffect(() => {
    if (notificationError) {
      setError(notificationError);
    }
  }, [notificationError]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Pull to refresh handlers
  const handleTouchStart = useCallback((e) => {
    if (pullToRefreshRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === 0 || pullToRefreshRef.current?.scrollTop > 0) return;
    
    currentYRef.current = e.touches[0].clientY;
    const pullDist = Math.max(0, currentYRef.current - startYRef.current);
    
    if (pullDist > 0 && pullDist < 100) {
      e.preventDefault();
      setPullDistance(pullDist);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);
      
      try {
        await refetch();
        // Show success briefly
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        setError('Failed to refresh notifications');
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        startYRef.current = 0;
        currentYRef.current = 0;
      }
    } else {
      setPullDistance(0);
      startYRef.current = 0;
      currentYRef.current = 0;
    }
  }, [pullDistance, isRefreshing, refetch]);

  // Play subtle notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Silently fail if autoplay blocked
    } catch (err) {
      // Sound not critical
    }
  };

  // Wrapper functions for hook methods
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    try {
      await markAllReadHook();
    } catch (err) {
      setError('Failed to mark all as read');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (deletingIds.has(notificationId)) return;
    setDeletingIds(prev => new Set(prev).add(notificationId));
    try {
      await deleteNotificationHook(notificationId);
    } catch (err) {
      setError('Failed to delete notification');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Handle follow requests with loading state
  const handleFollowRequest = async (notificationId, referenceId, action) => {
    if (processingRequests.has(notificationId)) return;

    setProcessingRequests(prev => new Set(prev).add(notificationId));

    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('follows')
          .update({ status: 'active' })
          .eq('id', referenceId);

        if (error) throw error;

        // Create notification for the follower using service
        const notification = notifications.find(n => n.id === notificationId);
        if (notification?.actor?.id) {
          await notificationService.createNotification({
            userId: notification.actor.id,
            actorId: user.id,
            type: 'follow_request_accepted',
            referenceId: referenceId
          });
        }
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('id', referenceId);

        if (error) throw error;
      }

      await handleDeleteNotification(notificationId);
    } catch (err) {
      console.error('Error handling follow request:', err);
      setError('Failed to process follow request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Handle notification click with proper navigation
  const handleNotificationClick = async (notification) => {
    if (notification.type === 'follow_request') return;

    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    try {
      switch (notification.type) {
        case 'like':
        case 'comment':
          if (notification.content_type === 'post') {
            navigate(`/post/${notification.content_id}`);
          } else if (notification.content_type === 'boltz') {
            navigate(`/boltz/${notification.content_id}`);
          } else if (notification.content_type === 'story') {
            navigate(`/stories/${notification.actor?.username}`);
          }
          break;
        
        case 'follow':
        case 'follow_request_accepted':
          navigate(`/profile/${notification.actor?.username}`);
          break;
        
        case 'message':
          navigate(`/messages/${notification.actor?.username}`);
          break;
        
        case 'group_message':
          navigate(`/messages/group/${notification.reference_id}`);
          break;
        
        case 'mention':
          if (notification.content_type === 'post') {
            navigate(`/post/${notification.content_id}`);
          } else if (notification.content_type === 'comment') {
            navigate(`/post/${notification.content_id}`);
          } else if (notification.content_type === 'story') {
            navigate(`/stories/${notification.actor?.username}`);
          }
          break;
        
        case 'call':
        case 'call_missed':
          navigate(`/call/${notification.reference_id}`);
          break;
        
        default:
          break;
      }
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  // Get notification icon component
  const getNotificationIcon = (type) => {
    const icons = {
      like: (
        <div className="notification-icon like" aria-label="Like">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ),
      comment: (
        <div className="notification-icon comment" aria-label="Comment">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
      ),
      follow: (
        <div className="notification-icon follow" aria-label="Follow">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
      ),
      mention: (
        <div className="notification-icon mention" aria-label="Mention">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
          </svg>
        </div>
      ),
      group_message: (
        <div className="notification-icon group-message" aria-label="Group message">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
      ),
      call: (
        <div className="notification-icon call" aria-label="Call">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
          </svg>
        </div>
      ),
      call_missed: (
        <div className="notification-icon call-missed" aria-label="Missed call">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 7L12 14.59 6.41 9H11V7H3v8h2v-4.59l7 7 9-9z" />
          </svg>
        </div>
      )
    };

    return icons[type] || icons[type?.replace(/_/g, '')] || (
      <div className="notification-icon default" aria-label="Notification">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
        </svg>
      </div>
    );
  };

  // Group similar notifications (e.g., multiple likes on same post)
  const groupSimilarNotifications = (notifs) => {
    const grouped = [];
    const groupMap = new Map();

    notifs.forEach(notif => {
      // Create a key for grouping: type + content_id + content_type
      const key = `${notif.type}_${notif.content_id}_${notif.content_type}`;
      
      // Check if we should group this notification
      const shouldGroup = ['like', 'comment'].includes(notif.type) && notif.content_id;
      
      if (shouldGroup) {
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            ...notif,
            groupedActors: [notif.actor],
            groupedCount: 1,
            isGrouped: true
          });
        } else {
          const existing = groupMap.get(key);
          existing.groupedActors.push(notif.actor);
          existing.groupedCount++;
          // Update to most recent time
          if (new Date(notif.created_at) > new Date(existing.created_at)) {
            existing.created_at = notif.created_at;
          }
        }
      } else {
        grouped.push(notif);
      }
    });

    // Add grouped notifications
    groupMap.forEach(group => grouped.push(group));
    
    // Sort by created_at descending
    return grouped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // Filter and group notifications
  const filteredNotifications = (notifications || []).filter(n => {
    if (filter === 'all') return true;
    if (filter === 'likes') return n.type === 'like';
    if (filter === 'comments') return n.type === 'comment';
    if (filter === 'follows') return ['follow', 'follow_request', 'follow_request_accepted'].includes(n.type);
    if (filter === 'mentions') return n.type === 'mention';
    if (filter === 'messages') return n.type === 'message' || n.type === 'group_message';
    return true;
  });

  // Group similar notifications if enabled
  const processedNotifications = groupBy === 'similar' 
    ? groupSimilarNotifications(filteredNotifications)
    : filteredNotifications;

  // Group notifications
  const groupNotificationsByType = (notifs) => {
    const groups = {};
    notifs.forEach(n => {
      const type = n.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(n);
    });
    return groups;
  };

  const groupNotificationsByDate = (notifs) => {
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
    
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });
    
    return groups;
  };

  const groupedNotifications = groupBy === 'type' 
    ? groupNotificationsByType(processedNotifications)
    : groupBy === 'date'
    ? groupNotificationsByDate(processedNotifications)
    : { 'All': processedNotifications };

  const getTypeLabel = (type) => {
    const labels = {
      'like': 'Likes',
      'comment': 'Comments',
      'follow': 'Follows',
      'follow_request': 'Follow Requests',
      'follow_request_accepted': 'Accepted Requests',
      'mention': 'Mentions',
      'message': 'Messages',
      'group_message': 'Group Messages',
      'call': 'Calls',
      'call_missed': 'Missed Calls'
    };
    return labels[type] || type;
  };

  // Loading state
  if (loading) {
    return (
      <Layout layoutType="default">
        <div className="notifications-page">
          <div className="notifications-header">
            <h1>Notifications</h1>
          </div>
          <SkeletonLoader count={8} type="notification" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout layoutType="default">
      <div 
        className="notifications-page live-notifications"
        ref={pullToRefreshRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        {pullDistance > 0 && (
          <div 
            className="pull-to-refresh-indicator"
            style={{ 
              transform: `translateY(${pullDistance}px)`,
              opacity: Math.min(pullDistance / 60, 1)
            }}
          >
            <div className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>
              {isRefreshing ? '⟳' : '↓'}
            </div>
            <span>{isRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}</span>
          </div>
        )}
      {/* Header */}
      <div className="notifications-header">
        <div className="header-left">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <Badge 
              count={unreadCount} 
              variant="danger"
              ariaLabel={`${unreadCount} unread notifications`}
            />
          )}
          {!isConnected && (
            <span className="connection-status offline" title="Offline - reconnecting...">
              ⚠️
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read" 
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            aria-label="Mark all notifications as read"
          >
            {isMarkingAllRead ? (
              <span className="btn-spinner"></span>
            ) : (
              'Mark all read'
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-banner" role="alert">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="notifications-filters" role="tablist" aria-label="Filter notifications">
        {['all', 'likes', 'comments', 'follows', 'mentions', 'messages'].map(filterType => (
          <button
            key={filterType}
            role="tab"
            aria-selected={filter === filterType}
            className={filter === filterType ? 'active' : ''}
            onClick={() => setFilter(filterType)}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Group options */}
      <div className="notifications-group-options">
        <label htmlFor="group-select">Group by:</label>
        <select 
          id="group-select"
          value={groupBy} 
          onChange={(e) => setGroupBy(e.target.value)}
          aria-label="Group notifications by"
        >
          <option value="date">Date</option>
          <option value="type">Type</option>
          <option value="similar">Similar</option>
          <option value="none">None</option>
        </select>
      </div>

      {/* Notifications list */}
      <div className="notifications-list" role="feed" aria-busy={loading}>
        {processedNotifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications yet"
            message="When someone interacts with your content, you'll see it here"
            action={filter !== 'all' ? {
              label: 'View all notifications',
              onClick: () => setFilter('all')
            } : null}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedNotifications).map(([groupName, groupNotifs]) => (
              <div key={groupName} className="notification-group">
                {groupBy !== 'none' && (
                  <h2 className="notification-group-title">
                    {groupBy === 'type' ? getTypeLabel(groupName) : groupName}
                  </h2>
                )}
                {groupNotifs.map((notification, index) => (
                  <motion.article
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''} ${
                      deletingIds.has(notification.id) ? 'deleting' : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0 }}
                    transition={{ 
                      delay: index * 0.03,
                      duration: 0.2,
                      ease: 'easeOut'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    role="article"
                    aria-label={`Notification from ${notification.actor?.username}`}
                  >
                    {/* Avatar with icon overlay */}
                    <div className="notification-avatar">
                      <img
                        src={notification.actor?.avatar_url || `https://ui-avatars.com/api/?name=${notification.actor?.username}&background=667eea&color=fff`}
                        alt={notification.actor?.username || 'User'}
                        loading="lazy"
                      />
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                      <p>
                        {notification.isGrouped && notification.groupedCount > 1 ? (
                          <>
                            <strong>
                              {notification.groupedActors[0]?.full_name || notification.groupedActors[0]?.username}
                            </strong>
                            {' and '}
                            <strong>{notification.groupedCount - 1} other{notification.groupedCount > 2 ? 's' : ''}</strong>
                            {' '}
                            <span className="notification-text">
                              {notification.type === 'like' ? 'liked your post' : 'commented on your post'}
                            </span>
                          </>
                        ) : (
                          <>
                            <strong>{notification.actor?.full_name || notification.actor?.username}</strong>
                            {notification.actor?.is_verified && (
                              <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                            {' '}
                            <span className="notification-text">{notification.text || notification.content}</span>
                          </>
                        )}
                      </p>
                      <time className="notification-time" dateTime={notification.created_at}>
                        {formatDate(notification.created_at, 'relative')}
                      </time>
                      
                      {/* Follow request actions */}
                      {notification.type === 'follow_request' && (
                        <div className="follow-request-actions">
                          <button
                            className="btn-approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowRequest(notification.id, notification.reference_id, 'approve');
                            }}
                            disabled={processingRequests.has(notification.id)}
                            aria-label="Approve follow request"
                          >
                            {processingRequests.has(notification.id) ? (
                              <span className="btn-spinner"></span>
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            className="btn-reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowRequest(notification.id, notification.reference_id, 'reject');
                            }}
                            disabled={processingRequests.has(notification.id)}
                            aria-label="Reject follow request"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    {notification.type !== 'follow_request' && (
                      <button
                        className="delete-notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        disabled={deletingIds.has(notification.id)}
                        aria-label="Delete notification"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </motion.article>
                ))}
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
      </div>
    </Layout>
  );
}
