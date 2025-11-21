# 🏠 Home Page - Complete Implementation Guide

## Overview

The Home page is the main feed of the Focus social media app, featuring a modern Instagram-style interface with real-time updates, infinite scrolling, and comprehensive interactions.

---

## ✨ Features Implemented

### 1. **Stories/Flash Bar**
- Real-time story updates via Supabase subscriptions
- Horizontal scrollable gallery with touch/mouse support
- Visual indicators for viewed/unviewed stories
- Add your own story functionality
- Automatic refresh every 30 seconds
- Smooth scroll buttons (left/right)

### 2. **Main Feed**
- **Infinite Scroll**: Automatically loads more posts as user scrolls
- **Pull-to-Refresh**: Swipe down to refresh (mobile)
- **Real-time Updates**: New posts banner when available
- **Post Interactions**:
  - ❤️ Like/Unlike with optimistic updates
  - 💬 Comment (opens modal)
  - 📤 Share (opens share modal)
  - 🔖 Save/Unsave posts
  - 👤 Follow/Unfollow users
  - Double-tap to like
  - Multi-media carousel support

### 3. **State Management**
- ✅ Loading states with skeleton screens
- ⚠️ Error states with retry functionality
- 📭 Empty states with actionable prompts
- 🔄 Refreshing states during pull-to-refresh
- ✨ New posts available indicator

### 4. **Focusly AI Integration**
- Floating action button (bottom-right)
- Pulse animation for attention
- Smooth animations with Framer Motion
- Tooltip on hover
- Quick access to AI assistant

### 5. **Modals**
- **Comment Modal**: View and add comments
- **Share Modal**: Share post to different platforms
- **Create Post Prompt**: Quick post creation (mobile)

### 6. **Accessibility (ARIA)**
- Full keyboard navigation support
- Screen reader friendly
- Focus visible states
- ARIA labels and roles
- High contrast mode support
- Reduced motion support
- Touch-friendly tap targets (44px minimum)

### 7. **Responsive Design**
- **Mobile-first** approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
  - Large screens: > 1440px
- Touch gesture optimizations
- Print-friendly styles

---

## 📁 File Structure

```
src/
├── pages/
│   ├── Home.js          # Main home component
│   └── Home.css         # Comprehensive styles
│
├── components/
│   ├── Stories.js       # Stories/Flash component
│   ├── PostCard.js      # Individual post card
│   ├── FocuslyButton.js # Floating AI button
│   ├── FocuslyButton.css
│   ├── CommentModal.js  # Comment modal
│   ├── ShareModal.js    # Share modal
│   ├── CreatePostPrompt.js
│   ├── LoadingFallback.js
│   ├── EmptyState.js
│   ├── ErrorMessage.js
│   └── PullToRefresh.js
│
├── hooks/
│   ├── useInfiniteScroll.js  # Infinite scroll logic
│   └── useMediaQuery.js      # Responsive breakpoints
│
└── utils/
    ├── formatDate.js     # Date formatting
    └── formatNumber.js   # Number formatting
```

---

## 🔧 Technical Implementation

### Component Architecture

```jsx
<Home>
  <PullToRefresh>
    <Stories />
    <NewPostsBanner />
    <CreatePostPrompt /> {/* Mobile only */}
    <PostsFeed>
      <PostCard /> {/* Multiple */}
      <LoadingMore />
      <EndOfFeed />
    </PostsFeed>
    <FocuslyButton />
    <CommentModal />
    <ShareModal />
  </PullToRefresh>
</Home>
```

### State Management

```javascript
// Core states
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [hasMore, setHasMore] = useState(true);
const [page, setPage] = useState(0);

// Feature states
const [newPostsAvailable, setNewPostsAvailable] = useState(false);
const [refreshing, setRefreshing] = useState(false);

// Modal states
const [commentModalOpen, setCommentModalOpen] = useState(false);
const [shareModalOpen, setShareModalOpen] = useState(false);
const [selectedPost, setSelectedPost] = useState(null);
```

### Data Fetching

```javascript
const fetchPosts = useCallback(async (pageNum = 0, refresh = false) => {
  // 1. Set loading state
  // 2. Fetch posts from Supabase
  // 3. Enrich with likes, comments, saves data
  // 4. Update state
  // 5. Handle pagination
}, [user]);
```

### Real-time Subscriptions

```javascript
useEffect(() => {
  const channel = supabase
    .channel('posts_realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    }, () => {
      setNewPostsAvailable(true);
    })
    .subscribe();

  return () => channel.unsubscribe();
}, [user]);
```

### Infinite Scroll

```javascript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchPosts(page + 1);
      }
    },
    { threshold: 0.5 }
  );

  if (lastPostRef.current) {
    observer.observe(lastPostRef.current);
  }

  return () => observer.disconnect();
}, [loading, hasMore, page]);
```

---

## 🎨 Styling Details

### Color Palette

```css
/* Primary */
--primary-gradient: linear-gradient(to bottom right, #1B1139 0%, #321B7C 64%, #462E93 100%);
--accent-purple: #8B7FD7;
--accent-pink: #EE7BFA;
--accent-blue: #A198FF;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #B9B3ED;
--text-muted: #877BC6;

/* Interactive */
--like-color: #FF5378;
--save-color: #38C2E5;
--verified-color: #9372FF;
```

