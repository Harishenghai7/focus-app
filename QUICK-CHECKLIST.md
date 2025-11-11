# ✅ Quick Checklist - Database Reset & Setup

## 🎯 Your Mission: Fresh Database in 7 Minutes

---

## Step 1: Drop Old Database ⏱️ 1 min

```
□ Open: https://supabase.com/dashboard
□ Click: SQL Editor → New Query
□ Open file: DROP-ALL.sql
□ Copy all → Paste → Run
□ Wait for: "Success. No rows returned"
□ Done! ✅
```

---

## Step 2: Setup New Database ⏱️ 2 min

```
□ Still in SQL Editor
□ Click: New Query
□ Open file: SUPABASE-SETUP.sql
□ Copy all → Paste → Run
□ Wait for: "Success" messages
□ Done! ✅
```

---

## Step 3: Verify Tables ⏱️ 30 sec

```
□ Go to: Table Editor (left sidebar)
□ Should see 15 tables:
  □ profiles
  □ posts
  □ boltz
  □ flashes
  □ comments
  □ likes
  □ follows
  □ messages
  □ notifications
  □ saves
  □ close_friends
  □ highlights
  □ highlight_stories
  □ blocked_users
  □ reports
□ Done! ✅
```

---

## Step 4: Check Storage ⏱️ 30 sec

```
□ Go to: Storage (left sidebar)
□ Should see 6 buckets:
  □ avatars (Public)
  □ posts (Public)
  □ boltz (Public)
  □ flash (Public)
  □ messages (Private)
  □ thumbnails (Public)
□ If missing, create them manually
□ Done! ✅
```

---

## Step 5: Clear App Cache ⏱️ 30 sec

```
□ Go to: http://localhost:3000/force-reset.html
□ Click: "FORCE RESET NOW"
□ Wait for redirect
□ Done! ✅
```

---

## Step 6: Test Signup ⏱️ 2 min

```
□ Go to: http://localhost:3000
□ Should see: Auth page (not loading screen)
□ Click: Sign Up
□ Enter: Email & Password
□ Submit
□ Should see: Onboarding screen with logo ✅
□ Complete: All 5 steps
□ Should see: Home feed ✅
□ Done! ✅
```

---

## 🎉 Success Indicators

### ✅ Database Ready:
- 15 tables visible
- 6 storage buckets exist
- No errors in SQL Editor

### ✅ App Working:
- Auth page loads (not stuck)
- Signup works
- Onboarding appears
- Logo displays
- Profile created
- Home feed loads

---

## 🚨 If Something Goes Wrong

### Stuck on loading after signup?
```
→ Database not set up correctly
→ Re-run SUPABASE-SETUP.sql
```

### "Table already exists" error?
```
→ Run DROP-ALL.sql first
→ Then run SUPABASE-SETUP.sql
```

### Onboarding not appearing?
```
→ Clear browser cache
→ Go to: http://localhost:3000/force-reset.html
```

### Logo not showing?
```
→ Already fixed in code!
→ Just clear cache
```

---

## 📁 Files You Need

```
1. DROP-ALL.sql           → Drops everything
2. SUPABASE-SETUP.sql     → Creates everything
3. FRESH-START-GUIDE.md   → Detailed guide
4. QUICK-CHECKLIST.md     → This checklist
```

---

## ⏱️ Total Time: ~7 Minutes

```
Drop:     1 min
Setup:    2 min
Verify:   1 min
Cache:    0.5 min
Test:     2 min
Celebrate: ∞
```

---

## 🎯 Current Status

```
□ Database dropped
□ Database setup
□ Tables verified
□ Storage verified
□ Cache cleared
□ App tested
□ Everything working! 🎉
```

---

**Ready? Let's do this!** 🚀

1. Open Supabase Dashboard
2. Run DROP-ALL.sql
3. Run SUPABASE-SETUP.sql
4. Test the app
5. Make history! 🎊
