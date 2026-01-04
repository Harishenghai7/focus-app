# 🚀 EXPLORE PAGE FIX - INSTRUCTIONS

## ✅ WHAT I'VE DONE:

1. **Updated `exploreAlgorithm.js`** - Now uses Supabase RPC with fallback to direct query
2. **Fixed `TrendingPanel.js`** - Removed dependency on non-existent columns
3. **Created migration SQL** - Ready to run in Supabase

## 🔥 IMMEDIATE ACTION REQUIRED:

### Run this SQL in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard
2. Select your Focus app project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of:
   `supabase/migrations/20260101_create_explore_function.sql`
6. Click **RUN** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned"

## 📊 WHAT THE MIGRATION DOES:

- ✅ Adds `likes_count`, `comments_count`, `thumbnail_url` columns to posts table (if missing)
- ✅ Creates `get_explore_posts()` function for efficient data fetching
- ✅ Sets up triggers to auto-update engagement counts
- ✅ Populates initial count values
- ✅ Grants proper permissions

## 🧪 TESTING:

After running the migration:

1. **Refresh your app** (Ctrl+R)
2. **Navigate to Explore page**
3. **Check console** - You should see:
   ```
   🔍 [EXPLORE] Fetching posts: category=all, page=0, pageSize=20
   📊 [EXPLORE] Raw data received: X posts
   ✅ [EXPLORE] Transformed posts: X
   📸 [EXPLORE] Sample post: {...}
   ```
4. **Verify** - Posts should display in grid layout

## 🔍 IF STILL NOT WORKING:

Check these in order:

1. **Console errors** - Look for specific error messages
2. **RLS Policies** - Ensure posts table has SELECT policy for anon/authenticated
3. **Data exists** - Verify you have posts with media_urls in database
4. **Network tab** - Check if API calls are returning 200 OK

## 📝 FALLBACK MODE:

The code now has a **fallback** - even if the RPC function doesn't exist, it will use a direct Supabase query. So the Explore page should work either way!

## 🎯 EXPECTED RESULT:

- ✅ Explore page shows grid of posts
- ✅ All tabs work (All, Posts, Boltz, Flash, People, Tags, Trending)
- ✅ TrendingPanel loads without errors
- ✅ Console shows detailed logging

---

**Status**: Code is ready. Just need to run the SQL migration! 🚀
