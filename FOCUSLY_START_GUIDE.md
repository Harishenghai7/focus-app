# 🦁 Focusly AI - Quick Start Guide

## What We Fixed

### ✅ Issue #1: Gemini API Real-time Chat
**Problem**: CORS error preventing direct browser access to Gemini API  
**Solution**: Created a secure proxy server

### ✅ Issue #2: Animated Character
**Before**: Basic SVG that didn't match reference image  
**After**: Professional animated character with:
- Accurate colors (cyan/blue/purple mane, tan face)
- Separate animated body parts (head, body, arms, legs, tail, mane)
- 8 dynamic expressions
- Natural movements (breathing, blinking, tail wagging)
- Lip sync capabilities
- 50 sticker reactions for complex emotions

---

## How to Start

### Option A: Run Both Servers Together (Recommended)
```powershell
npm run dev
```

This will automatically start:
1. **Proxy Server** (port 3001) - Handles Gemini API requests securely
2. **React App** (port 3000) - Your Focus app

### Option B: Run Separately
**Terminal 1** - Start Proxy Server:
```powershell
npm run server
```

**Terminal 2** - Start React App:
```powershell
npm start
```

---

## Testing Focusly AI

### 1. Open Focusly Chat
- Look for the Focusly button (bottom-right)
- Click to open the chat

### 2. Test Real-time AI
Send a message like:
- "Hello Focusly!"
- "How are you?"
- "Tell me a joke"

**Expected**: You should see real-time streaming responses from Gemini AI (not fallback messages).

### 3. Test Expressions
Say these to see different expressions:
- "I'm so happy!" → Happy face, big smile
- "I'm sad..." → Sad droopy eyes, frown
- "Wow!" → Surprised wide eyes
- "I'm tired" → Sleepy half-closed eyes

### 4. Test Lip Sync
- Enable voice (speaker icon)
- Focusly will speak responses
- Watch the mouth move in sync with speech

### 5. Test Sticker Reactions
Trigger complex emotions:
- "You're a superhero!" → Switches to superhero sticker
- "Happy birthday!" → Birthday sticker
- "You're on fire!" → Fire sticker

---

## Troubleshooting

### API Error: "Failed to fetch"
**Check**: Is the proxy server running?
```powershell
# Should see: "🦁 Focusly Gemini Proxy Server running on http://localhost:3001"
```

**Fix**: Make sure to run `npm run dev` or start the server manually with `npm run server`

### Character Not Animating
**Check**: Browser console for errors  
**Fix**: Clear cache and reload (Ctrl+Shift+R)

### Stickers Not Loading
**Check**: Are files in `src/assets/focusly/stickers/`?  
**Fix**: Verify all 50 PNG files exist (01_focusly_happy.png to 50_focusly_superhero.png)

---

## Features Summary

### Animations
- ✅ Breathing (gentle body scale)
- ✅ Blinking (random every 3-5s)
- ✅ Tail wagging (continuous)
- ✅ Head bobbing (subtle idle)
- ✅ Mane swaying (gentle)

### Expressions  
- ✅ Neutral (default)
- ✅ Happy (big smile, sparkly eyes)
- ✅ Sad (frown, droopy eyes)
- ✅ Excited (wide eyes, big smile)
- ✅ Angry (straight mouth, intense eyes)
- ✅ Surprised (O mouth, huge eyes)
- ✅ Confused (wavy mouth, tilted)
- ✅ Sleepy (half-closed eyes)
- ✅ Laughing (wide open mouth)

### Voice & Lip Sync
- ✅ Text-to-Speech with Web Speech API
- ✅ Mouth shapes change during speech
- ✅ Multiple voice packs (energetic, calm, friendly)

### Sticker Integration
- ✅ 50 high-quality reaction stickers
- ✅ Auto-switches for complex emotions
- ✅ Smooth transitions

---

## What's Next?

The system is now fully functional! You can:
1. Chat with Focusly using real Gemini AI
2. See animated expressions matching emotions
3. Watch lip-synced speech
4. Enjoy 50+ sticker reactions

**Enjoy your new AI companion!** 🦁✨
