# Focus App - Full Scenario Testing Guide

## Overview

This testing system validates the entire Focus app against a realistic user scenario involving two users (User A and User B) interacting with all features in real-time.

## Quick Start

### Run the Full Scenario Test

```bash
npm run test:full-scenario
```

This command will:
1. Run comprehensive Cypress tests covering all features
2. Generate detailed HTML and JSON reports
3. Identify what's implemented, missing, or partially working
4. Provide step-by-step guidance on how to add missing features

### View Results

After running the test, open the generated reports:

- **HTML Report**: `cypress/reports/full-scenario-report.html` (Open in browser)
- **JSON Report**: `cypress/reports/full-scenario-report.json` (For programmatic access)

## What Gets Tested

### 1. User Authentication & Session
- ✅ Login functionality
- ✅ Session management
- ✅ Presence updates (online/offline status)

### 2. Home Feed
- ✅ Post display
- ✅ Like functionality with real-time updates
- ✅ Comment system
- ✅ Share functionality
- ✅ Infinite scroll
- ✅ Real-time feed updates

### 3. Explore Page
- ✅ Search functionality (users, posts, hashtags)
- ✅ Filter tabs (For You, Trending, Boltz, People, Tags)
- ✅ Sort options (Most recent, Most popular)
- ✅ Follow from Explore
- ✅ Real-time search results

### 4. Content Creation
- ✅ Create Post
- ✅ Create Boltz (short video)
- ✅ Create Flash Story
- ✅ Media upload and preview
- ✅ Captions, tags, mentions
- ✅ Scheduling options
- ✅ Real-time content publishing

### 5. Boltz (Short Videos)
- ✅ Vertical video feed
- ✅ Swipe navigation
- ✅ Like/comment interactions
- ✅ View counter
- ✅ Real-time updates

### 6. Profile
- ✅ Profile display
- ✅ Posts, Boltz, Stories tabs
- ✅ Edit profile
- ✅ Avatar upload
- ✅ Follower/following counts
- ✅ Real-time count updates

### 7. Settings
- ✅ Privacy settings
- ✅ Notification preferences
- ✅ Password change
- ✅ Account management
- ✅ Real-time sync

### 8. Notifications
- ✅ Notification display
- ✅ Real-time badge updates
- ✅ Sound/popup alerts
- ✅ Mark as read
- ✅ Action buttons (approve/reject)

### 9. Follow System
- ✅ Follow/unfollow button
- ✅ Follow requests (for private accounts)
- ✅ Accept/reject requests
- ✅ Real-time follow updates
- ✅ Follower list updates

### 10. Direct Messaging
- ✅ Messages page
- ✅ One-on-one chat
- ✅ Group chat
- ✅ Text messages
- ✅ Media sharing
- ✅ Emojis and reactions
- ✅ Typing indicator
- ✅ Read receipts
- ✅ Real-time message delivery

### 11. Audio/Video Calls
- ✅ Call button
- ✅ Incoming call notification
- ✅ Audio call
- ✅ Video call
- ✅ Call controls (mute, video toggle)
- ✅ End call
- ✅ WebRTC connection

### 12. Real-time Features
- ✅ Live feed updates
- ✅ Live notifications
- ✅ Live message delivery
- ✅ Live presence updates
- ✅ Live interaction counts

## Test Report Structure

### Summary Section
- Total features tested
- Implemented features count
- Missing features count
- Partial features count
- Implementation rate percentage

### Feature Status
Each feature shows:
- **Status**: Implemented ✅ | Missing ❌ | Partial ⚠️
- **Details**: What was found during testing
- **How to Add**: Step-by-step implementation guide

### Recommendations
Prioritized list of actions:
- **High Priority**: Required features that are missing
- **Medium Priority**: Partial features that need fixes
- **Low Priority**: Optional enhancements

## Understanding Test Results

### Status Indicators

#### ✅ Implemented (Green)
Feature is fully functional and passes all tests.

