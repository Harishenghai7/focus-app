# 🔄 FEATURE MERGE GUIDE - OLD TO NEW FILES

## 📋 MISSING FEATURES ANALYSIS

### HOME.JS - Features to Merge

#### ✅ Already in New File:
- Basic state management
- Infinite scroll
- Pull to refresh
- Real-time subscriptions
- Loading/Error/Empty states
- Focusly button

#### ❌ MISSING from New File (MUST ADD):

1. **Feed Cache System**
   ```javascript
   import { feedCache } from '../utils/feedCache';
   import { subscriptionManager } from '../utils/subscriptionManager';
   
   const loadFeedWithCache = useCallback(async () => {
     const cachedPosts = await feedCache.getFeed(user.id);
     const cacheAge = await feedCache.getCacheAge(user.id);
     if (cachedPosts.length > 0 && cacheAge < feedConfig.cacheAge) {
       setPosts(cachedPosts);
       setLoading(false);
       fetchInitialFeed(true); // Background refresh
     } else {
       await fetchInitialFeed(false);
     }
   }, [user?.id]);
   ```

2. **Comprehensive Feed Query** (Boltz + Posts + Follows)
   ```javascript
   const fetchFeedQuery = useCallback(async (userId, beforeTimestamp = null, limit = PAGE_SIZE) => {
     // Fetch following list
     const { data: followingData } = await supabase
       .from('follows')
       .select('following_id, profiles!follows_following_id_fkey(is_private)')
       .eq('follower_id', userId)
       .eq('status', 'accepted');

     const followingIds = followingData?.filter(f => !f.profiles?.is_private)
       .map(f => f.following_id) || [];

     const userIdsToShow = [...new Set([...followingIds, userId])];

     // Fetch both posts AND boltz
     const [postsData, boltzData] = await Promise.all([
       supabase.from('posts').select(`...`).in('user_id', userIdsToShow),
       supabase.from('boltz').select(`...`).in('user_id', userIdsToShow)
     ]);

     // Combine and sort by created_at
     const combined = [
       ...postsData.map(post => ({ ...post, content_type: 'post' })),
       ...boltzData.map(boltz => ({ ...boltz, content_type: 'boltz' }))
     ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

     return combined;
   }, []);
   ```

3. **Layout Component Wrapper**
   ```javascript
   return (
     <Layout>
       <div className="home-feed-container">
         {/* Content */}
       </div>
     </Layout>
   );
   ```

4. **SuggestedUsers Component** (Sidebar)
   ```javascript
   <div className="sidebar">
     <SuggestedUsers currentUser={user} />
   </div>
   ```

5. **Scroll to Top Button**
   ```javascript
   {showScrollTop && (
     <button className="scroll-to-top" onClick={scrollToTop}>↑</button>
   )}
   ```

6. **Enhanced Real-time** (Likes, Comments, Saves tracking)
   ```javascript
   feedChannel
     .on('postgres_changes', { event: 'INSERT', table: 'likes' }, (payload) => {
       // Update likes count in real-time
     })
     .on('postgres_changes', { event: 'INSERT', table: 'comments' }, (payload) => {
       // Update comments count in real-time
     })
     .on('postgres_changes', { event: 'INSERT', table: 'saves' }, (payload) => {
       // Update save status in real-time
     })
   ```

7. **View Mode Filter** (Feed, Following, Favorites)
   ```javascript
   const filteredPosts = useMemo(() => {
     switch (viewMode) {
       case 'following':
         return posts.filter(post => post.user_id !== user?.id);
       case 'favorites':
         return posts.filter(post => post.is_liked || post.is_saved);
       default:
         return posts;
     }
   }, [posts, viewMode, user?.id]);
   ```

8. **MusicPlayer Component** (for posts with music)
   ```javascript
   {post.music_url && (
     <MusicPlayer
       musicTitle={post.music_title}
       musicArtist={post.music_artist}
       musicUrl={post.music_url}
       compact={true}
     />
   )}
   ```

9. **Interaction Handlers** (Like, Comment, Share, Save, Follow)
   ```javascript
   const handleLike = useCallback(async (postId, contentType) => {
     // Toggle like logic
   }, []);
   
   const handleComment = useCallback((postId, contentType) => {
     navigate(`/${contentType}/${postId}/comments`);
   }, []);
   
   const handleShare = useCallback((postId, contentType, method) => {
     // Share logic
   }, []);
   
   const handleFollow = useCallback(async (userId) => {
     // Follow/unfollow logic
   }, []);
   ```

