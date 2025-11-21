# Design Document - Focus Production Readiness

## Overview

This design document outlines the comprehensive architecture and implementation strategy to transform Focus into a production-ready, professional-grade social media platform. The system leverages React for the frontend, Supabase (PostgreSQL + Realtime) for the backend, and follows modern best practices for performance, security, and scalability.

### Current State Analysis

Focus currently has:
- ✅ Basic authentication with Supabase Auth
- ✅ Profile management with onboarding flow
- ✅ Post creation with multi-image carousel support
- ✅ Home feed with realtime updates
- ✅ Boltz (short videos) and Flash (stories) features
- ✅ Comments, likes, and basic interactions
- ✅ Direct messaging foundation
- ✅ Dark mode and theme support
- ✅ Offline indicator and error boundaries

### Production Readiness Gaps

The following areas require implementation or enhancement:
- ⚠️ Incomplete testing coverage across all features
- ⚠️ Missing performance optimizations (lazy loading, caching)
- ⚠️ Incomplete security hardening (rate limiting, input validation)
- ⚠️ Missing accessibility features (ARIA labels, keyboard navigation)
- ⚠️ Incomplete WebRTC call implementation
- ⚠️ Missing group messaging features
- ⚠️ Incomplete notification system (push notifications)
- ⚠️ Missing deployment configurations
- ⚠️ Incomplete error handling and recovery
- ⚠️ Missing analytics and monitoring

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   Feed   │  │  Create  │  │ Messages │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Profile │  │  Explore │  │   Boltz  │  │   Flash  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend (PostgreSQL)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Service  │  Database  │  Storage  │  Realtime  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RLS Policies  │  Triggers  │  Functions │  Indexes  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   CDN    │  │  WebRTC  │  │   Push   │  │Analytics │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19.2.0 with React Router for navigation
- Framer Motion for animations
- Material-UI for component library
- React Player for video playback
- PeerJS/SimplePeer for WebRTC calls

**Backend:**
- Supabase (PostgreSQL 15+)
- Row Level Security (RLS) for data access control
- Realtime subscriptions for live updates
- Storage buckets for media files
- Edge Functions for serverless logic

**Infrastructure:**
- Netlify/Vercel for frontend hosting
- Supabase Cloud for backend
- CDN for media delivery
- Push notification service (FCM/APNS)


## Components and Interfaces

### 1. Authentication System

**Components:**
- `Auth.js` - Login/signup page with OAuth providers
- `EmailVerification.js` - Email confirmation flow
- `TwoFactorAuth.js` - 2FA setup and verification
- `SessionExpiredModal.js` - Session timeout handling

**Interfaces:**
```typescript
interface AuthService {
  signUp(email: string, password: string): Promise<User>
  signIn(email: string, password: string): Promise<Session>
  signInWithOAuth(provider: 'google' | 'github'): Promise<Session>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  enable2FA(userId: string): Promise<{ secret: string, qrCode: string }>
  verify2FA(userId: string, token: string): Promise<boolean>
}
```

**Security Enhancements:**
- Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
- Rate limiting on login attempts (max 5 per 15 minutes)
- Email verification required before full access
- OAuth state parameter validation
- Session token rotation every 24 hours
- Secure cookie storage with httpOnly and sameSite flags

### 2. Profile Management System

**Components:**
- `Profile.js` - User profile display with tabs
- `EditProfile.js` - Profile editing interface
- `OnboardingFlow.js` - New user setup wizard
- `AvatarUpload.js` - Profile picture upload with cropping

**Interfaces:**
```typescript
interface ProfileService {
  getProfile(userId: string): Promise<Profile>
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>
  uploadAvatar(userId: string, file: File): Promise<string>
  togglePrivacy(userId: string, isPrivate: boolean): Promise<void>
  getFollowers(userId: string, limit: number, offset: number): Promise<User[]>
  getFollowing(userId: string, limit: number, offset: number): Promise<User[]>
}

interface Profile {
  id: string
  username: string
  full_name: string
  bio: string
  avatar_url: string
  is_private: boolean
  is_verified: boolean
  follower_count: number
  following_count: number
  post_count: number
  onboarding_completed: boolean
  created_at: string
}
```

