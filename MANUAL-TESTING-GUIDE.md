# 📋 Manual Testing Guide - Focus Production Readiness

## Overview
This guide provides a comprehensive manual testing checklist for Task 21.4. Test all features on real devices to ensure production readiness.

## 🎯 Testing Objectives
- Verify all features work on real devices
- Test cross-browser compatibility
- Validate responsive design
- Check accessibility features
- Document bugs and issues
- Verify fixes

## 📱 Device Testing Matrix

### Required Test Devices
- [ ] **Desktop - Windows Chrome** (Latest version)
- [ ] **Desktop - Windows Edge** (Latest version)
- [ ] **Desktop - Windows Firefox** (Latest version)
- [ ] **Desktop - Mac Chrome** (Latest version)
- [ ] **Desktop - Mac Safari** (Latest version)
- [ ] **Mobile - iOS Safari** (iPhone)
- [ ] **Mobile - Android Chrome** (Android phone)
- [ ] **Tablet - iPad Safari** (Optional)
- [ ] **Tablet - Android Chrome** (Optional)

### Screen Size Testing
- [ ] Mobile Portrait (375px - 428px)
- [ ] Mobile Landscape (667px - 926px)
- [ ] Tablet Portrait (768px - 834px)
- [ ] Tablet Landscape (1024px - 1112px)
- [ ] Desktop Small (1280px - 1440px)
- [ ] Desktop Large (1920px+)

## 🧪 Feature Testing Checklist

### 1. Authentication & Onboarding

#### Test Case 1.1: Email/Password Signup
- [ ] Navigate to `/auth`
- [ ] Click "Sign Up" tab
- [ ] Enter email and weak password
- [ ] Verify password strength indicator shows "Weak"
- [ ] Enter strong password (8+ chars, uppercase, lowercase, number, special)
- [ ] Verify password strength indicator shows "Strong"
- [ ] Submit form
- [ ] Verify email verification sent
- [ ] Check email and click verification link
- [ ] Verify redirect to onboarding

#### Test Case 1.2: Onboarding Flow
- [ ] Enter username (test uniqueness validation)
- [ ] Enter full name
- [ ] Upload profile avatar
- [ ] Verify image compression (check file size)
- [ ] Add bio (test 150 character limit)
- [ ] Complete onboarding
- [ ] Verify redirect to home feed

#### Test Case 1.3: Login
- [ ] Logout from account
- [ ] Navigate to `/auth`
- [ ] Enter invalid credentials
- [ ] Verify error message displayed
- [ ] Enter valid credentials
- [ ] Verify successful login
- [ ] Verify redirect to home feed

#### Test Case 1.4: OAuth Login (if configured)
- [ ] Click "Continue with Google"
- [ ] Complete OAuth flow
- [ ] Verify account created/logged in
- [ ] Verify profile populated with OAuth data

#### Test Case 1.5: Two-Factor Authentication
- [ ] Navigate to Settings
- [ ] Enable 2FA
- [ ] Scan QR code with authenticator app
- [ ] Enter verification code
- [ ] Verify 2FA enabled
- [ ] Logout and login again
- [ ] Verify 2FA code required
- [ ] Enter code and verify login

### 2. Profile Management


#### Test Case 2.1: View Own Profile
- [ ] Navigate to `/profile`
- [ ] Verify profile information displayed
- [ ] Verify post count accurate
- [ ] Verify follower/following counts accurate
- [ ] Verify posts grid displays correctly

#### Test Case 2.2: Edit Profile
- [ ] Click "Edit Profile"
- [ ] Update username (test uniqueness)
- [ ] Update full name
- [ ] Update bio
- [ ] Upload new avatar
- [ ] Save changes
- [ ] Verify updates reflected immediately

#### Test Case 2.3: Privacy Toggle
- [ ] Navigate to Settings
- [ ] Toggle "Private Account"
- [ ] Verify account set to private
- [ ] Open profile in incognito/another browser
- [ ] Verify posts hidden
- [ ] Verify "Follow" button shows "Request"

