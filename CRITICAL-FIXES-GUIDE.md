# 🚨 Critical Fixes Implementation Guide

## Priority: URGENT - Do Before Production Launch

This guide walks you through implementing the critical security and performance fixes identified in the comprehensive audit.

---

## 📋 Pre-Flight Checklist

Before running any SQL:
- [ ] Backup your Supabase database
- [ ] Test in development environment first
- [ ] Have rollback plan ready
- [ ] Notify team of maintenance window

---

## 🔴 Phase 1: Critical Security (Do Now - 30 minutes)

### Step 1: Fix RLS Policies (COMPLETED ✅)
```bash
Status: Already done!
File: FIX-RLS-POLICIES.sql
```

### Step 2: Secure Chat & Calls (CRITICAL)
```bash
Time: 10 minutes
Risk: HIGH - Users can access private conversations
```

**Instructions:**
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy entire `SECURE-CHAT-CALLS.sql`
4. Run the query
5. Verify: Check that `chat_participants` and `call_participants` tables exist

**What it does:**
- Creates participant tracking tables
- Adds RLS policies to prevent unauthorized access
- Migrates existing DMs to new structure
- Adds helper functions for chat/call access

**Test:**
```javascript
// Try to access a chat you're not in
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', 'someone-elses-chat');

// Should return empty or error
console.log(data); // Should be []
```

### Step 3: Add Blocked User Checks (CRITICAL)
```bash
Time: 10 minutes
Risk: HIGH - Blocked users can still see content
```

**Instructions:**
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy entire `ADD-BLOCKED-USER-CHECKS.sql`
4. Run the query
5. Verify: Try viewing content from a blocked user

**What it does:**
- Updates all RLS policies to check blocked_users table
- Prevents blocked users from seeing each other's content
- Auto-unfollows on block
- Removes from close friends on block

**Test:**
```javascript
// Block a user
await supabase.from('blocked_users').insert({
  blocker_id: myUserId,
  blocked_id: theirUserId
});

// Try to view their posts
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', theirUserId);

// Should return empty
console.log(data); // Should be []
```

### Step 4: Add Performance Indexes (IMPORTANT)
```bash
Time: 10 minutes
Risk: MEDIUM - Slow queries at scale
```

**Instructions:**
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy entire `ADD-MISSING-INDEXES.sql`
4. Run the query
5. Wait for indexes to build (may take a few minutes)

**What it does:**
- Adds indexes on all foreign keys
- Creates composite indexes for common queries
- Adds full-text search indexes
- Creates partial indexes for filtered queries

**Verify:**
```sql
-- Check indexes were created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🟡 Phase 2: Code Fixes (This Week - 2 hours)

### Fix 1: Audit Realtime Subscriptions

**Files to check:**
- `src/pages/Home.js`
- `src/pages/Messages.js`
- `src/pages/Notifications.js`
- `src/components/RealtimeNotifications.js`
- `src/hooks/useRealtimeInteractions.js`

**Pattern to follow:**
```javascript
useEffect(() => {
  const subscription = supabase
    .channel('my-channel')
    .on('postgres_changes', {...}, handler)
    .subscribe();

  // CRITICAL: Always cleanup
  return () => {
    subscription.unsubscribe();
  };
}, [dependencies]);
```

**Check each file:**
```bash
# Search for subscriptions without cleanup
grep -r "\.subscribe()" src/ | grep -v "unsubscribe"
```

### Fix 2: Add Consistent Null Handling

**Create utility file:**
```javascript
// src/utils/safeAccess.js
export const getAvatar = (url) => {
  return url && url.trim() ? url : '/default-avatar.png';
};

export const getUsername = (profile) => {
  return profile?.username || profile?.full_name || 'User';
};

export const getSafeProfile = (profile) => ({
  id: profile?.id,
  username: getUsername(profile),
  avatar_url: getAvatar(profile?.avatar_url),
  full_name: profile?.full_name || profile?.username || 'User',
  bio: profile?.bio || ''
});
```

**Use throughout app:**
```javascript
import { getAvatar, getUsername } from '../utils/safeAccess';

// Instead of:
<img src={user.avatar_url} />

// Use:
<img src={getAvatar(user?.avatar_url)} />
```

### Fix 3: Add Debouncing

**Install lodash:**
```bash
npm install lodash
```

**Add to rapid actions:**
```javascript
import debounce from 'lodash/debounce';

