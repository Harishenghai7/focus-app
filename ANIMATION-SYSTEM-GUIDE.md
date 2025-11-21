# Animation System Guide

## Overview

The Focus App uses a comprehensive animation system with reusable CSS animations and a custom React hook for easy animation triggering.

## Files

- **`/src/styles/animations.css`** - All animation keyframes and utility classes
- **`/src/hooks/useAnimation.js`** - React hook for triggering animations programmatically

---

## CSS Animations Available

### 1. Fade Animations
- **`fadeIn`** - Fade in (0.3s)
- **`fadeOut`** - Fade out (0.3s)

**Usage:**
```html
<div class="animate-fadeIn">Content appears</div>
<div class="animate-fadeOut">Content disappears</div>
```

### 2. Slide Animations
- **`slideUp`** - Slide up with fade (0.4s)
- **`slideDown`** - Slide down with fade (0.4s)
- **`slideLeft`** - Slide left with fade (0.4s)
- **`slideRight`** - Slide right with fade (0.4s)

**Usage:**
```html
<div class="animate-slideUp">Slides up</div>
<div class="animate-slideDown">Slides down</div>
<div class="animate-slideLeft">Slides left</div>
<div class="animate-slideRight">Slides right</div>
```

### 3. Scale Animations
- **`scaleIn`** - Scale from 0.8 to 1 (0.3s)
- **`scaleOut`** - Scale from 1 to 0.8 (0.3s)

**Usage:**
```html
<div class="animate-scaleIn">Grows in</div>
<div class="animate-scaleOut">Shrinks out</div>
```

### 4. Heart Beat Animation (for Likes)
- **`heartBeat`** - Pulsing scale effect (0.6s)

**Usage:**
```html
<button class="animate-heartBeat">❤️ Like</button>
```

### 5. Shake Animation (for Errors)
- **`shake`** - Horizontal shake effect (0.5s)

**Usage:**
```html
<div class="animate-shake">Error message</div>
<input class="animate-shake" />
```

### 6. Shimmer Animation (for Loading)
- **`shimmer`** - Loading skeleton effect (2s, infinite)

**Usage:**
```html
<div class="animate-shimmer" style="width: 200px; height: 20px;"></div>
```

### 7. Bounce Animation
- **`bounce`** - Bouncing effect (0.6s)

**Usage:**
```html
<div class="animate-bounce">Bouncing element</div>
```

### 8. Rotate Animation
- **`rotate`** - 360° rotation (1s, infinite)

**Usage:**
```html
<div class="animate-rotate">⏳ Loading...</div>
```

---

## Animation Utility Classes

### Speed Modifiers
```css
.animate-fast      /* 0.2s */
.animate-slow      /* 1s */
.animate-slower    /* 1.5s */
```

**Usage:**
```html
<div class="animate-heartBeat animate-fast">Quick heart beat</div>
<div class="animate-bounce animate-slow">Slow bounce</div>
```

### Animation Delays
```css
.animate-delay-100   /* 0.1s delay */
.animate-delay-200   /* 0.2s delay */
.animate-delay-300   /* 0.3s delay */
.animate-delay-500   /* 0.5s delay */
```

**Usage:**
```html
<div class="animate-slideUp animate-delay-100">First item</div>
<div class="animate-slideUp animate-delay-200">Second item</div>
<div class="animate-slideUp animate-delay-300">Third item</div>
```

### Easing Functions
```css
.animate-ease-in      /* ease-in */
.animate-ease-out     /* ease-out */
.animate-ease-in-out  /* ease-in-out */
.animate-linear       /* linear */
```

### Fill Modes
```css
.animate-fill-forwards   /* Keep final state */
.animate-fill-backwards  /* Keep initial state */
.animate-fill-both       /* Both states */
```

---

## useAnimation Hook

### Basic Usage

```javascript
import { useAnimation } from '../hooks/useAnimation';
import { useRef } from 'react';

function LikeButton() {
  const { animate } = useAnimation();
  const heartRef = useRef(null);

  const handleLike = () => {
    animate(heartRef, 'heartBeat');
  };

  return (
    <button ref={heartRef} onClick={handleLike}>
      ❤️ Like
    </button>
  );
}
```

### API

#### `animate(ref, animationName, duration, onComplete)`

Trigger an animation on an element.

**Parameters:**
- `ref` (React.MutableRefObject) - Element reference to animate
- `animationName` (string) - Animation name (without `animate-` prefix)
  - Valid: `'heartBeat'`, `'shake'`, `'bounce'`, `'fadeIn'`, `'slideUp'`, `'scaleIn'`, `'rotate'`, `'shimmer'`
- `duration` (number, optional) - Duration in milliseconds (overrides CSS)
- `onComplete` (Function, optional) - Callback after animation completes

**Example:**
```javascript
const { animate } = useAnimation();

// Simple animation
animate(ref, 'heartBeat');

// Custom duration
animate(ref, 'shake', 800);

// With callback
animate(ref, 'slideUp', null, () => {
  console.log('Animation complete!');
});
```

#### `cancelAnimation(ref)`

Cancel an ongoing animation.

**Example:**
```javascript
const { cancelAnimation } = useAnimation();

// Cancel animation
cancelAnimation(elementRef);
```

#### `animateSequence(animations, staggerDelay, onAllComplete)`

