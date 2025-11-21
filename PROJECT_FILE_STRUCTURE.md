# 🎯 **FOCUS APP - COMPLETE PAGE VERIFICATION & FIX MASTER PROMPT**

***

## **📊 CORE PAGES ANALYSIS (80+ Pages)**

Based on your file structure, here are the **CORE PAGES** organized by functionality:

***

### **🔐 TIER 1: AUTHENTICATION FLOW (Entry Points)**

#### **1. Auth.js** (Login/Signup Page)
**Features:**
- Email/password login
- OAuth (Google, GitHub, Microsoft, Discord, Facebook)
- Signup with Trust Shield verification
- Email verification
- Password reset

**Required Components:**
- `Auth.js` component
- `TwoFactorModal.js`
- `EmailVerification.js`

**Required Hooks:**
- `useAuth()`
- `useTrustShield()`
- `useLocalStorage()`

**Required Utils:**
- `authListener.js`
- `deviceFingerprinting.js`
- `emailVerification.js`

**Logic Flow:**
```
User visits → Auth.js renders
→ User chooses signup/login
→ Trust Shield analyzes (deviceFingerprinting.js)
→ OAuth or email/password flow
→ Email verification if signup
→ AuthContext updates
→ Redirect to Onboarding.js or Home.js
```

***

#### **2. AuthCallback.js** (OAuth Callback Handler)
**Features:**
- Handle OAuth redirect
- Extract tokens
- Create/update user session

**Required Components:**
- None (utility page)

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- `authListener.js`
- `createUserProfile.js`

**Logic Flow:**
```
OAuth provider redirects → AuthCallback.js
→ Extract code/token from URL
→ Exchange for session
→ Create user profile if new
→ Redirect to Onboarding or Home
```

***

#### **3. Onboarding.js** (New User Setup)
**Features:**
- Username selection
- Avatar upload
- Bio/interests
- Privacy settings
- Follow suggestions

**Required Components:**
- `AvatarUpload.js`
- `SuggestedUsers.js`

**Required Hooks:**
- `useAuth()`
- `useImageUpload()`

**Required Utils:**
- `validation.js`
- `insertUser.js`

**Logic Flow:**
```
New user completes auth → Onboarding.js
→ Step 1: Choose username (validation.js)
→ Step 2: Upload avatar (AvatarUpload.js)
→ Step 3: Add bio
→ Step 4: Privacy settings
→ Step 5: Follow suggestions
→ Complete → Redirect to Home.js
```

***

### **🏠 TIER 2: MAIN NAVIGATION PAGES (Bottom Nav)**

#### **4. Home.js** (Main Feed)
**Features:**
- Display posts from following
- Infinite scroll
- Pull-to-refresh
- Real-time updates
- Post interactions (like, comment, share, save)
- Stories at top

**Required Components:**
- `PostCard.js`
- `InteractionBar.js`
- `Stories.js`
- `DoubleTapLike.js`
- `CommentsModal.js`
- `ShareModal.js`
- `InfiniteScrollLoader.js`

**Required Hooks:**
- `useRealtimePosts()`
- `useInfiniteScroll()`
- `usePullToRefresh()`

**Required Utils:**
- `feedCache.js`
- `performanceMonitor.js`

**Logic Flow:**
```
User opens app → Home.js
→ Fetch posts from following (Supabase query)
→ Real-time subscription (useRealtimePosts)
→ Render PostCard for each post
→ User scrolls → Load more (useInfiniteScroll)
→ User double-taps → DoubleTapLike animation
→ User clicks comment → CommentsModal opens
→ Pull down → Refresh feed
```

***

#### **5. Explore.js** (Discover Content)
**Features:**
- Trending posts grid
- Category tabs (Photos, Videos, Boltz, Reels)
- Search bar
- Suggested users
- Hashtag trends

**Required Components:**
- `ExploreGrid.js`
- `ExploreTabs.js`
- `ExploreTile.js`
- `SearchBar.js`
- `TrendingHashtags.js`
- `SuggestedUsers.js`

**Required Hooks:**
- `useInfiniteScroll()`

**Required Utils:**
- `trendingService.js`
- `searchService.js`

