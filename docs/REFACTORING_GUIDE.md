# Focus App Refactoring Complete Guide

**Started**: November 15, 2025  
**Status**: In Progress - Phase 1-2  
**Target**: 100% Module Coverage

---

## Quick Start

```bash
# Run comprehensive audit
node scripts/refactor-automation.js

# Start refactoring process
npm run refactor:start

# Build and test after refactoring
npm run build
npm run test
```

---

## What We're Doing

### Phase 1: Component Refactoring ✅

**Objectives:**
- ✅ Wrap with `React.memo()` for performance
- ✅ Add `PropTypes` validation
- ✅ Add complete JSDoc documentation
- ✅ Move styles to CSS modules
- ✅ Remove inline styles
- ✅ Add accessibility features (ARIA, keyboard nav)
- ✅ Add error boundaries
- ✅ Create export default with display name

**Component Template:**

```javascript
/**
 * Component Name Description
 * 
 * Detailed description of what this component does,
 * when to use it, and any important behaviors.
 * 
 * @component
 * @example
 * <ComponentName prop1="value" prop2={data} />
 * 
 * @param {type} prop1 - Description
 * @param {type} prop2 - Description
 * @returns {React.ReactElement} Component
 */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './ComponentName.module.css';
import './ComponentName.css';

const ComponentName = React.memo(function ComponentName({ prop1, prop2 }) {
  // Implementation

  return (
    <div className={styles.container} role="region" aria-label="Descriptive label">
      {/* Content */}
    </div>
  );
});

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.object.isRequired
};

ComponentName.defaultProps = {
  prop2: {}
};

ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

**Key Checklist for Each Component:**
- [ ] JSDoc comment block with @param, @returns, @example
- [ ] Wrapped with React.memo()
- [ ] PropTypes defined
- [ ] defaultProps defined
- [ ] displayName set
- [ ] CSS module import (`ComponentName.module.css`)
- [ ] No inline styles (all in CSS)
- [ ] Accessibility: role, aria-label, aria-describedby
- [ ] Keyboard navigation support
- [ ] Error handling for async operations
- [ ] Proper cleanup in useEffect
- [ ] Export as named export first, default last

---

### Phase 2: Hooks Refactoring 🔄

**Objectives:**
- ✅ Complete JSDoc with usage examples
- ✅ Proper useEffect cleanup
- ✅ Error handling & loading states
- ✅ Remove redundant hooks
- ✅ Proper dependency arrays
- ✅ Documented return values

**Hook Template:**

```javascript
/**
 * useCustomHook Hook
 * 
 * Manages custom functionality with full description
 * of what the hook does, when to use it, and what it returns.
 * 
 * @hook
 * @param {type} param1 - Description
 * @param {type} param2 - Description
 * @returns {Object} Hook return value object
 * @returns {*} returns.value1 - Description
 * @returns {Function} returns.setValue1 - Setter function
 * @returns {boolean} returns.loading - Loading state
 * @returns {Error} returns.error - Error state
 * 
 * @example
 * const { value1, setValue1, loading, error } = useCustomHook(param1, param2);
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useCustomHook(param1, param2) {
  const [value1, setValue1] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Implementation
        if (isMountedRef.current) {
          setValue1(result);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
          setValue1(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    if (param1 && param2) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
      // Cleanup subscriptions, timers, etc.
    };
  }, [param1, param2]);

  return { value1, setValue1, loading, error };
}
```

**Key Checklist for Each Hook:**
- [ ] Complete JSDoc with @hook, @param, @returns, @example
- [ ] Proper isMountedRef to prevent memory leaks
- [ ] useEffect with proper cleanup function
- [ ] Error handling with try/catch
- [ ] Loading state
- [ ] Correct dependency array
- [ ] No console.log in production
- [ ] Subscription cleanup
- [ ] Timer/listener cleanup

---

### Phase 3: Utils Refactoring 📚

**Objectives:**
- ✅ Complete JSDoc for every function
- ✅ Group by category
- ✅ Error handling
- ✅ Remove dead code
- ✅ Named exports consistently
- ✅ Move magic numbers to constants

**Util Template:**

```javascript
/**
 * Utility Module: Category
 * 
 * Functions for [specific purpose], including [key features].
 * All functions handle error cases gracefully and return consistent types.
 * 
 * @module utils/moduleName
 */

/**
 * Function Name
 * 
 * Detailed description of what the function does,
 * including any side effects and error cases.
 * 
 * @param {type} param1 - Description
 * @param {type} [param2=default] - Optional description
 * @returns {type} Return value description
 * @throws {Error} When [specific condition]
 * 
 * @example
 * const result = functionName(param1, param2);
 * console.log(result); // Expected output
 */
export function functionName(param1, param2 = defaultValue) {
  // Validate inputs
  if (!param1 || typeof param1 !== 'string') {
    throw new Error('param1 must be a non-empty string');
  }

  try {
    // Implementation
    return result;
  } catch (error) {
    console.error('Error in functionName:', error);
    throw new Error(`functionName failed: ${error.message}`);
  }
}