Trigger multiple animations in sequence.

**Parameters:**
- `animations` (Array) - Array of `{ref, name, duration}` objects
- `staggerDelay` (number) - Delay between animations in milliseconds (default: 100ms)
- `onAllComplete` (Function, optional) - Callback when all animations finish

**Example:**
```javascript
const { animateSequence } = useAnimation();
const ref1 = useRef(null);
const ref2 = useRef(null);
const ref3 = useRef(null);

const handleStart = () => {
  animateSequence(
    [
      { ref: ref1, name: 'slideUp' },
      { ref: ref2, name: 'slideUp' },
      { ref: ref3, name: 'slideUp' },
    ],
    150,
    () => console.log('All animations done!')
  );
};

return (
  <>
    <div ref={ref1}>Item 1</div>
    <div ref={ref2}>Item 2</div>
    <div ref={ref3}>Item 3</div>
    <button onClick={handleStart}>Animate All</button>
  </>
);
```

#### `animateMultiple(refs, animationName, staggerDelay, onAllComplete)`

Trigger the same animation on multiple elements with stagger.

**Parameters:**
- `refs` (Array) - Array of element references
- `animationName` (string) - Animation name
- `staggerDelay` (number) - Delay between animations (default: 100ms)
- `onAllComplete` (Function, optional) - Callback when all complete

**Example:**
```javascript
const { animateMultiple } = useAnimation();
const refs = [useRef(null), useRef(null), useRef(null)];

const handleAnimateAll = () => {
  animateMultiple(refs, 'heartBeat', 200, () => {
    console.log('All hearts beat!');
  });
};

return (
  <>
    {refs.map((ref, idx) => (
      <span key={idx} ref={ref}>❤️</span>
    ))}
    <button onClick={handleAnimateAll}>Beat All Hearts</button>
  </>
);
```

---

## Real-World Examples

### Like Button with Heart Animation
```javascript
import { useAnimation } from '../hooks/useAnimation';
import { useRef } from 'react';
import '../styles/animations.css';

function LikeButton({ onLike }) {
  const { animate } = useAnimation();
  const heartRef = useRef(null);

  const handleLike = async () => {
    animate(heartRef, 'heartBeat', 600, () => {
      onLike();
    });
  };

  return (
    <button ref={heartRef} onClick={handleLike} className="like-btn">
      ❤️ Like
    </button>
  );
}
```

### Form Error Shake
```javascript
import { useAnimation } from '../hooks/useAnimation';
import { useRef, useState } from 'react';

function LoginForm() {
  const { animate } = useAnimation();
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!isValid()) {
      setError('Invalid credentials');
      animate(inputRef, 'shake');
      return;
    }
    
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        ref={inputRef} 
        type="email" 
        placeholder="Email"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Staggered List Animation
```javascript
import { useAnimation } from '../hooks/useAnimation';
import { useRef, useEffect } from 'react';

function PostList({ posts }) {
  const { animateMultiple } = useAnimation();
  const postRefs = useRef([]);

  useEffect(() => {
    if (postRefs.current.length > 0) {
      animateMultiple(postRefs.current, 'slideUp', 100);
    }
  }, [posts, animateMultiple]);

  return (
    <div>
      {posts.map((post, idx) => (
        <div 
          key={post.id}
          ref={(el) => postRefs.current[idx] = el}
        >
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
```

### Loading Skeleton
```javascript
import '../styles/animations.css';

function SkeletonLoader() {
  return (
    <div className="skeleton-container">
      <div className="animate-shimmer" style={{ height: '20px', marginBottom: '10px' }} />
      <div className="animate-shimmer" style={{ height: '20px', marginBottom: '10px' }} />
      <div className="animate-shimmer" style={{ height: '20px' }} />
    </div>
  );
}
```

### Notification Toast with Animation
```javascript
import { useAnimation } from '../hooks/useAnimation';
import { useRef, useEffect } from 'react';

function Toast({ message, type, onClose }) {
  const { animate } = useAnimation();
  const toastRef = useRef(null);

  useEffect(() => {
    animate(toastRef, 'slideRight', 300);

    const timer = setTimeout(() => {
      animate(toastRef, 'fadeOut', 300, onClose);
    }, 3000);

    return () => clearTimeout(timer);
  }, [animate, onClose]);

  return (
    <div ref={toastRef} className={`toast toast-${type}`}>
      {message}
    </div>
  );
}
```

---

## Performance Tips

1. **Use CSS classes for static animations** - Avoid JS when possible
   ```html
   <!-- Good: Simple CSS -->
   <div class="animate-rotate">Loading...</div>
   ```

2. **Use hook for interactive animations** - When triggered by user
   ```javascript
   // Good: User interaction
   const handleClick = () => {
     animate(ref, 'heartBeat');
   };
   ```

3. **Avoid too many simultaneous animations** - Can cause performance issues
4. **Use hardware acceleration** - Already included in CSS with `transform` and `opacity`
5. **Respect prefers-reduced-motion** - Automatically handled

---

## Browser Support

All animations use standard CSS and are supported in:
- Chrome/Edge 95+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

## Accessibility

- All animations respect `prefers-reduced-motion` media query
- Animations auto-disable for users who prefer reduced motion
- No animations affect core functionality
