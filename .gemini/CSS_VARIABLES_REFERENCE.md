# Royal Lavender Theme - CSS Variables Quick Reference

## 🎨 Color Palette

### Backgrounds
```css
--bg-primary: #05010a      /* Deepest Violet-Black - Main background */
--bg-secondary: #0a0510    /* Secondary Surface */
--bg-tertiary: #0d0614     /* Tertiary Surface */
--bg-card: #0f0818         /* Card Background */
--glass-bg: rgba(15, 8, 24, 0.7)  /* Glass effect background */
```

### Accents
```css
--royal-purple: #7c3aed    /* Primary Brand Color */
--neon-lavender: #d8b4fe   /* High Contrast Text/Accents */
--electric-violet: #8b5cf6 /* Hover States */
--deep-purple: #6d28d9     /* Darker Purple */
--light-lavender: #e9d5ff  /* Lighter Lavender */
```

### Text
```css
--text-primary: #ffffff
--text-secondary: #e9d5ff
--text-muted: #a78bfa
--text-disabled: rgba(167, 139, 250, 0.4)
```

### Borders
```css
--border-subtle: rgba(139, 92, 246, 0.2)
--border-medium: rgba(139, 92, 246, 0.3)
--border-strong: rgba(139, 92, 246, 0.5)
--glass-border: rgba(139, 92, 246, 0.15)
```

---

## 📏 Spacing Scale

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
```

**Usage Examples**:
- Padding: `padding: var(--space-4);`
- Margin: `margin-bottom: var(--space-6);`
- Gap: `gap: var(--space-3);`

---

## 🔤 Typography

### Font Sizes
```css
--font-xs: 12px
--font-sm: 14px
--font-base: 16px
--font-lg: 18px
--font-xl: 20px
--font-2xl: 24px
--font-3xl: 30px
--font-4xl: 36px
--font-5xl: 48px
```

### Font Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

### Font Families
```css
--font-primary: 'Inter', system-ui, -apple-system, sans-serif
--font-secondary: 'SF Pro Display', system-ui, sans-serif
```

---

## 🔘 Border Radius

```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-2xl: 24px
--radius-full: 9999px  /* Perfect circles */
```

---

## 🌈 Gradients

```css
--gradient-royal: linear-gradient(135deg, var(--royal-purple), #a78bfa)
--gradient-neon: linear-gradient(135deg, var(--royal-purple), var(--neon-lavender))
--gradient-dark: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary))
```

**Usage**:
```css
.title {
    background: var(--gradient-royal);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

---

## ✨ Shadows & Glows

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4)
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5)
--shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.6)
--shadow-card: 0 4px 20px rgba(0, 0, 0, 0.5)
```

### Glows
```css
--glow-purple: 0 0 20px rgba(124, 58, 237, 0.4)
--glow-lavender: 0 0 20px rgba(216, 180, 254, 0.3)
--glow-strong: 0 0 30px rgba(124, 58, 237, 0.6)
```

**Usage**:
```css
.card:hover {
    box-shadow: var(--glow-purple);
}
```

---

## ⏱️ Transitions

```css
--transition-fast: 0.15s ease
--transition-base: 0.2s ease
--transition-slow: 0.3s ease
--transition-bounce: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

---

## 📚 Z-Index Layers

```css
--z-base: 0
--z-dropdown: 1000
--z-sticky: 1100
--z-modal: 1200
--z-popover: 1300
--z-tooltip: 1400
```

---

## 🎯 Common Patterns

### Glass Card
```css
.card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: var(--shadow-card);
}
```

### Gradient Title
```css
.title {
    font-size: var(--font-3xl);
    font-weight: var(--font-bold);
    background: var(--gradient-royal);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

### Primary Button
```css
.button {
    background: var(--gradient-royal);
    color: var(--text-primary);
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-full);
    font-weight: var(--font-semibold);
    transition: var(--transition-base);
    box-shadow: var(--shadow-sm);
}

.button:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow-purple);
}
```

### Input Field
```css
.input {
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    color: var(--text-primary);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    transition: var(--transition-base);
}

.input:focus {
    border-color: var(--royal-purple);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
    background: var(--bg-tertiary);
}
```

---

## 🔄 Quick Conversion Table

| Old Value | New Variable | Notes |
|-----------|-------------|-------|
| `#000`, `#1a1a1a` | `var(--bg-primary)` or `var(--bg-card)` | Dark backgrounds |
| `#fff`, `white` | `var(--text-primary)` | Primary text |
| `#8b5cf6`, `#a855f7` | `var(--royal-purple)` | Purple accents |
| `#d8b4fe`, `#c4b5fd` | `var(--neon-lavender)` | Light lavender |
| `8px` | `var(--space-2)` | Small spacing |
| `16px` | `var(--space-4)` | Medium spacing |
| `24px` | `var(--space-6)` | Large spacing |
| `12px` (font) | `var(--font-xs)` | Extra small text |
| `14px` (font) | `var(--font-sm)` | Small text |
| `16px` (font) | `var(--font-base)` | Base text |
| `24px` (font) | `var(--font-2xl)` | Heading |
| `12px` (radius) | `var(--radius-lg)` | Large radius |
| `50%` (radius) | `var(--radius-full)` | Circle |
| `700` (weight) | `var(--font-bold)` | Bold text |

---

## 💡 Pro Tips

1. **Always use variables** - Never hardcode colors, spacing, or typography
2. **Glass effects** - Use `backdrop-filter: blur(20px)` with `var(--glass-bg)`
3. **Hover glows** - Add `box-shadow: var(--glow-purple)` on hover for premium feel
4. **Consistent borders** - Always `1px solid var(--border-subtle)` for cards
5. **Smooth transitions** - Use `var(--transition-base)` for all interactive elements
6. **Text shadows** - Add `text-shadow: var(--glow-lavender)` to important text on hover

---

**Last Updated**: February 3, 2026  
**Theme Version**: Royal Lavender v1.0
