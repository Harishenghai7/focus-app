# Focusly AI Virtual Companion - Setup Guide

## 🎯 Overview

Focusly AI is a next-generation virtual companion featuring:
- **Animated 3D Avatar** with expressions, gestures, and lip sync
- **Voice Synthesis** with customizable voice packs
- **Speech Recognition** for voice input
- **Emotion Detection** for empathetic responses
- **Context Awareness** based on current page and user activity
- **Proactive Tips** and onboarding guidance

## 🔧 Setup Instructions

### 1. Install Dependencies

All required dependencies are already in your `package.json`. The main one is:
- `@google/generative-ai` - For Gemini AI integration

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Configure Environment Variables

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```env
# Existing variables
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key

# Focusly AI - Add this
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:** Replace `your_gemini_api_key_here` with your actual Gemini API key.

### 4. Start the Development Server

```bash
npm start
```

## 🎮 Using Focusly AI

### Opening Focusly

- **Click** the floating Focusly button (bottom-right corner)
- **Keyboard Shortcut:** `Ctrl + Shift + F`

### Features

#### 💬 Chat
- Type messages or use the microphone button for voice input
- Focusly responds with text and voice
- Context-aware based on current page

#### 🎤 Voice Input
- Click the microphone icon in the chat input
- Speak your message
- Works best in Chrome/Edge browsers

#### 🔊 Voice Output
- Focusly speaks all responses by default
- Toggle voice on/off with the speaker icon
- Customize voice settings (coming soon)

#### 😊 Emotions & Expressions
- Focusly detects your mood from messages
- Avatar changes expressions based on emotion
- Provides empathetic responses

#### 🎯 Contextual Help
- Ask about features on the current page
- Get tips and guidance
- Click suggestions for quick questions

### Keyboard Shortcuts

- `Ctrl + Shift + F` - Toggle Focusly chat

## 🎨 Customization

### Voice Packs

Focusly supports different voice personalities:
- **Energetic** (default) - Fast and upbeat
- **Calm** - Slow and soothing
- **Motivational** - Encouraging and positive
- **Friendly** - Warm and welcoming
- **Professional** - Clear and neutral

### Animation Levels

- **Full** - All animations enabled
- **Reduced** - Minimal animations for performance
- **Minimal** - Only essential animations

## 🔧 Troubleshooting

### Voice Not Working

**Problem:** Focusly isn't speaking
**Solutions:**
1. Check if voice is enabled (speaker icon in chat header)
2. Ensure browser supports Web Speech API (Chrome/Edge recommended)
3. Check browser audio settings

### Speech Recognition Not Working

**Problem:** Microphone button doesn't work
**Solutions:**
1. Use Chrome or Edge browser (best support)
2. Grant microphone permissions when prompted
3. Check browser microphone settings

### API Key Issues

**Problem:** Focusly says "I need a Gemini API key"
**Solutions:**
1. Verify `.env` file exists in project root
2. Check `REACT_APP_GEMINI_API_KEY` is set correctly
3. Restart development server after adding API key

### Performance Issues

**Problem:** Animations are laggy
**Solutions:**
1. Reduce animation level in settings
2. Close other browser tabs
3. Check CPU usage

## 📱 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Chat | ✅ | ✅ | ✅ | ✅ |
| Voice Output | ✅ | ✅ | ⚠️ | ⚠️ |
| Voice Input | ✅ | ✅ | ❌ | ⚠️ |
| Animations | ✅ | ✅ | ✅ | ✅ |

✅ Full support | ⚠️ Partial support | ❌ Not supported

**Recommended:** Chrome or Edge for best experience

## 🎯 Features by Page

### Home
- Feed overview and navigation help
- Post creation guidance
- Engagement tips

### Explore
- Discovery features explanation
- Search tips
- Trending content insights

### Create
- Content creation guidance
- Media upload help
- Best practices

### Boltz
- Video features explanation
- Interaction tips
- Creation guidance

### Profile
- Profile customization help
- Badge information
- Statistics explanation

### Messages
- Messaging features
- Media sharing tips
- Group chat help

### Settings
- Settings navigation
- Privacy guidance
- Customization help

## 🔐 Privacy

- All conversation history stored **locally** in your browser
- No data sent to external servers (except Gemini API for responses)
- Clear data anytime from browser settings
- Context memory can be disabled in preferences

## 🚀 Advanced Usage

### Proactive Tips

Focusly can provide proactive tips based on:
- Current page context
- User activity patterns
- Time since last interaction

### Emotion Tracking

Focusly tracks your mood over time to:
- Provide better emotional support
- Adapt response tone
- Offer timely encouragement

### Context Memory

Focusly remembers:
- Previous conversations
- Your preferences
- Interaction patterns
- Mood history

All stored locally for privacy!

## 📝 Notes

- First-time users will see an onboarding greeting
- Focusly greets returning users after 1+ hour breaks
- Notification badge shows proactive tips
- Draggable - position Focusly anywhere on screen

## 🐛 Known Limitations

1. **Speech Recognition** requires Chrome/Edge
2. **Voice quality** depends on browser TTS engine
3. **Lip sync** is approximate (not phoneme-perfect)
4. **Emotion detection** is keyword-based (not ML)
5. **Context awareness** is page-level (not element-specific)

## 🔮 Coming Soon

- [ ] Onboarding guided tour
- [ ] Mini-games and riddles
- [ ] Advanced settings panel
- [ ] Voice pack customization
- [ ] Tooltip-based feature guidance
- [ ] Achievement celebrations
- [ ] Daily productivity tips

---

**Need help?** Ask Focusly! Just open the chat and say "help" 😊
