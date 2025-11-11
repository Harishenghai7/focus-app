import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import FollowButton from "./FollowButton";
import "./Profile.css";

export default function FollowersList({ user, userProfile }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfileAndFollowers();
  }, [username]);

  const fetchProfileAndFollowers = async () => {
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
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="followers-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1>Followers</h1>
      </div>

      <div className="users-list">
        {followers.length === 0 ? (
          <div className="empty-state">
            <p>No followers yet.</p>
          </div>
        ) : (
          followers.map(follower => (
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
              <FollowButton 
                myUserId={user?.id}
                profileUserId={follower.id}
                isPrivate={follower.is_private}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
