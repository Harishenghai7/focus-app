# Skeleton Loaders System

## Overview

The Skeleton Loaders system provides beautiful, reusable loading states throughout the Focus App. Replace "Loading..." text with elegant animated skeleton screens that match your content structure.

## Files

```
/src/components/Skeleton/
├── PostSkeleton.js           # Post card skeletons
├── ProfileSkeleton.js        # Profile page skeletons
├── MessageSkeleton.js        # Chat/message skeletons
├── CommentSkeleton.js        # Comment section skeletons
├── index.js                  # Exports all components
└── ../styles/skeleton.css    # All skeleton styles
```

---

## Components

### PostSkeleton

**Loading skeleton for post cards**

#### `<PostSkeleton />`
Single post skeleton with all elements

**Props:**
- `showActions` (boolean) - Show action buttons skeleton. Default: `true`
- `lines` (number) - Number of text lines. Default: `3`

**Usage:**
```javascript
import { PostSkeleton, PostListSkeleton } from '../components/Skeleton';

// Single post loading
function PostPage({ isLoading }) {
  return isLoading ? <PostSkeleton /> : <Post {...post} />;
}

// Multiple posts loading
function FeedPage({ isLoading }) {
  return isLoading ? <PostListSkeleton count={5} /> : <PostList posts={posts} />;
}
```

#### `<PostListSkeleton />`
Multiple post skeletons in a list

**Props:**
- `count` (number) - Number of skeletons to show. Default: `3`

**Visual Structure:**
```
┌─────────────────────────────────┐
│ [Avatar] Name          [Time]   │  <- Header
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│      [Image/Content Area]       │  <- Media
│                                 │
│ Lorem ipsum dolor sit amet... ┃ │  <- Text
│ Consectetur adipiscing elit   │
│ Sed do eiusmod tempor incididunt│
│                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 💬 123    ❤️ 456    📤 789    │  <- Stats
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [Like] [Comment] [Share] [More]│  <- Actions
└─────────────────────────────────┘
```

---

### ProfileSkeleton

**Loading skeleton for profile pages**

#### `<ProfileSkeleton />`
Complete profile skeleton with header and posts grid

**Props:**
- `showPostsGrid` (boolean) - Show posts grid. Default: `true`
- `postCount` (number) - Number of grid items. Default: `6`

**Usage:**
```javascript
import { ProfileSkeleton, ProfileHeaderSkeleton } from '../components/Skeleton';

function ProfilePage({ userId, isLoading }) {
  if (isLoading) return <ProfileSkeleton postCount={9} />;
  
  return <Profile userId={userId} />;
}
```

#### `<ProfileHeaderSkeleton />`
Just the profile header skeleton

**Usage:**
```javascript
// When loading profile info only
<ProfileHeaderSkeleton />
```

#### `<ProfileGridSkeleton />`
Just the posts grid skeleton

**Props:**
- `count` (number) - Number of grid items. Default: `6`

**Usage:**
```javascript
// When loading grid separately
<ProfileGridSkeleton count={12} />
```

**Visual Structure:**
```
┌──────────────────────────────────────┐
│  [  Cover Image  ]                   │
│  ┌────────────────────────────────┐  │
│  │        [Avatar]                │  │
│  │      John Doe                  │  │
│  │      @johndoe                  │  │
│  │      Software Developer        │  │
│  │                                │  │
│  │ Posts 234  Following 1.2K      │  │
│  │ Followers 5.6K                 │  │
│  │                                │  │
│  │  [Follow Button] [Message]     │  │
│  └────────────────────────────────┘  │
│                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ Post │ │ Post │ │ Post │         │
│  └──────┘ └──────┘ └──────┘         │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ Post │ │ Post │ │ Post │         │
│  └──────┘ └──────┘ └──────┘         │
└──────────────────────────────────────┘
```

---

### MessageSkeleton

**Loading skeletons for chat and messages**

#### `<MessageSkeleton />`
Single message skeleton

