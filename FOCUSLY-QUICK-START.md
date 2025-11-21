# 🦁 FOCUSLY 2.0 - QUICK START GUIDE

## ⚡ GET FOCUSLY RUNNING IN 5 MINUTES!

### Step 1: Install Dependency (30 seconds)
```bash
npm install axios
```

### Step 2: Add API Key (1 minute)
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env`:
```env
VITE_GEMINI_API_KEY=your_key_here
```

### Step 3: Set Up Database (2 minutes)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `FOCUSLY-DATABASE-SETUP.sql`

### Step 4: Use the Component (30 seconds)
```javascript
import FocuslyChat from './components/FocuslyChat/FocuslyChat';

// In your component:
<FocuslyChat userId={user.id} />
```

### Step 5: Test It! (1 minute)
1. Start your app: `npm run dev`
2. Open Focusly chat
3. Say: "Hi, I'm [Your Name]"
4. Watch the magic! ✨

---

## 🎯 FEATURES AT A GLANCE

| Feature | Status | How to Use |
|---------|--------|------------|
| **AI Chat** | ✅ Ready | Just type and send! |
| **Voice Output** | ✅ Ready | Click 🔊 button to enable |
| **Animations** | ✅ Ready | Automatic based on emotion |
| **Memory** | ✅ Ready | Automatic - Focusly remembers! |
| **Emotions** | ✅ Ready | Automatic detection |

---

## 💡 WHAT CAN FOCUSLY DO?

### 1. Personal Conversations
```
You: "Hi Focusly!"
Focusly: "Hey there! 👋 How's your day going?"
```

### 2. Remember You
```
You: "My name is Alex and I love coding"
[Later...]
You: "What's my name?"
Focusly: "Your name is Alex! And I know you love coding! 💻"
```

### 3. Help with Homework
```
You: "Can you help me with math?"
Focusly: "Absolutely! I'd love to help! What math problem are you working on? 🧮"
```

### 4. Emotional Support
```
You: "I'm feeling sad today"
Focusly: "Aww, I'm sorry you're feeling down. 🥺 Want to talk about it? I'm here for you! 💙"
```

### 5. Celebrate Wins
```
You: "I got an A on my test!"
Focusly: "THAT'S AMAZING! 🎉 I'm so proud of you! You worked so hard for this! 🌟"
```

---

## 🎨 CUSTOMIZATION (OPTIONAL)

### Change Avatar Size
```javascript
// In your page/route component
import FocuslyAvatar from './components/FocuslyAvatar/FocuslyAvatar';

<FocuslyAvatar 
  emotion="happy"
  size={250}
/>
```

### Premium Voice (Optional)
1. Sign up at https://elevenlabs.io
2. Get API key
3. Add to `.env`:
```env
VITE_ELEVENLABS_API_KEY=your_key
```

---

## 📱 MOBILE RESPONSIVE

Focusly works perfectly on:
- ✅ Desktop (Chrome, Firefox, Edge, Safari)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet (iPad, Android tablets)

---

## 🐛 QUICK FIXES

**Focusly not responding?**
- Restart dev server after adding `.env`
- Check API key is correct
- Check console for errors

**Voice not working?**
- Click the 🔊 button to enable
- Use Chrome or Edge (best support)
- Check browser allows audio

**Memory not working?**
- Make sure database SQL is run
- Check user is logged in
- Verify `userId` is passed to component

---

## 🚀 YOU'RE ALL SET!

Start chatting with Focusly and watch it become your users' favorite feature! 🦁✨

---

**Need help?** Check `FOCUSLY-2.0-IMPLEMENTATION-GUIDE.md` for detailed docs.
