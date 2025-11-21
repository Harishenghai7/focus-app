# 🏠 **Focus Home.js: Master Blueprint & Implementation Guide**

**Date:** November 21, 2025  
**Status:** Professional-Grade Implementation Plan  
**Theme:** Lavender (Calm, Focus-Oriented, Modern)

---

## 📐 **Page Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                     FOCUS HOME PAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─ SIDEBAR (Desktop Only)          ┌─ MAIN FEED AREA ────────┐ │
│  │ ├─ Focus Logo                    │                          │ │
│  │ ├─ Home (Active)                 │ [ Stories Carousel ]     │ │
│  │ ├─ Explore                       │                          │ │
│  │ ├─ Create                        │ [ New Posts Banner ]     │ │
│  │ ├─ Boltz                         │  (if new posts)          │ │
│  │ ├─ Messages                      │                          │ │
│  │ ├─ Calls                         ├──────────────────────────┤ │
│  │ ├─ Notifications                 │                          │ │
│  │ ├─ Settings                      │  ┌─ Post Card 1 ─────┐  │ │
│  │ ├─ Profile                       │  │ ├─ Header          │  │ │
│  │ └─ Logout                        │  │ ├─ Media (swipable)│  │ │
│  │                                  │  │ ├─ Actions         │  │ │
│  │                                  │  │ ├─ Caption         │  │ │
│  │                                  │  │ └─ Comments        │  │ │
│  │                                  │  └────────────────────┘  │ │
│  │                                  │                          │ │
│  │                                  │  ┌─ Post Card 2 ─────┐  │ │
│  │                                  │  │ ... (same layout)  │  │ │
│  │                                  │  └────────────────────┘  │ │
│  │                                  │                          │ │
│  │                                  │  [ Infinite Scroll ... ] │ │
│  │                                  │                          │ │
│  │                                  │  ┌─ Loading Spinner ─┐   │ │
│  │                                  │  └────────────────────┘   │ │
│  │                                  │                          │ │
│  │                                  │  "You're all caught up!" │ │
│  │                                  │  (End of feed message)   │ │
│  │                                  └──────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─ MOBILE LAYOUT (Bottom Navbar) ─ Main feed full width ────────┤
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 **Lavender Theme Color Palette**

| Element | Primary | Secondary | Accent | Usage |
|---------|---------|-----------|--------|-------|
| **Background** | `#1B1139` | `#2A1F4A` | - | Page & card base |
| **Gradient Base** | `#8B7FD7` | `#7A6FCC` | - | Buttons, borders, active states |
| **Accent Pink** | `#EE7BFA` | `#FF5378` | - | Highlights, likes, hover states |
| **Accent Cyan** | `#38C2E5` | - | - | Bookmarks, secondary actions |
| **Gold** | `#FFD600` | - | - | End-of-feed, badges |
| **Text Primary** | `#FFFFFF` | - | - | Headings, usernames |
| **Text Secondary** | `#B9B3ED` | `#D4C8FF` | - | Captions, descriptions |
| **Text Tertiary** | `#8885A0` | `#696993` | - | Meta info, timestamps |
| **Border** | `#5E50A9` | - | - | Card borders, dividers |

**Glassmorphism:** `rgba(29, 18, 56, 0.83)` with backdrop blur `10-20px`

---

## ✨ **Core Features & Functionality**

### 1. **Sidebar Navigation** (Desktop Only)
- **Structure:** Vertical, fixed-position, left-aligned
- **Items:** Logo, navigation links, logout
- **Styling:** 
  - Active link: Lavender gradient background + pink highlight
  - Hover: Subtle transparency increase
  - Icon + Label layout
- **Colors:** Dark purple background, lavender text for active, white for inactive
- **Responsive:** Hide on mobile, replace with bottom navbar

### 2. **Stories/Flash Bar**
- **Container:** Horizontal scrollable row, above feed
- **Items:**
  - "Your Story" first with `+` icon (creates new story)
  - Other users' stories with gradient rings
  - Unviewed: Pink border (`#EE7BFA`)
  - Viewed: Dimmed purple border (`#8480A8`) with 55% opacity
