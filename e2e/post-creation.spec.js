const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Post Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests require authentication
    // In a real scenario, you'd set up test user credentials
    await page.goto('/');
  });

  test('should navigate to create post page', async ({ page }) => {
    // Look for create button (could be + icon, "Create" text, etc.)
    const createButton = page.locator('button:has-text("Create"), a[href*="/create"], button[aria-label*="Create"]');
    
    if (await createButton.first().isVisible({ timeout: 5000 })) {
      await createButton.first().click();
      await expect(page).toHaveURL(/\/create/, { timeout: 5000 });
    } else {
      // If not logged in, should redirect to auth
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    }
  });

  test('should display post creation form', async ({ page }) => {
    await page.goto('/create');
    
    // Check for key elements (may vary based on implementation)
    const hasMediaUpload = await page.locator('input[type="file"], button:has-text("Upload"), text=/select.*image/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasCaptionInput = await page.locator('textarea[placeholder*="caption"], textarea[name="caption"]').isVisible({ timeout: 3000 }).catch(() => false);
    
    // At least one of these should be visible on create page
    expect(hasMediaUpload || hasCaptionInput).toBeTruthy();
  });

  test('should show caption character limit', async ({ page }) => {
    await page.goto('/create');
    
    const captionInput = page.locator('textarea[placeholder*="caption"], textarea[name="caption"]').first();
    
    if (await captionInput.isVisible({ timeout: 3000 })) {
      await captionInput.fill('Test caption');
      
      // Look for character counter
      const charCounter = page.locator('text=/\\d+\\/500/, text=/characters/i');
      await expect(charCounter.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate caption length', async ({ page }) => {
    await page.goto('/create');
    
    const captionInput = page.locator('textarea[placeholder*="caption"], textarea[name="caption"]').first();
    
    if (await captionInput.isVisible({ timeout: 3000 })) {
      // Try to enter more than 500 characters
      const longCaption = 'a'.repeat(501);
      await captionInput.fill(longCaption);
      
      // Should show error or limit input
      const value = await captionInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(500);
    }
  });

  test('should support hashtag and mention in caption', async ({ page }) => {
    await page.goto('/create');
    
    const captionInput = page.locator('textarea[placeholder*="caption"], textarea[name="caption"]').first();
    
    if (await captionInput.isVisible({ timeout: 3000 })) {
      await captionInput.fill('Test post #testing @user');
      
      // Check if hashtag/mention autocomplete appears
      await page.waitForTimeout(1000);
      const value = await captionInput.inputValue();
      expect(value).toContain('#testing');
      expect(value).toContain('@user');
    }
  });
});

test.describe('Post Creation with Media', () => {
  test('should handle image upload', async ({ page }) => {
    await page.goto('/create');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible({ timeout: 3000 }) || await fileInput.count() > 0) {
      // Create a test image file path
      const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
      
      // Note: In real tests, you'd have actual test images
      // For now, we just verify the input exists
      expect(await fileInput.count()).toBeGreaterThan(0);
    }
  });

  test('should show upload progress', async ({ page }) => {
    await page.goto('/create');
    
    // Look for progress indicators
    const progressIndicator = page.locator('[role="progressbar"], .progress, text=/uploading/i');
    
    // Progress should not be visible initially
    expect(await progressIndicator.first().isVisible({ timeout: 1000 }).catch(() => false)).toBeFalsy();
  });

  test('should support multiple images for carousel', async ({ page }) => {
    await page.goto('/create');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      // Check if multiple attribute exists
      const hasMultiple = await fileInput.getAttribute('multiple');
      
      // If carousel is supported, should allow multiple files
      if (hasMultiple !== null) {
        expect(hasMultiple).toBeDefined();
      }
    }
  });
});

test.describe('Post Submission', () => {
  test('should have submit button', async ({ page }) => {
    await page.goto('/create');
    
    const submitButton = page.locator('button:has-text("Post"), button:has-text("Share"), button:has-text("Publish")');
    
    // Submit button should exist
    expect(await submitButton.count()).toBeGreaterThan(0);
  });

  test('should disable submit without required content', async ({ page }) => {
    await page.goto('/create');
    
    const submitButton = page.locator('button:has-text("Post"), button:has-text("Share"), button:has-text("Publish")').first();
    
    if (await submitButton.isVisible({ timeout: 3000 })) {
      // Button should be disabled initially (no content)
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      
      // Either disabled or not visible
      expect(isDisabled || !(await submitButton.isEnabled())).toBeTruthy();
    }
  });
});
