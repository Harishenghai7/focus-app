# 🚨 EMERGENCY ACTION PLAN - NEW MESSAGE SEARCH FIX
## Time Remaining: ~4.5 hours until launch (12:00 IST 01.01.2026)

---

## ⚡ IMMEDIATE ACTIONS (DO THIS NOW - 10 MINUTES)

### Step 1: Apply RLS Fix (2 minutes)
1. Open Supabase Dashboard: https://app.supabase.com
2. Go to **SQL Editor**
3. Copy and run: `supabase/migrations/EMERGENCY_FIX_RLS.sql`
4. Verify you see: "✅ ALL FIXES APPLIED SUCCESSFULLY!"

### Step 2: Diagnose Profile Data (3 minutes)
1. In Supabase SQL Editor
2. Copy and run: `supabase/migrations/DIAGNOSTIC_PROFILES.sql`
3. Check the results:
   - **If "Total profiles: 0"** → No users exist! Need to create test users
   - **If "Total profiles: > 0"** → RLS is blocking access, continue to Step 3

### Step 3: Test the Fix (5 minutes)
1. **Refresh your app** (Ctrl+R)
2. **Open browser console** (F12)
3. **Click "New Message"** button
4. **Look for these console logs:**
   ```
   👥 Fetching suggested users...
   👥 Current user ID: [your-user-id]
   👥 Suggested users response: { data: [...], error: null, count: X }
   ✅ Loaded X suggested users
   ```

---

## 🔍 TROUBLESHOOTING SCENARIOS

### Scenario A: "No profiles in database"
**Problem:** No users exist to search for
**Solution:** Create test users

```sql
-- Run this in Supabase SQL Editor to create test users
INSERT INTO profiles (id, username, full_name, avatar_url, created_at)
VALUES
  (gen_random_uuid(), 'testuser1', 'Test User One', 'https://i.pravatar.cc/150?img=1', NOW()),
  (gen_random_uuid(), 'testuser2', 'Test User Two', 'https://i.pravatar.cc/150?img=2', NOW()),
  (gen_random_uuid(), 'testuser3', 'Test User Three', 'https://i.pravatar.cc/150?img=3', NOW()),
  (gen_random_uuid(), 'alice', 'Alice Johnson', 'https://i.pravatar.cc/150?img=5', NOW()),
  (gen_random_uuid(), 'bob', 'Bob Smith', 'https://i.pravatar.cc/150?img=12', NOW());
```

### Scenario B: "RLS blocking access"
**Problem:** RLS policies are too restrictive
**Console shows:** Error with code "42501" (insufficient privilege)

**Solution:** Run this simplified RLS fix:
```sql
-- Drop ALL existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create ONE simple policy
CREATE POLICY "allow_all_authenticated_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
```

### Scenario C: "currentUserId is undefined"
**Problem:** User not authenticated or session expired
**Console shows:** `👥 Current user ID: undefined`

**Solution:**
1. Check if user is logged in
2. Refresh the page
3. Log out and log back in
4. Check `useAuth()` hook is working

### Scenario D: "Search query syntax error"
**Problem:** The `.or()` filter has wrong syntax
**Console shows:** Error about "invalid filter"

**Solution:** Already fixed in NewMessageModal.jsx
- Changed from: `.or(\`username.ilike.%${query}%,full_name.ilike.%${query}%\`)`
- Changed to: `.or(\`username.ilike.${searchPattern},full_name.ilike.${searchPattern}\`)`

---

## 📋 VERIFICATION CHECKLIST

After applying fixes, verify:
- [ ] No console errors when opening New Message modal
- [ ] Suggested users appear (if profiles exist)
- [ ] Search works when typing
- [ ] Can select users
- [ ] "Chat" button is enabled when user selected
- [ ] Can start conversation

---

## 🔥 NUCLEAR OPTION (If nothing else works)

If you're still getting "No User Found" after all fixes:

### Option 1: Disable RLS Temporarily (NOT RECOMMENDED FOR PRODUCTION)
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```
⚠️ **WARNING:** This removes all security! Only use for testing!

### Option 2: Use Direct API Call Instead of Supabase Client
Edit `NewMessageModal.jsx` to use REST API directly:

```javascript
const fetchSuggestedUsers = async () => {
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/profiles?select=id,username,full_name,avatar_url&limit=20`,
            {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${session?.access_token}`,
                }
            }
        );
        const data = await response.json();
        setSuggestedUsers(data || []);
    } catch (err) {
        console.error(err);
    }
};
```

---

## 📞 QUICK REFERENCE

### Files Modified:
1. ✅ `src/pages/Messages/components/Modals/NewMessageModal.jsx`
   - Fixed search query syntax
   - Added debug logging

### Files Created:
1. ✅ `supabase/migrations/EMERGENCY_FIX_RLS.sql` - RLS fix
2. ✅ `supabase/migrations/DIAGNOSTIC_PROFILES.sql` - Diagnostic tool
3. ✅ `EMERGENCY_ACTION_PLAN.md` - This file

### Console Commands to Check:
```javascript
// In browser console, check if Supabase is working:
const { data, error } = await supabase.from('profiles').select('*').limit(5);
console.log('Profiles:', data, 'Error:', error);
```

---

## ⏰ TIME ALLOCATION

- **00:00-00:02** - Apply EMERGENCY_FIX_RLS.sql
- **00:02-00:05** - Run DIAGNOSTIC_PROFILES.sql
- **00:05-00:07** - Create test users if needed
- **00:07-00:10** - Test in browser
- **00:10-00:15** - Debug any remaining issues

---

## 🎯 SUCCESS CRITERIA

You'll know it's working when:
1. ✅ New Message modal opens without errors
2. ✅ You see a list of users (or "Suggested" section)
3. ✅ Typing in search shows filtered results
4. ✅ Can click users to select them
5. ✅ "Chat" button works

---

## 💡 MOST LIKELY CAUSE

Based on the error "No User Found", the most likely causes are:
1. **70% chance:** No profiles exist in database (need to create test users)
2. **20% chance:** RLS policies blocking access (run EMERGENCY_FIX_RLS.sql)
3. **10% chance:** Search query syntax error (already fixed)

---

**NEXT STEP:** Run DIAGNOSTIC_PROFILES.sql NOW to identify which scenario you're in!
