
# 🔧 Supabase Authentication Troubleshooting Guide

## Problem Summary
The Supabase JavaScript client is hanging on all database queries. Queries never return, causing the app to freeze when trying to create conversations or fetch messages.

**Symptoms:**
- ✅ Login works fine
- ✅ Public queries work (follows, profiles)
- ❌ Authenticated queries hang (conversations, messages)
- ❌ `supabase.from('conversations').insert()` never returns
- ❌ `supabase.from('conversation_participants').select()` never returns

---

## 🔍 Step 1: Check Supabase Dashboard

### A. Verify Project Status
1. Go to https://supabase.com/dashboard
2. Select your Focus app project
3. Check for any alerts or warnings at the top
4. Look for "Project paused" or "Quota exceeded" messages

### B. Check API Settings
1. Go to **Settings** → **API**
2. Verify these values match your `.env` file:
   - **Project URL**: Should match `REACT_APP_SUPABASE_URL`
   - **anon/public key**: Should match `REACT_APP_SUPABASE_KEY`
3. If they don't match, update your `.env` file and restart the app

### C. Check Database Activity
1. Go to **Database** → **Roles**
2. Make sure `postgres` role exists and is active
3. Go to **Database** → **Extensions**
4. Verify `uuid-ossp` extension is enabled

---

## 🔍 Step 2: Test Direct API Access

### Test with cURL (Windows PowerShell)

```powershell
# Replace with your actual values
$SUPABASE_URL = "https://nmhrtllprmonqqocwzvf.supabase.co"
$ANON_KEY = "your-anon-key-here"

# Test 1: Check if API is responding
Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/" -Headers @{
    "apikey" = $ANON_KEY
}

# Test 2: Try to fetch conversations
Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/conversations?select=*" -Headers @{
    "apikey" = $ANON_KEY
    "Authorization" = "Bearer $ANON_KEY"
}
```

**Expected Results:**
- Test 1: Should return 200 OK
- Test 2: Should return 200 OK with empty array `[]`

**If you get errors:**
- `404`: Wrong URL
- `401/403`: Wrong API key or RLS issue
- `Timeout`: Network/firewall issue

---

## 🔍 Step 3: Check Browser Network Tab

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Filter by "Fetch/XHR"
4. Click the "Message" button
5. Look for requests to Supabase

**What to check:**
- ❌ **Request stuck in "Pending"**: Network timeout issue
- ❌ **Request shows "CORS error"**: CORS configuration issue
- ❌ **Request shows 401/403**: Authentication issue
- ✅ **Request completes with 200**: Working correctly

**If stuck in "Pending":**
- Check your internet connection
- Check if firewall is blocking Supabase
- Try disabling VPN if you're using one

---

## 🔍 Step 4: Check Supabase Client Configuration

### Check `src/lib/supabase.js`

Your file should look like this:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export { supabaseUrl, supabaseAnonKey };
```

**Common issues:**
- Missing environment variables
- Wrong client configuration
- Multiple client instances

---

## 🔍 Step 5: Clear Browser Cache & Session

Sometimes stale sessions cause issues:

1. **Clear localStorage:**
   - Open DevTools Console (F12)
   - Run: `localStorage.clear()`
   - Refresh page

2. **Clear all site data:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"

3. **Try incognito mode:**
   - Open incognito window (Ctrl+Shift+N)
   - Login again
   - Try creating a conversation

---

## 🔍 Step 6: Check Supabase Version

### Check package.json

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x"
  }
}
```

**If version is outdated:**

```bash
npm install @supabase/supabase-js@latest
npm start
```

---

## 🔍 Step 7: Test with Simple Query

Create a test file: `src/test-supabase.js`

```javascript
import { supabase } from './lib/supabase';

async function testSupabase() {
  console.log('🧪 Testing Supabase connection...');
  
  // Test 1: Get session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session ? '✅ Active' : '❌ None');
  
  // Test 2: Simple select
  console.log('Testing select...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  console.log('Select result:', data, error);
  
  // Test 3: Simple insert
  console.log('Testing insert...');
  const { data: insertData, error: insertError } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select()
    .single();
  
  console.log('Insert result:', insertData, insertError);
}

testSupabase();
```

Run in browser console after importing.

---

## 🔍 Step 8: Check RLS Policies

Even though we disabled RLS, let's verify:

### Run in Supabase SQL Editor:

```sql
-- Check if RLS is actually disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'messages');
```

**Expected result:**
All tables should show `rowsecurity = false`

**If rowsecurity = true:**
Run this again:
```sql
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

---

## 🔍 Step 9: Check for Triggers/Functions

Sometimes database triggers can cause hangs:

```sql
-- Check for triggers on conversations table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'conversations';

-- Check for triggers on conversation_participants
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'conversation_participants';
```

**If you see unexpected triggers:**
```sql
DROP TRIGGER trigger_name ON table_name;
```

---

## 🔍 Step 10: Nuclear Option - Recreate Tables

If nothing else works, recreate the messaging tables:

```sql
-- BACKUP FIRST if you have data!

-- Drop tables
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Recreate
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_group BOOLEAN DEFAULT false,
  group_name VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Disable RLS
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] Supabase project is active (not paused)
- [ ] API keys match between dashboard and `.env`
- [ ] Browser network tab shows requests completing (not pending)
- [ ] No CORS errors in console
- [ ] RLS is disabled on messaging tables
- [ ] Supabase client version is up to date
- [ ] localStorage is cleared
- [ ] Tested in incognito mode
- [ ] Direct API test with cURL works
- [ ] No unexpected triggers on tables

---

## 🆘 If Nothing Works

### Contact Supabase Support

1. Go to https://supabase.com/dashboard
2. Click "Support" in bottom left
3. Describe the issue:
   - "Database queries hang indefinitely"
   - "INSERT and SELECT never return"
   - "Only affects authenticated client"
4. Include:
   - Project ID
   - Table names
   - Example query that hangs

### Alternative: Use REST API Directly

If Supabase client is broken, bypass it:

```javascript
// Instead of:
const { data } = await supabase.from('conversations').insert({...});

// Use fetch directly:
const response = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ is_group: false, created_by: userId })
});
const data = await response.json();
```

---

## 📝 Next Steps

Once you identify the issue:

1. **If it's a Supabase service issue**: Wait for resolution
2. **If it's an API key issue**: Update `.env` and restart
3. **If it's a network issue**: Check firewall/VPN
4. **If it's a code issue**: We can fix it together

Let me know what you find! 🔍
