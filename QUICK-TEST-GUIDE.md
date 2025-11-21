# 🚀 Quick Test Guide - Focus App

## One Command to Test Everything

```bash
npm run test:full-scenario
```

## What Happens

1. ✅ Runs 60+ automated tests
2. ✅ Tests User A and User B interactions
3. ✅ Validates all real-time features
4. ✅ Generates HTML + JSON reports
5. ✅ Shows what's working and what's missing
6. ✅ Provides step-by-step fix instructions

## View Results

```bash
# Open in browser
cypress/reports/full-scenario-report.html
```

## Report Shows

- 📊 **Implementation Rate**: X% complete
- ✅ **Green**: Feature works perfectly
- ❌ **Red**: Feature missing (with how-to-add guide)
- ⚠️ **Yellow**: Feature has issues (with fix instructions)

## Quick Fixes

### Missing Test IDs?
Add to your components:
```jsx
<button data-testid="like-button">Like</button>
<input data-testid="message-input" />
<div data-testid="post-item">...</div>
```

### Real-time Not Working?
Add Supabase subscriptions:
```javascript
supabase
  .channel('posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handleChange)
  .subscribe();
```

## Common Test IDs Needed

```jsx
// Authentication
data-testid="email-input"
data-testid="password-input"
data-testid="login-button"

// Home Feed
data-testid="post-item"
data-testid="like-button"
data-testid="comment-button"
data-testid="like-count"
data-testid="comment-input"
data-testid="submit-comment"

// Explore
data-testid="search-bar"
data-testid="search-results"
data-testid="explore-tab"

// Create
data-testid="content-type-selector"
data-testid="content-type-post"
data-testid="content-type-boltz"
data-testid="caption-input"
data-testid="submit-post"
data-testid="media-selector"

// Profile
data-testid="profile-header"
data-testid="followers-count"
data-testid="following-count"
data-testid="edit-profile-button"

// Messages
data-testid="messages-container"
data-testid="message-input"
data-testid="send-message-button"
data-testid="typing-indicator"

// Calls
data-testid="call-button"
data-testid="video-toggle"
data-testid="end-call-button"
data-testid="call-modal"

// Notifications
data-testid="notifications-container"
data-testid="notification-badge"

// Settings
data-testid="settings-container"
data-testid="logout-button"
```

## Test Scenarios Covered

1. ✅ User A logs in
2. ✅ User A likes/comments on posts
3. ✅ User A searches in Explore
4. ✅ User A creates content
5. ✅ User A views Boltz
6. ✅ User A checks profile
7. ✅ User A changes settings
8. ✅ User B sends follow request
9. ✅ User A accepts request
10. ✅ Users exchange messages
11. ✅ Users make video call
12. ✅ All real-time updates work

## Troubleshooting

### Tests Fail?
1. Check if app is running: `npm start`
2. Verify Supabase credentials in `.env`
3. Create test users in Supabase
4. Add missing data-testid attributes

### Timeout Errors?
Increase timeout in `cypress.config.js`:
```javascript
defaultCommandTimeout: 10000
```

### Can't Find Elements?
Check browser console and add data-testid:
```jsx
<YourComponent data-testid="your-component" />
```

## Success Metrics

- 🎯 **Target**: 100% implementation rate
- ✅ **Good**: 80%+ implementation rate
- ⚠️ **Needs Work**: <80% implementation rate

## Re-run After Fixes

```bash
npm run test:full-scenario
```

Watch your implementation rate increase! 📈

## Other Useful Commands

```bash
# Open Cypress UI for debugging
npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.js"

# Run all Cypress tests
npm run cypress:run
```

## Need Help?

1. Check `README-TESTING.md` for detailed guide
2. Check `TESTING-SYSTEM-COMPLETE.md` for system overview
3. Review generated report for specific instructions
4. Check Cypress screenshots in `cypress/screenshots/`

---

**That's it! Run the test and make your app 100% complete! 🎉**
