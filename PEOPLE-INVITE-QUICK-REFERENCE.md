# 🧑‍🤝‍🧑 People & Invite - Quick Reference

## 📍 Routes
```
/people  → Discover new users
/invite  → Invite friends
```

## 🎯 People Page Features

### Discovery
- **Search**: Real-time search by username, name, or bio
- **Categories**: All, Popular (10+ followers), New Users (last 30 days)
- **Sort**: Most Popular, Most Active, Recently Joined
- **Refresh**: Get new suggestions

### User Cards
```
┌─────────────────────────────────────┐
│ [Avatar]  @username                 │
│           Full Name                 │
│           Bio preview...            │
│           100 followers • 50 posts  │
│                          [Follow →] │
└─────────────────────────────────────┘
```

### Follow Action
- **Public accounts**: Instant follow
- **Private accounts**: Send follow request
- Creates notification
- Removes from suggestions

## 🎯 Invite Page Features

### Methods

#### 1. Copy Link
```javascript
// One-click copy
window.location.origin + "/signup?ref=" + username
```

#### 2. Email Invite
```
To: friend@example.com
Subject: Join me on FocusApp!
Body: [Message + Link]
```

#### 3. SMS Invite
```
Opens messaging app with:
"Hey! Join me on FocusApp: [link]"
```

#### 4. Social Media
- **Twitter**: Tweet intent
- **Facebook**: Share dialog
- **LinkedIn**: Professional share
- **WhatsApp**: Direct message
- **Telegram**: Share URL

### History Tracking
```
┌─────────────────────────────────────┐
│ [📧] Email                          │
│      friend@example.com             │
│                          2 days ago │
├─────────────────────────────────────┤
│ [📱] SMS                            │
│      +1234567890                    │
│                          Yesterday  │
└─────────────────────────────────────┘
```

## 🔧 Quick Setup

### 1. Database
```bash
# Run migration
psql -d focus_app -f migrations/create-invites-table.sql
```

### 2. Navigation
```javascript
// Add to Header or Menu
<Link to="/people">People</Link>
<Link to="/invite">Invite</Link>
```

### 3. Test
```
1. Navigate to /people
2. Search for users
3. Follow someone
4. Navigate to /invite
5. Copy invite link
6. Check history
```

## 📊 Database Schema

### Invites Table
```sql
invites (
  id UUID PRIMARY KEY,
  user_id UUID → profiles(id),
  method TEXT,  -- email, sms, twitter, etc.
  recipient TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Profiles Addition
```sql
ALTER TABLE profiles 
ADD COLUMN referral_code TEXT UNIQUE;
```

## 🎨 Component Structure

### People.js
```
People
├── Header
│   ├── Title + Refresh
│   ├── Search Bar
│   ├── Category Pills
│   └── Sort Options
├── User List
│   └── User Cards[]
│       ├── Avatar
│       ├── Info
│       └── Follow Button
└── Sidebar
    └── SuggestedUsers
```

### Invite.js
```
Invite
├── Header (Gradient)
├── Tabs
│   ├── Send Invites
│   │   ├── Invite Link
│   │   ├── Email Form
│   │   ├── SMS Form
│   │   └── Social Buttons
│   └── History
│       └── Invite List[]
└── ShareModal (optional)
```

## 🔄 State Management

### People Page
```javascript
const [suggestedUsers, setSuggestedUsers] = useState([]);
const [activeCategory, setActiveCategory] = useState('all');
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState('followers');
const [followingIds, setFollowingIds] = useState(new Set());
```

### Invite Page
```javascript
const [inviteLink, setInviteLink] = useState('');
const [sentInvites, setSentInvites] = useState([]);
const [activeTab, setActiveTab] = useState('send');
const [email, setEmail] = useState('');
const [phone, setPhone] = useState('');
```

## 🚀 API Calls

### Fetch Suggested Users
```javascript
supabase
  .from('profiles')
  .select('id, username, full_name, avatar_url, bio, followers_count, posts_count')
  .neq('id', currentUserId)
  .not('id', 'in', followingIds)
  .order(sortBy, { ascending: false })
  .limit(50)
```

### Follow User
```javascript
supabase
  .from('follows')
  .insert({
    follower_id: myId,
    following_id: targetId,
    status: isPrivate ? 'pending' : 'accepted'
  })