**Features:**
- Username uniqueness validation with real-time checking
- Avatar compression to max 500KB
- Bio character limit (150 chars)
- Privacy toggle with RLS policy updates
- Follower/following count caching with trigger updates
- Profile completion percentage indicator

### 3. Post Creation and Feed System

**Components:**
- `Create.js` / `CreateMultiType.js` - Post creation interface
- `MediaSelector.js` - Multi-file upload with drag-drop
- `MediaEditor.js` / `AdvancedMediaEditor.js` - Image/video editing
- `PostCard.js` - Feed post display component
- `CarouselViewer.js` - Multi-image carousel viewer
- `Home.js` - Main feed page

**Interfaces:**
```typescript
interface PostService {
  createPost(data: CreatePostData): Promise<Post>
  updatePost(postId: string, data: Partial<Post>): Promise<Post>
  deletePost(postId: string): Promise<void>
  getFeed(userId: string, limit: number, offset: number): Promise<Post[]>
  getPost(postId: string): Promise<Post>
  likePost(postId: string, userId: string): Promise<void>
  unlikePost(postId: string, userId: string): Promise<void>
  savePost(postId: string, userId: string): Promise<void>
}

interface Post {
  id: string
  user_id: string
  caption: string
  media_url: string | null
  media_urls: string[] | null
  media_type: 'image' | 'video' | null
  media_types: string[] | null
  is_carousel: boolean
  location: string | null
  like_count: number
  comment_count: number
  save_count: number
  created_at: string
  updated_at: string
}
```

**Features:**
- Multi-image carousel (up to 10 images/videos)
- Drag-to-reorder media items
- Image compression and optimization
- Video thumbnail generation
- Caption with hashtag and mention parsing
- Location tagging
- Draft saving
- Scheduled posting
- Edit post with media management
- Optimistic UI updates for likes/saves


### 4. Boltz (Short Video) System

**Components:**
- `Boltz.js` - Vertical video feed
- `BoltzPlayer.js` - Video player with controls
- `BoltzUpload.js` - Video upload interface

**Interfaces:**
```typescript
interface BoltzService {
  createBoltz(file: File, caption: string, thumbnail: File): Promise<Boltz>
  getBoltzFeed(userId: string, limit: number, offset: number): Promise<Boltz[]>
  likeBoltz(boltzId: string, userId: string): Promise<void>
  commentOnBoltz(boltzId: string, userId: string, text: string): Promise<Comment>
}

interface Boltz {
  id: string
  user_id: string
  video_url: string
  thumbnail_url: string
  caption: string
  duration: number
  like_count: number
  comment_count: number
  view_count: number
  created_at: string
}
```

**Features:**
- Auto-play on scroll into view
- Mute/unmute toggle with persistence
- Swipe up/down navigation
- Progress indicator
- Video compression for mobile
- Thumbnail generation
- View tracking
- Realtime like/comment updates

### 5. Flash (Stories) System

**Components:**
- `Flash.js` - Stories viewer
- `AddStoryModal.js` - Story creation
- `Highlights.js` - Story highlights management
- `CreateHighlightModal.js` - Highlight album creation

**Interfaces:**
```typescript
interface FlashService {
  createFlash(file: File, isCloseFriends: boolean): Promise<Flash>
  getFlashFeed(userId: string): Promise<FlashGroup[]>
  viewFlash(flashId: string, viewerId: string): Promise<void>
  deleteFlash(flashId: string): Promise<void>
  createHighlight(name: string, coverImage: string, flashIds: string[]): Promise<Highlight>
  getHighlights(userId: string): Promise<Highlight[]>
}

interface Flash {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  is_close_friends: boolean
  expires_at: string
  view_count: number
  created_at: string
}

interface FlashGroup {
  user: Profile
  flashes: Flash[]
  has_unseen: boolean
}
```

**Features:**
- 24-hour auto-expiration with cron job
- Viewer list tracking
- Close friends filtering
- Story highlights (permanent albums)
- Archive of expired stories
- Tap to advance, hold to pause
- Reply to stories via DM
- Story stickers and text overlays

### 6. Interaction System

