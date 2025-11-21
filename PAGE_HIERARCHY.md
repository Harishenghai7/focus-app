# Focus App - Page Hierarchy & Relationships

## Overview
This document maps out the parent-child relationships between all pages in the Focus app, showing how pages connect and navigate to each other.

---

## 🏠 Main Pages (Accessible from Navigation)

These pages are directly accessible from the main navigation (Header/BottomNav):

### 1. **Home.js** (`/home`)
- Primary feed page
- Shows posts from followed users
- Entry point after authentication

**Navigates to:**
- `PostDetail.js` - Click on any post
- `Comments.js` - View post comments
- `Likes.js` - See who liked a post
- `Profile.js` - Click on username/avatar
- `HashtagPage.js` - Click on hashtag in post

---

### 2. **Explore.js** (`/explore`)
- Discover new content and users
- Browse trending posts

**Navigates to:**
- `PostDetail.js` - Click on post
- `HashtagPage.js` - Click on trending hashtag
- `UserSearch.js` - Search for users
- `Profile.js` - Click on user
- `Trending.js` - View trending content

---

### 3. **Create.js** (`/create`)
- Create new posts, boltz, highlights
- Media upload

**Navigates to:**
- `CreateMultiType.js` - Advanced creation options
- `Schedule.js` - Schedule post for later
- `Home.js` - After successful post creation

---

### 4. **Messages.js** (`/messages`)
- View all conversations
- Message threads list

**Navigates to:**
- `ChatThread.js` - Click on conversation (`/messages/:chatId`)
- `GroupChat.js` - Open group conversation (`/group/:groupId`)
- `GroupSettings.js` - Group info & settings
- `Profile.js` - Click on user avatar

---

### 5. **Notifications.js** (`/notifications`)
- View all notifications
- Activity feed

**Navigates to:**
- `FollowRequests.js` - View follow requests tab (`/follow-requests`)
- `Profile.js` - Click on user who interacted
- `PostDetail.js` - Click on post notification
- `Messages.js` - Click on message notification

---

### 6. **Profile.js** (`/profile/:username`)
- View user profile
- Show user's posts, boltz, highlights
- Follower/following stats

**Navigates to:**
- `EditProfile.js` - Edit button (own profile only) (`/edit-profile` or `/profile/:username/edit`)
- `FollowersList.js` - Click followers count (`/profile/:username/followers`)
- `FollowingList.js` - Click following count (`/profile/:username/following`)
- `Saved.js` - Saved posts tab (`/saved`)
- `Archive.js` - Archived posts tab (`/archive`)
- `PostDetail.js` - Click on post
- `BoltzDetail.js` - Click on boltz
- `Highlights.js` - View highlights (`/highlights`)
- `HighlightViewer.js` - View specific highlight (`/highlight/:highlightId`)
- `Settings.js` - Settings button (own profile only)

---

## 📄 Sub-Pages (Opened from Main Pages)

### Profile Sub-pages

#### **EditProfile.js** (`/edit-profile` or `/profile/:username/edit`)
- Parent: `Profile.js`
- Edit profile information
- Update avatar, bio, username
- **Navigates back to:** `Profile.js`

#### **FollowersList.js** (`/profile/:username/followers`)
- Parent: `Profile.js`
- View list of followers
- Follow/unfollow actions
- **Navigates to:** `Profile.js` (click on follower)

#### **FollowingList.js** (`/profile/:username/following`)
- Parent: `Profile.js`
- View list of following
- Follow/unfollow actions
- **Navigates to:** `Profile.js` (click on user)

#### **Saved.js** (`/saved`)
- Parent: `Profile.js`
- View saved/bookmarked posts
- **Navigates to:** `PostDetail.js`

#### **Archive.js** (`/archive`)
- Parent: `Profile.js`
- View archived posts (own profile only)
- **Navigates to:** `PostDetail.js`

---

### Messages Sub-pages

