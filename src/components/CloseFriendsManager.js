import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './CloseFriendsManager.css';

export default function CloseFriendsManager({ user, onClose }) {
  const [closeFriends, setCloseFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('close-friends'); // 'close-friends' or 'add'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCloseFriends(), loadFollowers()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCloseFriends = async () => {
    try {
      const { data, error } = await supabase.rpc('get_close_friends');
      if (error) throw error;
      setCloseFriends(data || []);
    } catch (error) {
      console.error('Error loading close friends:', error);
    }
  };

  const loadFollowers = async () => {
    try {
      // Get followers who are not already close friends
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('following_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Filter out users already in close friends
      const closeFriendIds = new Set(closeFriends.map(cf => cf.id));
      const availableFollowers = data
        ?.map(f => f.profiles)
        .filter(p => p && !closeFriendIds.has(p.id)) || [];

      setFollowers(availableFollowers);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const handleAddCloseFriend = async (friendId) => {
    try {
      const { data, error } = await supabase.rpc('add_close_friend', {
        friend_user_id: friendId
      });

      if (error) throw error;

      if (data.success) {
        await loadData(); // Reload both lists
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding close friend:', error);
      alert('Failed to add close friend');
    }
  };

  const handleRemoveCloseFriend = async (friendId) => {
    if (!window.confirm('Remove from close friends?')) return;

    try {
      const { data, error } = await supabase.rpc('remove_close_friend', {
        friend_user_id: friendId
      });

      if (error) throw error;

      if (data.success) {
        await loadData(); // Reload both lists
      }
    } catch (error) {
      console.error('Error removing close friend:', error);
      alert('Failed to remove close friend');
    }
  };

  const filteredCloseFriends = closeFriends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowers = followers.filter(follower =>
    follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="close-friends-manager"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Close Friends</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="close-friends-info">
          <div className="info-icon">⭐</div>
          <p>Share flashes with your close friends only. They won't be notified when you add or remove them.</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'close-friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('close-friends')}
          >
            Close Friends ({closeFriends.length})
          </button>
          <button
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Friends
          </button>
        </div>

        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'close-friends' ? (
                <motion.div
                  key="close-friends"
                  className="friends-list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {filteredCloseFriends.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">👥</div>
                      <p>No close friends yet</p>
                      <small>Add friends to share private flashes with them</small>
                    </div>
                  ) : (
                    filteredCloseFriends.map((friend) => (
                      <div key={friend.id} className="friend-item">
                        <img
                          src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=10b981&color=fff`}
                          alt={friend.username}
                          className="friend-avatar close-friend-ring"
                        />
                        <div className="friend-info">
                          <span className="friend-username">
                            {friend.username}
                            {friend.is_verified && (
                              <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                          </span>
                          {friend.full_name && (
                            <span className="friend-fullname">{friend.full_name}</span>
                          )}
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveCloseFriend(friend.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  className="friends-list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {filteredFollowers.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🔍</div>
                      <p>No followers to add</p>
                      <small>
                        {searchQuery
                          ? 'No followers match your search'
                          : 'All your followers are already close friends'}
                      </small>
                    </div>
                  ) : (
                    filteredFollowers.map((follower) => (
                      <div key={follower.id} className="friend-item">
                        <img
                          src={follower.avatar_url || `https://ui-avatars.com/api/?name=${follower.username}&background=667eea&color=fff`}
                          alt={follower.username}
                          className="friend-avatar"
                        />
                        <div className="friend-info">
                          <span className="friend-username">
                            {follower.username}
                            {follower.is_verified && (
                              <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                          </span>
                          {follower.full_name && (
                            <span className="friend-fullname">{follower.full_name}</span>
                          )}
                        </div>
                        <button
                          className="btn-add"
                          onClick={() => handleAddCloseFriend(follower.id)}
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
