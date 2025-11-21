import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout/Layout";
import SearchBar from "../components/SearchBar";
import FollowButton from "../components/FollowButton";
import useDebounce from "../hooks/useDebounce";
import { formatNumber } from "../utils/formatters/formatNumber";
import "./Profile.css";

/**
 * Likes - Page showing list of users who liked a post
 * @component
 * @param {Object} user - Current logged-in user
 * @param {Object} userProfile - Current user profile
 * @returns {React.ReactElement}
 */
export default function Likes({ user, userProfile }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [likes, setLikes] = useState([]);
  const [filteredLikes, setFilteredLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchLikes = useCallback(async () => {
    try {
      setLoading(true);

      // Get likes with user information
      const { data, error } = await supabase
        .from("likes")
        .select(`
          user_id,
          created_at,
          user:user_id (
            id,
            username,
            full_name,
            avatar_url,
            is_private
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map to user objects, filter out null users
      const likeUsers = (data || [])
        .map(like => like.user)
        .filter(user => user !== null);
      
      setLikes(likeUsers);
      setFilteredLikes(likeUsers);
    } catch (error) {
      console.error("Error fetching likes:", error);
      setLikes([]);
      setFilteredLikes([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchLikes();
    }
  }, [fetchLikes, postId]);

  // Filter likes based on search query
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredLikes(likes);
      return;
    }

    const query = debouncedSearch.toLowerCase();
    const filtered = (likes || []).filter(likeUser => {
      const fullName = (likeUser?.full_name || "").toLowerCase();
      const username = (likeUser?.username || "").toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
    setFilteredLikes(filtered);
  }, [debouncedSearch, likes]);

  if (loading) {
    return (
      <Layout user={user} userProfile={userProfile}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} userProfile={userProfile}>
      <div className="followers-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>Likes</h1>
          <span className="followers-count">
            {formatNumber(likes.length)}
          </span>
        </div>

        {/* Search Bar */}
        {likes.length > 0 && (
          <div className="search-container">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => {}}
              placeholder="Search users..."
              user={user}
              showHistory={false}
            />
          </div>
        )}

        <div className="users-list">
          {likes.length === 0 ? (
            <div className="empty-state">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                style={{ margin: '0 auto 16px', opacity: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p>No likes yet</p>
              <p className="empty-state-subtitle">
                Be the first to like this post
              </p>
            </div>
          ) : filteredLikes.length === 0 ? (
            <div className="empty-state">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                style={{ margin: '0 auto 16px', opacity: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No users found</p>
              <p className="empty-state-subtitle">
                Try a different search term
              </p>
            </div>
          ) : (
            (filteredLikes || []).map(likeUser => (
              <div 
                key={likeUser.id} 
                className="user-card"
              >
                <div 
                  className="user-card-info"
                  onClick={() => navigate(`/profile/${likeUser.username}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={likeUser.avatar_url || `https://ui-avatars.com/api/?name=${likeUser.username || 'User'}`} 
                    alt={likeUser.full_name || likeUser.username} 
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <h3>{likeUser.full_name || likeUser.username}</h3>
                    <p>@{likeUser.username}</p>
                  </div>
                </div>
                <div className="user-card-actions">
                  {user?.id !== likeUser.id && (
                    <FollowButton 
                      myUserId={user?.id}
                      profileUserId={likeUser.id}
                      isPrivate={likeUser.is_private}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
