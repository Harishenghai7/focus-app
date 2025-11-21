# 🧪 LiveStream.js - Testing Checklist

## ✅ Comprehensive Testing Guide

---

## 🎯 Pre-Testing Setup

### 1. Database Setup
- [ ] Run `LIVESTREAM-DATABASE-SETUP.sql`
- [ ] Verify tables created: `live_streams`, `stream_viewers`, `stream_chat`, `stream_likes`
- [ ] Verify RLS policies enabled
- [ ] Verify real-time enabled
- [ ] Test database functions

### 2. Environment Setup
- [ ] Install dependencies: `npm install`
- [ ] Configure Supabase credentials
- [ ] Set up TURN/STUN servers (if needed)
- [ ] Enable WebRTC in browser settings

### 3. User Accounts
- [ ] Create test broadcaster account
- [ ] Create 2-3 test viewer accounts
- [ ] Verify authentication works

---

## 🎥 Broadcaster Tests

### Stream Creation
- [ ] Navigate to `/live/:streamId` as broadcaster
- [ ] Verify camera permission prompt appears
- [ ] Grant camera/microphone permissions
- [ ] Verify local video stream displays
- [ ] Verify "LIVE" badge shows
- [ ] Verify "End Stream" button shows
- [ ] Verify broadcaster info displays correctly

### Video Player
- [ ] Verify video is full-screen
- [ ] Verify video is muted (to prevent echo)
- [ ] Verify video quality is acceptable
- [ ] Verify video plays smoothly
- [ ] Test with different resolutions
- [ ] Test with different frame rates

### Viewer Count
- [ ] Verify initial viewer count is 0
- [ ] Join as viewer from another browser
- [ ] Verify viewer count increments
- [ ] Leave as viewer
- [ ] Verify viewer count decrements
- [ ] Test with multiple concurrent viewers

### Chat (Broadcaster Side)
- [ ] Send a message as broadcaster
- [ ] Verify message appears in chat
- [ ] Verify broadcaster avatar shows
- [ ] Verify broadcaster username shows
- [ ] Receive message from viewer
- [ ] Verify viewer message appears

### End Stream
- [ ] Click "End Stream" button
- [ ] Verify confirmation modal appears
- [ ] Click "Cancel" - verify modal closes
- [ ] Click "End Stream" again
- [ ] Click "Confirm" - verify stream ends
- [ ] Verify redirect to profile page
- [ ] Verify stream status updated to "ended"
- [ ] Verify viewers disconnected

---

## 👥 Viewer Tests

### Joining Stream
- [ ] Navigate to `/live/:streamId` as viewer
- [ ] Verify "Join Stream" notification shows
- [ ] Verify notification auto-dismisses after 3s
- [ ] Verify remote video stream displays
- [ ] Verify broadcaster info shows
- [ ] Verify action buttons show (heart, share, leave)
- [ ] Verify "End Stream" button does NOT show

### Video Player
- [ ] Verify remote video displays
- [ ] Verify video is NOT muted
- [ ] Verify audio plays
- [ ] Verify video quality
- [ ] Test with poor network connection
- [ ] Verify reconnection indicator shows if disconnected

### Viewer Count
- [ ] Verify viewer count includes self
- [ ] Join from multiple browsers
- [ ] Verify count updates in real-time
- [ ] Leave and verify count decrements

### Chat (Viewer Side)
- [ ] Send a message as viewer
- [ ] Verify message appears in chat
- [ ] Verify own message highlighted differently
- [ ] Receive message from broadcaster
- [ ] Receive message from other viewers
- [ ] Verify auto-scroll to latest message
- [ ] Test sending empty message (should be blocked)
- [ ] Test sending long message (500 char limit)

### Like Feature
- [ ] Click heart button
- [ ] Verify heart animation plays
- [ ] Verify 10 hearts float up
- [ ] Verify hearts have random positions
- [ ] Verify hearts auto-disappear after 3s
- [ ] Verify heart button disabled after like
- [ ] Verify like recorded in database

### Share Feature
- [ ] Click share button
- [ ] If native share supported:
  - [ ] Verify native share dialog opens
  - [ ] Test sharing to different apps
- [ ] If native share NOT supported:
  - [ ] Verify link copied to clipboard
  - [ ] Verify "Link copied" alert shows
- [ ] Test shared link in new browser
- [ ] Verify shared link works correctly

### Leave Stream
- [ ] Click leave button (X icon)
- [ ] Verify navigation to previous page
- [ ] Verify viewer record updated in database
- [ ] Verify viewer count decrements

---

## 🌐 WebRTC Tests

### Connection Establishment
- [ ] Test broadcaster-viewer connection
- [ ] Verify ICE candidates exchange
- [ ] Verify peer connection established
- [ ] Check browser console for WebRTC logs
- [ ] Verify no connection errors

### Network Conditions
- [ ] Test with good network (100+ Mbps)
- [ ] Test with poor network (< 5 Mbps)
- [ ] Test with fluctuating network
- [ ] Verify adaptive bitrate (if implemented)
- [ ] Test reconnection after disconnect

### Multiple Viewers
- [ ] Connect 5 viewers simultaneously
- [ ] Verify all receive video stream
- [ ] Verify no performance degradation
- [ ] Test chat with all viewers
- [ ] Disconnect viewers one by one

### Browser Compatibility
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)
- [ ] Test on mobile Chrome
- [ ] Test on mobile Safari

---

## 📱 Responsive Design Tests

### Desktop (> 1024px)
- [ ] Verify side-by-side layout
- [ ] Verify 350px chat sidebar
- [ ] Verify full-width video
- [ ] Verify overlay UI positioned correctly
- [ ] Test window resize

