import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { components, hooks, utils } from '../importMap';
import { supabase } from '../supabaseClient';
import "./Profile.css";

const {
  AvatarEditor,
  CoverPhotoEditor,
  FollowButton,
  PostCard,
  ExploreGrid,
  StoryRing,
  VerifiedBadge,
  UserOptionsMenu,
  SkeletonLoader,
  ErrorBoundary
} = components;

const {
  useRealtimeInteractions,
  useInfiniteScroll,
  usePresence
} = hooks;

const {
  formatNumber,
  formatDate,
  sanitizeInput,
  trackEvent,
  trackPageView,
  measureLoadTime,
  logPerformance
} = utils;

const PROFILE_TABS = [
  { id: 'posts', label: 'Posts', icon: '📷' },
  { id: 'boltz', label: 'Boltz', icon: '⚡' },
  { id: 'tagged', label: 'Tagged', icon: '🏷️' },
  { id: 'saved', label: 'Saved', icon: '🔖', private: true }
];

export default function Profile({ user: currentUser, userProfile: currentUserProfile }) {
  const navigate = useNavigate();
  const { username } = useParams();
  
  // Track page view for analytics
  useEffect(() => {
    trackPageView?.('Profile', { username });
  }, [username]);

  // Measure load time for performance
  useEffect(() => {
    const loadTime = measureLoadTime?.();
    if (loadTime) logPerformance?.('profile_load_time', loadTime);
  }, []);

  // State management
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [content, setContent] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [stories, setStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [showCoverEditor, setShowCoverEditor] = useState(false);

  // Refs
  const mounted = useRef(true);
  const realtimeChannelRef = useRef(null);
  const observerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Redirect to current user's profile if no username provided
  useEffect(() => {
    if (!username) {
      if (currentUserProfile?.username) {
        navigate(`/profile/${currentUserProfile.username}`, { replace: true });
      } else if (currentUser) {
        // If we have currentUser but not currentUserProfile, wait a moment
        // This handles the case where the profile data is still loading
        const timer = setTimeout(() => {
          if (currentUserProfile?.username) {
            navigate(`/profile/${currentUserProfile.username}`, { replace: true });
          } else {
            // Still no profile, show error
            setError('Unable to load your profile');
            setLoading(false);
          }
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Not logged in, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [username, currentUser, currentUserProfile?.username, navigate]);

  // Determine if this is the current user's profile
  useEffect(() => {
    if (currentUser && profile) {
      setIsOwnProfile(currentUser.id === profile.id);
    }
  }, [currentUser, profile]);

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('User not found');
        } else {
          throw profileError;
        }
        return;
      }

      setProfile(profileData);
      setIsPrivateAccount(profileData.is_private);

      // Load stats and relationship status
      await Promise.all([
        loadUserStats(profileData.id),
        loadRelationshipStatus(profileData.id),
        loadPresenceStatus(profileData.id)
      ]);

    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Load user statistics
  const loadUserStats = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const [
        { count: followers },
        { count: following },
        { count: posts }
      ] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId)
          .eq('status', 'accepted'),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)
          .eq('status', 'accepted'),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_archived', false)
      ]);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
      setPostsCount(posts || 0);

    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, []);

  // Load relationship status with current user
  const loadRelationshipStatus = useCallback(async (userId) => {
    if (!currentUser?.id || !userId || currentUser.id === userId) return;

    try {
      const { data: followData } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (followData) {
        setIsFollowing(followData.status === 'accepted');
        setFollowRequestSent(followData.status === 'pending');
      }

    } catch (error) {
      console.error('Error loading relationship status:', error);
    }
  }, [currentUser?.id]);

  // Load presence status
  const loadPresenceStatus = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('is_online, last_seen')
        .eq('user_id', userId)
        .maybeSingle();

      setIsOnline(presenceData?.is_online || false);

    } catch (error) {
      console.error('Error loading presence status:', error);
    }
  }, []);

  // Load stories
  const loadStories = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data: storiesData } = await supabase
        .from('flashes')
        .select('*')
        .eq('user_id', profile.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      setStories(storiesData || []);

    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }, [profile?.id]);

  // Load highlights
  const loadHighlights = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data: highlightsData } = await supabase
        .from('highlights')
        .select(`
          *,
          highlight_stories(
            flash_id,
            flashes(id, media_url, media_type, thumbnail_url)
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setHighlights(highlightsData || []);

    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  }, [profile?.id]);

  // Load content for active tab
  const loadContent = useCallback(async (reset = false) => {
    if (!profile?.id) return;

    if (reset) {
      setContentLoading(true);
      setContent([]);
      setCursor(null);
    }

    try {
      let query;
      const limit = 12;

      switch (activeTab) {
        case 'posts':
          query = supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(username, avatar_url)
            `)
            .eq('user_id', profile.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
          break;

        case 'boltz':
          query = supabase
            .from('boltz')
            .select(`
              *,
              profiles!boltz_user_id_fkey(username, avatar_url)
            `)
            .eq('user_id', profile.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
          break;

        case 'tagged':
          query = supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(username, avatar_url)
            `)
            .contains('tagged_users', [profile.id])
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
          break;

        case 'saved':
          if (!isOwnProfile) return;
          query = supabase
            .from('saves')
            .select(`
              post_id,
              posts(
                *,
                profiles!posts_user_id_fkey(username, avatar_url)
              )
            `)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          break;

        default:
          return;
      }

      if (cursor && !reset) {
        query = query.lt('created_at', cursor);
      }

      query = query.limit(limit);

      const { data: contentData, error } = await query;

      if (error) throw error;

      let processedContent = contentData || [];

      // Process saved posts
      if (activeTab === 'saved') {
        processedContent = processedContent.map(item => item.posts).filter(Boolean);
      }

      // Add content type identifier
      processedContent = processedContent.map(item => ({
        ...item,
        content_type: activeTab === 'boltz' ? 'boltz' : 'post'
      }));

      if (reset) {
        setContent(processedContent);
      } else {
        setContent(prev => [...prev, ...processedContent]);
      }

      setHasMore(processedContent.length === limit);
      
      if (processedContent.length > 0) {
        setCursor(processedContent[processedContent.length - 1].created_at);
      }

    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load content');
    } finally {
      setContentLoading(false);
    }
  }, [profile?.id, activeTab, cursor, isOwnProfile]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!profile?.id || realtimeChannelRef.current) return;

    realtimeChannelRef.current = supabase
      .channel(`profile_${profile.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile.id}`
      }, (payload) => {
        if (mounted.current) {
          setProfile(prev => ({ ...prev, ...payload.new }));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${profile.id}`
      }, () => {
        if (mounted.current) {
          loadUserStats(profile.id);
        }
      })
      .subscribe();
  }, [profile?.id, loadUserStats]);

  // Handle follow/unfollow
  const handleFollowToggle = useCallback(async () => {
    if (!currentUser?.id || !profile?.id || isOwnProfile) return;

    const wasFollowing = isFollowing;
    const hadRequestSent = followRequestSent;

    // Optimistic update
    if (isPrivateAccount && !wasFollowing) {
      setFollowRequestSent(true);
    } else {
      setIsFollowing(!wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
    }

    try {
      if (wasFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
      } else if (hadRequestSent) {
        // Cancel follow request
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        setFollowRequestSent(false);
      } else {
        // Follow or send request
        const status = isPrivateAccount ? 'pending' : 'accepted';
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id,
            status
          });
      }

      trackEvent('user_followed', {
        targetUserId: profile.id,
        followed: !wasFollowing,
        wasPrivate: isPrivateAccount
      });

    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      setFollowRequestSent(hadRequestSent);
      setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
    }
  }, [currentUser?.id, profile?.id, isOwnProfile, isFollowing, followRequestSent, isPrivateAccount]);

  // Handle tab change
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    trackEvent('profile_tab_changed', { tab: tabId, profileId: profile?.id });
  }, [profile?.id]);

  // Handle content click
  const handleContentClick = useCallback((item) => {
    if (item.content_type === 'boltz') {
      navigate(`/boltz/${item.id}`);
    } else {
      navigate(`/post/${item.id}`);
    }
    
    trackEvent('profile_content_clicked', {
      contentType: item.content_type,
      contentId: item.id,
      profileId: profile?.id
    });
  }, [navigate, profile?.id]);

  // Handle avatar update
  const handleAvatarUpdate = useCallback(async (newAvatarUrl) => {
    if (!isOwnProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', currentUser.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      setShowAvatarEditor(false);

      trackEvent('avatar_updated', { userId: currentUser.id });

    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  }, [isOwnProfile, currentUser?.id]);

  // Handle cover photo update
  const handleCoverUpdate = useCallback(async (newCoverUrl) => {
    if (!isOwnProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cover_photo_url: newCoverUrl })
        .eq('id', currentUser.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, cover_photo_url: newCoverUrl }));
      setShowCoverEditor(false);

      trackEvent('cover_updated', { userId: currentUser.id });

    } catch (error) {
      console.error('Error updating cover photo:', error);
    }
  }, [isOwnProfile, currentUser?.id]);

  // Get button text for follow button
  const getFollowButtonText = () => {
    if (followRequestSent) return 'Requested';
    if (isFollowing) return 'Following';
    return 'Follow';
  };

  // Check if content is accessible
  const isContentAccessible = isOwnProfile || (!isPrivateAccount || isFollowing);

  // Filter tabs based on permissions
  const availableTabs = useMemo(() => {
    return PROFILE_TABS.filter(tab => {
      if (tab.private && !isOwnProfile) return false;
      return true;
    });
  }, [isOwnProfile]);

  // Load profile when username changes
  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username, loadProfile]);

  // Setup real-time updates when profile loads
  useEffect(() => {
    if (profile?.id) {
      setupRealtimeSubscription();
      loadStories();
      loadHighlights();
    }
  }, [profile?.id, setupRealtimeSubscription, loadStories, loadHighlights]);

  // Load content when active tab changes
  useEffect(() => {
    if (profile && (isOwnProfile || (!isPrivateAccount || isFollowing))) {
      loadContent(true);
    }
  }, [activeTab, profile, isOwnProfile, isPrivateAccount, isFollowing, loadContent]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <SkeletonLoader type="profile" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h3>{error}</h3>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="profile-container">
        {/* Cover Photo */}
        <div className="profile-cover">
          {profile.cover_photo_url ? (
            <img
              src={profile.cover_photo_url}
              alt="Cover"
              className="cover-image"
            />
          ) : (
            <div className="cover-placeholder" />
          )}
          
          {isOwnProfile && (
            <button
              className="edit-cover-btn"
              onClick={() => setShowCoverEditor(true)}
            >
              📷
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="avatar-container">
              <img
                src={profile.avatar_url || '/default-avatar.png'}
                alt={profile.username}
                className="profile-avatar"
                onClick={isOwnProfile ? () => setShowAvatarEditor(true) : undefined}
              />
              {isOnline && <div className="online-indicator" />}
              {isOwnProfile && (
                <button
                  className="edit-avatar-btn"
                  onClick={() => setShowAvatarEditor(true)}
                >
                  ✏️
                </button>
              )}
            </div>

            {/* Stories */}
            {stories.length > 0 && (
              <div className="profile-stories">
                {stories.map(story => (
                  <StoryRing
                    key={story.id}
                    story={story}
                    onClick={() => navigate(`/story/${story.id}`)}
                    size="small"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-title">
              <h1 className="profile-name">
                {profile.full_name || profile.username}
                {profile.verified && <VerifiedBadge />}
              </h1>
              <p className="profile-username">@{profile.username}</p>
            </div>

            {/* Profile Actions */}
            <div className="profile-actions">
              {isOwnProfile ? (
                <>
                  <button
                    className="edit-profile-btn"
                    onClick={() => navigate('/profile/edit')}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="profile-options-btn"
                    onClick={() => setShowOptionsMenu(true)}
                  >
                    ⚙️
                  </button>
                </>
              ) : (
                <>
                  <FollowButton
                    userId={profile.id}
                    isFollowing={isFollowing}
                    onToggle={handleFollowToggle}
                    text={getFollowButtonText()}
                    disabled={followRequestSent}
                  />
                  <button
                    className="message-btn"
                    onClick={() => navigate(`/messages/new?user=${profile.username}`)}
                  >
                    Message
                  </button>
                  <button
                    className="profile-options-btn"
                    onClick={() => setShowOptionsMenu(true)}
                  >
                    ⋯
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="profile-stats">
          <div className="stat-item" onClick={() => navigate(`/profile/${profile.username}/posts`)}>
            <span className="stat-count">{formatNumber(postsCount)}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div 
            className="stat-item" 
            onClick={() => navigate(`/profile/${profile.username}/followers`)}
          >
            <span className="stat-count">{formatNumber(followersCount)}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div 
            className="stat-item"
            onClick={() => navigate(`/profile/${profile.username}/following`)}
          >
            <span className="stat-count">{formatNumber(followingCount)}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="profile-bio">
            <p>{profile.bio}</p>
          </div>
        )}

        {/* Website/Links */}
        {profile.website && (
          <div className="profile-links">
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="profile-link"
            >
              🔗 {profile.website}
            </a>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="profile-highlights">
            <h3>Highlights</h3>
            <div className="highlights-grid">
              {highlights.map(highlight => (
                <div
                  key={highlight.id}
                  className="highlight-item"
                  onClick={() => navigate(`/highlights/${highlight.id}`)}
                >
                  <div className="highlight-cover">
                    <img
                      src={highlight.cover_image || highlight.highlight_stories?.[0]?.flashes?.thumbnail_url}
                      alt={highlight.title}
                    />
                  </div>
                  <span className="highlight-title">{highlight.title}</span>
                </div>
              ))}
              {isOwnProfile && (
                <div
                  className="highlight-item add-highlight"
                  onClick={() => navigate('/highlights/create')}
                >
                  <div className="highlight-cover">
                    <span>+</span>
                  </div>
                  <span className="highlight-title">New</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="profile-tabs">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="profile-content">
          {!isContentAccessible ? (
            <div className="private-account">
              <div className="private-icon">🔒</div>
              <h3>This Account is Private</h3>
              <p>Follow @{profile.username} to see their content</p>
            </div>
          ) : contentLoading ? (
            <div className="content-loading">
              <div className="content-grid">
                {[...Array(9)].map((_, i) => (
                  <SkeletonLoader key={i} type="content-item" />
                ))}
              </div>
            </div>
          ) : content.length === 0 ? (
            <div className="empty-content">
              <div className="empty-icon">
                {activeTab === 'posts' ? '📷' : activeTab === 'boltz' ? '⚡' : '🏷️'}
              </div>
              <h3>No {activeTab} yet</h3>
              <p>
                {isOwnProfile 
                  ? `Start sharing your ${activeTab}!`
                  : `@${profile.username} hasn't shared any ${activeTab} yet.`
                }
              </p>
              {isOwnProfile && activeTab === 'posts' && (
                <button
                  onClick={() => navigate('/create')}
                  className="create-first-btn"
                >
                  Create Your First Post
                </button>
              )}
            </div>
          ) : (
            <div className="content-grid">
              <AnimatePresence>
                {content.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${activeTab}`}
                    className="content-item"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleContentClick(item)}
                  >
                    {item.content_type === 'boltz' ? (
                      <div className="boltz-thumbnail">
                        <video
                          src={item.video_url}
                          poster={item.thumbnail_url}
                          muted
                          preload="metadata"
                        />
                        <div className="boltz-overlay">
                          <span className="play-icon">▶️</span>
                          <div className="boltz-stats">
                            <span>👁️ {formatNumber(item.views_count || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="post-thumbnail">
                        <img
                          src={item.media_urls?.[0] || item.thumbnail_urls?.[0]}
                          alt={`Post ${item.id}`}
                          loading="lazy"
                        />
                        {item.is_carousel && (
                          <div className="carousel-indicator">📷</div>
                        )}
                        <div className="post-overlay">
                          <div className="post-stats">
                            <span>❤️ {formatNumber(item.likes_count || 0)}</span>
                            <span>💬 {formatNumber(item.comments_count || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Load more trigger */}
              {hasMore && (
                <div 
                  className="load-more-trigger"
                  ref={(el) => {
                    if (el && observerRef.current) {
                      observerRef.current.observe(el);
                    }
                  }}
                >
                  <SkeletonLoader type="content-item" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showAvatarEditor && (
          <AvatarEditor
            isOpen={showAvatarEditor}
            onClose={() => setShowAvatarEditor(false)}
            onSave={handleAvatarUpdate}
            currentAvatar={profile.avatar_url}
          />
        )}

        {showCoverEditor && (
          <CoverPhotoEditor
            isOpen={showCoverEditor}
            onClose={() => setShowCoverEditor(false)}
            onSave={handleCoverUpdate}
            currentCover={profile.cover_photo_url}
          />
        )}

        {showOptionsMenu && (
          <UserOptionsMenu
            isOpen={showOptionsMenu}
            onClose={() => setShowOptionsMenu(false)}
            user={profile}
            isOwnProfile={isOwnProfile}
            currentUser={currentUser}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