**Components:**
- `InteractionBar.js` - Like, comment, share, save buttons
- `CommentsModal.js` / `InstagramCommentsModal.js` - Comment interface
- `CommentSection.js` - Nested comment display
- `DoubleTapLike.js` - Double-tap to like animation
- `ReactionPicker.js` - Emoji reactions

**Interfaces:**
```typescript
interface InteractionService {
  // Likes
  toggleLike(contentId: string, contentType: 'post' | 'boltz' | 'comment'): Promise<boolean>
  getLikes(contentId: string, limit: number): Promise<User[]>
  
  // Comments
  addComment(contentId: string, text: string, parentId?: string): Promise<Comment>
  updateComment(commentId: string, text: string): Promise<Comment>
  deleteComment(commentId: string): Promise<void>
  getComments(contentId: string, limit: number, offset: number): Promise<Comment[]>
  
  // Saves
  toggleSave(postId: string): Promise<boolean>
  getSavedPosts(userId: string, limit: number): Promise<Post[]>
  
  // Follows
  followUser(targetUserId: string): Promise<FollowStatus>
  unfollowUser(targetUserId: string): Promise<void>
  approveFollowRequest(requestId: string): Promise<void>
  rejectFollowRequest(requestId: string): Promise<void>
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  text: string
  like_count: number
  reply_count: number
  is_pinned: boolean
  created_at: string
}
```

**Features:**
- Optimistic UI updates
- Realtime synchronization
- Nested comment threads (2 levels)
- Comment reactions
- Pin comments (post owner)
- Mention notifications
- Like animation effects
- Save collections


### 7. Messaging System

**Components:**
- `Messages.js` - Message list/inbox
- `ChatThread.js` - Individual conversation
- `GroupChat.js` - Group conversation
- `CreateGroupModal.js` - Group creation
- `TypingIndicator.js` - Real-time typing status
- `VoiceRecorder.js` - Voice message recording
- `AudioPlayer.js` - Voice message playback

**Interfaces:**
```typescript
interface MessagingService {
  // Direct Messages
  sendMessage(recipientId: string, content: MessageContent): Promise<Message>
  getConversations(userId: string): Promise<Conversation[]>
  getMessages(conversationId: string, limit: number, offset: number): Promise<Message[]>
  markAsRead(conversationId: string, messageIds: string[]): Promise<void>
  deleteMessage(messageId: string, deleteForEveryone: boolean): Promise<void>
  
  // Group Messages
  createGroup(name: string, memberIds: string[]): Promise<Group>
  addGroupMembers(groupId: string, memberIds: string[]): Promise<void>
  removeGroupMember(groupId: string, memberId: string): Promise<void>
  updateGroup(groupId: string, data: Partial<Group>): Promise<Group>
  leaveGroup(groupId: string): Promise<void>
  
  // Typing Indicators
  sendTypingIndicator(conversationId: string): Promise<void>
  subscribeToTyping(conversationId: string, callback: (userId: string) => void): Subscription
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  media_url: string | null
  media_type: 'image' | 'video' | 'audio' | null
  reply_to_id: string | null
  is_read: boolean
  created_at: string
  deleted_at: string | null
}

interface Conversation {
  id: string
  type: 'direct' | 'group'
  participants: User[]
  last_message: Message
  unread_count: number
  updated_at: string
}

interface Group {
  id: string
  name: string
  avatar_url: string | null
  admin_ids: string[]
  member_ids: string[]
  created_at: string
}
```

**Features:**
- Real-time message delivery (< 1 second)
- Typing indicators
- Read receipts
- Message reactions
- Reply to specific messages
- Media messages (photos, videos, voice)
- Message deletion (for self or everyone)
- Group chat (up to 50 members)
- Group admin controls
- Message search
- Conversation archiving
- Push notifications for new messages

### 8. Audio/Video Call System

**Components:**
- `Call.js` - Active call interface
- `Calls.js` - Call history
- `CallButton.js` - Initiate call button
- `CallIcon.js` - Call status indicator

