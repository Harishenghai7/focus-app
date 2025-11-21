# 📦 FOCUSLY 2.0 - DEPENDENCIES

## Required Dependencies

### Already Installed ✅
- `react` - Core framework
- `@google/generative-ai` - Gemini AI SDK
- `@supabase/supabase-js` - Database client

### Need to Install 📥
```bash
npm install axios
```

## Optional Dependencies (Premium Features)

### For Lottie Animations (Future Upgrade)
```bash
npm install lottie-react
```

### For Advanced Voice Features (Future)
```bash
npm install @elevenlabs/api
```

## Environment Variables Required

### `.env` or `.env.local`
```env
# REQUIRED - Get from https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OPTIONAL - Premium voice (https://elevenlabs.io)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_FOCUSLY_VOICE_ID=your_custom_voice_id_here
```

## Installation Command

Run this single command:
```bash
npm install axios
```

That's it! You're ready to go! 🚀

## Verification

Check your `package.json` should have:
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.x.x",
    "@supabase/supabase-js": "^2.x.x",
    "axios": "^1.x.x",
    "react": "^18.x.x"
  }
}
```

## Notes

- **Browser TTS is FREE** - No additional dependencies needed for voice
- **ElevenLabs is OPTIONAL** - Only if you want premium realistic voice
- **Lottie is OPTIONAL** - CSS animations work great for now!

---

Happy coding! 🦁✨
