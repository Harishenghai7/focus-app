═══════════════════════════════════════════════════════════════════════════
🗺️ PROFILE COMPONENT ARCHITECTURE MAP
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                           PROFILE.JS (Main)                             │
│                    /src/pages/Profile.js + Profile.css                  │
│                                                                          │
│  • Fetches profile data via useProfile hook                            │
│  • Manages all UI state (modals, tabs, selected content)               │
│  • Coordinates real-time updates                                        │
│  • Determines isOwnProfile logic                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                        ▼
┌──────────────────┐                                   ┌──────────────────┐
│ PROFILE HEADER   │                                   │ PROFILE STATS    │
│ ProfileHeader.js │                                   │ ProfileStats.js  │
├──────────────────┤                                   ├──────────────────┤
│ • Avatar (140px) │                                   │ • 5 stat buttons │
│ • Username       │                                   │ • Posts count    │
│ • Display name   │                                   │ • Followers cnt  │
│ • Verified badge │                                   │ • Following cnt  │
│ • Bio (linkify)  │                                   │ • Boltz count    │
│ • Website link   │                                   │ • Flash count    │
│ • Action buttons │                                   │ • Hover glow     │
│ • Online status  │                                   │ • Click actions  │
└──────────────────┘                                   └──────────────────┘
        │                                                        │
        └────────────────────────┬───────────────────────────┘
                                ▼
                     ┌──────────────────┐
                     │   HIGHLIGHTS     │
                     │  Highlights.js   │
                     ├──────────────────┤
                     │ • Horizontal     │
                     │   scrolling      │
                     │ • Circular       │
                     │   covers (72px)  │
                     │ • Add button     │
                     │   (if owner)     │
                     └──────────────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  PROFILE TABS    │
                     │ ProfileTabs.js   │
                     ├──────────────────┤
                     │ • Sticky bar     │
                     │ • Animated       │
                     │   indicator      │
                     │ • 5 tabs:        │
                     │   Posts, Boltz,  │
                     │   Flash, Tagged, │
                     │   Saved          │
                     └──────────────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  PROFILE GRID    │
                     │ ProfileGrid.js   │
                     ├──────────────────┤
                     │ • Responsive     │
                     │   (3/2/1 cols)   │
                     │ • Maps items to  │
                     │   ProfileTile    │
                     │ • Loading state  │
                     │ • Empty state    │
                     └──────────────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  PROFILE TILE    │
                     │ ProfileTile.js   │
                     ├──────────────────┤
                     │ • Square tile    │
                     │ • Thumbnail img  │
                     │ • Video badge    │
                     │ • Multi badge    │
                     │ • Stats overlay  │
                     │ • Hover scale    │
                     │ • Click → modal  │
                     └──────────────────┘

