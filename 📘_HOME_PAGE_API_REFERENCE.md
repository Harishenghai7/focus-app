# 📘 HOME PAGE - COMPONENT API REFERENCE

## Table of Contents
1. [Home Component](#home-component)
2. [PostCard Component](#postcard-component)
3. [Stories Component](#stories-component)
4. [FocuslyButton Component](#focuslybutton-component)
5. [Modal Components](#modal-components)
6. [State Components](#state-components)
7. [Custom Hooks](#custom-hooks)
8. [Utility Functions](#utility-functions)

---

## Home Component

### Import
```javascript
import Home from './pages/Home';
```

### Usage
```jsx
<Home />
```

### Description
Main home page component with infinite scroll feed, stories, and real-time updates.

### Props
None (uses AuthContext internally)

### State
```javascript
{
  posts: Array,              // List of posts
  loading: boolean,          // Loading state
  error: string | null,      // Error message
  hasMore: boolean,          // More posts available
  page: number,              // Current page
  newPostsAvailable: boolean, // New posts banner
  refreshing: boolean,       // Pull-to-refresh state
  commentModalOpen: boolean, // Comment modal state
  shareModalOpen: boolean,   // Share modal state
  selectedPost: Object | null // Currently selected post
}
```

### Methods
```javascript
fetchPosts(pageNum, refresh)    // Fetch posts from API
handleLike(postId, isLiked)     // Toggle like
handleSave(postId, isSaved)     // Toggle save
handleComment(post)             // Open comment modal
handleShare(post)               // Open share modal
handleFollow(userId, isFollowing) // Toggle follow
handlePullRefresh()             // Refresh feed
```

### Events
- Realtime post insertions
- Infinite scroll trigger
- Pull-to-refresh
- Modal open/close

---

## PostCard Component

### Import
```javascript
import PostCard from './components/PostCard';
```

### Usage
```jsx
<PostCard
  post={post}
  user={user}
  mode="feed"
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
  onSave={() => {}}
  onFollow={() => {}}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `post` | Object | Yes | - | Post data object |
| `user` | Object | Yes | - | Current user object |
| `mode` | String | No | 'feed' | Display mode: 'feed', 'grid', 'detail' |
| `onLike` | Function | No | () => {} | Like callback |
| `onComment` | Function | No | () => {} | Comment callback |
| `onShare` | Function | No | () => {} | Share callback |
| `onSave` | Function | No | () => {} | Save callback |
| `onFollow` | Function | No | () => {} | Follow callback |
| `onUserClick` | Function | No | () => {} | User profile click |
| `onPostClick` | Function | No | () => {} | Post detail click |

### Post Object Structure
```javascript
{
  id: string,
  user_id: string,
  caption: string,
  media_urls: string[],
  media_type: 'image' | 'video',
  location?: string,
  created_at: string,
  likes: number,
  isLiked: boolean,
  commentsCount: number,
  isSaved: boolean,
  user: {
    id: string,
    username: string,
    display_name?: string,
    avatar_url?: string,
    verified?: boolean
  }
}
```

### Features
- Multi-media carousel support
- Double-tap to like
- Options menu (3 dots)
- @mention and #hashtag parsing
- Verified badge display
- Like animation
- Lazy image loading

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

---

## Stories Component

### Import
```javascript
import Stories from './components/Stories';
```

### Usage
```jsx
<Stories 
  user={user}
  userProfile={userProfile}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `user` | Object | Yes | Current user object |
| `userProfile` | Object | Yes | User profile data |

### Features
- Horizontal scroll
- Viewed/unviewed indicators
- Add story button
- Real-time updates
- Touch/swipe support
- Scroll arrows
- Loading skeletons

### Story Object
```javascript
{
  id: string,
  user_id: string,
  media_url: string,
  media_type: 'image' | 'video',
  created_at: string,
  views: number,
  user: {
    id: string,
    username: string,
    avatar_url: string,
    verified: boolean
  }
}
```

---

## FocuslyButton Component

### Import
```javascript
import FocuslyButton from './components/FocuslyButton';
```

### Usage
```jsx
<FocuslyButton 
  onClick={handleClick}
  showPulse={true}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onClick` | Function | No | navigate('/focusly') | Custom click handler |
| `showPulse` | Boolean | No | true | Show pulse animation |

### Features
- Fixed bottom-right position
- Animated entrance (Framer Motion)
- Hover scale effect
- Pulse animation
- Tooltip on hover
- Mobile responsive
- Keyboard accessible

### Styling
- Size: 60x60px (desktop), 52-56px (mobile)
- Position: Fixed, bottom-right
- Z-index: 998
- Animation: Spring + Pulse

---

## Modal Components

### CommentModal

#### Import
```javascript
import CommentModal from './components/CommentModal';
```

#### Usage
```jsx
<CommentModal
  isOpen={true}
  onClose={handleClose}
  post={post}
  user={user}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | Boolean | Yes | Modal open state |
| `onClose` | Function | Yes | Close handler |
| `post` | Object | Yes | Post data |
| `user` | Object | Yes | Current user |

#### Features
- Scrollable comments list
- Add comment input
- Like comments
- Reply to comments
- Delete own comments
- Real-time updates
- @mention support
- Emoji support

---

### ShareModal

#### Import
```javascript
import ShareModal from './components/ShareModal';
```

#### Usage
```jsx
<ShareModal
  isOpen={true}
  onClose={handleClose}
  post={post}
  user={user}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | Boolean | Yes | Modal open state |
| `onClose` | Function | Yes | Close handler |
| `post` | Object | Yes | Post to share |
| `user` | Object | Yes | Current user |

#### Share Options
- Share to story
- Send in DM
- Share via email
- Copy link
- Share to external apps

---

## State Components

### LoadingFallback

#### Usage
```jsx
<LoadingFallback />
```

#### Features
- Centered spinner
- Accessible (aria-busy)
- Screen reader support
- Minimal render

---

### EmptyState

#### Usage
```jsx
<EmptyState
  icon="📸"
  message="No posts yet"
  actionLabel="Explore"
  onAction={handleExplore}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | String/Node | Yes | Icon to display |
| `message` | String | Yes | Empty message |
| `actionLabel` | String | No | Button label |
| `onAction` | Function | No | Button click handler |

---

### ErrorMessage

#### Usage
```jsx
<ErrorMessage
  type="network"
  title="Network Error"
  message="Unable to load posts"
  onRetry={handleRetry}
  showRetry={true}
/>
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | String | No | 'general' | Error type |
| `title` | String | No | Auto | Error title |
| `message` | String | No | Auto | Error message |
| `icon` | String | No | Auto | Error icon |
| `onRetry` | Function | No | - | Retry handler |
| `showRetry` | Boolean | No | true | Show retry button |

#### Error Types
- `network` - Network/connection errors
- `auth` - Authentication errors
- `server` - Server errors
- `general` - Generic errors

---

## Custom Hooks

### useInfiniteScroll

#### Import
```javascript
import useInfiniteScroll from './hooks/useInfiniteScroll';
```

#### Usage
```javascript
const {
  data,
  loading,
  hasMore,
  loadMore,
  reset,
  observerRef,
  error
} = useInfiniteScroll(fetchFunction, pageSize);
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fetchFunction` | Function | Yes | - | Async function to fetch data |
| `pageSize` | Number | No | 20 | Items per page |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `data` | Array | All loaded items |
| `loading` | Boolean | Loading state |
| `hasMore` | Boolean | More data available |
| `loadMore` | Function | Manually trigger load |
| `reset` | Function | Reset pagination |
| `observerRef` | Ref | Attach to sentinel element |
| `error` | Object | Error object |

#### Example
```javascript
const fetchPosts = async (page, pageSize) => {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .range((page - 1) * pageSize, page * pageSize - 1);
  return data;
};

const { data, loading, hasMore, observerRef } = useInfiniteScroll(
  fetchPosts,
  10
);

return (
  <div>
    {data.map(item => <Item key={item.id} {...item} />)}
    {loading && <Spinner />}
    {hasMore && <div ref={observerRef} />}
  </div>
);
```

---

### useMediaQuery

#### Import
```javascript
import { useMediaQuery } from './hooks/useMediaQuery';
```

#### Usage
```javascript
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | String | Media query string |

#### Returns
Boolean - True if media query matches

#### Common Queries
```javascript
// Screen sizes
'(max-width: 768px)'    // Mobile
'(max-width: 1024px)'   // Tablet
'(min-width: 1440px)'   // Large desktop

// User preferences
'(prefers-color-scheme: dark)'
'(prefers-reduced-motion: reduce)'
'(prefers-contrast: high)'

// Device capabilities
'(hover: none)'
'(pointer: coarse)'
```

---

## Utility Functions

### formatDate

#### Import
```javascript
import { formatDate, formatTimeAgo } from './utils/formatDate';
```

#### formatDate Usage
```javascript
formatDate(date, format, locale)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | Date/String | - | Date to format |
| `format` | String | 'MMM DD, YYYY' | Format string |
| `locale` | String | 'en-US' | Locale |

#### Format Tokens
- `YYYY` - 4-digit year (2025)
- `YY` - 2-digit year (25)
- `MMMM` - Full month (November)
- `MMM` - Short month (Nov)
- `MM` - 2-digit month (11)
- `DD` - 2-digit day (21)
- `HH` - 24-hour (14)
- `hh` - 12-hour (02)
- `mm` - Minutes (05)
- `ss` - Seconds (09)
- `A` - AM/PM

#### Examples
```javascript
formatDate(new Date(), 'MMM DD, YYYY') 
// "Nov 21, 2025"

formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
// "2025-11-21 14:30:45"

formatDate(new Date(), 'MMMM DD, YYYY at hh:mm A')
// "November 21, 2025 at 02:30 PM"
```

---

#### formatTimeAgo Usage
```javascript
formatTimeAgo(date)
```

#### Returns
- "just now" (< 1 minute)
- "5m ago" (< 1 hour)
- "2h ago" (< 1 day)
- "3d ago" (< 1 week)
- "2w ago" (>= 1 week)

#### Example
```javascript
formatTimeAgo('2025-11-21T14:25:00')
// "5m ago"
```

---

### formatNumber

#### Import
```javascript
import { formatNumber } from './utils/formatNumber';
```

#### Usage
```javascript
formatNumber(num, decimals)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `num` | Number | - | Number to format |
| `decimals` | Number | 1 | Decimal places |

#### Examples
```javascript
formatNumber(1234)        // "1.2K"
formatNumber(1234567)     // "1.2M"
formatNumber(1234567890)  // "1.2B"
formatNumber(1234, 2)     // "1.23K"
formatNumber(999)         // "999"
formatNumber(1000000, 0)  // "1M"
```

#### Suffixes
- K - Thousands (1,000+)
- M - Millions (1,000,000+)
- B - Billions (1,000,000,000+)

---

## Constants Reference

### Home.js Constants

```javascript
// Pagination
const POSTS_PER_PAGE = 10;

// Refresh intervals
const FLASH_REFRESH_INTERVAL = 30000;      // 30 seconds
const NEW_POST_CHECK_INTERVAL = 15000;     // 15 seconds
```

### Media Queries

```javascript
// Breakpoints
const MOBILE_MAX = '768px';
const TABLET_MAX = '1024px';
const DESKTOP_MIN = '1024px';
const LARGE_DESKTOP_MIN = '1440px';
```

---

## Type Definitions (TypeScript Reference)

```typescript
// User
interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
  email?: string;
}

// Post
interface Post {
  id: string;
  user_id: string;
  caption: string;
  media_urls: string[];
  media_type: 'image' | 'video';
  location?: string;
  tagged_users?: string[];
  created_at: string;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  isSaved: boolean;
  user: User;
}

// Comment
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes: number;
  isLiked: boolean;
  user: User;
}

// Story
interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  views: number;
  user: User;
}
```

---

## CSS Class Reference

### Layout Classes
- `.home-page` - Main container
- `.home-container` - Content wrapper
- `.posts-feed` - Feed container

### Story Classes
- `.flash-stories-container` - Stories wrapper
- `.flash-stories-scroll` - Scrollable area
- `.flash-story` - Individual story
- `.flash-story-ring` - Story border
- `.flash-story-avatar` - Story image
- `.flash-add-story` - Add story button

### Post Classes
- `.post-card` - Post container
- `.post-header` - Post header
- `.post-user-info` - User info section
- `.post-media-container` - Media wrapper
- `.post-media` - Image/video element
- `.post-actions` - Action buttons
- `.post-action-btn` - Individual action
- `.post-stats` - Likes/comments count
- `.post-caption` - Caption text
- `.post-timestamp` - Time posted

### State Classes
- `.skeleton-pulse` - Loading animation
- `.spinner` - Loading spinner
- `.end-of-feed` - End message
- `.new-posts-banner` - New posts alert

### Utility Classes
- `.sr-only` - Screen reader only
- `.liked` - Liked state
- `.saved` - Saved state
- `.verified-badge` - Verification badge

---

## Event Handlers Reference

### PostCard Events
```javascript
onLike(postId, isLiked)           // Like toggle
onComment(post)                    // Open comments
onShare(post)                      // Open share
onSave(postId, isSaved)            // Save toggle
onFollow(userId, isFollowing)      // Follow toggle
onUserClick(username)              // Navigate to profile
onPostClick(postId)                // Navigate to post detail
```

### Modal Events
```javascript
onClose()                          // Close modal
onSubmit(data)                     // Submit form
onCancel()                         // Cancel action
```

---

This API reference provides complete documentation for all components, hooks, and utilities in the Home page implementation.