#### Test Case 2.4: View Other User Profile
- [ ] Navigate to another user's profile
- [ ] Verify profile information displayed
- [ ] Verify follow button state
- [ ] Click follow button
- [ ] Verify follow status updated
- [ ] Verify follower count incremented

### 3. Post Creation & Feed

#### Test Case 3.1: Create Single Image Post
- [ ] Navigate to `/create`
- [ ] Select "Post" type
- [ ] Upload single image
- [ ] Verify image preview
- [ ] Add caption with hashtags and mentions
- [ ] Verify hashtag/mention autocomplete works
- [ ] Add location (optional)
- [ ] Click "Share"
- [ ] Verify post appears in home feed
- [ ] Verify post appears on profile

#### Test Case 3.2: Create Carousel Post
- [ ] Navigate to `/create`
- [ ] Upload multiple images (2-10)
- [ ] Verify all images preview
- [ ] Drag to reorder images
- [ ] Verify order changes
- [ ] Add caption
- [ ] Click "Share"
- [ ] Verify carousel post in feed
- [ ] Swipe through carousel images
- [ ] Verify indicators show current position

#### Test Case 3.3: Draft Saving
- [ ] Start creating a post
- [ ] Add media and caption
- [ ] Navigate away without posting
- [ ] Return to `/create`
- [ ] Verify draft saved
- [ ] Resume from draft
- [ ] Complete and post

#### Test Case 3.4: Scheduled Post
- [ ] Create a post
- [ ] Click "Schedule"
- [ ] Select future date/time
- [ ] Save scheduled post
- [ ] Navigate to profile
- [ ] Verify scheduled post shown
- [ ] Wait for scheduled time (or manually trigger)
- [ ] Verify post published

#### Test Case 3.5: Home Feed
- [ ] Navigate to `/home`
- [ ] Verify posts from followed users displayed
- [ ] Verify posts in reverse chronological order
- [ ] Scroll to bottom
- [ ] Verify infinite scroll loads more posts
- [ ] Pull down to refresh
- [ ] Verify new posts loaded

### 4. Interactions (Likes, Comments, Saves)


#### Test Case 4.1: Like Post
- [ ] Find a post in feed
- [ ] Click like button
- [ ] Verify heart fills immediately (optimistic update)
- [ ] Verify like count increments
- [ ] Click like again to unlike
- [ ] Verify heart empties
- [ ] Verify like count decrements

#### Test Case 4.2: Double-Tap Like
- [ ] Find a post in feed
- [ ] Double-tap post image
- [ ] Verify heart animation plays
- [ ] Verify post liked
- [ ] Verify like count updated

#### Test Case 4.3: Comment on Post
- [ ] Click comment button on post
- [ ] Type comment text
- [ ] Verify character count updates
- [ ] Add mention (@username)
- [ ] Verify mention autocomplete works
- [ ] Submit comment
- [ ] Verify comment appears immediately
- [ ] Verify comment count increments

#### Test Case 4.4: Reply to Comment
- [ ] Open comments modal
- [ ] Click "Reply" on a comment
- [ ] Type reply text
- [ ] Submit reply
- [ ] Verify reply nested under parent
- [ ] Verify reply count on parent updated

#### Test Case 4.5: Pin Comment (Post Owner)
- [ ] View your own post
- [ ] Open comments
- [ ] Click pin icon on a comment
- [ ] Verify comment moves to top
- [ ] Verify "Pinned" badge shown

#### Test Case 4.6: Save Post
- [ ] Click save button on post
- [ ] Verify bookmark icon fills
- [ ] Navigate to `/saved`
- [ ] Verify post appears in saved collection
- [ ] Unsave post
- [ ] Verify removed from saved

#### Test Case 4.7: Save to Collection
- [ ] Click save button
- [ ] Select "Add to Collection"
- [ ] Create new collection
- [ ] Add post to collection
- [ ] Navigate to saved collections
- [ ] Verify post in collection

### 5. Boltz (Short Videos)

#### Test Case 5.1: Create Boltz
- [ ] Navigate to `/create`
- [ ] Select "Boltz" type
- [ ] Upload video file
- [ ] Verify video preview plays
- [ ] Add caption
- [ ] Click "Share"
- [ ] Verify boltz appears in boltz feed

