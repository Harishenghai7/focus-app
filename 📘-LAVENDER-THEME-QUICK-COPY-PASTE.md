# 🎨 Quick Theme Reference - Lavender Dream

## 🎯 Quick Copy-Paste Colors

### Primary Lavender Colors
```css
/* Main Lavender Palette */
--lavender-primary: #9D7BD8;
--lavender-dark: #7B5CB8;
--lavender-light: #BFA3E8;
--lavender-accent: #C4A7E7;
--lavender-muted: #5B4A7C;

/* Background Colors */
--bg-primary: #0a0118;
--bg-secondary: #1a0f2e;
--card-bg: #150828;
--hover-bg: #1f0d3a;

/* Borders */
--border-primary: #3D2B5F;
--border-subtle: #2D1B4E;
--border-light: #4A3470;

/* Text */
--text-primary: #E8E0F5;
--text-secondary: #B8A5D4;
--text-muted: #8B7AA8;
```

---

## 🔧 Common Patterns

### Gradient Buttons
```css
.btn-primary {
  background: linear-gradient(135deg, var(--lavender-primary, #9D7BD8) 0%, var(--lavender-dark, #7B5CB8) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(157, 123, 216, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(157, 123, 216, 0.4);
}
```

### Loading Spinner
```css
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-subtle, #2D1B4E);
  border-top: 3px solid var(--lavender-primary, #9D7BD8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Card with Lavender Border
```css
.card {
  background: var(--card-bg, #150828);
  border: 1px solid var(--border-subtle, #2D1B4E);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s;
}

.card:hover {
  border-color: var(--lavender-primary, #9D7BD8);
  box-shadow: 0 8px 24px rgba(157, 123, 216, 0.15);
}
```

### Active Filter/Button
```css
.filter-btn {
  background: transparent;
  border: 1px solid var(--border-subtle, #2D1B4E);
  color: var(--text-secondary, #B8A5D4);
  padding: 8px 24px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active,
.filter-btn:hover {
  background: var(--lavender-primary, #9D7BD8);
  color: #fff;
  border-color: var(--lavender-primary, #9D7BD8);
  box-shadow: 0 4px 12px rgba(157, 123, 216, 0.3);
}
```

### Empty State
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: var(--lavender-primary, #9D7BD8);
  opacity: 0.6;
  margin-bottom: 24px;
}

.empty-state h3 {
  color: var(--text-primary, #E8E0F5);
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px;
}

.empty-state p {
  color: var(--text-secondary, #B8A5D4);
  font-size: 16px;
  margin: 0 0 32px;
}
```

### Scrollbar Styling
```css
.scrollable::-webkit-scrollbar {
  width: 6px;
}

.scrollable::-webkit-scrollbar-thumb {
  background: var(--lavender-muted, #5B4A7C);
  border-radius: 3px;
}

.scrollable::-webkit-scrollbar-thumb:hover {
  background: var(--lavender-primary, #9D7BD8);
}
```

---

## 🎨 Lavender Glow Effect
```css
.glow-element {
  box-shadow: 
    0 0 20px rgba(157, 123, 216, 0.3),
    0 0 40px rgba(157, 123, 216, 0.2),
    0 0 60px rgba(157, 123, 216, 0.1);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## 🌙 Dark Mode Support

All colors already use dark mode by default. If you need light mode:

```css
/* Light mode overrides (optional) */
[data-theme="light"] {
  --bg-primary: #f5f3ff;
  --text-primary: #1a0f2e;
  --lavender-primary: #7B5CB8;
  --card-bg: #ffffff;
  --border-subtle: #e0d5f5;
}
```

---

## ✨ Quick Tips

1. **Always use CSS variables** with fallbacks:
   ```css
   color: var(--text-primary, #E8E0F5);
   ```

2. **Lavender shadows** for depth:
   ```css
   box-shadow: 0 4px 12px rgba(157, 123, 216, 0.3);
   ```

3. **Smooth transitions** for polish:
   ```css
   transition: all 0.2s ease;
   ```

4. **Gradient text** for headings:
   ```css
   background: linear-gradient(135deg, #9D7BD8, #C4A7E7);
   -webkit-background-clip: text;
   background-clip: text;
   -webkit-text-fill-color: transparent;
   ```

---

## 🎯 Updated Files Location

```
focus-app/
├── src/
│   ├── styles/
│   │   └── variables.css ✅ (theme variables)
│   ├── pages/
│   │   ├── Home.css ✅
│   │   ├── Explore.css ✅
│   │   ├── Boltz.css ✅
│   │   └── Profile.css ✅
│   └── components/
│       └── Header.css ✅
```

---

## 🚀 Ready to Use

All colors and patterns above are **production-ready** and match the updated CSS files. Copy-paste as needed for new components!

**Happy Styling! 🎨✨**