#### **ChatThread.js** (`/messages/:chatId` or `/chat/:userId`)
- Parent: `Messages.js`
- One-on-one conversation view
- Send/receive messages
- **Navigates to:** `Profile.js` (click on user)

#### **GroupChat.js** (`/group/:groupId`)
- Parent: `Messages.js`
- Group conversation view
- Multiple participants
- **Navigates to:**
  - `GroupSettings.js` - Group info button
  - `Profile.js` - Click on member

#### **GroupSettings.js** (Modal/Page)
- Parent: `GroupChat.js`
- Manage group members
- Change group name/photo
- Leave group
- **Navigates to:** `Profile.js` (click on member)

---

### Create Sub-pages

#### **CreateMultiType.js** (`/create` or advanced creation)
- Parent: `Create.js`
- Advanced post creation
- Multi-type content (carousel, mixed media)
- **Navigates to:** `Schedule.js` or back to `Home.js`

#### **Schedule.js** (Component/Modal)
- Parent: `Create.js` or `CreateMultiType.js`
- Schedule post for later
- Set date/time
- **Navigates back to:** `Create.js` or `Home.js`

---

### Explore Sub-pages

#### **PostDetail.js** (`/post/:postId`)
- Parent: `Home.js`, `Explore.js`, `Profile.js`, `Saved.js`, `Archive.js`
- View single post with full details
- **Navigates to:**
  - `Profile.js` - Click on author
  - `Comments.js` - View comments
  - `Likes.js` - See who liked
  - `HashtagPage.js` - Click hashtag

#### **HashtagPage.js** (`/hashtag/:hashtag`)
- Parent: `Explore.js`, `Home.js`, `PostDetail.js`
- View all posts with specific hashtag
- **Navigates to:**
  - `PostDetail.js` - Click on post
  - `Profile.js` - Click on user

#### **UserSearch.js** (Component integrated in Explore)
- Parent: `Explore.js`
- Search for users
- **Navigates to:** `Profile.js`

#### **Trending.js** (`/trending`)
- Parent: `Explore.js`
- View trending content
- **Navigates to:** `PostDetail.js`, `HashtagPage.js`

---

### Home Sub-pages

#### **Comments.js** (Component/Modal in `PostDetail.js`)
- Parent: `Home.js`, `PostDetail.js`
- View and add comments
- **Navigates to:** `Profile.js` (click on commenter)

#### **Likes.js** (Modal/Component)
- Parent: `Home.js`, `PostDetail.js`
- View list of users who liked
- **Navigates to:** `Profile.js`

---

### Notifications Sub-pages

#### **FollowRequests.js** (`/follow-requests`)
- Parent: `Notifications.js`
- View pending follow requests
- Accept/decline requests
- **Navigates to:** `Profile.js`

---

### Settings Sub-pages

#### **Settings.js** (`/settings`)
- Main settings hub
- **Sub-sections:**
  - Profile settings
  - Account settings
  - Privacy & security
  - Notifications settings
  - Blocked users

**Navigates to:**
- `BlockedUsers.js` - View blocked users (`/blocked-users`)
- `EditProfile.js` - Edit profile
- `CloseFriends.js` - Manage close friends list (`/close-friends`)

#### **BlockedUsers.js** (`/blocked-users`)
- Parent: `Settings.js`
- View and manage blocked users
- Unblock users
- **Navigates to:** `Profile.js` (view profile to potentially unblock)

---

## 🎯 Feature Pages

### **Boltz.js** (`/boltz`)
- View all boltz (24hr stories)
- **Navigates to:** `BoltzDetail.js` (`/boltz/:boltzId`)

### **BoltzDetail.js** (`/boltz/:boltzId`)
- View specific boltz
- **Navigates to:** `Profile.js`

### **Flash.js** (`/flash` or `/flash/:userId`)
- View flash content
- **Navigates to:** `Profile.js`

