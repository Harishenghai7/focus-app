# 🚀 FOCUS APP - 12 HOUR LAUNCH IMPLEMENTATION GUIDE
## December 31, 2025 - Midnight Launch

**Time Remaining:** ~12 hours
**Current Status:** 82% Complete
**Target:** Launch-Ready

---

# 🔴 PART 1: CRITICAL FIXES (Hours 1-4)

## Fix 1: Messages Database Migration (20 min)

### Step 1: Run Migration in Supabase

1. Open **Supabase Dashboard** → your project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy-paste the contents of: `supabase/migrations/100_focus_messages_production.sql`
5. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify Tables Created

Run this verification query:
```sql
-- Verify all messaging tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations', 
  'conversation_participants', 
  'messages', 
  'message_attachments', 
  'calls', 
  'typing_indicators', 
  'user_presence', 
  'blocked_users', 
  'reports'
);
-- Should return 9 rows
```

### Step 3: Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - messages
   - conversations
   - conversation_participants
   - typing_indicators
   - user_presence
   - calls

### If Migration Fails:
```sql
-- Check for existing tables causing conflicts
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%message%' OR table_name LIKE '%conversation%';

-- If tables exist, migration already ran!
```

---

## Fix 2: Storage Buckets Setup (15 min)

### Step 1: Create Storage Buckets

Run in **Supabase SQL Editor**:
```sql
-- Create all required storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('boltz', 'boltz', true),
  ('flash', 'flash', true),
  ('messages', 'messages', true),
  ('message-media', 'message-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for authenticated upload, public read
DO $$
DECLARE
  bucket_names TEXT[] := ARRAY['avatars', 'posts', 'boltz', 'flash', 'messages', 'message-media'];
  bucket_name TEXT;
BEGIN
  FOREACH bucket_name IN ARRAY bucket_names LOOP
    -- Allow authenticated upload
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_upload" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = %L);
    ', bucket_name, bucket_name);
    
    -- Allow public read
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_read" ON storage.objects
      FOR SELECT USING (bucket_id = %L);
    ', bucket_name, bucket_name);
    
    -- Allow owner delete
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = %L AND auth.uid()::text = (storage.foldername(name))[1]);
    ', bucket_name, bucket_name);
  END LOOP;
END $$;
```

### Alternative: Via Dashboard
1. Go to **Storage** → **New Bucket**
2. Create each bucket: `posts`, `avatars`, `messages`, `message-media`
3. Check "Public bucket"
4. Go to **Policies** → Add policy for each bucket

---

## Fix 3: Settings Save Functionality (1 hour)

### Problem: Settings display but don't save

### Solution: Update useSettings hook to include updateSettings function

Create/update the settings hook to include save functionality. The hook at `src/hooks/useSettings.js` needs an `updateSettings` function.

### Add this to useSettings.js (after line 105):

```javascript
// 3. Update Settings Function
const updateSettings = useCallback(async (newSettings) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    // Optimistic update
    const previousSettings = settings;
    setSettings({ ...settings, ...newSettings });
    
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                ...newSettings,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Update cache
        localStorage.setItem(`settings_${user.id}`, JSON.stringify(data));
        focusToast.success('Settings saved!');
        return { success: true, data };
    } catch (err) {
        // Revert on error
        setSettings(previousSettings);
        focusToast.error('Failed to save settings. Please try again.');
        console.error('Settings update error:', err);
        return { success: false, error: err.message };
    }
}, [user, settings]);

// Update return to include updateSettings
return {
    settings: settings || DEFAULT_SETTINGS,
    loading,
    error,
    refetch,
    updateSettings  // ADD THIS
};
```

### Update Settings Sections to Use updateSettings

Each settings section component needs to call updateSettings when toggled.

Example for PrivacySection:
```javascript
const { settings, updateSettings } = useSettings();

const handlePrivacyChange = async (key, value) => {
    await updateSettings({ [key]: value });
};

// In the toggle/switch:
<Toggle
    checked={settings.account_visibility === 'private'}
    onChange={(checked) => handlePrivacyChange('account_visibility', checked ? 'private' : 'public')}
/>
```

---

## Fix 4: Image Upload on Create Page (1 hour)

### Current Status: Upload code exists, may fail due to bucket issues

### The usePublish hook already handles uploads correctly! 

Main issues to check:
1. Storage bucket `posts` must exist (see Fix 2)
2. User must be authenticated

### Add File Validation Before Upload

Update `src/pages/Create/MediaSelect.js`:

```javascript
// Add at top of file
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

// Add validation function
const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: `${file.name}: Only images and videos allowed` };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `${file.name}: File must be under 10MB` };
    }
    return { valid: true };
};

// In handleFileSelect function, add validation:
const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length > MAX_FILES) {
        focusToast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
    }
    
    for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
            focusToast.error(validation.error);
            return;
        }
    }
    
    // Continue with existing logic...
};
```

### Add Upload Progress

