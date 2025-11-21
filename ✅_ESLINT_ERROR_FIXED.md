# ✅ ESLint Error Fixed - FlashStories References

## 🐛 Issue
```
ERROR in [eslint]
src\pages\Home.js
  Line 372:12:  'FlashStories' is not defined  react/jsx-no-undef
  Line 410:12:  'FlashStories' is not defined  react/jsx-no-undef
```

## 🔧 Problem
The old `FlashStories` component was still being referenced in two places in the render logic, even though we removed the component definition and are now importing the `Stories` component instead.

## ✅ Solution Applied

### Changed (Line ~372):
```javascript
// ❌ Before
<FlashStories onStoryClick={() => {}} />

// ✅ After
<Stories user={user} userProfile={{ avatar_url: user?.avatar_url, username: user?.username }} />
```

### Changed (Line ~410):
```javascript
// ❌ Before
<FlashStories onStoryClick={(story) => story === 'create' ? navigate('/create?type=flash') : null} />

// ✅ After
<Stories user={user} userProfile={{ avatar_url: user?.avatar_url, username: user?.username }} />
```

## 📝 What Changed

1. **Loading State Render** - Updated to use `Stories` component
2. **Empty State Render** - Updated to use `Stories` component
3. **Props Updated** - Now passing correct props (`user` and `userProfile`) instead of `onStoryClick`

## ✅ Verification

- [x] No ESLint errors
- [x] No undefined component references
- [x] All imports correctly aligned
- [x] Code compiles successfully

## 🎉 Status

**FIXED!** All `FlashStories` references have been replaced with the correct `Stories` component.

---

**Fix Applied:** November 21, 2025  
**Status:** ✅ COMPLETE  
**Errors:** 0