**Props:**
- `isCurrentUser` (boolean) - Align right if current user. Default: `false`

**Usage:**
```javascript
import { 
  MessageSkeleton, 
  ChatListItemSkeleton,
  ConversationSkeleton 
} from '../components/Skeleton';

// Single message
<MessageSkeleton isCurrentUser={false} />

// Current user message
<MessageSkeleton isCurrentUser={true} />
```

#### `<ChatListItemSkeleton />`
Chat thread item in chat list

**Visual Structure:**
```
┌──────────────────────────────────┐
│ [Avatar] John Doe        2:30 PM  │  <- Name & time
│ Hey, how are you doing today?  ✓✓ │  <- Last message & badge
└──────────────────────────────────┘
```

**Usage:**
```javascript
<ChatListSkeleton count={5} />
```

#### `<ChatListSkeleton />`
Multiple chat items

**Props:**
- `count` (number) - Number of chat items. Default: `5`

#### `<ConversationSkeleton />`
Full conversation with multiple messages and input

**Props:**
- `messageCount` (number) - Number of message skeletons. Default: `5`

**Usage:**
```javascript
function ChatPage({ isLoading }) {
  if (isLoading) return <ConversationSkeleton messageCount={8} />;
  
  return <Conversation threadId={threadId} />;
}
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│                                 │
│          [Message 1]            │  (Right aligned if current user)
│                                 │
│ [Message 2 Avatar]              │
│ Here's a longer message         │
│ that spans multiple lines...    │
│                                 │
│ [Message 3 Avatar]              │
│ Short msg                       │
│                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Avatar] [   Message Input   ] │
└─────────────────────────────────┘
```

---

### CommentSkeleton

**Loading skeletons for comments**

#### `<CommentSkeleton />`
Single comment skeleton

**Props:**
- `isReply` (boolean) - Indent for nested reply. Default: `false`

**Usage:**
```javascript
import {
  CommentSkeleton,
  CommentSectionSkeleton,
  CommentInputSkeleton
} from '../components/Skeleton';

// Single comment
<CommentSkeleton />

// Reply comment (indented)
<CommentSkeleton isReply={true} />
```

#### `<CommentSectionSkeleton />`
Full comment section with main comments and replies

**Props:**
- `count` (number) - Number of top-level comments. Default: `4`
- `hasReplies` (boolean) - Show reply skeletons. Default: `true`

**Usage:**
```javascript
function PostComments({ postId, isLoading }) {
  if (isLoading) return <CommentSectionSkeleton count={5} />;
  
  return <CommentSection postId={postId} />;
}
```

#### `<CommentInputSkeleton />`
Comment input field skeleton

**Usage:**
```javascript
// Loading comment form
<CommentInputSkeleton />
```

**Visual Structure:**
```
┌──────────────────────────────────┐
│ [Avatar] John Doe       2 hours   │  <- Comment
│ This is a great post! Love the..  │
│ [👍 Like] [Reply] [More]          │
│                                   │
│   ├─ [Avatar] Jane Smith 1 hour   │  <- Reply (indented)
│   │  Thanks for sharing! I agree  │
│   │  [👍 Like] [Reply] [More]    │
│   │                              │
│   └─ [Avatar] Bob Wilson 30 min   │
│      Awesome content!             │
│      [👍 Like] [Reply] [More]    │
│                                   │
│ [Avatar] [Write a comment...   ] │  <- Input
└──────────────────────────────────┘
```

---

## Integration Examples

### Feed Page
```javascript
import { PostListSkeleton } from '../components/Skeleton';
import { useQuery } from '@tanstack/react-query';

function FeedPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
  });

  if (isLoading) {
    return <PostListSkeleton count={5} />;
  }

  return (
    <div className="feed">
      {posts.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Profile Page
```javascript
import { ProfileSkeleton } from '../components/Skeleton';

