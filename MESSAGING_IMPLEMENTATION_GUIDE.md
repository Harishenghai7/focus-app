# 🚀 Complete Messaging Implementation Guide

## ⚠️ PREREQUISITES

**Before starting, ensure:**
- [ ] Supabase client is working (queries don't hang)
- [ ] Database tables exist (conversations, conversation_participants, messages)
- [ ] RLS policies are configured
- [ ] API keys are correct in `.env`

**Test Supabase first:**
```javascript
// Run this in browser console
const { data, error } = await supabase.from('conversations').select('*').limit(1);
console.log('Test result:', data, error);
// Should return data or empty array, NOT hang
```

---

## 📋 Implementation Checklist

### Phase 1: Core Messaging (Current)
- [x] Database schema created
- [x] ProfileActions Message button
- [x] Messages page structure
- [x] ChatList component
- [x] ChatWindow component
- [ ] **BLOCKED:** useInboxThreads (Supabase client hangs)
- [ ] **BLOCKED:** Conversation creation
- [ ] **BLOCKED:** Message sending

### Phase 2: New Message Modal (Next)
- [ ] Create NewMessageModal component
- [ ] User search functionality
- [ ] Recent conversations list
- [ ] Create conversation on user select

### Phase 3: Advanced Features (Future)
- [ ] Group chats
- [ ] Media messages
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Real-time updates

---

## 🔧 Step-by-Step Implementation

### STEP 1: Verify Supabase is Working

```bash
# In browser console on your app
const test = async () => {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  console.log('Supabase test:', { data, error });
};
test();
```

**Expected:** Should log data within 1 second
**If it hangs:** Stop here, fix Supabase first (see SUPABASE_TROUBLESHOOTING.md)

---

### STEP 2: Restore Working useInboxThreads

Replace `src/hooks/useInboxThreads.js` with the working version from `PHASE1_SUMMARY.md`:

```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useInboxThreads = (userId) => {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;
        fetchThreads();

        const messagesSubscription = supabase
            .channel('inbox_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, handleRealtimeUpdate)
            .subscribe();

        return () => {
            messagesSubscription.unsubscribe();
        };
    }, [userId]);

    const fetchThreads = async () => {
        const timeoutId = setTimeout(() => {
            console.warn('⚠️ Inbox threads fetch timeout');
            setThreads([]);
            setLoading(false);
        }, 5000);

        try {
            console.log('💬 Fetching inbox threads for user:', userId);
            setLoading(true);

            const { data: participants, error: participantsError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (participantsError) throw participantsError;

            const conversationIds = participants?.map(p => p.conversation_id) || [];

            if (conversationIds.length === 0) {
                setThreads([]);
                setError(null);
                setLoading(false);
                clearTimeout(timeoutId);
                return;
            }

            const { data: conversations } = await supabase
                .from('conversations')
                .select('*')
                .in('id', conversationIds);

            const { data: allParticipants } = await supabase
                .from('conversation_participants')
                .select('*')
                .in('conversation_id', conversationIds);

            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .in('conversation_id', conversationIds)
                .order('created_at', { ascending: false });

            const userIds = new Set();
            allParticipants?.forEach(p => userIds.add(p.user_id));
            messages?.forEach(m => userIds.add(m.sender_id));

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id,username,full_name,avatar_url,verified,is_online,last_seen')
                .in('id', Array.from(userIds));

            const profilesMap = new Map();
            profiles?.forEach(profile => profilesMap.set(profile.id, profile));

            clearTimeout(timeoutId);

            const threadsArray = conversations?.map(conv => {
                const convParticipants = allParticipants
                    ?.filter(p => p.conversation_id === conv.id && p.user_id !== userId)
                    .map(p => profilesMap.get(p.user_id))
                    .filter(Boolean) || [];

                const convMessages = messages?.filter(m => m.conversation_id === conv.id) || [];
                const lastMessage = convMessages[0];

                const displayUser = conv.is_group 
                    ? { 
                        id: conv.id,
                        username: conv.group_name || 'Group Chat', 
                        full_name: conv.group_name || 'Group Chat',
                        avatar_url: null,
                        is_online: false
                      }
                    : convParticipants[0] || { id: conv.id, username: 'Unknown', full_name: 'Unknown User' };

                const unreadCount = convMessages.filter(m => 
                    m.sender_id !== userId && !m.is_read
                ).length;

                return {
                    id: conv.id,
                    conversationId: conv.id,
                    user: displayUser,
                    lastMessage: lastMessage || { content: '', created_at: conv.created_at },
                    unreadCount,
                    messages: convMessages.reverse(),
                    isGroup: conv.is_group,
                    participants: convParticipants
                };
            }) || [];

            threadsArray.sort((a, b) => 
                new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
            );

            console.log('✅ Threads organized:', threadsArray.length);
            setThreads(threadsArray);
            setError(null);
        } catch (err) {
            console.error('❌ Error fetching threads:', err);
            setError(err.message);
            setThreads([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRealtimeUpdate = (payload) => {
        console.log('Real-time message update:', payload);
        fetchThreads();
    };

    const markThreadAsRead = async (conversationId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('is_read', false)
                .neq('sender_id', userId);

            if (error) throw error;

            setThreads(prev => prev.map(thread =>
                thread.id === conversationId
                    ? { ...thread, unreadCount: 0 }
                    : thread
            ));
        } catch (err) {
            console.error('Error marking thread as read:', err);
        }
    };

    return { threads, loading, error, refetch: fetchThreads, markThreadAsRead };
};
```

**Test:** Refresh app, go to Messages page. Should see conversations (or empty state if none exist).

---

### STEP 3: Enable Conversation Creation

Update `ProfileActions.js` to create conversations:

```javascript
const handleMessageClick = async () => {
    if (!currentUser || !profile) return;

    try {
        console.log('Creating/finding conversation with:', profile.username);
        
        // Check if conversation exists
        const { data: myParticipations } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        const myConvIds = myParticipations?.map(p => p.conversation_id) || [];

        if (myConvIds.length > 0) {
            const { data: theirParticipations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', profile.id)
                .in('conversation_id', myConvIds);

            if (theirParticipations && theirParticipations.length > 0) {
                // Found existing conversation
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('id', theirParticipations[0].conversation_id)
                    .eq('is_group', false)
                    .single();

                if (conv) {
                    navigate(`/messages/${conv.id}`);
                    return;
                }
            }
        }

        // Create new conversation
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
                is_group: false,
                created_by: currentUser.id,
                last_message_at: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) throw createError;

        // Add participants
        await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: newConv.id, user_id: currentUser.id },
                { conversation_id: newConv.id, user_id: profile.id }
            ]);

        navigate(`/messages/${newConv.id}`);
    } catch (error) {
        console.error('Error:', error);
        alert('Unable to create conversation');
    }
};
```

**Test:** Click Message button on profile → Should create conversation and navigate to chat

---

### STEP 4: Create NewMessageModal Component

Create `src/components/messages/NewMessageModal.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import styles from './NewMessageModal.module.css';

const NewMessageModal = ({ onClose, onSelectUser }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            searchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const searchUsers = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, verified')
                .neq('id', user.id)
                .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .limit(20);

            if (error) throw error;

            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>New Message</h2>
                    <button onClick={onClose}>✕</button>
                </div>

                <div className={styles.search}>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className={styles.results}>
                    {loading ? (
                        <div className={styles.loading}>Searching...</div>
                    ) : searchResults.length === 0 ? (
                        <div className={styles.empty}>
                            {searchQuery ? 'No users found' : 'Search for users'}
                        </div>
                    ) : (
                        searchResults.map((user) => (
                            <div
                                key={user.id}
                                className={styles.userItem}
                                onClick={() => onSelectUser(user)}
                            >
                                <img src={user.avatar_url || '/default-avatar.png'} alt={user.username} />
                                <div>
                                    <div className={styles.username}>
                                        {user.username}
                                        {user.verified && <span>✓</span>}
                                    </div>
                                    {user.full_name && <div className={styles.fullname}>{user.full_name}</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewMessageModal;
```

**Test:** Click "New Message" → Search for user → User appears → Click user → Creates conversation

---

### STEP 5: Add New Message Button to Messages Page

Update `Messages.js`:

```javascript
import NewMessageModal from '../../components/messages/NewMessageModal';

const Messages = () => {
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    
    // ... existing code ...

    const handleSelectUser = async (selectedUser) => {
        setShowNewMessageModal(false);
        
        // Create conversation logic here (similar to ProfileActions)
        // Then navigate to the new conversation
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <div className={styles.header}>
                        <h1>Messages</h1>
                        <button onClick={() => setShowNewMessageModal(true)}>
                            ✏️ New
                        </button>
                    </div>
                    
                    <ChatList
                        chats={formattedChats}
                        activeChat={activeChat}
                        onChatSelect={handleChatSelect}
                    />
                </div>

                <div className={styles.chatArea}>
                    {activeChat ? (
                        <ChatWindow
                            chat={activeChat}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <p>Select a conversation</p>
                        </div>
                    )}
                </div>
            </div>

            {showNewMessageModal && (
                <NewMessageModal
                    onClose={() => setShowNewMessageModal(false)}
                    onSelectUser={handleSelectUser}
                />
            )}
        </MainLayout>
    );
};
```

**Test:** Click "New Message" button → Modal opens → Can search and select users

---

## ✅ Testing Checklist

Once all steps are complete:

```
[ ] Supabase queries complete within 1 second
[ ] Messages page loads without timeout
[ ] Existing conversations appear in list
[ ] Can click on conversation to view messages
[ ] Can send message in conversation
[ ] Message appears immediately
[ ] Click "Message" on profile creates conversation
[ ] Click "New Message" opens modal
[ ] Can search for users in modal
[ ] Selecting user creates conversation
[ ] Real-time updates work (test with 2 browser windows)
```

---

## 🐛 Common Issues

### Issue: "Inbox threads fetch timeout"
**Solution:** Supabase client is still hanging. Go back to STEP 1.

### Issue: "Permission denied for table conversations"
**Solution:** RLS is enabled. Run `DISABLE_RLS_MESSAGING.sql` again.

### Issue: "Conversation not found"
**Solution:** Check if conversation was created in database. Query: `SELECT * FROM conversations;`

### Issue: Messages don't appear
**Solution:** Check `messages` table. Query: `SELECT * FROM messages;`

---

## 📞 Need Help?

1. Check `SUPABASE_TROUBLESHOOTING.md`
2. Check `MESSAGING_STATUS.md`
3. Check browser console for errors
4. Check Supabase Dashboard → Logs
5. Contact Supabase support if infrastructure issue

---

**Good luck! Once Supabase is working, this should all come together quickly!** 🚀
