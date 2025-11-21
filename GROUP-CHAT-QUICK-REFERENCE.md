# GroupChat & GroupSettings - Quick Reference Guide

## 🚀 Quick Start

### Using GroupChat Component
```javascript
import GroupChat from './pages/GroupChat';

<Route 
  path="/group/:groupId" 
  element={<GroupChat user={user} userProfile={userProfile} />} 
/>
```

### Using GroupSettings Component
```javascript
import GroupSettings from './pages/GroupSettings';

<Route 
  path="/group-settings/:groupId" 
  element={<GroupSettings user={user} userProfile={userProfile} />} 
/>
```

## 📦 Component Dependencies

### GroupChat.js Dependencies:
```javascript
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaViewer from '../components/MediaViewer';
import MessageInput from '../components/MessageInput';
import MemberCard from '../components/MemberCard';
import Layout from '../components/Layout/Layout';
import { useMessages } from '../hooks/useMessages';
import { formatDate, formatTime } from '../utils/dateFormatter';
```

### GroupSettings.js Dependencies:
```javascript
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import MemberCard from '../components/MemberCard';
import ImageCropper from '../components/ImageCropper';
import { formatDate } from '../utils/dateFormatter';
```

## 🎯 Key Functions

### GroupChat Functions:

#### fetchGroupData()
```javascript
// Fetches group info and members
// Sets group, members, mute status, unread count
await fetchGroupData();
```

#### handleSendMessage(content)
```javascript
// Send text message
await handleSendMessage('Hello!');
```

#### handleSendVoice(blob, duration)
```javascript
// Send voice message
await handleSendVoice(audioBlob, 30);
```

#### handleSendFile(file)
```javascript
// Send image/video/file
await handleSendFile(fileObject);
```

#### handleAddMember()
```javascript
// Show add member modal (admin only)
handleAddMember();
```

#### handleRemoveMember(member)
```javascript
// Remove member from group (admin only)
await handleRemoveMember(memberObject);
```

#### handleMakeAdmin(member)
```javascript
// Promote member to admin (creator only)
await handleMakeAdmin(memberObject);
```

#### handleMuteGroup(hours)
```javascript
// Mute group notifications
await handleMuteGroup(24); // Mute for 24 hours
await handleMuteGroup(null); // Unmute
```

### GroupSettings Functions:

#### handleUpdateGroupName()
```javascript
// Update group name (admin only)
setNewGroupName('New Name');
await handleUpdateGroupName();
```

#### handleImageSelect(event)
```javascript
// Select and crop avatar image
handleImageSelect(event);
```

#### handleImageCrop(croppedImage)
```javascript
// Upload cropped image as group avatar
await handleImageCrop(croppedBlob);
```

#### handleSearchUsers(query)
```javascript
// Search users to add to group
await handleSearchUsers('username');
```

#### handleAddMember(userId)
```javascript
// Add user to group
await handleAddMember('user-uuid');
```

#### handleToggleMute(hours)
```javascript
// Toggle notification mute
await handleToggleMute(168); // Mute for 1 week
await handleToggleMute(null); // Unmute
```

#### handleLeaveGroup()
```javascript
// Leave the group
await handleLeaveGroup();
```

#### handleDeleteGroup()
```javascript
// Delete group (creator only, requires confirmation)
await handleDeleteGroup();
```

## 🎨 CSS Variables Used

```css
--bg-primary: Main background color
--bg-secondary: Secondary background (cards)
--bg-tertiary: Tertiary background (hover states)
--text-primary: Primary text color
--text-secondary: Secondary text color
--border-color: Border color
--primary-color: Primary brand color
--primary-dark: Dark variant of primary
--danger-color: Danger/delete color
--danger-dark: Dark variant of danger
--warning-color: Warning color
--surface: Surface color (header/footer)
--hover: Hover state color
```

## 📱 Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 769px) {
  .members-sidebar { width: 360px; }
}

/* Mobile */
@media (max-width: 768px) {
  .members-sidebar { width: 100%; }
  /* Stacked layouts, full-screen modals */
}
```

## 🔌 Supabase RPC Functions Used

### GroupChat:
```sql
-- Reset unread count
reset_group_unread_count(p_group_id, p_user_id)

-- Toggle mute
toggle_group_mute(p_group_id, p_user_id, p_duration_hours)
```

### Database Tables:
```sql
-- Tables
group_chats (id, name, avatar_url, created_by, created_at)
group_members (group_id, user_id, role, joined_at, muted_until, unread_count)
group_messages (id, group_id, sender_id, content, message_type, media_url, created_at)
profiles (id, username, full_name, avatar_url, is_verified)
```

## 🎯 Permission Checks

### Check if Admin:
```javascript
const isAdmin = () => {
  const currentMember = members.find(m => m.user_id === user.id);
  return currentMember?.role === 'admin';
};
```

### Check if Creator:
```javascript
const isCreator = () => {
  return group?.created_by === user.id;
};
```

### Conditional Rendering:
```javascript
{isAdmin() && (
  <button onClick={handleAddMember}>Add Member</button>
)}

