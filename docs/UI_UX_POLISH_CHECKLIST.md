# Focus UI/UX Polish Checklist

This document provides a comprehensive checklist for polishing the Focus user interface and user experience to ensure a professional, consistent, and delightful product.

## Table of Contents

1. [Visual Consistency](#visual-consistency)
2. [Animation Guidelines](#animation-guidelines)
3. [Spacing and Layout](#spacing-and-layout)
4. [Color Scheme](#color-scheme)
5. [Typography](#typography)
6. [Micro-interactions](#micro-interactions)
7. [Loading States](#loading-states)
8. [Error States](#error-states)
9. [Empty States](#empty-states)
10. [Accessibility](#accessibility)

---

## Visual Consistency

### Component Consistency

- [ ] All buttons use consistent styling
- [ ] All input fields have uniform appearance
- [ ] All cards have consistent shadows and borders
- [ ] All modals follow same design pattern
- [ ] All icons are from same icon set (Lucide)
- [ ] All avatars have consistent sizing and styling
- [ ] All badges use consistent design
- [ ] All tooltips have uniform appearance

### Brand Consistency

- [ ] Logo appears consistently across all pages
- [ ] Brand colors used appropriately
- [ ] Typography follows brand guidelines
- [ ] Tone of voice consistent in all copy
- [ ] Imagery style consistent

### Design System Audit

**Buttons**:
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
```

**Input Fields**:
```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-field:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

.input-field.error {
  border-color: var(--error-color);
}
```

---

## Animation Guidelines

### Animation Principles

1. **Purpose**: Every animation should have a purpose
2. **Duration**: Keep animations short (150-300ms)
3. **Easing**: Use natural easing functions
4. **Performance**: Use transform and opacity for smooth animations
5. **Accessibility**: Respect `prefers-reduced-motion`

### Standard Animations

**Fade In**:
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}
```

**Slide Up**:
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}
```

**Scale In**:
```css
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn 0.2s ease-out;
}
```

**Pulse (for notifications)**:
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.pulse {
  animation: pulse 0.5s ease-in-out;
}
```

### Animation Checklist

- [ ] Page transitions are smooth
- [ ] Modal open/close animations work
- [ ] Button hover effects are consistent
- [ ] Loading spinners are smooth
- [ ] Like animation is delightful
- [ ] Comment submission has feedback
- [ ] Image upload shows progress
- [ ] Notification toast slides in smoothly
- [ ] Menu animations are fluid
- [ ] Scroll animations don't cause jank
- [ ] Reduced motion preference respected

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Spacing and Layout

### Spacing Scale

Use consistent spacing throughout:

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}
```

### Layout Checklist

- [ ] Consistent padding in all containers
- [ ] Consistent margins between sections
- [ ] Proper spacing between form elements
- [ ] Adequate whitespace around content
- [ ] Consistent grid gaps
- [ ] Proper spacing in navigation
- [ ] Consistent card padding
- [ ] Proper spacing in lists

### Responsive Spacing

```css
/* Mobile */
.container {
  padding: var(--space-md);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--space-lg);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: var(--space-xl);
  }
}
```

### Grid System

```css
.grid {
  display: grid;
  gap: var(--space-md);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
```

---

## Color Scheme

### Color Palette

**Light Mode**:
```css
:root {
  /* Primary */
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #60a5fa;
  --primary-rgb: 59, 130, 246;
  
  /* Neutral */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border-color: #e5e7eb;
  
  /* Semantic */
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

**Dark Mode**:
```css
[data-theme="dark"] {
  /* Primary */
  --primary-color: #60a5fa;
  --primary-dark: #3b82f6;
  --primary-light: #93c5fd;
  
  /* Neutral */
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  --border-color: #374151;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
}
```

### Color Usage Checklist

- [ ] Primary color used for main actions
- [ ] Success color for positive feedback
- [ ] Error color for errors and warnings
- [ ] Neutral colors for backgrounds
- [ ] Text colors have proper contrast
- [ ] Links are distinguishable
- [ ] Disabled states are clear
- [ ] Focus states are visible
- [ ] Dark mode colors are consistent
- [ ] Color meanings are consistent

### Contrast Requirements

- [ ] Normal text: 4.5:1 minimum
- [ ] Large text: 3:1 minimum
- [ ] UI components: 3:1 minimum
- [ ] Focus indicators: 3:1 minimum

---

## Typography

### Font System

```css
:root {
  /* Font Families */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Typography Checklist

- [ ] Consistent font sizes across similar elements
- [ ] Proper heading hierarchy (h1-h6)
- [ ] Readable line heights
- [ ] Appropriate font weights
- [ ] Consistent letter spacing
- [ ] Proper text alignment
- [ ] Readable paragraph widths (45-75 characters)
- [ ] Consistent link styling
- [ ] Proper emphasis (bold, italic)
- [ ] Monospace for code

### Typography Examples

```css
/* Headings */
h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-lg);
}

h2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-md);
}

/* Body Text */
p {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  margin-bottom: var(--space-md);
  max-width: 65ch;
}

/* Small Text */
.text-small {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Links */
a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}
```

---

## Micro-interactions

### Like Button

```javascript
const LikeButton = ({ isLiked, onLike }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleLike = () => {
    setIsAnimating(true);
    onLike();
    setTimeout(() => setIsAnimating(false), 600);
  };
  
  return (
    <button
      className={`like-button ${isLiked ? 'liked' : ''} ${isAnimating ? 'animating' : ''}`}
      onClick={handleLike}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart fill={isLiked ? 'currentColor' : 'none'} />
    </button>
  );
};
```

```css
.like-button {
  transition: all 0.2s ease;
}

.like-button:hover {
  transform: scale(1.1);
}

.like-button.animating {
  animation: likeAnimation 0.6s ease;
}

@keyframes likeAnimation {
  0%, 100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.3);
  }
  30% {
    transform: scale(0.9);
  }
  45% {
    transform: scale(1.1);
  }
  60% {
    transform: scale(1);
  }
}

.like-button.liked {
  color: #ef4444;
}
```

### Follow Button

```css
.follow-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.follow-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.follow-button:active::before {
  width: 300px;
  height: 300px;
}
```

### Input Focus

```css
.input-field {
  position: relative;
  transition: all 0.2s ease;
}

.input-field:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.input-field::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.input-field:focus::after {
  width: 100%;
}
```

### Micro-interaction Checklist

- [ ] Like button has satisfying animation
- [ ] Follow button provides feedback
- [ ] Input fields respond to focus
- [ ] Buttons have hover states
- [ ] Checkboxes animate on check
- [ ] Toggle switches slide smoothly
- [ ] Dropdown menus animate open
- [ ] Tooltips fade in/out
- [ ] Progress bars animate
- [ ] Success checkmarks animate

---

## Loading States

### Skeleton Screens

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-image {
  width: 100%;
  height: 200px;
}
```

### Loading Spinner

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Progress Bar

```css
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-bar-indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
```

### Loading State Checklist

- [ ] Skeleton screens for content loading
- [ ] Spinners for actions
- [ ] Progress bars for uploads
- [ ] Loading text is clear
- [ ] Loading states don't block UI
- [ ] Timeout handling for long loads
- [ ] Smooth transition from loading to content

---

## Error States

### Error Messages

```css
.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--error-color);
  border-radius: 8px;
  color: var(--error-color);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Form Validation

```css
.input-error {
  border-color: var(--error-color);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--error-color);
}
```

### Error State Checklist

- [ ] Clear error messages
- [ ] Error icons for visual clarity
- [ ] Form field errors are specific
- [ ] Error states are dismissible
- [ ] Retry options provided
- [ ] Error doesn't lose user data
- [ ] Network errors handled gracefully
- [ ] 404 page is helpful
- [ ] 500 page is friendly

---

## Empty States

### Empty Feed

```jsx
const EmptyFeed = () => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <Inbox size={64} />
    </div>
    <h3>No posts yet</h3>
    <p>Follow some users to see their posts here</p>
    <button className="btn-primary">Find People</button>
  </div>
);
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
}