- **Interaction:** Click to view full-screen Flash viewer
- **Animation:** Smooth scroll, pulse on hover
- **Spacing:** 14px gap between items

### 3. **New Posts Banner**
- **Trigger:** When new posts detected in real-time (Supabase subscription)
- **Appearance:** Gradient background (lavender → pink), full-width banner
- **Text:** "✨ New posts available ✨"
- **Animation:** Fade-in from top (fadeInDown, 0.36s)
- **Action:** Click to reload posts (calls `fetchPosts(0)`)
- **Position:** Above feed, below stories

### 4. **Post Card** (Main Content Block)
Each post card contains:

#### **Header**
- Avatar (43px, rounded, bordered)
- Username (white, 600 weight)
- Verified badge (if applicable)
- Location (secondary text)
- Post options menu (3-dot icon, owner-only)

#### **Media Container**
- Images/Videos with smooth transitions
- Double-tap to like (heart animation)
- Navigation buttons (‹ › arrows) for multiple media
- Indicator dots (active = pink, inactive = gray)
- Glassmorphic background on hover

#### **Interaction Bar**
- **Like button** → Heart icon, fills red (`#FF5378`) when liked
- **Comment button** → Opens comment modal/section
- **Share button** → Share modal
- **Bookmark button** → Fills cyan (`#38C2E5`) when saved
- **Animations:** Scale on hover, color transition

#### **Caption**
- Username (white, bold) + Caption text (lavender)
- Hashtags/mentions as clickable lavender links

#### **Stats & Comments**
- Like count display
- "View all X comments" link (interactive)
- Timestamp (time-ago format)

#### **Styling**
- Background: `rgba(29, 18, 56, 0.83)` with `1.6px` border (`#5E50A9`)
- Border-radius: `22px`
- Box-shadow: Lavender glow on hover
- Spacing: `28px` gap between cards

### 5. **Infinite Scroll**
- **Trigger:** IntersectionObserver on bottom element
- **Behavior:** Loads 10 posts per page
- **Loading State:** Skeleton shimmer cards while fetching
- **End State:** "You're all caught up! 🎉" message in gold

### 6. **Real-Time Updates**
- **Subscription:** Supabase `postgres_changes` on `posts` table
- **Events:** Listen for INSERT events
- **Trigger:** Show "New posts available" banner
- **Action:** User can click to refresh feed

### 7. **Loading States**
- **Initial Load:** 3 skeleton shimmer cards
- **Skeleton:** Gray placeholders with pulse animation
- **Error State:** Lavender card with error message + retry button
- **Empty State:** "Welcome to Focus!" message + Explore button

### 8. **Error Handling**
- **Failed Posts:** Error card with retry button
- **Failed Likes/Saves:** Revert to previous state optimistically
- **Network Issues:** Show error message with specific error

---

## 🎯 **Data Flow & Logic**

### **State Management (Home.js)**
```javascript
// Main state
posts[]              // Array of post objects with media, likes, comments
stories[]            // Array of story objects from past 24h
loading              // Boolean - initial page load
loadingMore          // Boolean - infinite scroll loading
hasMore              // Boolean - more posts available?
page                 // Integer - current page number
newPostsAvailable    // Boolean - show banner?
selectedPost         // Object - currently selected post for comments
error                // String - error message

// Derived state (calculated per post)
post.likesCount      // Integer - total likes
post.commentsCount   // Integer - total comments
post.isLiked         // Boolean - current user liked?
post.isSaved         // Boolean - current user saved?
post.currentMediaIndex // Integer - carousel position
```

### **Fetch Flow**
1. **On Mount:**
   - Fetch stories (past 24h) → `setStories()`
   - Fetch posts (page 0) → `setPosts()`
   - Set up real-time subscription

2. **On Scroll to Bottom:**
   - Trigger `fetchPosts(page + 1)`
   - Append to existing posts

3. **On New Post Detected:**
   - Show "New posts available" banner
   - User clicks → `fetchPosts(0)` → replaces all posts

4. **On Like/Save:**
   - Optimistically update UI immediately
   - Persist to Supabase
   - Revert if error occurs

