# 🚀 CRITICAL: DATABASE MIGRATION EXECUTION GUIDE

## ⚠️ MUST DO THIS FIRST - BEFORE ANY CODE CHANGES

**Time Required:** 10-15 minutes  
**When:** RIGHT NOW (before any other work)  
**Where:** Supabase Dashboard SQL Editor

---

## Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your Focus app project
3. Click "SQL Editor" in the left sidebar

---

## Step 2: Execute Complete Migration

1. Click "New Query" button
2. Copy the ENTIRE contents of:
   ```
   LAUNCH_DAY_SQL/00_COMPLETE_LAUNCH_MIGRATION.sql
   ```
3. Paste into the SQL Editor
4. Click "RUN" button (or press Ctrl+Enter)

**Expected Result:**
```
✅ FOCUS APP LAUNCH MIGRATION COMPLETE!
📊 Tables verified: 9/9
🔒 RLS policies applied
⚡ Realtime enabled
📦 Storage buckets created
🚀 Your app is READY FOR LAUNCH!
```

**If you see errors:**
- Most errors about "already exists" are SAFE to ignore
- The migration is designed to be idempotent (safe to run multiple times)
- Look for the final "COMPLETE!" message

---

## Step 3: Verify Tables Created

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations', 
  'conversation_participants', 
  'messages', 
  'calls', 
  'typing_indicators', 
  'user_presence', 
  'blocked_users', 
  'reports', 
  'user_settings'
);
```

**Expected:** 9 rows returned

---

## Step 4: Verify Storage Buckets

1. Click "Storage" in left sidebar
2. You should see these buckets:
   - ✅ avatars (public, 5MB limit)
   - ✅ posts (public, 10MB limit)
   - ✅ boltz (public, 50MB limit)
   - ✅ flash (public, 10MB limit)
   - ✅ messages (public, 10MB limit)
   - ✅ message-media (public, 10MB limit)

**If buckets are missing:**
- They may have failed to create
- Manually create them via Storage UI
- Set all to "Public bucket"
- Set file size limits as shown above

---

## Step 5: Enable Realtime (Critical!)

1. Click "Database" → "Replication" in left sidebar
2. Find these tables and toggle "Realtime" ON:
   - ✅ messages
   - ✅ typing_indicators
   - ✅ user_presence
   - ✅ calls
   - ✅ notifications
   - ✅ conversations
   - ✅ likes
   - ✅ comments
   - ✅ posts

---

## Step 6: Verify Environment Variables

Check your `.env` file (create if missing):

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-anon-key-here
REACT_APP_TENOR_API_KEY=your-tenor-key-here
```

**Get Supabase credentials:**
1. Settings → API
2. Copy "Project URL" → REACT_APP_SUPABASE_URL
3. Copy "anon public" key → REACT_APP_SUPABASE_KEY

**Get Tenor API key:**
1. Go to https://tenor.com/developer/dashboard
2. Create app (or use existing)
3. Copy API key → REACT_APP_TENOR_API_KEY

---

## Step 7: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm start
```

---

## ✅ Verification Checklist

Before proceeding to code changes:

- [ ] Migration ran successfully (saw "COMPLETE!" message)
- [ ] 9 tables verified in database
- [ ] 6 storage buckets exist and are public
- [ ] Realtime enabled on 9 tables
- [ ] .env file has all 3 variables
- [ ] Dev server restarted

---

## 🚨 Common Issues

### Issue: "relation already exists"
**Solution:** SAFE TO IGNORE - migration is idempotent

### Issue: "permission denied for schema storage"
**Solution:** Create buckets manually via Storage UI

### Issue: "function already exists"
**Solution:** SAFE TO IGNORE - will be replaced

### Issue: Can't find .env file
**Solution:** Create `.env` in project root (same level as package.json)

---

## ⏭️ Next Steps

Once ALL checkboxes above are checked:
1. ✅ Database is ready
2. ✅ Storage is ready
3. ✅ Environment is configured
4. → START CODE IMPLEMENTATION (Phase 2)

**DO NOT proceed to code changes until this is 100% complete!**
