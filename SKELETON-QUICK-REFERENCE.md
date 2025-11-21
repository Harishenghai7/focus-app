# Skeleton Loaders - Quick Reference

## 🚀 Import

```javascript
import {
  PostSkeleton,
  PostListSkeleton,
  ProfileSkeleton,
  ProfileHeaderSkeleton,
  ProfileGridSkeleton,
  MessageSkeleton,
  ChatListSkeleton,
  ChatListItemSkeleton,
  ConversationSkeleton,
  CommentSkeleton,
  CommentSectionSkeleton,
  CommentInputSkeleton,
} from '../components/Skeleton';
```

---

## 📦 Components

### Posts
| Component | Use For | Props |
|-----------|---------|-------|
| `<PostSkeleton />` | Single post | `showActions`, `lines` |
| `<PostListSkeleton />` | Feed/list | `count` |

### Profile
| Component | Use For | Props |
|-----------|---------|-------|
| `<ProfileSkeleton />` | Full profile page | `showPostsGrid`, `postCount` |
| `<ProfileHeaderSkeleton />` | Just header | — |
| `<ProfileGridSkeleton />` | Just grid | `count` |

### Messages/Chat
| Component | Use For | Props |
|-----------|---------|-------|
| `<MessageSkeleton />` | Single message | `isCurrentUser` |
| `<ChatListSkeleton />` | Chat list | `count` |
| `<ChatListItemSkeleton />` | Single chat item | — |
| `<ConversationSkeleton />` | Chat thread | `messageCount` |

### Comments
| Component | Use For | Props |
|-----------|---------|-------|
| `<CommentSkeleton />` | Single comment | `isReply` |
| `<CommentSectionSkeleton />` | Comments section | `count`, `hasReplies` |
| `<CommentInputSkeleton />` | Comment input | — |

---

## ⚡ Quick Examples

### Basic
```javascript
if (isLoading) return <PostListSkeleton count={5} />;
return <PostList posts={posts} />;
```

### React Query
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['feed'],
  queryFn: fetchFeed,
});

return isLoading ? <PostListSkeleton /> : <PostList posts={data} />;
```

### Multiple Loading States
```javascript
return (
  <>
    {headerLoading ? <ProfileHeaderSkeleton /> : <Header />}
    {gridLoading ? <ProfileGridSkeleton /> : <Grid />}
  </>
);
```

### Minimum Display Time
```javascript
const [showSkeleton, setShowSkeleton] = useState(true);

useEffect(() => {
  if (!isLoading) {
    setTimeout(() => setShowSkeleton(false), 200);
  }
}, [isLoading]);

return showSkeleton ? <Skeleton /> : <Content />;
```

---

## 🎨 Styling

- **Animation:** 2s shimmer effect
- **Color:** Auto light/dark mode
- **Radius:** 4px lines, 50% avatars, 8px containers
- **CSS File:** `/src/components/styles/skeleton.css`

### Customize
```css
.skeleton-line {
  animation: skeleton-shimmer 1s infinite; /* Faster */
}
```

---

## ♿ Accessibility

✅ Respects `prefers-reduced-motion`
✅ No clickable elements
✅ Matches content structure
✅ Screen reader friendly

---

## 📋 Use Cases

| Scenario | Component |
|----------|-----------|
| Loading posts/feed | `<PostListSkeleton />` |
| Loading user profile | `<ProfileSkeleton />` |
| Loading chat messages | `<ConversationSkeleton />` |
| Loading chat list | `<ChatListSkeleton />` |
| Loading comments | `<CommentSectionSkeleton />` |
| Loading single post | `<PostSkeleton />` |

---

## 🔧 Common Patterns

### Feed Page
```javascript
{isLoading ? <PostListSkeleton count={5} /> : <PostList />}
```

### Profile Page
```javascript
{isLoading ? <ProfileSkeleton /> : <Profile />}
```

### Chat Page
```javascript
{isLoading ? <ConversationSkeleton /> : <Conversation />}
```

### Comments
```javascript
{isLoading ? <CommentSectionSkeleton /> : <Comments />}
```

---

## ⚠️ Tips

- ✅ Use exact skeleton type matching content
- ✅ Pass correct `count` prop
- ✅ Keep visible for ~200ms minimum
- ✅ Use for all data loading
- ✅ Replace "Loading..." text everywhere

- ❌ Don't mix skeleton types
- ❌ Don't show forever (< 2s ideal)
- ❌ Don't hide important sections
- ❌ Don't use for button clicks (use spinner)

---

## 📚 Full Guide

See `SKELETON-LOADERS-GUIDE.md` for complete documentation
See `SKELETON-INTEGRATION-PATTERNS.js` for 11+ code patterns
