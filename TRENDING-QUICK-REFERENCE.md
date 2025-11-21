# Trending.js Quick Reference Guide

## 🚀 Quick Start

### Access the Page
```
Navigate to: /trending
```

### Import the Component
```javascript
import Trending from './pages/Trending';
// Already configured in App.js with lazy loading
```

## 📦 Component Props

```javascript
<Trending 
  user={user}           // Current authenticated user object
  userProfile={profile} // User profile data
/>
```

## 🎯 Key Features

### 1. Category Filters
```javascript
const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'posts', label: 'Posts', icon: '📝' },
  { id: 'photos', label: 'Photos', icon: '📷' },
  { id: 'videos', label: 'Videos', icon: '🎥' },
  { id: 'boltz', label: 'Boltz', icon: '⚡' },
  { id: 'hashtags', label: 'Hashtags', icon: '#️⃣' },
  { id: 'people', label: 'People', icon: '👥' }
];
```

### 2. Timeframe Options
```javascript
const TIMEFRAME_FILTERS = [
  { id: 'day', label: 'Today', icon: '📅' },
  { id: 'week', label: 'This Week', icon: '📊' },
  { id: 'month', label: 'This Month', icon: '📈' }
];
```

### 3. Data Fetching
```javascript
// Trending Hashtags
const hashtags = await trendingService.getTrendingHashtags(20);

// Trending Posts
const posts = await trendingService.getTrendingPosts(30, timeframe);

// Trending Users
const { data: users } = await supabase
  .from('profiles')
  .select('id, username, fullname, avatarurl, bio, isverified, followercount')
  .order('followercount', { ascending: false })
  .limit(20);

// Trending Boltz
const { data: boltz } = await supabase
  .from('boltz')
  .select('id, content, mediaurl, likecount, profiles!boltzuseridfkey(...)')
  .order('likecount', { ascending: false })
  .limit(20);
```

## 🔧 TrendingCard Usage

```javascript
import { components } from '../importMap';
const { TrendingCard } = components;

// Hashtag Card
<TrendingCard 
  type="hashtag"
  item={hashtagObject}
  rank={1}
  onClick={handleClick}
  compact={false}
/>

// User Card
<TrendingCard 
  type="user"
  item={userObject}
  rank={2}
  compact={false}
/>

// Post Card
<TrendingCard 
  type="post"
  item={postObject}
  rank={3}
/>

// Boltz Card
<TrendingCard 
  type="boltz"
  item={boltzObject}
  rank={4}
/>
```

## 📊 Data Structures

### Hashtag Object
```javascript
{
  id: string,
  tag: string,
  postcount: number,
  trendingscore: number,
  lastusedat: timestamp
}
```

### Post Object
```javascript
{
  id: string,
  caption: string,
  mediaurl: string,
  mediaurls: string[],
  mediatype: 'image' | 'video',
  likecount: number,
  commentcount: number,
  createdat: timestamp,
  profiles: {
    id: string,
    username: string,
    fullname: string,
    avatarurl: string,
    isverified: boolean
  }
}
```

### User Object
```javascript
{
  id: string,
  username: string,
  fullname: string,
  avatarurl: string,
  bio: string,
  isverified: boolean,
  followercount: number
}
```

### Boltz Object
```javascript
{
  id: string,
  content: string,
  mediaurl: string,
  likecount: number,
  createdat: timestamp,
  profiles: {
    id: string,
    username: string,
    avatarurl: string,
    isverified: boolean
  }
}
```

## 🎨 CSS Classes

### Main Layout
```css
.page-trending              /* Main container */
.trending-header            /* Header section */
.trending-title             /* Page title */
.trending-subtitle          /* Subtitle text */
.refresh-button             /* Refresh button */
.timeframe-filters          /* Timeframe filter row */
.category-filters           /* Category filter row */
.trending-content           /* Content area */
```

### Content Sections
```css
.trending-all-layout        /* Mixed content layout */
.trending-section           /* Individual section */
.section-title              /* Section header */
.hashtags-list              /* Hashtag grid */
.posts-grid                 /* Post grid */
.users-grid                 /* User grid */
.boltz-grid                 /* Boltz grid */
```

### Cards
```css
.trending-hashtag-card      /* Hashtag card */
.trending-user-card         /* User card */
.trending-boltz-card        /* Boltz card */
.trending-card-post         /* Post card */
```

### States
```css
.active                     /* Active filter state */
.refreshing                 /* Refreshing state */
.compact                    /* Compact card mode */
```

## 📱 Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 1024px) { /* 3-4 columns */ }

