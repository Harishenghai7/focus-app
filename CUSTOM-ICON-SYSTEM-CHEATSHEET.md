# 🎨 CUSTOM ICON SYSTEM - QUICK START GUIDE

## ⚡ TL;DR - Get Started in 30 Seconds

```javascript
// 1. Import
import { HomeIcon, BoltzIcon, LikeIcon } from '../components/icons';

// 2. Use
<HomeIcon size={24} />
<BoltzIcon animated={true} />
<LikeIcon filled={true} color="#FF0000" />

// Done! 🎉
```

---

## 📍 File Location
```
src/components/icons/
├── 20 icon files (.js)
├── icons.css
├── index.js (import from here!)
└── README.md
```

---

## 🎯 All 20 Icons

### Navigation (9)
```
HomeIcon          🏠 Home tab
ExploreIcon       🧭 Explore/Discover
CreateIcon        ➕ Create post
BoltzIcon ⚡      ⚡ Boltz (signature!)
FlashIcon         📸 Stories
MessagesIcon      💬 Messages
NotificationsIcon 🔔 Notifications
ProfileIcon       👤 Profile
FocuslyIcon 🦁    🦁 AI mascot
```

### Actions (5)
```
LikeIcon          ❤️ Like
CommentIcon       💬 Comment
ShareIcon         📤 Share
SaveIcon          📌 Save
MoreIcon          ⋯ More options
```

### Content (3)
```
CameraIcon        📷 Camera
VideoIcon         🎥 Video
MusicIcon         🎵 Music
```

### Utility (2)
```
SettingsIcon      ⚙️ Settings
SearchIcon        🔍 Search
```

---

## 💻 Common Code Patterns

### Navigation Button
```javascript
<button className={active ? 'active' : ''}>
  <HomeIcon size={24} filled={active} />
</button>
```

### Like Button
```javascript
<button onClick={() => setLiked(!liked)}>
  <LikeIcon
    size={20}
    filled={liked}
    animated={liked}
    color={liked ? '#FF0000' : 'currentColor'}
  />
</button>
```

### Notification Badge
```javascript
<div className="icon-badge" data-badge="5">
  <NotificationsIcon size={24} hasUnread={true} />
</div>
```

### Animated Boltz Icon
```javascript
<BoltzIcon
  size={28}
  filled={isActive}
  animated={isActive}
/>
```

### Focusly AI Button
```javascript
<button>
  <FocuslyIcon size={40} animated={isThinking} />
  Ask Focusly
</button>
```

---

## 🎨 Props Quick Reference

```javascript
// All icons support these props:

<IconName
  size={24}                          // 24 = default
  color="#FF0000"                    // Use hex colors
  filled={true}                      // Outline (false) or filled (true)
  animated={true}                    // Enable animation if available
  className="custom-class"           // Add CSS classes
  strokeWidth={2}                    // Line thickness
  {...svgProps}                      // Any SVG props
/>
```

---

## 🎬 Animations Available

```javascript
// Pulse effect (BoltzIcon)
<BoltzIcon animated={true} />

// Pop effect (LikeIcon)
<LikeIcon animated={true} filled={true} />

// Shake effect (NotificationsIcon)
<NotificationsIcon animated={true} />

// Spin effect (SettingsIcon)
<SettingsIcon animated={true} />

// Thinking effect (FocuslyIcon)
<FocuslyIcon animated={true} />
```

---

## 🌈 Brand Colors

```javascript
// Use these hex colors:

#0095F6      // Focus Blue (primary)
#7B68EE      // Purple
#667eea      // Gradient start
#764ba2      // Gradient end
#FF0000      // Red (for likes)
#2ECC40      // Green (success)
#FFB800      // Yellow (warning)
```

**Example:**
```javascript
<BoltzIcon color="#667eea" />
<LikeIcon filled color="#FF0000" />
<HomeIcon color="#0095F6" />
```

---

## 📱 Responsive Sizing

```javascript
// Option 1: Size prop
const mobileSize = 18;
const desktopSize = 24;
const size = isMobile ? mobileSize : desktopSize;
<HomeIcon size={size} />

// Option 2: CSS classes
<HomeIcon className="icon-responsive" />

// CSS classes available:
// icon-xs  (16px)
// icon-sm  (18px)
// icon-md  (24px)
// icon-lg  (32px)
// icon-xl  (40px)
// icon-2xl (48px)
```