function UserProfile({ userId }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
  });

  if (isLoading) {
    return <ProfileSkeleton postCount={9} />;
  }

  return (
    <div>
      <ProfileHeader profile={profile} />
      <PostsGrid posts={profile.posts} />
    </div>
  );
}
```

### Chat Conversation
```javascript
import { ConversationSkeleton } from '../components/Skeleton';

function ChatThread({ threadId }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat', threadId],
    queryFn: () => fetchMessages(threadId),
  });

  if (isLoading) {
    return <ConversationSkeleton messageCount={10} />;
  }

  return (
    <div className="conversation">
      <MessageList messages={messages} />
      <MessageInput threadId={threadId} />
    </div>
  );
}
```

### Post With Comments
```javascript
import { CommentSectionSkeleton } from '../components/Skeleton';

function PostDetail({ postId }) {
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    enabled: !!post,
  });

  return (
    <div>
      {postLoading ? <PostSkeleton /> : <Post post={post} />}
      
      <Divider />
      
      {commentsLoading ? (
        <CommentSectionSkeleton count={6} />
      ) : (
        <CommentSection comments={comments} />
      )}
    </div>
  );
}
```

### Chat List
```javascript
import { ChatListSkeleton } from '../components/Skeleton';

function ChatsPage() {
  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  });

  if (isLoading) {
    return <ChatListSkeleton count={10} />;
  }

  return (
    <div className="chat-list">
      {chats.map(chat => (
        <ChatItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
}
```

---

## Styling

All skeleton styles are in `/src/components/styles/skeleton.css`

### Default Styling
- **Shimmer animation:** 2s infinite loop
- **Border radius:** 4px for lines, 50% for avatars, 8px for larger elements
- **Color:** Light gray (`#f0f0f0`) with gradient animation
- **Dark mode:** Automatically switches to darker colors

### Customization
```css
/* Change shimmer speed */
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-line {
  animation: skeleton-shimmer 1.5s infinite; /* Faster */
}

/* Change skeleton color */
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

## Performance Tips

1. **Use exact count:** Pass the actual count of items you expect
   ```javascript
   <PostListSkeleton count={5} /> // Good: Shows 5 skeletons
   ```

2. **Avoid rapid transitions:** Keep skeleton visible for at least 200ms
   ```javascript
   const [isLoading, setIsLoading] = useState(true);
   
   // Good: Minimum visible time
   setTimeout(() => setIsLoading(false), 200);
   ```

3. **Progressive loading:** Show skeletal data as it loads
   ```javascript
   // Show header first, then content
   <ProfileHeaderSkeleton />
   <ProfileGridSkeleton count={3} /> // Show fewer initially
   ```

4. **Lazy load skeletons:** Only render when needed
   ```javascript
   {isLoading && <PostListSkeleton count={itemsPerPage} />}
   ```

---

## Accessibility

- ✅ Respects `prefers-reduced-motion` - shimmer animation disables automatically
- ✅ No interactive elements - can't be accidentally clicked
- ✅ Semantic structure - matches actual content layout
- ✅ Screen readers - skeletons are decorative, won't be read aloud

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

## Best Practices

✅ **DO:**
- Use exact skeleton component matching your content
- Keep skeleton visible while loading
- Show realistic structure (don't hide important sections)
- Use for all data loading states
- Combine with actual error states

❌ **DON'T:**
- Mix different skeleton types (consistency)
- Show skeletons longer than necessary (aim for < 2s)
- Hide important UI with skeletons
- Use for all loading states (e.g., button clicks can use spinners)
- Show empty skeletons without loading indicator

---

## Examples in Action

### Before (Bad)
```javascript
function Feed() {
  if (isLoading) return <div>Loading...</div>; // ❌ Boring!
  return <PostList posts={posts} />;
}
```

### After (Good)
```javascript
function Feed() {
  if (isLoading) return <PostListSkeleton count={5} />; // ✅ Beautiful!
  return <PostList posts={posts} />;
}
```

Replace all "Loading..." text with these gorgeous skeleton loaders!