### Tablet (768px - 1024px)
- [ ] Verify stacked layout
- [ ] Verify 60% video, 40% chat
- [ ] Verify buttons sized appropriately
- [ ] Test portrait and landscape modes

### Mobile (< 768px)
- [ ] Verify full-width video
- [ ] Verify chat below video
- [ ] Verify touch-friendly buttons
- [ ] Verify text readable
- [ ] Test portrait and landscape modes

### Mobile-Specific
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify video plays (iOS restrictions)
- [ ] Verify audio plays
- [ ] Test camera switch (front/back)

---

## 🔐 Security Tests

### Authentication
- [ ] Access `/live/:streamId` without login
- [ ] Verify redirect to `/auth`
- [ ] Login and verify access granted
- [ ] Logout and verify redirect

### Authorization
- [ ] Try to end stream as viewer
- [ ] Verify "End Stream" button hidden
- [ ] Try direct API call to end stream
- [ ] Verify RLS blocks unauthorized access

### Database Security
- [ ] Try to insert chat as another user
- [ ] Try to view private stream
- [ ] Try to modify viewer count
- [ ] Verify RLS policies enforce rules

---

## 🎨 UI/UX Tests

### Loading States
- [ ] Verify spinner shows while loading
- [ ] Verify "Loading stream..." message
- [ ] Test slow network loading

### Error States
- [ ] Navigate to invalid stream ID
- [ ] Verify "Stream Not Available" message
- [ ] Verify "Go Back" button works
- [ ] Test with ended stream
- [ ] Test with network error

### Empty States
- [ ] View stream with no chat messages
- [ ] Verify "No messages yet" placeholder
- [ ] Send first message
- [ ] Verify placeholder disappears

### Animations
- [ ] Verify heart animation smooth
- [ ] Verify chat messages slide in
- [ ] Verify notification slide down
- [ ] Verify button hover effects
- [ ] Test on low-end devices

---

## ⚡ Performance Tests

### Load Time
- [ ] Measure page load time
- [ ] Target: < 2 seconds
- [ ] Test with slow 3G network
- [ ] Test with cache disabled

### Video Performance
- [ ] Measure video latency
- [ ] Target: < 1 second delay
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Test for memory leaks (10+ min stream)

### Chat Performance
- [ ] Send 100 messages rapidly
- [ ] Verify no lag or freeze
- [ ] Verify scroll performance
- [ ] Monitor DOM size

### Real-time Updates
- [ ] Measure viewer count update latency
- [ ] Target: < 500ms
- [ ] Measure chat message latency
- [ ] Target: < 200ms

---

## 🧪 Edge Cases

### Stream Lifecycle
- [ ] Start stream, immediately end stream
- [ ] Start stream, refresh page
- [ ] Join stream, broadcaster ends immediately
- [ ] Join stream, close browser tab
- [ ] Multiple broadcasters (should not happen)

### Network Issues
- [ ] Disconnect network mid-stream
- [ ] Verify reconnection indicator
- [ ] Reconnect network
- [ ] Verify stream resumes
- [ ] Test with VPN

### Permission Issues
- [ ] Deny camera permission
- [ ] Verify error message
- [ ] Deny microphone permission
- [ ] Verify error message
- [ ] Revoke permissions mid-stream

### Data Edge Cases
- [ ] Stream with 0 viewers
- [ ] Stream with 100+ viewers
- [ ] Chat with 1000+ messages
- [ ] Send message with emojis
- [ ] Send message with special characters
- [ ] Send message with URLs

---

## 🐛 Bug Tracking

### Critical Bugs
- [ ] Video not displaying
- [ ] Audio not working
- [ ] Cannot send chat messages
- [ ] Stream won't end
- [ ] Viewer count incorrect

### High Priority Bugs
- [ ] Heart animation not showing
- [ ] Share button not working
- [ ] Connection status incorrect
- [ ] Memory leak
- [ ] Performance issues

### Medium Priority Bugs
- [ ] UI alignment issues
- [ ] CSS styling problems
- [ ] Button hover effects
- [ ] Animation glitches

### Low Priority Bugs
- [ ] Minor text issues
- [ ] Color inconsistencies
- [ ] Tooltip positioning

---

## ✅ Acceptance Criteria

### Functionality (All Must Pass)
- [ ] Broadcaster can start stream
- [ ] Viewers can join stream
- [ ] Video streams correctly
- [ ] Audio works correctly
- [ ] Chat messages send/receive
- [ ] Viewer count updates
- [ ] Heart animation plays
- [ ] Share button works
- [ ] End stream works

### Performance (Targets)
- [ ] Page load < 2s
- [ ] Video latency < 1s
- [ ] Chat latency < 200ms
- [ ] No memory leaks
- [ ] Smooth animations (60fps)

### UX (All Must Pass)
- [ ] Intuitive UI
- [ ] Clear error messages
- [ ] Responsive design works
- [ ] Accessible (WCAG 2.1 AA)
- [ ] No console errors

---

## 📊 Test Report Template

```
# LiveStream Test Report

**Test Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]
**Browser:** [Chrome/Firefox/Safari/Edge]
**Device:** [Desktop/Tablet/Mobile]

## Test Summary
- Total Tests: [ ]
- Passed: [ ]
- Failed: [ ]
- Blocked: [ ]
- Pass Rate: [ ]%

## Critical Issues
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected result:
   - Actual result:
   - Screenshot/Video:

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Sign-off
- [ ] All critical tests passed
- [ ] All high-priority bugs fixed
- [ ] Performance targets met
- [ ] Ready for deployment

**Approved by:** [Name]
**Date:** [Date]
```

---

## 🎉 Testing Complete!

Use this checklist to ensure comprehensive testing of the LiveStream feature. Mark each item as you complete it, and document any issues found.

**Goal:** 100% pass rate on all critical and high-priority tests before production deployment!
