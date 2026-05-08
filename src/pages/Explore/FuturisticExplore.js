/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🌟 FUTURISTIC EXPLORE — Premium Discovery Ecosystem
 * Focus Platform | Meet the Real People, Not Fake Profiles
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PHILOSOPHY:
 * - Trust-first discovery rewarding authenticity over manipulation
 * - Emotionally intelligent recommendations based on meaningful engagement
 * - Anti-toxic mechanics preventing echo chambers and misinformation
 * - Premium glassmorphism aesthetic with cinematic animations
 * - GPU-accelerated transitions for fluid 60fps experience
 * - Enterprise-grade security with trust shield infrastructure
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { FaArrowUp } from 'react-icons/fa';
import { 
  Compass, Search, Users, Zap, Sparkles, 
  Shield, Heart, MessageCircle, Eye,
  Flame, Star, X, TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/formatNumber';
import { useAuth } from '../../hooks/useAuth';
import { normalizeHydratedProfile } from '../../utils/identityHydration';
import { 
  calculateDiscoveryScore, 
  extractTrendingHashtags,
  calculateCreatorScore,
  rankCreators,
  classifySearchIntent,
  generateSearchSuggestions,
  EXPLORE_CATEGORIES,
  getTrustTierInfo
} from '../../services/discoveryEngine';
import styles from './FuturisticExplore.module.css';
import MainLayout from '../../components/layout/MainLayout';
import PostDetailModal from '../../components/modals/PostDetailModal';
import UserAvatar from '../../components/ui/Avatar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const SEARCH_DEBOUNCE_MS = 400;
const MAX_SEARCH_RESULTS = 30;
const TRENDING_WINDOW_HOURS = 48;
const EMOTIONAL_DECAY_HOURS = 72;

const EMPTY_STATES = {
  posts: {
    icon: '📸',
    title: 'No posts discovered yet',
    subtitle: 'Be the first to share something amazing! ✨'
  },
  boltz: {
    icon: '⚡',
    title: 'No Boltz videos yet',
    subtitle: 'Create short-form content that pops! ⚡'
  },
  users: {
    icon: '👥',
    title: 'No people found',
    subtitle: 'Invite friends to join Focus! 👥'
  },
  trending: {
    icon: '🔥',
    title: 'Trending loading...',
    subtitle: "Discover what's buzzing! 🔥"
  },
  foryou: {
    icon: '✨',
    title: 'Your feed is clear',
    subtitle: 'Follow more creators to see their content here! 🌟'
  },
  creators: {
    icon: '🌟',
    title: 'No creators found',
    subtitle: 'We are looking for more authentic voices! 💫'
  },
  search: {
    icon: '🔍',
    title: "Couldn't find that!",
    subtitle: 'Try a different search term 🔍'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMOTIONAL INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate emotional resonance score for content
 * Prioritizes meaningful engagement over viral manipulation
 */
const calculateEmotionalScore = (item) => {
  if (!item) return 0;
  
  let score = 0;
  const likes = item.likes_count || 0;
  const comments = item.comments_count || 0;
  const shares = item.shares_count || 0;
  const saves = item.saves_count || 0;
  const views = item.views_count || 0;
  
  // Meaningful engagement (comments, shares, saves) weighted higher
  score += comments * 3;      // Deep engagement
  score += shares * 4;        // Viral but intentional
  score += saves * 5;         // Highest signal of value
  score += likes * 1;         // Light engagement
  
  // View-to-engagement ratio (prevents view farming)
  if (views > 0) {
    const engagementRate = (likes + comments + shares + saves) / views;
    if (engagementRate > 0.05) {
      score *= (1 + engagementRate * 2); // Boost high engagement rate
    }
  }
  
  // Recency decay (content fades naturally)
  const hoursSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
  const decayMultiplier = Math.max(0.1, 1 - (hoursSince / EMOTIONAL_DECAY_HOURS));
  score *= decayMultiplier;
  
  return Math.round(score);
};

/**
 * Trust-weighted recommendation score
 * Combines emotional resonance with trust tier amplification
 */
const calculateRecommendationScore = (item, userInterests = []) => {
  const emotionalScore = calculateEmotionalScore(item);
  const discoveryScore = calculateDiscoveryScore(item);
  
  // Blend emotional and discovery scores
  let score = (emotionalScore * 0.6) + (discoveryScore * 0.4);
  
  // Interest alignment boost
  if (userInterests.length > 0) {
    const content = `${item.caption || ''} ${item.content || ''}`.toLowerCase();
    const matchingInterests = userInterests.filter(interest => 
      content.includes(interest.toLowerCase())
    );
    score *= (1 + matchingInterests.length * 0.15);
  }
  
  // Trust tier amplification
  const trustTier = item.user?.trust_tier || item.trust_tier || 0;
  const isVerified = item.user?.is_verified || item.is_verified || false;
  
  if (isVerified || trustTier >= 4) {
    score *= 1.4; // Significant boost for trusted creators
  } else if (trustTier >= 2) {
    score *= 1.15; // Moderate boost for established users
  }
  
  return Math.round(score);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const PremiumSearchBar = ({ onSearch, placeholder, loading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (value.trim()) {
      setSuggestions(generateSearchSuggestions(value));
      timeoutRef.current = setTimeout(() => {
        onSearch(value);
        setShowSuggestions(false);
      }, SEARCH_DEBOUNCE_MS);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBarWrapper}>
        <Search className={styles.searchIcon} size={20} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={styles.searchInput}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(query.length > 0)}
        />
        {query && (
          <button 
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        {loading && <div className={styles.searchSpinner} />}
      </div>
      
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            className={styles.suggestionsDropdown}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={styles.suggestionItem}
                onClick={() => {
                  setQuery(suggestion.label);
                  onSearch(suggestion.label);
                  setShowSuggestions(false);
                }}
              >
                <span className={styles.suggestionIcon}>
                  {suggestion.type === 'hashtag' && '#'}
                  {suggestion.type === 'user' && '@'}
                  {suggestion.type === 'recent' && '🕐'}
                </span>
                <span className={styles.suggestionLabel}>{suggestion.label}</span>
                <span className={styles.suggestionMeta}>{suggestion.meta}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CategoryPills = ({ categories, activeCategory, onSelect }) => {
  return (
    <div className={styles.categoryPills}>
      <AnimatePresence>
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          
          return (
            <motion.button
              key={category.id}
              className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ''}`}
              onClick={() => onSelect(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: isActive ? category.gradient : 'transparent',
                borderColor: isActive ? 'transparent' : 'rgba(var(--primary-rgb), 0.2)'
              }}
            >
              <span className={styles.categoryIcon}>{category.icon}</span>
              <span className={styles.categoryLabel}>{category.label}</span>
              {isActive && (
                <motion.div
                  className={styles.categoryGlow}
                  layoutId="categoryGlow"
                  style={{ background: category.gradient }}
                />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const TrustBadge = ({ trustTier, isVerified, size = 'sm' }) => {
  const tierInfo = getTrustTierInfo(trustTier);
  const sizeClasses = {
    sm: '12px',
    md: '16px',
    lg: '20px'
  };
  
  if (isVerified || trustTier >= 4) {
    return (
      <div 
        className={styles.trustBadge}
        style={{
          fontSize: sizeClasses[size],
          color: tierInfo.color,
          filter: `drop-shadow(0 0 ${size === 'lg' ? '8px' : '4px'} ${tierInfo.color})`
        }}
        title={`Trust Tier ${trustTier} - ${tierInfo.label}`}
      >
        <Shield size={size === 'lg' ? 20 : size === 'md' ? 16 : 12} />
      </div>
    );
  }
  
  if (trustTier >= 2) {
    return (
      <div 
        className={styles.trustBadge}
        style={{
          fontSize: sizeClasses[size],
          color: tierInfo.color
        }}
        title={`Trust Tier ${trustTier} - ${tierInfo.label}`}
      >
        {tierInfo.icon}
      </div>
    );
  }
  
  return null;
};

const ContentCard = ({ item, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const emotionalScore = useMemo(() => calculateEmotionalScore(item), [item]);
  
  return (
    <motion.div
      className={styles.contentCard}
      onClick={() => onClick(item)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
    >
      <div className={styles.cardMedia}>
        {item.type === 'boltz' ? (
          <video
            src={item.video_url}
            poster={item.thumbnail_url}
            className={styles.cardVideo}
            muted
            playsInline
            preload="metadata"
            onMouseEnter={(e) => {
              try { e.target.play(); } catch {}
            }}
            onMouseLeave={(e) => {
              try { e.target.pause(); e.target.currentTime = 0; } catch {}
            }}
          />
        ) : (
          <img
            src={item.media_url}
            alt={item.caption || 'Post'}
            className={styles.cardImage}
            loading="lazy"
          />
        )}
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className={styles.cardOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.cardEngagement}>
                <span className={styles.engagementStat}>
                  <Heart size={14} />
                  {formatNumber(item.likes_count || 0)}
                </span>
                <span className={styles.engagementStat}>
                  <MessageCircle size={14} />
                  {formatNumber(item.comments_count || 0)}
                </span>
                <span className={styles.engagementStat}>
                  <Eye size={14} />
                  {formatNumber(item.views_count || 0)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {item.type === 'boltz' && (
          <div className={styles.boltzBadge}>
            <Zap size={16} />
          </div>
        )}
        
        <div className={styles.scoreIndicator} title={`Emotional Score: ${emotionalScore}`}>
          <Sparkles size={12} />
          <span>{emotionalScore}</span>
        </div>
      </div>
      
      <div className={styles.cardFooter}>
        <div className={styles.cardUserInfo}>
          <UserAvatar
            src={item.user?.avatar_url}
            username={item.user?.username}
            size="sm"
            className={styles.cardAvatar}
          />
          <span className={styles.cardUsername}>
            @{item.user?.username}
          </span>
          <TrustBadge
            trustTier={item.user?.trust_tier}
            isVerified={item.user?.is_verified}
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
};

const TrendingHashtag = ({ tag, index, onClick }) => {
  return (
    <motion.button
      className={styles.trendingHashtag}
      onClick={() => onClick(tag.displayTag)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 8, scale: 1.02 }}
    >
      <div className={styles.hashtagRank}>
        #{index + 1}
      </div>
      <div className={styles.hashtagContent}>
        <span className={styles.hashtagName}>{tag.displayTag}</span>
        <div className={styles.hashtagMeta}>
          <span>{formatNumber(tag.recentCount || 0)} new</span>
          <span>•</span>
          <span>{formatNumber(tag.totalCount || 0)} total</span>
        </div>
      </div>
      <div className={styles.hashtagScore}>
        <Flame size={14} />
        <span>{Math.round(tag.score || 0)}</span>
      </div>
    </motion.button>
  );
};

const CreatorCard = ({ creator, index, onFollow, isFollowing }) => {
  const creatorScore = useMemo(() => calculateCreatorScore(creator), [creator]);
  
  return (
    <motion.div
      className={styles.creatorCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <div className={styles.creatorAvatarWrapper}>
        <UserAvatar
          src={creator.avatar_url}
          username={creator.username}
          size="lg"
          className={styles.creatorAvatar}
        />
        <TrustBadge
          trustTier={creator.trust_tier}
          isVerified={creator.is_verified}
          size="md"
        />
      </div>
      
      <div className={styles.creatorInfo}>
        <div className={styles.creatorName}>
          {creator.full_name || creator.username}
          <TrustBadge
            trustTier={creator.trust_tier}
            isVerified={creator.is_verified}
            size="sm"
          />
        </div>
        <div className={styles.creatorHandle}>@{creator.username}</div>
        {creator.bio && (
          <div className={styles.creatorBio}>{creator.bio}</div>
        )}
        <div className={styles.creatorStats}>
          <span>{formatNumber(creator.followers_count || 0)} followers</span>
          <span className={styles.creatorScore}>
            <Star size={12} />
            {Math.round(creatorScore)}
          </span>
        </div>
      </div>
      
      <button
        className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
        onClick={() => onFollow(creator.id)}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </motion.div>
  );
};

const EmptyState = ({ type, searchQuery }) => {
  let state;
  if (searchQuery) {
    state = EMPTY_STATES.search;
  } else if (EMPTY_STATES[type]) {
    state = EMPTY_STATES[type];
  } else {
    state = {
      icon: '🧭',
      title: 'Nothing here yet',
      subtitle: 'Be the first to explore this category! ✨'
    };
  }
  
  return (
    <motion.div
      className={styles.emptyState}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.emptyIcon}>{state.icon}</div>
      <h3 className={styles.emptyTitle}>{state.title}</h3>
      <p className={styles.emptySubtitle}>{state.subtitle}</p>
    </motion.div>
  );
};

const ExploreSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    {/* Creator skeleton */}
    <div style={{ display: 'flex', gap: 16 }}>
      {[1, 2, 3].map(i => (
        <div key={i} className={styles.skeletonCreator} style={{ flex: 1 }}>
          <div className={styles.skeletonAvatar} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineMed}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          </div>
        </div>
      ))}
    </div>
    {/* Grid skeleton */}
    <div className={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <motion.div
          key={i}
          className={styles.skeletonCard}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPLORE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const FuturisticExplore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const layout = useResponsiveLayout();
  
  // Content states
  const [activeCategory, setActiveCategory] = useState('foryou');
  const [posts, setPosts] = useState([]);
  const [boltz, setBoltz] = useState([]);
  const [creators, setCreators] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [searchResults, setSearchResults] = useState({ posts: [], boltz: [], users: [] });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const loadExploreContent = useCallback(async () => {
    setLoading(true);
    
    try {
      // Fetch posts with RPC or fallback
      const { data: postsData, error: postsError } = await supabase.rpc('get_public_feed', {
        p_limit: 60,
        p_offset: 0
      });
      
      if (postsError) throw postsError;
      
      // Fetch boltz
      const { data: boltzData, error: boltzError } = await supabase.rpc('get_public_boltz_feed', {
        p_limit: 60,
        p_offset: 0
      });
      
      if (boltzError) throw boltzError;
      
      // Fetch creators
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified, trust_tier, followers_count, bio')
        .order('followers_count', { ascending: false, nullsFirst: false })
        .limit(30);
      
      if (creatorsError) throw creatorsError;
      
      // Enrich posts
      const enrichedPosts = (postsData || []).map(post => ({
        ...post,
        type: 'post',
        media_url: post.media_urls?.[0] || post.media_url,
        user: normalizeHydratedProfile({
          id: post.user_id,
          username: post.username,
          full_name: post.full_name,
          avatar_url: post.avatar_url,
          is_verified: post.is_verified,
          trust_tier: post.trust_tier
        }, post.user_id)
      }));
      
      // Enrich boltz
      const enrichedBoltz = (boltzData || []).map(item => ({
        ...item,
        type: 'boltz',
        media_url: item.thumbnail_url || item.video_url,
        user: normalizeHydratedProfile({
          id: item.user_id,
          username: item.username,
          full_name: item.full_name,
          avatar_url: item.avatar_url,
          is_verified: item.is_verified
        }, item.user_id)
      }));
      
      // Rank creators
      const rankedCreators = rankCreators(creatorsData || []);
      
      // Extract trending hashtags
      const trending = extractTrendingHashtags([...enrichedPosts, ...enrichedBoltz], TRENDING_WINDOW_HOURS);
      
      setPosts(enrichedPosts);
      setBoltz(enrichedBoltz);
      setCreators(rankedCreators);
      setTrendingHashtags(trending.slice(0, 15));
      
    } catch (error) {
      console.error('[Explore] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const loadFollowingStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      if (data) {
        setFollowingUsers(new Set(data.map(f => f.following_id)));
      }
    } catch (error) {
      console.error('[Explore] Following status error:', error);
    }
  }, [user?.id]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const handleSearch = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setSearchResults({ posts: [], boltz: [], users: [] });
      setSearchQuery('');
      return;
    }
    
    setSearchQuery(trimmedQuery);
    setSearchLoading(true);
    
    const q = trimmedQuery.toLowerCase();
    const intent = classifySearchIntent(trimmedQuery);
    
    try {
      let searchedPosts = [];
      let searchedBoltz = [];
      let searchedUsers = [];
      
      // Search based on intent
      if (intent.type === 'hashtag' || intent.type === 'content') {
        // Search posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*, profiles:user_id(*)')
          .or(`caption.ilike.%${q}%,content.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(MAX_SEARCH_RESULTS);
        
        searchedPosts = (postsData || []).map(post => ({
          ...post,
          type: 'post',
          user: normalizeHydratedProfile(post.profiles, post.user_id)
        }));
        
        // Search boltz
        const { data: boltzData } = await supabase
          .from('boltz')
          .select('*, profiles:user_id(*)')
          .ilike('description', `%${q}%`)
          .order('created_at', { ascending: false })
          .limit(MAX_SEARCH_RESULTS);
        
        searchedBoltz = (boltzData || []).map(item => ({
          ...item,
          type: 'boltz',
          user: normalizeHydratedProfile(item.profiles, item.user_id)
        }));
      }
      
      if (intent.type === 'user' || intent.type === 'mixed') {
        // Search users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
          .order('followers_count', { ascending: false })
          .limit(MAX_SEARCH_RESULTS);
        
        searchedUsers = usersData || [];
      }
      
      setSearchResults({
        posts: searchedPosts,
        boltz: searchedBoltz,
        users: searchedUsers
      });
      
    } catch (error) {
      console.error('[Explore] Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const handleFollow = async (userId) => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }
    
    const isFollowing = followingUsers.has(userId);
    
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await supabase.from('follows').insert([{ follower_id: user.id, following_id: userId }]);
        setFollowingUsers(prev => new Set(prev).add(userId));
      }
    } catch (error) {
      console.error('[Explore] Follow error:', error);
    }
  };
  
  const handlePostClick = (item) => {
    if (item.type === 'boltz') {
      navigate(`/boltz/${item.id}`);
    } else {
      setSelectedPost(item);
    }
  };
  
  const handleHashtagClick = (hashtag) => {
    handleSearch(hashtag);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    loadExploreContent();
  }, [loadExploreContent]);
  
  useEffect(() => {
    loadFollowingStatus();
  }, [loadFollowingStatus]);
  
  // Scroll tracking — show/hide scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const displayContent = useMemo(() => {
    if (searchQuery) {
      const combined = [...searchResults.posts, ...searchResults.boltz];
      return combined.sort((a, b) => calculateRecommendationScore(b) - calculateRecommendationScore(a));
    }
    
    switch (activeCategory) {
      case 'foryou':
        return [...posts, ...boltz].sort((a, b) => calculateRecommendationScore(b) - calculateRecommendationScore(a));
      case 'users':
        return []; // Users tab shows creators grid only, no content cards
      case 'posts':
        return posts;
      case 'boltz':
        return boltz;
      case 'trending':
        return [...posts, ...boltz].sort((a, b) => calculateDiscoveryScore(b) - calculateDiscoveryScore(a));
      default:
        return [...posts, ...boltz].sort((a, b) => calculateRecommendationScore(b) - calculateRecommendationScore(a));
    }
  }, [searchQuery, searchResults, activeCategory, posts, boltz]);
  
  const displayCreators = useMemo(() => {
    if (searchQuery) return searchResults.users;
    if (activeCategory === 'users') return creators; // Show all creators on Users tab
    if (activeCategory === 'foryou') return creators.slice(0, 6); // Show suggestion row on For You
    return []; // Hide on Posts, Boltz, Trending tabs
  }, [searchQuery, searchResults.users, activeCategory, creators]);
  
  return (
    <MainLayout>
      <div className={styles.sovereignContainer}>
        <div className={styles.glassBackdrop} />
        <div 
          className={styles.exploreStack}
          style={{ 
            maxWidth: layout.isWide ? 1200 : layout.isDesktop ? 900 : 680,
            padding: layout.isMobile ? '0 12px' : '0 24px',
          }}
        >
          {/* Hero Header */}
        <motion.header 
          className={styles.heroHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className={styles.heroContent}>
            <div className={styles.heroTitle}>
              <Compass className={styles.heroIcon} size={32} />
              <h1 className={styles.heroText}>Explore</h1>
              <Sparkles className={styles.sparkle} size={20} />
            </div>
            <p className={styles.heroSubtitle}>
              Discover authentic connections in a trusted ecosystem
            </p>
          </div>
          
          <PremiumSearchBar
            onSearch={handleSearch}
            placeholder="Search posts, people, or #hashtags..."
            loading={searchLoading}
          />
          
          <CategoryPills
            categories={EXPLORE_CATEGORIES}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          
        </motion.header>
        
        {/* Main Content */}
        <motion.div 
          className={styles.mainContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <ExploreSkeleton />
          ) : (
            <>
              {/* Section Title for Users Tab */}
              {activeCategory === 'users' && displayCreators.length === 0 && !searchQuery && (
                <EmptyState type="users" searchQuery={searchQuery} />
              )}

              {/* Creators Section */}
              {displayCreators.length > 0 && (
                <motion.section 
                  className={styles.creatorsSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <h2 className={styles.sectionTitle}>
                    <Users size={20} />
                    {searchQuery ? 'People' : activeCategory === 'users' ? 'Discover People' : 'Suggested For You'}
                  </h2>
                  <div className={styles.creatorsGrid}>
                    {displayCreators
                      .filter(creator => creator.id !== user?.id)
                      .map((creator, index) => (
                        <CreatorCard
                          key={creator.id}
                          creator={creator}
                          index={index}
                          onFollow={handleFollow}
                          isFollowing={followingUsers.has(creator.id)}
                        />
                      ))}
                  </div>
                </motion.section>
              )}
              
              {/* Trending Hashtags — show on Trending tab and For You */}
              {!searchQuery && trendingHashtags.length > 0 && (activeCategory === 'trending' || activeCategory === 'foryou') && (
                <motion.section 
                  className={styles.trendingSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <h2 className={styles.sectionTitle}>
                    <Flame size={20} />
                    {activeCategory === 'trending' ? 'Trending Now' : 'Trending Hashtags'}
                  </h2>
                  <div className={styles.trendingGrid}>
                    {trendingHashtags.map((tag, index) => (
                      <TrendingHashtag
                        key={tag.tag}
                        tag={tag}
                        index={index}
                        onClick={handleHashtagClick}
                      />
                    ))}
                  </div>
                </motion.section>
              )}
              
              {/* Content Grid — show on all tabs except Users */}
              {activeCategory !== 'users' && (
                displayContent.length > 0 ? (
                  <motion.section 
                    className={styles.contentSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <h2 className={styles.sectionTitle}>
                      <Sparkles size={20} />
                      {searchQuery ? 'Search Results' 
                        : activeCategory === 'trending' ? 'Trending Content'
                        : activeCategory === 'posts' ? 'Latest Posts'
                        : activeCategory === 'boltz' ? 'Latest Boltz'
                        : 'Discover'}
                    </h2>
                    <div className={styles.contentGrid}>
                      {displayContent.map((item, index) => (
                        <ContentCard
                          key={`${item.type}-${item.id}`}
                          item={item}
                          index={index}
                          onClick={handlePostClick}
                        />
                      ))}
                    </div>
                  </motion.section>
                ) : (
                  <EmptyState type={activeCategory} searchQuery={searchQuery} />
                )
              )}
            </>
          )}
        </motion.div>
        </div>
        
        {/* Ambient Orbs */}
        <div className={styles.ambientOrb} />
        <div className={styles.ambientOrbBottom} />
        
        {/* Scroll to Top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={styles.scrollTopBtn}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Scroll to top"
            >
              <FaArrowUp />
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Post Detail Modal */}
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onUpdate={(id, updates) => {
              setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default FuturisticExplore;
