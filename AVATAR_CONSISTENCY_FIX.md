# Avatar Consistency Fix - Complete Guide

## Problem Identified

The app shows **different avatars** in different places:
1. OAuth signup avatar (from Google)
2. Onboarding avatar (user upload)
3. Sidebar avatar
4. Profile page avatar
5. Boltz user info avatar

## Root Cause

The OAuth avatar from Google is stored in `user.user_metadata.avatar_url` but NOT automatically synced to `profiles.avatar_url` in the database.

## Solution: Centralized Avatar Management

### Step 1: Create Avatar Utility

Create `src/utils/avatarManager.js`:

```javascript
import { supabase } from '../lib/supabase';

/**
 * Get the user's avatar URL with proper fallback chain
 * Priority: profiles.avatar_url -> user_metadata.avatar_url -> generated avatar
 */
export const getUserAvatarUrl = (user, profile) => {
    // 1. Check profile table first
    if (profile?.avatar_url) {
        return profile.avatar_url;
    }
    
    // 2. Check OAuth metadata
    if (user?.user_metadata?.avatar_url) {
        return user.user_metadata.avatar_url;
    }
    
    // 3. Fallback to generated avatar
    const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=B794F6&color=fff&size=128`;
};

/**
 * Sync OAuth avatar to profiles table
 * Call this after OAuth login
 */
export const syncOAuthAvatar = async (userId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.user_metadata?.avatar_url) {
            return; // No OAuth avatar to sync
        }
        
        // Check if profile already has an avatar
        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();
        
        // Only sync if profile doesn't have an avatar yet
        if (!profile?.avatar_url) {
            await supabase
                .from('profiles')
                .update({ avatar_url: user.user_metadata.avatar_url })
                .eq('id', userId);
            
            console.log('✅ OAuth avatar synced to profile');
        }
    } catch (error) {
        console.error('Avatar sync error:', error);
    }
};
```

### Step 2: Update Auth Hook

In `src/hooks/useAuth.js`, add avatar sync after login:

```javascript
useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            
            // Sync OAuth avatar if present
            await syncOAuthAvatar(session.user.id);
        }
        // ... rest of code
    });
}, []);
```

### Step 3: Update All Avatar Components

Replace all avatar URL logic with the centralized function:

**Sidebar.js:**
```javascript
import { getUserAvatarUrl } from '../../utils/avatarManager';

// In component:
const avatarUrl = getUserAvatarUrl(user, profile);
<Avatar src={avatarUrl} ... />
```

**Profile.js:**
```javascript
import { getUserAvatarUrl } from '../../utils/avatarManager';

const avatarUrl = getUserAvatarUrl(user, profile);
```

**BoltzUserInfo.js:**
```javascript
import { getUserAvatarUrl } from '../../utils/avatarManager';

// Already has fallback, but can use centralized version
const avatarUrl = getUserAvatarUrl(null, { username: user.username, avatar_url: user.avatar_url });
```

### Step 4: Update Onboarding

In `src/hooks/useOnboarding.js`, ensure uploaded avatar takes priority:

```javascript
const completeOnboarding = async () => {
    let avatarUrl = null;
    
    if (formData.avatarFile) {
        // User uploaded custom avatar - use it
        avatarUrl = await uploadImage(formData.avatarFile, user.id);
    } else if (user.user_metadata?.avatar_url) {
        // No custom upload, use OAuth avatar
        avatarUrl = user.user_metadata.avatar_url;
    }
    
    await saveOnboardingData(
        user.id,
        {
            username: formData.username,
            full_name: formData.full_name,
            bio: formData.bio,
            avatar_url: avatarUrl
        },
        formData.interests
    );
};
```

## Testing Checklist

- [ ] OAuth login → Avatar appears in sidebar
- [ ] OAuth login → Avatar appears in profile
- [ ] Onboarding upload → New avatar replaces OAuth avatar everywhere
- [ ] No avatar → Generated avatar shows consistently
- [ ] Boltz page → Correct avatar shows

## Files to Update

1. ✅ `src/utils/avatarManager.js` (CREATE)
2. `src/hooks/useAuth.js` (UPDATE)
3. `src/components/layout/Sidebar.js` (UPDATE)
4. `src/pages/Profile/Profile.js` (UPDATE)
5. `src/components/boltz/BoltzUserInfo.js` (UPDATE - already has fallback)
6. `src/hooks/useOnboarding.js` (UPDATE)

## Priority Order

1. **Profiles table** (`profiles.avatar_url`) - Highest priority
2. **OAuth metadata** (`user.user_metadata.avatar_url`) - Second priority
3. **Generated avatar** - Fallback

This ensures consistency across the entire app!
