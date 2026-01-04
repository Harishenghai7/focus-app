# 🚀 PRO-GRADE COMMENT SYSTEM - Implementation Plan

## Overview:
Building Instagram-level comment system with:
- ✅ Nested replies (threads)
- ✅ Like comments
- ✅ Tag users (@mentions)
- ✅ Real-time updates
- ✅ Load more pagination
- ✅ Delete/Edit own comments
- ✅ Report comments
- ✅ Pin comments (post owner)
- ✅ Separate Flash comments (like Instagram stories)

---

## Database Schema:

### Comments Table:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_comments_post ON comments(post_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_boltz ON comments(boltz_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_flash ON comments(flash_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE deleted_at IS NULL;
```

### Comment Likes Table:
```sql
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
```

---

## Components to Create:

### 1. CommentsSection.js (Main)
- Displays all comments
- Add new comment input
- Load more pagination
- Real-time updates

### 2. CommentItem.js
- Single comment display
- Like button
- Reply button
- Options menu (edit/delete/report/pin)
- Nested replies

### 3. CommentInput.js
- Text input with @mentions
- Character counter
- Submit button
- Loading state

### 4. FlashComments.js (Special)
- Horizontal swipe interface
- Quick reactions
- Disappears with flash

---

## Features to Implement:

### Core Features:
1. ✅ Post comment
2. ✅ Reply to comment (nested)
3. ✅ Like comment
4. ✅ Delete own comment
5. ✅ Edit own comment (5 min window)
6. ✅ Pin comment (post owner only)
7. ✅ Load more (pagination)
8. ✅ Real-time updates

### Advanced Features:
9. ✅ @mention users (autocomplete)
10. ✅ Link detection
11. ✅ Emoji support
12. ✅ Report comment
13. ✅ Block user from comments
14. ✅ Sort comments (Top/Newest/Oldest)
15. ✅ View all replies
16. ✅ Collapse threads

---

## API Endpoints Needed:

### Comments:
- `GET /comments?post_id=eq.{id}` - Fetch comments
- `POST /comments` - Create comment
- `PATCH /comments?id=eq.{id}` - Update comment
- `DELETE /comments?id=eq.{id}` - Delete comment

### Comment Likes:
- `POST /comment_likes` - Like comment
- `DELETE /comment_likes?comment_id=eq.{id}&user_id=eq.{uid}` - Unlike

---

## Implementation Steps:

### Phase 1: Database & API (15 min)
1. Create comments table
2. Create comment_likes table
3. Set up RLS policies
4. Test API endpoints

### Phase 2: Core Components (30 min)
1. Create CommentsSection component
2. Create CommentItem component
3. Create CommentInput component
4. Basic styling

### Phase 3: Features (30 min)
1. Add comment posting
2. Add replies
3. Add likes
4. Add delete/edit
5. Add pagination

### Phase 4: Advanced (20 min)
1. Add @mentions
2. Add pinning
3. Add sorting
4. Add real-time updates

### Phase 5: Flash Comments (15 min)
1. Create FlashComments component
2. Special UI for flash
3. Auto-delete with flash

---

## Total Time: ~2 hours for complete system

Let's start! 🚀
