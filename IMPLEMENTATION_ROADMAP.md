# Focus App Refactoring - IMPLEMENTATION ROADMAP

**Status**: Phase 1 Infrastructure Complete ✅  
**Date**: November 15, 2025  
**Next Steps**: Begin Component Refactoring Batches

---

## 📋 What Has Been Accomplished

### Infrastructure ✅
- **Central Import Map** (`/src/importMap.js`)
  - Single source of truth for all module imports
  - Exports 80+ components, 22+ hooks, 60+ utilities
  - Enables easy refactoring and tree-shaking

- **Barrel Exports**
  - `/src/components/index.js` → All 80+ components
  - `/src/hooks/index.js` → All 22+ hooks
  - `/src/utils/index.js` → All 60+ utilities

- **Automation Tools**
  - `/scripts/refactor-automation.js` - Comprehensive audit tool
  - `/scripts/batch-refactor.js` - Batch processing automation
  - Generated audit reports: `REFACTORING_AUDIT.json`

- **Documentation**
  - `/docs/REFACTORING_GUIDE.md` - Complete standards & templates
  - `REFACTORING-MASTER-PLAN.md` - Strategic plan
  - **THIS FILE** - Implementation roadmap

### Sample Refactoring Completed ✅
- **Header.js**
  - ✅ Complete JSDoc with @component, @param, @returns
  - ✅ Wrapped with React.memo()
  - ✅ PropTypes validation added
  - ✅ CSS module support (Header.module.css)
  - ✅ Full accessibility (ARIA labels, keyboard nav)
  - ✅ Proper useEffect cleanup with refs
  - ✅ Error handling for async operations
  - ✅ Real-time subscription management
  - ✅ Callbacks optimized with useCallback

- **PostCard.js**
  - ✅ Complete JSDoc documentation
  - ✅ React.memo wrapping
  - ✅ PropTypes with all prop definitions
  - ✅ CSS module ready (PostCard.module.css)
  - ✅ Comprehensive accessibility support
  - ✅ Optimistic UI updates with error rollback
  - ✅ Proper error boundaries

---

## 🎯 Next Steps: Immediate Actions

### Week 1: Core Component Refactoring

#### **Batch 1: Navigation & Layout Components** (5 files - 2 hours)
Priority: **CRITICAL** - These are used on every page

```
- BottomNav.js
- Navbar.js
- ErrorBoundary.js
- RealtimeErrorBoundary.js
- ScreenReaderAnnouncer.js
```

**Command to analyze:**
```bash
node scripts/batch-refactor.js --phase 1 --limit 5
```

**What to do for each:**
1. Follow template in `/docs/REFACTORING_GUIDE.md`
2. Apply React.memo + PropTypes + JSDoc
3. Move to CSS modules
4. Add accessibility (ARIA, roles, keyboard nav)
5. Test in browser
6. Commit individually

#### **Batch 2: Post & Feed Components** (6 files - 3 hours)
```
- InteractionBar.js
- CommentSection.js
- Stories.js
- CarouselViewer.js
- DoubleTapLike.js
- MediaPreview.js
```

#### **Batch 3: Media Components** (8 files - 4 hours)
```
- MediaViewer.js
- MediaEditor.js
- AdvancedMediaEditor.js
- MediaSelector.js
- LazyImage.js
- AudioPlayer.js
- VoiceRecorder.js
```

### Week 2: Modal & Specialty Components

#### **Batch 4: Modal Components** (8 files - 4 hours)
```
- CommentsModal.js
- InstagramCommentsModal.js
- ShareModal.js
- ChangePasswordModal.js
- DeleteAccountModal.js
- SessionExpiredModal.js
- CreateGroupModal.js
- CreateHighlightModal.js
```

#### **Batch 5: More Modals & Utilities** (7 files - 3 hours)
```
- SaveCollectionsModal.js
- ReportModal.js
- TwoFactorModal.js
- TwoFactorSetup.js
- DataExportModal.js
- ViewersModal.js
```

#### **Batch 6: User & Discovery** (8 files - 4 hours)
```
- FollowButton.js
- VerifiedBadge.js
- UserSearchResult.js
- AvatarUpload.js
- UserOptionsMenu.js
- SearchBar.js
- ExploreGrid.js
- ExploreTabs.js
```