.empty-state-icon {
  color: var(--text-tertiary);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}
```

### Empty State Checklist

- [ ] Empty states have helpful illustrations
- [ ] Clear explanation of why it's empty
- [ ] Call-to-action to populate
- [ ] Consistent styling across all empty states
- [ ] Empty search results are helpful
- [ ] Empty notifications have message
- [ ] Empty messages have prompt

---

## Accessibility

### Accessibility Checklist

- [ ] All images have alt text
- [ ] All buttons have aria-labels
- [ ] All forms have labels
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast meets WCAG AA
- [ ] Headings are hierarchical
- [ ] Links are descriptive
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Modal focus is trapped
- [ ] Skip navigation links present

### ARIA Labels

```jsx
<button
  aria-label="Like post"
  aria-pressed={isLiked}
  onClick={handleLike}
>
  <Heart />
</button>

<input
  type="text"
  aria-label="Search"
  aria-describedby="search-help"
  placeholder="Search..."
/>
<span id="search-help" className="sr-only">
  Search for users, posts, or hashtags
</span>
```

### Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Final Polish Checklist

### Visual Polish
- [ ] All animations are smooth
- [ ] All transitions are consistent
- [ ] All shadows are appropriate
- [ ] All borders are consistent
- [ ] All corners have proper radius
- [ ] All icons are aligned
- [ ] All images are optimized
- [ ] All colors are from palette

### Interaction Polish
- [ ] All buttons have hover states
- [ ] All links have hover states
- [ ] All inputs have focus states
- [ ] All actions have feedback
- [ ] All errors are handled
- [ ] All loading states work
- [ ] All empty states are helpful
- [ ] All success states are clear

### Content Polish
- [ ] All copy is clear and concise
- [ ] All labels are descriptive
- [ ] All placeholders are helpful
- [ ] All error messages are specific
- [ ] All success messages are encouraging
- [ ] All tooltips are informative
- [ ] All headings are meaningful

### Performance Polish
- [ ] All images are lazy loaded
- [ ] All animations are performant
- [ ] All interactions are responsive
- [ ] All pages load quickly
- [ ] All assets are optimized
- [ ] All fonts are loaded efficiently

---

*Last Updated: November 2025*
