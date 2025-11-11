import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './Calls.css';

export default function Calls({ user, userProfile }) {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchCallHistory();
    }
  }, [user?.id]);

  const fetchCallHistory = async () => {
    try {
      // Use the database function for optimized call history retrieval
      const { data, error } = await supabase.rpc('get_call_history', {
        user_uuid: user.id,
        page_size: 50,
        page_offset: 0
      });

      if (error) {
        console.error('RPC error:', error);
        // Fallback to direct query if function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('calls')
          .select(`
            *,
            caller:caller_id(id, username, full_name, avatar_url),
            receiver:receiver_id(id, username, full_name, avatar_url)
          `)
          .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (fallbackError) throw fallbackError;
        
        // Transform fallback data to match RPC format
        const transformedData = fallbackData.map(call => ({
          ...call,
          is_incoming: call.receiver_id === user.id,
          other_user_id: call.caller_id === user.id ? call.receiver_id : call.caller_id,
          username: call.caller_id === user.id ? call.receiver?.username : call.caller?.username,
          full_name: call.caller_id === user.id ? call.receiver?.full_name : call.caller?.full_name,
          avatar_url: call.caller_id === user.id ? call.receiver?.avatar_url : call.caller?.avatar_url,
        }));
        
        setCallHistory(transformedData);
      } else {
        setCallHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      setCallHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const initiateCall = async (targetUserId, callType = 'audio') => {
    try {
      // Navigate to call page with user ID and call type
      navigate(`/call/${targetUserId}?type=${callType}`);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const formatCallDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'Not connected';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCallTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getCallIcon = (call) => {
    const isOutgoing = call.caller_id === user.id;
    const isVideo = call.call_type === 'video';
    const isMissed = call.status === 'missed';
    
    if (isMissed) {
      return (
        <svg className="call-icon missed" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.95 21L17.4 18.45C15.8 19.45 13.9 20 12 20C7.59 20 4 16.41 4 12C4 10.1 4.55 8.2 5.55 6.6L3 4.05L4.05 3L21 19.95L19.95 21M12 4C16.41 4 20 7.59 20 12C20 13.9 19.45 15.8 18.45 17.4L16.8 15.75C17.25 14.6 17.5 13.35 17.5 12C17.5 9 15 6.5 12 6.5C10.65 6.5 9.4 6.75 8.25 7.2L6.6 5.55C8.2 4.55 10.1 4 12 4Z"/>
        </svg>
      );
    }

    if (isVideo) {
      return (
        <svg className={`call-icon ${isOutgoing ? 'outgoing' : 'incoming'}`} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
        </svg>
      );
    }

    return (
      <svg className={`call-icon ${isOutgoing ? 'outgoing' : 'incoming'}`} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="page page-calls">
        <div className="calls-loading">
          <div className="loading-spinner"></div>
          <p>Loading call history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-calls">
      <div className="calls-header">
        <h1>Calls</h1>
        <div className="calls-actions">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/messages')}
          >
            Messages
          </button>
        </div>
      </div>

      {callHistory.length === 0 ? (
        <div className="calls-empty">
          <div className="empty-icon">📞</div>
          <h3>No calls yet</h3>
          <p>Start a conversation to make your first call</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/messages')}
          >
            Go to Messages
          </button>
        </div>
      ) : (
        <div className="calls-list">
          {callHistory.map((call) => {
            const isIncoming = call.is_incoming;
            const otherUserId = call.other_user_id;
            const otherUsername = call.username;
            const otherFullName = call.full_name;
            const otherAvatarUrl = call.avatar_url;
            
            return (
              <motion.div
                key={call.id}
                className="call-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="call-info">
                  <div className="call-user">
                    <img 
                      src={otherAvatarUrl || `https://ui-avatars.com/api/?name=${otherUsername}`}
                      alt={otherUsername}
                      className="call-avatar"
                      onClick={() => navigate(`/profile/${otherUsername}`)}
                    />
                    <div className="call-details">
                      <h4 onClick={() => navigate(`/profile/${otherUsername}`)}>
                        {otherFullName || otherUsername}
                      </h4>
                      <div className="call-meta">
                        {getCallIcon(call)}
                        <span className={`call-status ${call.status}`}>
                          {call.status === 'completed' && call.duration 
                            ? formatCallDuration(call.duration)
                            : call.status.charAt(0).toUpperCase() + call.status.slice(1)
                          }
                        </span>
                        <span className="call-time">
                          {formatCallTime(call.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="call-actions">
                  <button 
                    className="call-btn audio"
                    onClick={() => initiateCall(otherUserId, 'audio')}
                    title="Audio call"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                    </svg>
                  </button>
                  <button 
                    className="call-btn video"
                    onClick={() => initiateCall(otherUserId, 'video')}
                    title="Video call"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                    </svg>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}