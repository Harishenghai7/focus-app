import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import FollowButton from "./FollowButton";
import "./Profile.css";

export default function Profile({ user, userProfile }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [boltz, setBoltz] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState(null); // 'pending', 'active', or null
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const navigate = useNavigate();
  const { username } = useParams();

  const isOwnProfile = !username || profile?.id === user?.id || profile?.username === userProfile?.username;

  const fetchProfile = useCallback(async () => {
    try {
      let profileData;

      if (username) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (error) throw error;
        profileData = data;
      } else {
        profileData = userProfile || user;
      }

      setProfile(profileData);
      setFollowersCount(profileData.followers_count || 0);
      setFollowingCount(profileData.following_count || 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [username, user?.id, userProfile, navigate]);

  const fetchUserContent = useCallback(async () => {
    if (!profile) return;

    try {
      if (activeTab === "posts") {
        const { data } = await supabase
          .from("posts")
          .select(`
            *,
            profiles!posts_user_id_fkey(id, username, avatar_url, full_name)
          `)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        setPosts(data || []);
      } else if (activeTab === "boltz") {
        const { data } = await supabase
          .from("boltz")
          .select(`
            *,
            profiles!boltz_user_id_fkey(id, username, avatar_url, full_name)
          `)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        setBoltz(data || []);
      } else if (activeTab === "saved" && isOwnProfile) {
        const { data } = await supabase
          .from("saves")
          .select(`
            post_id,
            posts!saves_post_id_fkey(
              *,
              profiles!posts_user_id_fkey(id, username, avatar_url)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setSavedPosts(data?.map(item => item.posts) || []);
      }
    } catch (error) {
      console.error("Error fetching user content:", error);
    }
  }, [profile, activeTab, isOwnProfile, user.id]);

  const fetchArchivedCount = useCallback(async () => {
    if (!profile || !isOwnProfile) return;

    try {
      const [postsCount, boltzCount] = await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_archived", true),
        supabase
          .from("boltz")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_archived", true)
      ]);

      setArchivedCount((postsCount.count || 0) + (boltzCount.count || 0));
    } catch (error) {
      console.error("Error fetching archived count:", error);
    }
  }, [profile, isOwnProfile]);

  const checkFollowStatus = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("id, status")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single();

      if (data) {
        setFollowStatus(data.status);
        setIsFollowing(data.status === 'active');
      } else {
        setFollowStatus(null);
        setIsFollowing(false);
      }
    } catch (error) {
      // Not following
      setFollowStatus(null);
      setIsFollowing(false);
    }
  }, [user.id, profile?.id]);

  const checkBlockStatus = useCallback(async () => {
    if (!profile?.id || isOwnProfile) return;

    try {
      const { data } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", profile.id)
        .single();

      setIsBlocked(!!data);
    } catch (error) {
      // Not blocked
      setIsBlocked(false);
    }
  }, [user.id, profile?.id, isOwnProfile]);

  const fetchPendingRequestsCount = useCallback(async () => {
    if (!profile?.id || !isOwnProfile || !profile?.is_private) return;

    try {
      const { count, error } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", profile.id)
        .eq("status", "pending");

      if (error) throw error;
      setPendingRequestsCount(count || 0);
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
      setPendingRequestsCount(0);
    }
  }, [profile?.id, profile?.is_private, isOwnProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserContent();
      fetchArchivedCount();
      fetchPendingRequestsCount();
      if (!isOwnProfile) {
        checkFollowStatus();
        checkBlockStatus();
      }
    }
  }, [profile, activeTab, isOwnProfile, fetchUserContent, fetchArchivedCount, fetchPendingRequestsCount, checkFollowStatus, checkBlockStatus]);

  // Realtime subscriptions for follower/following counts
  useEffect(() => {
    if (!profile?.id) return;

    const followersChannel = supabase
      .channel(`profile_followers:${profile.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${profile.id}`
        },
        async () => {
          const { count } = await supabase
            .from('follows')
            .select('id', { count: 'exact' })
            .eq('following_id', profile.id)
            .eq('status', 'active');
          
          setFollowersCount(count || 0);
        }
      )
      .subscribe();

    const followingChannel = supabase
      .channel(`profile_following:${profile.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${profile.id}`
        },
        async () => {
          const { count } = await supabase
            .from('follows')
            .select('id', { count: 'exact' })
            .eq('follower_id', profile.id)
            .eq('status', 'active');
          
          setFollowingCount(count || 0);
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`profile_posts:${profile.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${profile.id}`
        },
        () => {
          if (activeTab === 'posts') {
            fetchUserContent();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(followersChannel);
      supabase.removeChannel(followingChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [profile?.id, activeTab, fetchUserContent]);

  const fetchFollowers = async () => {
    try {
      const { data } = await supabase
        .from("follows")
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq("following_id", profile.id)
        .eq("status", "active");

      setFollowers(data?.map(item => item.profiles) || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const { data } = await supabase
        .from("follows")
        .select(`
          following_id,
          profiles!follows_following_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq("follower_id", profile.id)
        .eq("status", "active");

      setFollowing(data?.map(item => item.profiles) || []);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?user=${profile.username}`);
  };

  const handleBlock = async () => {
    if (isBlocked) {
      // Unblock
      if (!window.confirm(`Unblock @${profile.username}?`)) return;

      try {
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", profile.id);

        if (error) throw error;

        setIsBlocked(false);
        setShowMenu(false);
        alert(`You have unblocked @${profile.username}`);
      } catch (error) {
        console.error("Error unblocking user:", error);
        alert("Failed to unblock user");
      }
    } else {
      // Block
      if (!window.confirm(`Block @${profile.username}? They won't be able to see your posts, stories, or profile. They also won't be able to message you or follow you.`)) return;

      try {
        // First, remove any existing follow relationships
        await supabase
          .from("follows")
          .delete()
          .or(`and(follower_id.eq.${user.id},following_id.eq.${profile.id}),and(follower_id.eq.${profile.id},following_id.eq.${user.id})`);

        // Then create the block
        const { error } = await supabase
          .from("blocked_users")
          .insert([{
            blocker_id: user.id,
            blocked_id: profile.id
          }]);

        if (error) throw error;

        setIsBlocked(true);
        setIsFollowing(false);
        setShowMenu(false);
        alert(`You have blocked @${profile.username}`);
      } catch (error) {
        console.error("Error blocking user:", error);
        alert("Failed to block user");
      }
    }
  };

  const handleReport = () => {
    const reason = window.prompt(`Report @${profile.username}?\n\nPlease describe the issue:`);
    if (reason && reason.trim()) {
      supabase
        .from('reports')
        .insert([{
          reporter_id: user.id,
          reported_user_id: profile.id,
          reason: 'user_report',
          description: reason.trim()
        }])
        .then(() => {
          alert('Thank you for your report. We will review it shortly.');
          setShowMenu(false);
        })
        .catch(() => {
          alert('Failed to submit report');
        });
    }
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="page page-profile">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page page-profile">
        <div className="profile-not-found">
          <h2>Profile not found</h2>
          <p>The user you're looking for doesn't exist.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="page page-profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        {/* Profile Header */}
        <div className="profile-header">
          {/* Cover Photo */}
          <div className="profile-cover">
            {profile.cover_url ? (
              <img src={profile.cover_url} alt="Cover" className="cover-image" />
            ) : (
              <div className="cover-placeholder"></div>
            )}
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-avatar-container">
              <img
                src={profile.avatar_url || "/default-avatar.png"}
                alt={profile.username}
                className="profile-avatar"
              />
            </div>

            <div className="profile-details">
              <div className="profile-name-section">
                <h1 className="profile-username">
                  {profile.username}
                </h1>
                {profile.full_name && (
                  <h2 className="profile-fullname">{profile.full_name}</h2>
                )}
              </div>

              {/* Stats */}
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{formatCount(posts.length)}</span>
                  <span className="stat-label">Posts</span>
                </div>
                <button 
                  className="stat-item stat-button"
                  onClick={() => {
                    setShowFollowers(true);
                    fetchFollowers();
                  }}
                >
                  <span className="stat-number">{formatCount(followersCount)}</span>
                  <span className="stat-label">Followers</span>
                </button>
                <button 
                  className="stat-item stat-button"
                  onClick={() => {
                    setShowFollowing(true);
                    fetchFollowing();
                  }}
                >
                  <span className="stat-number">{formatCount(followingCount)}</span>
                  <span className="stat-label">Following</span>
                </button>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="profile-bio">
                  <p>{profile.bio}</p>
                </div>
              )}

              {/* Website */}
              {profile.website && (
                <div className="profile-website">
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="profile-actions">
                {isOwnProfile ? (
                  <>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate("/edit-profile")}
                    >
                      Edit Profile
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate("/settings")}
                    >
                      Settings
                    </button>
                    {profile?.is_private && pendingRequestsCount > 0 && (
                      <button 
                        className="btn-follow-requests"
                        onClick={() => navigate("/follow-requests")}
                      >
                        Follow Requests
                        <span className="requests-badge">{pendingRequestsCount}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <FollowButton 
                      myUserId={user?.id}
                      profileUserId={profile?.id}
                      isPrivate={profile?.is_private}
                    />
                    <button 
                      className="btn-secondary"
                      onClick={handleMessage}
                    >
                      Message
                    </button>
                    <div className="profile-menu-container">
                      <button 
                        className="btn-menu"
                        onClick={() => setShowMenu(!showMenu)}
                      >
                        ⋯
                      </button>
                      {showMenu && (
                        <div className="profile-menu">
                          <button 
                            className="menu-item"
                            onClick={handleBlock}
                          >
                            {isBlocked ? '🔓 Unblock' : '🚫 Block'}
                          </button>
                          <button 
                            className="menu-item"
                            onClick={handleReport}
                          >
                            ⚠️ Report
                          </button>
                          <button 
                            className="menu-item"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert('Profile link copied!');
                              setShowMenu(false);
                            }}
                          >
                            🔗 Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

                   {isOwnProfile && (
                     <>
                       <button
                         className="archive-link"
                         onClick={() => navigate('/archive')}
                       >
                         🗂️ Archive ({archivedCount})
                       </button>
                       <button
                         className="highlights-link"
                         onClick={() => navigate('/highlights')}
                       >
                         ⭐ Highlights
                       </button>
                     </>
                   )}


        {/* Content Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Posts
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'boltz' ? 'active' : ''}`}
            onClick={() => setActiveTab('boltz')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Boltz
          </button>

          {isOwnProfile && (
            <button 
              className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              Saved
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className="profile-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'posts' && (
                <div className="posts-grid">
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <PostCard key={post.id} post={post} user={user} />
                    ))
                  ) : (
                    <div className="empty-content">
                      <div className="empty-icon">📷</div>
                      <h3>No posts yet</h3>
                      <p>{isOwnProfile ? "Share your first post!" : "No posts to show"}</p>
                      {isOwnProfile && (
                        <button 
                          className="btn-primary"
                          onClick={() => navigate("/create")}
                        >
                          Create Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'boltz' && (
                <div className="boltz-grid">
                  {boltz.length > 0 ? (
                    boltz.map(video => (
                      <div 
                        key={video.id} 
                        className="boltz-item"
                        onClick={() => navigate(`/boltz/${video.id}`)}
                      >
                        <video 
                          src={video.video_url}
                          className="boltz-thumbnail"
                          muted
                        />
                        <div className="boltz-overlay">
                          <svg width="24" height="24" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21"/>
                          </svg>
                        </div>
                        <div className="boltz-stats">
                          <span>❤️ {video.likes_count || 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-content">
                      <div className="empty-icon">🎬</div>
                      <h3>No videos yet</h3>
                      <p>{isOwnProfile ? "Create your first Boltz!" : "No videos to show"}</p>
                      {isOwnProfile && (
                        <button 
                          className="btn-primary"
                          onClick={() => navigate("/create")}
                        >
                          Create Video
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && isOwnProfile && (
                <div className="saved-grid">
                  {savedPosts.length > 0 ? (
                    savedPosts.map(post => (
                      <PostCard key={post.id} post={post} user={user} />
                    ))
                  ) : (
                    <div className="empty-content">
                      <div className="empty-icon">🔖</div>
                      <h3>No saved posts</h3>
                      <p>Posts you save will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowers && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFollowers(false)}
          >
            <motion.div 
              className="followers-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Followers</h3>
                <button onClick={() => setShowFollowers(false)}>✕</button>
              </div>
              <div className="users-list">
                {followers.map(user => (
                  <div key={user.id} className="user-item">
                    <img
                      src={user.avatar_url || "/default-avatar.png"}
                      alt={user.username}
                      className="user-avatar"
                      onClick={() => {
                        setShowFollowers(false);
                        navigate(`/profile/${user.username}`);
                      }}
                    />
                    <div className="user-info">
                      <span className="user-username">{user.username}</span>
                      {user.full_name && (
                        <span className="user-fullname">{user.full_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Following Modal */}
      <AnimatePresence>
        {showFollowing && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFollowing(false)}
          >
            <motion.div 
              className="followers-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Following</h3>
                <button onClick={() => setShowFollowing(false)}>✕</button>
              </div>
              <div className="users-list">
                {following.map(user => (
                  <div key={user.id} className="user-item">
                    <img
                      src={user.avatar_url || "/default-avatar.png"}
                      alt={user.username}
                      className="user-avatar"
                      onClick={() => {
                        setShowFollowing(false);
                        navigate(`/profile/${user.username}`);
                      }}
                    />
                    <div className="user-info">
                      <span className="user-username">{user.username}</span>
                      {user.full_name && (
                        <span className="user-fullname">{user.full_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}