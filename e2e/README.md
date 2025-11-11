# End-to-End Tests

This directory contains E2E tests for the Focus social media application using Playwright.

## Test Structure

- `auth.spec.js` - Authentication and signup flow tests
- `post-creation.spec.js` - Post creation and media upload tests
- `feed-interactions.spec.js` - Home feed, likes, comments, and interactions
- `messaging.spec.js` - Direct messaging and group chat tests
- `navigation.spec.js` - Navigation, routing, and protected routes
- `accessibility.spec.js` - Accessibility, keyboard navigation, and ARIA tests
- `performance.spec.js` - Performance metrics, memory usage, and network tests

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests on specific browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Run mobile tests only
```bash
npm run test:e2e:mobile
```

### View test report
```bash
npm run test:e2e:report
```

## Test Configuration

Tests are configured in `playwright.config.js` at the root of the project.

### Key Configuration Options:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Captured on first retry

## Writing Tests

### Best Practices

1. **Use semantic selectors**: Prefer text content, ARIA labels, and test IDs over CSS classes
2. **Wait for elements**: Use `waitForTimeout` or `waitForSelector` appropriately
3. **Handle async operations**: Always await page interactions
4. **Test user journeys**: Focus on complete user flows, not isolated actions
5. **Make tests resilient**: Handle both logged-in and logged-out states
6. **Use descriptive test names**: Clearly describe what is being tested

### Example Test

```javascript
test('should complete user signup flow', async ({ page }) => {
  await page.goto('/auth');
  await page.click('text=Sign Up');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button:has-text("Sign Up")');
  
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
});
```

## Test Data

Tests use dynamically generated test data to avoid conflicts:

```javascript
const timestamp = Date.now();
const testEmail = `e2etest${timestamp}@example.com`;
const testUsername = `e2euser${timestamp}`;
```

## Debugging Tests

### Debug a specific test
```bash
npx playwright test auth.spec.js --debug
```

### Run a specific test by name
```bash
npx playwright test -g "should complete user signup flow"
```

### View trace for failed test
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries (2 attempts)
- Single worker for stability
- HTML report generation
- Screenshot and video capture on failure

## Requirements

- Node.js 16+
- Playwright browsers installed (run `npx playwright install`)
- Application running on `http://localhost:3000`

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connectivity

### Flaky tests
- Add appropriate waits: `await page.waitForTimeout(2000)`
- Use `waitForLoadState('networkidle')`
- Check for race conditions

### Browser not launching
- Run `npx playwright install` to install browsers
- Check system requirements
- Try running with `--headed` flag to see errors

## Coverage

E2E tests cover:
- ✅ Authentication flows (login, signup, password reset)
- ✅ Post creation and media upload
- ✅ Feed interactions (like, comment, save, share)
- ✅ Direct messaging and group chats
- ✅ Navigation and routing
- ✅ Accessibility (keyboard, ARIA, screen readers)
- ✅ Performance metrics
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Implement API mocking for isolated tests
- [ ] Add load testing scenarios
- [ ] Create test fixtures for common scenarios
- [ ] Add screenshot comparison tests
- [ ] Implement parallel test execution