#### Test Case 5.2: Boltz Feed
- [ ] Navigate to `/boltz`
- [ ] Verify first video auto-plays
- [ ] Verify audio muted by default
- [ ] Click mute button
- [ ] Verify audio plays
- [ ] Swipe up
- [ ] Verify next video loads and plays
- [ ] Swipe down
- [ ] Verify previous video loads

#### Test Case 5.3: Boltz Interactions
- [ ] Like a boltz
- [ ] Verify like count updates
- [ ] Comment on boltz
- [ ] Verify comment appears
- [ ] Share boltz
- [ ] Verify share options displayed

### 6. Flash (Stories)


#### Test Case 6.1: Create Flash Story
- [ ] Navigate to `/create`
- [ ] Select "Flash" type
- [ ] Upload image or video
- [ ] Add text/stickers (if available)
- [ ] Click "Share to Story"
- [ ] Verify story appears in flash feed
- [ ] Verify story ring appears on profile

#### Test Case 6.2: View Flash Stories
- [ ] Navigate to `/flash`
- [ ] Click on a story ring
- [ ] Verify story opens fullscreen
- [ ] Tap to advance to next story
- [ ] Hold to pause story
- [ ] Swipe to next user's stories
- [ ] Verify smooth transitions

#### Test Case 6.3: Close Friends Story
- [ ] Navigate to `/close-friends`
- [ ] Add users to close friends list
- [ ] Create a flash story
- [ ] Toggle "Close Friends Only"
- [ ] Share story
- [ ] Verify green ring on story
- [ ] Login as non-close-friend user
- [ ] Verify story not visible

#### Test Case 6.4: Story Highlights
- [ ] Navigate to profile
- [ ] Click "New Highlight"
- [ ] Select stories to add
- [ ] Name highlight
- [ ] Choose cover image
- [ ] Save highlight
- [ ] Verify highlight appears on profile
- [ ] Click highlight
- [ ] Verify stories play

#### Test Case 6.5: Story Expiration
- [ ] Create a flash story
- [ ] Note creation time
- [ ] Wait 24 hours (or manually trigger expiration)
- [ ] Verify story removed from feed
- [ ] Check archive
- [ ] Verify story moved to archive

### 7. Follow System

#### Test Case 7.1: Follow Public Account
- [ ] Find a public user profile
- [ ] Click "Follow" button
- [ ] Verify button changes to "Following"
- [ ] Verify follower count increments
- [ ] Verify user's posts appear in feed

#### Test Case 7.2: Follow Private Account
- [ ] Find a private user profile
- [ ] Click "Follow" button
- [ ] Verify button changes to "Requested"
- [ ] Verify notification sent to user
- [ ] Login as private account owner
- [ ] Navigate to `/follow-requests`
- [ ] Verify request appears
- [ ] Click "Approve"
- [ ] Verify follow activated

#### Test Case 7.3: Unfollow User
- [ ] Navigate to following user's profile
- [ ] Click "Following" button
- [ ] Click "Unfollow" in dropdown
- [ ] Verify button changes to "Follow"
- [ ] Verify follower count decrements
- [ ] Verify user's posts removed from feed

#### Test Case 7.4: View Followers/Following
- [ ] Navigate to profile
- [ ] Click follower count
- [ ] Verify followers list displayed
- [ ] Click following count
- [ ] Verify following list displayed
- [ ] Search in list
- [ ] Verify search filters results

### 8. Direct Messaging


#### Test Case 8.1: Send Direct Message
- [ ] Navigate to `/messages`
- [ ] Click "New Message"
- [ ] Search for user
- [ ] Select user
- [ ] Type message
- [ ] Send message
- [ ] Verify message appears in thread
- [ ] Verify conversation appears in inbox

#### Test Case 8.2: Real-time Message Delivery
- [ ] Open app in two browsers (different users)
- [ ] Send message from Browser 1
- [ ] Verify message appears in Browser 2 instantly
- [ ] Verify notification sound/badge (if enabled)