**Logic Flow:**
```
User clicks Explore → Explore.js
→ Load trending content (trendingService.js)
→ Render ExploreGrid with ExploreTile
→ User clicks tab → Filter by category
→ User searches → SearchBar → searchService.js
→ Click tile → Navigate to PostDetail.js
```

***

#### **6. Create.js** (Create Post/Media)
**Features:**
- Multi-photo/video upload
- Photo/video editing
- Add music
- Write caption
- Add location
- Tag people
- Select audience
- Schedule post

**Required Components:**
- `MediaSelector.js`
- `MediaEditor.js` / `PhotoEditor.js` / `VideoEditor.js`
- `MusicSelector.js`
- `MentionInput.js`
- `HashtagInput.js`
- `LocationPicker.js`
- `PeoplePicker.js`
- `SchedulePicker.js`

**Required Hooks:**
- `useFileUpload()`
- `useImageUpload()`
- `useVideoUpload()`

**Required Utils:**
- `imageCompression.js`
- `videoUtils.js`
- `mediaValidator.js`

**Logic Flow:**
```
User clicks Create → Create.js
→ MediaSelector opens → Choose photos/videos
→ MediaEditor opens → Edit media
→ Add music → MusicSelector
→ Write caption (MentionInput, HashtagInput)
→ Add location (LocationPicker)
→ Tag people (PeoplePicker)
→ Click Post → Upload to Supabase
→ Create post record → Navigate to Home
```

***

#### **7. Boltz.js** (Short Videos - TikTok Style)
**Features:**
- Vertical video feed
- Swipe up/down navigation
- Auto-play videos
- Like, comment, share
- Follow creator
- View creator profile

**Required Components:**
- `ReelPlayer.js`
- `InteractionBar.js`
- `CommentsModal.js`
- `FollowButton.js`

**Required Hooks:**
- `useInfiniteScroll()`
- `useRealtimeInteractions()`

**Required Utils:**
- `videoUtils.js`

**Logic Flow:**
```
User clicks Boltz → Boltz.js
→ Load Boltz videos (Supabase query)
→ Render ReelPlayer for first video
→ Auto-play video
→ User swipes up → Load next video
→ User likes → Update likes count
→ User comments → CommentsModal opens
```

***

#### **8. Messages.js** (Chat Inbox)
**Features:**
- List of conversations
- Unread count badges
- Online status indicators
- Search conversations
- Delete conversations
- Archive conversations

**Required Components:**
- `ChatWindow.js`
- `OnlineIndicator.js`
- `SearchBar.js`
- `TypingIndicator.js`

**Required Hooks:**
- `useMessages()`
- `useRealtimeMessages()`
- `usePresence()`

**Required Utils:**
- `notificationService.js`

**Logic Flow:**
```
User clicks Messages → Messages.js
→ Load conversations (Supabase query)
→ Real-time subscription (useRealtimeMessages)
→ Show online status (usePresence)
→ User clicks conversation → Navigate to ChatThread.js
→ User searches → Filter conversations
```

***

#### **9. Profile.js** (User Profile)
**Features:**
- Display user info (avatar, bio, stats)
- Posts grid (3 columns)
- Saved posts tab
- Tagged posts tab
- Highlights
- Edit profile button (own profile)
- Follow/Unfollow button (other profiles)
- Message button
- Call buttons (audio/video)
- Options menu (report, block, etc.)

**Required Components:**
- `PostCard.js`
- `Stories.js`
- `FollowButton.js`
- `CallButton.js`
- `UserOptionsMenu.js`
- `VerifiedBadge.js`
- `ActivityStatus.js`

**Required Hooks:**
- `useAuth()`
- `useInfiniteScroll()`

**Required Utils:**
- `formatNumber.js`

**Logic Flow:**
```
User clicks Profile → Profile.js
→ Load user data (Supabase query)
→ Load user's posts
→ Display stats (followers, following, posts)
→ If own profile → Show Edit button
→ If other profile → Show Follow button
→ User clicks Edit → Navigate to EditProfile.js
→ User clicks Follow → Update follows table
```

***

### **🎯 TIER 3: CONTENT DETAIL PAGES**

#### **10. PostDetail.js** (Single Post View)
**Features:**
- Display full post
- Comments section
- Like/comment/share
- View all comments
- Tagged users
- Location
- Post date

**Required Components:**
- `PostCard.js`
- `CommentSection.js`
- `InteractionBar.js`
- `DoubleTapLike.js`