### **Highlights.js** (`/highlights`)
- View profile highlights
- **Navigates to:** `HighlightViewer.js` (`/highlight/:highlightId`)

### **HighlightViewer.js** (`/highlight/:highlightId`)
- View specific highlight
- **Navigates to:** `Profile.js`

### **Calls.js** (`/calls`)
- View call history
- **Navigates to:** `Call.js` (`/call/:userId`)

### **Call.js** (`/call/:userId`)
- Active call interface (WebRTC)
- **Navigates to:** `Profile.js` (after call ends)

### **Analytics.js** (`/analytics`)
- View post analytics and insights
- Accessible from own profile posts

### **AdminDashboard.js** (`/admin`)
- Admin-only dashboard
- User management, content moderation

---

## 🔐 Authentication Pages

### **Auth.js** (`/auth`)
- Login/signup page
- Entry point for unauthenticated users

### **AuthCallback.js** (`/auth/callback`)
- OAuth callback handler
- Processes authentication tokens

---

## 🚫 Modal Pages (No Route Required)

These are components that appear as modals/overlays and don't need dedicated routes:

### **Report.js** (Modal)
- Report user or content
- Opened from post/profile menu

### **ShareButton.js** (Should be component)
- Share post modal
- Copy link, share to platforms

### **PrivacySettings** (Component in Settings)
- Privacy configuration
- Part of Settings page

---

## 📊 Navigation Flow Summary

### Common Navigation Patterns:

```
Home → PostDetail → Comments → Profile
     ↓
     → Likes → Profile

Explore → HashtagPage → PostDetail
       ↓
       → Profile → FollowersList/FollowingList

Messages → ChatThread → Profile
        ↓
        → GroupChat → GroupSettings → Profile

Profile → EditProfile (own profile)
       ↓
       → FollowersList/FollowingList → Profile
       ↓
       → Saved/Archive → PostDetail

Notifications → FollowRequests → Profile
             ↓
             → PostDetail
             ↓
             → Messages

Settings → BlockedUsers → Profile
        ↓
        → EditProfile
        ↓
        → CloseFriends
```

---

## 🎨 Route Structure Overview

```
/                          → Redirect to /home or /auth
/auth                      → Auth.js
/auth/callback            → AuthCallback.js
/home                     → Home.js
/explore                  → Explore.js
/create                   → Create.js
/messages                 → Messages.js
/messages/:chatId         → ChatThread.js (in Messages)
/notifications            → Notifications.js
/profile/:username        → Profile.js

/profile/:username/edit   → EditProfile.js
/profile/:username/followers → FollowersList.js
/profile/:username/following → FollowingList.js
/edit-profile            → EditProfile.js (own profile)
/saved                   → Saved.js
/archive                 → Archive.js

/post/:postId            → PostDetail.js
/hashtag/:hashtag        → HashtagPage.js
/boltz                   → Boltz.js
/boltz/:boltzId         → BoltzDetail.js
/flash                   → Flash.js
/flash/:userId          → Flash.js

/chat/:userId           → ChatThread.js
/group/:groupId         → GroupChat.js
/calls                  → Calls.js
/call/:userId           → Call.js

/settings               → Settings.js
/blocked-users          → BlockedUsers.js
/follow-requests        → FollowRequests.js
/close-friends          → CloseFriends.js

/analytics              → Analytics.js
/admin                  → AdminDashboard.js
```

---

## ✅ Implementation Notes

1. **Navigation Method**: Use React Router's `useNavigate()` hook
2. **Back Button**: Pages should support browser back navigation
3. **State Preservation**: Maintain scroll position where appropriate
4. **Loading States**: Show skeletons during navigation
5. **Error Handling**: Graceful 404 for invalid routes
6. **Deep Linking**: All routes should be shareable URLs
7. **Authentication**: Protected routes redirect to `/auth` if not logged in

---

**Last Updated:** November 16, 2025