```

### Save Invite
```javascript
supabase
  .from('invites')
  .insert({
    user_id: myId,
    method: 'email',
    recipient: 'friend@example.com'
  })
```

### Fetch Invite History
```javascript
supabase
  .from('invites')
  .select('*')
  .eq('user_id', myId)
  .order('created_at', { ascending: false })
```

## 🎨 Key CSS Classes

### People.css
```css
.people-page              → Main container
.people-header            → Header section
.people-search            → Search bar
.people-categories        → Category pills
.category-btn.active      → Active category
.people-list              → User cards container
.person-card              → Individual user card
.follow-btn               → Follow button
.people-sidebar           → Sidebar section
```

### Invite.css
```css
.invite-page              → Main container
.invite-header            → Gradient header
.invite-tabs              → Tab navigation
.tab-btn.active           → Active tab
.invite-link-box          → Link display
.copy-btn.copied          → Copied state
.invite-form              → Email/SMS forms
.social-buttons           → Social grid
.invite-history-list      → History items
```

## 📱 Responsive Breakpoints

```css
/* Desktop: >1024px */
Two-column layout, sidebar visible

/* Tablet: 768px - 1024px */
Single column, sidebar hidden

/* Mobile: <768px */
Stacked layout, horizontal scroll categories

/* Small Mobile: <480px */
Compact spacing, smaller fonts
```

## ♿ Accessibility

### ARIA Labels
```javascript
aria-label="Follow username"
aria-label="Refresh suggestions"
aria-label="Search people"
```

### Keyboard Navigation
- Tab through buttons
- Enter to activate
- Arrow keys for navigation

### Screen Readers
- Semantic HTML
- Descriptive labels
- Status announcements

## 🐛 Common Issues & Solutions

### Issue: Users not loading
```javascript
// Check: Is user logged in?
if (!user?.id) return;

// Check: Database query
console.log('Fetching users...', { userId: user.id });
```

### Issue: Follow not working
```javascript
// Check: Follow relationship exists
const { data } = await supabase
  .from('follows')
  .select('*')
  .eq('follower_id', myId)
  .eq('following_id', targetId);
```

### Issue: Invite link not copying
```javascript
// Check: Clipboard API support
if (navigator.clipboard) {
  await navigator.clipboard.writeText(link);
} else {
  // Fallback
  const input = document.createElement('input');
  input.value = link;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}
```

## 🎯 Testing Checklist

### People
- [ ] Page loads without errors
- [ ] Search filters users
- [ ] Categories filter correctly
- [ ] Sort changes order
- [ ] Follow button works
- [ ] Profile navigation works
- [ ] Refresh gets new data
- [ ] Responsive on mobile

### Invite
- [ ] Invite link generated
- [ ] Copy link works
- [ ] Email opens client
- [ ] SMS opens messaging
- [ ] Social links open correctly
- [ ] History displays invites
- [ ] Tabs switch smoothly
- [ ] Forms validate input

## 📈 Analytics Hooks

```javascript
// Track page views
useEffect(() => {
  analytics.track('People Page Viewed');
}, []);

// Track follow action
const handleFollow = (userId) => {
  analytics.track('User Followed', { userId });
  // ... follow logic
};

// Track invite sent
const handleInvite = (method, recipient) => {
  analytics.track('Invite Sent', { method, recipient });
  // ... invite logic
};
```

## 🔗 Related Components

- `SuggestedUsers.js` - Sidebar suggestions
- `ShareModal.js` - Share functionality
- `FollowButton.js` - Follow button logic
- `Layout.js` - Page layout wrapper

## 🔗 Related Hooks

- `useClipboard.js` - Copy to clipboard
- `useNavigate` - Page navigation
- `useState` - State management
- `useEffect` - Side effects

## 📚 Related Pages

- `/profile/:username` - User profiles
- `/explore` - Explore content
- `/search` - Global search
- `/settings` - User settings

---

## 🎉 Quick Commands

```bash
# Navigate to pages
/people   # Discover users
/invite   # Invite friends

# Database
psql -d focus_app -f migrations/create-invites-table.sql

# Test
npm test People.test.js
npm test Invite.test.js
```

---

**✅ READY TO USE**

Both pages are fully functional and production-ready!

---

*Last Updated: November 16, 2025*
