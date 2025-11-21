# Focus App Refactoring - QUICK START GUIDE

**For**: Developers refactoring Focus App modules  
**Duration**: 5 minutes to understand  
**Goal**: Maintain consistency and quality across all refactoring work

---

## 🎯 The Big Picture

We're modernizing 150+ files (components, hooks, utils) to be:
- **Professional** - Full JSDoc, PropTypes, clean code
- **Modular** - Reusable, single responsibility
- **Tested** - Error handling, edge cases covered
- **Accessible** - WCAG AA compliant
- **Maintainable** - Clear patterns and standards

---

## 📦 What We Have Ready

### Central Import System ✅
```javascript
// Use this in all new/refactored code:
import { components, hooks, utils } from '@/importMap';

// Instead of:
import Header from '../components/Header';
import { useMessages } from '../hooks/useMessages';
```

### Templates Ready ✅
- Component template → `/docs/REFACTORING_GUIDE.md`
- Hook template → `/docs/REFACTORING_GUIDE.md`
- Utils template → `/docs/REFACTORING_GUIDE.md`

### Examples Available ✅
- `src/components/Header.js` - Refactored component
- `src/components/PostCard.js` - Refactored component

---

## 🔧 How to Refactor a Component (15 minutes)

### File: `/src/components/BottomNav.js` (Example)

**Step 1: Copy Template (2 min)**
```javascript
/**
 * BottomNav Component
 * 
 * Navigation bar displayed at bottom of app with links to main pages.
 * Shows page indicators and manages navigation state.
 * 
 * @component
 * @example
 * <BottomNav user={currentUser} currentPage="home" />
 * 
 * @param {Object} user - Current user
 * @param {string} currentPage - Current active page
 * @returns {React.ReactElement} Navigation component
 */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './BottomNav.module.css';
import './BottomNav.css';

const BottomNav = React.memo(function BottomNav({ user, currentPage }) {
  // ... existing code ...
});

BottomNav.propTypes = {
  user: PropTypes.object.isRequired,
  currentPage: PropTypes.string
};

BottomNav.defaultProps = {
  currentPage: 'home'
};

BottomNav.displayName = 'BottomNav';

export default BottomNav;
```

**Step 2: Add JSDoc Comments (3 min)**
```javascript
/**
 * Description of what this component does
 * 
 * More detailed explanation including:
 * - When to use it
 * - Key features
 * - Any important behaviors
 * 
 * @component
 * @example
 * <ComponentName prop="value" onAction={handler} />
 * 
 * @param {type} prop - Description
 * @returns {React.ReactElement} What it renders
 */
```

**Step 3: Add PropTypes (2 min)**
```javascript
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  onAction: PropTypes.func
};

ComponentName.defaultProps = {
  prop2: 0
};
```

**Step 4: Apply React.memo (1 min)**
```javascript
// Change this:
export default function BottomNav() { ... }

// To this:
const BottomNav = React.memo(function BottomNav() { ... });
export default BottomNav;
```

**Step 5: Add CSS Module (2 min)**
```javascript
// Change CSS imports:
import './BottomNav.css';  // OLD

// To:
import styles from './BottomNav.module.css';
import './BottomNav.css';

// Then use:
<div className={styles.container}>  // CSS module for specific styles
```

**Step 6: Replace Inline Styles (3 min)**
```javascript
// Change:
<div style={{ display: 'flex', gap: '10px' }}>

// To:
<div className={styles.navContainer}>
```

**Step 7: Add Accessibility (2 min)**
```javascript
// Add ARIA labels:
<nav aria-label="Main navigation" role="navigation">
  <button aria-label="Go to home" aria-current={page === 'home' ? 'page' : false}>
    Home
  </button>
</nav>
```

**Step 8: Test (2 min)**
```bash
npm start  # Visual check
npm test   # Run tests
npm run build  # Check for warnings
```

---

## 📋 Refactoring Checklist

Before you commit, verify all these are complete:

### JSDoc ✅
- [ ] `/**` comment block at top
- [ ] `@component` tag
- [ ] `@param` for each prop
- [ ] `@returns` description
- [ ] `@example` with usage

### PropTypes ✅
- [ ] PropTypes imported
- [ ] All props defined in PropTypes
- [ ] `.isRequired` for required props
- [ ] defaultProps for optional props

### Component Structure ✅
- [ ] Wrapped with `React.memo()`
- [ ] Named export: `const Name = React.memo(function Name() ...)`
- [ ] `displayName` set
- [ ] Default export at end

### Styles ✅
- [ ] CSS module import: `import styles from './Name.module.css'`
- [ ] CSS class import: `import './Name.css'`
- [ ] No inline `style={{}}` props
- [ ] Use `className={styles.name}` for module classes

