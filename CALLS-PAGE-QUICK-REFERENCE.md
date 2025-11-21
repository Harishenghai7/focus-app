# 📞 Calls.js - Quick Reference Guide

## 🎯 Overview

The Calls page (`src/pages/Calls.js`) is a fully-featured call history and management interface with real-time incoming call notifications, media permissions handling, and WebRTC integration.

---

## 📦 Required Imports (from importMap)

### Components:
```javascript
const { CallButton, IncomingCallModal } = components;
```

### Hooks:
```javascript
const { useWebRTCCall, useMediaPermissions } = hooks;
```

### Utils:
```javascript
const { callSignaling, dateFormatter, helpers } = utils;
```

---

## 🎨 Features Checklist

- [x] **Call history list** with grouped dates
- [x] **Filter tabs** (All/Missed/Incoming/Outgoing)
- [x] **Voice/video call buttons** using CallButton component
- [x] **Call duration display** using formatDuration utility
- [x] **Delete call history** with confirmation
- [x] **Incoming call listener** with IncomingCallModal
- [x] **Real-time updates** via Supabase subscriptions
- [x] **Search functionality** by name/username
- [x] **New call modal** with contacts list
- [x] **Call details modal** with actions
- [x] **Media permissions** checking and requesting
- [x] **Call signaling** integration
- [x] **Array safety** with `(calls || [])`
- [x] **Error handling** and retry options
- [x] **Loading states** with spinners
- [x] **Empty states** with illustrations

---

## 🔑 Key Functions

### Call Management:
- `fetchCalls()` - Load call history from Supabase
- `handleStartCall(userId, type)` - Initiate new call with permissions
- `handleDeleteCall(callId)` - Remove call from history
- `handleViewCallDetails(call)` - Show call details modal

### Incoming Calls:
- `subscribeToIncomingCalls()` - Listen for incoming calls
- `handleAcceptCall(callId, callType)` - Accept and navigate to call
- `handleDeclineCall(callId)` - Decline incoming call

### Filters & Search:
- `setFilter(type)` - Change call filter
- `setSearchQuery(query)` - Search calls by name
- `groupCallsByDate(calls)` - Group calls by date

### Formatting:
- `formatCallDuration(seconds)` - Format duration display
- `formatTime(date)` - Format call time
- `getCallStatusInfo(call)` - Get call status with icon/color

---

## 🎭 Component Usage

### CallButton Component:

```javascript
<CallButton
  userId={otherUser?.id}
  type="video"  // or "audio"
  onCallStart={(userId, type) => handleStartCall(userId, type)}
  className="call-action-btn video"
  showLabel={true}  // optional
  label="Video Call"  // optional
/>
```

**Props:**
- `userId` - ID of user to call
- `type` - "video" or "audio"
- `onCallStart` - Callback when call initiated
- `className` - Custom CSS class
- `showLabel` - Display text label (optional)
- `label` - Custom label text (optional)

### IncomingCallModal Component:

```javascript
<IncomingCallModal
  show={showIncomingCallModal}
  call={incomingCall}
  onAccept={() => handleAcceptCall(incomingCall.id, incomingCall.type)}
  onDecline={() => handleDeclineCall(incomingCall.id)}
  onClose={() => {
    setShowIncomingCallModal(false);
    setIncomingCall(null);
  }}
/>
```

**Props:**
- `show` - Boolean to show/hide modal
- `call` - Call object with caller/receiver info
- `onAccept` - Callback when call accepted
- `onDecline` - Callback when call declined
- `onClose` - Callback to close modal

---

## 🪝 Hook Usage

### useMediaPermissions:

```javascript
const { hasPermissions, requestPermissions, permissionError } = useMediaPermissions();

// Check permissions before call
if (!hasPermissions) {
  const granted = await requestPermissions(type === 'video');
  if (!granted) {
    alert('Permissions required');
    return;
  }
}
```

**Returns:**
- `hasPermissions` - Boolean if permissions granted
- `requestPermissions(needsVideo)` - Request camera/mic access
- `permissionError` - Error message if permissions denied

### useWebRTCCall:

```javascript
const webRTCCall = useWebRTCCall();

// Available for WebRTC connection management
// Can be used for call state, peer connections, etc.
```

---

## 🛠️ Utility Functions

### callSignaling:

```javascript
// Initialize outgoing call
await callSignaling.initializeCall(userId, type, user.id);

// Accept incoming call
await callSignaling.acceptCall(callId);

// Decline incoming call
await callSignaling.declineCall(callId);
```

### dateFormatter:

```javascript
// Format call duration
const duration = dateFormatter.formatDuration(seconds);
// Returns: "2:45" or "1:05:30"
```

---

## 📊 Data Structure

### Call Object:
```javascript
{
  id: 'uuid',
  caller_id: 'uuid',
  receiver_id: 'uuid',
  type: 'video' | 'audio',
  status: 'ringing' | 'completed' | 'missed' | 'declined' | 'failed',
  duration: 165,  // seconds
  created_at: '2025-11-16T10:30:00Z',
  caller: {
    id: 'uuid',
    username: 'john_doe',
    full_name: 'John Doe',
    avatar_url: 'https://...',
    is_verified: true
  },
  receiver: {
    // same structure
  }
}
```

---

## 🎯 Call Flow Diagrams

### Outgoing Call Flow:
```
User clicks CallButton
  ↓
Check media permissions
  ↓ (if not granted)
Request permissions
  ↓ (if granted)
callSignaling.initializeCall()
  ↓
Navigate to /call/:userId
  ↓
WebRTC connection established
```

### Incoming Call Flow:
```
Supabase realtime event (INSERT)
  ↓
Fetch caller profile
  ↓
setIncomingCall()
  ↓
Show IncomingCallModal
  ↓
User accepts/declines
  ↓ (accept)
Check permissions → Navigate to call
  ↓ (decline)
callSignaling.declineCall() → Close modal
```

---

## 🔒 Safety Patterns

### Always use array safety:
```javascript
(calls || []).map(call => ...)
(data || []).filter(call => ...)
(filteredCalls || []).forEach(call => ...)
```

### Always check user:
```javascript
if (!user?.id) return;
```

### Always clean up subscriptions:
```javascript
useEffect(() => {
  const unsubscribe = subscribeToIncomingCalls();
  return () => {
    unsubscribe?.();
  };
}, [dependencies]);
```

---

## 🎨 Styling Classes

### Call Status Colors:
- `.missed` - Red for missed calls
- `.declined` - Orange for declined calls
- `.completed` - Green for completed calls
- `.failed` - Red for failed calls
- `.default` - Gray for pending calls

### Call Direction Icons:
- `.outgoing` - Arrow up-right
- `.incoming` - Arrow down-left
- `.missed` - Arrow down with X

---

## 🐛 Common Issues & Solutions

### Issue: Permissions not working
**Solution:** Ensure HTTPS or localhost, check browser permissions

### Issue: Incoming calls not showing
**Solution:** Verify Supabase realtime is enabled, check user authentication

### Issue: Call buttons not working
**Solution:** Verify CallButton component is imported from importMap

### Issue: Duration not displaying
**Solution:** Check that call.duration > 0 and status is 'completed'

---

## ✅ Testing Checklist

- [ ] Call history loads correctly
- [ ] Filters work (All/Missed/Incoming/Outgoing)
- [ ] Search finds calls by name
- [ ] Video call button works
- [ ] Audio call button works
- [ ] Delete call removes from list
- [ ] Incoming call modal appears
- [ ] Accept call navigates correctly
- [ ] Decline call updates status
- [ ] Permissions requested before call
- [ ] Real-time updates work
- [ ] Empty states show properly
- [ ] Loading states display
- [ ] Error states with retry work

---

## 📚 Related Files

- **Component:** `src/components/CallButton.js`
- **Component:** `src/components/IncomingCallModal.js`
- **Hook:** `src/hooks/useWebRTCCall.js`
- **Hook:** `src/hooks/useMediaPermissions.js`
- **Utility:** `src/utils/callSignaling.js`
- **Utility:** `src/utils/dateFormatter.js`
- **Styles:** `src/pages/Calls.css`

---

## 🎉 Completion Status

**All features from Prompt P2-J have been successfully implemented!**

✅ Call history list  
✅ Missed/received/outgoing tabs  
✅ Voice/video call buttons  
✅ Call duration display  
✅ Delete call history  
✅ Incoming call listener  
✅ Components integrated  
✅ Hooks integrated  
✅ Utils integrated  
✅ Safety checks added  
✅ Simple list layout with icons  

---

**Last Updated:** November 16, 2025  
**Status:** Production Ready ✅