**Interfaces:**
```typescript
interface CallService {
  initiateCall(recipientId: string, type: 'audio' | 'video'): Promise<CallSession>
  acceptCall(callId: string): Promise<void>
  rejectCall(callId: string): Promise<void>
  endCall(callId: string): Promise<void>
  toggleMute(callId: string): Promise<void>
  toggleCamera(callId: string): Promise<void>
  switchCamera(): Promise<void>
  getCallHistory(userId: string): Promise<CallRecord[]>
}

interface CallSession {
  id: string
  caller_id: string
  recipient_id: string
  type: 'audio' | 'video'
  status: 'ringing' | 'active' | 'ended' | 'missed'
  started_at: string
  ended_at: string | null
  duration: number
}

interface WebRTCConnection {
  localStream: MediaStream
  remoteStream: MediaStream
  peerConnection: RTCPeerConnection
  dataChannel: RTCDataChannel
}
```

**Features:**
- WebRTC peer-to-peer connections
- Signaling via Supabase Realtime
- ICE candidate exchange
- STUN/TURN server configuration
- Audio/video stream management
- Mute/unmute controls
- Camera on/off toggle
- Front/back camera switch
- Call quality indicators
- Network quality adaptation
- Call history logging
- Missed call notifications
- Call recording (with consent)

### 9. Notification System

**Components:**
- `Notifications.js` - Notification center
- `RealtimeNotifications.js` - Real-time notification handler
- Push notification service worker

**Interfaces:**
```typescript
interface NotificationService {
  getNotifications(userId: string, limit: number, offset: number): Promise<Notification[]>
  markAsRead(notificationIds: string[]): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(notificationId: string): Promise<void>
  getUnreadCount(userId: string): Promise<number>
  subscribeToPush(userId: string, subscription: PushSubscription): Promise<void>
  unsubscribeFromPush(userId: string): Promise<void>
}

interface Notification {
  id: string
  user_id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'call'
  actor_id: string
  content_id: string | null
  content_type: 'post' | 'boltz' | 'flash' | 'comment' | null
  message: string
  is_read: boolean
  created_at: string
}
```

**Features:**
- Real-time in-app notifications
- Push notifications (web and mobile)
- Notification grouping by type
- Unread count badge
- Mark as read/unread
- Notification preferences
- Mute specific users
- Notification sound/vibration
- Deep linking to content


### 10. Search and Discovery System

**Components:**
- `SearchBar.js` - Universal search interface
- `Explore.js` - Discovery feed
- `ExploreTabs.js` - Content category tabs
- `ExploreGrid.js` - Grid layout for explore content
- `HashtagPage.js` - Hashtag-specific feed

**Interfaces:**
```typescript
interface SearchService {
  search(query: string, type: 'all' | 'users' | 'hashtags' | 'posts'): Promise<SearchResults>
  getAutocompleteSuggestions(query: string): Promise<Suggestion[]>
  getTrendingHashtags(limit: number): Promise<Hashtag[]>
  getExploreFeed(userId: string, category: string, limit: number): Promise<Post[]>
  getHashtagPosts(hashtag: string, limit: number, offset: number): Promise<Post[]>
}

interface SearchResults {
  users: User[]
  hashtags: Hashtag[]
  posts: Post[]
}

interface Hashtag {
  tag: string
  post_count: number
  trending_score: number
}
```

**Features:**
- Full-text search across users, captions, hashtags
- Autocomplete suggestions
- Search history
- Trending hashtags
- Explore feed with personalized recommendations
- Category filters (photos, videos, boltz)
- Hashtag pages with post count
- Related hashtags
- Search result ranking by relevance

## Data Models

### Database Schema

**profiles table:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at);
```

**posts table:**
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption TEXT,
  media_url TEXT,
  media_urls TEXT[],
  media_type TEXT,
  media_types TEXT[],
  is_carousel BOOLEAN DEFAULT false,
  location TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_draft BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_for) WHERE is_draft = true;
```

**boltz table:**
```sql
CREATE TABLE boltz (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  caption TEXT,
  duration INTEGER NOT NULL,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_boltz_user_id ON boltz(user_id);
CREATE INDEX idx_boltz_created_at ON boltz(created_at DESC);
```

