# 🚀 HOME PAGE - QUICK START GUIDE

## Getting Started in 5 Minutes

### Step 1: Verify Files Exist ✅

Check that these files were created/updated:
```bash
src/pages/Home.js              ✅ Main component
src/pages/Home.css             ✅ Styles
src/components/FocuslyButton.js ✅ AI button
src/components/FocuslyButton.css ✅ Button styles
```

### Step 2: Install Dependencies (if needed)

```bash
npm install framer-motion
# or
yarn add framer-motion
```

### Step 3: Run the App

```bash
npm start
# or
yarn start
```

Navigate to: `http://localhost:3000/`

---

## 🎯 Quick Test Checklist

### ✅ Visual Check
- [ ] Stories bar visible at top
- [ ] Posts loading with skeleton screens
- [ ] Posts display with images
- [ ] Focusly button floating bottom-right
- [ ] Purple gradient background visible

### ✅ Interaction Check
- [ ] Click like button → Heart turns red
- [ ] Click comment → Modal opens
- [ ] Click share → Share options appear
- [ ] Click save → Bookmark turns blue
- [ ] Double-tap post image → Heart animation
- [ ] Scroll down → More posts load

### ✅ Responsive Check
- [ ] Resize to mobile → Layout adapts
- [ ] Touch gestures work on mobile
- [ ] Pull down on mobile → Refresh triggered

### ✅ Accessibility Check
- [ ] Tab key navigates through elements
- [ ] Focus outlines visible
- [ ] Screen reader announces content

---

## 🐛 Troubleshooting

### Issue: Posts not loading
**Solution:**
1. Check Supabase connection in `.env`
2. Verify `posts` table exists
3. Check browser console for errors
4. Ensure user is authenticated

### Issue: Stories not showing
**Solution:**
1. Check `flash_stories` table exists
2. Verify Supabase real-time is enabled
3. Add test stories to database

### Issue: Infinite scroll not working
**Solution:**
1. Check `hasMore` state in console
2. Verify `lastPostRef` is attached
3. Check if `POSTS_PER_PAGE` is set correctly

### Issue: Focusly button not visible
**Solution:**
1. Check z-index in CSS (should be 998)
2. Verify image path: `/focusly-icon.png`
3. Check if button has `position: fixed`

### Issue: Styles not applying
**Solution:**
1. Verify `Home.css` is imported
2. Check for CSS conflicts
3. Clear browser cache
4. Check CSS specificity

---

## 🔧 Configuration Options

### Adjust Posts Per Page

```javascript
// In Home.js
const POSTS_PER_PAGE = 20; // Change from 10 to 20
```

### Change Refresh Intervals

```javascript
const FLASH_REFRESH_INTERVAL = 60000; // 1 minute
const NEW_POST_CHECK_INTERVAL = 30000; // 30 seconds
```

### Disable Pull-to-Refresh

```jsx
<PullToRefresh onRefresh={handlePullRefresh} disabled={true}>
```

### Hide Focusly Button

```jsx
<FocuslyButton 
  onClick={() => navigate('/focusly')}
  showPulse={false} // Remove pulse
/>
```

Or remove completely:
```jsx
{/* <FocuslyButton ... /> */}
```

---

## 📊 Database Schema Reference

### Required Tables

#### 1. `posts`
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  caption TEXT,
  media_urls TEXT[],
  media_type TEXT,
  location TEXT,
  created_at TIMESTAMP
);
```

#### 2. `post_likes`
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

#### 3. `comments`
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP
);
```

#### 4. `saved_posts`
```sql
CREATE TABLE saved_posts (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

#### 5. `follows`
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

---

## 🎨 Customization Examples

### Change Primary Color

```css
/* In Home.css */
.home-page {
  background: linear-gradient(to bottom right, 
    #1a1a2e 0%,    /* Change these */
    #16213e 64%,   /* colors to */
    #0f3460 100%   /* customize */
  );
}
```

### Adjust Post Card Border Radius

```css
.post-card {
  border-radius: 12px; /* Change from 22px */
}
```

### Modify Like Color

```css
.post-action-btn.liked svg {
  color: #ff6b6b !important; /* Change red */
  fill: #ff6b6b !important;
}
```

---

## 🔗 Component Props Reference

### PostCard Props

```javascript
<PostCard
  post={postObject}        // Required: Post data
  user={currentUser}       // Required: Current user
  mode="feed"              // Optional: 'feed' | 'grid' | 'detail'
  onLike={handleLike}      // Optional: Like callback
  onComment={handleComment} // Optional: Comment callback
  onShare={handleShare}    // Optional: Share callback
  onSave={handleSave}      // Optional: Save callback
  onFollow={handleFollow}  // Optional: Follow callback
/>
```

### FocuslyButton Props

```javascript
<FocuslyButton
  onClick={handleClick}    // Optional: Custom click handler
  showPulse={true}         // Optional: Show pulse animation
/>
```

### CommentModal Props

```javascript
<CommentModal
  isOpen={true}            // Required: Open state
  onClose={handleClose}    // Required: Close handler
  post={postObject}        // Required: Post data
  user={currentUser}       // Required: Current user
/>
```

---

## 📱 Device Testing

### Test on Different Devices

**Mobile (iPhone 13)**
- Width: 390px
- Test: Pull-to-refresh, touch gestures

**Tablet (iPad Air)**
- Width: 820px
- Test: Layout adaptation, touch targets

**Desktop (1920x1080)**
- Width: 1920px
- Test: Max-width centering, hover states

### Browser Testing

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE11 (not supported)

---

## 🎓 Learning Path

### For Beginners
1. Start with `Home.js` - understand component structure
2. Review `Home.css` - learn styling patterns
3. Study `PostCard.js` - see component composition
4. Explore hooks in `useInfiniteScroll.js`

### For Intermediate
1. Implement real-time subscriptions
2. Add error boundaries
3. Optimize with React.memo()
4. Add unit tests

### For Advanced
1. Implement virtualized scrolling
2. Add service worker for offline
3. Optimize bundle size
4. Add performance monitoring

---

## 📚 Additional Resources

### Documentation
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [React Hooks](https://react.dev/reference/react)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

### Related Files
- `HOME_PAGE_IMPLEMENTATION_GUIDE.md` - Full technical guide
- `🎨_HOME_PAGE_VISUAL_GUIDE.md` - Visual reference
- `✅_HOME_PAGE_COMPLETE.md` - Implementation summary

---

## ✅ Launch Checklist

Before deploying to production:

- [ ] All features tested
- [ ] Responsive on all devices
- [ ] Accessibility checked (WAVE, axe)
- [ ] Performance optimized (Lighthouse)
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Real-time working
- [ ] Database indexed
- [ ] Images optimized
- [ ] CDN configured
- [ ] Analytics added
- [ ] Monitoring setup

---

## 🎉 You're Ready!

The Home page is fully functional and ready to use. Enjoy your modern, Instagram-style social feed!

**Happy coding! 🚀**
