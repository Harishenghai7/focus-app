import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout/Layout";
import SearchBar from "../components/SearchBar";
import FollowButton from "../components/FollowButton";
import useDebounce from "../hooks/useDebounce";
import { formatNumber } from "../utils/formatters/formatNumber";
import "./Profile.css";

export default function FollowingList({ user, userProfile }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isOwnProfile = user?.id === profileData?.id;

  const fetchProfileAndFollowing = useCallback(async () => {
    try {
      // Get profile by username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username || userProfile?.username)
        .single();

      if (profileError) throw profileError;
      setProfileData(profile);

      // Get following
      const { data, error } = await supabase
        .from("follows")
        .select(`
          following_id,
          following:following_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("follower_id", profile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFollowing(data.map(f => f.following));
      }
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoading(false);
    }
  }, [username, userProfile?.username]);

  useEffect(() => {
    fetchProfileAndFollowing();
  }, [fetchProfileAndFollowing]);

  // Filter following based on search query
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredFollowing(following);
      return;
    }

    const query = debouncedSearch.toLowerCase();
    const filtered = following.filter(followedUser => {
      const fullName = (followedUser.full_name || "").toLowerCase();
      const username = (followedUser.username || "").toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
    setFilteredFollowing(filtered);
  }, [debouncedSearch, following]);

  // Handle unfollow
  const handleUnfollow = async (followingId) => {
    if (!window.confirm("Unfollow this user?")) return;

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user?.id)
        .eq("following_id", followingId);

      if (error) throw error;

      // Update local state
      setFollowing(prev => prev.filter(f => f.id !== followingId));
      setFilteredFollowing(prev => prev.filter(f => f.id !== followingId));

      // Show success message (optional)
      console.log("Unfollowed successfully");
    } catch (error) {
      console.error("Error unfollowing:", error);
      alert("Failed to unfollow. Please try again.");
    }
  };

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
      <div className="following-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>Following</h1>
          <span className="followers-count">
            {formatNumber(following.length)}
          </span>
        </div>

        {/* Search Bar */}
        {following.length > 0 && (
          <div className="search-container">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => {}}
              placeholder="Search following..."
              user={user}
              showHistory={false}
            />
          </div>
        )}

        <div className="users-list">
          {following.length === 0 ? (
            <div className="empty-state">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                style={{ margin: '0 auto 16px', opacity: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>Not following anyone yet</p>
              <p className="empty-state-subtitle">
                {isOwnProfile 
                  ? "When you follow people, they'll appear here" 
                  : "This user is not following anyone yet"}
              </p>
            </div>
          ) : filteredFollowing.length === 0 ? (
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
            filteredFollowing.map(followedUser => (
            <div 
              key={followedUser.id} 
              className="user-card"
            >
              <div 
                className="user-card-info"
                onClick={() => navigate(`/profile/${followedUser.username}`)}
              >
                <img 
                  src={followedUser.avatar_url || `https://ui-avatars.com/api/?name=${followedUser.username}`} 
                  alt={followedUser.full_name || followedUser.username} 
                  className="user-avatar"
                />
                <div className="user-info">
                  <h3>{followedUser.full_name || followedUser.username}</h3>
                  <p>@{followedUser.username}</p>
                </div>
              </div>
              <div className="user-card-actions">
                {isOwnProfile ? (
                  <button
                    className="unfollow-btn"
                    onClick={() => handleUnfollow(followedUser.id)}
                    title="Unfollow"
                  >
                    Unfollow
                  </button>
                ) : (
                  <FollowButton 
                    myUserId={user?.id}
                    profileUserId={followedUser.id}
                    isPrivate={followedUser.is_private}
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