**flashes table:**
```sql
CREATE TABLE flashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  is_close_friends BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flashes_user_id ON flashes(user_id);
CREATE INDEX idx_flashes_expires_at ON flashes(expires_at);
```

**comments table:**
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT comment_target CHECK (
    (post_id IS NOT NULL AND boltz_id IS NULL) OR
    (post_id IS NULL AND boltz_id IS NOT NULL)
  )
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_boltz_id ON comments(boltz_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

**likes table:**
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, boltz_id),
  UNIQUE(user_id, comment_id),
  CONSTRAINT like_target CHECK (
    (post_id IS NOT NULL AND boltz_id IS NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND boltz_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND boltz_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_boltz_id ON likes(boltz_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);
```

**follows table:**
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_status ON follows(status);
```

**messages table:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

**notifications table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID,
  content_type TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```


## Error Handling

### Error Categories

**1. Network Errors**
- Connection timeout (> 30 seconds)
- No internet connection
- Server unavailable (5xx errors)
- Rate limit exceeded (429)

**Handling Strategy:**
- Display offline indicator
- Queue failed requests for retry
- Show cached content when available
- Provide manual retry button
- Auto-retry with exponential backoff

**2. Authentication Errors**
- Invalid credentials
- Session expired
- Token refresh failed
- Email not verified

**Handling Strategy:**
- Clear error messages without security leaks
- Automatic session refresh
- Session expired modal with re-auth option
- Email verification reminder

**3. Validation Errors**
- Invalid input format
- File size exceeded
- Unsupported file type
- Character limit exceeded

**Handling Strategy:**
- Real-time validation feedback
- Clear error messages with examples
- Prevent form submission until valid
- Show remaining character count

**4. Permission Errors**
- Unauthorized access (403)
- Private account content
- Blocked user interaction
- RLS policy violation

**Handling Strategy:**
- Graceful degradation
- Clear permission messages
- Redirect to appropriate page
- Log security violations

**5. Application Errors**
- Component crash
- Unhandled exception
- Memory overflow
- Infinite loop

**Handling Strategy:**
- Error boundary components
- Fallback UI with recovery options
- Error logging to monitoring service
- User-friendly error messages

### Error Handling Implementation

**Global Error Handler:**
```javascript
// src/utils/errorHandler.js
export class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const handleError = (error, context = {}) => {
  // Log error with context
  console.error('Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    context
  });

  // Send to monitoring service
  if (window.analytics) {
    window.analytics.track('error', {
      error: error.message,
      code: error.code,
      context
    });
  }

  // Return user-friendly message
  return getUserFriendlyMessage(error);
};

const getUserFriendlyMessage = (error) => {
  const errorMessages = {
    'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
    'AUTH_ERROR': 'Authentication failed. Please log in again.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'PERMISSION_ERROR': 'You don\'t have permission to perform this action.',
    'NOT_FOUND': 'The requested content was not found.',
    'RATE_LIMIT': 'Too many requests. Please try again later.',
    'SERVER_ERROR': 'Something went wrong. Please try again.'
  };

  return errorMessages[error.code] || 'An unexpected error occurred.';
};
```

**Error Boundary Component:**
```javascript
// src/components/ErrorBoundary.js (enhanced)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    handleError(error, { componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Oops! Something went wrong</h1>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button onClick={this.handleReset}>Refresh Page</button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.toString()}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /--------\
                /          \
               / Integration \
              /--------------\
             /                \
            /   Unit Tests     \
           /____________________\
```

### 1. Unit Tests (70% coverage target)

**Tools:** Jest, React Testing Library

**Focus Areas:**
- Utility functions (validation, formatting, parsing)
- Custom hooks (useAuth, useRealtime, useInfiniteScroll)
- Pure components (buttons, inputs, cards)
- Service functions (API calls, data transformations)

**Example:**
```javascript
// src/utils/__tests__/validation.test.js
describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

### 2. Integration Tests (20% coverage target)

**Tools:** React Testing Library, MSW (Mock Service Worker)

**Focus Areas:**
- Component interactions (form submission, modal flows)
- API integration (mocked Supabase responses)
- State management (context updates, prop drilling)
- Routing (navigation, protected routes)

**Example:**
```javascript
// src/pages/__tests__/Auth.integration.test.js
describe('Auth Flow', () => {
  it('should log in user with valid credentials', async () => {
    render(<Auth />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText('Log In'));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Tests (10% coverage target)

**Tools:** Playwright or Cypress

**Focus Areas:**
- Critical user journeys (signup → onboarding → first post)
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

**Example:**
```javascript
// e2e/auth.spec.js
test('complete user signup flow', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[name="email"]', 'newuser@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button:has-text("Sign Up")');
  
  await expect(page).toHaveURL('/onboarding');
  await page.fill('[name="username"]', 'newuser');
  await page.fill('[name="full_name"]', 'New User');
  await page.click('button:has-text("Complete")');
  
  await expect(page).toHaveURL('/home');
});
```

### 4. Manual Testing Checklist

**Device Testing:**
- [ ] Chrome (Windows, Mac, Android)
- [ ] Safari (Mac, iOS)
- [ ] Firefox (Windows, Mac)
- [ ] Edge (Windows)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

**Screen Sizes:**
- [ ] Mobile (375px - 428px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1280px - 1920px)
- [ ] Large Desktop (2560px+)

**Accessibility:**
- [ ] Screen reader navigation (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] Color contrast validation
- [ ] Focus indicators
- [ ] ARIA labels

**Performance:**
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1


## Performance Optimization

### 1. Frontend Optimizations

**Code Splitting:**
```javascript
// Lazy load routes
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));