### Accessibility ✅
- [ ] `role` attribute where needed
- [ ] `aria-label` for buttons/icons
- [ ] `aria-describedby` for descriptions
- [ ] Keyboard navigation support (Tab, Enter, Esc)
- [ ] Proper heading hierarchy

### Code Quality ✅
- [ ] No `console.log` (except console.error/warn)
- [ ] Error handling for async operations
- [ ] useEffect cleanup for subscriptions
- [ ] useCallback for event handlers
- [ ] Proper ref management

---

## 🚀 Workflow: Step by Step

### 1. **Pick a Component**
```
Choose from: /src/components/
(Start with navigation: BottomNav, Navbar, etc.)
```

### 2. **Read Current Code**
```
Understand what it does, its props, and functionality
```

### 3. **Copy Template**
```
Use structure from REFACTORING_GUIDE.md
```

### 4. **Apply Changes**
```
Go through checklist above
```

### 5. **Test**
```bash
npm start    # Manual browser test
npm test     # Unit tests
npm run build # Check for warnings
```

### 6. **Commit**
```bash
git add src/components/ComponentName.js
git commit -m "refactor: modernize ComponentName with memo, proptypes, jsdoc"
```

### 7. **Repeat**
```
Move to next component
```

---

## 💡 Common Patterns

### Hook with Cleanup
```javascript
useEffect(() => {
  let isMounted = true;

  const subscription = supabase
    .channel('channel_name')
    .on('INSERT', (event) => {
      if (isMounted) {
        // Update state
      }
    })
    .subscribe();

  return () => {
    isMounted = false;
    subscription.unsubscribe();  // Important!
  };
}, [dependencies]);
```

### Optimistic Updates
```javascript
const handleLike = async () => {
  const previousState = liked;
  
  // Update UI immediately
  setLiked(!liked);

  try {
    // Call API
    await supabase.from('likes').insert(...);
  } catch (error) {
    // Rollback on error
    setLiked(previousState);
    console.error('Like failed:', error);
  }
};
```

### Memoized Component with Callbacks
```javascript
const MyComponent = React.memo(function MyComponent({ onAction, data }) {
  const handleClick = useCallback(() => {
    if (onAction) onAction(data);
  }, [onAction, data]);

  return <button onClick={handleClick}>Click</button>;
});
```

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `/docs/REFACTORING_GUIDE.md` | Complete standards & templates |
| `/src/importMap.js` | Central import hub |
| `/src/components/Header.js` | Example refactored component |
| `/src/components/PostCard.js` | Example refactored component |
| `IMPLEMENTATION_ROADMAP.md` | Detailed plan & timeline |

---

## 🐛 Troubleshooting

### Issue: "PropTypes is not defined"
**Solution:** Import it
```javascript
import PropTypes from 'prop-types';
```

### Issue: CSS module class not applied
**Solution:** Use correct syntax
```javascript
// Wrong:
<div className="container">

// Right:
<div className={styles.container}>
```

### Issue: React.memo shows error
**Solution:** Use correct syntax
```javascript
// Wrong:
const MyComp = React.memo(MyComp);
export default MyComp;

// Right:
const MyComp = React.memo(function MyComp() { ... });
export default MyComp;
```

### Issue: useEffect cleanup not working
**Solution:** Add return statement
```javascript
useEffect(() => {
  // Setup
  
  return () => {
    // Cleanup - THIS IS REQUIRED
  };
}, []);
```

---

## ✅ Quality Gates

Before marking a component as "done":

1. **Builds without warnings** → `npm run build`
2. **Tests pass** → `npm test`
3. **No console errors** → Check DevTools console
4. **Looks good visually** → `npm start` and check UI
5. **Accessible** → Tab through UI, read ARIA labels
6. **All checklist items** → See "Refactoring Checklist" above

---

## 📞 Getting Help

### Need Template?
→ Check `/docs/REFACTORING_GUIDE.md`

### Need Example?
→ Look at `Header.js` or `PostCard.js`

### Questions?
→ Review `REFACTORING_GUIDE.md` FAQ section (or ask!)

### Stuck on Accessibility?
→ Use keyboard: Tab, Enter, Escape, Arrow keys
→ Check DevTools: Console for accessibility warnings
→ Reference: `https://www.w3.org/WAI/WCAG21/quickref/`

---

## 🎓 Learning Resources

- **React Best Practices**: https://react.dev
- **PropTypes**: https://github.com/facebook/prop-types
- **JSDoc**: https://jsdoc.app
- **Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Modules**: https://github.com/css-modules/css-modules

---

## 🎯 Your Next Step

1. Open `/docs/REFACTORING_GUIDE.md`
2. Review the Component Template
3. Pick the first component: `BottomNav.js`
4. Copy the template
5. Apply the checklist
6. Test and commit!

---

**You've got this! 🚀**

Need help? Review the guides above or check existing refactored components.