### **Real-Time Subscription**
```javascript
supabase
  .channel('posts-changes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
    setNewPostsAvailable(true);
  })
  .subscribe();
```

---

## 🎨 **CSS Organization & Styling**

### **Class Naming Convention**
- `.home-page` — Main page container
- `.home-container` — Feed wrapper (max-width: 670px)
- `.flash-stories-container` — Stories section
- `.flash-story`, `.flash-story-ring` — Story items
- `.post-card` — Post wrapper
- `.post-header`, `.post-media-container`, `.post-actions` — Sections
- `.post-action-btn` — Individual action buttons
- `.post-caption`, `.post-stats` — Text elements
- `.new-posts-banner` — New posts notification
- `.loading-skeleton`, `.post-skeleton` — Loading states
- `.home-empty`, `.home-error` — Empty/error states
- `.end-of-feed` — End message

### **Color Application**
- **Lavender** (`#8B7FD7`): Buttons, hover states, borders, disabled text
- **Pink** (`#EE7BFA`): Active indicators, liked state, highlights
- **Cyan** (`#38C2E5`): Saved/bookmark state
- **Gold** (`#FFD600`): End-of-feed message
- **Dark Purple** (`#1B1139`, `#2A1F4A`): Backgrounds
- **White** (`#FFFFFF`): Primary text
- **Lavender Text** (`#B9B3ED`): Secondary text

### **Shadow & Depth**
- **Subtle:** `0 2px 12px rgba(79, 69, 173, 0.19)`
- **Medium:** `0 8px 38px rgba(144, 132, 231, 0.22)`
- **Strong:** `0 10px 60px rgba(139, 127, 215, 0.27)`

### **Transitions & Animations**
- **Fast:** `0.12-0.14s` (hover effects, scale)
- **Medium:** `0.18s` (card shadow, border changes)
- **Slow:** `0.36s` (banner entrance, skeleton pulse)
- **Easing:** `cubic-bezier(.5,2,.7,1.1)` for banners, `linear` for spinners

---

## 📱 **Responsive Breakpoints**

### **Desktop (1200px+)**
- Sidebar visible on left (fixed, ~250px)
- Feed centered, max-width: 670px
- Cards: full spacing, large shadows
- Stories: normal size

### **Tablet (800px - 1200px)**
- Sidebar visible but narrower
- Feed adjusts width
- Cards: reduced padding
- Stories: slightly smaller

### **Mobile (< 800px)**
- Sidebar hidden, bottom navbar instead
- Feed: edge-to-edge (full width with minimal padding)
- Cards: border-radius reduced to 16px
- Avatar: smaller (32px)
- Stories: compact mode
- Buttons: larger touch targets

### **Small Mobile (< 530px)**
- Minimal padding
- Ultra-compact card layout
- Stories: scroll more aggressively
- Text: 1-2px smaller

---

## 🔄 **Component Interaction Flow**

```
Home.js (Main)
├── fetchStories()
│   └── calls supabase.from('flash_stories').select()
├── fetchPosts()
│   └── calls supabase.from('posts').select()
│   └── for each post: get likes, comments, user state
├── handleLike()
│   └── optimistic update UI
│   └── persist to supabase.post_likes
├── handleSave()
│   └── optimistic update UI
│   └── persist to supabase.saved_posts
├── navigateMedia()
│   └── update currentMediaIndex for carousel
├── Real-time subscription
│   └── listen for new posts
│   └── trigger "New posts available" banner
├── Infinite scroll observer
│   └── triggers fetchPosts(page + 1)
└── Rendering
    ├── Stories carousel (map over stories[])
    ├── New posts banner (if newPostsAvailable)
    ├── Posts feed (map over posts[])
    │   └── Post card per post
    │       ├── Header
    │       ├── Media carousel
    │       ├── Interaction buttons
    │       ├── Caption & stats
    │       └── Comments preview
    ├── Loading spinner (if loadingMore)
    ├── End-of-feed message (if !hasMore)
    └── Observer target (for infinite scroll)
```

---

## 🛠️ **Implementation Checklist**

