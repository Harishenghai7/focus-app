# InteractionBar Component - Quick Reference

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [❤️] 1.2K  [💬] 45  [➤]  12         2h ago  [🔖]          │
└─────────────────────────────────────────────────────────────┘
   ↑      ↑      ↑     ↑     ↑           ↑       ↑
  Like  Count  Comm  Comm  Share      Time    Save
       (click)     Count  Count
```

## Props Interface

```typescript
interface InteractionBarProps {
  contentId: string;              // Required
  contentType: 'post' | 'boltz' | 'flash';  // Required
  user: {                         // Optional
    id: string;
    username: string;
    // ...other user fields
  };
  contentData: {                  // Optional
    user_id: string;
    created_at: string;
    // ...other content fields
  };
}
```

## Hook Return Values

```javascript
const {
  likesCount,      // number
  commentsCount,   // number
  sharesCount,     // number
  isLiked,         // boolean
  loading,         // boolean
  toggleLike,      // () => Promise<void>
  // ...other methods
} = useRealtimeInteractions(contentId, contentType, user);
```

## Format Functions

```javascript
formatNumber(1234)      → "1.2K"
formatNumber(1234567)   → "1.2M"
formatNumber(42)        → "42"

formatDate(date, 'relative')  → "2h ago"
formatDate(date, 'short')     → "Nov 16"
formatDate(date, 'long')      → "November 16, 2025"
```

## Event Handlers

```javascript
handleLike()       // Toggle like with animation
handleComment()    // Open comments modal
handleShare()      // Open share modal
handleSave()       // Open save collections modal
handleLikesClick() // Show list of users who liked
```

## CSS Classes Quick Reference

| Class | Purpose |
|-------|---------|
| `.interactionBar` | Main container (flex, space-between) |
| `.leftActions` | Left button group |
| `.rightActions` | Right button group |
| `.actionBtn` | Individual buttons |
| `.actionBtn.liked` | Active like state (red) |
| `.actionBtn.saved` | Active save state |
| `.countBtn` | Clickable like count |
| `.count` | Static counts |
| `.timestamp` | Time display |
| `.likeBurst` | Heart animation |

## State Management

```javascript
// From Hook (Real-time)
likesCount      // Auto-updates via WebSocket
commentsCount   // Auto-updates via WebSocket
sharesCount     // Auto-updates via WebSocket
isLiked         // User's like status

// Local State
isSaved         // User's save status
showComments    // Comments modal visibility
showShare       // Share modal visibility
showSaveCollections // Save modal visibility
likeAnimation   // Animation trigger
```

## Modals Triggered

1. **InstagramCommentsModal**
   - Trigger: Click comment button
   - Props: `contentId`, `contentType`, `user`, `contentOwnerId`

2. **ShareModal**
   - Trigger: Click share button
   - Props: `contentData`, `user`

3. **SaveCollectionsModal**
   - Trigger: Click save button
   - Props: `contentId`, `contentType`, `user`

## Animation Specs

```javascript
// Button Tap Animation
whileTap={{ scale: 0.9 }}

// Like Burst Animation
initial={{ scale: 0, opacity: 1 }}
animate={{ scale: 2, opacity: 0 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.6 }}
```

## Responsive Breakpoints

```css
/* Mobile (< 768px) */
- Smaller button sizes (36x36 → 40x40)
- Reduced gaps (6px vs 8px)
- Smaller icons (20px vs 24px)
- Smaller fonts (11-13px vs 12-14px)

/* Desktop (≥ 768px) */
- Full-size buttons (40x40)
- Standard gaps (8-12px)
- Full icons (24px)
- Standard fonts (12-14px)
```

## Color Palette

```css
/* Light Mode */
--text-primary: #262626
--text-secondary: #737373
--like-color: #ff3040
--hover-bg: rgba(0,0,0,0.05)

/* Dark Mode */
--text-primary: #f5f5f5
--text-secondary: #a8a8a8
--like-color: #ff3040
--hover-bg: rgba(255,255,255,0.1)
```

## Integration Example

```jsx
// In PostCard.js
import InteractionBar from './InteractionBar';

function PostCard({ post, user }) {
  return (
    <div className={styles.postCard}>
      {/* ...other content */}
      
      <InteractionBar
        contentId={post.id}
        contentType="post"
        user={user}
        contentData={post}
      />
    </div>
  );
}
```

## Common Issues & Solutions

### Issue: Counts not updating
**Solution**: Check `useRealtimeInteractions` subscription

### Issue: Like button not working
**Solution**: Ensure `user` prop is provided

### Issue: Animation not showing
**Solution**: Verify framer-motion is installed

### Issue: Timestamp not displaying
**Solution**: Check `contentData.created_at` exists

---

**Quick Start**: Just pass `contentId`, `contentType`, and `user` - everything else is automatic! 🚀
