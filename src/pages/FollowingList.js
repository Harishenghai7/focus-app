import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import FollowButton from "./FollowButton";
import "./Profile.css";

export default function FollowingList({ user, userProfile }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfileAndFollowing();
  }, [username]);

  const fetchProfileAndFollowing = async () => {
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
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="following-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1>Following</h1>
      </div>

      <div className="users-list">
        {following.length === 0 ? (
          <div className="empty-state">
            <p>Not following anyone yet.</p>
          </div>
        ) : (
          following.map(followedUser => (
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
              <FollowButton 
                myUserId={user?.id}
                profileUserId={followedUser.id}
                isPrivate={followedUser.is_private}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