// Lazy load heavy components
const VideoEditor = lazy(() => import('./components/VideoEditor'));
const CallInterface = lazy(() => import('./components/CallInterface'));
```

**Image Optimization:**
- Compress images on upload (target 80% quality)
- Generate multiple sizes (thumbnail, medium, full)
- Use WebP format with JPEG fallback
- Implement lazy loading with Intersection Observer
- Use blur-up placeholder technique

**Caching Strategy:**
```javascript
// Service Worker caching
const CACHE_NAME = 'focus-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/default-avatar.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Virtual Scrolling:**
```javascript
// Implement virtual scrolling for long feeds
import { FixedSizeList } from 'react-window';

const FeedList = ({ posts }) => (
  <FixedSizeList
    height={window.innerHeight}
    itemCount={posts.length}
    itemSize={600}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <PostCard post={posts[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

**Debouncing and Throttling:**
```javascript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query) => performSearch(query), 300),
  []
);

// Throttle scroll events
const throttledScroll = useMemo(
  () => throttle(() => handleScroll(), 100),
  []
);
```

### 2. Backend Optimizations

**Database Indexing:**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_follows_follower_status ON follows(follower_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Partial indexes for filtered queries
CREATE INDEX idx_active_flashes ON flashes(user_id, created_at DESC) 
  WHERE expires_at > NOW();
CREATE INDEX idx_pending_follows ON follows(following_id) 
  WHERE status = 'pending';
```

**Query Optimization:**
```sql
-- Use materialized views for expensive aggregations
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  p.id,
  COUNT(DISTINCT posts.id) as post_count,
  COUNT(DISTINCT followers.id) as follower_count,
  COUNT(DISTINCT following.id) as following_count
FROM profiles p
LEFT JOIN posts ON posts.user_id = p.id
LEFT JOIN follows followers ON followers.following_id = p.id AND followers.status = 'active'
LEFT JOIN follows following ON following.follower_id = p.id AND following.status = 'active'
GROUP BY p.id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

**Connection Pooling:**
```javascript
// Configure Supabase client with connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-connection-pool': 'true'
    }
  }
});
```

**Rate Limiting:**
```sql
-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id UUID,
  action TEXT,
  max_requests INTEGER,
  time_window INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM rate_limits
  WHERE user_id = user_id
    AND action = action
    AND created_at > NOW() - time_window;
  
  IF request_count >= max_requests THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO rate_limits (user_id, action) VALUES (user_id, action);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 3. Realtime Optimization

