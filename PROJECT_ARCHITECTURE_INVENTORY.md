# Focus App - Project Architecture Inventory

## 📄 PAGES (87 files)

### Main Application Pages
- **AdminDashboard.js** - Admin dashboard for app management
- **Analytics.js** - Analytics and insights dashboard
- **Archive.js** - Archived posts and content
- **Auth.js** - Main authentication page
- **AuthCallback.js** - OAuth callback handler
- **AuthNew.js** - New authentication flow
- **BlockedUsers.js** - Blocked users management
- **Boltz.js** - Boltz feature main page
- **BoltzDetail.js** - Detailed boltz view
- **BoltzNew.js** - New boltz creation
- **Call.js** - Individual call page
- **Calls.js** - Calls history and management
- **CallsNew.js** - New call interface
- **ChatThread.js** - Individual chat thread
- **CloseFriends.js** - Close friends management
- **Comments.js** - Comments page
- **CommentsNew.js** - New comments interface
- **Create.js** - Content creation page
- **CreateMultiType.js** - Multi-type content creation
- **CreateNew.js** - New creation interface
- **DebugAuth.js** - Authentication debugging
- **EditProfile.js** - Profile editing page
- **Explore.js** - Content exploration page
- **Flash.js** - Flash/stories feature
- **FollowersList.js** - Followers list page
- **FollowingList.js** - Following list page
- **FollowRequests.js** - Follow requests management
- **GroupChat.js** - Group chat functionality
- **GroupSettings.js** - Group settings management
- **GuardianPending.js** - Guardian verification pending
- **HashtagPage.js** - Hashtag-specific content
- **Highlights.js** - Story highlights
- **HighlightViewer.js** - Highlight viewing interface
- **Home.js** - Main home feed
- **Likes.js** - Likes management page
- **Login.js** - Login page
- **Messages.js** - Messages/DM page
- **MessagesNew.js** - New messages interface
- **MockAuth.js** - Mock authentication for testing
- **Notifications.js** - Notifications page
- **NotificationsNew.js** - New notifications interface
- **PostDetail.js** - Detailed post view
- **Profile.js** - User profile page
- **ProfileNew.js** - New profile interface
- **Saved.js** - Saved posts page
- **Settings.js** - App settings page
- **SimpleAuth.js** - Simplified auth flow
- **SimpleSignup.js** - Simplified signup
- **TestConnection.js** - Connection testing
- **TestWebRTC.js** - WebRTC testing
- **VerifyGuardian.js** - Guardian verification

### Page Components with CSS Files
- **FollowButton.js** / **ShareButton.js** - Reusable page-level components

---

## 🧩 COMPONENTS (200+ files)

### Core UI Components
- **Header.js** - Main app header
- **Navbar.js** - Navigation bar
- **BottomNav.js** - Bottom navigation
- **PostCard.js** - Post display component
- **InteractionBar.js** - Post interaction buttons
- **InteractionButtons.js** - Individual interaction buttons
- **FollowButton.js** - Follow/unfollow button
- **Badge.js** - Status badges
- **VerifiedBadge.js** - Verification badge
- **Toast.js** - Toast notifications
- **Tooltip.js** - Tooltips
- **ProgressBar.js** - Progress indicators
- **SkeletonLoader.js** - Loading skeletons
- **SkeletonScreen.js** - Full screen loading states
- **EmptyState.js** - Empty state displays

### Media & Content Components
- **MediaViewer.js** - Media viewing component
- **MediaPreview.js** - Media preview
- **MediaSelector.js** - Media selection
- **MediaEditor.js** - Media editing
- **AdvancedMediaEditor.js** - Advanced media editing
- **ImageGallery.js** - Image gallery
- **ImageCropper.js** - Image cropping
- **LazyImage.js** - Lazy-loaded images
- **VideoTrimmer.js** - Video trimming
- **ReelPlayer.js** - Reel/video player
- **AudioPlayer.js** - Audio playback
- **AudioRecorder.js** - Audio recording
- **AudioVisualizer.js** - Audio visualization
- **VoiceRecorder.js** - Voice recording
- **CarouselViewer.js** - Carousel component
- **LiveStreamPlayer.js** - Live streaming

### Stories & Flash Components
- **Stories.js** - Stories component
- **StoryRing.js** - Story ring indicators
- **StoryViewer.js** - Story viewing interface
- **AddStoryModal.js** - Story creation modal
- **LiveBadge.js** - Live indicator badge
- **CountdownTimer.js** - Countdown timers

