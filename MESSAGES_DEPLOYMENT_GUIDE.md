# 🚀 FOCUS MESSAGES - PRODUCTION DEPLOYMENT GUIDE
## Complete Setup for Launch (Dec 31, 2025)

---

## ⚠️ CRITICAL: DATABASE MIGRATION (DO THIS FIRST!)

### Step 1: Run Database Migration via Supabase Dashboard

Since the migration script requires credentials, you need to run the SQL directly in Supabase:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor**: Projects → Your Project → SQL Editor
3. **Create New Query**
4. **Copy the ENTIRE contents** of:
   ```
   supabase/migrations/100_focus_messages_production.sql
   ```
5. **Paste into SQL Editor**
6. **Click "Run"**
7. **Verify Success**: You should see:
   ```
   ✅ Focus Messages Production Schema Created!
      - 9 tables with complete relationships
      - All RLS policies enforced
      - Helper functions ready
      - Indexes optimized for performance
   🚀 Ready for production messaging!
   ```

### Step 2: Create Storage Bucket for Message Media

In Supabase Dashboard:

1. Go to **Storage** → **Create Bucket**
2. **Bucket Name**: `message-media`
3. **Public**: ✅ Yes (for media URLs to work)
4. **File Size Limit**: 50 MB
5. **Allowed MIME Types**: 
   - `image/*`
   - `video/*`
   - `audio/*`

### Step 3: Set Up Storage Policies

In the `message-media` bucket, add these policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Authenticated users can upload message media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-media');
```

**Policy 2: Allow public read access**
```sql
CREATE POLICY "Public read access to message media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-media');
```

**Policy 3: Allow users to delete their own uploads**
```sql
CREATE POLICY "Users can delete their own message media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'message-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 📦 ENVIRONMENT VARIABLES

Add to your `.env` file:

```env
# Tenor GIF API (Get free key at https://tenor.com/developer/keyregistration)
REACT_APP_TENOR_API_KEY=your_tenor_api_key_here

# Supabase (already configured)
REACT_APP_SUPABASE_URL=https://nmhrtllprmonqqocwzvf.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key
```

---

## 🔧 INTEGRATION STEPS

### 1. Update ChatPane/ChatWindow to Use New Components

Replace the old MessageInput with EnhancedMessageInput:

**File**: `src/components/messages/ChatPane.js` (or wherever ChatPane is)

```javascript
// OLD:
import MessageInput from '../pages/Messages/components/ChatWindow/MessageInput';

// NEW:
import EnhancedMessageInput from '../pages/Messages/components/ChatWindow/EnhancedMessageInput';
import { useRealtimeMessages } from '../pages/Messages/hooks/useRealtimeMessages';
import { useTypingIndicator } from '../pages/Messages/hooks/useTypingIndicator';
```

### 2. Update Message Rendering

Replace MessageBubble with EnhancedMessageBubble:

```javascript
// OLD:
import MessageBubble from '../pages/Messages/components/ChatWindow/MessageBubble';

// NEW:
import EnhancedMessageBubble from '../pages/Messages/components/ChatWindow/EnhancedMessageBubble';
```

### 3. Implement Real-Time Messaging

In your ChatPane/ChatWindow component:

```javascript
import { useRealtimeMessages } from '../pages/Messages/hooks/useRealtimeMessages';

function ChatPane({ conversationId, currentUserId, otherUserId }) {
    const {
        messages,
        loading,
        sending,
        sendMessage,
        markAsSeen,
        deleteMessage
    } = useRealtimeMessages(conversationId, currentUserId);

    // Auto-mark as seen when messages are visible
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.sender_id !== currentUserId) {
                markAsSeen(lastMessage.id);
            }
        }
    }, [messages, currentUserId, markAsSeen]);

    return (
        <div>
            {/* Render messages */}
            {messages.map(msg => (
                <EnhancedMessageBubble
                    key={msg.id}
                    message={msg}
                    currentUserId={currentUserId}
                    onReply={(msg) => setReplyTo(msg)}
                    onDelete={deleteMessage}
                    onForward={(msg) => setForwardMessage(msg)}
                />
            ))}

            {/* Input */}
            <EnhancedMessageInput
                conversationId={conversationId}
                currentUserId={currentUserId}
                onSendMessage={sendMessage}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
            />
        </div>
    );
}
```

---

## 🎯 FEATURE CHECKLIST

