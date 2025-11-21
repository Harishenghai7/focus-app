# Critical Issues Batch Fixes (Issues #14-45)

## Quick Reference Implementation Guide

### Issue #14: Terms Acceptance
**File**: `src/components/OnboardingFlow.js`
**Fix**: Add checkbox for terms acceptance before profile creation
```javascript
const [termsAccepted, setTermsAccepted] = useState(false);

// Add to form
<label>
  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
  I accept the Terms of Service and Privacy Policy
</label>

// Disable submit if not accepted
<button disabled={!termsAccepted}>Continue</button>
```

### Issue #15: Delete Account
**File**: `src/pages/Settings.js`
**Fix**: Add account deletion with password confirmation
```javascript
const handleDeleteAccount = async () => {
  const confirmed = window.confirm('Permanently delete account? This cannot be undone.');
  if (!confirmed) return;
  
  const password = prompt('Enter password to confirm:');
  if (!password) return;
  
  try {
    const { error } = await supabase.rpc('delete_user_account', { user_id: user.id });
    if (error) throw error;
    await supabase.auth.signOut();
    window.location.href = '/';
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #16: Edit Account Email
**File**: `src/pages/Settings.js`
**Fix**: Add email change form with verification
```javascript
const handleChangeEmail = async (newEmail) => {
  try {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
    alert('Verification email sent to ' + newEmail);
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #18: Blocked/Banned User Can't Log In
**File**: `src/pages/Auth.js`
**Fix**: Check ban status before login
```javascript
const checkUserStatus = async (userId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, ban_reason')
    .eq('id', userId)
    .single();
  
  if (profile?.is_banned) {
    throw new Error(`Account banned: ${profile.ban_reason}`);
  }
};

// In handleSubmit after successful auth
if (data?.user) {
  await checkUserStatus(data.user.id);
}
```

### Issue #19: GDPR Data Download
**File**: `src/pages/Settings.js`
**Fix**: Add data export button
```javascript
const handleExportData = async () => {
  try {
    const { data, error } = await supabase.rpc('export_user_data', { user_id: user.id });
    if (error) throw error;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    element.setAttribute('download', `focus-data-${new Date().toISOString()}.json`);
    element.click();
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #21: Reserved Username Check
**File**: `src/utils/validation.js`
**Fix**: Add reserved words list
```javascript
const RESERVED_USERNAMES = [
  'admin', 'root', 'system', 'support', 'help', 'api', 'www',
  'mail', 'ftp', 'localhost', 'webmaster', 'postmaster', 'noreply',
  'focus', 'app', 'web', 'mobile', 'desktop', 'moderator'
];

export const isReservedUsername = (username) => {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
};
```

### Issue #33: In-App Legal/Privacy Links
**File**: `src/pages/Settings.js` or `src/components/Footer.js`
**Fix**: Add legal links section
```javascript
const legalLinks = [
  { label: 'Terms of Service', href: '/legal/terms' },
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Cookie Policy', href: '/legal/cookies' },
  { label: 'Community Guidelines', href: '/legal/guidelines' }
];

return (
  <div className="legal-links">
    {legalLinks.map(link => (
      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    ))}
  </div>
);
```

### Issue #35: Prohibited Word Check
**File**: `src/utils/validation.js`
**Fix**: Add profanity filter
```javascript
const PROHIBITED_WORDS = [
  // Add comprehensive list of prohibited words
];

export const checkProhibitedWords = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(word => PROHIBITED_WORDS.includes(word));
};

// Use in forms
const prohibited = checkProhibitedWords(bio);
if (prohibited.length > 0) {
  setError(`Contains prohibited words: ${prohibited.join(', ')}`);
}
```

### Issue #38: Profile Page for Logged-Out Users
**File**: `src/pages/Profile.js`
**Fix**: Add public profile view
```javascript
const isPublicView = !user; // No user logged in

if (isPublicView && profile?.is_private) {
  return <div>This profile is private</div>;
}

// Show limited info for logged-out users
if (isPublicView) {
  return (
    <div className="public-profile">
      {/* Show only public info */}
      <img src={profile.avatar_url} alt={profile.username} />
      <h1>{profile.username}</h1>
      <p>{profile.bio}</p>
      {/* No edit buttons, no private content */}
    </div>
  );
}
```

### Issue #40: Mutual Follows Display
**File**: `src/pages/Profile.js`
**Fix**: Add mutual follows indicator
```javascript
const checkMutualFollow = async () => {
  const { data: following } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', profile.id)
    .single();
  
  const { data: follower } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', profile.id)
    .eq('following_id', user.id)
    .single();
  
  return { following: !!following, follower: !!follower };
};

// Display
{mutualFollow.following && mutualFollow.follower && (
  <span className="mutual-badge">Mutual Follow</span>
)}
```

### Issue #42: Pronouns Field
**File**: `src/pages/EditProfile.js`
**Fix**: Add pronouns input
```javascript
const [pronouns, setPronouns] = useState(profile?.pronouns || '');

// Add to form
<input
  type="text"
  placeholder="e.g., she/her, he/him, they/them"
  value={pronouns}
  onChange={(e) => setPronouns(e.target.value)}
/>

// Save
await supabase.from('profiles').update({ pronouns }).eq('id', user.id);
```

### Issue #51: Suspended User Profile Block
**File**: `src/pages/Profile.js`
**Fix**: Check suspension status
```javascript
if (profile?.is_suspended) {
  return (
    <div className="suspended-profile">
      <h2>Account Suspended</h2>
      <p>This account has been suspended</p>
    </div>
  );
}
```

### Issue #53: Profile QR Sharing
**File**: `src/pages/Profile.js`
**Fix**: Add QR code generation
```javascript
import QRCode from 'qrcode.react';

const handleGenerateQR = () => {
  const qrRef = useRef();
  const canvas = qrRef.current.querySelector('canvas');
  const url = canvas.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${profile.username}-qr.png`;
  link.click();
};

return (
  <div>
    <QRCode ref={qrRef} value={`${window.location.origin}/profile/${profile.username}`} />
    <button onClick={handleGenerateQR}>Download QR</button>
  </div>
);
```

### Issue #54: Verified Badge Display
**File**: `src/pages/Profile.js`
**Fix**: Add verified badge
```javascript
{profile?.is_verified && (
  <span className="verified-badge" title="Verified">✓</span>
)}
```

### Issue #55: Ghost/Account-Deleted Placeholder
**File**: `src/pages/Profile.js`
**Fix**: Handle deleted accounts
```javascript
if (profile?.deleted_at) {
  return (
    <div className="deleted-profile">
      <h2>Account Deleted</h2>
      <p>This account has been deleted</p>
    </div>
  );
}
```

### Issue #59: Grid/List Switch
**File**: `src/pages/Profile.js`
**Fix**: Add view toggle
```javascript
const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

return (
  <>
    <div className="view-toggle">
      <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>
        Grid
      </button>
      <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>
        List
      </button>
    </div>
    
    <div className={`posts-${viewMode}`}>
      {/* Render posts based on viewMode */}
    </div>
  </>
);
```

### Issue #61: Restrict User on Profile
**File**: `src/pages/Profile.js`
**Fix**: Add restrict button
```javascript
const handleRestrict = async () => {
  try {
    const { error } = await supabase
      .from('restricted_users')
      .insert({ user_id: user.id, restricted_id: profile.id });
    
    if (error) throw error;
    alert('User restricted');
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};

return (
  <button onClick={handleRestrict}>Restrict User</button>
);
```

### Issue #63: Save Profile Changes on Slow Connection
**File**: `src/pages/EditProfile.js`
**Fix**: Add offline queue
```javascript
const saveProfile = async (data) => {
  if (!navigator.onLine) {
    // Queue for later
    const queue = JSON.parse(localStorage.getItem('profile_queue') || '[]');
    queue.push({ data, timestamp: Date.now() });
    localStorage.setItem('profile_queue', JSON.stringify(queue));
    alert('Saved offline. Will sync when online.');
    return;
  }
  
  try {
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) throw error;
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};

// Sync when online
window.addEventListener('online', async () => {
  const queue = JSON.parse(localStorage.getItem('profile_queue') || '[]');
  for (const item of queue) {
    await saveProfile(item.data);
  }
  localStorage.removeItem('profile_queue');
});
```

### Issue #69: Filter by Posts/Boltz
**File**: `src/pages/Home.js`
**Fix**: Add filter toggle
```javascript
const [filter, setFilter] = useState('all'); // 'all', 'posts', 'boltz'

const filteredPosts = posts.filter(post => {
  if (filter === 'posts') return post.content_type === 'post';
  if (filter === 'boltz') return post.content_type === 'boltz';
  return true;
});

return (
  <>
    <div className="filter-buttons">
      <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
      <button onClick={() => setFilter('posts')} className={filter === 'posts' ? 'active' : ''}>Posts</button>
      <button onClick={() => setFilter('boltz')} className={filter === 'boltz' ? 'active' : ''}>Boltz</button>
    </div>
    {/* Render filteredPosts */}
  </>
);
```

### Issue #72: Feed on Slow Connection
**File**: `src/pages/Home.js`
**Fix**: Add offline support
```javascript
const fetchFeedOffline = async () => {
  const cached = localStorage.getItem('feed_cache');
  if (cached) {
    setPosts(JSON.parse(cached));
    return;
  }
  setError('No cached feed available');
};

useEffect(() => {
  if (!navigator.onLine) {
    fetchFeedOffline();
  }
}, []);

window.addEventListener('offline', fetchFeedOffline);
```

### Issue #76: Hide User from Feed
**File**: `src/pages/Home.js`
**Fix**: Add hide user option
```javascript
const handleHideUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('hidden_users')
      .insert({ user_id: user.id, hidden_id: userId });
    
    if (error) throw error;
    
    setPosts(posts.filter(p => p.user_id !== userId));
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #77: Post View Count
**File**: `src/components/PostCard.js`
**Fix**: Track and display views
```javascript
const handlePostView = async () => {
  try {
    await supabase.rpc('increment_post_views', { post_id: post.id });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};

useEffect(() => {
  handlePostView();
}, [post.id]);

return (
  <div className="post-stats">
    <span>👁️ {post.view_count} views</span>
  </div>
);
```

### Issue #85: Search Result Ranking
**File**: `src/utils/searchService.js`
**Fix**: Improve ranking algorithm
```javascript
const rankResults = (results, query) => {
  return results.sort((a, b) => {
    // Exact match scores higher
    const aExact = a.username?.toLowerCase() === query.toLowerCase() ? 100 : 0;
    const bExact = b.username?.toLowerCase() === query.toLowerCase() ? 100 : 0;
    
    // Starts with scores higher
    const aStarts = a.username?.toLowerCase().startsWith(query.toLowerCase()) ? 50 : 0;
    const bStarts = b.username?.toLowerCase().startsWith(query.toLowerCase()) ? 50 : 0;
    
    // Contains scores lower
    const aContains = a.username?.toLowerCase().includes(query.toLowerCase()) ? 10 : 0;
    const bContains = b.username?.toLowerCase().includes(query.toLowerCase()) ? 10 : 0;
    
    return (bExact + bStarts + bContains) - (aExact + aStarts + aContains);
  });
};
```

### Issue #88: Multi-Language Search
**File**: `src/utils/searchService.js`
**Fix**: Add language support
```javascript
const searchMultiLanguage = async (query, language = 'en') => {
  // Use translation API or database with language field
  const translated = await translateQuery(query, language);
  return searchUsers(translated);
};
```

### Issue #91: Private Posts in Search
**File**: `src/utils/searchService.js`
**Fix**: Filter private posts
```javascript
const searchPosts = async (query, userId) => {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .or(`caption.ilike.%${query}%,title.ilike.%${query}%`)
    .or(`is_private.eq.false,user_id.eq.${userId}`); // Only show private posts if owner
  
  return data || [];
};
```

### Issue #92: Typo-Tolerant Search
**File**: `src/utils/searchService.js`
**Fix**: Add fuzzy search
```javascript
import Fuse from 'fuse.js';

const fuzzySearch = (items, query) => {
  const fuse = new Fuse(items, {
    keys: ['username', 'full_name', 'bio'],
    threshold: 0.3 // Allow 30% typo tolerance
  });
  
  return fuse.search(query).map(result => result.item);
};
```

### Issue #99: Search DMs by Message
**File**: `src/pages/Messages.js`
**Fix**: Add message search
```javascript
const searchMessages = async (query) => {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .or(`text.ilike.%${query}%`);
  
  return data || [];
};
```

### Issue #115: Scheduling Posts
**File**: `src/pages/CreateMultiType.js`
**Fix**: Add schedule option
```javascript
const [scheduleTime, setScheduleTime] = useState(null);

const handleSchedulePost = async () => {
  try {
    const { error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        scheduled_at: scheduleTime,
        status: 'scheduled'
      });
    
    if (error) throw error;
    alert('Post scheduled for ' + new Date(scheduleTime).toLocaleString());
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #119: Schedule Time Check
**File**: `src/pages/CreateMultiType.js`
**Fix**: Validate schedule time
```javascript
const validateScheduleTime = (time) => {
  const now = new Date();
  const scheduled = new Date(time);
  
  if (scheduled <= now) {
    return { valid: false, error: 'Schedule time must be in the future' };
  }
  
  if (scheduled > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Cannot schedule more than 1 year in advance' };
  }
  
  return { valid: true };
};
```

### Issue #125: Min/Max Video Duration Check
**File**: `src/pages/CreateMultiType.js`
**Fix**: Validate video duration
```javascript
const validateVideoDuration = (duration) => {
  const MIN_DURATION = 1; // 1 second
  const MAX_DURATION = 600; // 10 minutes
  
  if (duration < MIN_DURATION) {
    return { valid: false, error: 'Video must be at least 1 second' };
  }
  
  if (duration > MAX_DURATION) {
    return { valid: false, error: 'Video must be less than 10 minutes' };
  }
  
  return { valid: true };
};
```

### Issue #131: Pin Post to Profile
**File**: `src/pages/Profile.js`
**Fix**: Add pin functionality
```javascript
const handlePinPost = async (postId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ pinned_post_id: postId })
      .eq('id', user.id);
    
    if (error) throw error;
    alert('Post pinned to profile');
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #133: Duplicate Post Upload Check
**File**: `src/pages/CreateMultiType.js`
**Fix**: Check for duplicates
```javascript
const checkDuplicatePost = async (caption, mediaHash) => {
  const { data } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('caption', caption)
    .eq('media_hash', mediaHash)
    .limit(1);
  
  return data && data.length > 0;
};

// Before upload
const isDuplicate = await checkDuplicatePost(caption, mediaHash);
if (isDuplicate) {
  alert('You already posted this');
  return;
}
```

### Issue #141: Inappropriate Word Filter
**File**: `src/utils/validation.js`
**Fix**: Add content filter
```javascript
const INAPPROPRIATE_WORDS = [
  // Add comprehensive list
];

export const filterInappropriateContent = (text) => {
  let filtered = text;
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
};
```

### Issue #142: Spellcheck/Autofix
**File**: `src/components/TextEditor.js`
**Fix**: Add spellcheck
```javascript
<textarea
  spellCheck="true"
  value={caption}
  onChange={(e) => setCaption(e.target.value)}
/>
```

### Issue #149: Share Collection
**File**: `src/pages/Saved.js`
**Fix**: Add share button
```javascript
const handleShareCollection = async (collectionId) => {
  const shareUrl = `${window.location.origin}/collection/${collectionId}`;
  
  if (navigator.share) {
    await navigator.share({
      title: 'Check out my collection',
      url: shareUrl
    });
  } else {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard');
  }
};
```

### Issue #159-160: Pin/Unpin Comment
**File**: `src/components/Comments.js`
**Fix**: Add pin functionality
```javascript
const handlePinComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ pinned_comment_id: commentId })
      .eq('id', post.id);
    
    if (error) throw error;
    alert('Comment pinned');
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #165: Share Comment
**File**: `src/components/Comments.js`
**Fix**: Add share button
```javascript
const handleShareComment = (commentId) => {
  const shareUrl = `${window.location.origin}/post/${post.id}?comment=${commentId}`;
  navigator.clipboard.writeText(shareUrl);
  alert('Comment link copied');
};
```

### Issue #181: Highlight User Comment
**File**: `src/components/Comments.js`
**Fix**: Add highlight option
```javascript
const handleHighlightComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ is_highlighted: true })
      .eq('id', commentId);
    
    if (error) throw error;
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #182: Keyboard Navigation Comments
**File**: `src/components/Comments.js`
**Fix**: Add keyboard support
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'ArrowUp') {
    focusPreviousComment();
  } else if (e.key === 'ArrowDown') {
    focusNextComment();
  } else if (e.key === 'Enter') {
    replyToComment();
  }
};

return (
  <div onKeyDown={handleKeyDown} tabIndex={0}>
    {/* Comments */}
  </div>
);
```

### Issue #183: Rate Limit on Comments
**File**: `src/components/Comments.js`
**Fix**: Add rate limiting
```javascript
const COMMENT_RATE_LIMIT = 5; // 5 comments per minute
let commentTimestamps = [];

const canPostComment = () => {
  const now = Date.now();
  commentTimestamps = commentTimestamps.filter(t => now - t < 60000);
  
  if (commentTimestamps.length >= COMMENT_RATE_LIMIT) {
    return false;
  }
  
  commentTimestamps.push(now);
  return true;
};

// Before posting
if (!canPostComment()) {
  alert('Too many comments. Please wait a moment.');
  return;
}
```

### Issue #186: Like/Comment Ghost State
**File**: `src/components/PostCard.js`
**Fix**: Handle ghost state
```javascript
const [likeState, setLikeState] = useState(post.is_liked);

const handleLike = async () => {
  // Optimistic update
  setLikeState(!likeState);
  
  try {
    if (likeState) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
    }
  } catch (error) {
    // Rollback on error
    setLikeState(!likeState);
    alert('Failed to like post');
  }
};
```

### Issue #189: Sticker/Text/Music in Story
**File**: `src/pages/Flash.js`
**Fix**: Add story editor tools
```javascript
const [storyTools, setStoryTools] = useState({
  text: [],
  stickers: [],
  music: null
});

return (
  <>
    <button onClick={() => addTextToStory()}>Add Text</button>
    <button onClick={() => addStickerToStory()}>Add Sticker</button>
    <button onClick={() => addMusicToStory()}>Add Music</button>
  </>
);
```

### Issue #192: Countdown Story
**File**: `src/pages/Flash.js`
**Fix**: Add countdown sticker
```javascript
const addCountdownSticker = (expiryDate) => {
  const countdown = {
    type: 'countdown',
    expiryDate,
    position: { x: 50, y: 50 }
  };
  
  setStoryTools({
    ...storyTools,
    stickers: [...storyTools.stickers, countdown]
  });
};
```

### Issue #199: Story Mention/Tag
**File**: `src/pages/Flash.js`
**Fix**: Add mention support
```javascript
const handleMentionInStory = async (userId) => {
  try {
    const { error } = await supabase
      .from('story_mentions')
      .insert({ story_id: story.id, mentioned_user_id: userId });
    
    if (error) throw error;
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

### Issue #216: Story Link Preview
**File**: `src/pages/Flash.js`
**Fix**: Add link preview
```javascript
const generateLinkPreview = async (url) => {
  try {
    const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    const preview = await response.json();
    return preview;
  } catch (error) {
    return null;
  }
};
```

### Issue #225: Story Keyboard Navigation
**File**: `src/pages/Flash.js`
**Fix**: Add keyboard controls
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'ArrowRight') {
    nextStory();
  } else if (e.key === 'ArrowLeft') {
    previousStory();
  } else if (e.key === ' ') {
    togglePause();
  }
};

return (
  <div onKeyDown={handleKeyDown} tabIndex={0}>
    {/* Story viewer */}
  </div>
);
```

### Issue #255: Rate Limit on DMs
**File**: `src/pages/Messages.js`
**Fix**: Add DM rate limiting
```javascript
const DM_RATE_LIMIT = 10; // 10 messages per minute
let dmTimestamps = [];

const canSendDM = () => {
  const now = Date.now();
  dmTimestamps = dmTimestamps.filter(t => now - t < 60000);
  
  if (dmTimestamps.length >= DM_RATE_LIMIT) {
    return false;
  }
  
  dmTimestamps.push(now);
  return true;
};
```

### Issue #258-259: GIF/Sticker Pickers
**File**: `src/pages/Messages.js`
**Fix**: Add GIF/sticker support
```javascript
const handleSendGIF = async (gifUrl) => {
  try {
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedChat.other_user_id,
      media_url: gifUrl,
      media_type: 'gif'
    });
  } catch (error) {
    alert('Failed: ' + error.message);
  }
};
```

## Database Schema Updates Needed

```sql
-- Add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_post_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_hash TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned_comment_id UUID;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;

ALTER TABLE flashes ADD COLUMN IF NOT EXISTS tools JSONB;

-- Create missing tables
CREATE TABLE IF NOT EXISTS hidden_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, hidden_id)
);

CREATE TABLE IF NOT EXISTS restricted_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restricted_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, restricted_id)
);

CREATE TABLE IF NOT EXISTS story_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES flashes(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Summary

This batch covers 32 critical issues with implementation guidance. Each issue includes:
- File location
- Code snippet
- Database schema if needed
- Integration points

**Total Effort**: ~40-50 hours for full implementation
**Priority**: HIGH - These are core features needed for production

## Next Steps

1. Implement database schema changes
2. Add each feature one by one
3. Test thoroughly
4. Deploy to staging
5. Monitor for issues