### Social & Interaction Components
- **CommentSection.js** - Comments display
- **CommentsModal.js** - Comments modal
- **InstagramCommentsModal.js** - Instagram-style comments
- **ReactionBar.js** - Reaction buttons
- **ReactionPicker.js** - Reaction selection
- **DoubleTapLike.js** - Double-tap like functionality
- **SuggestedUsers.js** - User suggestions
- **UserSearchResult.js** - Search result display
- **UserOptionsMenu.js** - User action menu
- **TrendingHashtags.js** - Trending hashtags
- **TrendingSection.js** - Trending content
- **PeoplePicker.js** - People selection
- **MentionInput.js** - Mention input field
- **HashtagInput.js** - Hashtag input

### Communication & Calls
- **GroupChat.js** - Group chat component
- **GroupChatList.js** - Group chat listing
- **GroupSettings.js** - Group management
- **CallButton.js** - Call initiation button
- **CallIcon.js** - Call status icon
- **CallControls.js** - Call control buttons
- **ActiveCallModal.js** - Active call interface
- **IncomingCallModal.js** - Incoming call UI
- **IncomingCallListener.js** - Call detection
- **WebRTCTest.js** - WebRTC testing

### Modals & Dialogs
- **ShareModal.js** - Sharing options
- **ReportModal.js** - Content reporting
- **EditPostModal.js** - Post editing
- **DeleteAccountModal.js** - Account deletion
- **ChangePasswordModal.js** - Password change
- **TwoFactorModal.js** - Two-factor auth modal
- **SessionExpiredModal.js** - Session timeout
- **DataExportModal.js** - Data export
- **SaveCollectionsModal.js** - Save collections
- **CreateGroupModal.js** - Group creation
- **CreateHighlightModal.js** - Highlight creation
- **ViewersModal.js** - Content viewers
- **ConfirmDialog.js** - Confirmation dialogs

### Input & Form Components
- **SearchBar.js** - Search functionality
- **EmojiPicker.js** - Emoji selection
- **GifPicker.js** - GIF selection
- **StickerPicker.js** - Sticker selection
- **LocationPicker.js** - Location selection
- **SchedulePicker.js** - Schedule selection
- **FilterSelector.js** - Content filtering
- **PollCreator.js** - Poll creation
- **PollVoter.js** - Poll voting
- **QuizCreator.js** - Quiz creation

### Authentication & Security
- **EmailVerification.js** - Email verification
- **TwoFactorAuth.js** - 2FA component
- **TwoFactorSetup.js** - 2FA setup
- **SessionManager.js** - Session management
- **SessionManagement.js** - Session controls
- **PrivacySettings.js** - Privacy controls
- **BlockedUsers.js** - Blocked users list
- **MutedUsers.js** - Muted users list

### Profile & User Management
- **AvatarEditor.js** - Avatar editing
- **AvatarUpload.js** - Avatar uploading
- **CoverPhotoEditor.js** - Cover photo editing
- **CloseFriendsManager.js** - Close friends management

### Notifications & Real-time
- **NotificationToast.js** - Notification display
- **PushNotificationPrompt.js** - Push notification setup
- **RealtimeNotifications.js** - Real-time notifications
- **RealtimeErrorBoundary.js** - Real-time error handling
- **TypingIndicator.js** - Typing status
- **OnlineIndicator.js** - Online status
- **ActivityStatus.js** - Activity indicators

### Accessibility & UX
- **AccessibilitySettings.js** - Accessibility controls
- **ScreenReaderAnnouncer.js** - Screen reader support
- **KeyboardShortcutsHelp.js** - Keyboard shortcuts
- **LanguageSwitcher.js** - Language selection
- **ThemeSwitcher.js** - Theme switching
- **OrientationHandler.js** - Device orientation

### Content Management
- **ContentOptionsMenu.js** - Content options
- **ContextMenu.js** - Context menus
- **ParsedContent.js** - Content parsing
- **LinkifiedText.js** - Link processing
- **ScheduledPosts.js** - Scheduled content

### Explore & Discovery
- **ExploreGrid.js** - Explore grid layout
- **ExploreTabs.js** - Explore navigation
- **ExploreTile.js** - Explore content tiles

### Error Handling & State
- **ErrorBoundary.js** - Error boundaries
- **StateHandler.js** - State management
- **RateLimitError.js** - Rate limit handling
- **OfflineIndicator.js** - Offline status
- **UpdateNotification.js** - App updates

### Utility Components
- **InfiniteScrollLoader.js** - Infinite scrolling
- **PullToRefresh.js** - Pull to refresh
- **FloatingActionButton.js** - FAB component
- **BottomSheet.js** - Bottom sheet UI
- **Dashboard.js** - Dashboard layout
- **DataDownload.js** - Data download
- **AdBanner.js** - Advertisement display