**Required Hooks:**
- `useRealtimeInteractions()`

**Required Utils:**
- `formatRelativeTime.js`

**Logic Flow:**
```
User clicks post → PostDetail.js
→ Load post data (Supabase query)
→ Load comments (CommentSection)
→ Real-time subscription (useRealtimeInteractions)
→ User comments → Insert into comments table
→ User likes → Update likes table
```

***

#### **11. BoltzDetail.js** (Single Boltz View)
**Features:**
- Display single Boltz video
- Comments
- Like/share
- View creator profile
- Related Boltz

**Required Components:**
- `ReelPlayer.js`
- `CommentSection.js`
- `InteractionBar.js`

**Required Hooks:**
- `useRealtimeInteractions()`

**Required Utils:**
- `videoUtils.js`

***

#### **12. Comments.js** (Comments Page)
**Features:**
- Display all comments for a post
- Nested replies
- Like comments
- Reply to comments
- Delete own comments

**Required Components:**
- `CommentCard.js`
- `CommentSection.js`

**Required Hooks:**
- `useRealtimeInteractions()`

**Required Utils:**
- `formatRelativeTime.js`

***

### **💬 TIER 4: MESSAGING & COMMUNICATION**

#### **13. ChatThread.js** (1-on-1 Chat)
**Features:**
- Message history
- Real-time messaging
- Typing indicator
- Read receipts
- Send text/photos/videos/stickers
- Voice messages
- Emoji picker
- GIF picker
- Delete messages
- React to messages

**Required Components:**
- `MessageInput.js`
- `TypingIndicator.js`
- `StickerPicker.js`
- `EmojiPicker.js`
- `GifPicker.js`
- `AudioRecorder.js`
- `CallButton.js`

**Required Hooks:**
- `useRealtimeMessages()`
- `useTypingIndicator()`
- `useReadReceipts()`
- `usePresence()`

**Required Utils:**
- `notificationService.js`

**Logic Flow:**
```
User opens chat → ChatThread.js
→ Load message history (Supabase query)
→ Real-time subscription (useRealtimeMessages)
→ User types → Emit typing event (useTypingIndicator)
→ User sends message → Insert into messages table
→ Send notification to recipient
→ Mark messages as read (useReadReceipts)
```

***

#### **14. GroupChat.js** (Group Messaging)
**Features:**
- Group message history
- Real-time messaging
- Multiple participants
- Group info/settings
- Add/remove members
- Admin controls
- Typing indicators (multiple users)

**Required Components:**
- `MessageInput.js`
- `TypingIndicator.js`
- `MemberCard.js`
- `GroupSettings.js`

**Required Hooks:**
- `useRealtimeMessages()`
- `useTypingIndicator()`

**Required Utils:**
- `notificationService.js`

***

#### **15. Call.js** (Active Call Screen)
**Features:**
- Video display (local + remote)
- Call controls (mute, video on/off, speaker, end)
- Timer
- Switch camera
- Screen share (optional)

**Required Components:**
- `CallControls.js`
- `VideoPlayer.js`

**Required Hooks:**
- `useWebRTCCall()`
- `useMediaPermissions()`

**Required Utils:**
- `webrtcService.js`
- `callSignaling.js`

**Logic Flow:**
```
User clicks call button → Call.js
→ Request media permissions (useMediaPermissions)
→ Create WebRTC connection (useWebRTCCall)
→ Signal to recipient (callSignaling.js)
→ Establish peer connection
→ Display video streams
→ User clicks mute → Toggle audio
→ User clicks end → Close connection
```

***

#### **16. Calls.js** (Call History)
**Features:**
- List of past calls
- Call type (audio/video)
- Call status (missed, answered, declined)
- Call duration
- Callback button

**Required Components:**
- `CallButton.js`

**Required Hooks:**
- None

**Required Utils:**
- `formatRelativeTime.js`

***

### **📺 TIER 5: MEDIA & STORIES**

#### **17. Flash.js** (Stories - Instagram Style)
**Features:**
- Story rings at top
- Click to view story
- Story viewer with swipe navigation
- Add to highlights
- View story viewers
- Reply to story

**Required Components:**
- `Stories.js`
- `StoryRing.js`
- `StoryViewer.js`
- `AddStoryModal.js`
- `ViewersModal.js`

