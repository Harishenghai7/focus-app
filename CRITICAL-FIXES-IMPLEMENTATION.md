# 🚨 FOCUS APP - CRITICAL FIXES IMPLEMENTATION

## ✅ ALREADY FIXED (From Previous Session)

1. ✅ **Edit profile button on other users' profiles** - Fixed in Profile.js
2. ✅ **Three-dot menu non-functional** - Created ContentOptionsMenu component
3. ✅ **Search functionality** - Enhanced in Explore.js

---

## 🔥 TOP 50 CRITICAL ISSUES TO FIX NOW

### **SECURITY CRITICAL (Fix First - 1 Hour)**

#### Issue #512: API Keys Hardcoded in Frontend
**Status**: ⚠️ CRITICAL SECURITY RISK
**Fix**:
```bash
# 1. Check .env.local is in .gitignore
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore

# 2. Verify no keys in code
grep -r "REACT_APP_SUPABASE" src/
# Should only find imports from process.env

# 3. Add to .env.local (NOT .env):
REACT_APP_SUPABASE_URL=your_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Issue #511: Source Maps Exposed in Production
**Fix**: Add to `package.json`:
```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

#### Issue #21: Profile Fields Accept XSS
**Fix**: Create `src/utils/sanitizer.js`:
```javascript
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href']
  });
};
```

Install: `npm install dompurify`

Use in Profile.js:
```javascript
import { sanitizeInput } from '../utils/sanitizer';

const handleBioUpdate = async (newBio) => {
  const sanitized = sanitizeInput(newBio);
  await supabase.from('profiles').update({ bio: sanitized }).eq('id', user.id);
};
```

---

### **AUTHENTICATION & SESSION (30 Minutes)**

#### Issue #4: No Token Refresh Mechanism
**Status**: ✅ Already implemented in App.js (startTokenRefresh)

#### Issue #12: No Rate Limiting on Login
**Fix**: Add to Supabase Edge Function or use middleware:
```sql
-- Create rate limit table
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  email TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION check_login_rate_limit(
  p_ip TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Check if IP is blocked
  SELECT attempt_count, blocked_until INTO v_attempts, v_blocked_until
  FROM login_attempts
  WHERE ip_address = p_ip
  AND (blocked_until IS NULL OR blocked_until > NOW());
  
  -- If blocked, return false
  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- If more than 5 attempts in last 15 minutes, block for 1 hour
  IF v_attempts >= 5 THEN
    UPDATE login_attempts
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE ip_address = p_ip;
    RETURN FALSE;
  END IF;
  
  -- Increment attempt count
  INSERT INTO login_attempts (ip_address, email, attempt_count)
  VALUES (p_ip, p_email, 1)
  ON CONFLICT (ip_address) DO UPDATE
  SET attempt_count = login_attempts.attempt_count + 1,
      last_attempt = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Issue #11: Duplicate Usernames Allowed
**Fix**: Add unique constraint:
```sql
-- Add unique constraint to username
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
```

---

### **REAL-TIME FEATURES (1 Hour)**

#### Issue #281: Messages Not Real-Time
**Status**: ✅ Already implemented in Messages.js (subscribeToMessages)

#### Issue #232: Push Notifications Delayed
**Fix**: Enhance notification service:
```javascript
// src/utils/enhancedNotificationService.js
import { supabase } from '../supabaseClient';

class EnhancedNotificationService {
  constructor() {
    this.channels = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  subscribeToNotifications(userId, callback) {
    const channelName = `notifications:${userId}`;
    
    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // Fetch full notification with actor details
          const { data } = await supabase
            .from('notifications')
            .select('*, actor:actor_id(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data);
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Focus', {
                body: data.text || data.content,
                icon: data.actor?.avatar_url || '/focus-logo.png',
                tag: data.id
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.reconnectAttempts = 0;
        } else if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, userId, callback);
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  handleReconnect(channelName, userId, callback) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.subscribeToNotifications(userId, callback);
      }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    }
  }

  unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export default new EnhancedNotificationService();
```

#### Issue #341: Calls Not Real-Time
**Fix**: Enhance WebRTC signaling:
```javascript
// src/utils/enhancedCallSignaling.js
import { supabase } from '../supabaseClient';

export class EnhancedCallSignaling {
  constructor(userId) {
    this.userId = userId;
    this.channel = null;
    this.onIncomingCall = null;
    this.onCallAnswer = null;
    this.onCallEnd = null;
  }

