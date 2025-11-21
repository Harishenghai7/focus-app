# 📘 HOME PAGE QUICK START & API REFERENCE

**Date:** November 21, 2025  
**Version:** 1.0.0 - Production Ready  
**Maintained by:** Focus Development Team

---

## 🚀 QUICK START (Copy-Paste Reference)

### Importing & Using Home Component
```javascript
import Home from '../pages/Home';

// In your router:
<Route path="/" element={<Home />} />

// Home component handles:
// ✅ Stories carousel
// ✅ Posts feed with infinite scroll
// ✅ Real-time updates
// ✅ Like/save functionality
// ✅ Comment buttons
```

---

## 📊 STATE MANAGEMENT

### Main State Variables
```javascript
const [posts, setPosts] = useState([]);              // Post array
const [stories, setStories] = useState([]);          // Stories array
const [loading, setLoading] = useState(true);        // Initial load
const [loadingMore, setLoadingMore] = useState(false); // Infinite scroll
const [hasMore, setHasMore] = useState(true);        // More posts?
const [page, setPage] = useState(0);                 // Current page
const [newPostsAvailable, setNewPostsAvailable] = false; // New banner
const [selectedPost, setSelectedPost] = useState(null); // For comments
const [showComments, setShowComments] = useState(false); // Modal state
const [error, setError] = useState(null);            // Error messages
```

### Post Object Structure
```javascript
{
  id: "uuid-string",
  user_id: "uuid-string",
  caption: "User's caption text",
  media_urls: ["url1.jpg", "url2.jpg"],
  media_type: "image" | "video",
  location: "San Francisco, CA",
  created_at: "2025-11-21T10:30:00Z",
  users: {
    id: "uuid",
    username: "john_doe",
    display_name: "John Doe",
    avatar_url: "https://...",
    verified: true
  },
  // Added by component:
  likesCount: 42,
  commentsCount: 8,
  isLiked: false,
  isSaved: true,
  currentMediaIndex: 0
}
```

### Story Object Structure
```javascript
{
  id: "uuid-string",
  user_id: "uuid-string",
  media_url: "https://...",
  created_at: "2025-11-21T14:20:00Z",
  users: {
    id: "uuid",
    username: "jane_smith",
    display_name: "Jane Smith",
    avatar_url: "https://...",
    verified: false
  }
}
```

---

## 🔧 KEY FUNCTIONS

### fetchStories()
```javascript
// Fetches stories from past 24 hours
// Called on component mount
// Filters: gte('created_at', last 24h)
// Returns: story objects with user data
// Error handling: Logs to console

Usage:
await fetchStories();
setStories(data);
```

### fetchPosts(pageNum = 0)
```javascript
// Fetches posts with pagination
// Gets likes count, comments count, user state
// Appends to array on page > 0

Parameters:
- pageNum: 0 for new load, increments for pagination

Returns:
- Post array with enriched data

Usage:
await fetchPosts(0);        // Initial load
await fetchPosts(page + 1); // Infinite scroll
```

### handleLike(postId, isLiked)
```javascript
// Toggles like on a post
// Optimistic: Updates UI immediately
// Async: Persists to database
// Error: Reverts on failure

Parameters:
- postId: ID of post to like
- isLiked: Current like state

Behavior:
1. Optimistic update to posts state
2. Call supabase.post_likes.insert/delete
3. Revert if error occurs

Usage:
await handleLike(post.id, post.isLiked);
```

### handleSave(postId, isSaved)
```javascript
// Toggles save/bookmark on a post
// Same pattern as handleLike
// Updates isSaved state

Usage:
await handleSave(post.id, post.isSaved);
```

### navigateMedia(postId, direction)
```javascript
// Navigates media carousel
// Updates currentMediaIndex in post state

Parameters:
- postId: ID of post
- direction: "next" | "prev"

Constraints:
- Min index: 0
- Max index: media_urls.length - 1

Usage:
navigateMedia(post.id, 'next');
navigateMedia(post.id, 'prev');
```

