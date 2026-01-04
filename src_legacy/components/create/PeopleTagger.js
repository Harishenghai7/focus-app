/**
 * PeopleTagger Component
 * Search and tag people in posts
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './PeopleTagger.css';

const PeopleTagger = ({ value = [], onChange, onClose, maxTags = 20 }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Load user's following list
  useEffect(() => {
    if (!user) return;

    const loadFollowing = async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select(`
            followed_id,
            followed:users!follows_followed_id_fkey (
              id,
              username,
              display_name,
              avatar_url,
              verified
            )
          `)
          .eq('follower_id', user.id)
          .limit(50);

        if (error) throw error;

        setFollowing(data?.map(f => f.followed) || []);
      } catch (error) {
        console.error('Error loading following:', error);
      }
    };

    loadFollowing();
  }, [user]);

  // Search users
  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, verified')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(20);

        if (error) throw error;

        // Filter out already tagged users
        const filtered = data?.filter(u => 
          !value.some(tagged => tagged.id === u.id)
        ) || [];

        setUsers(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, value]);

  const handleAddTag = (user) => {
    if (value.length >= maxTags) {
      alert(`You can only tag up to ${maxTags} people`);
      return;
    }

    if (!value.some(u => u.id === user.id)) {
      onChange([...value, user]);
      setQuery('');
      setUsers([]);
    }
  };

  const handleRemoveTag = (userId) => {
    onChange(value.filter(u => u.id !== userId));
  };

  return (
    <div className="people-tagger">
      <div className="people-tagger-header">
        <h3>Tag People</h3>
        <div className="people-tagger-count">
          {value.length}/{maxTags}
        </div>
        <button
          className="people-tagger-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="people-tagger-search">
        <span className="people-tagger-search-icon">🔍</span>
        <input
          type="text"
          className="people-tagger-search-input"
          placeholder="Search people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="people-tagger-search-clear"
            onClick={() => {
              setQuery('');
              setUsers([]);
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tagged People */}
      {value.length > 0 && (
        <div className="people-tagger-tagged">
          <h4 className="people-tagger-section-title">Tagged</h4>
          <div className="people-tagger-tagged-list">
            {value.map((user) => (
              <div key={user.id} className="people-tagger-tag">
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.username}
                  className="people-tagger-tag-avatar"
                />
                <div className="people-tagger-tag-info">
                  <div className="people-tagger-tag-name">
                    {user.display_name || user.username}
                    {user.verified && <span className="verified-badge">✓</span>}
                  </div>
                  <div className="people-tagger-tag-username">
                    @{user.username}
                  </div>
                </div>
                <button
                  className="people-tagger-tag-remove"
                  onClick={() => handleRemoveTag(user.id)}
                  aria-label="Remove tag"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results or Following */}
      <div className="people-tagger-results">
        {loading ? (
          <div className="people-tagger-loading">
            <div className="people-tagger-loading-spinner"></div>
            <p>Searching...</p>
          </div>
        ) : query ? (
          users.length > 0 ? (
            <div className="people-tagger-section">
              <h4 className="people-tagger-section-title">Search Results</h4>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="people-tagger-user"
                  onClick={() => handleAddTag(user)}
                >
                  <img
                    src={user.avatar_url || '/default-avatar.png'}
                    alt={user.username}
                    className="people-tagger-user-avatar"
                  />
                  <div className="people-tagger-user-info">
                    <div className="people-tagger-user-name">
                      {user.display_name || user.username}
                      {user.verified && <span className="verified-badge">✓</span>}
                    </div>
                    <div className="people-tagger-user-username">
                      @{user.username}
                    </div>
                  </div>
                  <button
                    className="people-tagger-user-add"
                    aria-label="Tag user"
                  >
                    + Tag
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="people-tagger-empty">
              <span className="people-tagger-empty-icon">🔍</span>
              <p>No users found</p>
              <p className="people-tagger-empty-subtitle">
                Try a different search term
              </p>
            </div>
          )
        ) : following.length > 0 ? (
          <div className="people-tagger-section">
            <h4 className="people-tagger-section-title">Following</h4>
            {following
              .filter(u => !value.some(tagged => tagged.id === u.id))
              .slice(0, 20)
              .map((user) => (
                <div
                  key={user.id}
                  className="people-tagger-user"
                  onClick={() => handleAddTag(user)}
                >
                  <img
                    src={user.avatar_url || '/default-avatar.png'}
                    alt={user.username}
                    className="people-tagger-user-avatar"
                  />
                  <div className="people-tagger-user-info">
                    <div className="people-tagger-user-name">
                      {user.display_name || user.username}
                      {user.verified && <span className="verified-badge">✓</span>}
                    </div>
                    <div className="people-tagger-user-username">
                      @{user.username}
                    </div>
                  </div>
                  <button
                    className="people-tagger-user-add"
                    aria-label="Tag user"
                  >
                    + Tag
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="people-tagger-empty">
            <span className="people-tagger-empty-icon">👥</span>
            <p>No one to tag</p>
            <p className="people-tagger-empty-subtitle">
              Search for people to tag in your post
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleTagger;
