# Prioritized Fix Plan for 505 Issues

## Strategy

Given the massive scope (505 issues), I will prioritize by:
1. **CRITICAL** - Security, permission, data loss issues
2. **HIGH** - Core functionality, user experience
3. **MEDIUM** - Features, polish
4. **LOW** - Nice-to-have, future enhancements

---

## CRITICAL ISSUES (Must Fix Immediately)

### Security & Permission Issues (20 issues)
- [ ] #18: Blocked/banned user can't log in
- [ ] #39: Blocked user profile display
- [ ] #52: Block/unblock user
- [ ] #90: Blocked/muted in search
- [ ] #206: Blocked/muted in stories
- [ ] #210: Blocked sees no story
- [ ] #241: Block user in DM
- [ ] #242: Block group DM
- [ ] #270: Blocked call fail
- [ ] #295: Blocked user disables notifications
- [ ] #303: Block user setting
- [ ] #351-365: RLS policies (15 issues)

### Data Loss & State Issues (15 issues)
- [ ] #387: Offline post queue
- [ ] #446: Race condition on save/unsave
- [ ] #461: Unread count desync
- [ ] #462: Typing indicator ghost
- [ ] #463: Read/delivered desync
- [ ] #464: Like/notification race
- [ ] #469: DM deletion not syncing
- [ ] #471: Cache vs live data mismatch
- [ ] #472: Server v client timestamp error
- [ ] #474: Memory leak in real-time listener
- [ ] #480: Stuck in loading state
- [ ] #482: Delete request locked/fails
- [ ] #490: Unsend/recall DM fails
- [ ] #496: Unsaved draft lost on reload
- [ ] #501: Infinite scroll edge overfetch

### Error Handling Issues (10 issues)
- [ ] #440: API limits reached error
- [ ] #441: Cloud function errors
- [ ] #442: Scheduled post fails
- [ ] #443: Real-time notification not firing
- [ ] #444: Feed not refreshing on post
- [ ] #445: Feed jump on new data
- [ ] #459: Image upload timeout
- [ ] #460: Retry on failed request
- [ ] #481: Unhandled background exception
- [ ] #488: Scheduled story fails

---

## HIGH PRIORITY ISSUES (Fix Next)

### Missing Core Features (30 issues)
- [ ] #9: Account lockout
- [ ] #12: Concurrent device sessions
- [ ] #14: Terms acceptance
- [ ] #15: Delete account
- [ ] #16: Edit account email
- [ ] #18: Banned user login check
- [ ] #19: GDPR data download
- [ ] #21: Reserved username check
- [ ] #33: Legal/privacy links
- [ ] #34: Invalid invite error
- [ ] #35: Prohibited word check
- [ ] #38: Profile page for logged-out users
- [ ] #51: Suspended user profile block
- [ ] #54: Verified badge display
- [ ] #55: Ghost/account-deleted placeholder
- [ ] #61: Restrict user on profile
- [ ] #75: Ads/sponsored content
- [ ] #136: Multiple post delete at once
- [ ] #190: AR filter
- [ ] #305: Data export/GDPR
- [ ] #327: Account link to business/brand
- [ ] #335-336: Ban/unban user
- [ ] #346: User appeal process
- [ ] #350: Shadowban
- [ ] #377: SSR for critical pages
- [ ] #405: Colorblind themes
- [ ] #417: Auto-translate setting
- [ ] #422: Referral bonuses
- [ ] #428: Campaign/ads manager
- [ ] #504: Cross-domain SSO fail

### Partial Implementations to Complete (40 issues)
- [ ] #4: Apple OAuth (iOS testing)
- [ ] #6: 2FA backup codes
- [ ] #10: Session expiration warning
- [ ] #32: Account recovery email
- [ ] #40: Mutual follows display
- [ ] #42: Pronouns field
- [ ] #53: Profile QR sharing
- [ ] #59: Grid/list switch
- [ ] #63: Offline profile changes
- [ ] #69: Filter by posts/boltz
- [ ] #72: Offline feed support
- [ ] #76: Hide user from feed
- [ ] #77: Post view count
- [ ] #85: Search result ranking
- [ ] #88: Multi-language search
- [ ] #91: Private posts in search
- [ ] #92: Typo-tolerant search
- [ ] #99: Search DMs by message
- [ ] #115: Scheduling posts
- [ ] #119: Schedule time check
- [ ] #120-121: Share post to DMs/story
- [ ] #125: Min/max video duration
- [ ] #129: Transcoding fail fallback
- [ ] #131: Pin post to profile
- [ ] #133: Duplicate post upload check
- [ ] #141: Inappropriate word filter
- [ ] #142: Spellcheck/autofix
- [ ] #149: Share collection
- [ ] #159-160: Pin/unpin comment
- [ ] #165: Share comment
- [ ] #181: Highlight user comment
- [ ] #182: Keyboard navigation comments
- [ ] #183: Rate limit on comments
- [ ] #186: Like/comment ghost state
- [ ] #189: Sticker/text/music in story
- [ ] #192: Countdown story
- [ ] #199: Story mention/tag
- [ ] #216: Story link preview
- [ ] #225: Story keyboard navigation
- [ ] #255: Rate limit on DMs
- [ ] #258-259: GIF/sticker pickers

---

## MEDIUM PRIORITY ISSUES (Fix After High)

