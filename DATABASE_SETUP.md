# Database Setup Guide - Focus App Fixes

## Quick Setup (Copy & Paste)

### Step 1: Run SQL Files in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query

#### 1.1 Realtime Functions (Run First)
```sql
-- Copy contents from: database/realtime_functions.sql
-- This creates RPC functions for likes, saves, and comments
```

#### 1.2 Notifications Schema
```sql
-- Copy contents from: database/notifications_schema.sql
-- This creates notifications table and triggers
```

#### 1.3 Settings Schema
```sql
-- Copy contents from: database/settings_schema.sql
-- This creates user_settings table
```

### Step 2: Enable Realtime Replication

1. Go to **Database** → **Replication**
2. Enable realtime for these tables:
   - ✅ `posts`
   - ✅ `boltz`
   - ✅ `notifications`
   - ✅ `messages`
   - ✅ `post_likes`
   - ✅ `post_comments`
   - ✅ `boltz_likes`
   - ✅ `boltz_comments`

### Step 3: Add Performance Indexes

```sql
-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read, created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(chat_id, status);
```

### Step 4: Verify Installation

Run this query to check if everything is set up:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notifications', 'user_settings');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%post_like%';

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'notify%';
```

Expected results:
- 2 tables (notifications, user_settings)
- 4+ functions (increment/decrement likes)
- 6+ triggers (notify on like/comment/follow)

## Testing the Setup

### Test 1: Like a Post
```javascript
// In browser console
const { data, error } = await supabase.rpc('increment_post_like', {
  p_post_id: 'YOUR_POST_ID',
  p_user_id: 'YOUR_USER_ID'
});
console.log('Result:', data);
```

### Test 2: Check Notifications
```javascript
// Should see notification for the like
const { data } = await supabase
  .from('notifications')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);
console.log('Recent notifications:', data);
```

### Test 3: Settings Persistence
```javascript
// Save a setting
const { data } = await supabase
  .from('user_settings')
  .upsert({
    user_id: 'YOUR_USER_ID',
    settings: { theme: 'dark', notifications: true }
  });
console.log('Saved settings:', data);
```

## Troubleshooting

### Issue: RPC function not found
**Solution:** Make sure you ran `realtime_functions.sql` completely

### Issue: Notifications not appearing
**Solution:** 
1. Check if realtime is enabled for `notifications` table
2. Verify triggers are created: `SELECT * FROM pg_trigger WHERE tgname LIKE 'notify%';`

### Issue: Settings not saving
**Solution:** Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'user_settings';`

## Next Steps

After database setup is complete:

1. ✅ Restart your development server
2. ✅ Test home page loading (should be faster)
3. ✅ Test liking a post (should update instantly)
4. ✅ Check notifications (should appear in real-time)
5. ✅ Test settings persistence (should survive page refresh)
6. ✅ Test message typing indicators
7. ✅ Test create editor draft recovery

## Files Created

- `database/realtime_functions.sql` - RPC functions for atomic operations
- `database/notifications_schema.sql` - Notifications system
- `database/settings_schema.sql` - User settings storage
- `src/hooks/useNotificationsRealtime.js` - Notifications hook
- `src/hooks/useUserSettings.js` - Settings hook
- `src/hooks/useRealtimeMessages.js` - Enhanced messages hook
- `src/hooks/useEditorDraft.js` - Editor draft persistence
- `src/hooks/usePosts.js` - Updated with timeout handling

## Support

If you encounter issues, check:
1. Supabase project logs (Logs & Analytics)
2. Browser console for errors
3. Network tab for failed requests
