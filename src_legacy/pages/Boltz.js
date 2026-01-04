// src/pages/Boltz.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { components, hooks, utils } from "../importMap";
import { supabase } from "../supabaseClient";
import "./Boltz.css";

// Destructure from Import Map for clean access
const { 
  ReelPlayer, InteractionBar, CommentSection, ShareModal, 
  FollowButton, ErrorBoundary, MusicPlayer 
} = components;

const { useInfiniteScroll, useRealtimeInteractions } = hooks;

const { 
  trackPageView, trackEvent, setupAutoPlay, trackVideoView, 
  formatNumber, formatTimeAgo 
} = utils;

export default function Boltz({ user }) {
  const navigate = useNavigate();
  
  // --- State ---
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedMode, setFeedMode] = useState('forYou'); // 'forYou' | 'following'
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [likedVideos, setLikedVideos] = useState(new Set());
  
  // Refs
  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  // --- Analytics & Setup ---
  useEffect(() => {
    trackPageView('Boltz Feed');
  }, []);

  // --- Data Fetching ---
  const fetchVideos = useCallback(async () => {
    try {
      if (videos.length === 0) setLoading(true);
      
      // Query Builder
      let query = supabase
        .from("boltz")
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url, verified)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      // Filter for 'Following' mode
      if (feedMode === 'following' && user) {
        // In prod, use an RPC or separate query for followed users' content
        // For now, we'll filter client-side or assume RPC exists
        // query = query.in('user_id', followedUserIds); 
      }

      const { data, error } = await query;
      if (error) throw error;

      setVideos(prev => {
        // Deduplicate based on ID
        const existingIds = new Set(prev.map(v => v.id));
        const newVideos = data.filter(v => !existingIds.has(v.id));
        return [...prev, ...newVideos];
      });
    } catch (err) {
      console.error("Error fetching boltz:", err);
    } finally {
      setLoading(false);
    }
  }, [feedMode, user, videos.length]);

  // Initial Load
  useEffect(() => {
    setVideos([]); // Reset on mode change
    fetchVideos();
  }, [feedMode, fetchVideos]);

  // --- Hooks ---
  // Infinite Scroll
  useInfiniteScroll(containerRef, fetchVideos);
  
  // Realtime Updates (Likes/Comments counts)
  const { interactions } = useRealtimeInteractions(videos, 'boltz');

  // --- Interaction Handlers ---

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    // Calculate current index based on scroll position
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const videoHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / videoHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
      trackEvent('boltz_scroll', 'view', videos[newIndex].id);
    }
  }, [currentIndex, videos]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const handleLike = async (videoId) => {
    if (!user) return navigate('/auth');

    // Optimistic Update
    const isLiked = likedVideos.has(videoId);
    setLikedVideos(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(videoId) : next.add(videoId);
      return next;
    });

    // DB Call
    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ user_id: user.id, content_id: videoId });
      } else {
        await supabase.from('likes').insert({ user_id: user.id, content_id: videoId, type: 'boltz' });
      }
    } catch (err) {
      console.error('Like failed', err);
      // Revert on fail would go here
    }
  };

  // --- Render Helpers ---

  // Get current video data merged with realtime interactions
  const activeVideo = useMemo(() => {
    const vid = videos[currentIndex];
    if (!vid) return null;
    return {
      ...vid,
      likes_count: interactions[vid.id]?.likes || vid.likes_count,
      comments_count: interactions[vid.id]?.comments || vid.comments_count
    };
  }, [videos, currentIndex, interactions]);

  if (loading && videos.length === 0) {
    return <div className="boltz-loader"><div className="spinner"></div></div>;
  }

  return (
    <ErrorBoundary>
      <div className="boltz-page">
        
        {/* 🟢 Top Navigation (Glass Overlay) */}
        <header className="boltz-header">
          <div className="boltz-tabs glass-pill">
            <button 
              className={`tab-btn ${feedMode === 'following' ? 'active' : ''}`}
              onClick={() => setFeedMode('following')}
            >
              Following
            </button>
            <button 
              className={`tab-btn ${feedMode === 'forYou' ? 'active' : ''}`}
              onClick={() => setFeedMode('forYou')}
            >
              For You
            </button>
          </div>
        </header>

        {/* 🎥 Main Snap Container */}
        <main 
          className="boltz-feed-container" 
          ref={containerRef}
          onScroll={handleScroll}
        >
          {videos.map((video, index) => {
            const isActive = index === currentIndex;
            
            return (
              <article key={video.id} className="boltz-item">
                {/* Video Player Component */}
                <ReelPlayer
                  ref={el => videoRefs.current[index] = el}
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  isPlaying={isActive}
                  isMuted={isMuted}
                  className="boltz-video-element"
                  onDoubleTap={() => handleLike(video.id)}
                />

                {/* Overlay Gradient */}
                <div className="boltz-overlay-gradient" />

                {/* Right Side Actions */}
                <div className="boltz-actions-right">
                  <div className="profile-follow-stack">
                    <img 
                      src={video.profiles?.avatar_url || '/default-avatar.png'} 
                      className="action-avatar" 
                      alt={video.profiles?.username}
                      onClick={() => navigate(`/profile/${video.profiles?.username}`)}
                    />
                    {user && user.id !== video.user_id && (
                      <div className="mini-follow-btn">
                        <FollowButton userId={video.user_id} compact />
                      </div>
                    )}
                  </div>

                  <InteractionBar
                    vertical
                    contentId={video.id}
                    counts={{
                      likes: interactions[video.id]?.likes || video.likes_count,
                      comments: interactions[video.id]?.comments || video.comments_count,
                      shares: video.shares_count
                    }}
                    isLiked={likedVideos.has(video.id)}
                    onLike={() => handleLike(video.id)}
                    onComment={() => {
                      setSelectedVideo(video);
                      setShowComments(true);
                    }}
                    onShare={() => {
                      setSelectedVideo(video);
                      setShowShare(true);
                    }}
                  />
                </div>

                {/* Bottom Info Area */}
                <div className="boltz-info-bottom">
                  <div className="info-user-row">
                    <h3 onClick={() => navigate(`/profile/${video.profiles?.username}`)}>
                      @{video.profiles?.username}
                      {video.profiles?.verified && <span className="verified-tick">✓</span>}
                    </h3>
                    <span className="info-time">{formatTimeAgo(video.created_at)}</span>
                  </div>
                  
                  <p className="info-caption">
                    {video.caption} 
                    {video.hashtags?.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                  </p>

                  {/* Music Ticker */}
                  <div className="info-music-row">
                     <div className="music-icon-anim">🎵</div>
                     <div className="music-ticker">
                        <span>{video.music_name || "Original Sound - " + video.profiles?.username}</span>
                     </div>
                  </div>
                </div>

                {/* Mute Toggle (Floating) */}
                <button className="mute-toggle-float" onClick={toggleMute}>
                  {isMuted ? "🔇" : "🔊"}
                </button>

              </article>
            );
          })}
        </main>

        {/* 💬 Modals */}
        <AnimatePresence>
          {showComments && selectedVideo && (
            <div className="modal-portal">
              <CommentSection 
                postId={selectedVideo.id} 
                onClose={() => setShowComments(false)} 
                isOverlay
              />
            </div>
          )}
          {showShare && selectedVideo && (
            <ShareModal 
              content={selectedVideo} 
              type="boltz"
              onClose={() => setShowShare(false)} 
            />
          )}
        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
}