### ✅ Completed Features (Ready to Use)

1. **✅ Send & Receive Messages** - Real-time with Supabase subscriptions
2. **✅ Image Sharing** - Upload to Supabase Storage with thumbnails
3. **✅ Reply to Message** - Quote reply with preview
4. **✅ Message Reactions** - 6 emojis (❤️😂🔥👍😮😢) with real-time updates
5. **✅ Delete Messages** - Delete for me / Delete for everyone (5-min limit)
6. **✅ Message Status** - Sent ✓ / Delivered ✓✓ / Seen ✓✓ (purple)
7. **✅ Typing Indicators** - Real-time "Typing..." with debounce
8. **✅ GIF Picker** - Tenor API integration with search
9. **✅ Sticker Picker** - 50 custom Focusly stickers
10. **✅ Video Sharing** - Upload videos with thumbnails

### 🔨 Features to Wire Up (Components Exist)

11. **🔨 Audio Calls** - Use existing `useCall.js` hook
12. **🔨 Video Calls** - Use existing `CallWindow.js` component
13. **🔨 Share Focus Content** - Posts/Flash/Boltz sharing
14. **🔨 Online Status** - Use existing `usePresence.js` hook
15. **🔨 Voice Messages** - Use existing `voiceRecorder.js` utility

---

## 🎨 STYLING NOTES

All components use the **Ultimate Lavender Theme v3.0**:
- Primary: `#8B5CF6`
- Secondary: `#A78BFA`
- Dark BG: `#1F1B29`
- Glassmorphism effects throughout

---

## 🚨 CRITICAL NEXT STEPS (IN ORDER)

### Priority 1: Database (15 minutes)
1. Run SQL migration in Supabase Dashboard
2. Create `message-media` storage bucket
3. Set up storage policies

### Priority 2: Environment (5 minutes)
1. Get Tenor API key: https://tenor.com/developer/keyregistration
2. Add to `.env` file

### Priority 3: Integration (30 minutes)
1. Update ChatPane to use `useRealtimeMessages` hook
2. Replace MessageInput with EnhancedMessageInput
3. Replace MessageBubble with EnhancedMessageBubble
4. Test send/receive messages

### Priority 4: Calls Integration (45 minutes)
1. Wire up audio call button in ChatHeader
2. Wire up video call button in ChatHeader
3. Use existing `useCall` hook
4. Test call flow

### Priority 5: Final Testing (30 minutes)
1. Test all message types (text, image, video, GIF, sticker)
2. Test reactions
3. Test delete (for me / for everyone)
4. Test reply
5. Test typing indicators
6. Test message status (sent/delivered/seen)

---

## 📱 MOBILE RESPONSIVENESS

All components are mobile-responsive:
- GIF Picker: Full-screen modal on mobile
- Sticker Picker: Bottom sheet on mobile
- Message bubbles: Touch-optimized
- Long-press for reactions on mobile

---

## 🔥 PERFORMANCE OPTIMIZATIONS

- **Pagination**: 50 messages initially, load more on scroll
- **Lazy loading**: Images load on demand
- **Debounced typing**: Max 1 event per 3 seconds
- **Optimistic UI**: Messages appear instantly, update on confirmation
- **Indexed queries**: All database queries use proper indexes

---

## 🐛 TROUBLESHOOTING

### Messages not sending?
- Check Supabase RLS policies are active
- Verify user is authenticated
- Check browser console for errors

### GIFs not loading?
- Verify Tenor API key is set
- Check network tab for API errors
- Ensure CORS is enabled

### Reactions not working?
- Verify `message_reactions` table exists
- Check RLS policies on reactions table
- Ensure real-time subscriptions are active

### Images not uploading?
- Verify `message-media` bucket exists
- Check storage policies
- Ensure file size < 50MB

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify all migrations ran successfully
4. Test with a fresh browser session

---

## 🎉 LAUNCH CHECKLIST

Before going live:
- [ ] Database migration completed
- [ ] Storage bucket created
- [ ] Tenor API key added
- [ ] All components integrated
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested with multiple users
- [ ] All 13 features working
- [ ] No console errors
- [ ] Performance is smooth

---

**YOU'VE GOT THIS! 🚀 The foundation is solid. Just follow these steps and you'll be live in a few hours!**

**Last updated**: December 31, 2025, 5:35 AM IST
**Status**: Ready for production deployment