#### Test Case 8.3: Typing Indicator
- [ ] Open conversation in two browsers
- [ ] Start typing in Browser 1
- [ ] Verify "User is typing..." appears in Browser 2
- [ ] Stop typing
- [ ] Verify indicator disappears after 3 seconds

#### Test Case 8.4: Read Receipts
- [ ] Send message to user
- [ ] Verify "Delivered" status shown
- [ ] Have recipient open conversation
- [ ] Verify status changes to "Read"
- [ ] Verify timestamp shown

#### Test Case 8.5: Media Messages
- [ ] Open conversation
- [ ] Click media button
- [ ] Select image
- [ ] Verify preview shown
- [ ] Send image
- [ ] Verify image displays inline
- [ ] Click image
- [ ] Verify fullscreen view

#### Test Case 8.6: Voice Messages
- [ ] Open conversation
- [ ] Hold voice record button
- [ ] Record voice message
- [ ] Release to send
- [ ] Verify audio player appears
- [ ] Play voice message
- [ ] Verify waveform animation

#### Test Case 8.7: Delete Message
- [ ] Long-press message
- [ ] Select "Delete"
- [ ] Choose "Delete for Everyone"
- [ ] Verify message removed from both sides
- [ ] Verify "Message deleted" placeholder

### 9. Group Messaging

#### Test Case 9.1: Create Group
- [ ] Navigate to `/messages`
- [ ] Click "New Group"
- [ ] Select multiple users (2-50)
- [ ] Set group name
- [ ] Upload group avatar
- [ ] Create group
- [ ] Verify group appears in inbox

#### Test Case 9.2: Group Chat
- [ ] Open group conversation
- [ ] Send message
- [ ] Verify message delivered to all members
- [ ] Verify sender name shown
- [ ] Reply to message
- [ ] Verify reply threading

#### Test Case 9.3: Group Management
- [ ] Open group info
- [ ] Add new member
- [ ] Verify member added
- [ ] Remove member (as admin)
- [ ] Verify member removed
- [ ] Update group name
- [ ] Verify name updated for all members

#### Test Case 9.4: Leave Group
- [ ] Open group info
- [ ] Click "Leave Group"
- [ ] Confirm action
- [ ] Verify group removed from inbox
- [ ] Verify "User left" message in group

### 10. Audio/Video Calls


#### Test Case 10.1: Initiate Audio Call
- [ ] Open conversation
- [ ] Click audio call button
- [ ] Verify call invitation sent
- [ ] Have recipient accept call
- [ ] Verify audio connection established
- [ ] Verify call timer starts
- [ ] Test audio quality

#### Test Case 10.2: Initiate Video Call
- [ ] Open conversation
- [ ] Click video call button
- [ ] Verify call invitation sent
- [ ] Have recipient accept call
- [ ] Verify video streams displayed
- [ ] Verify local video in corner
- [ ] Verify remote video fullscreen

#### Test Case 10.3: Call Controls
- [ ] During active call, click mute
- [ ] Verify microphone muted
- [ ] Verify mute icon shown
- [ ] Click camera off (video call)
- [ ] Verify video stream stops
- [ ] Click switch camera (mobile)
- [ ] Verify camera switches

#### Test Case 10.4: End Call
- [ ] Click end call button
- [ ] Verify call terminates
- [ ] Verify call duration shown
- [ ] Navigate to `/calls`
- [ ] Verify call logged in history

#### Test Case 10.5: Missed Call
- [ ] Initiate call to offline user
- [ ] Let call timeout
- [ ] Verify missed call notification sent
- [ ] Login as recipient
- [ ] Verify missed call shown
- [ ] Click call back
- [ ] Verify call initiated

### 11. Notifications

#### Test Case 11.1: Like Notification
- [ ] Have another user like your post
- [ ] Verify notification appears in real-time
- [ ] Verify notification badge updates
- [ ] Click notification
- [ ] Verify navigates to post

#### Test Case 11.2: Comment Notification
- [ ] Have another user comment on your post
- [ ] Verify notification appears
- [ ] Click notification
- [ ] Verify opens comments modal

