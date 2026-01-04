# Focus App - Features & Functionality

This document provides a comprehensive overview of the features and working mechanisms of the Focus App, based on the current codebase analysis.

## 🌟 Core Experience

### 1. **Home Feed** (`/home`)
- **Dynamic Feed**: Displays a mix of standard posts, Boltz (short videos), and suggested users.
- **Flash Stories**: A top bar displaying ephemeral stories (Flash) from followed users.
- **Interactions**: Users can like, comment, share, and save posts directly from the feed.
- **Smart Features**:
  - **Pull-to-Refresh**: Refresh the feed to see new content.
  - **Infinite Scroll**: Automatically loads more content as the user scrolls down.
  - **New Posts Banner**: Notifies users when new posts are available while they are viewing the feed.
  - **Catch-up Banner**: Lets users know when they've seen all recent posts.

### 2. **Explore & Discovery** (`/explore`)
- **Search**: Robust search functionality for posts, people, and tags.
- **Trending Section**: Highlights trending hashtags and topics.
- **Explore Grid**: A visual grid of content tailored to the user's interests.
- **Suggested Accounts**: Periodically injects suggested user rows into the grid to aid discovery.
- **Tabs**: Filter content by categories (e.g., All, Trending).

### 3. **Content Creation** (`/create`)
- **Multi-Format Creation**: Unified interface to create:
  - **Posts**: Standard image/video posts.
  - **Boltz**: Short-form vertical videos.
  - **Flash**: Ephemeral stories.
- **Creation Wizard**: Step-by-step process:
  1. **Type Select**: Choose the content format.
  2. **Media Select**: Upload images or videos.
  3. **Edit**: Apply edits (crop, trim, filters) to media.
  4. **Music**: Add background music to content.
  5. **Preview**: Final review before posting with caption, location, and privacy settings.

### 4. **Boltz (Short Video)** (`/boltz`)
- **Immersive Player**: Full-screen vertical video player similar to TikTok/Reels.
- **Swipe Navigation**: Swipe up/down to navigate through videos.
- **Engagement**: Like, comment, share, and follow creators directly from the video overlay.
- **Music Integration**: View and use music tracks associated with videos.
- **Performance**: Smart video preloading for smooth playback.

---

## 👤 User & Social

### 5. **Profile** (`/profile/:username`)
- **Identity**: Displays user avatar, bio, stats (followers, following, trust score).
- **Highlights**: Carousel of saved Flash stories.
- **Content Tabs**:
  - **Grid**: Standard posts.
  - **Boltz**: Short videos.
  - **Saved**: Private collection of saved content.
  - **Tagged**: Posts where the user is tagged.
- **Social Graph**: View followers and following lists with ability to follow/unfollow.

### 6. **Messaging** (`/messages`)
- **Real-time Chat**: Instant messaging with other users.
- **Inbox**: List of active conversations with unread indicators and online status.
- **Rich Media**: Support for sharing posts and media within chats.
- **Responsive Design**: Split-view on desktop, full-screen chat on mobile.

### 7. **Notifications** (`/notifications`)
- **Centralized Hub**: Aggregates all alerts (likes, comments, follows, mentions).
- **Filtering**: Tabs to filter by notification type (All, Likes, Comments, etc.).
- **Actions**: Mark individual or all notifications as read; delete notifications.
- **Real-time**: Updates instantly when new interactions occur.

### 8. **Calls** (`/calls`)
- **Call History**: Log of incoming, outgoing, and missed calls.
- **Call Types**: Support for both Audio and Video calls.
- **Global Listener**: App-wide listener to handle incoming calls anywhere in the app.

---

## 🛡️ Trust Shield & Safety

### 9. **Security Center** (`/security`)
- **Trust Score**: A dynamic score representing user reliability and community standing.
- **Device Management**: View and manage logged-in devices.
- **Security Log**: History of security-related events (logins, password changes).

### 10. **Verification Center** (`/verification-center`)
- **Multi-Factor Verification**:
  - **Email**: Verify email address.
  - **Profile**: Complete profile information.
  - **Biometric**: Optional biometric verification.
  - **OAuth**: Link external accounts.
- **Badges**: Earn badges for completing verification steps.

### 11. **Badge Center** (`/badge-center`)
- **Gamification**: View earned and available badges.
- **Progress Tracking**: Track progress towards specific badges.
- **Application**: Apply for special badges (e.g., Verified Creator).

### 12. **Teen Care System** (`/guardian/dashboard`)
- **Guardian Dashboard**: Parents/Guardians can monitor linked teen accounts.
- **Activity Monitoring**: View recent activity summaries.
- **Safety Controls**: Manage safety settings for teens.
- **Panic Button**: Emergency feature for teens to alert guardians.
- **Age Verification**: Mechanisms to verify age for appropriate content filtering.

---

## ⚙️ Settings & Support

### 13. **Settings** (`/settings`)
- **Comprehensive Control**:
  - **Account**: Email, password, language.
  - **Profile**: Edit bio, avatar, username.
  - **Appearance**: Theme (Dark/Light), accessibility options.
  - **Privacy**: Account privacy, blocked users, activity status.
  - **Notifications**: Granular control over push and email notifications.

### 14. **Support Center** (`/support`)
- **Self-Help**: Searchable FAQ and help articles.
- **Ticket System**: Submit and track support tickets (`/support/new`, `/my-reports`).

### 15. **Moderation & Admin**
- **Content Warnings**: Interstitial pages for sensitive content.
- **Admin Dashboards**: Tools for moderators to review flagged content, images, and reports.

---

## 🔧 Technical Highlights

- **Authentication**: Powered by Supabase Auth (Email/Password, OAuth).
- **Biometric Lock**: App-level security requiring biometric/pin authentication.
- **Real-time**: Utilizes WebSockets/Supabase Realtime for instant updates (messages, notifications).
- **Performance**: Implements virtualization (infinite scroll), lazy loading, and optimistic UI updates.