### AI & Analytics
- **AIInsightsDashboard.js** - AI insights
- **EnhancedAIDashboard.js** - Enhanced AI features
- **EnhancedAIButton.js** - AI interaction button
- **AITrackingButton.js** - AI tracking
- **AITrackerProvider.js** - AI tracking provider

### Testing & Development
- **AutoTestRunner.js** - Automated testing
- **TestButton.js** - Test functionality

### CSRF & Security Providers
- **CSRFProtectionProvider.js** - CSRF protection

### Onboarding
- **OnboardingFlow.js** - User onboarding

---

## 🔧 UTILS (100+ files)

### Core Utilities
- **helpers.js** - General helper functions
- **constants.js** - App constants
- **index.js** - Utility exports
- **apiClient.js** - API client wrapper
- **storage.js** - Local storage utilities
- **logger.js** - Logging utilities
- **debounce.js** - Debounce functions
- **throttle.js** - Throttle functions

### Authentication & Security
- **authListener.js** - Auth state listening
- **authSecurityManager.js** - Auth security
- **sessionManager.js** - Session management
- **twoFactorAuth.js** - 2FA utilities
- **csrfProtection.js** - CSRF protection
- **deviceFingerprint.js** - Device identification
- **securityLogger.js** - Security logging

### Media Processing
- **imageUtils.js** - Image utilities
- **mediaUtils.js** - Media processing
- **videoUtils.js** - Video utilities
- **imageCompression.js** - Image compression
- **mediaValidator.js** - Media validation
- **uploadFile.js** - File uploading

### Analytics & Tracking
- **analytics.js** - Analytics core
- **performanceMonitor.js** - Performance tracking
- **errorTracking.js** - Error tracking
- **aiTracker.js** - AI interaction tracking
- **enhancedAITracker.js** - Enhanced AI tracking
- **aiTrackerIntegration.js** - AI tracker integration

### Network & API
- **networkUtils.js** - Network utilities
- **rateLimiter.js** - Rate limiting
- **rateLimitManager.js** - Rate limit management
- **apiErrorHandler.js** - API error handling
- **offlineManager.js** - Offline functionality
- **queryCache.js** - Query caching
- **feedCache.js** - Feed caching
- **cacheManager.js** - Cache management

### Real-time & Communication
- **realtimeManager.js** - Real-time connections
- **subscriptionManager.js** - Subscription management
- **webrtcService.js** - WebRTC utilities
- **callSignaling.js** - Call signaling
- **callNotifications.js** - Call notifications
- **notificationService.js** - Notification service
- **notificationUtils.js** - Notification utilities
- **NotificationManager.js** - Notification management
- **pushNotifications.js** - Push notifications
- **notificationPreferences.js** - Notification settings

### Content Processing
- **contentParser.js** - Content parsing
- **linkifiedText.js** - Link processing
- **inputSanitizer.js** - Input sanitization
- **altTextGenerator.js** - Alt text generation
- **emojiPicker.js** - Emoji utilities
- **scheduledPostsPublisher.js** - Scheduled publishing
- **trendingService.js** - Trending content
- **searchService.js** - Search functionality

### Data Management
- **createUserProfile.js** - User profile creation
- **fetchOrCreateUser.js** - User fetching/creation
- **insertUser.js** - User insertion
- **signedUrlManager.js** - Signed URL management
- **draftManager.js** - Draft management
- **stateDeduplicator.js** - State deduplication

### UI & UX Utilities
- **lazyLoad.js** - Lazy loading
- **lazyLoader.js** - Advanced lazy loading
- **loadingStates.js** - Loading state management
- **scrollUtils.js** - Scroll utilities
- **domUtils.js** - DOM manipulation
- **deviceUtils.js** - Device utilities
- **haptics.js** - Haptic feedback
- **colorContrast.js** - Color contrast checking
- **browserCompatibility.js** - Browser compatibility

### Error Handling & Monitoring
- **errorHandler.js** - Error handling
- **errorLogger.js** - Error logging
- **autoErrorFixer.js** - Automatic error fixing
- **autoTester.js** - Automated testing
- **rlsPolicyTester.js** - RLS policy testing

### Formatting & Display
- **dateFormatter.js** - Date formatting
- **urlUtils.js** - URL utilities
- **validation.js** - General validation
- **i18n.js** - Internationalization

