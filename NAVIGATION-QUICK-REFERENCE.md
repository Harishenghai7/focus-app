# 🗺️ Quick Navigation Reference

**For Developers**: Quick reference for implementing navigation in Focus app

---

## 🚀 Quick Start

### **Navigate to a Page**

```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to user profile
navigate('/profile/username');

// Navigate to post detail
navigate('/post/123');

// Go back
navigate(-1);
```

---

## 📍 Common Routes

### **User Navigation**
```javascript
navigate(`/profile/${username}`)              // User profile
navigate(`/profile/${username}/followers`)    // Followers list
navigate(`/profile/${username}/following`)    // Following list
navigate(`/profile/${username}/edit`)         // Edit profile (or /edit-profile for own)
```

### **Content Navigation**
```javascript
navigate(`/post/${postId}`)                   // Post detail
navigate(`/boltz/${boltzId}`)                 // Boltz detail
navigate(`/hashtag/${tag}`)                   // Hashtag page
navigate(`/highlight/${highlightId}`)         // Highlight viewer
```

### **Messaging Navigation**
```javascript
navigate('/messages')                         // Messages list
navigate(`/messages/${chatId}`)               // Chat thread
navigate(`/chat/${userId}`)                   // Direct message with user
navigate(`/group/${groupId}`)                 // Group chat
```

### **Main Pages**
```javascript
navigate('/home')                             // Home feed
navigate('/explore')                          // Explore page
navigate('/create')                           // Create post
navigate('/notifications')                    // Notifications
navigate('/settings')                         // Settings
```

---

## 🎯 Navigation Patterns

### **Pattern 1: Profile Click**
```javascript
// In any component with username
<div onClick={() => navigate(`/profile/${username}`)}>
  @{username}
</div>
```

### **Pattern 2: Post Click**
```javascript
// Navigate to post detail
<PostCard 
  post={post}
  onClick={() => navigate(`/post/${post.id}`)}
/>
```

### **Pattern 3: Followers/Following**
```javascript
// In Profile.js
<button onClick={() => navigate(`/profile/${username}/followers`)}>
  {followersCount} followers
</button>

<button onClick={() => navigate(`/profile/${username}/following`)}>
  {followingCount} following
</button>
```

### **Pattern 4: Edit Profile**
```javascript
// Only show if own profile
{isOwnProfile && (
  <button onClick={() => navigate('/edit-profile')}>
    Edit Profile
  </button>
)}
```

### **Pattern 5: Back Navigation**
```javascript
// Go back to previous page
<button onClick={() => navigate(-1)}>
  ← Back
</button>
```

---

## 🔗 URL Parameters

### **Reading URL Parameters**
```javascript
import { useParams } from 'react-router-dom';

const { username } = useParams();      // /profile/:username
const { postId } = useParams();        // /post/:postId
const { chatId } = useParams();        // /messages/:chatId
const { hashtag } = useParams();       // /hashtag/:hashtag
```

### **Reading Query Parameters**
```javascript
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const tab = searchParams.get('tab');
const sort = searchParams.get('sort');

// Navigate with query params
navigate('/explore?tab=trending&sort=popular');
```

---

## 📱 Components with Built-in Navigation

### **PostCard**
```javascript
<PostCard
  post={post}
  currentUser={user}
  onUserClick={() => navigate(`/profile/${post.profiles.username}`)}
  // Post click handled internally → /post/:postId
/>
```

### **ExploreGrid**
```javascript
<ExploreGrid
  items={items}
  activeTab="for-you"
  user={user}
  // Item clicks handled internally
  // - Post → /post/:postId
  // - User → /profile/:username
  // - Hashtag → /hashtag/:tag
/>
```

### **StoriesCarousel**
```javascript
<StoriesCarousel
  stories={stories}
  onStoryClick={(story) => {
    // Handle story view (modal/fullscreen)
  }}
  onUserClick={(userId) => navigate(`/profile/${userId}`)}
/>
```

---

## ⚠️ Important Notes

### **Do:**
- ✅ Use `navigate()` from `useNavigate()` hook
- ✅ Use proper route paths (check PAGE_HIERARCHY.md)
- ✅ Handle loading states during navigation
- ✅ Support browser back button
- ✅ Use navigate(-1) for back navigation

### **Don't:**
- ❌ Use `window.location.href` (causes full reload)
- ❌ Use hardcoded routes (check hierarchy first)
- ❌ Navigate without checking user permissions
- ❌ Forget to handle errors/404s
- ❌ Create circular navigation loops

---

## 🔐 Protected Routes

All user pages are automatically protected. If not logged in, user is redirected to `/auth`.

```javascript
// Already handled in App.js
<ProtectedRoute user={user}>
  <Profile user={user} userProfile={userProfile} />
</ProtectedRoute>
```

---

## 🧪 Testing Navigation

```javascript
// Mock navigate in tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Test navigation was called
expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser');
```

---

## 📊 Analytics Tracking

```javascript
import { trackEvent } from './utils/analytics/trackEvent';

// Track navigation events
const handleNavigate = (path) => {
  trackEvent('page_navigation', { 
    from: window.location.pathname,
    to: path 
  });
  navigate(path);
};
```

---

## 🎨 Page Transitions

```javascript
import { motion } from 'framer-motion';

// Add fade transition
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

---

## 🔄 Conditional Navigation

```javascript
// Navigate based on condition
const handleClick = () => {
  if (isOwnProfile) {
    navigate('/edit-profile');
  } else {
    navigate(`/profile/${username}`);
  }
};

// Navigate with confirmation
const handleDelete = () => {
  if (window.confirm('Delete this post?')) {
    // Delete post
    navigate('/home');
  }
};

// Navigate after async action
const handleSubmit = async () => {
  await createPost(data);
  navigate('/home'); // Go to home after creation
};
```

---

## 🛠️ Troubleshooting

### **Navigation not working?**
1. Check route exists in App.js
2. Verify user is authenticated
3. Check console for errors
4. Ensure useNavigate is called inside component

### **Parameters not available?**
1. Check URL pattern in App.js matches
2. Use correct useParams() hook
3. Verify parameter name matches route

### **Back button not working?**
1. Use navigate(-1) instead of custom back
2. Ensure Layout component is used
3. Check browser history is not empty

---

## 📚 Full Route List

See `PAGE_HIERARCHY.md` for complete route documentation.

**Main Pages:**
- `/home` - Home feed
- `/explore` - Explore content
- `/create` - Create post
- `/messages` - Messages list
- `/notifications` - Notifications
- `/profile/:username` - User profile

**Sub-pages:** 20+ routes (see PAGE_HIERARCHY.md)

---

**Last Updated:** November 16, 2025  
**Version:** 1.0
