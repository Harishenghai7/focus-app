const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Log In")')).toBeVisible();
  });

  test('should switch to signup form', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page.locator('h2')).toContainText('Create Account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Log In")');
    
    // Wait for error message
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for weak password on signup', async ({ page }) => {
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    
    // Check for password strength indicator
    await expect(page.locator('text=/password.*weak/i, text=/at least.*8.*characters/i')).toBeVisible({ timeout: 3000 });
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Log In")');
    
    // Wait for error message
    await expect(page.locator('text=/invalid.*credentials/i, text=/error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to forgot password', async ({ page }) => {
    const forgotPasswordLink = page.locator('text=/forgot.*password/i');
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page.locator('text=/reset.*password/i')).toBeVisible();
    }
  });
});

test.describe('Complete Signup Flow', () => {
  test('should complete full signup and onboarding flow', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2etest${timestamp}@example.com`;
    const testPassword = 'TestPass123!';
    const testUsername = `e2euser${timestamp}`;
    
    // Navigate to auth page
    await page.goto('/auth');
    
    // Switch to signup
    await page.click('text=Sign Up');
    
    // Fill signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Sign Up")');
    
    // Wait for either onboarding or email verification message
    await page.waitForTimeout(3000);
    
    // Check if we're on onboarding page or if email verification is required
    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      // Fill onboarding form
      await page.fill('input[name="username"]', testUsername);
      await page.fill('input[name="full_name"]', 'E2E Test User');
      
      // Submit onboarding
      const completeButton = page.locator('button:has-text("Complete"), button:has-text("Continue"), button:has-text("Next")');
      await completeButton.first().click();
      
      // Should redirect to home feed
      await expect(page).toHaveURL(/\/(home|feed)/, { timeout: 10000 });
    } else {
      // Email verification required - check for verification message
      await expect(page.locator('text=/verify.*email/i, text=/check.*email/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