/* Tablet */
@media (max-width: 1024px) { /* 2-3 columns */ }

/* Mobile */
@media (max-width: 768px)  { /* 1-2 columns */ }

/* Small Mobile */
@media (max-width: 480px)  { /* 1 column */ }
```

## 🔍 State Management

```javascript
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState(null);
const [categoryFilter, setCategoryFilter] = useState('all');
const [timeframe, setTimeframe] = useState('week');
const [trendingHashtags, setTrendingHashtags] = useState([]);
const [trendingPosts, setTrendingPosts] = useState([]);
const [trendingUsers, setTrendingUsers] = useState([]);
const [trendingBoltz, setTrendingBoltz] = useState([]);
```

## 📈 Analytics Events

```javascript
// Track page view
trackPageView('Trending');

// Track category change
trackEvent('trending_category_change', { category: 'photos' });

// Track timeframe change
trackEvent('trending_timeframe_change', { timeframe: 'day' });

// Track refresh
trackEvent('trending_refresh', { timeframe, category });

// Track hashtag click
trackEvent('trending_hashtag_click', { hashtag: 'trending' });

// Track user click
trackEvent('trending_user_click', { userId: '123' });

// Track data loaded
trackEvent('trending_data_loaded', { 
  timeframe, 
  category, 
  postsCount, 
  hashtagsCount 
});
```

## 🚨 Error Handling

```javascript
try {
  // Fetch data
} catch (err) {
  console.error('Error fetching trending data:', err);
  setError('Failed to load trending content. Please try again.');
}
```

## ♿ Accessibility

```javascript
// Button with aria-label
<button aria-label="Refresh trending content">

// Filter with aria-pressed
<button aria-pressed={isActive}>

// Card with role and tabIndex
<div role="button" tabIndex={0}>
```

## 🎯 Navigation

```javascript
// Navigate to hashtag page
navigate(`/hashtag/${hashtag.tag}`);

// Navigate to user profile
navigate(`/profile/${userId}`);

// Navigate to post detail
navigate(`/post/${postId}`);

// Navigate to boltz detail
navigate(`/boltz/${boltzId}`);
```

## 🔄 Refresh Logic

```javascript
const handleRefresh = useCallback(() => {
  fetchTrendingData(true); // true = is refresh
}, [fetchTrendingData]);
```

## 🎨 Theme Support

### Light Mode
```css
--bg-primary: #fff;
--bg-secondary: #f9f9f9;
--text-primary: #000;
--text-secondary: #666;
--border-color: #e5e5e5;
```

### Dark Mode
```css
--bg-primary: #121212;
--bg-secondary: #1e1e1e;
--text-primary: #e0e0e0;
--text-secondary: #b0b0b0;
--border-color: #333;
```

## 🔗 Related Files

```
src/
├── pages/
│   ├── Trending.js       ← Main page
│   └── Trending.css      ← Page styles
├── components/
│   ├── TrendingCard.js   ← Card component
│   ├── TrendingCard.css  ← Card styles
│   ├── PostCard.js       ← Used for posts
│   └── TrendingSection.js ← Available utility
├── utils/
│   └── trendingService.js ← Data service
└── App.js                 ← Routes configured
```

## 💡 Tips

1. **Performance**: Data is cached in trendingService for 1 hour
2. **Refresh**: Manual refresh clears cache and refetches
3. **Timeframe**: Changing timeframe automatically refetches posts
4. **Category**: Filter is applied client-side for instant response
5. **Layout**: "All" category shows mixed layout, others show single type
6. **Cards**: Use TrendingCard for consistency across the app
7. **Analytics**: All user interactions are tracked
8. **Error Handling**: Graceful fallbacks for missing data

## 🚀 Usage Example

```javascript
// In App.js (already configured)
<Route 
  path="/trending" 
  element={
    <ProtectedRoute user={user}>
      <Trending user={user} userProfile={userProfile} />
    </ProtectedRoute>
  } 
/>

// In navigation
<Link to="/trending">Trending</Link>

// Or programmatically
navigate('/trending');
```

## ✅ Checklist for Developers

- [ ] Ensure trendingService is properly configured
- [ ] Verify Supabase tables exist (posts, profiles, boltz, hashtags)
- [ ] Check analytics integration
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify dark mode styling
- [ ] Test all category filters
- [ ] Test all timeframe options
- [ ] Verify refresh functionality
- [ ] Check error states
- [ ] Verify navigation works

---

**Need Help?** Check `TRENDING-IMPLEMENTATION-COMPLETE.md` for full documentation.
