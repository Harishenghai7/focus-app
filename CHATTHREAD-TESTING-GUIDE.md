# 🧪 ChatThread.js - Testing Checklist

## Manual Testing Guide

### ✅ Core Messaging Tests

#### Test 1: Send Text Message
- [ ] Type a message in the input field
- [ ] Click send button (or press Enter)
- [ ] Message appears in chat with "sending" status
- [ ] Message updates to "sent" status
- [ ] Message appears in correct position (right side)
- [ ] Timestamp is formatted correctly

#### Test 2: Receive Text Message
- [ ] Send message from another account
- [ ] Message appears instantly (real-time)
- [ ] Message appears in correct position (left side)
- [ ] Timestamp is formatted correctly
- [ ] Typing indicator appears before message
- [ ] Auto-scroll to new message

#### Test 3: Message Safety
- [ ] Open chat with no messages
- [ ] Verify "No messages yet" appears
- [ ] No errors in console
- [ ] Send first message successfully
- [ ] Messages array handles null/undefined safely

---

### ✅ Emoji Picker Tests

#### Test 4: Emoji Picker Functionality
- [ ] Click emoji button (😊)
- [ ] Emoji picker popup appears
- [ ] All categories visible (Smileys, Animals, Food, Activities)
- [ ] Click emoji to insert
- [ ] Emoji appears in text input
- [ ] Can type more text after emoji
- [ ] Send message with emoji
- [ ] Emoji displays correctly in message

#### Test 5: Emoji Picker Interaction
- [ ] Emoji picker closes when clicking outside
- [ ] Can switch between categories
- [ ] Search functionality works
- [ ] Multiple emojis can be added
- [ ] Cursor position maintained

---

### ✅ Voice Message Tests

#### Test 6: Voice Recording
- [ ] Clear text input (must be empty)
- [ ] Microphone button (🎤) appears
- [ ] Click microphone button
- [ ] VoiceRecorder component appears
- [ ] "Recording..." indicator shows
- [ ] Can record for up to 60 seconds
- [ ] Click stop to finish recording
- [ ] Voice message uploads to storage
- [ ] Voice message appears in chat
- [ ] Audio player works correctly

#### Test 7: Voice Recording Cancellation
- [ ] Start recording
- [ ] Click cancel button
- [ ] Recording stops
- [ ] No message sent
- [ ] Input returns to normal state

---

### ✅ File Upload Tests

#### Test 8: Image Upload
- [ ] Click attachment button (📎)
- [ ] File picker opens
- [ ] Select an image file
- [ ] Upload progress indicator appears
- [ ] Image uploads successfully
- [ ] Image message appears in chat
- [ ] Image preview displays correctly
- [ ] Image loads with lazy loading

#### Test 9: Video Upload
- [ ] Click attachment button (📎)
- [ ] Select a video file
- [ ] Video uploads successfully
- [ ] Video message appears in chat
- [ ] Video player has controls
- [ ] Video plays correctly
- [ ] Preload metadata works

#### Test 10: Multiple File Upload
- [ ] Select multiple images/videos
- [ ] All files upload successfully
- [ ] Each file appears as separate message
- [ ] Upload indicator shows during process

---

### ✅ Typing Indicator Tests

#### Test 11: Typing Indicator Display
- [ ] Other user starts typing
- [ ] Typing indicator appears below messages
- [ ] Shows "Username is typing"
- [ ] Animated dots display
- [ ] Indicator disappears when typing stops
- [ ] Indicator disappears when message sent

---

### ✅ Read Receipts Tests

#### Test 12: Message Read Status
- [ ] Send a message
- [ ] Message shows single checkmark (✓)
- [ ] Other user opens chat
- [ ] Other user sees message
- [ ] Message updates to double checkmark (✓✓)
- [ ] Read status updates in real-time

---

### ✅ Scroll & Navigation Tests

#### Test 13: Auto-Scroll
- [ ] Have 10+ messages in chat
- [ ] Scroll to middle of conversation
- [ ] Receive new message
- [ ] Chat auto-scrolls to bottom
- [ ] Smooth scrolling animation

#### Test 14: Manual Scroll
- [ ] Scroll up in conversation
- [ ] "Scroll to bottom" button appears
- [ ] Click scroll button
- [ ] Chat scrolls to bottom smoothly
- [ ] Button has hover effect

