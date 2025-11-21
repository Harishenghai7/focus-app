# COMPONENT INVENTORY - FOCUS APP

## Overview
- **Total Components:** 88 JS files in `/src/components/`
- **CSS Files:** 44 CSS files (some components use .css, others .module.css)
- **Test Directory:** `__tests__/` exists but needs verification

## Component Categories

### 🔐 Authentication & Security
- **TwoFactorAuth.js** - Two-factor authentication setup and verification
- **TwoFactorModal.js** - Modal for 2FA code input
- **TwoFactorSetup.js** - Initial 2FA setup flow
- **EmailVerification.js** - Email verification component
- **ChangePasswordModal.js** - Password change modal
- **SessionExpiredModal.js** - Session expiration warning
- **SessionManagement.js** - Active session management
- **CSRFProtectionProvider.js** - CSRF protection context provider

### 👤 User Management
- **Dashboard.js** - Main user dashboard
- **OnboardingFlow.js** - New user onboarding
- **AccessibilitySettings.js** - Accessibility preferences
- **DeleteAccountModal.js** - Account deletion confirmation
- **DataExportModal.js** - User data export
- **UserOptionsMenu.js** - User action menu
- **UserSearchResult.js** - User search result item
- **PeoplePicker.js** - User selection component
- **FollowButton.js** - Follow/unfollow functionality
- **VerifiedBadge.js** - Verified user indicator

### 📱 Navigation & Layout
- **Header.js** - Main app header
- **Navbar.js** - Navigation bar
- **BottomNav.js** - Bottom navigation for mobile
- **Stories.js** - Stories carousel
- **BottomNav.js** - Mobile bottom navigation

### 📝 Content Creation & Display
- **PostCard.js** - Main post display component
- **InteractionBar.js** - Like, comment, share actions
- **CommentsModal.js** - Comments display modal
- **InstagramCommentsModal.js** - Instagram-style comments
- **EditPostModal.js** - Post editing modal
- **CreateHighlightModal.js** - Story highlights creation
- **AddStoryModal.js** - Story creation modal
- **MediaSelector.js** - Media file selection
- **MediaEditor.js** - Media editing tools
- **MediaPreview.js** - Media preview before posting
- **MediaViewer.js** - Full-screen media viewer
- **CarouselViewer.js** - Multi-media carousel
- **AdvancedMediaEditor.js** - Advanced editing tools

### 💬 Communication
- **GroupChat.js** - Group chat interface
- **GroupChatList.js** - Group chat list
- **GroupSettings.js** - Group management
- **CreateGroupModal.js** - Group creation
- **IncomingCallModal.js** - Incoming call notification
- **ActiveCallModal.js** - Active call interface
- **CallControls.js** - Call control buttons
- **CallButton.js** - Call initiation button
- **VoiceRecorder.js** - Voice message recording
- **AudioPlayer.js** - Audio playback
- **TypingIndicator.js** - Typing status indicator

### 🔍 Discovery & Search
- **ExploreGrid.js** - Explore page grid
- **ExploreTabs.js** - Explore page tabs
- **ExploreTile.js** - Individual explore item
- **SearchBar.js** - Search input component
- **TrendingHashtags.js** - Trending hashtags display
- **SaveCollectionsModal.js** - Saved collections management

### 🔔 Notifications & Activity
- **RealtimeNotifications.js** - Real-time notifications
- **NotificationToast.js** - Toast notifications
- **ActivityStatus.js** - User activity status
- **PushNotificationPrompt.js** - Push notification permission
- **UpdateNotification.js** - App update notifications

### ⚙️ Settings & Configuration
- **Settings.js** (assumed - not in list but referenced)
- **CloseFriendsManager.js** - Close friends management
- **ScheduledPosts.js** - Scheduled posts management
- **SchedulePicker.js** - Date/time picker for scheduling

### 🎨 UI/UX Utilities
- **StateHandler.js** - Loading/error state management
- **SkeletonScreen.js** - Loading skeleton screens
- **ErrorBoundary.js** - Error boundary component
- **LazyImage.js** - Lazy loading images
- **OrientationHandler.js** - Device orientation handling
- **OfflineIndicator.js** - Offline status indicator
- **ScreenReaderAnnouncer.js** - Screen reader announcements
- **KeyboardShortcutsHelp.js** - Keyboard shortcuts help
- **RateLimitError.js** - Rate limit error display

### 🤖 AI Features
- **EnhancedAIDashboard.js** - AI insights dashboard
- **EnhancedAIButton.js** - AI action button
- **AIInsightsDashboard.js** - AI insights display
- **AITrackingButton.js** - AI tracking button
- **AITrackerProvider.js** - AI tracking context

### 🛠️ Utility Components
- **ParsedContent.js** - Content parsing and formatting
- **LinkifiedText.js** - Link detection and formatting
- **MentionInput.js** - @mention input handling
- **ReactionPicker.js** - Emoji reaction picker
- **ShareModal.js** - Content sharing modal
- **ReportModal.js** - Content reporting
- **ContentOptionsMenu.js** - Content action menu
- **DoubleTapLike.js** - Double-tap to like functionality
- **TestButton.js** - Testing utility button
- **AutoTestRunner.js** - Automated testing runner

## Component Status Assessment

### ✅ Well-Implemented Components
- PostCard.js - Comprehensive post display with interactions
- InteractionBar.js - Full interaction functionality
- ShareModal.js - Multiple sharing options
- InstagramCommentsModal.js - Advanced commenting system

### ⚠️ Components Needing Refactoring
- Many components have inline styles that should be moved to CSS modules
- Missing PropTypes in several components
- Inconsistent error handling
- Some components lack accessibility features
- Performance optimizations needed (memo, useCallback, etc.)

### 🔧 Components Needing Completion
- Some modal components may have incomplete functionality
- AI features may need integration
- Real-time features need verification
- Mobile responsiveness needs checking

## Dependencies Analysis

### External Libraries Used
- **React** - Core framework
- **Framer Motion** - Animations
- **Supabase** - Backend/database
- **React Router** - Navigation
- **PropTypes** - Type checking (in some components)

### Internal Dependencies
- **supabaseClient.js** - Database client
- **notificationService.js** - Notification utilities
- **accessibility.js** - Accessibility helpers
- Various CSS modules

## Recommendations

1. **Standardize CSS Approach** - Convert all inline styles to CSS modules
2. **Add PropTypes** - Ensure all components have proper prop validation
3. **Implement Error Boundaries** - Add error handling to critical components
4. **Accessibility Audit** - Add ARIA labels, keyboard navigation, screen reader support
5. **Performance Optimization** - Add React.memo, useMemo, useCallback where appropriate
6. **Testing** - Create unit tests for all components
7. **Documentation** - Add JSDoc comments to all components

## Next Steps

1. Complete detailed analysis of each component's props and functionality
2. Create component dependency graph
3. Identify shared logic for extraction to custom hooks
4. Plan refactoring priority based on usage frequency and complexity