const debouncedLike = useCallback(
  debounce(async (postId) => {
    await supabase.from('likes').insert({...});
  }, 300),
  []
);
```

### Fix 4: Prevent Double Submit

**Add to all forms:**
```javascript
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (submitting) return; // Prevent double-submit
  
  setSubmitting(true);
  try {
    await supabase.from('comments').insert({...});
  } finally {
    setSubmitting(false);
  }
};
```

---

## 🟢 Phase 3: Data Cleanup (Next Week - 1 hour)

### Option A: Using Supabase Edge Functions

**Create function:**
```bash
# In your project
supabase functions new cleanup-expired-data
```

**Function code:**
```typescript
// supabase/functions/cleanup-expired-data/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Delete expired flashes
  const { error: flashError } = await supabase
    .from('flashes')
    .delete()
    .lt('expires_at', new Date().toISOString());

  // Delete old read notifications
  const { error: notifError } = await supabase
    .from('notifications')
    .delete()
    .eq('is_read', true)
    .lt('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString());

  return new Response(
    JSON.stringify({ 
      success: true,
      flashError,
      notifError
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Deploy:**
```bash
supabase functions deploy cleanup-expired-data
```

**Schedule with cron:**
Use a service like cron-job.org or GitHub Actions to call the function daily.

### Option B: Using Database Function

**Create in SQL Editor:**
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM flashes WHERE expires_at < NOW();
  DELETE FROM notifications 
  WHERE is_read = true 
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Call manually or schedule with pg_cron
SELECT cleanup_expired_data();
```

---

## 📊 Testing Checklist

### Security Tests
- [ ] Test with 2 different user accounts
- [ ] Block user A from user B
- [ ] Verify user A cannot see user B's content
- [ ] Verify user B cannot see user A's content
- [ ] Try to access chat you're not in (should fail)
- [ ] Try to join call you're not invited to (should fail)

### Performance Tests
- [ ] Check query speed before/after indexes
- [ ] Test with 1000+ posts
- [ ] Test search functionality
- [ ] Monitor database CPU usage

### Functionality Tests
- [ ] Create post (should work)
- [ ] Create boltz (should work)
- [ ] Create flash (should work)
- [ ] Like/unlike (should work)
- [ ] Comment (should work)
- [ ] Follow/unfollow (should work)
- [ ] Send message (should work)
- [ ] Block user (should work)

---

## 🔍 Verification Queries

### Check RLS Policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Indexes
```sql
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Blocked Users
```sql
SELECT 
  b.id,
  blocker.username as blocker,
  blocked.username as blocked,
  b.created_at
FROM blocked_users b
JOIN profiles blocker ON blocker.id = b.blocker_id
JOIN profiles blocked ON blocked.id = b.blocked_id
ORDER BY b.created_at DESC;
```

### Check Chat Participants
```sql
SELECT 
  chat_id,
  COUNT(*) as participant_count,
  array_agg(p.username) as participants
FROM chat_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE cp.left_at IS NULL
GROUP BY chat_id;
```

---

## 🚨 Rollback Plan

If something goes wrong:

### Rollback RLS Policies
```sql
-- Disable RLS temporarily
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE boltz DISABLE ROW LEVEL SECURITY;
-- etc.

-- Or drop specific policy
DROP POLICY "policy_name" ON table_name;
```

### Rollback Indexes
```sql
-- Drop specific index
DROP INDEX IF EXISTS idx_name;
```

### Rollback Tables
```sql
-- Drop new tables
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS call_participants CASCADE;
```

---

## 📈 Expected Results

### Performance Improvements
- Query speed: 10-100x faster with indexes
- Page load: 50% faster
- Search: Near-instant with full-text indexes

### Security Improvements
- 100% blocked user enforcement
- 100% chat/call privacy
- 100% private account respect

### User Experience
- No more seeing blocked users
- Faster page loads
- Better search results
- More reliable messaging

---

## 🎯 Success Criteria

Phase 1 is successful when:
- [ ] All SQL scripts run without errors
- [ ] All tables have proper RLS policies
- [ ] Blocked users cannot see each other's content
- [ ] Chat/call access is properly restricted
- [ ] Indexes are created and being used
- [ ] All tests pass

---

## 📞 Support

If you encounter issues:

1. **Check Supabase logs:**
   - Dashboard → Logs → Postgres Logs

2. **Check for errors:**
   ```sql
   SELECT * FROM pg_stat_activity 
   WHERE state = 'active';
   ```

3. **Verify RLS:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'your_table';
   ```

4. **Test as different user:**
   - Use Supabase Dashboard → Authentication
   - Create test users
   - Test with both accounts

---

## ✅ Completion Checklist

- [ ] Phase 1: Critical Security (30 min)
  - [ ] SECURE-CHAT-CALLS.sql executed
  - [ ] ADD-BLOCKED-USER-CHECKS.sql executed
  - [ ] ADD-MISSING-INDEXES.sql executed
  - [ ] All tests passed

- [ ] Phase 2: Code Fixes (2 hours)
  - [ ] Subscription cleanup audited
  - [ ] Null handling added
  - [ ] Debouncing implemented
  - [ ] Double-submit prevention added

- [ ] Phase 3: Data Cleanup (1 hour)
  - [ ] Cleanup function created
  - [ ] Scheduled to run daily
  - [ ] Tested manually

- [ ] Testing Complete
  - [ ] Security tests passed
  - [ ] Performance tests passed
  - [ ] Functionality tests passed

- [ ] Documentation Updated
  - [ ] README updated
  - [ ] API docs updated
  - [ ] Team notified

---

**Total Time Required:** ~3.5 hours
**Priority:** URGENT - Do before production launch
**Risk Level:** HIGH if not completed

---

**Last Updated:** November 7, 2025
**Next Review:** After Phase 1 completion
