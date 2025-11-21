# 🎨 LAVENDER THEME - QUICK REFERENCE GUIDE

## 🎯 COLOR USAGE GUIDE

### **When to Use Each Color:**

#### Primary Actions & Branding
```css
--focus-lavender: #8B7FD7
```
✅ Use for:
- Primary buttons
- Active navigation items
- Links
- Call-to-action buttons
- Brand logo accents

#### Light Accents & Hover States
```css
--focus-lavender-light: #B5ACDE
```
✅ Use for:
- Hover backgrounds
- Secondary buttons
- Subtle highlights
- Scrollbar thumb
- Disabled state backgrounds

#### Secondary Actions
```css
--focus-purple: #9D8FE3
```
✅ Use for:
- Secondary buttons
- Alternative actions
- Decorative elements
- Icon tints

#### Deep Accents & Shadows
```css
--focus-purple-deep: #6B5EBD
```
✅ Use for:
- Hover states on primary elements
- Box shadows
- Border accents
- Text on light backgrounds

#### Notifications & Alerts
```css
--focus-accent: #E91E63
```
✅ Use for:
- Notification badges
- Error states
- Important alerts
- Like/favorite buttons
- Unread indicators

---

## 🎨 GRADIENT USAGE

### Primary Gradient (Brand Identity)
```css
background: var(--gradient-primary);
/* or */
background: linear-gradient(135deg, #8B7FD7 0%, #E91E63 100%);
```
✅ Use for:
- Logo text effects
- Hero sections
- Primary CTA buttons
- Active navigation indicators
- Premium badges

### Secondary Gradient (Soft & Subtle)
```css
background: var(--gradient-secondary);
/* or */
background: linear-gradient(135deg, #B5ACDE 0%, #8B7FD7 100%);
```
✅ Use for:
- Card backgrounds
- Sidebar active states
- Subtle hover effects
- Background overlays

### Accent Gradient (Bold)
```css
background: var(--gradient-accent);
/* or */
background: linear-gradient(135deg, #9D8FE3 0%, #6B5EBD 100%);
```
✅ Use for:
- Special features
- Premium content
- Achievement badges
- Header backgrounds

---

## 📐 LAYOUT & SPACING

### Spacing Scale
```css
--spacing-1: 4px    /* Tiny gaps */
--spacing-2: 8px    /* Small gaps */
--spacing-3: 12px   /* Medium gaps */
--spacing-4: 16px   /* Standard padding */
--spacing-5: 20px   /* Large padding */
--spacing-6: 24px   /* Section spacing */
--spacing-8: 32px   /* Large section spacing */
--spacing-10: 40px  /* Extra large spacing */
--spacing-12: 48px  /* Maximum spacing */
```

### Border Radius
```css
--radius-sm: 4px     /* Small elements */
--radius-md: 8px     /* Standard cards */
--radius-lg: 12px    /* Large cards, buttons */
--radius-xl: 16px    /* Modals, large sections */
--radius-2xl: 24px   /* Hero sections */
--radius-full: 9999px /* Circles, pills */
```

### Layout Dimensions
```css
--header-height: 56px         /* Fixed header height */
--bottom-nav-height: 60px     /* Mobile bottom nav */
--sidebar-width: 245px        /* Desktop sidebar */
--content-max-width: 935px    /* Max content width */
```

---

## 🎭 COMMON PATTERNS

### 1. **Gradient Text Effect**
```css
.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 2. **Lavender Button**
```css
.lavender-button {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--focus-lavender);
  color: white;
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}

.lavender-button:hover {
  background: var(--focus-purple-deep);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### 3. **Gradient Button**
```css
.gradient-button {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.gradient-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}
```

### 4. **Card with Lavender Border**
```css
.lavender-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.lavender-card:hover {
  border-color: var(--focus-lavender-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### 5. **Badge/Notification**
```css
.notification-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--focus-accent);
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 6. **Glassmorphism Effect**
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}
```

---

## 🎨 SHADOW SYSTEM

```css
--shadow-sm: 0 1px 3px rgba(139, 127, 215, 0.08)
/* Use for: Small cards, subtle elevation */

--shadow-md: 0 4px 6px rgba(139, 127, 215, 0.12)
/* Use for: Standard cards, dropdowns */

--shadow-lg: 0 10px 15px rgba(139, 127, 215, 0.15)
/* Use for: Modals, popovers, hover states */

--shadow-xl: 0 20px 25px rgba(139, 127, 215, 0.18)
/* Use for: Large modals, overlays */
```

---

## ⚡ ANIMATIONS & TRANSITIONS

### Transition Speeds
```css
--transition-fast: 150ms ease-out    /* Quick interactions */
--transition-normal: 250ms ease-out  /* Standard transitions */
--transition-slow: 350ms ease-out    /* Smooth, noticeable */
```

### Common Animations
```css
/* Hover scale */
.hover-scale:hover {
  transform: scale(1.05);
}

/* Hover lift */
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Active press */
.active-press:active {
  transform: scale(0.95);
}
```

---

## 🌙 DARK MODE

### Dark Mode Backgrounds
```css
--dark-bg-primary: #1A1625   /* Deep purple-black */
--dark-bg-secondary: #241E35 /* Dark purple */
--dark-bg-tertiary: #2E2740  /* Medium purple */
--dark-bg-hover: #38304A     /* Hover state */
```

### Dark Mode Text
```css
--dark-text-primary: #F8F9FA   /* Main text */
--dark-text-secondary: #B8B9BE /* Secondary text */
--dark-text-tertiary: #6B6C7E  /* Tertiary text */
```

### Apply Dark Mode
```css
/* In your component */
.dark .your-element {
  background: var(--bg-primary); /* Auto switches to dark */
  color: var(--text-primary);    /* Auto switches to dark */
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
/* Mobile */
@media (max-width: 767px) { /* Mobile styles */ }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { /* Tablet */ }

/* Desktop */
@media (min-width: 1024px) { /* Desktop styles */ }
```

---

## ✅ DO's

✅ Use `var(--focus-lavender)` for primary actions
✅ Use gradients for brand elements and CTAs
✅ Use lavender shadows for elevated elements
✅ Maintain consistent spacing with spacing variables
✅ Use transitions for smooth interactions
✅ Test in both light and dark modes

## ❌ DON'Ts

❌ Don't hardcode color values (use CSS variables)
❌ Don't mix incompatible color schemes
❌ Don't overuse gradients (save for important elements)
❌ Don't use inconsistent spacing values
❌ Don't skip hover/active states
❌ Don't forget dark mode support

---

## 🚀 QUICK START EXAMPLES

### Example 1: Primary Button
```jsx
<button 
  style={{
    padding: 'var(--spacing-3) var(--spacing-6)',
    background: 'var(--gradient-primary)',
    color: 'white',
    borderRadius: 'var(--radius-lg)',
    fontWeight: 'var(--font-semibold)'
  }}
>
  Click Me
</button>
```

### Example 2: Card Component
```jsx
<div 
  style={{
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-6)',
    boxShadow: 'var(--shadow-sm)'
  }}
>
  Card Content
</div>
```

### Example 3: Notification Badge
```jsx
<span 
  style={{
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    background: 'var(--focus-accent)',
    color: 'white',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-bold)',
    borderRadius: 'var(--radius-full)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
  5
</span>
```

---

**LAVENDER THEME IS READY! USE THIS GUIDE TO BUILD BEAUTIFUL, CONSISTENT UIs! 💜✨**