10. **Auth Prompt** (for logged out users)
    ```javascript
    if (!user) {
      return (
        <div className="auth-prompt">
          <h2>Welcome to Focus</h2>
          <p>Please log in to see your personalized feed</p>
          <button onClick={() => navigate('/auth')}>Log In</button>
        </div>
      );
    }
    ```

11. **Performance Optimizations**
    - `useMemo` for filtered posts
    - `useCallback` for all handlers
    - Throttled scroll handler
    - Mounted ref checks

---

### EXPLORE.JS - Features to Merge

#### ❌ MISSING from New File:

1. **Advanced Tab System**
   ```javascript
   const TABS = [
     { id: "for-you", label: "For You", icon: "💡" },
     { id: "trending", label: "Trending", icon: "🔥" },
     { id: "boltz", label: "Boltz", icon: "⚡️" },
     { id: "people", label: "People", icon: "🧑‍🤝‍🧑" },
     { id: "tags", label: "Tags", icon: "🏷️" }
   ];
   ```

2. **Sort Options**
   ```javascript
   const SORT_OPTIONS = [
     { id: "recent", label: "Most Recent", icon: "🕐" },
     { id: "popular", label: "Most Popular", icon: "📈" },
     { id: "trending", label: "Trending", icon: "🔥" }
   ];
   ```

3. **Filter and Sort Logic**
   ```javascript
   const filterAndSortItems = useCallback((rawItems) => {
     let filtered = rawItems;
     if (categoryFilter !== "all") {
       filtered = filtered.filter(item => /* filter logic */);
     }
     return filtered.sort((a, b) => {
       switch (sortBy) {
         case "popular": return (b.likecount || 0) - (a.likecount || 0);
         case "trending": return (b.trendingscore || 0) - (a.trendingscore || 0);
         case "recent": return new Date(b.createdat) - new Date(a.createdat);
       }
     });
   }, [categoryFilter, sortBy]);
   ```

4. **Personalized Recommendations**
   ```javascript
   const getPersonalizedRecommendations = async (userId, limit) => {
     // AI-based recommendations
   };
   ```

5. **Search Service Integration**
   ```javascript
   import { searchService, trendingService } from '../utils';
   
   const results = await searchService.search(query, "all", 50);
   ```

---

### BOLTZ.JS - Features to Merge

#### ❌ MISSING from New File:

1. **Feed Mode Toggle** (For You / Following)
   ```javascript
   const [feedMode, setFeedMode] = useState('forYou');
   ```

2. **Video Preloading & Caching**
   ```javascript
   const preloadCache = useRef(new Set());
   
   const preloadNextVideos = useCallback(() => {
     const nextIndexes = [currentIndex + 1, currentIndex + 2];
     nextIndexes.forEach(index => {
       if (videos[index] && !preloadCache.current.has(index)) {
         const video = document.createElement('video');
         video.src = videos[index].video_url;
         video.preload = 'auto';
         preloadCache.current.add(index);
       }
     });
   }, [currentIndex, videos]);
   ```

3. **Video Duration Tracking**
   ```javascript
   const [videoDurations, setVideoDurations] = useState({});
   
   const loadVideoDuration = async (videoUrl, videoId) => {
     const duration = await getVideoDuration(videoUrl);
     setVideoDurations(prev => ({ ...prev, [videoId]: duration }));
   };
   ```

4. **Auto-play System**
   ```javascript
   const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
   
   const setupAutoPlay = useCallback(() => {
     if (autoPlayEnabled && videoRef.current) {
       videoRef.current.play().catch(console.error);
     }
   }, [autoPlayEnabled]);
   ```

5. **View Tracking**
   ```javascript
   const trackVideoView = useCallback(async (videoId) => {
     await supabase
       .from('boltz')
       .update({ views_count: supabase.rpc('increment') })
       .eq('id', videoId);
   }, []);
   ```