// Named exports
export const constants = {
  MAX_LENGTH: 255,
  DEFAULT_TIMEOUT: 5000
};
```

**Key Checklist for Each Util:**
- [ ] Module-level JSDoc with @module
- [ ] Function-level JSDoc with @param, @returns, @throws, @example
- [ ] Input validation
- [ ] Error handling with try/catch
- [ ] Descriptive error messages
- [ ] Constants defined (no magic numbers)
- [ ] Named exports (not default)
- [ ] Proper error propagation
- [ ] Performance optimizations where needed
- [ ] No side effects for pure functions

---

### Phase 4: Import Map ✅

**File**: `/src/importMap.js`

Centralized imports for all modules. Use this for new files:

```javascript
import { components, hooks, utils } from '@/importMap';

const { PostCard, Header } = components;
const { useRealtimeInteractions } = hooks;
const { validation, analytics } = utils;
```

**Benefits:**
- Single source of truth
- Easier to refactor modules
- Clear module dependencies
- Simplified imports in pages/features

---

### Phase 5: Page Integration 📄

**Pattern for Each Page:**

```javascript
/**
 * Page Name - Descriptive title
 * 
 * Full page description with features and use cases.
 * 
 * @page
 * @returns {React.ReactElement} Complete page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Import from centralized map
import { components, hooks, utils } from '@/importMap';

const { PostCard, Header, BottomNav } = components;
const { useRealtimeInteractions, useMessages } = hooks;
const { analytics, validation } = utils;

export default function PageName({ user, userProfile }) {
  // Hook usage
  const { data, loading, error } = useRealtimeInteractions(contentId, 'post', user);
  
  // State
  const [posts, setPosts] = useState([]);
  
  // Effects
  useEffect(() => {
    // Initialize
  }, []);
  
  // Event handlers
  const handleDelete = useCallback(async (postId) => {
    try {
      // Implementation
      analytics.trackEvent('post_deleted');
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);
  
  return (
    <div className="page-container">
      <Header />
      {/* Content */}
      <BottomNav />
    </div>
  );
}
```

**Pages to Update:**
- Home.js
- Explore.js
- Boltz.js
- Messages.js
- Profile.js
- Settings.js
- Create.js
- Notifications.js
- And 20+ more...

---

### Phase 6: Design Tokens & Theming 🎨

**File**: `/src/styles/tokens.css`

```css
/* Color Tokens */
:root {
  --color-primary: #007AFF;
  --color-secondary: #5AC8FA;
  --color-error: #FF3B30;
  --color-success: #34C759;
  --color-warning: #FF9500;
  
  --color-bg-light: #FFFFFF;
  --color-bg-dark: #000000;
  --color-text-light: #000000;
  --color-text-dark: #FFFFFF;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--color-bg-dark);
    --color-text: var(--color-text-dark);
  }
}

/* High contrast support */
@media (prefers-contrast: more) {
  :root {
    --color-text: #000000;
    --color-bg: #FFFFFF;
  }
}
```

---

### Phase 7: Documentation 📖

**Files to Create:**

1. **Module Reference** (`/docs/FocusAppModuleReference.md`)
   - All components with usage examples
   - All hooks with return values
   - All utilities with descriptions

2. **Architecture Guide** (`/docs/ARCHITECTURE.md`)
   - Module organization
   - Data flow
   - State management patterns

3. **Contribution Guidelines** (`/docs/CONTRIBUTING.md`)
   - How to add new modules
   - Code standards
   - Testing requirements

---

## Execution Plan

### Week 1: Core Refactoring
- Day 1-2: Component refactoring (batch 1: Headers, Nav, Buttons)
- Day 3-4: Component refactoring (batch 2: Modals, Media)
- Day 5: Hooks refactoring (batch 1: realtime, messages)

### Week 2: Continued Refactoring
- Day 1-3: Utils refactoring (batch 1-2: validation, api, state)
- Day 4-5: Import map integration and page updates (batch 1)

### Week 3: Integration & Polish
- Day 1-2: Page integration (batch 2-3)
- Day 3-4: Design tokens and theming
- Day 5: Documentation and testing

---

## Progress Tracking

### Completed ✅
- [x] Import map created
- [x] Component barrel export
- [x] Hooks barrel export
- [x] Utils barrel export
- [x] Refactoring automation script

### In Progress 🔄
- [ ] Component refactoring (Phase 1)
- [ ] Hooks refactoring (Phase 2)
- [ ] Utils refactoring (Phase 3)

### Pending 📋
- [ ] Page integration (Phase 5)
- [ ] Design tokens (Phase 6)
- [ ] Documentation (Phase 7)
- [ ] Full test coverage

---

## Quality Metrics

### Before Refactoring
- Components with PropTypes: ~30%
- Components with JSDoc: ~20%
- Hooks with proper cleanup: ~60%
- Utils with error handling: ~70%
- Overall code duplication: HIGH

### Target After Refactoring
- Components with PropTypes: 100%
- Components with JSDoc: 100%
- Hooks with proper cleanup: 100%
- Utils with error handling: 100%
- Overall code duplication: <5%

---

## Resources

- [React Best Practices](https://react.dev)
- [PropTypes Documentation](https://github.com/facebook/prop-types)
- [JSDoc Guide](https://jsdoc.app)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Support

For questions or issues during refactoring:
1. Check existing component patterns
2. Review component/hook templates above
3. Consult the import map for module structure
4. Verify type definitions with PropTypes

---

**Last Updated**: November 15, 2025  
**Next Steps**: Start Component Refactoring Phase

