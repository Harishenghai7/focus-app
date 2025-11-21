# Focus App Complete Refactoring Master Plan

**Status**: In Progress  
**Started**: November 15, 2025  
**Target Completion**: Sequential batch processing

---

## Executive Summary

This document tracks the complete professional refactoring of the Fo## Infrastructure Setup ✅

### Created Files
- [x] `/src/importMap.js` - Central import map for all modules
- [x] `/src/components/index.js` - Component barrel exports
- [x] `/src/hooks/index.js` - Hook barrel exports
- [x] `/src/utils/index.js` - Utils barrel exports
- [x] `/scripts/batch-refactor.js` - Batch refactoring automation
- [x] `/scripts/refactor-automation.js` - Analysis and audit tool
- [x] `/docs/REFACTORING_GUIDE.md` - Complete refactoring guidelines
- [x] `REFACTORING-MASTER-PLAN.md` - This master plan document

### Refactoring Modules Completed ✅
- [x] **Header.js** - Full JSDoc, PropTypes, React.memo, CSS modules ready
- [x] **PostCard.js** - Complete refactoring with accessibility & error handling

## Progress Tracking

### Completed ✅
- [x] Project structure audit
- [x] File inventory (40+ components, 20+ hooks, 70+ utils)
- [x] Dependency mapping
- [x] Central import map creation
- [x] Barrel exports for all module categories
- [x] Automation scripts for batch processing
- [x] Comprehensive refactoring guide
- [x] Sample component refactoring (Header.js, PostCard.js)

### In Progress 🔄
- [x] Phase 1: Components refactoring (2/40+ completed, analyzing rest)
- [ ] Phase 2: Hooks refactoring (planning)
- [ ] Phase 3: Utils refactoring (planning)

### Pending 📋
- [ ] Phase 1: Complete remaining components (38+ files)
- [ ] Phase 2: Refactor all 20+ hooks
- [ ] Phase 3: Refactor all 70+ utils
- [ ] Phase 4: Integrate import map across pages
- [ ] Phase 5: Page-by-page integration (27+ pages)
- [ ] Phase 6: Theming & CSS tokens
- [ ] Phase 7: Documentation & test coverage:
- **40+ Components** in `/src/components/`
- **20+ Custom Hooks** in `/src/hooks/`
- **70+ Utilities** in `/src/utils/`
- **15+ Pages** in `/src/pages/`

All modules will be modernized, integrated through a centralized `importMap.js`, and properly implemented across all pages.

---

## PHASE 1: Components Refactoring

### Objectives
- [x] Audit all 40+ components
- [ ] Modernize with React.memo, PropTypes, CSS modules
- [ ] Add accessibility (ARIA, keyboard nav)
- [ ] Create components/index.js barrel export
- [ ] Fix inline styles → tokens/variables

### Components by Category

#### **Critical UI Components** (Priority 1)
- PostCard.js → Refactored
- Header.js
- BottomNav.js
- Navbar.js
- InteractionBar.js
- FollowButton.js

#### **Modal Components** (Priority 2)
- CommentsModal.js
- ShareModal.js
- ChangePasswordModal.js
- DeleteAccountModal.js
- SessionExpiredModal.js
- CreateGroupModal.js
- CreateHighlightModal.js
- SaveCollectionsModal.js
- ReportModal.js
- TwoFactorModal.js
- TwoFactorSetup.js

#### **Media & Viewer Components** (Priority 3)
- CarouselViewer.js
- MediaViewer.js
- MediaEditor.js
- AdvancedMediaEditor.js
- LazyImage.js
- AudioPlayer.js
- MediaPreview.js
- MediaSelector.js
- VoiceRecorder.js

#### **Feature Components** (Priority 4)
- Stories.js
- CommentSection.js
- ExploreGrid.js
- ExploreTabs.js
- SearchBar.js
- TrendingHashtags.js
- FollowButton.js
- VerifiedBadge.js

#### **System & Utility Components** (Priority 5)
- ErrorBoundary.js
- RealtimeErrorBoundary.js
- SkeletonScreen.js
- NotificationToast.js
- OfflineIndicator.js
- ScreenReaderAnnouncer.js
- StateHandler.js
- UpdateNotification.js
- RateLimitError.js

---

## PHASE 2: Hooks Refactoring