6. **Keyboard Navigation**
   ```javascript
   useEffect(() => {
     const handleKeyPress = (e) => {
       if (e.key === 'ArrowUp') handleScroll('up');
       if (e.key === 'ArrowDown') handleScroll('down');
       if (e.key === ' ') togglePlayPause();
       if (e.key === 'm') toggleMute();
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```

7. **Sound/Music Info**
   ```javascript
   const [soundInfo, setSoundInfo] = useState({});
   
   // Fetch music info for each video
   const fetchMusicInfo = async (musicId) => {
     const { data } = await supabase
       .from('music')
       .select('*')
       .eq('id', musicId)
       .single();
     setSoundInfo(prev => ({ ...prev, [musicId]: data }));
   };
   ```

8. **Comments Modal**
   ```javascript
   const [showComments, setShowComments] = useState(false);
   const [selectedVideoForComments, setSelectedVideoForComments] = useState(null);
   
   <CommentSection
     videoId={selectedVideoForComments}
     onClose={() => setShowComments(false)}
   />
   ```

9. **Share Modal**
   ```javascript
   const [showShareModal, setShowShareModal] = useState(false);
   const [selectedVideoForShare, setSelectedVideoForShare] = useState(null);
   
   <ShareModal
     video={selectedVideoForShare}
     onClose={() => setShowShareModal(false)}
   />
   ```

---

## 🚀 ACTION PLAN

### Step 1: Create Merged Home.js
```powershell
# Create a backup
Copy-Item src/pages/Home.new.js src/pages/Home.merged.js

# Manually merge all features from old Home.js
```

Key features to add to Home.new.js:
- [ ] Feed cache system
- [ ] Boltz + Posts combined feed
- [ ] Layout wrapper
- [ ] SuggestedUsers sidebar
- [ ] Scroll to top button
- [ ] Enhanced real-time (likes, comments, saves)
- [ ] View mode filter
- [ ] MusicPlayer integration
- [ ] All interaction handlers
- [ ] Auth prompt
- [ ] Performance optimizations

### Step 2: Create Merged Explore.js
Key features to add to Explore.new.js:
- [ ] Advanced tab system (For You, Trending, Boltz, People, Tags)
- [ ] Sort options (Recent, Popular, Trending)
- [ ] Filter and sort logic
- [ ] Personalized recommendations
- [ ] Search service integration

### Step 3: Create Merged Boltz.js
Key features to add to Boltz.new.js:
- [ ] Feed mode toggle
- [ ] Video preloading & caching
- [ ] Video duration tracking
- [ ] Auto-play system
- [ ] View tracking
- [ ] Keyboard navigation
- [ ] Sound/Music info
- [ ] Comments modal
- [ ] Share modal

---

## 📝 IMPLEMENTATION NOTES

### Priority Order:
1. **HIGH**: Home.js - Most critical page
2. **HIGH**: Explore.js - Core discovery
3. **MEDIUM**: Boltz.js - Enhanced UX
4. **LOW**: Other pages

### Dependencies to Check:
```javascript
// Make sure these exist:
import { feedCache } from '../utils/feedCache';
import { subscriptionManager } from '../utils/subscriptionManager';
import { searchService, trendingService } from '../utils';
import Layout from '../components/Layout/Layout';
import SuggestedUsers from '../components/SuggestedUsers';
import MusicPlayer from '../components/MusicPlayer/MusicPlayer';
```

### Testing Checklist:
- [ ] Feed loads with both posts and boltz
- [ ] Cache works (fast second load)
- [ ] Real-time updates work
- [ ] Infinite scroll works
- [ ] Pull to refresh works
- [ ] All interactions work (like, comment, share, save, follow)
- [ ] View modes work (feed, following, favorites)
- [ ] Music player appears on posts with music
- [ ] Suggested users appear
- [ ] Scroll to top works

---

## 🔧 QUICK FIX SCRIPT

Due to the extensive nature of the changes, I recommend:

1. **Manually merge features** from old files to new files
2. **Test each feature** individually
3. **Use old files as reference** for complex logic
4. **Keep both versions** until merge is complete

**OR**

Use the old files but apply the new:
- Lavender theme styling
- Focusly button design
- Loading skeleton animations
- Empty state designs

---

**Created:** November 21, 2025
**Status:** Requires Manual Merge
**Estimated Time:** 2-3 hours per page