═══════════════════════════════════════════════════════════════════════════
MODALS (Opened on demand)
═══════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────┐
│                        EDIT PROFILE MODAL                                │
│                     EditProfileModal.js + .css                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Trigger: Click "Edit Profile" button on own profile                     │
│                                                                          │
│ Components:                                                              │
│  • Avatar preview (120px circle)                                         │
│  • File upload input (hidden, triggered by button)                      │
│  • Form fields:                                                          │
│    - Full Name (input, max 50)                                           │
│    - Username (input, max 30, pattern validation)                       │
│    - Bio (textarea, max 150, character counter)                          │
│    - Website (input, URL validation)                                     │
│    - Location (input, max 50)                                            │
│  • Cancel button (secondary style)                                       │
│  • Save button (primary style, disabled while loading)                  │
│  • Error message display (if any)                                        │
│                                                                          │
│ Actions:                                                                 │
│  • Upload avatar to Supabase storage                                     │
│  • Update profile in database                                            │
│  • Call onUpdate callback with new data                                  │
│  • Close modal on success                                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                       FOLLOWERS MODAL                                    │
│                    FollowersModal.js + .css                              │
├──────────────────────────────────────────────────────────────────────────┤
│ Trigger: Click "Followers" stat                                         │
│                                                                          │
│ Components:                                                              │
│  • Search input (filter by username/name)                                │
│  • Scrollable list of followers:                                         │
│    - Avatar (48px circle)                                                │
│    - Username (bold)                                                     │
│    - Full name (muted)                                                   │
│    - Follow button (if not self)                                         │
│  • Loading state ("Loading followers...")                                │
│  • Empty state ("No followers found")                                    │
│                                                                          │
│ Data Source: useFollowersList(userId) hook                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                       FOLLOWING MODAL                                    │
│                    FollowingModal.js + .css                              │
├──────────────────────────────────────────────────────────────────────────┤
│ Trigger: Click "Following" stat                                         │
│                                                                          │
│ Components: (identical to FollowersModal)                                │
│  • Search input                                                          │
│  • Scrollable list of following                                          │
│  • Follow/Unfollow buttons                                               │
│                                                                          │
│ Data Source: useFollowingList(userId) hook                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      SHARE PROFILE MODAL                                 │
│                   ShareProfileModal.js + .css                            │
├──────────────────────────────────────────────────────────────────────────┤
│ Trigger: Click "Share" button (🔗 icon)                                  │
│                                                                          │
│ Components:                                                              │
│  • QR Code image (200x200, generated from profile URL)                  │
│  • "Scan to view profile" text                                           │
│  • Copy Link button (with "Copied!" feedback)                            │
│  • Social share buttons:                                                 │
│    - Native Share (📤, if supported)                                     │
│    - Twitter (🐦)                                                         │
│    - Facebook (👍)                                                        │
│    - WhatsApp (💬)                                                        │
│                                                                          │
│ Actions:                                                                 │
│  • Generate QR code on mount (qrcode library)                            │
│  • Copy profile URL to clipboard                                         │
│  • Open social share dialogs                                             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                    PROFILE OPTIONS MENU                                  │
│                 ProfileOptionsMenu.js + .css                             │
├──────────────────────────────────────────────────────────────────────────┤
│ Trigger: Click "⋯" button on profile header                              │
│                                                                          │
│ Components (if own profile):                                             │
│  • ⚙️ Settings → navigate('/settings')                                   │
│  • 📊 View Analytics → navigate('/analytics')                            │
│  • 🔐 Privacy → navigate('/settings/privacy')                            │
│  • 📥 Export Data → navigate('/settings/data')                           │
│                                                                          │
│ Components (if other profile):                                           │
│  • 🚫 Block (red text, danger style)                                     │
│  • ⚠️ Report (red text, danger style)                                    │
│  • 🔕 Restrict                                                            │
│                                                                          │
│ • Cancel button (closes menu)                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      POST DETAIL MODAL                                   │
│                   PostDetailModal.js + .css                              │
├──────────────────────────────────────────────────────────────────────────┤
│ Trigger: Click any tile in ProfileGrid                                  │
│                                                                          │
│ Layout: Split (desktop) or stacked (mobile)                              │
│                                                                          │
│ Left/Top Section (Media):                                                │
│  • Full-size image or video player                                       │
│  • Aspect ratio maintained                                               │
│  • Video controls if applicable                                          │
│                                                                          │
│ Right/Bottom Section (Info):                                             │
│  • Author header:                                                         │
│    - Avatar (40px)                                                       │
│    - Username                                                            │
│    - Timestamp                                                           │
│  • Caption with linkified text                                           │
│  • Comments list (scrollable):                                           │
│    - Avatar (32px)                                                       │
│    - Username + comment text                                             │
│    - Timestamp                                                           │
│  • Action bar:                                                           │
│    - Like button (❤️/🤍)                                                  │
│    - Comment button (💬)                                                  │
│    - Share button (📤)                                                    │
│    - Like count display                                                  │
│  • Comment input form:                                                   │
│    - Text input ("Add a comment...")                                     │
│    - Post button (disabled if empty)                                     │
│                                                                          │
│ Actions:                                                                 │
│  • Like/unlike post (optimistic UI)                                      │
│  • Post comment (saves to database)                                      │
│  • Real-time comment updates                                             │
│  • Send notifications on like/comment                                    │
└──────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
HOOKS ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────┐
│                            useProfile                                    │
│                      /src/hooks/useProfile.js                            │
├──────────────────────────────────────────────────────────────────────────┤
│ Purpose: Comprehensive profile data management                          │
│                                                                          │
│ Returns:                                                                 │
│  • profile (object)                                                      │
│  • loading (boolean)                                                     │
│  • error (string|null)                                                   │
│  • posts (array)                                                         │
│  • boltz (array)                                                         │
│  • flash (array)                                                         │
│  • tagged (array)                                                        │
│  • saved (array)                                                         │
│  • loadingPosts, loadingBoltz, etc. (booleans)                          │
│  • stats (object: posts, followers, following, boltz, flash counts)     │
│  • followStatus ('pending'|'accepted'|null)                             │
│  • fetchPosts(), fetchBoltz(), fetchFlash(), etc. (functions)           │
│  • updateProfile(updates) (function)                                     │
│  • refreshProfile(), refreshStats() (functions)                         │
│                                                                          │
│ Internal:                                                                │
│  • Fetches profile by username or ID                                     │
│  • Calculates stats from database counts                                 │
│  • Sets up Supabase real-time subscriptions                              │
│  • Cleans up subscriptions on unmount                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            useFollow                                     │
│                      /src/hooks/useFollow.js                             │
├──────────────────────────────────────────────────────────────────────────┤
│ Purpose: Follow/unfollow logic with optimistic UI                       │
│                                                                          │
│ Returns:                                                                 │
│  • followStatus ('pending'|'accepted'|null)                             │
│  • loading (boolean)                                                     │
│  • checking (boolean)                                                    │
│  • isFollowing (boolean computed)                                        │
│  • isPending (boolean computed)                                          │
│  • follow() (function)                                                   │
│  • unfollow() (function)                                                 │
│  • toggleFollow() (function)                                             │
│  • refresh() (function)                                                  │
│                                                                          │
│ Also exports:                                                            │
│  • useFollowersList(userId) → returns { followers, loading, error }     │
│  • useFollowingList(userId) → returns { following, loading, error }     │
│                                                                          │
│ Internal:                                                                │
│  • Checks if target profile is private                                   │
│  • Sets status to 'pending' or 'accepted' accordingly                    │
│  • Sends notifications on follow                                         │
│  • Real-time subscription to follow changes                              │
│  • Optimistic UI updates (instant feedback)                              │
└──────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
UTILITIES
═══════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────┐
│                           textUtils.js                                   │
│                      /src/utils/textUtils.js                             │
├──────────────────────────────────────────────────────────────────────────┤
│ • linkifyText(text)                                                      │
│   - Converts @mentions → <a href="/profile/username">                    │
│   - Converts #hashtags → <a href="/explore?tag=tag">                     │
│   - Converts URLs → <a href="..." target="_blank">                       │
│   - Returns array of React elements                                      │
│                                                                          │
│ • extractMentions(text) → ['username1', 'username2']                     │
│ • extractHashtags(text) → ['tag1', 'tag2']                               │
│ • formatMention(username) → '@username'                                  │
│ • formatHashtag(tag) → '#tag'                                            │
│ • truncateText(text, maxLength) → 'text...'                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        formatNumber.js                                   │
│                    /src/utils/formatNumber.js                            │
├──────────────────────────────────────────────────────────────────────────┤
│ • formatNumber(num, decimals=1)                                          │
│   - 1234 → "1.2K"                                                        │
│   - 1234567 → "1.2M"                                                     │
│   - 1234567890 → "1.2B"                                                  │
│   - Handles negatives, zero, null                                        │
└──────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
DATA FLOW
═══════════════════════════════════════════════════════════════════════════

