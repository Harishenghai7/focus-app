# 🔄 Fresh Start Guide - Complete Database Reset

## Step-by-Step Process

### Step 1: Drop Everything (Clean Slate)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run DROP Script**
   - Open file: `DROP-ALL.sql`
   - Copy ALL the code
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait for completion (~5 seconds)
   - Should see: "Success. No rows returned"

4. **Verify Everything is Dropped**
   ```sql
   -- Run this to check:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Should return empty or only system tables
   ```

---

### Step 2: Setup Fresh Database

1. **Still in SQL Editor**
   - Click "New Query" again

2. **Run SETUP Script**
   - Open file: `SUPABASE-SETUP.sql`
   - Copy ALL the code
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait for completion (~10 seconds)
   - Should see: "Success" messages

3. **Verify Tables Created**
   ```sql
   -- Run this to check:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   
   -- Should see 15 tables
   ```

---

### Step 3: Create Storage Buckets

**Option A: Using Dashboard (Recommended)**
```
1. Go to "Storage" in left sidebar
2. Click "Create bucket" for each:
   - avatars (Public)
   - posts (Public)
   - boltz (Public)
   - flash (Public)
   - messages (Private)
   - thumbnails (Public)
```

**Option B: Using SQL (Already in SETUP script)**
```
The SUPABASE-SETUP.sql already includes bucket creation!
Just verify they exist in Storage tab.
```

---

### Step 4: Test the App

1. **Clear Browser Cache**
   ```
   Go to: http://localhost:3000/force-reset.html
   Click: "FORCE RESET NOW"
   ```

2. **Sign Up**
   - Go to: http://localhost:3000
   - Click "Sign Up"
   - Enter email & password
   - Submit

3. **Complete Onboarding**
   - Should see onboarding screen with logo ✅
   - Complete all 5 steps
   - Should redirect to home feed ✅

---

## 🎯 Complete Command Sequence

### In Supabase SQL Editor:

```sql
-- 1. DROP EVERYTHING
-- (Paste DROP-ALL.sql content here)
-- Run it

-- 2. SETUP FRESH DATABASE
-- (Paste SUPABASE-SETUP.sql content here)
-- Run it

-- 3. VERIFY
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Should see 15 tables

-- 4. CHECK STORAGE
SELECT * FROM storage.buckets;
-- Should see 6 buckets
```

---

## ✅ Verification Checklist

### After DROP:
- [ ] No tables in Table Editor
- [ ] No custom functions
- [ ] No triggers
- [ ] Storage buckets empty (or deleted)

### After SETUP:
- [ ] 15 tables visible in Table Editor
- [ ] Profiles table has columns: id, username, email, etc.
- [ ] 6 storage buckets exist
- [ ] RLS policies active (green shield icons)

### After Testing:
- [ ] Can sign up
- [ ] Onboarding appears
- [ ] Logo displays
- [ ] Can complete onboarding
- [ ] Profile created in database
- [ ] Redirects to home

---

## 🔍 Troubleshooting

### "Cannot drop table because other objects depend on it"
```
Solution: The DROP-ALL.sql uses CASCADE to handle this.
If still fails, drop tables in this order:
1. highlight_stories
2. highlights
3. All other tables
4. profiles (last)
```

### "Permission denied"
```
Solution: Make sure you're the project owner or have admin access
```

### "Bucket already exists"
```
Solution: Either:
1. Delete buckets manually in Storage tab
2. Or ignore the error (buckets will be reused)
```

### Tables not appearing after setup
```
Solution:
1. Refresh the page
2. Check SQL Editor for errors
3. Run verification query
```

---

## 📊 What Gets Dropped

### Tables (15):
- profiles, posts, boltz, flashes
- comments, likes, follows, messages
- notifications, saves, close_friends
- highlights, highlight_stories
- blocked_users, reports

### Indexes (11):
- All performance indexes

### Triggers (3):
- updated_at triggers

### Functions (1):
- update_updated_at_column

### Policies (20+):
- All RLS policies

### Storage Buckets (6):
- avatars, posts, boltz, flash, messages, thumbnails

---

## 📊 What Gets Created

### Tables (15):
- Complete schema with all columns
- Foreign key relationships
- Constraints and checks

### Indexes (11):
- Performance indexes on key columns

### Triggers (3):
- Auto-update timestamps

### Functions (1):
- Timestamp update function

### Policies (20+):
- Row Level Security for all tables

### Storage Buckets (6):
- With proper access policies

---

## ⏱️ Timeline

```
Step 1: Drop Everything     → 1 minute
Step 2: Setup Database      → 2 minutes
Step 3: Create Buckets      → 2 minutes
Step 4: Test App           → 2 minutes
Total:                      → 7 minutes
```

---

## 🎉 Success Indicators

After completing all steps, you should see:

1. ✅ **In Supabase Dashboard**
   - 15 tables in Table Editor
   - 6 buckets in Storage
   - Green shield icons (RLS active)

2. ✅ **In App**
   - Clean signup process
   - Onboarding with logo
   - Profile creation works
   - Home feed loads

3. ✅ **In Browser Console**
   - No errors
   - "Profile created" messages
   - "Onboarding completed" logs

---

## 🚀 Quick Commands

### Drop Everything:
```bash
# Copy DROP-ALL.sql → Paste in SQL Editor → Run
```

### Setup Fresh:
```bash
# Copy SUPABASE-SETUP.sql → Paste in SQL Editor → Run
```

### Verify:
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 15
```

---

## 📝 Files You Need

1. ✅ `DROP-ALL.sql` - Drops everything
2. ✅ `SUPABASE-SETUP.sql` - Creates everything
3. ✅ `FRESH-START-GUIDE.md` - This guide

---

## 🎯 Ready?

1. Open Supabase Dashboard
2. Run DROP-ALL.sql
3. Run SUPABASE-SETUP.sql
4. Test the app
5. Make history! 🚀

---

**You're about to have a completely fresh, working database!** 🎉