### formatTimeAgo(dateString)
```javascript
// Converts ISO date to human-readable format
// Examples: "2m ago", "1h ago", "3d ago"

Returns:
- "just now" (< 1 min)
- "45m ago" (minutes)
- "2h ago" (hours)
- "5d ago" (days)
- "2w ago" (weeks)

Usage:
const time = formatTimeAgo(post.created_at);
// Output: "2h ago"
```

### loadNewPosts()
```javascript
// Called when user clicks "New posts available" banner
// Fetches posts from page 0
// Hides banner

Usage:
onClick={() => loadNewPosts()}
```

---

## 🔌 DATABASE QUERIES

### Stories Query
```sql
-- Fetches all stories from past 24 hours
SELECT *
FROM flash_stories
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- With nested user data:
SELECT id, user_id, media_url, created_at,
       users!flash_stories_user_id_fkey (
         id, username, display_name, avatar_url, verified
       )
FROM flash_stories
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Posts Query
```sql
-- Fetches posts with pagination
SELECT id, user_id, caption, media_urls, media_type,
       location, created_at,
       users!posts_user_id_fkey (
         id, username, display_name, avatar_url, verified
       )
FROM posts
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

### Likes Count Query
```sql
SELECT COUNT(*)
FROM post_likes
WHERE post_id = 'post_uuid';
```

### User Like Status Query
```sql
SELECT id
FROM post_likes
WHERE post_id = 'post_uuid'
AND user_id = 'user_uuid'
LIMIT 1;
```

### Comments Count Query
```sql
SELECT COUNT(*)
FROM comments
WHERE post_id = 'post_uuid';
```

### Saved Posts Query
```sql
SELECT id
FROM saved_posts
WHERE post_id = 'post_uuid'
AND user_id = 'user_uuid'
LIMIT 1;
```

---

## 🔄 REAL-TIME UPDATES

### Subscription Setup
```javascript
// Listen for new posts
const channel = supabase
  .channel('posts-changes')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'posts' 
  }, (payload) => {
    setNewPostsAvailable(true);
  })
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

### What Triggers Updates
```javascript
// New post is created by ANY user
INSERT INTO posts (user_id, caption, ...) VALUES (...);

// → Event fires
// → setNewPostsAvailable(true)
// → Banner shows
```

---

## 🛑 ERROR HANDLING

### Failed Posts Fetch
```javascript
if (error) {
  setError('Failed to load posts');
  // Shows error card with retry button
}

// Retry:
onClick={() => fetchPosts(0)}
```

### Failed Like/Save
```javascript
// Try to like post
try {
  await supabase.from('post_likes')
    .insert({ post_id, user_id });
} catch (err) {
  // Revert UI
  setPosts(prev =>
    prev.map(post =>
      post.id === postId
        ? { ...post, isLiked: false }
        : post
    )
  );
}
```

### Network Errors
```javascript
// All async operations wrapped in try-catch
// User-friendly error messages shown
// Retry button provided
// No app crash on network issues
```

---

## 📱 CSS CLASSES REFERENCE

### Main Containers
```css
.home-page              /* Root page container */
.home-container         /* Feed wrapper (max 670px) */
.posts-feed            /* Posts grid container */
```

### Stories
```css
.flash-stories-container      /* Stories bar wrapper */
.flash-stories-scroll         /* Scrollable container */
.flash-story                  /* Individual story */
.flash-story-ring             /* Ring border */
.flash-story-ring.unviewed    /* Pink ring (unseen) */
.flash-story-ring.viewed      /* Dim purple (seen) */
.flash-story-avatar           /* Story image */
.flash-story-name             /* Username below */
.flash-add-story              /* Your story button */
.flash-add-icon               /* Plus icon on your story */
```

### Post Cards
```css
.post-card                      /* Post wrapper */
.post-header                    /* Username section */
.post-user-info                 /* Avatar + name clickable area */
.post-user-avatar               /* Avatar image */
.post-user-details              /* Name + location column */
.post-username-row              /* Username + verified badge */
.post-username                  /* Username text */
.verified-badge                 /* ✓ badge */
.post-location                  /* Location text */
.post-options-btn              /* More menu button */

