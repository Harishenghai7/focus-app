# New Supabase Project Setup

## 1. Create New Supabase Project
- Go to https://supabase.com/dashboard
- Click "New Project"
- Name: "focus-app-production"
- Create project

## 2. Get New Credentials
- Go to Settings → API
- Copy:
  - Project URL
  - anon public key

## 3. Update supabaseClient.js
Replace with new credentials:
```javascript
const supabaseUrl = 'YOUR_NEW_URL'
const supabaseAnonKey = 'YOUR_NEW_KEY'
```

## 4. Run This SQL (SQL Editor)
```sql
-- Simple setup without triggers
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No RLS, no triggers, no complications
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

## 5. Authentication Settings
- Authentication → Settings
- Enable "Allow new users to sign up" ✅
- Disable "Enable email confirmations" ❌
- Site URL: your production domain

## 6. Update Auth.js
Use the working Auth.js we created earlier (not MockAuth)

This will give you a clean, working Supabase setup for production.