#### Test Case 11.3: Follow Notification
- [ ] Have another user follow you
- [ ] Verify notification appears
- [ ] Click notification
- [ ] Verify navigates to their profile

#### Test Case 11.4: Mention Notification
- [ ] Have another user mention you in comment
- [ ] Verify notification appears
- [ ] Click notification
- [ ] Verify navigates to comment

#### Test Case 11.5: Push Notifications
- [ ] Close app/put in background
- [ ] Have another user interact with your content
- [ ] Verify push notification received
- [ ] Click push notification
- [ ] Verify app opens to relevant content

#### Test Case 11.6: Notification Center
- [ ] Navigate to `/notifications`
- [ ] Verify all notifications listed
- [ ] Verify grouped by type
- [ ] Click "Mark all as read"
- [ ] Verify all marked read
- [ ] Verify badge cleared

### 12. Search & Discovery


#### Test Case 12.1: Search Users
- [ ] Click search bar
- [ ] Type username
- [ ] Verify autocomplete suggestions
- [ ] Verify user results displayed
- [ ] Click user result
- [ ] Verify navigates to profile

#### Test Case 12.2: Search Hashtags
- [ ] Type hashtag in search
- [ ] Verify hashtag suggestions
- [ ] Click hashtag
- [ ] Verify navigates to hashtag page
- [ ] Verify posts with hashtag displayed

#### Test Case 12.3: Explore Feed
- [ ] Navigate to `/explore`
- [ ] Verify trending content displayed
- [ ] Verify category tabs (Photos, Videos, Boltz)
- [ ] Switch categories
- [ ] Verify content filters correctly
- [ ] Pull to refresh
- [ ] Verify new content loaded

#### Test Case 12.4: Trending Hashtags
- [ ] Navigate to explore
- [ ] Verify trending hashtags section
- [ ] Verify post counts shown
- [ ] Click trending hashtag
- [ ] Verify navigates to hashtag page

#### Test Case 12.5: Search History
- [ ] Perform several searches
- [ ] Click search bar
- [ ] Verify recent searches shown
- [ ] Click recent search
- [ ] Verify search executed
- [ ] Clear search history
- [ ] Verify history cleared

### 13. Settings & Account Management

#### Test Case 13.1: Change Password
- [ ] Navigate to Settings
- [ ] Click "Change Password"
- [ ] Enter current password
- [ ] Enter new password
- [ ] Verify password strength indicator
- [ ] Submit form
- [ ] Verify password updated
- [ ] Logout and login with new password

#### Test Case 13.2: Privacy Settings
- [ ] Navigate to Settings > Privacy
- [ ] Toggle "Private Account"
- [ ] Toggle "Show Activity Status"
- [ ] Toggle "Allow Comments"
- [ ] Toggle "Allow Mentions"
- [ ] Save settings
- [ ] Verify settings applied

#### Test Case 13.3: Notification Preferences
- [ ] Navigate to Settings > Notifications
- [ ] Toggle notification types
- [ ] Disable likes notifications
- [ ] Disable comments notifications
- [ ] Save preferences
- [ ] Have user interact with content
- [ ] Verify notifications respect preferences

#### Test Case 13.4: Block User
- [ ] Navigate to user profile
- [ ] Click menu
- [ ] Select "Block"
- [ ] Confirm block
- [ ] Verify user blocked
- [ ] Verify user's content hidden
- [ ] Verify user cannot interact

#### Test Case 13.5: Account Deletion
- [ ] Navigate to Settings > Account
- [ ] Click "Delete Account"
- [ ] Read warning
- [ ] Confirm deletion
- [ ] Verify 30-day grace period message
- [ ] Verify account scheduled for deletion

#### Test Case 13.6: Data Export
- [ ] Navigate to Settings > Privacy
- [ ] Click "Download Your Data"
- [ ] Request export
- [ ] Wait for export generation
- [ ] Download export file
- [ ] Verify JSON contains user data

### 14. Accessibility Testing


