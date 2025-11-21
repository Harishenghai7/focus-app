# 🚀 Manual Testing Quick Start Guide

## 📋 What You Need

### Before You Start
- [ ] App running locally (`npm start`)
- [ ] Multiple test accounts created
- [ ] Test devices available
- [ ] Screen recording tool ready
- [ ] Bug tracking document open
- [ ] Test results document open

### Test Accounts Needed
Create at least 3 test accounts:
1. **Primary Tester** - Your main testing account
2. **Secondary User** - For testing interactions (follows, messages, etc.)
3. **Private Account** - For testing privacy features

## 🎯 Priority Testing Order

### Phase 1: Critical Path (30 minutes)
Test the most important user journey first:

1. **Signup & Onboarding** (5 min)
   - Create new account
   - Complete onboarding
   - Verify profile created

2. **Create First Post** (5 min)
   - Upload image
   - Add caption
   - Share post
   - Verify appears in feed

3. **Basic Interactions** (10 min)
   - Like a post
   - Comment on post
   - Follow another user
   - Verify real-time updates

4. **Messaging** (10 min)
   - Send direct message
   - Verify real-time delivery
   - Send media message
   - Test typing indicator

### Phase 2: Core Features (1-2 hours)
- Post creation (single & carousel)
- Boltz videos
- Flash stories
- Search & explore
- Notifications
- Profile management

### Phase 3: Advanced Features (2-3 hours)
- Group messaging
- Audio/video calls
- Story highlights
- Saved collections
- Settings & privacy
- Account management

### Phase 4: Non-Functional (1-2 hours)
- Accessibility
- Performance
- Security
- Cross-browser
- Responsive design
- PWA features

## 🐛 When You Find a Bug

### Immediate Actions
1. **Stop and document** - Don't continue testing that feature
2. **Take screenshot/video** - Visual proof is crucial
3. **Check console** - Open DevTools and copy errors
4. **Try to reproduce** - Can you make it happen again?

### Bug Severity Guide

**Critical** 🔴
- App crashes
- Cannot login
- Cannot create content
- Data loss
- Security vulnerability

**High** 🟠
- Feature completely broken
- Major functionality impaired
- Affects many users
- No workaround available

**Medium** 🟡
- Feature partially broken
- Workaround available
- Affects some users
- UI issues

**Low** 🟢
- Minor visual issues
- Typos
- Nice-to-have features
- Edge cases

### Quick Bug Report
```
Bug #[X] - [Title]
Severity: [Critical/High/Medium/Low]
Device: [Device info]
Steps:
1. [Step 1]
2. [Step 2]
Expected: [What should happen]
Actual: [What happened]
Screenshot: [Attach]
```

## 📱 Device Testing Tips

### Desktop Testing
- Test at different zoom levels (100%, 125%, 150%)
- Test with browser DevTools open (responsive mode)
- Test with different window sizes
- Clear cache between tests

### Mobile Testing
- Test in portrait and landscape
- Test with different font sizes (accessibility settings)
- Test with slow network (DevTools throttling)
- Test with notifications enabled/disabled

### Browser-Specific
- **Chrome**: Check for console warnings
- **Safari**: Test webkit-specific features
- **Firefox**: Test privacy features
- **Edge**: Test Windows integration

## ⚡ Quick Commands

### Start Testing
```bash
# Start the app
npm start

# Open in browser
http://localhost:3000

# Open DevTools
F12 (Windows) or Cmd+Option+I (Mac)
```

### Check Performance
```bash
# Run Lighthouse audit
1. Open DevTools
2. Go to Lighthouse tab
3. Click "Generate report"
4. Check scores
```

### Test Offline Mode
```bash
# In DevTools:
1. Go to Network tab
2. Change "Online" to "Offline"
3. Test app functionality
4. Change back to "Online"
```

## ✅ Quick Checklist

### Before Each Test Session
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Open bug tracker
- [ ] Open test results doc
- [ ] Start screen recording (optional)
- [ ] Note start time

### After Each Test Session
- [ ] Update test results
- [ ] Document all bugs found
- [ ] Save screenshots/videos
- [ ] Note completion time
- [ ] Plan next session

### End of Day
- [ ] Review all bugs found
- [ ] Prioritize bugs
- [ ] Update summary statistics
- [ ] Communicate critical issues
- [ ] Plan tomorrow's testing

## 🎯 Testing Mindset

### Think Like a User
- What would confuse a new user?
- What would frustrate an experienced user?
- What would break the user's trust?

### Think Like an Attacker
- Can I access data I shouldn't?
- Can I break the app with bad input?
- Can I bypass security measures?

### Think Like a Tester
- What edge cases exist?
- What happens under load?
- What happens offline?
- What happens with slow network?

## 📊 Progress Tracking

### Daily Goals
- Day 1: Critical path + Core features
- Day 2: Advanced features + Non-functional
- Day 3: Bug fixes verification + Regression testing
- Day 4: Final verification + Sign-off

### Success Criteria
- [ ] All critical features work
- [ ] No critical bugs
- [ ] < 5 high priority bugs
- [ ] Performance meets targets
- [ ] Accessibility standards met
- [ ] Works on all required devices

## 🆘 Need Help?

### Common Issues

**App won't start**
- Check if port 3000 is available
- Run `npm install` again
- Check for console errors

**Can't login**
- Verify Supabase connection
- Check environment variables
- Clear browser cache

**Features not working**
- Check browser console for errors
- Verify database schema
- Check RLS policies

**Real-time not working**
- Verify Supabase realtime enabled
- Check WebSocket connection
- Check subscription code

## 📚 Reference Documents

- **Full Testing Guide**: `MANUAL-TESTING-GUIDE.md`
- **Test Results**: `MANUAL-TEST-RESULTS.md`
- **Bug Tracker**: `BUG-TRACKER.md`
- **Testing Checklist**: `TESTING-CHECKLIST.md`
- **Requirements**: `.kiro/specs/focus-production-readiness/requirements.md`
- **Design**: `.kiro/specs/focus-production-readiness/design.md`

---

**Remember:** Quality over speed. It's better to test thoroughly than to rush through tests!

**Good luck! 🚀**
