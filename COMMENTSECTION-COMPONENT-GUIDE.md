# CommentSection Component Guide

## Overview
Advanced nested comment system with real-time updates, likes, sorting, and pinning functionality.

## Features Implemented ✅

### Core Features
- ✅ **Nested Comment List** - Threaded replies with expandable/collapsible threads
- ✅ **Add Comment Input** - With character counter (500 max) and validation
- ✅ **Like Comment** - Optimistic updates with heart icon toggle
- ✅ **Reply to Comment** - Nested reply system with @mentions
- ✅ **Load More Comments** - Pagination with 10 comments per page
- ✅ **Sort By** - Top (most liked), Recent (newest), Oldest
- ✅ **Pin Comment** - Author-only feature to pin important comments

### Advanced Features
- ✅ **Real-time Updates** - Using useRealtimeInteractions hook
- ✅ **Linkify URLs** - Auto-convert URLs to clickable links
- ✅ **Delete Comments** - Users can delete their own comments
- ✅ **Verified Badge** - Shows verification checkmark for verified users
- ✅ **Pinned Badge** - Visual indicator for pinned comments
- ✅ **Character Counter** - Real-time character count display
- ✅ **Optimistic Updates** - Instant UI feedback for likes
- ✅ **Loading States** - Skeleton/spinner for async operations
- ✅ **Empty States** - Friendly messages when no comments exist
- ✅ **Responsive Design** - Mobile-optimized layout
- ✅ **Dark Mode Support** - Automatic theme switching
- ✅ **Accessibility** - ARIA labels, keyboard navigation, focus management

## Props

```javascript
<CommentSection 
  contentId={string}      // Required: Unique content identifier
  contentType={string}    // Optional: 'post' | 'boltz' | 'flash' (default: 'post')
  user={object}          // Required: Current user object with id, username, avatar_url
/>
```

## Usage Examples

### Basic Usage
```javascript
import CommentSection from './components/CommentSection';

function PostDetail({ post, user }) {
  return (
    <div>
      <PostContent post={post} />
      <CommentSection 
        contentId={post.id}
        contentType="post"
        user={user}
      />
    </div>
  );
}
```

### With Boltz Content
```javascript
<CommentSection 
  contentId={boltz.id}
  contentType="boltz"
  user={currentUser}
/>
```

### With Flash Content
```javascript
<CommentSection 
  contentId={flash.id}
  contentType="flash"
  user={currentUser}
/>
```

## Component Structure

```
CommentSection/
├── Header
│   ├── Title with count
│   └── Sort buttons (Recent/Top/Oldest)
├── Comment Form
│   ├── Reply indicator (if replying)
│   ├── Textarea input
│   └── Character counter + Submit button
├── Comments List
│   ├── Comment Item
│   │   ├── Pinned badge (if pinned)
│   │   ├── Avatar
│   │   ├── Username + Verified badge
│   │   ├── Timestamp
│   │   ├── Comment text (linkified)
│   │   ├── Actions (Like, Reply, Pin, Delete)
│   │   └── Replies (nested)
│   └── Load More button
└── Empty/Loading states
```

## Key Features Detail

### 1. Nested Comments (Threaded)
- Parent comments displayed at top level
- Replies indented with left border
- "View X replies" button to expand/collapse
- Maximum 1 level of nesting (replies to replies shown inline)

### 2. Like System
- Heart icon (🤍 unliked, ❤️ liked)
- Like count displayed next to icon
- Optimistic updates for instant feedback
- Reverts on error
- Works on both parent comments and replies

### 3. Sorting Options
- **Recent**: Newest comments first (pinned always on top)
- **Top**: Most liked comments first (pinned always on top)
- **Oldest**: Oldest comments first (pinned always on top)
- Fetches fresh data on sort change

### 4. Pin Feature
- Only content author can pin/unpin comments
- Pinned comments always appear first
- Visual "📌 Pinned by author" badge
- Different background color for pinned comments
- Pin button only visible to content author

### 5. Reply System
- Click "Reply" to enter reply mode
- Auto-fills @username in textarea
- Shows "Replying to comment" indicator
- Can cancel reply mode
- Replies appear nested under parent

### 6. Pagination
- Initial load: 10 comments
- "Load More Comments" button
- Loads 10 more on each click
- Button hidden when all loaded
- Preserves scroll position

### 7. Character Limit
- 500 character maximum
- Real-time counter display
- Submit button disabled when empty/over limit
- Visual feedback as approaching limit

### 8. Delete Function
- Users can delete their own comments
- Confirmation dialog before deletion
- Removes from UI optimistically
- Works for both parent comments and replies
- Trash icon (🗑️) only visible on own comments

## Hooks Used

### useRealtimeInteractions
```javascript
const {
  commentsCount,    // Total comments count
  addComment,       // Add new comment function
  refreshInteractions  // Manual refresh
} = useRealtimeInteractions(contentId, contentType, user);
```

## Utils Used

### formatDate
```javascript
import { formatDate } from '../utils/formatters/formatDate';

// Formats: 'relative', 'short', 'long', or locale
formatDate(date, 'relative');  // "2m ago", "5h ago", "3d ago"
```

### linkify
```javascript
import linkify from '../utils/data/linkify';

// Converts URLs to clickable links
linkify('Visit https://example.com')  
// Returns: 'Visit <a href="https://example.com">https://example.com</a>'
```

## Database Schema

