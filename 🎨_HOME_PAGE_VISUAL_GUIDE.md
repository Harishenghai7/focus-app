# 🎨 HOME PAGE - VISUAL REFERENCE GUIDE

## Layout Structure

```
┌─────────────────────────────────────────┐
│  📱 STORIES BAR (Horizontal Scroll)     │
│  ○ You  ○ User1  ○ User2  ○ User3 →    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✨ New posts available ✨              │  ← Shows when new content
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ╔═══════════════════════════════════╗  │
│  ║  👤 username ✓         ⋯          ║  │  ← Post Header
│  ║  📍 Location                      ║  │
│  ║                                   ║  │
│  ║  ┌───────────────────────────┐   ║  │
│  ║  │                           │   ║  │
│  ║  │      📷 Image/Video       │   ║  │  ← Media
│  ║  │      (Carousel if >1)     │   ║  │
│  ║  │         ● ○ ○             │   ║  │
│  ║  └───────────────────────────┘   ║  │
│  ║                                   ║  │
│  ║  ❤️ 💬 📤          🔖           ║  │  ← Actions
│  ║                                   ║  │
│  ║  ❤️ 1,234 likes                  ║  │  ← Stats
│  ║  username Caption text #tag       ║  │  ← Caption
│  ║  View all 45 comments             ║  │
│  ║  2h ago                           ║  │
│  ╚═══════════════════════════════════╝  │
└─────────────────────────────────────────┘

        ↓ Infinite Scroll ↓

┌─────────────────────────────────────────┐
│  🎉 You're all caught up!               │  ← End of Feed
│     Check back later for more posts    │
└─────────────────────────────────────────┘

                                      ┌───┐
                                      │🦁 │  ← Focusly Button
                                      └───┘
```

---

## Color Scheme

### Background Gradient
```
┌─────────────────┐
│  #1B1139 (Top)  │  ← Dark Purple
│       ↓         │
│  #321B7C (Mid)  │  ← Medium Purple
│       ↓         │
│  #462E93 (Bot)  │  ← Light Purple
└─────────────────┘
```

### Interactive Elements

```
Like Button:  ❤️ #FF5378 (Red/Pink)
Save Button:  🔖 #38C2E5 (Cyan)
Verified:     ✓  #9372FF (Purple)
Accent:       ✨  #8B7FD7 (Lavender)
Highlight:    💫  #EE7BFA (Pink)
```

### Text Colors

```
Primary:   #FFFFFF ████████  (White)
Secondary: #B9B3ED ████████  (Light Purple)
Muted:     #877BC6 ████████  (Muted Purple)
Hashtag:   #A198FF ████████  (Accent Purple)
Mention:   #EE7BFA ████████  (Pink)
```

---

## Component States

### Stories Bar

**Loading State:**
```
┌──────────────────────────────────────┐
│  ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯                    │
│  (Pulsing skeleton circles)          │
└──────────────────────────────────────┘
```

**Loaded State:**
```
┌──────────────────────────────────────┐
│  ● User1  ◯ User2  ◯ User3  ○ User4  │
│  (Blue=unviewed, Gray=viewed)        │
└──────────────────────────────────────┘
```

### Post Card

**Normal State:**
```
╔═══════════════════════════╗
║ 👤 user123 ✓        ⋯    ║
║ 📸 [Image]                ║
║ ❤️ 💬 📤        🔖       ║
║ ❤️ 1,234 likes           ║
╚═══════════════════════════╝
```

**Liked State:**
```
╔═══════════════════════════╗
║ 👤 user123 ✓        ⋯    ║
║ 📸 [Image]                ║
║ ❤️ 💬 📤        🔖       ║  ← Red heart
║ ❤️ 1,235 likes           ║  ← +1
╚═══════════════════════════╝
```

**Saved State:**
```
╔═══════════════════════════╗
║ 👤 user123 ✓        ⋯    ║
║ 📸 [Image]                ║
║ ❤️ 💬 📤        🔖       ║  ← Blue bookmark
╚═══════════════════════════╝
```

### Loading States

**Skeleton Screen:**
```
┌─────────────────────────┐
│  ◯  ████                │  ← Avatar + Name
│                         │
│  ██████████████████     │  ← Image placeholder
│  ██████████████████     │
│  ██████████████████     │
│                         │
│  ◯ ◯ ◯      ◯          │  ← Action buttons
└─────────────────────────┘
```

**Loading More:**
```
┌─────────────────────────┐
│        ⟳                │  ← Spinner
│    Loading...           │
└─────────────────────────┘
```

### Empty State

```
┌─────────────────────────┐
│                         │
│        📸               │
│   Welcome to Focus!     │
│                         │
│  Follow people to see   │
│   their posts here      │
│                         │
│   ┌──────────────┐      │
│   │   Explore    │      │
│   └──────────────┘      │
│                         │
└─────────────────────────┘
```

### Error State

```
┌─────────────────────────┐
│        ⚠️               │
│  Unable to load posts   │
│                         │
│  Network error...       │
│                         │
│   ┌──────────────┐      │
│   │  Try Again   │      │
│   └──────────────┘      │
└─────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile (< 768px)
```
┌───────────┐
│  Stories  │  ← Full width
│           │
│  ╔═════╗  │
│  ║Post ║  │  ← Full width posts
│  ║Card ║  │
│  ╚═════╝  │
│           │
│  ╔═════╗  │
│  ║Post ║  │
│  ╚═════╝  │
└───────────┘
       🦁 Focusly