### Custom Hooks to Refactor
- [x] useRealtimeInteractions.js → Audit complete
- [ ] useMessages.js
- [ ] useNotifications.js
- [ ] useDebounce.js
- [ ] useCall.js
- [ ] useWebRTCCall.js
- [ ] usePeerConnection.js
- [ ] useKeyboardNavigation.js
- [ ] useLazyLoad.js
- [ ] useLoadingState.js
- [ ] useOptimisticAction.js
- [ ] useOrientation.js
- [ ] useRateLimit.js
- [ ] useRealtimeConnection.js
- [ ] useScrollRestoration.js
- [ ] useSignedUrl.js
- [ ] useStateSync.js
- [ ] useCSRFProtection.js
- [ ] useInstagramInteractions.js
- [ ] useInstagramLikeInteractions.js
- [ ] useInstagramSave.js
- [ ] useAITracking.js

---

## PHASE 3: Utils Refactoring

### Utils by Category (70+ files)

#### **API & HTTP** (12 files)
- apiClient.js
- apiErrorHandler.js
- callSignaling.js
- fetchOrCreateUser.js
- insertUser.js
- createUserProfile.js
- signedUrlManager.js
- uploadFile.js
- webrtcService.js
- notificationService.js
- pushNotifications.js
- rateLimitManager.js

#### **Validation & Security** (8 files)
- validation.js
- inputSanitizer.js
- csrfProtection.js
- authSecurityManager.js
- deviceFingerprint.js
- securityLogger.js
- twoFactorAuth.js
- rlsPolicyTester.js

#### **Data & State Management** (10 files)
- feedCache.js
- queryCache.js
- cacheManager.js
- stateDeduplicator.js
- subscriptionManager.js
- sessionManager.js
- offlineManager.js
- draftManager.js
- versionManager.js
- NotificationManager.js

#### **Utilities & Helpers** (15 files)
- dateFormatter.js
- imageUtils.js
- imageCompression.js
- videoUtils.js
- contentParser.js
- linkifiedText.js
- altTextGenerator.js
- lazyLoad.js
- haptics.js
- browserCompatibility.js
- colorContrast.js
- accessibility.js
- i18n.js
- logger.js
- errorHandler.js

#### **Analytics & Tracking** (8 files)
- analytics.js
- aiTracker.js
- aiTrackerIntegration.js
- enhancedAITracker.js
- errorTracking.js
- errorLogger.js
- reportWebVitals.js
- autoErrorFixer.js

#### **Features & Services** (8 files)
- searchService.js
- trendingService.js
- realtimeManager.js
- serviceWorkerManager.js
- scheduledPostsPublisher.js
- notificationPreferences.js
- callNotifications.js
- rateLimiter.js

#### **Auth & Other** (5+ files)
- authListener.js
- logout.js
- autoTester.js
- browserCompatibility.js

---

## PHASE 4: Import Map

### Structure
```javascript
// /src/importMap.js
export const components = { /* all components */ };
export const hooks = { /* all hooks */ };
export const utils = { /* all utilities */ };
```

---

## PHASE 5: Page Integration

### Pages to Update
- Home.js
- Explore.js
- Boltz.js
- Messages.js
- Profile.js
- Settings.js
- Create.js
- CreateMultiType.js
- Comments.js
- Likes.js
- Highlights.js
- HighlightViewer.js
- Flash.js
- Calls.js
- Analytics.js
- Archive.js
- BlockedUsers.js
- BoltzDetail.js
- CloseFriends.js
- FollowRequests.js
- GroupChat.js
- HashtagPage.js
- Notifications.js
- PostDetail.js
- Saved.js
- Auth.js
- AuthCallback.js

---

## PHASE 6: Theming & Tokens

- Create/update `/src/styles/tokens.css`
- Implement design tokens (colors, spacing, typography)
- Dark/light mode support
- High contrast mode

---

## PHASE 7: Documentation & Testing

- [ ] Create `/docs/FocusAppModuleReference.md`
- [ ] Update README.md with module descriptions
- [ ] Generate component usage guide
- [ ] Add JSDoc examples

---

## Progress Tracking

### Completed
- [x] Project structure audit
- [x] File inventory
- [ ] Dependency mapping

### In Progress
- [ ] Phase 1: Components refactoring
- [ ] Phase 2: Hooks refactoring
- [ ] Phase 3: Utils refactoring

### Pending
- [ ] Phase 4: Import Map creation
- [ ] Phase 5: Page integration
- [ ] Phase 6: Theming & CSS
- [ ] Phase 7: Documentation

---

## Notes

- All refactoring will maintain backward compatibility
- Error handling will be comprehensive
- Accessibility will be a first-class concern
- Performance optimization through memoization and code splitting
- Full test coverage for critical paths

