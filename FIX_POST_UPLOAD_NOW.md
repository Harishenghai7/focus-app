# 🚨 URGENT: Run This SQL to Fix Post Upload

## The Issue:
Posts are failing with "permission denied for table posts" because the RLS policies haven't been created yet.

## ✅ Solution: Run the Schema Migration

### Step 1: Go to Supabase SQL Editor
1. Open https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy & Paste the SQL
Open this file and copy ALL the content:
```
c:\Users\history_creator_2007\focus-app\database\migrations\REBUILD_CORE_SCHEMA.sql
```

### Step 3: Run It
1. Paste the SQL into the editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait for it to complete (~5-10 seconds)

### Step 4: Verify
You should see a success message like:
```
Success. No rows returned
```

## ⚡ What This Does:
- Drops old mismatched tables
- Creates new tables matching your code
- Sets up RLS policies to allow authenticated users to create posts
- Creates indexes for performance
- Sets up triggers for timestamps

## 🎯 After Running:
Try uploading a post again - it should work immediately!

---

## 🔥 Quick Alternative (If You Can't Access Dashboard):

If you can't access the dashboard, I can create a simpler version that just adds the missing RLS policies without dropping tables.

Let me know if you need that instead!