#### ❌ Missing (Red)
Feature is not implemented or test element not found.
- Check the "How to Add" section for implementation guidance
- Verify data-testid attributes are present

#### ⚠️ Partial (Yellow)
Feature exists but has issues or incomplete functionality.
- Review error details in the report
- Check console logs and network requests
- Debug existing implementation

## Adding Missing Features

### Step 1: Check the Report
Open `cypress/reports/full-scenario-report.html` and find the missing feature.

### Step 2: Read "How to Add"
Each missing feature includes specific implementation guidance:
- File locations
- Required data-testid attributes
- Implementation approach
- Related components

### Step 3: Implement
Follow the guidance to add the feature:

Example for adding a like button:
```jsx
// In src/components/PostCard.js
<button 
  data-testid="like-button"
  onClick={handleLike}
  className="like-btn"
>
  <Heart /> {likeCount}
</button>
```

### Step 4: Re-run Tests
```bash
npm run test:full-scenario
```

## Common Issues & Solutions

### Issue: Test elements not found
**Solution**: Add data-testid attributes to your components
```jsx
<div data-testid="post-item">
  <button data-testid="like-button">Like</button>
  <button data-testid="comment-button">Comment</button>
</div>
```

### Issue: Real-time updates not working
**Solution**: Subscribe to Supabase realtime changes
```javascript
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'posts' },
    handlePostChange
  )
  .subscribe();
```

### Issue: Authentication failing
**Solution**: Check Supabase credentials and session management
```javascript
// Verify in src/supabaseClient.js
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

## Advanced Testing

### Run Specific Test Suites
```bash
# Run only authentication tests
npx cypress run --spec "cypress/e2e/auth.cy.js"

# Run only messaging tests
npx cypress run --spec "cypress/e2e/messaging.cy.js"
```

### Debug Mode
```bash
# Open Cypress UI for debugging
npm run cypress:open
```

### Headless Mode
```bash
# Run tests without UI (CI/CD)
npm run cypress:run
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Full Scenario Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:full-scenario
      - uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: cypress/reports/
```

## Test Data Management

### Setup Test Users
Create test users in your Supabase database:

```sql
-- User A
INSERT INTO auth.users (email, encrypted_password)
VALUES ('usera@test.com', crypt('TestPass123!', gen_salt('bf')));

-- User B
INSERT INTO auth.users (email, encrypted_password)
VALUES ('userb@test.com', crypt('TestPass123!', gen_salt('bf')));
```

### Cleanup Test Data
```bash
# Add cleanup script
node scripts/cleanup-test-data.js
```

## Best Practices

1. **Run tests before commits**
   ```bash
   git add .
   npm run test:full-scenario
   git commit -m "Feature: Added X"
   ```

2. **Keep data-testid consistent**
   - Use kebab-case: `data-testid="like-button"`
   - Be descriptive: `data-testid="post-like-button"`
   - Avoid generic names: ❌ `data-testid="button1"`

3. **Test real-time features**
   - Verify Supabase subscriptions
   - Check WebSocket connections
   - Test with multiple browser tabs

4. **Monitor performance**
   - Check test execution time
   - Optimize slow tests
   - Use proper waits and timeouts

## Troubleshooting

### Tests timing out
Increase timeout in `cypress.config.js`:
```javascript
defaultCommandTimeout: 10000,
requestTimeout: 15000,
```

### Flaky tests
Add proper waits:
```javascript
cy.get('[data-testid="post-item"]', { timeout: 10000 })
  .should('exist');
```

### Database connection issues
Verify Supabase credentials:
```bash
npm run test:backend
```

## Support

- **Documentation**: Check `/docs` folder
- **Issues**: Report on GitHub Issues
- **Community**: Join Discord server

## Next Steps

1. Run the full scenario test
2. Review the generated report
3. Implement missing features
4. Re-run tests to verify
5. Achieve 100% implementation rate!

---

**Made with ❤️ by the Focus Team**