#### Test 15: Scroll Position Memory
- [ ] Scroll to specific position
- [ ] Receive new message
- [ ] If scrolled near bottom: auto-scroll
- [ ] If scrolled far up: don't auto-scroll
- [ ] Manual button available

---

### ✅ Real-time Updates Tests

#### Test 16: Real-time Message Delivery
- [ ] Open chat in two browsers
- [ ] Send message from Browser 1
- [ ] Message appears in Browser 2 instantly
- [ ] No page refresh required
- [ ] Message order maintained
- [ ] Timestamps accurate

#### Test 17: Real-time Status Updates
- [ ] Send message from Browser 1
- [ ] Mark as read in Browser 2
- [ ] Read receipt updates in Browser 1
- [ ] No delay in status change

---

### ✅ URL Linkification Tests

#### Test 18: Link Detection
- [ ] Type message with URL: "Visit https://google.com"
- [ ] Send message
- [ ] URL appears as clickable link
- [ ] Link opens in new tab
- [ ] Link has proper styling
- [ ] Link works with http and https

#### Test 19: Multiple Links
- [ ] Send message with multiple URLs
- [ ] All URLs are clickable
- [ ] Each link opens correctly
- [ ] Text between links preserved

---

### ✅ Input Interaction Tests

#### Test 20: Textarea Auto-Resize
- [ ] Type single line message
- [ ] Textarea height: 1 row
- [ ] Type long message
- [ ] Textarea expands to 2-3 rows
- [ ] Maximum height: 120px
- [ ] Scroll appears if exceeds max

#### Test 21: Keyboard Shortcuts
- [ ] Type message
- [ ] Press Enter: message sends
- [ ] Type message
- [ ] Press Shift+Enter: new line added
- [ ] New line doesn't send message
- [ ] Send button still works

#### Test 22: Input State Management
- [ ] Type message
- [ ] Send button appears (➤)
- [ ] Clear input
- [ ] Microphone button appears (🎤)
- [ ] Type again
- [ ] Send button returns
- [ ] Toggle works smoothly

---

### ✅ Error Handling Tests

#### Test 23: Failed Message Send
- [ ] Disconnect from internet
- [ ] Try to send message
- [ ] Message shows "sending" status
- [ ] Message updates to "failed" status (❌)
- [ ] Error message appears
- [ ] Message stays in chat
- [ ] Can retry sending

#### Test 24: Upload Failure
- [ ] Try uploading very large file
- [ ] Upload fails gracefully
- [ ] Error alert shows
- [ ] No partial messages created
- [ ] Can try again

#### Test 25: Network Reconnection
- [ ] Disconnect from internet
- [ ] Try operations (send, upload)
- [ ] Operations fail
- [ ] Reconnect to internet
- [ ] Real-time subscription resumes
- [ ] New messages appear

---

### ✅ UI/UX Tests

#### Test 26: Message Bubble Styling
- [ ] Sent messages: blue background, white text
- [ ] Received messages: gray background, black text
- [ ] Sent messages: aligned right
- [ ] Received messages: aligned left
- [ ] Bubble has rounded corners
- [ ] Bubble has tail effect
- [ ] Max-width: 70% on desktop
- [ ] Max-width: 85% on mobile

#### Test 27: Loading States
- [ ] Open chat: loading indicator
- [ ] Upload file: progress indicator
- [ ] Send message: sending status
- [ ] All transitions smooth
- [ ] No flickering

#### Test 28: Empty States
- [ ] Open new conversation
- [ ] "No messages yet" displays
- [ ] Centered and styled properly
- [ ] Helpful message displayed
- [ ] First message works correctly

---

### ✅ Accessibility Tests

#### Test 29: Keyboard Navigation
- [ ] Tab through all buttons
- [ ] Focus indicators visible
- [ ] Enter activates buttons
- [ ] Tab order logical
- [ ] Can send message without mouse

#### Test 30: Screen Reader Support
- [ ] All buttons have aria-labels
- [ ] Messages have proper roles
- [ ] Live regions update correctly
- [ ] Status messages announced
- [ ] Time formats screen-reader friendly

---

### ✅ Mobile Responsive Tests

