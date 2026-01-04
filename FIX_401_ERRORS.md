# 🔧 Quick Fix for 401 Errors

## Problem
Getting `401 Unauthorized` and `permission denied for table post_likes/saved_posts` errors.

## Root Causes
1. ✅ **FIXED**: Session timeout issue in `getAuthToken()` 
2. ❌ **NEEDS FIX**: RLS policies blocking authenticated users

## Solution

### Step 1: Code Fix (Already Done ✅)
Updated `supabaseRest.js` to:
- Get auth token from localStorage (faster)
- Dynamically find the correct localStorage key
- Fallback to fresh session if needed

### Step 2: Database Fix (Do This Now! 🚨)

**Run `FIX_LIKES_SAVES_RLS.sql` in Supabase SQL Editor**

This will:
1. Drop all existing conflicting policies
2. Create proper policies for:
   - `post_likes` - Allow authenticated users to like/unlike
   - `saved_posts` - Allow authenticated users to save/unsave
   - `boltz_likes` - Allow authenticated users to like/unlike boltz
   - `saved_boltz` - Allow authenticated users to save/unsave boltz

### Step 3: Test

After running the SQL:
1. **Refresh your browser** (F5)
2. **Try liking a post** - Should work instantly!
3. **Try saving a post** - Should work instantly!
4. **Check console** - Should see "✅ Using cached access token"

---

## Expected Console Output (After Fix)

### ✅ GOOD:
```
✅ Using cached access token
📡 Liking post via REST API: de477a62-...
✅ Like action completed
```

### ❌ BAD (Before Fix):
```
⚠️ Session timeout, using anon key: Session timeout
📡 Liking post via REST API: de477a62-...
❌ Like error: permission denied for table post_likes
```

---

## Why This Happened

1. **Session Timeout**: The old `getAuthToken()` had a 5-second timeout that was too aggressive
2. **RLS Policies**: The database policies weren't properly configured to allow authenticated users to insert/delete likes and saves

---

## What We Fixed

### Before:
- ❌ Timeout after 5 seconds → fallback to anon key
- ❌ Anon key has no permission → 401 error
- ❌ User can't like/save anything

### After:
- ✅ Get token from localStorage (instant)
- ✅ Use user's access token
- ✅ RLS policies allow authenticated users
- ✅ Everything works!

---

## Next Steps

1. **Run the SQL** in Supabase
2. **Refresh browser**
3. **Test likes and saves**
4. If it works, we'll continue with Phase 2 (Boltz)!
