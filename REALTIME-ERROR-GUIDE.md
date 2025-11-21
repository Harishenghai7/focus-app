# Realtime Integration Error Guide

## Critical Fixes by Component

### Home Feed
**Problem:** Feed doesn't update after new post/like
```javascript
// ❌ Wrong - No cleanup
useEffect(() => {
  supabase.channel('posts').on('postgres_changes', 
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => setPosts([...posts, payload.new])
  ).subscribe();
}, []);

// ✅ Correct
useEffect(() => {
  const channel = supabase.channel('posts')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'posts' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setPosts(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      }
    ).subscribe();
  
  return () => { supabase.removeChannel(channel); };
}, []);
```

### Messages/DM
**Problem:** Typing indicators stuck, messages in wrong thread
```javascript
// ✅ Correct - Match chat_id and cleanup presence
useEffect(() => {
  const channel = supabase.channel(`chat:${chatId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload) => setMessages(prev => [...prev, payload.new].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)))
    )
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineUsers(Object.keys(state));
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [chatId]);
```

### Notifications
**Problem:** Badge stuck, notifications for wrong users
```javascript
// ✅ Correct - Filter by user_id, mark as read
useEffect(() => {
  const channel = supabase.channel('notifications')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setBadgeCount(prev => prev + 1);
      }
    ).subscribe();

  return () => { supabase.removeChannel(channel); };
}, [userId]);

// Mark as read
const markAsRead = async (notifId) => {
  await supabase.from('notifications').update({ read: true }).eq('id', notifId);
  setNotifications(prev => prev.map(n => n.id === notifId ? {...n, read: true} : n));
  setBadgeCount(prev => Math.max(0, prev - 1));
};
```

### Boltz (Videos)
**Problem:** Likes/comments don't update live
```javascript
// ✅ Correct - Subscribe to interactions
useEffect(() => {
  const channel = supabase.channel(`boltz:${boltzId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'boltz_likes', filter: `boltz_id=eq.${boltzId}` },
      () => fetchLikeCount()
    )
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'boltz_comments', filter: `boltz_id=eq.${boltzId}` },
      (payload) => setComments(prev => [...prev, payload.new])
    ).subscribe();

  return () => { supabase.removeChannel(channel); };
}, [boltzId]);
```

## Common Mistakes Checklist

- [ ] **Memory Leaks:** Always unsubscribe in cleanup
- [ ] **Stale State:** Use functional updates `setPosts(prev => ...)`
- [ ] **Wrong Channel:** Verify table names match exactly (case-sensitive)
- [ ] **Missing Events:** Handle INSERT, UPDATE, DELETE
- [ ] **Out of Order:** Always sort by `created_at` after updates
- [ ] **RLS Issues:** Test subscriptions with different user roles
- [ ] **Reconnection:** Refetch data on component mount
- [ ] **Multiple Subs:** Only subscribe once per component
- [ ] **Filter Mismatch:** Use correct `filter` syntax in subscriptions

## Debugging Template

```javascript
useEffect(() => {
  console.log('🔌 Subscribing to channel:', channelName);
  
  const channel = supabase.channel(channelName)
    .on('postgres_changes', config, (payload) => {
      console.log('📨 Received:', payload.eventType, payload);
      // Handle update
    })
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
    });

  return () => {
    console.log('🔌 Unsubscribing from:', channelName);
    supabase.removeChannel(channel);
  };
}, [dependencies]);
```

## Performance Tips

1. **Throttle Updates:** Batch rapid updates
2. **Dedupe:** Check for duplicate IDs before adding
3. **Pagination:** Don't subscribe to entire tables
4. **Selective Filters:** Use RLS and filters to reduce events