### Comments Table
```sql
comments (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  content_id uuid NOT NULL,
  content_type text NOT NULL,  -- 'post' | 'boltz' | 'flash'
  text text NOT NULL,
  parent_comment_id uuid REFERENCES comments(id),
  is_pinned boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### Likes Table
```sql
likes (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  comment_id uuid REFERENCES comments(id),
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, comment_id)
)
```

## Styling

### CSS Variables Used
- Layout: `--space-*`, `--radius-*`
- Colors: `--color-bg-*`, `--color-text-*`, `--color-border-*`
- Typography: `--font-size-*`, `--font-weight-*`
- Transitions: `--transition-*`
- Shadows: `--shadow-*`

### Responsive Breakpoints
- Mobile: < 768px
  - Reduced padding
  - Stacked header layout
  - Smaller avatars
  - Full-width sort buttons

### Dark Mode
- Automatic detection via `prefers-color-scheme`
- Dark color variants applied
- Maintains readability and contrast

## Accessibility Features

### ARIA Labels
- Input fields labeled
- Buttons have descriptive labels
- Timestamps have full date in title
- Actions clearly described

### Keyboard Navigation
- All interactive elements focusable
- Tab order logical
- Enter to submit forms
- Escape to cancel (if implemented)

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Alternative text for images
- Status announcements for actions

### Reduced Motion
- Respects `prefers-reduced-motion`
- Disables animations when requested
- Instant transitions

## Performance Optimizations

### React.memo
- Component wrapped in React.memo
- Prevents unnecessary re-renders
- Only updates when props change

### Callback Memoization
- All handlers wrapped in useCallback
- Prevents function recreation
- Optimizes child component updates

### Optimistic Updates
- Instant UI feedback for likes
- Reverts on error
- Improves perceived performance

### Lazy Loading
- Comments loaded on demand
- Replies only fetched when expanded
- Images lazy-loaded

### Safety Checks
```javascript
// Always use safety operators
(comments || []).map(...)
comment.profiles?.username || 'User'
```

## Error Handling

### Try-Catch Blocks
- All async operations wrapped
- Errors logged to console
- User-friendly error messages
- Graceful fallbacks

### Loading States
- Spinner while fetching
- Disabled buttons during submission
- Loading text for clarity

### Empty States
- Friendly "No comments yet" message
- Encourages first comment
- Clear call-to-action

## Real-time Features

### Automatic Updates
- Comments count updates live
- New comments appear automatically
- Likes sync across users
- No page refresh needed

### Subscription Management
- Cleans up on unmount
- Prevents memory leaks
- Handles multiple subscriptions

## Best Practices

### Data Safety
```javascript
// Always check for null/undefined
(comments || []).map(...)
comment?.profiles?.username
replies[commentId] || []
```

### Type Validation
- PropTypes defined
- Required props enforced
- Shape validation for objects

### Code Organization
- Logical grouping of state
- Handlers near related code
- Utils in separate files
- CSS modules for scoping

## Testing Checklist

### Functionality
- [ ] Can add top-level comment
- [ ] Can reply to comment
- [ ] Can like/unlike comment
- [ ] Can delete own comment
- [ ] Can pin/unpin (if author)
- [ ] Sorting works correctly
- [ ] Pagination loads more
- [ ] Character counter accurate
- [ ] Links are clickified

### UI/UX
- [ ] Smooth animations
- [ ] Loading states clear
- [ ] Empty states helpful
- [ ] Responsive on mobile
- [ ] Dark mode works
- [ ] Focus visible
- [ ] Hover states clear

### Edge Cases
- [ ] No user (logged out)
- [ ] No comments
- [ ] Very long text
- [ ] Many nested replies
- [ ] Slow network
- [ ] Deleted user

## Common Issues & Solutions

### Issue: Comments not loading
**Solution**: Check contentId and contentType are correct

### Issue: Can't like comments
**Solution**: Ensure user prop is passed and has valid id

### Issue: Pin button not showing
**Solution**: Verify user.id matches content author_id

### Issue: Replies not expanding
**Solution**: Check parent_comment_id in database

### Issue: Character counter wrong
**Solution**: Use .length on string, not textarea value

## Future Enhancements

### Potential Features
- [ ] Edit comments (with edit history)
- [ ] Report/flag comments
- [ ] Mentions autocomplete
- [ ] Emoji picker
- [ ] GIF support
- [ ] Image attachments
- [ ] Comment reactions (beyond like)
- [ ] Sort by controversial
- [ ] Hide/minimize threads
- [ ] Notification on reply
- [ ] Comment search/filter
- [ ] Threaded email notifications
- [ ] Markdown support
- [ ] Code syntax highlighting
- [ ] Quote replies
- [ ] Multi-level threading (>2 levels)

## Related Components
- `InteractionBar.js` - Main interaction controls
- `ShareModal.js` - Share content
- `InstagramCommentsModal.js` - Alternative comment UI

## Related Hooks
- `useRealtimeInteractions.js` - Real-time data management
- Custom hooks for notifications (future)

## Related Utils
- `formatDate.js` - Date formatting
- `linkify.js` - URL conversion
- `formatNumber.js` - Number formatting (for counts)

## File Structure
```
src/
├── components/
│   ├── CommentSection.js           (Component logic)
│   └── CommentSection.module.css   (Component styles)
├── hooks/
│   └── useRealtimeInteractions.js  (Real-time hook)
└── utils/
    ├── formatters/
    │   └── formatDate.js           (Date formatting)
    └── data/
        └── linkify.js              (URL linkification)
```

## Version History
- v1.0.0 - Initial implementation with all core features
- Full feature parity with prompt P10-C requirements

---

**Created**: November 16, 2025  
**Status**: ✅ Complete - All features implemented  
**Component Type**: React Functional Component with Hooks  
**Framework**: React 18+ with Framer Motion
