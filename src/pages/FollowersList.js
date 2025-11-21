import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout/Layout";
import SearchBar from "../components/SearchBar";
import FollowButton from "../components/FollowButton";
import useDebounce from "../hooks/useDebounce";
import { formatNumber } from "../utils/formatters/formatNumber";
import "./Profile.css";

export default function FollowersList({ user, userProfile }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isOwnProfile = user?.id === profileData?.id;

  const fetchProfileAndFollowers = useCallback(async () => {
    try {
      // Get profile by username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username || userProfile?.username)
        .single();

      if (profileError) throw profileError;
      setProfileData(profile);

      // Get followers
      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower_id,
          follower:follower_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("following_id", profile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFollowers(data.map(f => f.follower));
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setLoading(false);
    }
  }, [username, userProfile?.username]);

  useEffect(() => {
    fetchProfileAndFollowers();
  }, [fetchProfileAndFollowers]);

  // Filter followers based on search query
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredFollowers(followers);
      return;
    }

    const query = debouncedSearch.toLowerCase();
    const filtered = followers.filter(follower => {
      const fullName = (follower.full_name || "").toLowerCase();
      const username = (follower.username || "").toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
    setFilteredFollowers(filtered);
  }, [debouncedSearch, followers]);

  // Handle remove follower
  const handleRemoveFollower = async (followerId) => {
    if (!isOwnProfile || !window.confirm("Remove this follower?")) return;

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", profileData.id);

      if (error) throw error;

      // Update local state
      setFollowers(prev => prev.filter(f => f.id !== followerId));
      setFilteredFollowers(prev => prev.filter(f => f.id !== followerId));

      // Show success message (optional)
      console.log("Follower removed successfully");
    } catch (error) {
      console.error("Error removing follower:", error);
      alert("Failed to remove follower. Please try again.");
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
      <div className="followers-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>Followers</h1>
          <span className="followers-count">
            {formatNumber(followers.length)}
          </span>
        </div>

        {/* Search Bar */}
        {followers.length > 0 && (
          <div className="search-container">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => {}}
              placeholder="Search followers..."
              user={user}
              showHistory={false}
            />
          </div>
        )}

        <div className="users-list">
          {followers.length === 0 ? (
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
              <p>No followers yet</p>
              <p className="empty-state-subtitle">
                {isOwnProfile 
                  ? "When people follow you, they'll appear here" 
                  : "This user has no followers yet"}
              </p>
            </div>
          ) : filteredFollowers.length === 0 ? (
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
              <p>No followers found</p>
              <p className="empty-state-subtitle">
                Try a different search term
              </p>
            </div>
          ) : (
            filteredFollowers.map(follower => (
              <div 
                key={follower.id} 
                className="user-card"
              >
                <div 
                  className="user-card-info"
                  onClick={() => navigate(`/profile/${follower.username}`)}
                >
                  <img 
                    src={follower.avatar_url || `https://ui-avatars.com/api/?name=${follower.username}`} 
                    alt={follower.full_name || follower.username} 
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <h3>{follower.full_name || follower.username}</h3>
                    <p>@{follower.username}</p>
                  </div>
                </div>
                <div className="user-card-actions">
                  {isOwnProfile ? (
                    <button
                      className="remove-follower-btn"
                      onClick={() => handleRemoveFollower(follower.id)}
                      title="Remove follower"
                    >
                      Remove
                    </button>
                  ) : (
                    <FollowButton 
                      myUserId={user?.id}
                      profileUserId={follower.id}
                      isPrivate={follower.is_private}
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