**Subscription Management:**
```javascript
// Limit concurrent subscriptions
const MAX_SUBSCRIPTIONS = 5;
const activeSubscriptions = new Map();

const subscribeToChannel = (channelName, callback) => {
  // Unsubscribe from oldest if at limit
  if (activeSubscriptions.size >= MAX_SUBSCRIPTIONS) {
    const oldestChannel = activeSubscriptions.keys().next().value;
    unsubscribeFromChannel(oldestChannel);
  }
  
  const subscription = supabase
    .channel(channelName)
    .on('postgres_changes', callback)
    .subscribe();
  
  activeSubscriptions.set(channelName, subscription);
  return subscription;
};
```

**Batching Updates:**
```javascript
// Batch multiple updates into single render
const useBatchedUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const timeoutRef = useRef(null);
  
  const addUpdate = (update) => {
    setUpdates(prev => [...prev, update]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      processUpdates(updates);
      setUpdates([]);
    }, 100);
  };
  
  return addUpdate;
};
```

## Security Implementation

### 1. Row Level Security (RLS) Policies

**Profiles:**
```sql
-- Users can view public profiles or profiles they follow
CREATE POLICY "Public profiles are viewable by everyone"
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

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
```

**Posts:**
```sql
-- Users can view posts from public accounts or accounts they follow
CREATE POLICY "Posts are viewable based on privacy"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = posts.user_id
        AND (
          profiles.is_private = false OR
          profiles.id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = auth.uid()
              AND following_id = profiles.id
              AND status = 'active'
          )
        )
    )
  );

-- Users can only insert their own posts
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update/delete their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (user_id = auth.uid());
```

**Messages:**
```sql
-- Users can only view messages they're part of
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- Users can only send messages to conversations they're part of
CREATE POLICY "Users can send messages to own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );
```

### 2. Input Validation and Sanitization

```javascript
// src/utils/validation.js
export const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },
  
  password: (value) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(value);
  },
  
  username: (value) => {
    // 3-30 chars, alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]{3,30}$/;
    return regex.test(value);
  },
  
  sanitizeHtml: (value) => {
    // Remove script tags and dangerous attributes
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  }
};
```

### 3. CSRF Protection

```javascript
// Generate CSRF token on login
const generateCSRFToken = () => {
  const token = crypto.randomUUID();
  sessionStorage.setItem('csrf_token', token);
  return token;
};

// Include CSRF token in requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const csrfToken = sessionStorage.getItem('csrf_token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken
    }
  });
};
```

### 4. Content Security Policy

```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  font-src 'self' data:;
  frame-src 'self' https://accounts.google.com;
">
```

## Deployment Strategy

### 1. Environment Configuration

**Development:**
- Local Supabase instance or dev project
- Hot module replacement enabled
- Source maps enabled
- Verbose logging

**Staging:**
- Separate Supabase project
- Production build with staging API keys
- Error tracking enabled
- Performance monitoring

**Production:**
- Production Supabase project
- Optimized build
- CDN for static assets
- Minimal logging
- Error tracking and monitoring

### 2. Build Optimization

```json
// package.json
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "npm run build && source-map-explorer 'build/static/js/*.js'",
    "build:prod": "GENERATE_SOURCEMAP=false npm run build"
  }
}
```

### 3. Deployment Checklist

**Pre-Deployment:**
- [ ] Run full test suite
- [ ] Check for console errors/warnings
- [ ] Verify environment variables
- [ ] Test database migrations
- [ ] Review security policies
- [ ] Check bundle size
- [ ] Run Lighthouse audit
- [ ] Test on multiple devices

**Deployment:**
- [ ] Create database backup
- [ ] Run migrations
- [ ] Deploy backend changes
- [ ] Deploy frontend build
- [ ] Verify deployment
- [ ] Monitor error rates
- [ ] Check performance metrics

**Post-Deployment:**
- [ ] Smoke test critical paths
- [ ] Monitor user feedback
- [ ] Check analytics
- [ ] Review error logs
- [ ] Update documentation

### 4. Monitoring and Analytics

**Error Tracking:**
- Sentry or similar service
- Error rate alerts
- Performance degradation alerts

**Analytics:**
- User engagement metrics
- Feature usage tracking
- Conversion funnels
- Performance metrics

**Health Checks:**
- API endpoint monitoring
- Database connection health
- Storage bucket availability
- Realtime connection status