---

## 🔍 Find & Replace for Migration

If migrating from lucide-react:

```
Home              → HomeIcon
Compass           → ExploreIcon
Plus              → CreateIcon
Zap               → BoltzIcon
Heart             → LikeIcon
MessageCircle     → CommentIcon
Share2            → ShareIcon
Bookmark          → SaveIcon
MoreHorizontal    → MoreIcon
Bell              → NotificationsIcon
MessageSquare     → MessagesIcon
User              → ProfileIcon
Settings          → SettingsIcon
Search            → SearchIcon
Camera            → CameraIcon
Video             → VideoIcon
Music             → MusicIcon
```

---

## ✅ Implementation Checklist

```
☐ Import icons in BottomNav.js
☐ Update Navigation component
☐ Update PostCard.js for interactions
☐ Add Boltz icon to nav (with animation)
☐ Add Focusly AI button
☐ Test all icons render
☐ Test animations work
☐ Test on mobile
☐ Test dark mode (if applicable)
☐ Verify no console errors
```

---

## 🎯 Next Steps

### 1. Start Using Now
```javascript
import { HomeIcon, BoltzIcon } from '../components/icons';

export default function App() {
  return (
    <>
      <HomeIcon size={24} />
      <BoltzIcon size={24} animated={true} />
    </>
  );
}
```

### 2. Update Your Components
Look for any lucide-react imports and replace with custom icons

### 3. Test Everything
Verify icons look good on desktop and mobile

### 4. Deploy
You're ready to go! 🚀

---

## 📚 Full Documentation

For detailed information, see:
- **ICON-SYSTEM-DOCUMENTATION.md** - Complete API reference
- **ICON-SYSTEM-IMPLEMENTATION-GUIDE.md** - Step-by-step setup
- **ICON-SYSTEM-QUICK-REFERENCE.js** - Lookup examples

---

## 🆘 Troubleshooting

**Icon not showing?**
- ✓ Check import path: `from '../components/icons'`
- ✓ Verify icon name is correct
- ✓ Check console for errors

**Animation not working?**
- ✓ Set `animated={true}` prop
- ✓ Verify `icons.css` is imported
- ✓ Not all icons have animations (BoltzIcon, LikeIcon, etc.)

**Size not working?**
- ✓ Use `size` prop: `<HomeIcon size={32} />`
- ✓ Or CSS class: `className="icon-lg"`

**Color not applying?**
- ✓ Use `color` prop: `<HomeIcon color="#FF0000" />`
- ✓ Or CSS: `style={{ color: '#FF0000' }}`

---

## 💡 Pro Tips

1. **Always import from index.js:**
   ```javascript
   import { HomeIcon } from '../components/icons';  ✓ Good
   import HomeIcon from '../components/icons/HomeIcon.js';  ✗ Bad
   ```

2. **Use React hooks for state:**
   ```javascript
   const [liked, setLiked] = useState(false);
   <LikeIcon filled={liked} />
   ```

3. **Combine props for best results:**
   ```javascript
   <LikeIcon size={20} filled={liked} animated={liked} color={liked ? '#FF0000' : 'currentColor'} />
   ```

4. **Use className for styling groups:**
   ```javascript
   <div className="post-actions">
     <LikeIcon /> <CommentIcon /> <ShareIcon />
   </div>
   ```

5. **Consider performance:**
   ```javascript
   // Good: animated only when active
   <BoltzIcon animated={active === 'boltz'} />
   
   // Not ideal: animating always
   <BoltzIcon animated={true} />
   ```

---

## 🎉 YOU'RE ALL SET!

Your Focus App now has a **professional custom icon system**.

Start using it now:

```javascript
import { HomeIcon, BoltzIcon, FocuslyIcon } from '../components/icons';

// That's it! Enjoy your beautiful custom icons! 🎨✨
```

---

**Questions? Check the full documentation files or review the icon source code in `src/components/icons/`**

Happy coding! 🚀
