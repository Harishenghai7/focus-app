import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { formatNumber } from '../utils/formatters/formatNumber';
import { useWebRTCStream } from '../hooks/useWebRTCStream';
import VideoPlayer from '../components/VideoPlayer';
import ChatWindow from '../components/ChatWindow';
import HeartAnimation from '../components/HeartAnimation';
import './LiveStream.css';

/**
 * LiveStream.js
 * Full-featured live streaming page with:
 * - Live video player
 * - Live chat sidebar
 * - Viewer count
 * - Like/heart animations
 * - Share button
 * - End stream (if broadcaster)
 * - Join stream notification
 */
const LiveStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEndStreamConfirm, setShowEndStreamConfirm] = useState(false);
  const chatEndRef = useRef(null);
  const heartAnimationRef = useRef(null);

  // WebRTC stream hook
  const {
    localStream,
    remoteStream,
    isConnected,
    viewersList,
    startBroadcast,
    joinStream,
    endBroadcast,
    sendDataMessage
  } = useWebRTCStream(streamId);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to authenticate user');
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // Fetch stream details
  useEffect(() => {
    const fetchStream = async () => {
      if (!streamId) {
        setError('Stream ID is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('live_streams')
          .select(`
            *,
            broadcaster:users!broadcaster_id(
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', streamId)
          .eq('status', 'live')
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Stream not found or has ended');
          setLoading(false);
          return;
        }

        setStream(data);
        setLoading(false);

        // Join as viewer if not the broadcaster
        if (currentUser && data.broadcaster_id !== currentUser.id) {
          await joinStream();
          await recordStreamJoin();
        } else if (currentUser && data.broadcaster_id === currentUser.id) {
          await startBroadcast();
        }
      } catch (err) {
        console.error('Error fetching stream:', err);
        setError('Failed to load stream');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStream();
    }
  }, [streamId, currentUser, joinStream, startBroadcast]);

  // Record stream join
  const recordStreamJoin = async () => {
    try {
      await supabase.from('stream_viewers').insert({
        stream_id: streamId,
        user_id: currentUser.id,
        joined_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording stream join:', err);
    }
  };

  // Subscribe to viewer count updates
  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`stream:${streamId}:viewers`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_viewers',
        filter: `stream_id=eq.${streamId}`
      }, async () => {
        await fetchViewerCount();
      })
      .subscribe();

    fetchViewerCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // Fetch viewer count
  const fetchViewerCount = async () => {
    try {
      const { count, error } = await supabase
        .from('stream_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .gte('joined_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) throw error;
      setViewerCount(count || 0);
    } catch (err) {
      console.error('Error fetching viewer count:', err);
    }
  };

  // Subscribe to chat messages
  useEffect(() => {
    if (!streamId) return;

    const fetchChatMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('stream_chat')
          .select(`
            *,
            user:users(id, username, avatar_url)
          `)
          .eq('stream_id', streamId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;
        setChatMessages(data || []);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchChatMessages();

    const channel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_chat',
        filter: `stream_id=eq.${streamId}`
      }, (payload) => {
        setChatMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase.from('stream_chat').insert({
        stream_id: streamId,
        user_id: currentUser.id,
        message: newMessage.trim()
      });

      if (error) throw error;

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle like/heart
  const handleLike = async () => {
    if (!currentUser) return;

    try {
      setIsLiked(true);
      setShowHearts(true);

      // Insert like
      await supabase.from('stream_likes').insert({
        stream_id: streamId,
        user_id: currentUser.id
      });

      // Update stream like count
      await supabase.rpc('increment_stream_likes', { stream_id: streamId });

      // Hide hearts after animation
      setTimeout(() => setShowHearts(false), 3000);
    } catch (err) {
      console.error('Error liking stream:', err);
      setIsLiked(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/live/${streamId}`;
    const shareText = `Watch ${stream?.broadcaster?.username}'s live stream!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Live Stream',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
    setShowShareMenu(false);
  };

  // Handle end stream
  const handleEndStream = async () => {
    if (!stream || stream.broadcaster_id !== currentUser?.id) return;

    try {
      // Update stream status
      await supabase
        .from('live_streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId);

      // End broadcast
      await endBroadcast();

      setShowEndStreamConfirm(false);
      navigate('/profile');
    } catch (err) {
      console.error('Error ending stream:', err);
      alert('Failed to end stream');
    }
  };

  // Handle leave stream (viewer)
  const handleLeaveStream = () => {
    navigate(-1);
  };

  const isBroadcaster = stream && currentUser && stream.broadcaster_id === currentUser.id;

  if (loading) {
    return (
      <div className="live-stream-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="live-stream-container">
        <div className="error-state">
          <h2>Stream Not Available</h2>
          <p>{error || 'This stream is no longer available'}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-stream-container">
      {/* Video Player Section */}
      <div className="video-section">
        <VideoPlayer
          stream={isBroadcaster ? localStream : remoteStream}
          isLive={true}
          isBroadcaster={isBroadcaster}
        />

        {/* Stream Overlay UI */}
        <div className="stream-overlay">
          {/* Top Bar */}
          <div className="stream-top-bar">
            <div className="stream-info">
              <span className="live-badge">LIVE</span>
              <span className="viewer-count">
                <i className="fas fa-eye"></i> {formatNumber(viewerCount)}
              </span>
            </div>

            {isBroadcaster && (
              <button
                className="end-stream-button"
                onClick={() => setShowEndStreamConfirm(true)}
              >
                <i className="fas fa-stop-circle"></i> End Stream
              </button>
            )}
          </div>

          {/* Broadcaster Info */}
          <div className="broadcaster-info">
            <img
              src={stream.broadcaster?.avatar_url || '/default-avatar.png'}
              alt={stream.broadcaster?.username}
              className="broadcaster-avatar"
            />
            <div className="broadcaster-details">
              <h3 className="broadcaster-name">
                {stream.broadcaster?.full_name || stream.broadcaster?.username}
              </h3>
              <p className="broadcaster-username">@{stream.broadcaster?.username}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="stream-actions">
            <button
              className={`action-button like-button ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={isLiked}
            >
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
            </button>

            <button
              className="action-button share-button"
              onClick={handleShare}
            >
              <i className="fas fa-share"></i>
            </button>

            {!isBroadcaster && (
              <button
                className="action-button leave-button"
                onClick={handleLeaveStream}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Heart Animation */}
        {showHearts && (
          <HeartAnimation ref={heartAnimationRef} />
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="connection-status">
            <div className="spinner-small"></div>
            <span>Connecting...</span>
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <div className="chat-section">
        <ChatWindow
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          currentUser={currentUser}
          chatEndRef={chatEndRef}
        />
      </div>

      {/* End Stream Confirmation Modal */}
      {showEndStreamConfirm && (
        <div className="modal-overlay" onClick={() => setShowEndStreamConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>End Stream?</h3>
            <p>Are you sure you want to end this live stream? This cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowEndStreamConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-button end-stream"
                onClick={handleEndStream}
              >
                End Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Stream Notification */}
      {!isBroadcaster && isConnected && (
        <div className="join-notification">
          You joined the stream
        </div>
      )}
    </div>
  );
};

export default LiveStream;