In `usePublish.js`, add progress tracking with XMLHttpRequest instead of fetch for progress events.

---

## Fix 5: Profile Edit Save (30 min)

### Problem: Edit modal exists but save doesn't persist

### Solution: Ensure profile update uses correct Supabase query

The profile edit should update the `profiles` table:

```javascript
// In your EditProfile component or hook:
const updateProfile = async (profileData) => {
    const { user } = useAuth();
    
    try {
        // Upload avatar if changed
        let avatarUrl = profileData.avatar_url;
        if (profileData.newAvatarFile) {
            const fileExt = profileData.newAvatarFile.name.split('.').pop();
            const fileName = `${user.id}/avatar.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, profileData.newAvatarFile, { upsert: true });
            
            if (uploadError) throw uploadError;
            
            avatarUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
        }
        
        // Update profile
        const { data, error } = await supabase
            .from('profiles')
            .update({
                username: profileData.username,
                bio: profileData.bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        
        focusToast.success('Profile updated!');
        return { success: true, data };
    } catch (err) {
        focusToast.error(err.message || 'Failed to update profile');
        return { success: false, error: err.message };
    }
};

// Username availability check:
const checkUsernameAvailable = async (username) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', user.id)
        .single();
    
    return !data; // true if available
};
```

---

# 🟡 PART 2: IMPORTANT UX FIXES (Hours 4-8)

## Fix 6: Home Feed Image Display (30 min)

### Problem: Posts load but images don't show

### Diagnosis Checklist:
1. Check `media_url` column exists and has data
2. Check URL format is correct (public URL)
3. Check storage bucket is public

### Run this query to check post data:
```sql
SELECT id, caption, media_url, type, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;
```

### Fix in Feed/PostCard component:

The PostCard expects `post.media[0].url` but database stores `media_url`:

```javascript
// In your Feed or PostCard component, normalize the data:
const normalizePost = (post) => ({
    ...post,
    media: post.media_url ? [{ url: post.media_url, type: post.type || 'image' }] : [],
    user: post.profiles || post.user || { username: 'Unknown', avatar_url: null }
});
```

---

## Fix 7: Notification Click Navigation (30 min)

### Problem: Clicks don't navigate to correct destination

### Solution: Update notification click handler:

```javascript
const handleNotificationClick = async (notification) => {
    // Mark as read first
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    
    // Navigate based on type
    switch (notification.type) {
        case 'like':
        case 'comment':
            if (notification.post_id) {
                navigate(`/post/${notification.post_id}`);
            } else if (notification.boltz_id) {
                navigate(`/boltz/${notification.boltz_id}`);
            }
            break;
        case 'follow':
            navigate(`/profile/${notification.from_user_id}`);
            break;
        case 'mention':
            navigate(`/post/${notification.post_id}`);
            break;
        case 'message':
            navigate(`/messages/${notification.conversation_id}`);
            break;
        default:
            console.log('Unknown notification type:', notification.type);
    }
};
```

---

## Fix 8: Boltz Video Autoplay/Pause (30 min)

### Problem: Videos don't pause when scrolling away

### Solution: Use IntersectionObserver:

```javascript
// In BoltzPlayer component:
useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                    // Video is 70% visible - play
                    videoElement.play().catch(console.error);
                } else {
                    // Video not visible - pause
                    videoElement.pause();
                }
            });
        },
        { threshold: [0, 0.7, 1] }
    );
    
    observer.observe(videoElement);
    
    return () => observer.disconnect();
}, []);
```

---

## Fix 9: Profile Follower Count Accuracy (1 hour)

### Option A: Database Triggers (Recommended)

Run in Supabase SQL Editor:
```sql
-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for followed user
        UPDATE profiles 
        SET followers_count = COALESCE(followers_count, 0) + 1
        WHERE id = NEW.following_id;
        
        -- Increment following count for follower
        UPDATE profiles 
        SET following_count = COALESCE(following_count, 0) + 1
        WHERE id = NEW.follower_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count
        UPDATE profiles 
        SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
        WHERE id = OLD.following_id;
        
        -- Decrement following count
        UPDATE profiles 
        SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
        WHERE id = OLD.follower_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON follows;
CREATE TRIGGER trigger_update_follower_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- Fix existing counts
UPDATE profiles p SET
    followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = p.id),
    following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = p.id);
