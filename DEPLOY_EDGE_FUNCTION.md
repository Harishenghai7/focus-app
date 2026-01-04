# 🚀 Manual Deployment Guide for Supabase Edge Function

Since automated CLI installation requires specific permissions, here's the **easiest manual deployment method**:

## Option 1: Deploy via Supabase Dashboard (EASIEST - 2 minutes!)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your Focus app project
3. Click on **Edge Functions** in the left sidebar

### Step 2: Create New Function
1. Click **"Create a new function"**
2. Name it: `analyze-content`
3. Click **Create function**

### Step 3: Copy & Paste the Code
1. Delete the default code
2. Copy the entire content from: `c:\Users\history_creator_2007\focus-app\supabase\functions\analyze-content\index.ts`
3. Paste it into the editor
4. Click **Deploy**

### Step 4: Test It
1. In the dashboard, go to the **Invoke** tab
2. Paste this test payload:
```json
{
  "text": "This is a test message"
}
```
3. Click **Invoke function**
4. You should see a response like:
```json
{
  "flagged": false,
  "categories": {},
  "category_scores": {},
  "fallback": true
}
```

### Step 5: Done! ✅
Your function is now live at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-content
```

The frontend is already configured to use it automatically!

---

## Option 2: Install CLI Manually (if you prefer command line)

### Download Supabase CLI Binary
1. Go to: https://github.com/supabase/cli/releases/latest
2. Download: `supabase_windows_amd64.tar.gz`
3. Extract it to a folder (e.g., `C:\supabase`)
4. Add `C:\supabase` to your PATH environment variable

### Then Deploy
```powershell
cd c:\Users\history_creator_2007\focus-app
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy analyze-content
```

---

## 🎯 Recommended: Use Option 1 (Dashboard)
It's faster, easier, and doesn't require any CLI installation!

## ✅ Verification
After deployment, try uploading a post in your app. It should work instantly without CORS errors!

## 🔧 Troubleshooting
- **Function not working?** Check the function logs in the dashboard
- **Still getting CORS?** Make sure your `.env` has the correct `REACT_APP_SUPABASE_URL`
- **Slow uploads?** The first call to the function has a "cold start" (~500ms), subsequent calls are <50ms