### System & Performance
- **serviceWorkerManager.js** - Service worker management
- **versionManager.js** - Version management
- **reportWebVitals.js** - Web vitals reporting
- **logout.js** - Logout functionality
- **accessibility.js** - Accessibility utilities
- **accessibilityHelpers.js** - Accessibility helpers
- **a11yAnnouncer.js** - A11y announcements

### Analytics Subdirectory
- **endSession.js** - Session ending
- **logError.js** - Error logging
- **logPerformance.js** - Performance logging
- **setUserId.js** - User ID setting
- **setUserProperties.js** - User properties
- **startSession.js** - Session starting
- **trackEvent.js** - Event tracking
- **trackPageView.js** - Page view tracking

### Formatters Subdirectory
- **formatBytes.js** - Byte formatting
- **formatDate.js** - Date formatting
- **formatDuration.js** - Duration formatting
- **formatHashtag.js** - Hashtag formatting
- **formatNumber.js** - Number formatting
- **formatUsername.js** - Username formatting

### Validation Subdirectory
- **profanityFilter.js** - Profanity filtering
- **spamDetector.js** - Spam detection
- **validateAge.js** - Age validation
- **validateBio.js** - Bio validation
- **validateCreditCard.js** - Credit card validation
- **validatePhoneNumber.js** - Phone validation
- **validateURL.js** - URL validation
- **validateUsername.js** - Username validation

### Security Subdirectory
- **decryptData.js** - Data decryption
- **detectBot.js** - Bot detection
- **encryptData.js** - Data encryption
- **generateToken.js** - Token generation
- **hashPassword.js** - Password hashing
- **preventXSS.js** - XSS prevention
- **rateLimiter.js** - Rate limiting
- **sanitizeHTML.js** - HTML sanitization

### Media Subdirectory
- **compressImage.js** - Image compression
- **detectFaces.js** - Face detection
- **extractVideoFrame.js** - Video frame extraction
- **generateBlurHash.js** - Blur hash generation
- **generateThumbnail.js** - Thumbnail generation
- **getAudioDuration.js** - Audio duration
- **getVideoDuration.js** - Video duration
- **resizeImage.js** - Image resizing
- **validateImageDimensions.js** - Image validation
- **validateVideoFormat.js** - Video validation

### Performance Subdirectory
- **debounceFunction.js** - Function debouncing
- **getFps.js** - FPS monitoring
- **getMemoryUsage.js** - Memory usage
- **measureLoadTime.js** - Load time measurement
- **measureRenderTime.js** - Render time measurement
- **monitorNetwork.js** - Network monitoring
- **optimizeImages.js** - Image optimization
- **throttleFunction.js** - Function throttling

### Data Subdirectory
- **dataParser.js** - Data parsing
- **eventEmitter.js** - Event emission
- **extractEmails.js** - Email extraction
- **extractHashtags.js** - Hashtag extraction
- **extractMentions.js** - Mention extraction
- **extractPhoneNumbers.js** - Phone extraction
- **highlightText.js** - Text highlighting
- **immutableHelpers.js** - Immutable helpers
- **linkify.js** - Link processing
- **objectUtils.js** - Object utilities
- **parseMarkdown.js** - Markdown parsing
- **sanitizeHTML.js** - HTML sanitization
- **sanitizeInput.js** - Input sanitization
- **slugify.js** - String slugification
- **sorters.js** - Sorting utilities
- **truncateText.js** - Text truncation
- **validators.js** - Data validators

---

## 🎣 HOOKS (50+ files)

### Core React Hooks
- **index.js** - Hook exports
- **useDebounce.js** - Debounced values
- **useThrottle.js** - Throttled functions
- **useDeferredValue.js** - Deferred values
- **useTransition.js** - State transitions
- **useMemoizedCallback.js** - Memoized callbacks
- **useOptimisticAction.js** - Optimistic updates
- **useLoadingState.js** - Loading states
- **useStateSync.js** - State synchronization

### Media & File Hooks
- **useFileUpload.js** - File uploading
- **useImageUpload.js** - Image uploading
- **useVideoUpload.js** - Video uploading
- **useAudioRecorder.js** - Audio recording
- **useCamera.js** - Camera access
- **useMediaPermissions.js** - Media permissions

### Network & Connection Hooks
- **useOnlineStatus.js** - Online/offline status
- **useNetworkSpeed.js** - Network speed monitoring
- **useRealtimeConnection.js** - Real-time connections
- **useWebRTCCall.js** - WebRTC call management
- **usePeerConnection.js** - Peer connections
- **useCall.js** - Call functionality