{isCreator() && (
  <button onClick={handleDeleteGroup}>Delete Group</button>
)}
```

## 🎬 Animation Examples

### Slide-in Sidebar:
```javascript
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', damping: 25 }}
>
  {/* Sidebar content */}
</motion.div>
```

### Fade Modal:
```javascript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* Modal content */}
</motion.div>
```

### Message Animation:
```javascript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Message content */}
</motion.div>
```

## 🔄 useMessages Hook API

```javascript
const { 
  messages,        // Array of message objects
  loading,         // Boolean loading state
  sendMessage,     // Function(content: string)
  sendMediaMessage // Function(file: File, type: string, metadata: object)
} = useMessages(
  chatId,          // Group ID or Chat ID
  userId,          // Current user ID
  'group'          // Chat type: 'group' or 'direct'
);
```

### Send Text Message:
```javascript
await sendMessage('Hello everyone!');
```

### Send Image:
```javascript
await sendMediaMessage(imageFile, 'image', { 
  caption: 'Check this out!' 
});
```

### Send Voice:
```javascript
await sendMediaMessage(audioBlob, 'voice', { 
  duration: 30 
});
```

## 🚨 Error Handling Pattern

```javascript
try {
  // Your async operation
  await someAsyncFunction();
  
  // Success feedback
  alert('Operation successful');
  
} catch (error) {
  console.error('Error description:', error);
  alert('User-friendly error message');
}
```

## 🎨 MemberCard Component API

```javascript
<MemberCard
  member={memberObject}              // Required: Member object
  isAdmin={member.role === 'admin'}  // Show admin badge
  canRemove={isAdmin() && ...}       // Show remove button
  onRemove={handleRemoveMember}      // Remove callback
  onMakeAdmin={handleMakeAdmin}      // Make admin callback
/>
```

## 📊 State Management Patterns

### Local State:
```javascript
const [group, setGroup] = useState(null);
const [members, setMembers] = useState([]);
const [loading, setLoading] = useState(true);
```

### Derived State:
```javascript
const isAdmin = () => members.find(m => m.user_id === user.id)?.role === 'admin';
const memberCount = members.length;
```

### Update Pattern:
```javascript
// Add member
setMembers(prev => [...prev, newMember]);

// Remove member
setMembers(prev => prev.filter(m => m.user_id !== userId));

// Update member
setMembers(prev => prev.map(m => 
  m.user_id === userId ? { ...m, role: 'admin' } : m
));
```

## 🔍 Debugging Tips

### Check Group Data:
```javascript
console.log('Group:', group);
console.log('Members:', members);
console.log('Is Admin:', isAdmin());
```

### Check Messages:
```javascript
console.log('Messages:', messages);
console.log('Loading:', loading);
```

### Check Permissions:
```javascript
console.log('User ID:', user.id);
console.log('Group Creator:', group.created_by);
console.log('Current Member:', members.find(m => m.user_id === user.id));
```

## 🎯 Common Use Cases

### Navigate to Group Chat:
```javascript
navigate(`/group/${groupId}`);
```

### Navigate to Settings:
```javascript
navigate(`/group-settings/${groupId}`);
```

### Open Members Sidebar:
```javascript
setShowMembersSidebar(true);
```

### Mute Group:
```javascript
await handleMuteGroup(24); // 24 hours
```

### Add Member:
```javascript
setShowAddMember(true);
// User searches and selects
await handleAddMember(selectedUserId);
```

## 📝 Best Practices

1. **Always check permissions** before showing admin controls
2. **Confirm destructive actions** (delete, remove)
3. **Show loading states** during async operations
4. **Handle errors gracefully** with user feedback
5. **Use optimistic updates** for better UX
6. **Cleanup subscriptions** in useEffect return
7. **Validate input** before sending to database
8. **Use TypeScript types** for better type safety (if migrating)

## 🎉 Features Checklist

- [x] Real-time messaging
- [x] Member management
- [x] Admin controls
- [x] Mute notifications
- [x] Change group info
- [x] Media messaging
- [x] Voice messages
- [x] File sharing
- [x] Member search
- [x] Delete group
- [x] Leave group
- [x] Responsive design
- [x] Animations
- [x] Error handling
- [x] Loading states

---

**Quick Reference Version:** 1.0  
**Last Updated:** November 16, 2025  
**Status:** Production Ready ✅
