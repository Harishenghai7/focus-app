# Supabase Edge Function Setup Guide

## 🚀 Deploy the Content Analysis Function

### Step 1: Install Supabase CLI

```powershell
# Install via npm
npm install -g supabase

# Or via Scoop (Windows package manager)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login to Supabase

```powershell
supabase login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```powershell
cd c:\Users\history_creator_2007\focus-app
supabase link --project-ref YOUR_PROJECT_REF
```

To find your `PROJECT_REF`:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID"

### Step 4: Deploy the Function

```powershell
supabase functions deploy analyze-content
```

### Step 5: Set Environment Variables (Optional - for Hugging Face API Key)

```powershell
supabase secrets set HUGGING_FACE_API_KEY=your_api_key_here
```

**Note:** The function works WITHOUT an API key using Hugging Face's free tier, but having a key gives you higher rate limits.

### Step 6: Test the Function

```powershell
# Test locally first
supabase functions serve analyze-content

# In another terminal, test it
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-content' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"text":"This is a test message"}'
```

## ✅ Verification

After deployment, your function will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-content
```

The frontend code has already been updated to call this endpoint automatically!

## 🔧 Troubleshooting

### Function not found?
- Make sure you're in the correct directory when deploying
- Verify the function name matches: `analyze-content`

### CORS errors?
- The function already includes CORS headers
- Make sure you're using the correct Supabase URL and anon key in your `.env` file

### Slow performance?
- Edge functions cold start in ~100-500ms
- After first call, they're cached and respond in <50ms
- Much faster than direct browser → Hugging Face calls!

## 📊 Monitoring

View function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Click on `analyze-content`
3. View Logs tab

## 💡 Benefits

✅ **No CORS Issues** - Server-to-server communication
✅ **Fast** - Runs on Deno at the edge (close to users)
✅ **Secure** - API keys stored server-side
✅ **Scalable** - Auto-scales with traffic
✅ **Free Tier** - Generous limits on Supabase free plan
