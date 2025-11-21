import React, { useState, useEffect, useCallback, useRef } from 'react';
import { components, hooks, utils } from '@/importMap';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Calls.css';

// Destructure required imports from importMap
const { CallButton, IncomingCallModal } = components;
const { useWebRTCCall, useMediaPermissions } = hooks;
const { callSignaling, dateFormatter, helpers } = utils;

function Calls({ user, userProfile }) {
  const navigate = useNavigate();
  
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  
  // New Call Modal
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [filteredContacts, setFilteredContacts] = useState([]);
  
  // Call actions menu
  const [showCallActions, setShowCallActions] = useState(null);
  
  // Incoming call state
  const [incomingCall, setIncomingCall] = useState(null);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  
  const subscriptionRef = useRef(null);
  const callActionsRef = useRef(null);
  const incomingCallChannelRef = useRef(null);

  // Use custom hooks for WebRTC and media permissions
  const { hasPermissions, requestPermissions, permissionError } = useMediaPermissions();
  const webRTCCall = useWebRTCCall();

  // Fetch call history with better error handling
  const fetchCalls = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          caller:caller_id(id, username, full_name, avatar_url, is_verified),
          receiver:receiver_id(id, username, full_name, avatar_url, is_verified)
        `)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Safety: ensure data is always an array
      const validCalls = (data || []).filter(call => call.caller && call.receiver);
      setCalls(validCalls);
      setFilteredCalls(validCalls);
    } catch (err) {
      console.error('Error fetching calls:', err);
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch contacts for new call
  const fetchContacts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingContacts(true);

      // Get following users
      const { data: following, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'active');

      if (followError) throw followError;

      const followingIds = following.map(f => f.following_id);

      if (followingIds.length === 0) {
        setContacts([]);
        setFilteredContacts([]);
        return;
      }

      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', followingIds)
        .order('full_name', { ascending: true });

      if (profileError) throw profileError;

      setContacts(profiles || []);
      setFilteredContacts(profiles || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [user?.id]);

  // Subscribe to new calls with realtime updates
  const subscribeToNewCalls = useCallback(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `caller_id=eq.${user.id}`
        },
        async (payload) => {
          const { data: receiver } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_verified')
            .eq('id', payload.new.receiver_id)
            .single();

          if (receiver) {
            const newCall = { ...payload.new, caller: userProfile, receiver };
            setCalls(prev => [newCall, ...prev]);
            setFilteredCalls(prev => [newCall, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const { data: caller } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_verified')
            .eq('id', payload.new.caller_id)
            .single();

          if (caller) {
            const newCall = { ...payload.new, caller, receiver: userProfile };
            setCalls(prev => [newCall, ...prev]);
            setFilteredCalls(prev => [newCall, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls'
        },
        (payload) => {
          setCalls(prev =>
            prev.map(call => call.id === payload.new.id ? { ...call, ...payload.new } : call)
          );
          setFilteredCalls(prev =>
            prev.map(call => call.id === payload.new.id ? { ...call, ...payload.new } : call)
          );
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id, userProfile]);

  // Initialize
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchCalls();
    const unsubscribe = subscribeToNewCalls();

    return () => {
      unsubscribe?.();
    };
  }, [user, navigate, fetchCalls, subscribeToNewCalls]);

  // Filter calls
  useEffect(() => {
    let filtered = [...calls];

    if (filter === 'missed') {
      filtered = filtered.filter(call => 
        call.status === 'missed' && call.receiver_id === user?.id
      );
    } else if (filter === 'incoming') {
      filtered = filtered.filter(call => call.receiver_id === user?.id);
    } else if (filter === 'outgoing') {
      filtered = filtered.filter(call => call.caller_id === user?.id);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(call => {
        const otherUser = call.caller_id === user?.id ? call.receiver : call.caller;
        return (
          otherUser?.username?.toLowerCase().includes(query) ||
          otherUser?.full_name?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredCalls(filtered);
  }, [calls, filter, searchQuery, user?.id]);

  // Filter contacts
  useEffect(() => {
    if (contactSearchQuery.trim()) {
      const query = contactSearchQuery.toLowerCase();
      const filtered = contacts.filter(contact =>
        contact.username?.toLowerCase().includes(query) ||
        contact.full_name?.toLowerCase().includes(query)
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [contactSearchQuery, contacts]);

  // Close call actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (callActionsRef.current && !callActionsRef.current.contains(e.target)) {
        setShowCallActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open new call modal
  const handleOpenNewCall = () => {
    setShowNewCallModal(true);
    fetchContacts();
  };

  // Format time with better display
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 86400000) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diff < 172800000) {
      return 'Yesterday';
    } else if (diff < 604800000) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Format duration using utility function
  const formatCallDuration = (seconds) => {
    if (!seconds || seconds === 0) return null;
    
    // Use the dateFormatter utility for consistent formatting
    if (dateFormatter?.formatDuration) {
      return dateFormatter.formatDuration(seconds);
    }
    
    // Fallback to local implementation
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Get call status info
  const getCallStatusInfo = (call) => {
    const isOutgoing = call.caller_id === user?.id;
    
    if (call.status === 'missed' && !isOutgoing) {
      return { text: 'Missed', color: 'missed', icon: 'missed' };
    } else if (call.status === 'declined') {
      return { text: 'Declined', color: 'declined', icon: 'declined' };
    } else if (call.status === 'completed') {
      const duration = formatCallDuration(call.duration);
      return { text: duration || 'Completed', color: 'completed', icon: isOutgoing ? 'outgoing' : 'incoming' };
    } else if (call.status === 'failed') {
      return { text: 'Failed', color: 'failed', icon: 'failed' };
    }
    return { text: isOutgoing ? 'Outgoing' : 'Incoming', color: 'default', icon: isOutgoing ? 'outgoing' : 'incoming' };
  };

  // Start new call with media permissions check
  const handleStartCall = async (userId, type) => {
    setShowNewCallModal(false);
    
    // Check media permissions before starting call
    if (!hasPermissions) {
      const granted = await requestPermissions(type === 'video');
      if (!granted) {
        alert('Camera and microphone permissions are required to make a call');
        return;
      }
    }
    
    // Use call signaling if available
    if (callSignaling?.initializeCall) {
      try {
        await callSignaling.initializeCall(userId, type, user.id);
      } catch (error) {
        console.error('Failed to initialize call:', error);
      }
    }
    
    navigate(`/call/${userId}?type=${type}`);
  };

  // Navigate to user profile
  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  // Delete call
  const handleDeleteCall = async (callId, e) => {
    if (e) e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', callId);

      if (error) throw error;

      setCalls(prev => prev.filter(c => c.id !== callId));
      setShowCallActions(null);
    } catch (err) {
      console.error('Error deleting call:', err);
    }
  };

  // View call details
  const handleViewCallDetails = (call) => {
    setSelectedCall(call);
    setShowCallActions(null);
  };

  // Group calls by date
  const groupCallsByDate = (calls) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Safety: ensure calls is always an array
    (calls || []).forEach(call => {
      const callDate = new Date(call.created_at);
      let groupKey;

      if (callDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (callDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (callDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = callDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        groupKey = callDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(call);
    });

    return groups;
  };

  const groupedCalls = groupCallsByDate(filteredCalls);

  // Subscribe to incoming calls
  const subscribeToIncomingCalls = useCallback(() => {
    if (!user?.id) return;

    // Create a dedicated channel for incoming call notifications
    const channel = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          // Only show modal for active/ringing calls
          if (payload.new.status === 'ringing' || payload.new.status === 'calling') {
            // Fetch caller details
            const { data: caller } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url, is_verified')
              .eq('id', payload.new.caller_id)
              .single();

            if (caller) {
              const callData = {
                ...payload.new,
                caller,
                receiver: userProfile
              };
              setIncomingCall(callData);
              setShowIncomingCallModal(true);
            }
          }
        }
      )
      .subscribe();

    incomingCallChannelRef.current = channel;

    return () => {
      if (incomingCallChannelRef.current) {
        supabase.removeChannel(incomingCallChannelRef.current);
      }
    };
  }, [user?.id, userProfile]);

  // Handle incoming call actions
  const handleAcceptCall = useCallback(async (callId, callType) => {
    setShowIncomingCallModal(false);
    
    // Check permissions first
    if (!hasPermissions) {
      const granted = await requestPermissions(callType === 'video');
      if (!granted) {
        // Decline the call if permissions not granted
        if (callSignaling?.declineCall) {
          await callSignaling.declineCall(callId);
        }
        return;
      }
    }
    
    // Accept the call via signaling
    if (callSignaling?.acceptCall) {
      await callSignaling.acceptCall(callId);
    }
    
    // Navigate to call page
    navigate(`/call/${incomingCall?.caller?.id}?callId=${callId}&type=${callType}`);
    setIncomingCall(null);
  }, [hasPermissions, requestPermissions, incomingCall, navigate]);

  const handleDeclineCall = useCallback(async (callId) => {
    setShowIncomingCallModal(false);
    
    // Decline the call via signaling
    if (callSignaling?.declineCall) {
      await callSignaling.declineCall(callId);
    }
    
    setIncomingCall(null);
  }, []);

  // Initialize incoming call listener
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = subscribeToIncomingCalls();
    return () => {
      unsubscribe?.();
    };
  }, [user?.id, subscribeToIncomingCalls]);

  // Loading state
  if (loading) {
    return (
      <div className="calls-loading">
        <div className="loading-content">
          <div className="spinner-focus"></div>
          <p>Loading calls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-calls">
      {/* Header */}
      <div className="calls-header">
        <div className="calls-header-left">
          <h1>Calls</h1>
          <span className="calls-count">{calls.length}</span>
        </div>
        <div className="calls-header-actions">
          <button
            className={`btn-icon-header ${isSearching ? 'active' : ''}`}
            onClick={() => setIsSearching(!isSearching)}
            aria-label="Search calls"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            className="btn-new-call"
            onClick={handleOpenNewCall}
            aria-label="New call"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            className="calls-search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="search-input-container">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="calls-filters">
        <div className="filters-container">
          {[
            { value: 'all', label: 'All', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
            { value: 'missed', label: 'Missed', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5.69l-2.97 2.97a.75.75 0 101.06 1.06l3.25-3.25a.75.75 0 00.22-.53V5z' },
            { value: 'incoming', label: 'Incoming', icon: 'M8 4a.5.5 0 01.5.5v3h5a.5.5 0 010 1h-5v3a.5.5 0 01-1 0v-7A.5.5 0 018 4z' },
            { value: 'outgoing', label: 'Outgoing', icon: 'M16 4a.5.5 0 01.5.5v7a.5.5 0 01-1 0v-3h-5a.5.5 0 010-1h5v-3A.5.5 0 0116 4z' }
          ].map(filterItem => (
            <button
              key={filterItem.value}
              className={`filter-btn ${filter === filterItem.value ? 'active' : ''}`}
              onClick={() => setFilter(filterItem.value)}
            >
              <span>{filterItem.label}</span>
              {filter === filterItem.value && calls.length > 0 && (
                <motion.div
                  className="filter-indicator"
                  layoutId="filter-indicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div 
          className="calls-error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <div>
            <p className="error-title">{error}</p>
            <button className="error-retry" onClick={fetchCalls}>Retry</button>
          </div>
        </motion.div>
      )}

      {/* Calls list */}
      <div className="calls-content">
        {filteredCalls.length === 0 ? (
          <motion.div 
            className="calls-empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-illustration">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3>
              {searchQuery 
                ? 'No calls found' 
                : filter === 'missed'
                ? 'No missed calls'
                : 'No calls yet'}
            </h3>
            <p>
              {searchQuery 
                ? 'Try searching with a different name' 
                : filter === 'missed'
                ? 'You have no missed calls'
                : 'Start connecting with your contacts through video or audio calls'}
            </p>
            {!searchQuery && (
              <button className="btn-start-calling" onClick={handleOpenNewCall}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
                Start Calling
              </button>
            )}
          </motion.div>
        ) : (
          <div className="calls-list">
            {Object.entries(groupedCalls).map(([dateGroup, groupCalls]) => (
              <div key={dateGroup} className="calls-group">
                <div className="calls-group-header">
                  <span>{dateGroup}</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {groupCalls.map((call, index) => {
                    const isOutgoing = call.caller_id === user?.id;
                    const otherUser = isOutgoing ? call.receiver : call.caller;
                    const statusInfo = getCallStatusInfo(call);

                    return (
                      <motion.div
                        key={call.id}
                        className={`call-item ${statusInfo.color}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100, height: 0 }}
                        transition={{ delay: index * 0.02 }}
                        layout
                      >
                        <div className="call-main" onClick={() => handleUserClick(otherUser?.username)}>
                          <div className="call-avatar-wrapper">
                            <img
                              src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUser?.username}&background=random&color=fff`}
                              alt={otherUser?.username}
                              className="call-avatar"
                            />
                            {call.type === 'video' && (
                              <div className="call-type-badge video">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="call-info-wrapper">
                            <div className="call-user-info">
                              <h4>
                                {otherUser?.full_name || otherUser?.username}
                                {otherUser?.is_verified && (
                                  <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                )}
                              </h4>
                            </div>
                            
                            <div className="call-metadata">
                              <svg 
                                className={`call-direction-icon ${statusInfo.icon}`}
                                viewBox="0 0 24 24" 
                                fill="currentColor"
                              >
                                {statusInfo.icon === 'outgoing' && (
                                  <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z" />
                                )}
                                {statusInfo.icon === 'incoming' && (
                                  <path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41z" />
                                )}
                                {statusInfo.icon === 'missed' && (
                                  <path d="M19.59 7L12 14.59 6.41 9H11V7H3v8h2v-4.59l7 7 9-9z" />
                                )}
                              </svg>
                              <span className={`call-status-text ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                              <span className="call-time-dot">•</span>
                              <span className="call-time">{formatTime(call.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="call-actions-wrapper">
                          {/* Use CallButton component for video call */}
                          <CallButton
                            userId={otherUser?.id}
                            type="video"
                            onCallStart={(userId, type) => {
                              handleStartCall(userId, type);
                            }}
                            className="call-action-btn video"
                          />
                          
                          {/* Use CallButton component for audio call */}
                          <CallButton
                            userId={otherUser?.id}
                            type="audio"
                            onCallStart={(userId, type) => {
                              handleStartCall(userId, type);
                            }}
                            className="call-action-btn audio"
                          />

                          <button
                            className="call-action-btn more"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCallActions(showCallActions === call.id ? null : call.id);
                            }}
                            aria-label="More options"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>

                          {/* Call Actions Menu */}
                          <AnimatePresence>
                            {showCallActions === call.id && (
                              <motion.div
                                ref={callActionsRef}
                                className="call-actions-menu"
                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                transition={{ duration: 0.15 }}
                              >
                                <button onClick={() => handleViewCallDetails(call)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  View Details
                                </button>
                                <button onClick={() => handleUserClick(otherUser?.username)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  View Profile
                                </button>
                                <button 
                                  className="delete-action"
                                  onClick={(e) => handleDeleteCall(call.id, e)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Call
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Call Modal */}
      <AnimatePresence>
        {showNewCallModal && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewCallModal(false)}
            />
            <motion.div
              className="new-call-modal"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              <div className="modal-header">
                <h2>New Call</h2>
                <button
                  className="btn-modal-close"
                  onClick={() => setShowNewCallModal(false)}
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <div className="modal-search-wrapper">
                <div className="modal-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {contactSearchQuery && (
                    <button onClick={() => setContactSearchQuery('')} aria-label="Clear">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-content">
                {loadingContacts ? (
                  <div className="modal-loading">
                    <div className="spinner-focus"></div>
                    <p>Loading contacts...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="modal-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>{contactSearchQuery ? 'No contacts match your search' : 'No contacts to call'}</p>
                    <span>Follow someone to start calling</span>
                  </div>
                ) : (
                  <div className="contacts-list-modal">
                    <AnimatePresence mode="popLayout">
                      {filteredContacts.map((contact, index) => (
                        <motion.div
                          key={contact.id}
                          className="contact-item-modal"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ delay: index * 0.03 }}
                          layout
                        >
                          <div className="contact-info-modal" onClick={() => handleUserClick(contact.username)}>
                            <img
                              src={contact.avatar_url || `https://ui-avatars.com/api/?name=${contact.username}&background=random&color=fff`}
                              alt={contact.username}
                              className="contact-avatar-modal"
                            />
                            <div className="contact-details-modal">
                              <h4>
                                {contact.full_name || contact.username}
                                {contact.is_verified && (
                                  <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                )}
                              </h4>
                              <p>@{contact.username}</p>
                            </div>
                          </div>
                          <div className="contact-actions-modal">
                            <CallButton
                              userId={contact.id}
                              type="video"
                              onCallStart={(userId, type) => handleStartCall(userId, type)}
                              className="call-btn-modal video"
                            />
                            <CallButton
                              userId={contact.id}
                              type="audio"
                              onCallStart={(userId, type) => handleStartCall(userId, type)}
                              className="call-btn-modal audio"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Call Details Modal */}
      <AnimatePresence>
        {selectedCall && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCall(null)}
            />
            <motion.div
              className="call-details-modal"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              <div className="modal-header">
                <h2>Call Details</h2>
                <button
                  className="btn-modal-close"
                  onClick={() => setSelectedCall(null)}
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <div className="call-details-content">
                {(() => {
                  const isOutgoing = selectedCall.caller_id === user?.id;
                  const otherUser = isOutgoing ? selectedCall.receiver : selectedCall.caller;
                  const statusInfo = getCallStatusInfo(selectedCall);

                  return (
                    <>
                      <div className="call-details-user">
                        <img
                          src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUser?.username}&background=random&color=fff`}
                          alt={otherUser?.username}
                          className="call-details-avatar"
                        />
                        <h3>
                          {otherUser?.full_name || otherUser?.username}
                          {otherUser?.is_verified && (
                            <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </h3>
                        <p>@{otherUser?.username}</p>
                      </div>

                      <div className="call-details-info">
                        <div className="call-detail-row">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">
                            {selectedCall.type === 'video' ? 'Video Call' : 'Audio Call'}
                          </span>
                        </div>
                        <div className="call-detail-row">
                          <span className="detail-label">Direction</span>
                          <span className="detail-value">
                            {isOutgoing ? 'Outgoing' : 'Incoming'}
                          </span>
                        </div>
                        <div className="call-detail-row">
                          <span className="detail-label">Status</span>
                          <span className={`detail-value status-${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <div className="call-detail-row">
                          <span className="detail-label">Time</span>
                          <span className="detail-value">
                            {new Date(selectedCall.created_at).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>
                        {selectedCall.duration > 0 && (
                          <div className="call-detail-row">
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">
                              {formatCallDuration(selectedCall.duration)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="call-details-actions">
                        <CallButton
                          userId={otherUser?.id}
                          type="video"
                          onCallStart={(userId, type) => {
                            setSelectedCall(null);
                            handleStartCall(userId, type);
                          }}
                          className="btn-detail-action video"
                          showLabel={true}
                          label="Video Call"
                        />
                        <CallButton
                          userId={otherUser?.id}
                          type="audio"
                          onCallStart={(userId, type) => {
                            setSelectedCall(null);
                            handleStartCall(userId, type);
                          }}
                          className="btn-detail-action audio"
                          showLabel={true}
                          label="Audio Call"
                        />
                        <button
                          className="btn-detail-action delete"
                          onClick={() => {
                            handleDeleteCall(selectedCall.id);
                            setSelectedCall(null);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Call
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          show={showIncomingCallModal}
          call={incomingCall}
          onAccept={() => handleAcceptCall(incomingCall.id, incomingCall.type)}
          onDecline={() => handleDeclineCall(incomingCall.id)}
          onClose={() => {
            setShowIncomingCallModal(false);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}

export default Calls;