```

### Tablet (768px - 1024px)
```
   ┌─────────────────┐
   │    Stories      │
   │                 │
   │   ╔═════════╗   │
   │   ║  Post   ║   │  ← Max 640px
   │   ║  Card   ║   │
   │   ╚═════════╝   │
   │                 │
   │   ╔═════════╗   │
   │   ║  Post   ║   │
   │   ╚═════════╝   │
   └─────────────────┘
              🦁 Focusly
```

### Desktop (> 1024px)
```
      ┌───────────────────┐
      │     Stories       │
      │                   │
      │  ╔════════════╗   │
      │  ║    Post    ║   │  ← Max 670px
      │  ║    Card    ║   │
      │  ╚════════════╝   │
      │                   │
      │  ╔════════════╗   │
      │  ║    Post    ║   │
      │  ╚════════════╝   │
      └───────────────────┘
                  🦁 Focusly
```

---

## Interaction States

### Like Animation (Double-Tap)

```
Step 1: Normal          Step 2: Tap Detected
┌─────────────┐        ┌─────────────┐
│             │        │             │
│   📸 Post   │   →    │   📸 Post   │
│             │        │      ❤️      │  ← Appears
│             │        │             │
└─────────────┘        └─────────────┘
                              ↓
Step 3: Scale Up        Step 4: Fade Out
┌─────────────┐        ┌─────────────┐
│             │        │             │
│   📸 Post   │   →    │   📸 Post   │
│      ❤️❤️    │        │             │  ← Fades
│             │        │             │
└─────────────┘        └─────────────┘
```

### Pull-to-Refresh

```
Step 1: Normal          Step 2: Pull Down
┌─────────────┐        ┌─────────────┐
│  Stories    │        │      ↓      │  ← Indicator
│             │   →    │  Stories    │
│  Posts      │        │             │
└─────────────┘        └─────────────┘
                              ↓
Step 3: Release         Step 4: Refreshing
┌─────────────┐        ┌─────────────┐
│      ⟳      │   →    │  Stories    │
│  Stories    │        │             │  ← New data
│             │        │  Posts      │
└─────────────┘        └─────────────┘
```

### Carousel Navigation

```
Image 1/3               Image 2/3               Image 3/3
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│             │        │             │        │             │
│   📸 1      │   →    │   📸 2      │   →    │   📸 3      │
│ ● ○ ○       │        │ ○ ● ○       │        │ ○ ○ ●       │
│             │        │             │        │             │
│  ‹      ›   │        │  ‹      ›   │        │  ‹      ›   │
└─────────────┘        └─────────────┘        └─────────────┘
```

---

## Modal Overlays

### Comment Modal
```
┌─────────────────────────────────┐
│  ✕                              │  ← Close button
│                                 │
│  ╔═══════════════════════════╗  │
│  ║  Post Preview             ║  │
│  ╚═══════════════════════════╝  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👤 user1: Great post!   │   │
│  │ 👤 user2: Love it ❤️     │   │  ← Comments
│  │ 👤 user3: Amazing!       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌──────────────────────┐      │
│  │ Add a comment...  📤 │      │  ← Input
│  └──────────────────────┘      │
└─────────────────────────────────┘
```

### Share Modal
```
┌─────────────────────────────────┐
│         Share Post       ✕      │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ 📱  │  │ 💬  │  │ ✉️   │     │
│  │Story│  │ DM  │  │Email│     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ 🔗  │  │ 📋  │  │ ⋯   │     │
│  │Link │  │Copy │  │More │     │
│  └─────┘  └─────┘  └─────┘     │
└─────────────────────────────────┘
```

---

## Focusly Button States

### Normal
```
    ┌───┐
    │🦁 │  ← 60x60px, purple gradient
    └───┘
```

### Hover
```
    ┌───┐
    │🦁 │  ← Scales to 1.1x, glows
    └───┘
    ╰─╯  ← Shadow
```

### With Tooltip
```
┌─────────────────┐  ┌───┐
│ Chat with Focusly│ →│🦁 │
└─────────────────┘  └───┘
```

---

## Animation Timeline

```
0ms     500ms   1000ms  1500ms  2000ms
│       │       │       │       │
│       │       │       │       │
└─ Stories Load ─────────────────┤
        │       │       │       │
        └─ Posts Load ───────────┤
                │       │       │
                └─ Focusly Fade In ─┤
                        │       │
                        └─ Pulse Loop ───→
```

---

## Touch Gestures Map

```
┌─────────────────────────────┐
│  ↓ Pull Down = Refresh      │
│                             │
│  ╔═════════════════════╗    │
│  ║ Double Tap = Like   ║    │
│  ║                     ║    │
│  ║ ←→ Swipe = Carousel ║    │
│  ╚═════════════════════╝    │
│                             │
│  Long Press = Options       │
└─────────────────────────────┘
```

---

## Icon Guide

```
❤️  Like (red when active)
💬  Comment
📤  Share
🔖  Save (blue when active)
✓   Verified badge
⋯   More options
‹›  Navigation arrows
●○  Carousel indicators
✨  New content indicator
🦁  Focusly AI
📍  Location
👤  User avatar
🎉  Celebration
⚠️  Warning/Error
⟳   Loading/Refresh
✕   Close
```

---

## Spacing System

```
Compact:   4px   ─
Small:     8px   ──
Medium:    16px  ────
Large:     24px  ──────
XL:        32px  ────────
XXL:       48px  ────────────
```

---

## Z-Index Layers

```
Layer 10: Modals (1000)
Layer 9:  Floating Button (998)
Layer 8:  New Posts Banner (100)
Layer 7:  Post Options Menu (3)
Layer 6:  Media Navigation (2)
Layer 5:  Sticky Headers (1)
Layer 4:  Content (0)
Layer 3:  Background (-1)
```

---

This visual guide provides a quick reference for understanding the Home page layout, states, and interactions at a glance.