### Week 3: Communication & Specialty Components + Hooks

#### **Batch 7: Communication** (8 files - 4 hours)
```
- GroupChat.js
- GroupChatList.js
- GroupSettings.js
- CloseFriendsManager.js
- TypingIndicator.js
- ReactionPicker.js
- LinkifiedText.js
- ParsedContent.js
```

#### **Batch 8: Calls & Remaining** (8 files - 4 hours)
```
- CallButton.js
- CallControls.js
- CallIcon.js
- ActiveCallModal.js
- IncomingCallModal.js
- IncomingCallListener.js
- NotificationToast.js
- OfflineIndicator.js
```

#### **Batch 9-10: Final Components + Hooks Start** (12 files - 6 hours)
- Remaining components (6 files)
- Start hooks refactoring (6 files)

---

## 📝 Detailed Execution Instructions

### For Each Component File:

**Step 1: Analyze**
```bash
# Review current state
node scripts/batch-refactor.js --phase 1 --dry-run
```

**Step 2: Refactor** (Use template from guide)
```javascript
/**
 * ComponentName - Description
 * @component
 * @example
 * <ComponentName prop="value" />
 * @param {type} prop - Description
 * @returns {React.ReactElement}
 */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './ComponentName.module.css';

const ComponentName = React.memo(function ComponentName({ prop }) {
  // Implementation
  return <div className={styles.container}>{/* JSX */}</div>;
});

ComponentName.propTypes = { prop: PropTypes.string };
ComponentName.displayName = 'ComponentName';
export default ComponentName;
```

**Step 3: Test**
```bash
npm run test:components  # If available
npm run test           # General test
npm start             # Manual browser test
```

**Step 4: Commit**
```bash
git add src/components/ComponentName.js
git commit -m "refactor: modernize ComponentName with memo, proptypes, jsdoc"
```

---

## 🔄 Hooks Refactoring Plan

### Template for Each Hook:
```javascript
/**
 * useCustomHook Hook
 * @hook
 * @param {type} param - Description
 * @returns {Object} { value, setValue, loading, error }
 * @example
 * const { value, loading } = useCustomHook(param);
 */
export function useCustomHook(param) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    // Implementation with proper cleanup
    return () => { isMountedRef.current = false; };
  }, [param]);

  return { value, setValue, loading, error };
}
```

### Hooks to Refactor (22 total):
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

---

## 🛠️ Utils Refactoring Plan

### Utilities by Category (60+ total)

**Validation & Security (8)** - HIGH PRIORITY
- validation.js
- inputSanitizer.js
- csrfProtection.js
- authSecurityManager.js
- deviceFingerprint.js
- securityLogger.js
- twoFactorAuth.js
- rlsPolicyTester.js

**API & HTTP (12)** - HIGH PRIORITY
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

**Data & State (10)** - MEDIUM PRIORITY
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

**Utilities & Helpers (15)** - MEDIUM PRIORITY
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

**Analytics & Tracking (8)** - LOW PRIORITY
- analytics.js
- aiTracker.js
- aiTrackerIntegration.js
- enhancedAITracker.js
- errorTracking.js
- errorLogger.js
- reportWebVitals.js
- autoErrorFixer.js

---

## 🖥️ Page Integration Strategy

### Pages to Update (27 total):
1. Home.js - Feed display
2. Explore.js - Discovery
3. Boltz.js - Boltz posts
4. Messages.js - Direct messaging
5. Profile.js - User profile
6. Settings.js - App settings
7. Create.js - Post creation
8. And 20+ more...

### Integration Pattern:
```javascript
// OLD WAY:
import PostCard from '../components/PostCard';
import { useRealtimeInteractions } from '../hooks/useRealtimeInteractions';
import { analytics } from '../utils/analytics';

// NEW WAY:
import { components, hooks, utils } from '@/importMap';
const { PostCard } = components;
const { useRealtimeInteractions } = hooks;
const { analytics } = utils;
```

---

## 🎨 Theming & Design Tokens (Phase 6)