### UI/UX Improvements (30 issues)
- [ ] #40: Mutual follows display
- [ ] #59: Grid/list switch
- [ ] #69: Filter by posts/boltz
- [ ] #76: Hide user from feed
- [ ] #77: Post view count
- [ ] #85: Search result ranking
- [ ] #131: Pin post to profile
- [ ] #159-160: Pin/unpin comment
- [ ] #165: Share comment
- [ ] #181: Highlight user comment
- [ ] #182: Keyboard navigation
- [ ] #289: Swipe to archive
- [ ] #302: Allow comments toggle
- [ ] #309: Change language
- [ ] #314: In-app support/contact
- [ ] #315: Report a bug
- [ ] #321: Toggle seen/read status
- [ ] #323: Toggle DMs allowed
- [ ] #324: Hide followers/following
- [ ] #329: Feedback submission
- [ ] #330: Remove consent
- [ ] #331: Deactivate/reactivate
- [ ] #332: Restricted mode
- [ ] #394: Invite for new device
- [ ] #395: Session takeover alert
- [ ] #396: Suspicious login block
- [ ] #405: Colorblind themes
- [ ] #407: RTL language support
- [ ] #413: LTR/RTL switch
- [ ] #431: Rate app prompt

### Accessibility Issues (25 issues)
- [ ] #397: Keyboard navigation everywhere
- [ ] #398: Screen reader support
- [ ] #399: Contrast warnings
- [ ] #400: Alt text for all images
- [ ] #401: Focus trap for modals
- [ ] #402: Tabindex on all controls
- [ ] #403: Touch targets >44px
- [ ] #404: Dynamic font scaling
- [ ] #405: Colorblind themes
- [ ] #406: ARIA role validation
- [ ] #407: RTL language support
- [ ] #408: Multi-lingual captions
- [ ] #415: Emoji/language/time format
- [ ] #416: Timezone conversion
- [ ] #417: Auto-translate setting
- [ ] #418: Notification translation
- [ ] #419: Multi-currency formats
- [ ] #475: Emoji selector keyboard
- [ ] #499: Accessibility live region bug
- [ ] #500: Mobile/desktop/PWA layout
- [ ] #182: Keyboard navigation comments
- [ ] #225: Story keyboard navigation
- [ ] #397-419: Full accessibility suite

### Performance Issues (20 issues)
- [ ] #368: Slow query logging
- [ ] #374: Mobile low memory mode
- [ ] #375: Bundlesize performance guard
- [ ] #376: Compress/lazy-load images
- [ ] #377: SSR for critical pages
- [ ] #378: CDN enablement
- [ ] #379: Test cache invalidation
- [ ] #380: Test data consistency
- [ ] #387: Offline post queue
- [ ] #388: Offline notification fallback
- [ ] #392: Cache+network fallback
- [ ] #393: Background sync
- [ ] #501: Infinite scroll edge overfetch
- [ ] #502: Suspicious pattern lockout
- [ ] #503: Recovery email not sent
- [ ] #504: Cross-domain SSO fail
- [ ] #505: Email/phone conflict

---

## LOW PRIORITY ISSUES (Future Enhancements)

### Growth & Engagement (20 issues)
- [ ] #420: Invite via link/QR
- [ ] #421: Share to WhatsApp/SMS
- [ ] #422: Referral bonuses
- [ ] #423: Achievement badges
- [ ] #424: Streaks (story/post)
- [ ] #425: Explore challenges/trends
- [ ] #426: Best time to post analytics
- [ ] #427: Recent visitors profile
- [ ] #428: Campaign/ads manager
- [ ] #430: Unread/badge nudge
- [ ] #431: Rate app prompt
- [ ] #434: Product tour
- [ ] #435: Feature announcement
- [ ] #438: Reaction analytics
- [ ] #439: Saved/export stats

### Advanced Features (15 issues)
- [ ] #190: AR filter
- [ ] #258: Send GIF
- [ ] #259: Send sticker
- [ ] #265: Group call
- [ ] #271: Call reconnect on weak network
- [ ] #282: Save/unsave notification
- [ ] #283: Pin notification
- [ ] #326: Tax/legal/accountation
- [ ] #343: Bulk content moderation
- [ ] #344: DM/warning from admin
- [ ] #345: Content takedown notification
- [ ] #347: Automated spam filter
- [ ] #348: Rate limited user management
- [ ] #349: Suspicious activity alert
- [ ] #350: Shadowban

---

## Implementation Order

### Phase 1: Critical Security & Data (Week 1)
1. Fix all permission/blocking issues
2. Fix all data loss/state issues
3. Fix all error handling issues
4. Add comprehensive tests

### Phase 2: High Priority Features (Week 2-3)
1. Implement missing core features
2. Complete partial implementations
3. Add tests for each feature

### Phase 3: Medium Priority (Week 4-5)
1. UI/UX improvements
2. Accessibility fixes
3. Performance optimizations

### Phase 4: Low Priority (Week 6+)
1. Growth & engagement features
2. Advanced features
3. Polish and refinement

---

## Estimated Effort

- **Critical Issues**: 45 issues × 2-4 hours = 90-180 hours
- **High Priority**: 70 issues × 1-3 hours = 70-210 hours
- **Medium Priority**: 75 issues × 0.5-2 hours = 37.5-150 hours
- **Low Priority**: 35 issues × 0.5-1 hour = 17.5-35 hours

**Total**: 215-575 hours (5-14 weeks at 40 hours/week)

---

## Success Criteria

- [ ] All critical issues fixed
- [ ] All high priority issues fixed
- [ ] 80%+ test coverage
- [ ] Zero security vulnerabilities
- [ ] Zero data loss issues
- [ ] All RLS policies enforced
- [ ] Full accessibility compliance
- [ ] Performance benchmarks met

