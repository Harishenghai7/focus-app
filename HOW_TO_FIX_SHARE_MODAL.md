# 🔧 FIX SHARE MODAL - Step by Step

## Issues Found

### 1. **Send via Message** - ⏳ Pending Forever
**Cause**: RLS policy blocking `profiles` table query

### 2. **Share to Flash** - No Response After Insert
**Cause**: RLS policy blocking `flash` table insert

---

## ✅ SOLUTION - Run SQL Script

### Step 1: Open Supabase
1. Go to https://supabase.com
2. Open your project
3. Click **SQL Editor** in left sidebar

### Step 2: Run the Fix Script
1. Open the file: `FIX_SHARE_MODAL_RLS.sql`
2. **Copy ALL the SQL** from that file
3. **Paste** into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify
You should see:
```
✅ Success. No rows returned
```

---

## 🧪 Test Again

### Test 1: Send via Message
1. Click Share → Send via Message
2. Should see users immediately! ✅
3. Console should show:
   ```
   📡 Executing query...
   📬 Query response: { hasData: true, dataLength: X }
   ✅ SUCCESS: Got users: X
   ```

### Test 2: Share to Flash
1. Click Share → Share to Flash ⚡
2. Should see success toast! ✅
3. Console should show:
   ```
   🎬 Media path found: https://...
   📝 Insert data: {...}
   📬 Response: { flashData: [...], error: null }
   ✅ Flash created!
   ```

---

## 🚨 If Still Not Working

### Quick Fix - Temporarily Disable RLS

**In Supabase SQL Editor**, run:

```sql
-- TEMPORARY - For testing only!
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE flash DISABLE ROW LEVEL SECURITY;
```

Then test again. If it works, the issue is definitely RLS policies.

**To re-enable** (after fixing policies):
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
```

---

## 📋 What the SQL Does

### Fix 1: Profiles Table
```sql
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);  -- ✅ Anyone can read profiles
```

### Fix 2: Flash Table
```sql
-- Allow creating your own flash
CREATE POLICY "Users can create flash" 
ON flash FOR INSERT 
WITH CHECK (auth.uid() = user_id);  -- ✅ You can create your flash

-- Allow viewing flash
CREATE POLICY "Flash visibility" 
ON flash FOR SELECT 
USING (expires_at > NOW() AND ...);  -- ✅ View non-expired flash
```

---

## ✨ Expected Result

After running the SQL:

### Send via Message:
- ✅ Users load instantly
- ✅ Can search users
- ✅ Can select multiple users
- ✅ Can send messages

### Share to Flash:
- ✅ Creates flash in database
- ✅ Shows success toast
- ✅ Flash appears in your profile

---

**Run the SQL script and test!** 🚀✨
