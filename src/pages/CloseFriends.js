import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CloseFriends.css';

export default function CloseFriends({ user }) {
  const navigate = useNavigate();
  const [closeFriends, setCloseFriends] = useState([]);
  const [allFollowing, setAllFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCloseFriends();
    fetchAllFollowing();
  }, [user]);

  const fetchCloseFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('close_friends')
        .select(`
          friend_id,
          profiles:friend_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCloseFriends(data?.map(cf => cf.profiles) || []);
    } catch (error) {
      console.error('Error fetching close friends:', error);
    }
  };

  const fetchAllFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:following_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('follower_id', user.id);

      if (error) throw error;
      setAllFollowing(data?.map(f => f.profiles) || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCloseFriend = (friendId) => {
    return closeFriends.some(cf => cf.id === friendId);
  };

  const toggleCloseFriend = async (friend) => {
    try {
      if (isCloseFriend(friend.id)) {
        // Remove from close friends
        await supabase
          .from('close_friends')
          .delete()
          .eq('user_id', user.id)
          .eq('friend_id', friend.id);

        setCloseFriends(prev => prev.filter(cf => cf.id !== friend.id));
      } else {
        // Add to close friends
        await supabase
          .from('close_friends')
          .insert({
            user_id: user.id,
            friend_id: friend.id
          });

        setCloseFriends(prev => [...prev, friend]);
      }
    } catch (error) {
      console.error('Error toggling close friend:', error);
      alert('Failed to update close friends');
    }
  };

  const filteredFollowing = allFollowing.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="close-friends-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="close-friends-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="close-friends-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Close Friends</h1>
          <p className="subtitle">Share stories with your closest friends</p>
        </div>
        <div className="cf-count">
          <span className="count-badge">{closeFriends.length}</span>
        </div>
      </div>

      {closeFriends.length > 0 && (
        <div className="selected-friends">
          <h3>Selected ({closeFriends.length})</h3>
          <div className="friends-chips">
            {closeFriends.map(friend => (
              <div key={friend.id} className="friend-chip">
                <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} alt="" />
                <span>{friend.username}</span>
                <button onClick={() => toggleCloseFriend(friend)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="friends-list">
        {filteredFollowing.length === 0 ? (
          <div className="empty-state">
            <p>No friends found</p>
          </div>
        ) : (
          filteredFollowing.map(friend => (
            <motion.div
              key={friend.id}
              className="friend-item"
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`}
                alt={friend.username}
                className="friend-avatar"
              />
              <div className="friend-info">
                <div className="friend-username">
                  {friend.username}
                  {friend.is_verified && (
                    <svg className="verified" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                {friend.full_name && (
                  <div className="friend-fullname">{friend.full_name}</div>
                )}
              </div>
              <button
                className={`toggle-btn ${isCloseFriend(friend.id) ? 'active' : ''}`}
                onClick={() => toggleCloseFriend(friend)}
              >
                {isCloseFriend(friend.id) ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                )}
              </button>
            </motion.div>
          ))
        )}
      </div>

      <div className="info-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p>Stories shared with close friends will have a green ring</p>
      </div>
    </motion.div>
  );
}