### Authentication & Security Hooks
- **useCSRFProtection.js** - CSRF protection
- **useEncryption.js** - Data encryption
- **useSessionTimeout.js** - Session management
- **useSignedUrl.js** - Signed URL generation

### UI & UX Hooks
- **useInfiniteScroll.js** - Infinite scrolling
- **usePullToRefresh.js** - Pull to refresh
- **useKeyboardNavigation.js** - Keyboard navigation
- **useScrollRestoration.js** - Scroll position
- **useVirtualization.js** - List virtualization
- **useLazyLoad.js** - Lazy loading
- **useOrientation.js** - Device orientation
- **useClipboard.js** - Clipboard operations

### Performance & Monitoring Hooks
- **usePerformanceMonitor.js** - Performance monitoring
- **useErrorTracking.js** - Error tracking
- **useEventTracking.js** - Event tracking
- **usePageView.js** - Page view tracking
- **useAITracking.js** - AI interaction tracking
- **useBatteryStatus.js** - Battery monitoring
- **useIdleCallback.js** - Idle callbacks

### Social & Interaction Hooks
- **useMessages.js** - Message handling
- **useNotifications.js** - Notification management
- **usePresence.js** - User presence
- **useLastSeen.js** - Last seen status
- **useTypingIndicator.js** - Typing indicators
- **useReadReceipts.js** - Read receipts
- **useRealtimeInteractions.js** - Real-time interactions
- **useInstagramInteractions.js** - Instagram-style interactions
- **useInstagramLikeInteractions.js** - Like interactions
- **useInstagramSave.js** - Save functionality

### Rate Limiting & Permissions
- **useRateLimit.js** - Rate limiting
- **useRateLimiting.js** - Rate limit management
- **usePermissions.js** - Permission management

### Supabase Integration
- **supabaseCallHelpers.js** - Supabase call utilities

---

## 🎨 THEMES & STYLES (12 files)

### Theme System
- **ThemeContext.js** - Theme context provider
- **ThemeContext.css** - Theme context styles
- **ThemeSwitcher.js** - Theme switching component
- **ThemeSwitcher.module.css** - Theme switcher styles

### Core Stylesheets
- **theme.css** - Main theme definitions
- **focus-theme.css** - Focus app specific theme
- **variables.css** - CSS custom properties
- **tokens.css** - Design tokens
- **global.css** - Global styles
- **app-common.css** - Common app styles

### Feature-Specific Styles
- **dark-mode.css** - Dark mode styles
- **accessibility.css** - Accessibility styles
- **animations.css** - Animation definitions
- **responsive.css** - Responsive design
- **browser-compatibility.css** - Browser compatibility
- **orientation.css** - Device orientation styles

---

## 🌐 CONTEXT PROVIDERS (4 files)

### State Management
- **AppStateContext.js** - Global app state
- **AuthContext.js** - Authentication state
- **ThemeContext.js** - Theme management
- **ThemeContext.css** - Theme context styles

---

## 📱 MODALS (4 files)

### Specialized Modals
- **CreateGroupModal.js** - Group creation
- **CreateGroupModal.css** - Group creation styles
- **GuardianVerificationModal.js** - Guardian verification
- **GuardianVerificationModal.css** - Guardian verification styles

---

## 📊 SUMMARY

### Total File Count: 450+ files
- **Pages**: 87 files (including CSS)
- **Components**: 200+ files (including CSS modules)
- **Utils**: 100+ files (with subdirectories)
- **Hooks**: 50+ files
- **Themes/Styles**: 12 files
- **Context Providers**: 4 files
- **Modals**: 4 files

### Key Features Supported:
- 🔐 **Authentication & Security**: Multi-factor auth, session management, CSRF protection
- 📱 **Social Media**: Posts, stories, comments, likes, shares, hashtags
- 💬 **Messaging**: Real-time chat, group chats, voice/video calls
- 🎥 **Media**: Image/video upload, editing, compression, streaming
- 🔔 **Notifications**: Push notifications, real-time updates
- 🎨 **Theming**: Dark/light mode, accessibility features
- 📊 **Analytics**: Performance monitoring, AI tracking, user insights
- 🛡️ **Content Moderation**: Spam detection, profanity filtering, reporting
- 🌐 **Real-time**: WebRTC, live streaming, presence indicators
- 🔍 **Discovery**: Search, trending content, user suggestions
- ♿ **Accessibility**: Screen readers, keyboard navigation, high contrast
- 📱 **Mobile**: Touch interactions, orientation handling, offline support

This is a comprehensive social media application with enterprise-level features and robust architecture supporting all major social media functionalities with a focus on performance, security, and user experience.