### Animations

1. **Skeleton Loading**: Pulse effect during load
2. **Like Animation**: Pop heart on double-tap
3. **Scroll Buttons**: Fade in/out based on position
4. **New Posts Banner**: Pulse effect
5. **Focusly Button**: Float entrance + hover scale
6. **End of Feed**: Bounce effect

---

## 🔌 API Integration

### Supabase Tables Used

1. **posts**: Main post data
2. **users**: User profiles
3. **post_likes**: Like relationships
4. **comments**: Post comments
5. **saved_posts**: Saved posts
6. **follows**: User follow relationships
7. **flash_stories**: Stories/Flash content
8. **flash_views**: Story view tracking

### Example Queries

```javascript
// Fetch posts with user data
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    user_id,
    caption,
    media_urls,
    media_type,
    location,
    created_at,
    user:users!posts_user_id_fkey (
      id,
      username,
      display_name,
      avatar_url,
      verified
    )
  `)
  .order('created_at', { ascending: false })
  .range(offset, offset + POSTS_PER_PAGE - 1);

// Toggle like
await supabase
  .from('post_likes')
  .insert({ post_id, user_id });

// Toggle save
await supabase
  .from('saved_posts')
  .insert({ post_id, user_id });
```

---

## 📱 Mobile Optimizations

1. **Touch Gestures**:
   - Swipe for carousel navigation
   - Pull-to-refresh
   - Double-tap to like
   - Minimum 44px tap targets

2. **Performance**:
   - Lazy loading images
   - Virtualized scrolling (future enhancement)
   - Optimistic updates
   - Debounced scroll handlers

3. **UI Adaptations**:
   - Larger touch targets
   - Bottom navigation safe area
   - Reduced animations on low-power mode
   - Simplified layouts on small screens

---

## ♿ Accessibility Features

### Keyboard Navigation

- `Tab`: Navigate between interactive elements
- `Enter/Space`: Activate buttons
- `Escape`: Close modals
- Arrow keys: Navigate stories carousel

### Screen Readers

```jsx
<div 
  className="posts-feed"
  role="feed"
  aria-busy={loading}
  aria-label="Posts feed"
>
  {/* Content */}
</div>

<button 
  aria-label="Like post"
  aria-pressed={isLiked}
>
  <Heart />
</button>
```

### Focus Management

- Clear focus indicators (3px outline)
- Focus trap in modals
- Skip links for main content
- Logical tab order

---

## 🚀 Performance Optimizations

1. **React.memo()** on PostCard component
2. **useCallback()** for event handlers
3. **useMemo()** for computed values
4. **Lazy loading** for images
5. **Debounced** scroll handlers
6. **Optimistic updates** for interactions
7. **Pagination** instead of loading all posts

---

## 🧪 Testing Recommendations

### Unit Tests
```javascript
describe('Home Component', () => {
  test('renders loading state initially', () => {});
  test('fetches posts on mount', () => {});
  test('handles like interaction', () => {});
  test('handles infinite scroll', () => {});
  test('shows error state on fetch failure', () => {});
});
```

### Integration Tests
- Test real-time updates
- Test pull-to-refresh
- Test modal interactions
- Test keyboard navigation

### E2E Tests
- Full user flow from login to interactions
- Cross-browser compatibility
- Mobile device testing
- Accessibility audits

---

## 🐛 Known Issues & Future Enhancements

### Future Enhancements
- [ ] Virtualized scrolling for better performance
- [ ] Video autoplay with sound control
- [ ] Story creation modal
- [ ] Advanced post filters
- [ ] Bookmark collections
- [ ] Trending hashtags sidebar
- [ ] Suggested users to follow
- [ ] Post analytics preview
- [ ] Multiple account switching

### Browser Support
- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Mobile browsers (iOS 13+, Android 10+)

---

## 📖 Usage Examples

### Basic Usage

```jsx
import Home from './pages/Home';

function App() {
  return <Home />;
}
```

### With Custom Configuration

```jsx
// Modify constants in Home.js
const POSTS_PER_PAGE = 20; // Load more posts per page
const FLASH_REFRESH_INTERVAL = 60000; // Refresh stories every minute
```

---

## 🎯 Best Practices Followed

1. **Component Modularity**: Each component has single responsibility
2. **Prop Drilling Avoided**: Context for global state
3. **Error Boundaries**: Graceful error handling
4. **Loading States**: Clear feedback for async operations
5. **Semantic HTML**: Proper HTML5 tags (article, section, main)
6. **CSS Organization**: BEM-like naming, logical grouping
7. **Performance**: Memoization, lazy loading, code splitting
8. **Accessibility**: WCAG 2.1 Level AA compliance
9. **Responsive**: Mobile-first, flexible layouts
10. **Maintainability**: Comments, clear naming, documentation

---

## 📞 Support & Contribution

For issues or enhancements, please refer to the main project repository.

---

**Last Updated**: November 21, 2025  
**Version**: 1.0.0  
**Author**: Focus Development Team