User visits /profile/johndoe
         │
         ▼
Profile.js mounts
         │
         ├─► useProfile('johndoe', currentUser)
         │     │
         │     ├─► fetchProfile() → Supabase profiles table
         │     ├─► fetchStats() → Count queries
         │     ├─► fetchFollowStatus() → Supabase follows table
         │     └─► Setup real-time subscriptions
         │
         ├─► useFollow(currentUser.id, profile.id)
         │     │
         │     ├─► checkFollowStatus()
         │     └─► Setup real-time subscription
         │
         ├─► usePresence(profile.id)
         │     └─► Check if user is online
         │
         └─► Render:
               ├─► ProfileHeader (avatar, bio, actions)
               ├─► ProfileStats (interactive counts)
               ├─► Highlights (story covers)
               ├─► ProfileTabs (content selector)
               └─► ProfileGrid (media thumbnails)
                     │
                     └─► ProfileTile (each thumbnail)

User clicks "Followers" stat
         │
         ▼
setShowFollowers(true)
         │
         ▼
FollowersModal renders
         │
         ├─► useFollowersList(profile.id)
         │     └─► Fetch followers from Supabase
         │
         └─► Display list with search/filter

User clicks "Follow" button
         │
         ▼
handleFollowClick()
         │
         ▼
toggleFollow() from useFollow
         │
         ├─► Optimistic UI update (instant)
         │
         ├─► Insert to follows table
         │
         ├─► Send notification
         │
         └─► refreshStats() → Update follower count

═══════════════════════════════════════════════════════════════════════════
STYLING SYSTEM
═══════════════════════════════════════════════════════════════════════════

CSS Variables (defined in Profile.css):
  --profile-primary: #8B7FD7       (Lavender purple)
  --profile-secondary: #EE7BFA     (Pink)
  --profile-accent: #FFD600        (Yellow)
  --profile-bg-dark: #0f0f23       (Dark blue)
  --profile-glass-bg: rgba(255,255,255,0.05)
  --profile-glass-border: rgba(255,255,255,0.1)
  --profile-shadow-md: 0 4px 16px rgba(139,127,215,0.3)
  --profile-blur-md: 18px

Glassmorphism Pattern:
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(139, 127, 215, 0.3);

Animation Pattern:
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(139, 127, 215, 0.4);
  }

Responsive Breakpoints:
  Desktop:  > 1024px (3 columns)
  Tablet:   768px - 1024px (2 columns)
  Mobile:   < 768px (1 column, stacked)

═══════════════════════════════════════════════════════════════════════════
🎉 COMPLETE SYSTEM READY FOR PRODUCTION!
═══════════════════════════════════════════════════════════════════════════
