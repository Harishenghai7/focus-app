# Focus Code Documentation

This document provides comprehensive documentation for the Focus codebase, including architecture, key modules, and development guidelines.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Modules](#core-modules)
3. [Utility Functions](#utility-functions)
4. [Custom Hooks](#custom-hooks)
5. [Components](#components)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Database Schema](#database-schema)
9. [Development Guidelines](#development-guidelines)

---

## Project Structure

```
focus-app/
├── public/                 # Static assets
│   ├── index.html         # Main HTML template
│   ├── sw.js              # Service worker
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # React components
│   │   ├── common/        # Reusable components
│   │   ├── feed/          # Feed-related components
│   │   ├── post/          # Post components
│   │   └── ...
│   ├── pages/             # Page components
│   │   ├── Home.js        # Home feed
│   │   ├── Profile.js     # User profile
│   │   ├── Auth.js        # Authentication
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── context/           # React context providers
│   ├── styles/            # CSS and styling
│   ├── config/            # Configuration files
│   ├── modals/            # Modal components
│   └── __tests__/         # Test files
├── docs/                  # Documentation
├── migrations/            # Database migrations
├── e2e/                   # End-to-end tests
└── scripts/               # Build and deployment scripts
```

---

## Core Modules

### Authentication System

**Location**: `src/pages/Auth.js`, `src/context/AuthContext.js`

**Purpose**: Handles user authentication, session management, and authorization.

**Key Features**:
- Email/password authentication
- OAuth integration (Google, GitHub)
- Two-factor authentication
- Session management
- Password reset flow

**Example Usage**:
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  
  const handleLogin = async (email, password) => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return user ? <Dashboard /> : <LoginForm onSubmit={handleLogin} />;
}
```

### Realtime System

**Location**: `src/utils/realtimeManager.js`, `src/hooks/useRealtimeConnection.js`

**Purpose**: Manages WebSocket connections for real-time updates.

**Key Features**:
- Automatic reconnection
- Subscription management
- Message batching
- Connection pooling

**Example Usage**:
```javascript
import { useRealtimeConnection } from '../hooks/useRealtimeConnection';

function FeedComponent() {
  const { subscribe, unsubscribe } = useRealtimeConnection();
  
  useEffect(() => {
    const subscription = subscribe('posts', (payload) => {
      console.log('New post:', payload);
      updateFeed(payload.new);
    });
    
    return () => unsubscribe(subscription);
  }, []);
}
```

### Content Management

**Location**: `src/pages/Create.js`, `src/utils/uploadFile.js`

**Purpose**: Handles content creation, upload, and management.

**Key Features**:
- Multi-file upload
- Image compression
- Video processing
- Draft management
- Scheduled posting

---

## Utility Functions

### Validation (`src/utils/validation.js`)

Provides comprehensive input validation and sanitization.

**Key Functions**:

#### `validateEmail(email: string): boolean`
Validates email format using regex pattern.

```javascript
import { validateEmail } from '../utils/validation';

if (validateEmail('user@example.com')) {
  // Valid email
}
```

#### `validatePassword(password: string): Object`
Validates password strength and returns detailed feedback.

```javascript
import { validatePassword } from '../utils/validation';

const result = validatePassword('MyPass123!');
// Returns: { isValid, strength, score, feedback, requirements }
```

#### `sanitizeHtml(value: string): string`
Removes dangerous HTML and prevents XSS attacks.

```javascript
import { sanitizeHtml } from '../utils/validation';

const safe = sanitizeHtml(userInput);
```

### Error Handling (`src/utils/errorHandler.js`)

Centralized error handling and user-friendly error messages.

**Key Functions**:

#### `handleError(error: Error, context?: Object): string`
Processes errors and returns user-friendly messages.

```javascript
import { handleError } from '../utils/errorHandler';

try {
  await apiCall();
} catch (error) {
  const message = handleError(error, { action: 'create_post' });
  showToast(message);
}
```

#### `AppError` Class
Custom error class with error codes and status codes.

```javascript
import { AppError } from '../utils/errorHandler';

throw new AppError('Invalid input', 'VALIDATION_ERROR', 400);
```

### Image Compression (`src/utils/imageCompression.js`)

Optimizes images for upload and storage.

**Key Functions**:

#### `compressImage(file: File, options?: Object): Promise<File>`
Compresses image files while maintaining quality.

```javascript
import { compressImage } from '../utils/imageCompression';

const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8
});
```

#### `generateThumbnail(file: File, size?: number): Promise<File>`
Creates thumbnail versions of images.

```javascript
const thumbnail = await generateThumbnail(file, 150);
```

### Date Formatting (`src/utils/dateFormatter.js`)

Formats dates and times for display.

**Key Functions**:

#### `formatRelativeTime(date: Date|string): string`
Returns human-readable relative time (e.g., "2 hours ago").

```javascript
import { formatRelativeTime } from '../utils/dateFormatter';

const timeAgo = formatRelativeTime(post.created_at);
// Returns: "2 hours ago", "3 days ago", etc.
```

#### `formatDate(date: Date|string, format?: string): string`
Formats dates according to specified format.

```javascript
const formatted = formatDate(new Date(), 'MMM DD, YYYY');
// Returns: "Nov 08, 2025"
```

### Rate Limiting (`src/utils/rateLimiter.js`)

Prevents spam and abuse through rate limiting.

**Key Functions**:

#### `checkRateLimit(action: string, limit: number, window: number): boolean`
Checks if action is within rate limit.

```javascript
import { checkRateLimit } from '../utils/rateLimiter';

if (checkRateLimit('create_comment', 10, 60000)) {
  // Allow action
} else {
  // Show rate limit error
}
```

### Offline Manager (`src/utils/offlineManager.js`)

Handles offline functionality and request queuing.

**Key Functions**:

#### `queueRequest(request: Object): void`
Queues failed requests for retry when online.

```javascript
import { queueRequest } from '../utils/offlineManager';

try {
  await apiCall();
} catch (error) {
  if (!navigator.onLine) {
    queueRequest({ url, method, data });
  }
}
```

---

## Custom Hooks

### useAuth

**Location**: `src/context/AuthContext.js`

**Purpose**: Provides authentication state and methods.

**Returns**:
- `user`: Current user object
- `session`: Current session
- `loading`: Loading state
- `signIn(email, password)`: Sign in method
- `signUp(email, password)`: Sign up method
- `signOut()`: Sign out method

**Example**:
```javascript
const { user, signIn, signOut } = useAuth();
```

### useRealtimeConnection

**Location**: `src/hooks/useRealtimeConnection.js`

**Purpose**: Manages realtime subscriptions.

**Returns**:
- `subscribe(channel, callback)`: Subscribe to channel
- `unsubscribe(subscription)`: Unsubscribe from channel
- `isConnected`: Connection status

### useInfiniteScroll

**Location**: `src/hooks/useInfiniteScroll.js`

**Purpose**: Implements infinite scrolling for feeds.

**Returns**:
- `items`: Current items
- `loading`: Loading state
- `hasMore`: More items available
- `loadMore()`: Load next page

**Example**:
```javascript
const { items, loading, hasMore, loadMore } = useInfiniteScroll({
  fetchFn: fetchPosts,
  limit: 10
});
```

### useDebounce

**Location**: `src/hooks/useDebounce.js`

**Purpose**: Debounces value changes.

**Example**:
```javascript
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### useMediaQuery

**Location**: `src/hooks/useMediaQuery.js`

**Purpose**: Detects responsive breakpoints.

**Example**:
```javascript
const isMobile = useMediaQuery('(max-width: 768px)');
```

### useNotifications

**Location**: `src/hooks/useNotifications.js`

**Purpose**: Manages notifications.

**Returns**:
- `notifications`: Array of notifications
- `unreadCount`: Number of unread notifications
- `markAsRead(id)`: Mark notification as read
- `markAllAsRead()`: Mark all as read

---

## Components

### Component Structure

All components follow this structure:

```javascript
/**
 * ComponentName - Brief description
 * 
 * @param {Object} props - Component props
 * @param {string} props.propName - Prop description
 * @returns {JSX.Element} Rendered component
 */
function ComponentName({ propName }) {
  // Component logic
  
  return (
    // JSX
  );
}

export default ComponentName;
```

### Key Components

#### PostCard (`src/components/PostCard.js`)

Displays a single post in the feed.

**Props**:
- `post`: Post object
- `onLike`: Like handler
- `onComment`: Comment handler
- `onShare`: Share handler

#### CommentSection (`src/components/CommentSection.js`)

Displays and manages comments.

**Props**:
- `postId`: Post ID
- `comments`: Array of comments
- `onAddComment`: Add comment handler

#### MediaCarousel (`src/components/MediaCarousel.js`)

Displays carousel of images/videos.

**Props**:
- `media`: Array of media URLs
- `mediaTypes`: Array of media types
- `onNavigate`: Navigation handler

---

## State Management

### Context Providers

#### AuthContext

Provides authentication state globally.

```javascript
<AuthProvider>
  <App />
</AuthProvider>
```

#### ThemeContext

Manages theme (light/dark mode).

```javascript
const { theme, toggleTheme } = useTheme();
```

#### NotificationContext

Manages notification state.

```javascript
const { showNotification } = useNotification();
showNotification('Success!', 'success');
```

---

## API Integration

### Supabase Client

**Location**: `src/supabaseClient.js`

**Configuration**:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

### API Patterns

#### Fetching Data

```javascript
const { data, error } = await supabase
  .from('posts')
  .select('*, profiles(*)')
  .order('created_at', { ascending: false })
  .limit(10);
```

#### Inserting Data

```javascript
const { data, error } = await supabase
  .from('posts')
  .insert({
    user_id: user.id,
    caption: 'My post',
    media_url: url
  })
  .select()
  .single();
```

#### Updating Data

```javascript
const { error } = await supabase
  .from('posts')
  .update({ caption: 'Updated caption' })
  .eq('id', postId);
```

#### Realtime Subscriptions

```javascript
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    console.log('New post:', payload.new);
  })
  .subscribe();
```

---

## Database Schema

### Key Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### posts
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  caption TEXT,
  media_urls TEXT[],
  media_types TEXT[],
  is_carousel BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES comments(id),
  text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS policies enabled:

```sql
-- Users can view public profiles or profiles they follow
CREATE POLICY "Public profiles viewable"
  ON profiles FOR SELECT
  USING (
    is_private = false OR
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth.uid()
        AND following_id = profiles.id
        AND status = 'active'
    )
  );
```

---

## Development Guidelines

### Code Style

**JavaScript/React**:
- Use functional components with hooks
- Use arrow functions for callbacks
- Use destructuring for props
- Use meaningful variable names
- Add JSDoc comments for complex functions

**Example**:
```javascript
/**
 * Fetches user posts with pagination
 * @param {string} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} Array of posts
 */
const fetchUserPosts = async (userId, limit = 10, offset = 0) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (error) throw error;
  return data;
};
```

### Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Error:', error);
  const message = handleError(error);
  showToast(message, 'error');
  return null;
}
```

### Performance Best Practices

1. **Lazy Loading**: Use React.lazy() for code splitting
2. **Memoization**: Use useMemo and useCallback
3. **Virtual Scrolling**: Use react-window for long lists
4. **Image Optimization**: Compress images before upload
5. **Debouncing**: Debounce search and input handlers

### Testing

Write tests for:
- Utility functions
- Custom hooks
- Complex components
- API integrations

**Example Test**:
```javascript
describe('validateEmail', () => {
  it('should validate correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  
  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### Accessibility

Ensure all components are accessible:
- Add ARIA labels
- Support keyboard navigation
- Maintain color contrast
- Provide alt text for images

```javascript
<button
  aria-label="Like post"
  onClick={handleLike}
  onKeyPress={(e) => e.key === 'Enter' && handleLike()}
>
  <HeartIcon />
</button>
```

### Security

Follow security best practices:
- Validate all user inputs
- Sanitize HTML content
- Use parameterized queries
- Implement rate limiting
- Enable RLS policies

---

## Common Patterns

### Optimistic Updates

```javascript
const handleLike = async (postId) => {
  // Update UI immediately
  setLiked(true);
  setLikeCount(prev => prev + 1);
  
  try {
    await likePost(postId);
  } catch (error) {
    // Revert on error
    setLiked(false);
    setLikeCount(prev => prev - 1);
    showToast('Failed to like post', 'error');
  }
};
```

### Infinite Scroll

```javascript
const { items, loading, hasMore, loadMore } = useInfiniteScroll({
  fetchFn: fetchPosts,
  limit: 10
});

useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      if (!loading && hasMore) {
        loadMore();
      }
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [loading, hasMore, loadMore]);
```

### Realtime Updates

```javascript
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    }, (payload) => {
      setPosts(prev => [payload.new, ...prev]);
    })
    .subscribe();
    
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Troubleshooting

### Common Issues

**Issue**: Realtime not working
**Solution**: Check Supabase realtime settings and RLS policies

**Issue**: Images not loading
**Solution**: Verify storage bucket permissions and signed URLs

**Issue**: Slow performance
**Solution**: Implement pagination, lazy loading, and caching

---

## Additional Resources

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Focus User Guide](USER_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

---

*Last Updated: November 2025*
