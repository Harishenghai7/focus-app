import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import searchService from '../utils/searchService';
import trendingService from '../utils/trendingService';
import SearchBar from '../components/SearchBar';
import ExploreGrid from '../components/ExploreGrid';
import ExploreTabs from '../components/ExploreTabs';
import TrendingHashtags from '../components/TrendingHashtags';
import './Explore.css';

/**
 * Get personalized recommendations for user
 * Based on their likes, follows, and interaction history
 */
async function getPersonalizedRecommendations(userId, limit = 20) {
  try {
    // Get users the current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .eq('status', 'active');

    const followingIds = following?.map(f => f.following_id) || [];

    // Get hashtags from posts the user has liked
    const { data: likedPosts } = await supabase
      .from('likes')
      .select('posts(caption)')
      .eq('user_id', userId)
      .not('post_id', 'is', null)
      .limit(50);

    // Extract hashtags from liked posts
    const interestedHashtags = new Set();
    likedPosts?.forEach(like => {
      const caption = like.posts?.caption || '';
      const hashtags = caption.match(/#([a-zA-Z0-9_]+)/g) || [];
      hashtags.forEach(tag => interestedHashtags.add(tag.substring(1).toLowerCase()));
    });

    // Fetch posts from followed users
    let recommendedPosts = [];
    if (followingIds.length > 0) {
      const { data: followedPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url, full_name, is_verified)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      recommendedPosts = followedPosts || [];
    }

    // Fetch posts with similar hashtags
    let hashtagPosts = [];
    if (interestedHashtags.size > 0) {
      const hashtagArray = Array.from(interestedHashtags).slice(0, 5);
      const hashtagPattern = hashtagArray.map(tag => `#${tag}`).join('|');
      
      const { data: similarPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url, full_name, is_verified)
        `)
        .not('user_id', 'in', `(${[userId, ...followingIds].join(',')})`)
        .or(hashtagArray.map(tag => `caption.ilike.%#${tag}%`).join(','))
        .order('like_count', { ascending: false })
        .limit(limit / 2);

      hashtagPosts = similarPosts || [];
    }

    // If not enough recommendations, add trending posts
    const totalPosts = recommendedPosts.length + hashtagPosts.length;
    let trendingPosts = [];
    if (totalPosts < limit) {
      const { data: trending } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, avatar_url, full_name, is_verified)
        `)
        .order('like_count', { ascending: false })
        .limit(limit - totalPosts);

      trendingPosts = trending || [];
    }

    // Combine and deduplicate
    const allPosts = [...recommendedPosts, ...hashtagPosts, ...trendingPosts];
    const uniquePosts = Array.from(new Map(allPosts.map(post => [post.id, post])).values());

    // Transform to explore format
    return uniquePosts.map(post => ({
      item_type: 'post',
      item_id: post.id,
      username: post.profiles?.username || 'User',
      avatar_url: post.profiles?.avatar_url,
      thumbnail_path: post.media_url || post.media_urls?.[0] || post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      media_type: 'image',
      like_count: post.like_count,
      comment_count: post.comment_count,
      is_verified: post.profiles?.is_verified
    }));
  } catch (error) {

    return [];
  }
}

export default function Explore({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState('for-you');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const mounted = useRef(true);
  const PAGE_SIZE = 20;

  const [trendingHashtags, setTrendingHashtags] = useState([]);

  const [categoryFilter, setCategoryFilter] = useState('all');

  const tabs = [
    { id: 'for-you', label: 'For You', icon: '✨' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'boltz', label: 'Boltz', icon: '⚡' },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'tags', label: 'Tags', icon: '#️⃣' }
  ];

  const categoryFilters = [
    { id: 'all', label: 'All', icon: '🌐' },
    { id: 'photos', label: 'Photos', icon: '📷' },
    { id: 'videos', label: 'Videos', icon: '🎥' },
    { id: 'boltz', label: 'Boltz', icon: '⚡' }
  ];

  useEffect(() => {
    mounted.current = true;
    fetchExploreContent();
    return () => { mounted.current = false; };
  }, [activeTab, user?.id]);

  const fetchExploreContent = async (reset = true) => {
    if (!user) return;

    if (reset) {
      setLoading(true);
      setCursor(null);
      setHasMore(true);
    } else {
      setFetchingMore(true);
    }

    try {
      let data, error;

      switch (activeTab) {
        case 'for-you':
          // Get personalized recommendations based on user's interests
          const recommendations = await getPersonalizedRecommendations(user.id, PAGE_SIZE);
          data = recommendations;
          break;

        case 'trending':
          // Get most liked posts and boltz
          const { data: trendingPosts } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(id, username, avatar_url)
            `)
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE);

          data = (trendingPosts || []).map(post => ({
            item_type: 'post',
            item_id: post.id,
            username: post.profiles?.username || 'User',
            avatar_url: post.profiles?.avatar_url,
            thumbnail_path: post.image_url,
            caption: post.caption,
            created_at: post.created_at,
            media_type: 'image'
          }));
          break;

        case 'boltz':
          const { data: boltzData2 } = await supabase
            .from('boltz')
            .select(`
              *,
              profiles!boltz_user_id_fkey(id, username, avatar_url)
            `)
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE);

          data = (boltzData2 || []).map(boltz => ({
            item_type: 'boltz',
            item_id: boltz.id,
            username: boltz.profiles?.username || 'User',
            avatar_url: boltz.profiles?.avatar_url,
            thumbnail_path: boltz.thumbnail_url,
            caption: boltz.caption,
            created_at: boltz.created_at,
            media_type: 'video'
          }));
          break;

        case 'people':
          const { data: usersData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, bio')
            .neq('id', user.id)
            .limit(PAGE_SIZE);

          data = (usersData || []).map(user => ({
            item_type: 'user',
            item_id: user.id,
            username: user.username || 'User',
            avatar_url: user.avatar_url,
            thumbnail_path: user.avatar_url,
            caption: user.bio || 'Focus user',
            media_type: 'user'
          }));
          break;

        case 'tags':
          // Fetch trending hashtags
          const trendingTags = await trendingService.getTrendingHashtags(20);
          data = trendingTags.map(hashtag => ({
            item_type: 'hashtag',
            item_id: hashtag.id,
            hashtag: hashtag.tag,
            tag: hashtag.tag,
            post_count: hashtag.post_count,
            thumbnail_path: null,
            caption: `${hashtag.post_count} posts`,
            media_type: 'hashtag',
            trending_score: hashtag.trending_score
          }));
          break;

        default:
          return;
      }

      if (mounted.current) {
        if (reset) setItems(data || []);
        else setItems(prev => [...prev, ...(data || [])]);

        if (data?.length) setCursor(data[data.length - 1].created_at);

        setHasMore((data || []).length === PAGE_SIZE);
      }
    } catch (error) {

    } finally {
      if (mounted.current) {
        setLoading(false);
        setFetchingMore(false);
      }
    }
  };

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Use the enhanced search service
      const results = await searchService.search(query.trim(), 'all', 20);
      
      // Transform results to match ExploreGrid format
      const userResults = (results.users || []).map(user => ({
        item_type: 'user',
        item_id: user.id,
        username: user.username || 'User',
        avatar_url: user.avatar_url,
        thumbnail_path: user.avatar_url,
        caption: user.bio || 'Focus user',
        media_type: 'user',
        is_verified: user.is_verified,
        follower_count: user.follower_count
      }));

      const postResults = (results.posts || []).map(post => ({
        item_type: 'post',
        item_id: post.id,
        username: post.profiles?.username || 'User',
        avatar_url: post.profiles?.avatar_url,
        thumbnail_path: post.thumbnail_url || post.media_url || post.media_urls?.[0],
        caption: post.caption,
        created_at: post.created_at,
        media_type: 'image',
        like_count: post.like_count,
        comment_count: post.comment_count
      }));

      const hashtagResults = (results.hashtags || []).map(hashtag => ({
        item_type: 'hashtag',
        item_id: hashtag.id,
        hashtag: hashtag.tag,
        tag: hashtag.tag,
        post_count: hashtag.post_count,
        thumbnail_path: null,
        caption: `${hashtag.post_count} posts`,
        media_type: 'hashtag'
      }));

      setSearchResults([...userResults, ...postResults, ...hashtagResults]);
      
      // Save search to history
      if (user) {
        searchService.saveSearchHistory(user.id, query.trim());
      }
    } catch (error) {

      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [user]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleItemInteraction = async (item, action) => {
    try {
      // Track user interactions for better recommendations

    } catch (error) {

    }
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000) {
      if (hasMore && !fetchingMore && !searchQuery) {
        fetchExploreContent(false);
      }
    }
  }, [hasMore, fetchingMore, searchQuery]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Apply category filter
  const filterItemsByCategory = (items) => {
    if (categoryFilter === 'all') return items;
    
    return items.filter(item => {
      switch (categoryFilter) {
        case 'photos':
          return item.item_type === 'post' && item.media_type === 'image';
        case 'videos':
          return item.item_type === 'post' && item.media_type === 'video';
        case 'boltz':
          return item.item_type === 'boltz';
        default:
          return true;
      }
    });
  };

  const displayItems = searchQuery 
    ? filterItemsByCategory(searchResults) 
    : filterItemsByCategory(items);

  return (
    <motion.main
      className="page page-explore"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          loading={searchLoading}
          placeholder="Search people, posts, or hashtags..."
          user={user}
          showHistory={true}
        />
        <ExploreTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        {(activeTab === 'for-you' || activeTab === 'trending') && !searchQuery && (
          <div className="category-filters">
            {categoryFilters.map(filter => (
              <motion.button
                key={filter.id}
                className={`category-filter ${categoryFilter === filter.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(filter.id)}
                whileTap={{ scale: 0.95 }}
              >
                <span className="filter-icon">{filter.icon}</span>
                <span className="filter-label">{filter.label}</span>
              </motion.button>
            ))}
          </div>
        )}
        <div className="explore-layout">
          <div className="explore-main">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div className="explore-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="loading-spinner"></div>
                  <p>Discovering amazing content...</p>
                </motion.div>
              ) : displayItems.length === 0 ? (
                <motion.div className="explore-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="empty-icon">
                    {searchQuery ? '🔍' : tabs.find(t => t.id === activeTab)?.icon}
                  </div>
                  <h3>
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : `No ${tabs.find(t => t.id === activeTab)?.label} content yet`
                    }
                  </h3>
                  <p>
                    {searchQuery
                      ? 'Try different keywords or check your spelling'
                      : 'Check back later for fresh content'}
                  </p>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <ExploreGrid
                    items={displayItems}
                    activeTab={activeTab}
                    user={user}
                    onItemInteraction={handleItemInteraction}
                  />
                  {fetchingMore && (
                    <motion.div className="loading-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="loading-spinner small"></div>
                      <p>Loading more...</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {!searchQuery && (
            <aside className="explore-sidebar">
              <TrendingHashtags limit={10} />
            </aside>
          )}
        </div>
      </div>
    </motion.main>
  );
}