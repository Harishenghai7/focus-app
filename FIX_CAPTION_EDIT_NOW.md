# URGENT: Fix Caption Edit Issue - Step by Step

## The Problem
Caption updates are timing out because of RLS (Row Level Security) policies blocking the UPDATE operation.

## SOLUTION - Choose ONE of these options:

---

## ⚡ OPTION 1: Quick Fix - Disable RLS Temporarily (FASTEST)

### Step 1: Run this SQL in Supabase SQL Editor
```sql
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE boltz DISABLE ROW LEVEL SECURITY;
```

### Step 2: Test caption editing
- It should work immediately
- ⚠️ WARNING: This disables security on these tables

### Step 3: Re-enable RLS later with proper policies
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
```

---

## 🔧 OPTION 2: Proper Fix - Create RPC Function (RECOMMENDED)

### Step 1: Run `CREATE_UPDATE_RPC.sql` in Supabase SQL Editor
This creates a function that bypasses RLS but still checks ownership.

### Step 2: The app will automatically use this function
The code now tries multiple methods:
1. Direct update (will fail if RLS blocks it)
2. **RPC function** (will work if you created it)
3. Shows error with instructions

### Step 3: Test caption editing
Should work via the RPC function!

---

## 🛠️ OPTION 3: Fix RLS Policies (PROPER BUT COMPLEX)

### Step 1: Run `FIX_POSTS_RLS.sql` in Supabase SQL Editor

### Step 2: Run `FIX_BOLTZ_RLS.sql` in Supabase SQL Editor

### Step 3: Verify policies were created
```sql
SELECT * FROM pg_policies WHERE tablename IN ('posts', 'boltz');
```

### Step 4: If still not working, check:
1. Is RLS enabled? `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'posts';`
2. Do you have the `user_id` column? `SELECT column_name FROM information_schema.columns WHERE table_name = 'posts';`
3. Is your user authenticated? Check browser console for auth errors

---

## 📊 Debugging

### Check what's happening:
1. Open browser console (F12)
2. Try to edit a caption
3. Look for these logs:
   - "Attempting direct update..." 
   - "Direct update succeeded!" ✅ or "Direct update timed out" ❌
   - "Trying RPC method..."
   - "RPC update succeeded!" ✅ or "RPC not available" ❌

### Common Issues:

**"Direct update timed out"**
→ RLS is blocking the update
→ Use Option 1 or 2

**"RPC not available"**
→ You haven't created the RPC function
→ Run `CREATE_UPDATE_RPC.sql`

**"You do not have permission to edit this post"**
→ You're trying to edit someone else's post
→ This is correct behavior!

---

## 🎯 RECOMMENDED APPROACH

1. **For immediate fix**: Use Option 1 (disable RLS temporarily)
2. **For production**: Use Option 2 (RPC function)
3. **For learning**: Use Option 3 (fix RLS policies properly)

---

## After Fixing

Once it works, you can:
- Edit post captions ✅
- Edit Boltz captions ✅
- Delete posts ✅
- Archive posts (if column exists)
- Hide like counts (if column exists)
- Turn off commenting (if column exists)

---

## Need Help?

If none of these work:
1. Share the browser console output
2. Share the result of: `SELECT * FROM pg_policies WHERE tablename = 'posts';`
3. Share the result of: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'posts';`