### **Phase 1: Structure & Styling**
- [ ] Update `.home-page` background (gradient + consistency)
- [ ] Ensure `.home-container` max-width 670px
- [ ] Stories container styling (horizontal scroll, no scrollbar)
- [ ] Post card base styling (glassmorphism, borders, shadows)
- [ ] Responsive media queries (desktop, tablet, mobile)

### **Phase 2: Features**
- [ ] Stories carousel rendering (map over stories[])
- [ ] Story ring indicators (unviewed/viewed states)
- [ ] New posts banner (conditional render + animation)
- [ ] Posts feed mapping with correct data
- [ ] Media carousel (next/prev, indicators)
- [ ] Double-tap to like with heart animation

### **Phase 3: Interactions**
- [ ] Like button with optimistic updates
- [ ] Save/bookmark button with state
- [ ] Comment button opens modal
- [ ] Share button functionality
- [ ] Post options menu (owner-only)

### **Phase 4: Real-Time & Infinite Scroll**
- [ ] Real-time subscription (new posts)
- [ ] Infinite scroll observer
- [ ] Loading states (skeleton, spinner)
- [ ] Error handling & retry
- [ ] Empty/no-posts state

### **Phase 5: Polish & Accessibility**
- [ ] All buttons labeled for screen readers
- [ ] Keyboard navigation (Tab, Enter)
- [ ] Focus states visible (lavender rings)
- [ ] Color contrast verified (WCAG AA)
- [ ] Mobile testing on real devices

---

## 📋 **Required Data Structures**

### **Post Object**
```javascript
{
  id: string,
  user_id: string,
  caption: string,
  media_urls: string[],
  media_type: 'image' | 'video',
  location: string,
  created_at: ISO8601,
  users: {
    id: string,
    username: string,
    display_name: string,
    avatar_url: string,
    verified: boolean
  },
  likesCount: number,
  commentsCount: number,
  isLiked: boolean,
  isSaved: boolean,
  currentMediaIndex: number
}
```

### **Story Object**
```javascript
{
  id: string,
  user_id: string,
  media_url: string,
  created_at: ISO8601,
  users: {
    id: string,
    username: string,
    display_name: string,
    avatar_url: string,
    verified: boolean
  }
}
```

---

## 🎬 **Animation Library**

### **Keyframes to Include**
```css
/* Banner entrance */
@keyframes fadeInDown {
  0% { opacity: 0; transform: translateY(-24px); }
  100% { opacity: 1; transform: none; }
}

/* Skeleton loading pulse */
@keyframes skeleton-pulse {
  0% { opacity: 0.60; }
  100% { opacity: 1.0; }
}

/* Spinner rotation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Heart pop (optional, for double-tap like) */
@keyframes heartPop {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 0; }
}
```

---

## ✅ **Success Criteria**

1. **Visual Polish**
   - Lavender theme applied consistently across all elements
   - Glassmorphism effect on cards (blur, transparency)
   - Smooth transitions (0.12-0.36s) on all interactions
   - Proper spacing (28px gap between cards)

2. **Functionality**
   - Posts load and display correctly
   - Like/save/comment actions work in real-time
   - Infinite scroll loads more posts automatically
   - New posts notification appears when new content added
   - Error states handled gracefully with retry option

3. **Performance**
   - Initial load < 2 seconds
   - Infinite scroll smooth (no jank)
   - Optimistic updates feel instant
   - Loading skeletons show immediately

4. **Accessibility**
   - Keyboard navigation works
   - Screen reader labels on all buttons
   - Focus visible (lavender rings)
   - Color contrast meets WCAG AA
   - Touch targets ≥ 44px on mobile

5. **Responsive**
   - Desktop: Full layout with sidebar
   - Tablet: Adjusted spacing, visible sidebar
   - Mobile: Edge-to-edge feed, bottom navbar
   - All content readable at any size

---

## 🎯 **Next Steps**

1. **Review** this blueprint with team/stakeholder
2. **Verify** all Lavender theme colors are correct
3. **Code** Home.js component following this structure
4. **Test** each feature one-by-one (stories, posts, likes, etc.)
5. **Polish** animations and responsive behavior
6. **Audit** for accessibility and performance
7. **Deploy** with confidence! 🚀

---

**Ready to build? Let's go! 🚀**