```

---

## Fix 10: Three-Dot Menu Options (1 hour)

### Add working Edit/Delete/Report:

```javascript
const PostOptionsMenu = ({ post, isOwn, onClose }) => {
    const { user } = useAuth();
    
    const handleEdit = () => {
        // Open edit modal
        setEditModalOpen(true);
        onClose();
    };
    
    const handleDelete = async () => {
        if (!confirm('Delete this post?')) return;
        
        const { error } = await supabase
            .from('posts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', post.id)
            .eq('user_id', user.id);
        
        if (!error) {
            focusToast.success('Post deleted');
            // Remove from feed
        }
        onClose();
    };
    
    const handleReport = async (reason) => {
        const { error } = await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                reported_type: 'post',
                reported_id: post.id,
                reason: reason
            });
        
        if (!error) {
            focusToast.success("Thanks! We'll review this.");
        }
        onClose();
    };
    
    return (
        <div className={styles.menu}>
            {isOwn ? (
                <>
                    <button onClick={handleEdit}>Edit</button>
                    <button onClick={handleDelete} className={styles.danger}>Delete</button>
                </>
            ) : (
                <button onClick={() => setReportModalOpen(true)}>Report</button>
            )}
            <button onClick={() => navigator.clipboard.writeText(window.location.href)}>
                Copy Link
            </button>
        </div>
    );
};
```

---

# 🟢 PART 3: QUICK WINS (Hours 8-10)

## Quick Win 1: Loading Spinners

```javascript
// Wrap async buttons with loading state
const [loading, setLoading] = useState(false);

const handleClick = async () => {
    setLoading(true);
    try {
        await doAsyncAction();
    } finally {
        setLoading(false);
    }
};

<Button disabled={loading}>
    {loading ? <Spinner size="sm" /> : 'Save'}
</Button>
```

## Quick Win 2: User-Friendly Error Messages

```javascript
const friendlyErrors = {
    'Failed to fetch': 'Connection error. Check your internet.',
    '401': 'Session expired. Please log in again.',
    '403': 'You don\'t have permission to do this.',
    '500': 'Something went wrong. Try again.',
    'PGRST': 'Database error. Please try again.'
};

const getFriendlyError = (error) => {
    for (const [key, message] of Object.entries(friendlyErrors)) {
        if (error.includes(key)) return message;
    }
    return 'Something went wrong. Please try again.';
};
```

## Quick Win 3: File Validation (Already in Fix 4)

## Quick Win 4: Keyboard Overlap Fix

```css
/* Add to global CSS */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .inputContainer {
        padding-bottom: env(safe-area-inset-bottom);
    }
}
```

```javascript
// In input components
useEffect(() => {
    const handleResize = () => {
        if (document.activeElement?.tagName === 'INPUT' || 
            document.activeElement?.tagName === 'TEXTAREA') {
            document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
}, []);
```

## Quick Win 5: Offline Indicator

```javascript
// Create OfflineIndicator.js
const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    if (isOnline) return null;
    
    return (
        <div className={styles.offlineBanner}>
            📡 You're offline. Some features may not work.
        </div>
    );
};
```

---

# 🎯 PART 4: MESSAGES VERIFICATION CHECKLIST

After running migration, test these:

| Test | How to Verify | If Fails |
|------|--------------|----------|
| Send text message | Open Messages, select conversation, type & send | Check messages table RLS |
| Real-time delivery | Open 2 browsers, send message | Enable Realtime on messages table |
| Image in message | Click attachment, select image | Check message-media bucket exists |
| Typing indicator | Type in input, check other browser | Enable Realtime on typing_indicators |
| Online status | Check green dot appears | Check user_presence table |

---

# ⏰ LAUNCH DAY TIMELINE

| Time | Task | Hours |
|------|------|-------|
| 12:00-12:30 | Run Messages migration + Storage buckets | 0.5 |
| 12:30-13:30 | Fix Settings save functionality | 1 |
| 13:30-14:30 | Test & fix image upload | 1 |
| 14:30-15:00 | Fix Profile edit save | 0.5 |
| 15:00-15:30 | **BREAK** | 0.5 |
| 15:30-16:00 | Fix Home feed images | 0.5 |
| 16:00-16:30 | Fix Notification navigation | 0.5 |
| 16:30-17:00 | Fix Boltz video pause | 0.5 |
| 17:00-18:00 | Fix follower counts + Three-dot menu | 1 |
| 18:00-18:30 | Quick wins (spinners, errors) | 0.5 |
| 18:30-19:00 | **DINNER BREAK** | 0.5 |
| 19:00-21:00 | Full testing of all features | 2 |
| 21:00-22:00 | Fix any bugs found in testing | 1 |
| 22:00-23:00 | Final polish & UI checks | 1 |
| 23:00-00:00 | Prepare launch announcement | 1 |
| **00:00** | 🎉 **LAUNCH!** | - |

---

# 🚀 FINAL CHECKLIST BEFORE LAUNCH

- [ ] Messages migration run successfully
- [ ] All storage buckets created
- [ ] Settings save works
- [ ] Image upload works
- [ ] Profile edit saves
- [ ] Feed shows images
- [ ] Notifications navigate correctly
- [ ] Videos pause on scroll
- [ ] Follow counts are accurate
- [ ] Three-dot menu works
- [ ] No console errors
- [ ] App works on mobile
- [ ] Tenor API key in .env (for GIFs)

---

**Good luck with your launch, Hariharun! 🎉**
**Focus by H2 Innovative - December 31, 2025**
