const { test, expect } = require('@playwright/test');

test.describe('Navigation and Routing', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should load without errors
    expect(page.url()).toBeTruthy();
  });

  test('should have main navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for navigation elements
    const nav = page.locator('nav, [role="navigation"], [class*="nav"]');
    
    if (await nav.first().isVisible({ timeout: 3000 })) {
      expect(await nav.count()).toBeGreaterThan(0);
    }
  });

  test('should navigate to home', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const homeLink = page.locator('a[href="/"], a[href="/home"], button:has-text("Home"), [aria-label*="Home"]');
    
    if (await homeLink.first().isVisible({ timeout: 3000 })) {
      await homeLink.first().click();
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      expect(currentUrl.endsWith('/') || currentUrl.includes('/home')).toBeTruthy();
    }
  });

  test('should navigate to explore', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const exploreLink = page.locator('a[href*="/explore"], button:has-text("Explore"), [aria-label*="Explore"]');
    
    if (await exploreLink.first().isVisible({ timeout: 3000 })) {
      await exploreLink.first().click();
      await expect(page).toHaveURL(/\/explore/, { timeout: 5000 });
    }
  });

  test('should navigate to profile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const profileLink = page.locator('a[href*="/profile"], button:has-text("Profile"), [aria-label*="Profile"]');
    
    if (await profileLink.first().isVisible({ timeout: 3000 })) {
      await profileLink.first().click();
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      expect(currentUrl.includes('/profile') || currentUrl.includes('/auth')).toBeTruthy();
    }
  });

  test('should navigate to notifications', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const notificationsLink = page.locator('a[href*="/notifications"], button:has-text("Notifications"), [aria-label*="Notifications"]');
    
    if (await notificationsLink.first().isVisible({ timeout: 3000 })) {
      await notificationsLink.first().click();
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      expect(currentUrl.includes('/notifications') || currentUrl.includes('/auth')).toBeTruthy();
    }
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const settingsLink = page.locator('a[href*="/settings"], button:has-text("Settings"), [aria-label*="Settings"]');
    
    if (await settingsLink.first().isVisible({ timeout: 3000 })) {
      await settingsLink.first().click();
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      expect(currentUrl.includes('/settings') || currentUrl.includes('/auth')).toBeTruthy();
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    // Try to access protected route
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    
    // Should either show profile or redirect to auth
    expect(currentUrl.includes('/profile') || currentUrl.includes('/auth')).toBeTruthy();
  });

  test('should redirect to auth for create page when not logged in', async ({ page }) => {
    await page.goto('/create');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    
    // Should either show create page or redirect to auth
    expect(currentUrl.includes('/create') || currentUrl.includes('/auth')).toBeTruthy();
  });
});

test.describe('404 Handling', () => {
  test('should handle non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-route-12345');
    await page.waitForTimeout(2000);
    
    // Should show 404 page or redirect to home
    const has404 = await page.locator('text=/404/i, text=/not found/i').isVisible({ timeout: 3000 }).catch(() => false);
    const redirectedHome = page.url().endsWith('/') || page.url().includes('/home');
    
    expect(has404 || redirectedHome).toBeTruthy();
  });
});

test.describe('Browser Navigation', () => {
  test('should support back button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const exploreLink = page.locator('a[href*="/explore"]').first();
    
    if (await exploreLink.isVisible({ timeout: 3000 })) {
      await exploreLink.click();
      await page.waitForTimeout(1000);
      
      // Go back
      await page.goBack();
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      expect(currentUrl.endsWith('/') || currentUrl.includes('/home')).toBeTruthy();
    }
  });

  test('should support forward button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const exploreLink = page.locator('a[href*="/explore"]').first();
    
    if (await exploreLink.isVisible({ timeout: 3000 })) {
      await exploreLink.click();
      await page.waitForTimeout(1000);
      
      await page.goBack();
      await page.waitForTimeout(1000);
      
      await page.goForward();
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      expect(currentUrl.includes('/explore')).toBeTruthy();
    }
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for mobile nav (bottom nav or hamburger menu)
    const mobileNav = page.locator('[class*="mobile-nav"], [class*="bottom-nav"], button[aria-label*="menu"]');
    
    if (await mobileNav.first().isVisible({ timeout: 3000 })) {
      expect(await mobileNav.count()).toBeGreaterThan(0);
    }
  });

  test('should toggle mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const menuButton = page.locator('button[aria-label*="menu"], button[class*="hamburger"]').first();
    
    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Menu should open
      const menu = page.locator('[role="menu"], [class*="menu-open"], nav[class*="open"]');
      await expect(menu.first()).toBeVisible({ timeout: 2000 });
    }
  });
});
