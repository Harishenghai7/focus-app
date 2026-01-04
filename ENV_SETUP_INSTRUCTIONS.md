# Environment Configuration Template for Messages

Copy this to `.env.local` in your project root:

```env
# Tenor API for GIF support in Messages
# Get your API key from: https://tenor.com/developer
REACT_APP_TENOR_API_KEY=your_tenor_api_key_here
```

## How to Get Tenor API Key:

1. Visit https://tenor.com/developer
2. Sign up or log in with Google
3. Click "Create New App"
4. Fill in app details (name: "Focus App", description: "Social media messaging")
5. Copy the API key
6. Create `.env.local` file in project root and paste the key

The app will work without the Tenor API key, but the GIF picker will be disabled.