### CSS Tokens File: `/src/styles/tokens.css`
```css
:root {
  --color-primary: #007AFF;
  --color-error: #FF3B30;
  --spacing-md: 16px;
  --font-size-lg: 18px;
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Requirements:
- [ ] Dark mode support
- [ ] High contrast mode
- [ ] Reduced motion support
- [ ] All hardcoded colors → tokens
- [ ] All magic numbers → tokens

---

## 📚 Documentation & Testing (Phase 7)

### Files to Create:
1. `/docs/FocusAppModuleReference.md`
   - All 80+ components with examples
   - All 22+ hooks with usage
   - All 60+ utilities with descriptions

2. `/docs/ARCHITECTURE.md`
   - Module organization
   - Data flow diagrams
   - State management patterns

3. Update `/README.md`
   - New module structure
   - Import patterns
   - Contributing guidelines

---

## ✅ Quality Checklist

Before committing each component:
- [ ] JSDoc complete with @component, @param, @returns
- [ ] PropTypes defined for all props
- [ ] Wrapped with React.memo()
- [ ] CSS module imported and used
- [ ] No inline styles
- [ ] Accessibility: role, aria-label, keyboard nav
- [ ] Error handling for async ops
- [ ] useEffect has cleanup function
- [ ] Proper ref management with useCallback
- [ ] No console.log statements (except errors)
- [ ] Tests pass: `npm test`
- [ ] No build warnings: `npm run build`

---

## 📊 Success Metrics

### Target Goals:
- **Components**: 100% with JSDoc, PropTypes, React.memo
- **Hooks**: 100% with cleanup, error handling, loading states
- **Utils**: 100% with JSDoc, error handling, named exports
- **Pages**: 100% using importMap for imports
- **Code Duplication**: <5%
- **Accessibility**: WCAG AA compliant
- **Test Coverage**: >80%

---

## 🚀 Commands Reference

### Analysis & Automation
```bash
# Analyze current state
node scripts/batch-refactor.js --phase 1 --dry-run

# Generate audit report
node scripts/refactor-automation.js

# Apply batch refactoring (Phase 1)
node scripts/batch-refactor.js --phase 1 --limit 5
```

### Testing & Building
```bash
# Run tests
npm test
npm run test:e2e

# Build and check
npm run build
npm run lint
npm run lint:fix

# Validate imports
npm run validate:imports
```

### Git Workflow
```bash
# Create feature branch
git checkout -b refactor/components-batch-1

# Make changes, commit individually:
git add src/components/ComponentName.js
git commit -m "refactor: modernize ComponentName"

# Push and create PR
git push origin refactor/components-batch-1
```

---

## 📈 Timeline Estimate

| Phase | Duration | Files | Status |
|-------|----------|-------|--------|
| **Infrastructure** | ✅ Done | - | Complete |
| **Phase 1: Components** | 2-3 weeks | 40+ | In Progress |
| **Phase 2: Hooks** | 1 week | 22+ | Pending |
| **Phase 3: Utils** | 1-2 weeks | 60+ | Pending |
| **Phase 4: Import Map** | 3 days | - | Ready |
| **Phase 5: Page Integration** | 2 weeks | 27+ | Pending |
| **Phase 6: Theming** | 1 week | CSS | Pending |
| **Phase 7: Documentation** | 1 week | Docs | Pending |
| **TOTAL** | **8-9 weeks** | **150+** | **In Progress** |

---

## 🎯 Current Focus

### **This Week's Goal:**
✅ Complete Batch 1: Navigation Components (5 files)

### **Action Items - START NOW:**
1. ✅ Review `/docs/REFACTORING_GUIDE.md` - Component template
2. ✅ Start with `BottomNav.js` - Apply refactoring template
3. ✅ Test in browser
4. ✅ Create PR
5. ✅ Move to next component

### **Get Help:**
- Reference `/docs/REFACTORING_GUIDE.md` for templates
- Check `Header.js` and `PostCard.js` for examples
- Review component checklist above

---

## 📞 Support Resources

- **Refactoring Guide**: `/docs/REFACTORING_GUIDE.md`
- **Master Plan**: `REFACTORING-MASTER-PLAN.md`
- **Import Map**: `/src/importMap.js`
- **Barrel Exports**: `/src/components/index.js`, `/src/hooks/index.js`, `/src/utils/index.js`

---

**Status**: Ready for Phase 1 Component Refactoring  
**Last Updated**: November 15, 2025  
**Next Review**: After Batch 1 Completion