.post-media-container          /* Media wrapper */
.post-media                    /* Image/video element */
.media-nav-btn                 /* Previous/next buttons */
.media-nav-prev                /* Left arrow button */
.media-nav-next                /* Right arrow button */
.media-indicators              /* Dot indicators */
.media-indicator               /* Individual dot */
.media-indicator.active        /* Active/pink dot */

.post-actions                  /* Like, comment, save buttons */
.post-actions-left             /* Like, comment, share */
.post-action-btn               /* Button style */
.post-action-btn:hover         /* On hover */
.post-action-btn.liked         /* Heart filled red */
.post-action-btn.saved         /* Bookmark filled cyan */

.post-stats                    /* Like count text */
.post-caption                  /* Caption text */
.post-caption-username         /* Username in caption */
.post-view-comments           /* View comments link */
.post-timestamp               /* Time ago text */
```

### Banners & States
```css
.new-posts-banner          /* New posts button */
.loading-skeleton         /* Skeleton container */
.post-skeleton            /* Individual skeleton */
.skeleton-header          /* Skeleton header */
.skeleton-avatar          /* Skeleton avatar */
.skeleton-text            /* Skeleton text line */
.skeleton-media           /* Skeleton media */
.skeleton-actions         /* Skeleton actions */

.home-empty               /* Empty feed state */
.home-error               /* Error state */
.primary-btn              /* Primary button */
.retry-btn                /* Retry button */
.end-of-feed             /* End message */
.loading-more            /* Loading indicator */
.spinner                 /* Spinner animation */
```

---

## 🎨 COLOR CONSTANTS

```javascript
// Create a colors.js file if needed
export const colors = {
  bg: {
    primary: '#1B1139',      // Dark purple
    secondary: '#2A1F4A',    // Medium purple
    tertiary: '#321B7C',     // Brighter purple
    glass: 'rgba(29, 18, 56, 0.83)'
  },
  gradient: {
    primary: '#8B7FD7',      // Lavender
    secondary: '#7A6FCC'     // Darker lavender
  },
  accent: {
    pink: '#EE7BFA',         // Bright pink
    pinkDark: '#FF5378',     // Darker pink
    cyan: '#38C2E5',         // Cyan
    gold: '#FFD600'          // Gold
  },
  text: {
    primary: '#FFFFFF',      // White
    secondary: '#B9B3ED',    // Light lavender
    tertiary: '#8885A0',     // Gray
    border: '#5E50A9'        // Border purple
  }
};
```

---

## 🔌 INTEGRATION POINTS

### With CommentModal
```javascript
// Pass selectedPost and handlers
<CommentModal
  post={selectedPost}
  isOpen={!!selectedPost}
  onClose={() => setSelectedPost(null)}
/>
```

### With PostDetailModal
```javascript
// Navigate to post detail
navigate(`/post/${post.id}`);
```

### With UserProfile
```javascript
// Click avatar or username
navigate(`/profile/${post.users.username}`);
```

### With FlashViewer
```javascript
// Click story to view
navigate(`/flash/${story.user_id}`);
```

### With CreatePage
```javascript
// Click "Your Story"
navigate('/create');
```

---

## 📊 PERFORMANCE TIPS

### For Large Feeds
```javascript
// Already implemented:
✅ Pagination (10 posts per page)
✅ Infinite scroll (no full reload)
✅ Optimistic updates (instant feedback)
✅ Skeleton loaders (perceived speed)