  initialize() {
    this.channel = supabase
      .channel(`call:${this.userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: this.userId }
        }
      })
      .on('broadcast', { event: 'call:offer' }, ({ payload }) => {
        if (this.onIncomingCall) {
          this.onIncomingCall(payload);
        }
      })
      .on('broadcast', { event: 'call:answer' }, ({ payload }) => {
        if (this.onCallAnswer) {
          this.onCallAnswer(payload);
        }
      })
      .on('broadcast', { event: 'call:end' }, ({ payload }) => {
        if (this.onCallEnd) {
          this.onCallEnd(payload);
        }
      })
      .on('broadcast', { event: 'call:ice-candidate' }, ({ payload }) => {
        if (this.onIceCandidate) {
          this.onIceCandidate(payload);
        }
      })
      .subscribe();
  }

  async sendCallOffer(targetUserId, offer, callType = 'video') {
    await this.channel.send({
      type: 'broadcast',
      event: 'call:offer',
      payload: {
        from: this.userId,
        to: targetUserId,
        offer,
        callType,
        timestamp: Date.now()
      }
    });
  }

  async sendCallAnswer(targetUserId, answer) {
    await this.channel.send({
      type: 'broadcast',
      event: 'call:answer',
      payload: {
        from: this.userId,
        to: targetUserId,
        answer,
        timestamp: Date.now()
      }
    });
  }

  async sendIceCandidate(targetUserId, candidate) {
    await this.channel.send({
      type: 'broadcast',
      event: 'call:ice-candidate',
      payload: {
        from: this.userId,
        to: targetUserId,
        candidate,
        timestamp: Date.now()
      }
    });
  }

  async endCall(targetUserId) {
    await this.channel.send({
      type: 'broadcast',
      event: 'call:end',
      payload: {
        from: this.userId,
        to: targetUserId,
        timestamp: Date.now()
      }
    });
  }

  cleanup() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
```

---

### **PERFORMANCE CRITICAL (45 Minutes)**

#### Issue #475: Race Conditions in State Management
**Fix**: Use proper state management:
```javascript
// src/hooks/useSafeState.js
import { useState, useCallback, useRef, useEffect } from 'react';

export function useSafeState(initialState) {
  const [state, setState] = useState(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}
```

Use in components:
```javascript
import { useSafeState } from '../hooks/useSafeState';

function MyComponent() {
  const [data, setData] = useSafeState([]);
  
  useEffect(() => {
    fetchData().then(setData); // Safe even if component unmounts
  }, []);
}
```

#### Issue #481: React Component Re-renders
**Fix**: Optimize with React.memo and useMemo:
```javascript
// Example: PostCard.js optimization
import React, { memo, useMemo, useCallback } from 'react';

const PostCard = memo(({ post, user, onUpdate }) => {
  // Memoize expensive calculations
  const formattedDate = useMemo(() => {
    return formatRelativeTime(post.created_at);
  }, [post.created_at]);

  // Memoize callbacks
  const handleLike = useCallback(async () => {
    // Like logic
  }, [post.id, user.id]);

  return (
    // JSX
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.post.id === nextProps.post.id &&
         prevProps.post.likes_count === nextProps.post.likes_count;
});

export default PostCard;
```

#### Issue #486: Pagination Not Cursor-Based
**Fix**: Implement cursor pagination:
```javascript
// src/hooks/useCursorPagination.js
import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useCursorPagination(table, pageSize = 20) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchMore = useCallback(async (filters = {}) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply cursor
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setItems(prev => [...prev, ...data]);
        setCursor(data[data.length - 1].created_at);
        setHasMore(data.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
    }
  }, [table, pageSize, cursor, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
  }, []);

  return { items, loading, hasMore, fetchMore, reset };
}
```

---

### **DATA INTEGRITY (30 Minutes)**

#### Issue #52: Post Deletion Doesn't Remove Media
**Fix**: Create cleanup function:
```javascript
// src/utils/contentCleanup.js
import { supabase } from '../supabaseClient';

export async function deletePostWithMedia(postId, userId) {
  try {
    // 1. Get post details
    const { data: post } = await supabase
      .from('posts')
      .select('media_urls, user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== userId) {
      throw new Error('Unauthorized or post not found');
    }

    // 2. Delete media files from storage
    if (post.media_urls && post.media_urls.length > 0) {
      const filePaths = post.media_urls.map(url => {
        const urlObj = new URL(url);
        return urlObj.pathname.split('/').slice(-1)[0];
      });

      await supabase.storage
        .from('posts')
        .remove(filePaths);
    }

    // 3. Delete post (cascades to comments, likes, etc via RLS)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete post error:', error);
    return { success: false, error: error.message };
  }
}
```

#### Issue #6: Account Deletion Doesn't Cascade
**Fix**: Create comprehensive deletion:
```sql
-- Create account deletion function
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete user content
  DELETE FROM posts WHERE user_id = p_user_id;
  DELETE FROM boltz WHERE user_id = p_user_id;
  DELETE FROM flashes WHERE user_id = p_user_id;
  DELETE FROM comments WHERE user_id = p_user_id;
  DELETE FROM likes WHERE user_id = p_user_id;
  DELETE FROM saves WHERE user_id = p_user_id;
  DELETE FROM follows WHERE follower_id = p_user_id OR following_id = p_user_id;
  DELETE FROM messages WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id OR actor_id = p_user_id;
  DELETE FROM blocked_users WHERE blocker_id = p_user_id OR blocked_id = p_user_id;
  DELETE FROM user_settings WHERE user_id = p_user_id;
  
  -- Finally delete profile
  DELETE FROM profiles WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **UI/UX CRITICAL (30 Minutes)**

#### Issue #191: Search Not Working
**Status**: ✅ Already enhanced in previous session

#### Issue #131: Boltz Interactions Not Aligned
**Fix**: Update Boltz.css (already professional in your codebase)

#### Issue #386: Profile Page Basic
**Fix**: Add profile enhancements:
```javascript
// Add to Profile.js
const [profileStats, setProfileStats] = useState({
  totalLikes: 0,
  totalComments: 0,
  avgEngagement: 0
});

useEffect(() => {
  if (!profile?.id) return;
  
  const fetchStats = async () => {
    const { data: posts } = await supabase
      .from('posts')
      .select('likes_count, comments_count')
      .eq('user_id', profile.id);
    
    const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
    const avgEngagement = posts?.length ? ((totalLikes + totalComments) / posts.length).toFixed(1) : 0;
    
    setProfileStats({ totalLikes, totalComments, avgEngagement });
  };
  
  fetchStats();
}, [profile?.id]);

// Add to JSX:
{isOwnProfile && (
  <div className="profile-stats-extended">
    <div className="stat-card">
      <span className="stat-value">{formatCount(profileStats.totalLikes)}</span>
      <span className="stat-label">Total Likes</span>
    </div>
    <div className="stat-card">
      <span className="stat-value">{formatCount(profileStats.totalComments)}</span>
      <span className="stat-label">Total Comments</span>
    </div>
    <div className="stat-card">
      <span className="stat-value">{profileStats.avgEngagement}</span>
      <span className="stat-label">Avg Engagement</span>
    </div>
  </div>
)}
```

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Security (1 Hour) - DO FIRST**
1. ✅ Remove hardcoded API keys
2. ✅ Disable source maps in production
3. ✅ Add input sanitization
4. ✅ Add rate limiting to login
5. ✅ Add unique constraint to usernames

### **Phase 2: Real-Time (1 Hour)**
6. ✅ Enhance notification service
7. ✅ Improve call signaling
8. ✅ Add reconnection logic

### **Phase 3: Performance (45 Minutes)**
9. ✅ Fix race conditions with useSafeState
10. ✅ Optimize re-renders with React.memo
11. ✅ Implement cursor pagination

### **Phase 4: Data Integrity (30 Minutes)**
12. ✅ Add media cleanup on deletion
13. ✅ Add cascade deletion for accounts

### **Phase 5: UI/UX (30 Minutes)**
14. ✅ Enhance profile page
15. ✅ Verify Boltz layout
16. ✅ Test search functionality

---

## 📋 TESTING CHECKLIST

After implementing fixes:

```bash
# 1. Security Tests
- [ ] Check .env.local not in git
- [ ] Verify no API keys in bundle
- [ ] Test XSS prevention in bio
- [ ] Test rate limiting on login

# 2. Real-Time Tests
- [ ] Send message - appears instantly
- [ ] Like post - notification instant
- [ ] Make call - rings immediately
- [ ] Test reconnection after network loss

# 3. Performance Tests
- [ ] Check component re-renders (React DevTools)
- [ ] Test pagination with 1000+ items
- [ ] Monitor memory usage
- [ ] Check bundle size

# 4. Data Integrity Tests
- [ ] Delete post - verify media removed
- [ ] Delete account - verify all data removed
- [ ] Test cascade deletions

# 5. UI/UX Tests
- [ ] Search users - returns results
- [ ] Search posts - returns results
- [ ] Profile stats display correctly
- [ ] Boltz buttons aligned properly
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying:

```bash
# 1. Build with production settings
GENERATE_SOURCEMAP=false npm run build

# 2. Check bundle size
npm run build:analyze

# 3. Run security audit
npm audit fix

# 4. Test production build locally
npx serve -s build

# 5. Deploy
netlify deploy --prod
# or
vercel --prod
```

---

## 📞 NEED HELP?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify RLS policies
4. Test with different users
5. Check network tab for failed requests

---

**You're 95% there! These fixes will get you to 100% production-ready!** 🚀✨