#### Test 31: Mobile Layout
- [ ] Open on mobile device
- [ ] Layout adjusts properly
- [ ] Buttons sized for touch (36px)
- [ ] Text readable (16px)
- [ ] Input doesn't zoom on iOS
- [ ] Emoji picker full-width
- [ ] Scroll works smoothly

#### Test 32: Mobile Interactions
- [ ] Touch scrolling smooth
- [ ] Buttons respond to touch
- [ ] Keyboard opens properly
- [ ] Input accessible above keyboard
- [ ] Can upload from camera
- [ ] Can upload from gallery

---

### ✅ Performance Tests

#### Test 33: Many Messages
- [ ] Load chat with 100+ messages
- [ ] Scroll through messages
- [ ] Performance acceptable
- [ ] No lag or freezing
- [ ] Memory usage reasonable
- [ ] Smooth animations

#### Test 34: Large Files
- [ ] Upload large image (5MB)
- [ ] Upload completes
- [ ] Image displays properly
- [ ] No browser crash
- [ ] Upload time reasonable

---

### ✅ Edge Cases Tests

#### Test 35: Special Characters
- [ ] Send message with emojis only
- [ ] Send message with special chars (!@#$%)
- [ ] Send message with line breaks
- [ ] Send message with spaces only (should fail)
- [ ] All render correctly

#### Test 36: Long Messages
- [ ] Send very long message (1000+ chars)
- [ ] Message displays correctly
- [ ] Bubble wraps text properly
- [ ] Scroll works within bubble
- [ ] Send button still accessible

#### Test 37: Rapid Fire
- [ ] Send 10 messages quickly
- [ ] All messages appear
- [ ] Order maintained
- [ ] No duplicates
- [ ] All marked as sent

---

## Automated Test Ideas

### Unit Tests
```javascript
// Test message safety
test('handles null messages array', () => {
  render(<ChatThread messages={null} />);
  expect(screen.getByText(/No messages/i)).toBeInTheDocument();
});

// Test linkify
test('linkifies URLs in messages', () => {
  const text = 'Visit https://example.com';
  const result = linkify(text);
  expect(result).toContain('<a href=');
});

// Test formatTime
test('formats timestamps correctly', () => {
  const date = new Date();
  const formatted = formatTime(date);
  expect(formatted).toMatch(/\d{1,2}:\d{2}/);
});
```

### Integration Tests
```javascript
// Test message sending flow
test('sends message successfully', async () => {
  render(<ChatThread conversationId="123" myUserId="user1" />);
  
  const input = screen.getByPlaceholderText('Type a message...');
  const sendBtn = screen.getByRole('button', { name: /send/i });
  
  fireEvent.change(input, { target: { value: 'Hello!' } });
  fireEvent.click(sendBtn);
  
  await waitFor(() => {
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });
});
```

---

## Testing Summary

### Total Tests: 37
- Core Messaging: 3 tests
- Emoji Picker: 2 tests
- Voice Messages: 2 tests
- File Upload: 3 tests
- Typing Indicator: 1 test
- Read Receipts: 1 test
- Scroll & Navigation: 3 tests
- Real-time: 2 tests
- Linkification: 2 tests
- Input Interaction: 3 tests
- Error Handling: 3 tests
- UI/UX: 3 tests
- Accessibility: 2 tests
- Mobile: 2 tests
- Performance: 2 tests
- Edge Cases: 3 tests

---

## Test Execution

### Prerequisites
1. Two test accounts
2. Two browsers/devices
3. Test images/videos
4. Stable internet connection
5. Mobile device for responsive tests

### Execution Order
1. ✅ Core functionality (Tests 1-3)
2. ✅ Component features (Tests 4-13)
3. ✅ Real-time (Tests 14-17)
4. ✅ UI/UX (Tests 18-28)
5. ✅ Accessibility (Tests 29-30)
6. ✅ Mobile (Tests 31-32)
7. ✅ Performance (Tests 33-34)
8. ✅ Edge cases (Tests 35-37)

---

## Bug Report Template

```markdown
### Bug Report

**Test:** Test #XX - [Test Name]
**Priority:** High/Medium/Low
**Status:** Found/Fixed/Verified

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
...

**Actual Result:**
...

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: 
- OS: 
- Device: 
```

---

**Testing Status:** Ready to test  
**Coverage:** All features covered  
**Estimated Time:** 2-3 hours for full manual test suite

---

Happy Testing! 🧪✨
