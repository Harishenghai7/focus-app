# 🗄️ Setup Supabase Database - Quick Guide

## Why You're Stuck on Loading

After signup, the app tries to fetch your profile from the database, but the database tables don't exist yet! That's why it's stuck loading.

## ✅ Quick Fix (5 Minutes)

### Step 1: Go to Supabase Dashboard
```
1. Open: https://supabase.com/dashboard
2. Select your project: nmhrtllprmonqqocwzvf
3. Click "SQL Editor" in left sidebar
```

### Step 2: Run the Setup SQL
```
1. Click "New Query"
2. Open the file: SUPABASE-SETUP.sql
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click "Run" button (or press Ctrl+Enter)
6. Wait ~10 seconds for completion
```

### Step 3: Verify Setup
```
1. Go to "Table Editor" in left sidebar
2. You should see these tables:
   ✅ profiles
   ✅ posts
   ✅ boltz
   ✅ flashes
   ✅ comments
   ✅ likes
   ✅ follows
   ✅ messages
   ✅ notifications
   ✅ saves
   ✅ close_friends
   ✅ highlights
   ✅ blocked_users
   ✅ reports
```

### Step 4: Setup Storage Buckets
```
1. Go to "Storage" in left sidebar
2. Click "Create bucket"
3. Create these buckets (one by one):
   - avatars (Public)
   - posts (Public)
   - boltz (Public)
   - flash (Public)
   - messages (Private)
   - thumbnails (Public)
```

### Step 5: Test the App
```
1. Go back to: http://localhost:3000
2. Clear cache: http://localhost:3000/force-reset.html
3. Sign up again
4. Should see onboarding! ✅
```

---

## 🎯 What the SQL Does

The `SUPABASE-SETUP.sql` file creates:

1. **15 Database Tables** - All the tables needed for the app
2. **Indexes** - For fast queries
3. **RLS Policies** - Security rules
4. **Triggers** - Auto-update timestamps
5. **Storage Buckets** - For images/videos

---

## 🔍 Troubleshooting

### "Permission denied" error
```
Solution: Make sure you're logged into Supabase dashboard
```

### "Relation already exists" error
```
Solution: Tables already created! You're good to go ✅
```

### Still stuck on loading?
```
1. Check browser console (F12)
2. Look for errors
3. Make sure tables were created
4. Clear browser cache
```

---

## 📊 Database Schema Overview

```
profiles          → User accounts
posts             → Photo/video posts
boltz             → Short videos (TikTok-style)
flashes           → Stories (24h expiry)
comments          → Comments on content
likes             → Likes on content
follows           → Follow relationships
messages          → Direct messages
notifications     → Activity notifications
saves             → Bookmarked content
close_friends     → Close friends list
highlights        → Story highlights
blocked_users     → Blocked users
reports           → Content reports
```

---

## 🚀 After Setup

Once database is set up:

1. ✅ Signup works
2. ✅ Onboarding appears
3. ✅ Profile creation works
4. ✅ All features functional

---

## 📝 Quick Commands

### Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Count profiles:
```sql
SELECT COUNT(*) FROM profiles;
```

### View your profile:
```sql
SELECT * FROM profiles 
WHERE email = 'your-email@example.com';
```

---

## 🎉 You're Done!

After running the SQL:
1. Database is ready ✅
2. Storage buckets created ✅
3. Security policies active ✅
4. App will work perfectly ✅

**Now go back to the app and sign up!** 🚀

---

**File to run**: `SUPABASE-SETUP.sql`  
**Where to run**: Supabase Dashboard → SQL Editor  
**Time needed**: 5 minutes  
**Difficulty**: Easy ⭐