// Optional optimization:
- Lazy load images
- Compress media
- Use image CDN
- Enable caching
```

### For Better UX
```javascript
✅ Already implemented:
- Smooth transitions (all 0.12-0.36s)
- Loading spinners
- Error recovery
- Real-time updates
- Responsive design

// Optional:
- Image preview before loading
- Video thumbnail
- Estimated data from cache
```

---

## 🔐 SECURITY BEST PRACTICES

### Already Implemented
```javascript
✅ RLS policies on database
✅ User validation on backend
✅ Error messages don't expose sensitive info
✅ No sensitive data in state
✅ Proper cleanup on unmount
```

### Additional Recommendations
```javascript
// Validate on client too
if (!user || !user.id) {
  return <Navigate to="/login" />;
}

// Sanitize user input before sending
const cleanCaption = sanitizeHTML(caption);

// Never log sensitive data
console.log('User action:', action); // ✅ Good
console.log('User token:', token);   // ❌ Bad
```

---

## 🐛 DEBUGGING TIPS

### Check State
```javascript
// Add to component for debugging
useEffect(() => {
  console.log('Posts:', posts);
  console.log('Loading:', loading);
  console.log('Error:', error);
}, [posts, loading, error]);
```

### Check Queries
```javascript
// Monitor database queries in Supabase console
// Look for missing indexes
// Check RLS policies
// Verify foreign keys
```

### Check Rendering
```javascript
// Use React DevTools
// Profile performance
// Look for unnecessary re-renders
// Check for memory leaks
```

### Check Network
```javascript
// Open DevTools Network tab
// Check response times
// Look for failed requests
// Monitor bandwidth
```

---

## ✅ COMMON ISSUES & SOLUTIONS

### "No posts showing"
```javascript
// Check:
1. Stories table has data with user_id
2. Posts table has data
3. User is logged in
4. RLS policies allow reading
5. Foreign keys are correct
```

### "Like button not working"
```javascript
// Check:
1. user.id is set
2. post_likes table exists
3. RLS policy allows inserts
4. No console errors
```

### "Infinite scroll not loading more"
```javascript
// Check:
1. ObserverTarget ref is set
2. hasMore state updates
3. fetchPosts increments page
4. POSTS_PER_PAGE constant is correct
```

### "Real-time updates not showing"
```javascript
// Check:
1. Supabase real-time enabled
2. postgres_changes subscription active
3. Channel subscribes correctly
4. Cleanup happens on unmount
```

---

## 📚 RELATED FILES

```
src/pages/
├── Home.js                    ← Main component
├── Home.css                   ← All styling
└── HomeOld.js.backup         ← Previous version

src/context/
└── AuthContext.js            ← User authentication

src/supabaseClient.js          ← Database client

src/components/
├── CommentModal.js           ← Comments (linked)
└── ...other components

Database:
├── posts table
├── post_likes table
├── saved_posts table
├── comments table
├── flash_stories table
└── users table
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying:

```javascript
// ✅ Code
- [ ] No console.errors or .logs left
- [ ] All imports resolved
- [ ] No commented code
- [ ] Proper error handling

// ✅ Database
- [ ] All tables created
- [ ] RLS policies set
- [ ] Indexes created
- [ ] Foreign keys valid

// ✅ Testing
- [ ] Stories load
- [ ] Posts load
- [ ] Like/save work
- [ ] Infinite scroll works
- [ ] Real-time updates show
- [ ] Responsive on mobile
- [ ] No console errors

// ✅ Performance
- [ ] Load time < 2s
- [ ] Smooth scrolling
- [ ] Optimistic updates instant
- [ ] No memory leaks

// ✅ Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels
- [ ] Color contrast AA
- [ ] Touch targets 44px+
```

---

## 📞 SUPPORT & REFERENCE

For issues or questions:
1. Check this guide first
2. Review inline code comments
3. Check Home.js implementation
4. Review database schema
5. Contact development team

---

**Last Updated:** November 21, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

