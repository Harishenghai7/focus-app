# 🔧 Edge Function Deployment - IMPORTANT CONFIGURATION

## ⚠️ CRITICAL: Configure Anonymous Access

After deploying the Edge Function via the Supabase Dashboard, you **MUST** enable anonymous access:

### Steps to Enable Anonymous Access:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Go to Edge Functions**
   - Click on "Edge Functions" in the left sidebar
   - Click on your `analyze-content` function

3. **Configure Function Settings**
   - Click on the **"Settings"** tab
   - Find **"Verify JWT"** option
   - **DISABLE** JWT verification (toggle it OFF)
   - Click **"Save"**

### Why This is Needed:
The content analysis function needs to be publicly accessible (no authentication required) because:
- It's called during post creation before the user's session is fully established
- It doesn't access sensitive data
- It only analyzes text content for safety

### Alternative: Use Service Role Key (Less Secure)
If you can't disable JWT verification, you can use the service role key instead:

In your `.env` file:
```env
REACT_APP_SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Then update `src/utils/contentAnalyzer.js` line 69:
```javascript
headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
}
```

**⚠️ WARNING**: Using the service role key in the frontend is NOT recommended for production as it bypasses all RLS policies!

### ✅ Recommended Solution:
**Disable JWT verification** for this specific function in the Supabase Dashboard settings.

---

## 📝 Deployment Checklist:

- [ ] Deploy function via Supabase Dashboard
- [ ] Disable "Verify JWT" in function settings
- [ ] Test the function with a POST request
- [ ] Try uploading a post in your app
- [ ] Verify no 401 errors in console

## 🧪 Test the Function:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-content \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test message"}'
```

You should get a 200 response with analysis results!
