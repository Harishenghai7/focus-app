# 🎯 SKELETON LOADERS - ONE-PAGE CHEAT SHEET

## 🚀 QUICK START (Copy & Paste)

```javascript
// 1. IMPORT
import { PostListSkeleton } from '../components/Skeleton';

// 2. USE IN COMPONENT
if (isLoading) return <PostListSkeleton count={5} />;

// 3. DONE!
```

---

## 📦 ALL COMPONENTS

```javascript
// POSTS
<PostSkeleton />                          // Single post
<PostListSkeleton count={5} />            // Feed (5 posts)

// PROFILE  
<ProfileSkeleton postCount={9} />         // Full page
<ProfileHeaderSkeleton />                 // Just header
<ProfileGridSkeleton count={6} />         // Just grid

// MESSAGES
<MessageSkeleton isCurrentUser={false} /> // Message
<ChatListSkeleton count={10} />           // Chat list
<ConversationSkeleton messageCount={8} /> // Thread

// COMMENTS
<CommentSkeleton isReply={false} />       // Comment
<CommentSectionSkeleton count={5} />      // All comments
<CommentInputSkeleton />                  // Input field
```

---

## 🎨 IMPORT STATEMENT

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

## 🔧 COMMON PATTERNS

### Feed Page
```javascript
if (isLoading) return <PostListSkeleton count={5} />;
return <PostList posts={posts} />;
```

### Profile Page
```javascript
if (isLoading) return <ProfileSkeleton postCount={9} />;
return <Profile profile={profile} />;
```

### Chat Thread
```javascript
if (isLoading) return <ConversationSkeleton messageCount={10} />;
return <Conversation messages={messages} />;
```

### Comments
```javascript
if (isLoading) return <CommentSectionSkeleton count={5} />;
return <Comments comments={comments} />;
```

---

## 📊 PROPS REFERENCE

| Component | Props | Default |
|-----------|-------|---------|
| `PostSkeleton` | `showActions`, `lines` | `true`, `3` |
| `PostListSkeleton` | `count` | `3` |
| `ProfileSkeleton` | `showPostsGrid`, `postCount` | `true`, `6` |
| `ProfileGridSkeleton` | `count` | `6` |
| `ChatListSkeleton` | `count` | `5` |
| `ConversationSkeleton` | `messageCount` | `5` |
| `MessageSkeleton` | `isCurrentUser` | `false` |
| `CommentSectionSkeleton` | `count`, `hasReplies` | `4`, `true` |

---

## 🎯 USE CASES

| Need | Component | Code |
|------|-----------|------|
| Feed loading | `PostListSkeleton` | `<PostListSkeleton count={5} />` |
| Profile | `ProfileSkeleton` | `<ProfileSkeleton />` |
| Chat list | `ChatListSkeleton` | `<ChatListSkeleton count={10} />` |
| Chat thread | `ConversationSkeleton` | `<ConversationSkeleton />` |
| Comments | `CommentSectionSkeleton` | `<CommentSectionSkeleton />` |

---

## 📋 IMPLEMENTATION STEPS

1. **Find loading state**
   ```bash
   grep -r "Loading" src/
   ```

2. **Add import**
   ```javascript
   import { PostListSkeleton } from '../components/Skeleton';
   ```

3. **Replace code**
   ```javascript
   // Before
   if (isLoading) return <div>Loading...</div>;
   
   // After
   if (isLoading) return <PostListSkeleton count={5} />;
   ```

4. **Test** - Visit page while loading
5. **Commit** - Save changes

---

## ✅ KEY POINTS

✅ Use exact skeleton for your content type
✅ Pass correct count prop
✅ Keep visible ~200ms minimum
✅ Works on desktop and mobile
✅ Dark mode automatic
✅ Accessibility compliant

---

## 📚 DOCUMENTATION

| File | Purpose |
|------|---------|
| `SKELETON-QUICK-REFERENCE.md` | Quick lookup |
| `SKELETON-LOADERS-GUIDE.md` | Full documentation |
| `SKELETON-INTEGRATION-PATTERNS.js` | Code examples |
| `SKELETON-BEFORE-AFTER-GUIDE.md` | Visual comparisons |
| `SkeletonShowcase.js` | Live component demo |

---

## 🌍 BROWSER SUPPORT

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers

---

## 🎨 CUSTOMIZE (CSS)

```css
/* Change speed */
.skeleton-line {
  animation: skeleton-shimmer 1.5s infinite; /* was 2s */
}

/* Change color */
.skeleton-line {
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #d0d0d0 50%,
    #e0e0e0 75%
  );
}
```

---

## ⚠️ COMMON MISTAKES

❌ Wrong count (use actual number of items)
❌ Wrong skeleton type (match content type)
❌ Forgetting import statement
❌ Using generic spinner instead
❌ Not testing on mobile

---

## 🚀 NEXT STEPS

1. Read `SKELETON-QUICK-REFERENCE.md`
2. Visit `/skeleton-showcase` route
3. Copy one pattern
4. Integrate into your component
5. Test and deploy
6. Celebrate! 🎉

---

## 📞 QUICK HELP

**Question:** What component for posts?
**Answer:** `<PostListSkeleton count={5} />`

**Question:** What component for profile?
**Answer:** `<ProfileSkeleton />`

**Question:** What component for chat?
**Answer:** `<ConversationSkeleton />`

**Question:** How to customize?
**Answer:** Edit `/src/components/styles/skeleton.css`

---

## 💡 PRO TIPS

```javascript
// Tip 1: Minimum display time
const [show, setShow] = useState(true);
useEffect(() => {
  if (!isLoading) setTimeout(() => setShow(false), 200);
}, [isLoading]);
return show ? <Skeleton /> : <Content />;

// Tip 2: Get correct count
<PostListSkeleton count={itemsPerPage} />

// Tip 3: Progressive loading
{headerLoading ? <Header /> : null}
{contentLoading ? <Content /> : null}
```

---

## 📦 FILE LOCATIONS

- Components: `/src/components/Skeleton/`
- Styles: `/src/components/styles/skeleton.css`
- Guide: `SKELETON-LOADERS-GUIDE.md`
- Reference: `SKELETON-QUICK-REFERENCE.md`
- Patterns: `SKELETON-INTEGRATION-PATTERNS.js`
- Showcase: `/skeleton-showcase` route

---

## ✨ FEATURES

✅ Beautiful shimmer animation
✅ Dark mode automatic
✅ Mobile responsive
✅ Accessibility built-in
✅ Zero dependencies
✅ Production ready
✅ Easy customization

---

## 🎊 YOU'RE READY!

You have everything you need to:
- Replace all "Loading..." text
- Create beautiful loading states
- Improve user experience
- Deploy with confidence

**Now go make those skeletons dance!** 💃

---

*Print this page or bookmark it for quick reference!*  
*Complete guide: See SKELETON-LOADERS-GUIDE.md*  
*Questions? Check documentation files*

