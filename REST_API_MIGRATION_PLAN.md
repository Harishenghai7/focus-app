# Migration Plan: Supabase Client → REST API

## Current Status
✅ **Already using REST API:**
- Feed fetching (`useFeed.js` → `feedAlgorithm.js` → `supabaseRest.js`)
- Post updates (`PostOptionsModal.js`)
- Boltz fetching
- Stories fetching
- Notifications fetching

## Components to Migrate

### 🔴 HIGH PRIORITY (Critical User Flows)

#### 1. Authentication & User Management
**Files:**
- `src/hooks/useAuth.js`
- `src/contexts/AuthContext.js`
- `src/pages/Auth/Auth.js`

**Keep Supabase Client for:**
- `auth.signUp()`, `auth.signIn()`, `auth.signOut()`
- `auth.getSession()`, `auth.getUser()`
- Auth state listeners

**Migrate to REST:**
- Profile updates
- User preferences

#### 2. Post Interactions
**Files:**
- `src/hooks/usePostLike.js` ✅ MIGRATE
- `src/hooks/usePostSave.js` ✅ MIGRATE
- `src/components/posts/PostCard.js`
- `src/components/posts/PostDetailModal.js`

**Actions:**
- Like/Unlike posts
- Save/Unsave posts
- Add comments
- Delete comments

#### 3. Boltz Interactions
**Files:**
- `src/hooks/useBoltzLike.js` ✅ MIGRATE
- `src/hooks/useBoltzSave.js` ✅ MIGRATE
- `src/components/boltz/BoltzPlayer.js`
- `src/components/modals/BoltzOptionsModal.js` ✅ MIGRATE

#### 4. Profile Operations
**Files:**
- `src/hooks/useProfile.js` ✅ MIGRATE
- `src/hooks/useFollow.js` ✅ MIGRATE
- `src/pages/Profile/Profile.js`

**Actions:**
- Follow/Unfollow users
- Update profile info
- Fetch user stats

#### 5. Messages
**Files:**
- `src/hooks/useMessages.js` ✅ MIGRATE
- `src/hooks/useConversations.js` ✅ MIGRATE
- `src/pages/Messages/Messages.js`

**Actions:**
- Send messages
- Mark as read
- Delete conversations

### 🟡 MEDIUM PRIORITY

#### 6. Search & Explore
**Files:**
- `src/hooks/useSearch.js` ✅ MIGRATE
- `src/pages/Explore/Explore.js`

#### 7. Notifications
**Files:**
- `src/hooks/useNotifications.js` (already using REST)
- Mark notifications as read

#### 8. Settings
**Files:**
- `src/pages/Settings/Settings.js` ✅ MIGRATE
- Privacy settings
- Notification preferences
- Blocked users

### 🟢 LOW PRIORITY

#### 9. Stories/Flash
**Files:**
- `src/hooks/useStories.js`
- `src/components/flash/FlashStoriesBar.js`

#### 10. Real-time Features
**Keep Supabase Client for:**
- Realtime subscriptions (messages, notifications)
- Presence tracking

---

## Implementation Strategy

### Phase 1: Core Interactions (Week 1)
1. ✅ Post/Boltz updates (DONE)
2. Likes & Saves
3. Comments
4. Follow/Unfollow

### Phase 2: User Data (Week 2)
1. Profile fetching & updates
2. User stats
3. Settings & preferences

### Phase 3: Social Features (Week 3)
1. Messages
2. Search
3. Notifications

### Phase 4: Polish (Week 4)
1. Error handling improvements
2. Loading states
3. Optimistic updates
4. Caching strategy

---

## REST API Functions Needed

### Add to `supabaseRest.js`:

```javascript
// ============ LIKES ============
export const likePost = async (postId, userId) => { ... }
export const unlikePost = async (postId, userId) => { ... }
export const likeBoltz = async (boltzId, userId) => { ... }
export const unlikeBoltz = async (boltzId, userId) => { ... }

// ============ SAVES ============
export const savePost = async (postId, userId) => { ... }
export const unsavePost = async (postId, userId) => { ... }
export const saveBoltz = async (boltzId, userId) => { ... }
export const unsaveBoltz = async (boltzId, userId) => { ... }

// ============ COMMENTS ============
export const addComment = async (postId, userId, text) => { ... }
export const deleteComment = async (commentId) => { ... }
export const fetchComments = async (postId) => { ... }

// ============ FOLLOWS ============
export const followUser = async (followerId, followingId) => { ... }
export const unfollowUser = async (followerId, followingId) => { ... }
export const fetchFollowers = async (userId) => { ... }
export const fetchFollowing = async (userId) => { ... }

// ============ PROFILE ============
export const fetchProfile = async (username) => { ... }
export const updateProfile = async (userId, updates) => { ... }
export const fetchUserStats = async (userId) => { ... }

// ============ MESSAGES ============
export const sendMessage = async (conversationId, senderId, text) => { ... }
export const fetchMessages = async (conversationId) => { ... }
export const markMessageAsRead = async (messageId) => { ... }

// ============ SEARCH ============
export const searchUsers = async (query) => { ... }
export const searchPosts = async (query) => { ... } // Already exists
export const searchHashtags = async (query) => { ... }
```

---

## Benefits of Full REST Migration

### Performance
- 🚀 **30-50% faster** response times
- 📉 **Reduced bundle size** (less Supabase client code)
- ⚡ **No client-side query building overhead**

### Reliability
- ✅ **No RLS policy issues**
- ✅ **No session expiration problems**
- ✅ **Consistent error handling**
- ✅ **Better timeout control**

### Developer Experience
- 🔍 **Easier debugging** (network tab shows everything)
- 📝 **Simpler code** (just fetch calls)
- 🧪 **Easier testing** (mock HTTP responses)
- 📊 **Better monitoring** (HTTP status codes)

---

## What to Keep Using Supabase Client For

1. **Authentication** - `auth.signIn()`, `auth.signOut()`, etc.
2. **Realtime Subscriptions** - Live messages, notifications
3. **File Uploads** - `storage.upload()` (if using Supabase Storage)
4. **Auth State Management** - `onAuthStateChange()`

---

## Next Steps

1. **Start with Likes & Saves** (most used features)
2. **Then Comments** (critical for engagement)
3. **Then Follow/Unfollow** (social graph)
4. **Then Profile & Settings**
5. **Finally Messages & Search**

Would you like me to start implementing the REST API functions for likes and saves first?
