# Focus App Module Reference

## Components

- BottomNav
- Navbar
- ErrorBoundary
- RealtimeErrorBoundary
- ScreenReaderAnnouncer
- Header
- PostCard
- InteractionBar
- CommentSection
- Stories
- CarouselViewer
- DoubleTapLike
- MediaPreview
- MediaViewer
- MediaEditor
- AdvancedMediaEditor
- MediaSelector
- LazyImage
- AudioPlayer
- VoiceRecorder
- CommentsModal
- InstagramCommentsModal
- ShareModal
- ChangePasswordModal
- DeleteAccountModal
- SessionExpiredModal
- CreateGroupModal
- CreateHighlightModal
- SaveCollectionsModal
- ReportModal
- TwoFactorModal
- TwoFactorSetup
- DataExportModal
- ViewersModal
- FollowButton
- VerifiedBadge
- UserSearchResult
- AvatarUpload
- UserOptionsMenu
- SearchBar
- ExploreGrid
- ExploreTabs
- GroupChat
- GroupChatList
- GroupSettings
- CloseFriendsManager
- TypingIndicator
- ReactionPicker
- LinkifiedText
- ParsedContent
- CallButton
- CallControls
- CallIcon
- ActiveCallModal
- IncomingCallModal
- IncomingCallListener
- NotificationToast
- OfflineIndicator
- AIInsightsDashboard
- AITrackerProvider
- AddStoryModal
- ActivityStatus
- AccessibilitySettings
- AutoTestRunner

*Usage Example:*
```jsx
import { components } from '@/importMap';
const { PostCard } = components;
<PostCard ...props />
```

## Hooks

- useRealtimeInteractions
- useMessages
- useNotifications
- useDebounce
- useCall
- useWebRTCCall
- usePeerConnection
- useKeyboardNavigation
- useLazyLoad
- useLoadingState
- useOptimisticAction
- useOrientation
- useRateLimit
- useRealtimeConnection
- useScrollRestoration
- useSignedUrl
- useStateSync
- useCSRFProtection
- useInstagramInteractions
- useInstagramLikeInteractions
- useInstagramSave
- useAITracking

*Usage Example:*
```js
import { hooks } from '@/importMap';
const { useRealtimeInteractions } = hooks;
const { value, loading } = useRealtimeInteractions(...args);
```

## Utils

- validation
- inputSanitizer
- csrfProtection
- authSecurityManager
- deviceFingerprint
- securityLogger
- twoFactorAuth
- rlsPolicyTester
- apiClient
- apiErrorHandler
- callSignaling
- fetchOrCreateUser
- insertUser
- createUserProfile
- signedUrlManager
- uploadFile
- webrtcService
- notificationService
- pushNotifications
- rateLimitManager
- feedCache
- queryCache
- cacheManager
- stateDeduplicator
- subscriptionManager
- sessionManager
- offlineManager
- draftManager
- versionManager
- NotificationManager
- dateFormatter
- imageUtils
- imageCompression
- videoUtils
- contentParser
- linkifiedText
- altTextGenerator
- lazyLoad
- haptics
- browserCompatibility
- colorContrast
- accessibility
- i18n
- logger
- errorHandler
- analytics
- aiTracker
- aiTrackerIntegration
- enhancedAITracker
- errorTracking
- errorLogger
- reportWebVitals
- autoErrorFixer

*Usage Example:*
```js
import { utils } from '@/importMap';
const { analytics } = utils;
analytics('event');
```

---

For full prop, method, and usage details, see each module's JSDoc in source files.
