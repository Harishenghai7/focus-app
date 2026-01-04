import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ActivityStatus.css';

export default function ActivityStatus({ userId, showText = false }) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    fetchActivityStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, (payload) => {
        if (payload.new.last_seen) {
          checkOnlineStatus(payload.new.last_seen);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchActivityStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('last_seen')
        .eq('id', userId)
        .single();

      if (data?.last_seen) {
        checkOnlineStatus(data.last_seen);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const checkOnlineStatus = (lastSeenTime) => {
    const lastSeenDate = new Date(lastSeenTime);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);

    setLastSeen(lastSeenTime);
    setIsOnline(diffMins < 5); // Online if active in last 5 mins
  };

  const formatLastSeen = () => {
    if (!lastSeen) return 'Offline';

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    return 'Offline';
  };

  return (
    <div className="activity-status">
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
      {showText && <span className="status-text">{formatLastSeen()}</span>}
    </div>
  );
}