#### Test Case 14.1: Screen Reader Navigation
- [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
- [ ] Navigate through home feed
- [ ] Verify all elements announced
- [ ] Verify images have alt text
- [ ] Verify buttons have labels
- [ ] Verify form inputs have labels
- [ ] Navigate to profile
- [ ] Verify profile info announced

#### Test Case 14.2: Keyboard Navigation
- [ ] Use only keyboard (no mouse)
- [ ] Tab through navigation
- [ ] Verify focus indicators visible
- [ ] Press Enter to activate buttons
- [ ] Navigate through feed with Tab
- [ ] Open modal with Enter
- [ ] Close modal with Escape
- [ ] Verify all features accessible

#### Test Case 14.3: Color Contrast
- [ ] Use contrast checker tool
- [ ] Verify text contrast ratio ≥ 4.5:1
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify button contrast
- [ ] Verify link contrast
- [ ] Verify icon contrast

#### Test Case 14.4: Focus Management
- [ ] Open modal
- [ ] Verify focus trapped in modal
- [ ] Tab through modal elements
- [ ] Close modal
- [ ] Verify focus returns to trigger
- [ ] Navigate to new page
- [ ] Verify focus on main content

#### Test Case 14.5: Reduced Motion
- [ ] Enable reduced motion in OS
- [ ] Navigate through app
- [ ] Verify animations disabled/reduced
- [ ] Verify transitions simplified
- [ ] Verify functionality maintained

### 15. Performance Testing

#### Test Case 15.1: Initial Load Time
- [ ] Clear browser cache
- [ ] Open app
- [ ] Measure time to interactive
- [ ] Verify < 3 seconds on good connection
- [ ] Check Network tab
- [ ] Verify bundle size < 5MB

#### Test Case 15.2: Image Loading
- [ ] Scroll through feed
- [ ] Verify images lazy load
- [ ] Verify blur-up placeholders
- [ ] Verify smooth loading
- [ ] Check Network tab
- [ ] Verify images compressed

#### Test Case 15.3: Infinite Scroll Performance
- [ ] Scroll through 100+ posts
- [ ] Verify smooth scrolling
- [ ] Verify no lag or jank
- [ ] Check memory usage
- [ ] Verify no memory leaks
- [ ] Verify old posts unloaded

#### Test Case 15.4: Real-time Performance
- [ ] Subscribe to multiple channels
- [ ] Verify updates arrive quickly
- [ ] Verify no lag in UI
- [ ] Check WebSocket connections
- [ ] Verify max 5 concurrent subscriptions

#### Test Case 15.5: Offline Performance
- [ ] Disconnect internet
- [ ] Navigate through app
- [ ] Verify cached content loads
- [ ] Verify offline indicator shown
- [ ] Try interactions
- [ ] Verify queued for sync
- [ ] Reconnect internet
- [ ] Verify sync completes

### 16. Security Testing


#### Test Case 16.1: Authentication Security
- [ ] Try accessing protected routes without login
- [ ] Verify redirect to auth page
- [ ] Login and verify session persists
- [ ] Clear cookies
- [ ] Verify logged out
- [ ] Try SQL injection in login form
- [ ] Verify input sanitized

#### Test Case 16.2: Authorization Testing
- [ ] Try accessing another user's private data
- [ ] Verify RLS policies block access
- [ ] Try editing another user's post
- [ ] Verify permission denied
- [ ] Try deleting another user's comment
- [ ] Verify permission denied

#### Test Case 16.3: Rate Limiting
- [ ] Post 10 comments rapidly
- [ ] Verify rate limit message after 10
- [ ] Wait 1 minute
- [ ] Try commenting again
- [ ] Verify allowed after cooldown

#### Test Case 16.4: XSS Prevention
- [ ] Try posting script tags in caption
- [ ] Verify script tags sanitized
- [ ] Try XSS in comment
- [ ] Verify sanitized
- [ ] Try XSS in bio
- [ ] Verify sanitized

#### Test Case 16.5: CSRF Protection
- [ ] Check network requests
- [ ] Verify CSRF tokens included
- [ ] Try request without token
- [ ] Verify request rejected

### 17. Cross-Platform Testing

#### Test Case 17.1: Responsive Design
- [ ] Test on mobile (375px)
- [ ] Verify layout adapts
- [ ] Verify touch targets ≥ 44px
- [ ] Test on tablet (768px)
- [ ] Verify layout adapts
- [ ] Test on desktop (1920px)
- [ ] Verify layout uses space well

#### Test Case 17.2: Dark Mode
- [ ] Toggle dark mode
- [ ] Verify all pages update
- [ ] Verify colors appropriate
- [ ] Verify contrast maintained
- [ ] Verify images visible
- [ ] Verify icons visible

#### Test Case 17.3: Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Safari
- [ ] Test on Firefox
- [ ] Test on Edge
- [ ] Verify consistent behavior
- [ ] Document any differences

#### Test Case 17.4: Mobile Gestures
- [ ] Test swipe navigation
- [ ] Test pull to refresh
- [ ] Test pinch to zoom (where appropriate)
- [ ] Test long press menus
- [ ] Verify haptic feedback (if available)

#### Test Case 17.5: Orientation Changes
- [ ] Rotate device to landscape
- [ ] Verify layout adapts
- [ ] Verify no content loss
- [ ] Rotate back to portrait
- [ ] Verify layout restores

### 18. PWA Testing


#### Test Case 18.1: Install Prompt
- [ ] Open app in Chrome/Edge
- [ ] Wait for install prompt
- [ ] Click "Install"
- [ ] Verify app installs
- [ ] Verify app icon on home screen/desktop

#### Test Case 18.2: Standalone Mode
- [ ] Open installed PWA
- [ ] Verify runs in standalone window
- [ ] Verify no browser UI
- [ ] Verify app bar present
- [ ] Verify navigation works

#### Test Case 18.3: Offline Functionality
- [ ] Install PWA
- [ ] Disconnect internet
- [ ] Open PWA
- [ ] Verify cached content loads
- [ ] Verify offline page shown for uncached
- [ ] Reconnect internet
- [ ] Verify app syncs

#### Test Case 18.4: Service Worker
- [ ] Open DevTools > Application
- [ ] Verify service worker registered
- [ ] Verify service worker active
- [ ] Check cache storage
- [ ] Verify assets cached
- [ ] Update app
- [ ] Verify service worker updates

### 19. Internationalization Testing

#### Test Case 19.1: Language Switching
- [ ] Navigate to Settings
- [ ] Change language to Spanish
- [ ] Verify UI updates to Spanish
- [ ] Verify all text translated
- [ ] Change to French
- [ ] Verify UI updates to French
- [ ] Change back to English

#### Test Case 19.2: Language Persistence
- [ ] Change language to German
- [ ] Close app
- [ ] Reopen app
- [ ] Verify language still German
- [ ] Logout and login
- [ ] Verify language persists

#### Test Case 19.3: RTL Support (if applicable)
- [ ] Change to RTL language (Arabic)
- [ ] Verify layout mirrors
- [ ] Verify text alignment right
- [ ] Verify icons flip appropriately

## 🐛 Bug Tracking Template

When you find a bug, document it using this template:

### Bug Report #[NUMBER]
**Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Device:** [Device and browser]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]
**Actual Result:** [What actually happens]
**Screenshots:** [Attach if applicable]
**Console Errors:** [Copy any errors]

## ✅ Sign-Off Checklist

After completing all tests, verify:
- [ ] All critical features work on all devices
- [ ] No critical or high severity bugs remain
- [ ] Performance meets requirements
- [ ] Accessibility standards met
- [ ] Security measures verified
- [ ] All bugs documented
- [ ] Fixes verified

## 📊 Test Summary Report

Complete this after testing:

**Total Test Cases:** [Number]
**Passed:** [Number]
**Failed:** [Number]
**Blocked:** [Number]

**Critical Bugs:** [Number]
**High Priority Bugs:** [Number]
**Medium Priority Bugs:** [Number]
**Low Priority Bugs:** [Number]

**Recommendation:** Ready for Production / Needs Fixes / Major Issues

---

**Tester Name:** _______________
**Date:** _______________
**Signature:** _______________