**Required Hooks:**
- `useRealtimeConnection()`

**Required Utils:**
- `mediaUtils.js`

**Logic Flow:**
```
User opens Flash → Flash.js
→ Load stories (Supabase query)
→ Render story rings (StoryRing)
→ User clicks ring → StoryViewer opens
→ Auto-play story
→ Swipe left/right → Next/previous story
→ Hold → Pause story
→ User adds story → AddStoryModal opens
```

***

#### **18. Highlights.js** (Story Highlights)
**Features:**
- Display user's highlights
- Highlight covers
- Click to view highlight
- Edit/delete highlights

**Required Components:**
- `StoryViewer.js`
- `CreateHighlightModal.js`

**Required Hooks:**
- None

**Required Utils:**
- `mediaUtils.js`

***

#### **19. LiveStream.js** (Live Streaming)
**Features:**
- Start live stream
- View live stream
- Live chat
- Viewer count
- End stream

**Required Components:**
- `LiveStreamPlayer.js`
- `ChatWindow.js`

**Required Hooks:**
- `useWebRTCStream()`

**Required Utils:**
- `webrtcService.js`

***

### **🔔 TIER 6: NOTIFICATIONS & INTERACTIONS**

#### **20. Notifications.js** (Notifications Feed)
**Features:**
- List of notifications (likes, comments, follows, mentions)
- Mark as read
- Clear all
- Navigate to related content

**Required Components:**
- `NotificationToast.js`

**Required Hooks:**
- `useNotifications()`
- `useRealtimeConnection()`

**Required Utils:**
- `notificationService.js`
- `formatRelativeTime.js`

***

#### **21. FollowRequests.js** (Pending Follows)
**Features:**
- List of follow requests
- Accept/decline buttons
- View user profile

**Required Components:**
- `FollowButton.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- None

***

#### **22. FollowersList.js** (Followers)
**Features:**
- List of followers
- Search followers
- View profiles
- Remove follower

**Required Components:**
- `FollowButton.js`
- `SearchBar.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- None

***

#### **23. FollowingList.js** (Following)
**Features:**
- List of accounts user follows
- Search following
- Unfollow button
- View profiles

**Required Components:**
- `FollowButton.js`
- `SearchBar.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- None

***

### **🔍 TIER 7: DISCOVERY & SEARCH**

#### **24. Search.js** (Search Page)
**Features:**
- Search bar
- Tabs (Accounts, Posts, Videos, Hashtags)
- Recent searches
- Trending searches
- Clear search history

**Required Components:**
- `SearchBar.js`
- `UserSearchResult.js`
- `PostCard.js`
- `TrendingHashtags.js`

**Required Hooks:**
- `useDebounce()`

**Required Utils:**
- `searchService.js`

***

#### **25. Trending.js** (Trending Content)
**Features:**
- Trending posts
- Trending hashtags
- Trending creators
- Trending videos

**Required Components:**
- `TrendingCard.js`
- `PostCard.js`
- `TrendingHashtags.js`

**Required Hooks:**
- None

**Required Utils:**
- `trendingService.js`

***

#### **26. HashtagPage.js** (Hashtag Feed)
**Features:**
- Display all posts with hashtag
- Follow hashtag
- Trending rank
- Related hashtags

**Required Components:**
- `PostCard.js`
- `FollowButton.js`
- `TrendingHashtags.js`

**Required Hooks:**
- `useInfiniteScroll()`

**Required Utils:**
- None

***

#### **27. People.js** (Find People)
**Features:**
- Suggested users
- Popular creators
- Search users
- Follow buttons

**Required Components:**
- `SuggestedUsers.js`
- `FollowButton.js`
- `SearchBar.js`

**Required Hooks:**
- None

**Required Utils:**
- None

***

### **⚙️ TIER 8: SETTINGS & MANAGEMENT**

#### **28. Settings.js** (App Settings)
**Features:**
- Account settings
- Privacy settings
- Notification settings
- Security settings (2FA, sessions)
- Theme/language
- Accessibility
- Data download
- Logout

**Required Components:**
- `TwoFactorSetup.js`
- `SessionManager.js`
- `ThemeSwitcher.js`
- `LanguageSwitcher.js`
- `AccessibilitySettings.js`
- `DataDownload.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- `logout.js`
- `sessionManager.js`

