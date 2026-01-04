// src/pages/Profile.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { components, hooks, utils } from "../importMap";
import { supabase } from "../supabaseClient";
import "./Profile.css";

// Destructure from importMap
const {
  ProfileHeader,
  ProfileStats,
  ProfileTabs,
  ProfileGrid,
  Highlights,
  EditProfileModal,
  FollowersModal,
  ProfileOptionsMenu,
  SkeletonLoader,
  ErrorBoundary
} = components;

const {
  useProfile,
  useInfiniteScroll,
  useRealtimeInteractions
} = hooks;

const {
  trackPageView,
  trackEvent,
  formatNumber
} = utils;

export default function Profile({ user: currentUser }) {
  const { username } = useParams();
  const navigate = useNavigate();
  
  // --- State ---
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followersType, setFollowersType] = useState("followers"); // 'followers' | 'following'
  const [showOptions, setShowOptions] = useState(false);

  // --- Analytics ---
  useEffect(() => {
    if (username) trackPageView(`Profile: ${username}`);
  }, [username]);

  // --- Data Fetching ---
  const fetchProfileData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    
    try {
      // 1. Get Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError || !profileData) throw profileError;
      setProfile(profileData);

      // 2. Check Follow Status (if logged in & not own profile)
      if (currentUser && currentUser.id !== profileData.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profileData.id)
          .single();
        
        setIsFollowing(!!followData);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      // Redirect to 404 or show error state if needed
    } finally {
      setLoading(false);
    }
  }, [username, currentUser]);

  // Initial Load
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // --- Handlers ---

  const handleFollowToggle = async () => {
    if (!currentUser) return navigate("/auth");
    if (!profile) return;

    // Optimistic Update
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);
    
    // Update Stats locally for immediate feedback
    setProfile(prev => ({
        ...prev,
        followers_count: (prev.followers_count || 0) + (newStatus ? 1 : -1)
    }));

    try {
      if (newStatus) {
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: profile.id
        });
        // Send Notification
        await supabase.from("notifications").insert({
            user_id: profile.id,
            type: "follow",
            actor_id: currentUser.id
        });
        trackEvent("user_follow", { target: profile.username });
      } else {
        await supabase.from("follows").delete().match({
          follower_id: currentUser.id,
          following_id: profile.id
        });
        trackEvent("user_unfollow", { target: profile.username });
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
      // Revert on error
      setIsFollowing(!newStatus);
    }
  };

  const handleStatClick = (type) => {
    if (type === "followers" || type === "following") {
      setFollowersType(type);
      setShowFollowers(true);
    }
  };

  // --- Render Helpers ---

  const isOwnProfile = currentUser?.id === profile?.id;

  if (loading) {
    return (
      <div className="profile-page-loading">
        <SkeletonLoader type="profile" />
      </div>
    );
  }

  if (!profile) {
    return (
        <div className="profile-not-found">
            <h2>User not found</h2>
            <button onClick={() => navigate('/home')}>Go Home</button>
        </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="profile-page">
        <div className="profile-container">
          
          {/* 1. Header Section (Avatar, Info, Actions) */}
          <ProfileHeader 
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollowToggle={handleFollowToggle}
            onEditProfile={() => setShowEditProfile(true)}
            onOptions={() => setShowOptions(true)}
            onMessage={() => navigate(`/messages/new?user=${profile.id}`)}
          />

          {/* 2. Stats Bar */}
          <ProfileStats 
            stats={{
              posts: profile.posts_count || 0,
              followers: profile.followers_count || 0,
              following: profile.following_count || 0
            }}
            onStatClick={handleStatClick}
          />

          {/* 3. Highlights (Stories) */}
          <div className="profile-section-highlights">
             <Highlights userId={profile.id} isOwnProfile={isOwnProfile} />
          </div>

          {/* 4. Content Tabs (Sticky) */}
          <ProfileTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isOwnProfile={isOwnProfile}
          />

          {/* 5. Content Grid (Masonry) */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="profile-content-area"
          >
            <ProfileGrid 
              userId={profile.id} 
              type={activeTab} 
              isOwnProfile={isOwnProfile}
            />
          </motion.div>

        </div>

        {/* --- Modals --- */}
        
        <AnimatePresence>
          {showEditProfile && (
            <EditProfileModal 
              profile={profile} 
              onClose={() => setShowEditProfile(false)} 
              onUpdate={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
            />
          )}
          
          {showFollowers && (
            <FollowersModal 
              userId={profile.id} 
              type={followersType} 
              onClose={() => setShowFollowers(false)} 
            />
          )}

          {showOptions && (
            <ProfileOptionsMenu 
                isOwnProfile={isOwnProfile}
                profile={profile}
                onClose={() => setShowOptions(false)}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    navigate('/auth');
                }}
            />
          )}
        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
}