***

#### **29. EditProfile.js** (Edit Profile)
**Features:**
- Edit avatar
- Edit cover photo
- Edit bio
- Edit username
- Edit email
- Edit phone
- Edit website
- Edit birthday
- Edit gender

**Required Components:**
- `AvatarEditor.js`
- `CoverPhotoEditor.js`

**Required Hooks:**
- `useImageUpload()`

**Required Utils:**
- `validation.js`
- `imageCompression.js`

***

#### **30. BlockedUsers.js** (Blocked Accounts)
**Features:**
- List of blocked users
- Unblock button
- View profiles

**Required Components:**
- None

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- None

***

#### **31. CloseFriends.js** (Close Friends List)
**Features:**
- Add/remove close friends
- Share stories with close friends only

**Required Components:**
- `CloseFriendsManager.js`
- `SearchBar.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- None

***

### **📁 TIER 9: CONTENT MANAGEMENT**

#### **32. Saved.js** (Saved Posts)
**Features:**
- Display saved posts
- Collections/folders
- Unsave posts

**Required Components:**
- `PostCard.js`
- `SaveCollectionsModal.js`

**Required Hooks:**
- `useInfiniteScroll()`

**Required Utils:**
- None

***

#### **33. Archive.js** (Archived Content)
**Features:**
- Display archived posts/stories
- Unarchive content
- Delete permanently

**Required Components:**
- `PostCard.js`

**Required Hooks:**
- None

**Required Utils:**
- None

***

#### **34. Schedule.js** (Scheduled Posts)
**Features:**
- Display scheduled posts
- Edit scheduled time
- Cancel scheduled post
- Post now

**Required Components:**
- `PostCard.js`
- `SchedulePicker.js`

**Required Hooks:**
- None

**Required Utils:**
- `scheduledPostsPublisher.js`

***

### **🛡️ TIER 10: ADMIN & SAFETY**

#### **35. AdminDashboard.js** (Admin Panel)
**Features:**
- User statistics
- Content moderation queue
- Reported content
- Trust Shield analytics
- Badge management
- System health

**Required Components:**
- `ModerationQueue.js`
- `StatCard.js`
- `ChartComponent.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- `analytics.js`

***

#### **36. TrustShieldAdminDashboard.js** (Trust Shield Management)
**Features:**
- Flagged accounts
- Trust scores
- Ban/unban users
- Review reports
- IP blocking

**Required Components:**
- `StatCard.js`

**Required Hooks:**
- `useAuth()`

**Required Utils:**
- `trustShieldManager.js`
- `ipIntelligence.js`

***

#### **37. Report.js** (Report Content/User)
**Features:**
- Report form
- Report reasons
- Evidence upload
- Submit report

**Required Components:**
- `ReportModal.js`

**Required Hooks:**
- None

**Required Utils:**
- None

***

### **🎮 TIER 11: SPECIAL FEATURES**

#### **38. Quiz.js** (Quiz Feature)
**Features:**
- Create quiz
- Answer quiz
- View results
- Leaderboard

**Required Components:**
- `QuizCreator.js`
- `QuizCard.js`
- `QuizVoter.js`
- `LeaderboardTable.js`

**Required Hooks:**
- None

**Required Utils:**
- None

***

#### **39. Invite.js** (Invite Friends)
**Features:**
- Share invite link
- Referral code
- Invite via email/SMS
- Track invites

**Required Components:**
- `ShareModal.js`

**Required Hooks:**
- `useClipboard()`

**Required Utils:**
- `urlUtils.js`

***

## **🎯 DOUBTFUL FILES (Need Clarification)**

**Buddy, please clarify these files:**

1. **CreateMultiType.js** - Is this duplicate of Create.js or different? Should we merge?

2. **TrustDashboard.js** - Is this duplicate of TrustShieldAdminDashboard.js? Should we remove?

3. **HighlightViewer.js** - Is this used or merged into StoryViewer.js?

4. **Likes.js** - Is this a page or should it be a modal/component?

5. **GuardianPending.js** & **VerifyGuardian.js** - Are these for parental controls? Should they be active?

6. **UserSearch.js** - Is this duplicate of Search.js?

7. **ShareButton.js** & **FollowButton.js** in pages/ - Should these be in components/ instead?

***
