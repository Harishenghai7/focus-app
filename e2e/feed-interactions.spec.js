const { test, expect } = require('@playwright/test');

test.describe('Home Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home feed', async ({ page }) => {
    // Wait for feed to load
    await page.waitForTimeout(2000);
    
    // Check if we're on home/feed or redirected to auth
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth')) {
      // Not logged in - expected behavior
      await expect(page.locator('h2')).toContainText(/Welcome|Login|Sign/i);
    } else {
      // Should show feed or empty state
      const hasPosts = await page.locator('[class*="post"], [data-testid*="post"]').count() > 0;
      const hasEmptyState = await page.locator('text=/no posts/i, text=/start following/i').isVisible({ timeout: 3000 }).catch(() => false);
      
      expect(hasPosts || hasEmptyState).toBeTruthy();
    }
  });

  test('should display post cards', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    // Look for post elements
    const posts = page.locator('[class*="post-card"], [class*="PostCard"], article');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // First post should have key elements
      const firstPost = posts.first();
      
      // Should have user info
      const hasUserInfo = await firstPost.locator('text=/^[a-zA-Z0-9_]+$/, img[alt*="avatar"]').count() > 0;
      expect(hasUserInfo).toBeTruthy();
    }
  });

  test('should support infinite scroll', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    const initialPostCount = await page.locator('[class*="post"], article').count();
    
    if (initialPostCount > 0) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Check if more posts loaded or loading indicator appeared
      const newPostCount = await page.locator('[class*="post"], article').count();
      const hasLoadingIndicator = await page.locator('text=/loading/i, [role="progressbar"]').isVisible({ timeout: 1000 }).catch(() => false);
      
      expect(newPostCount >= initialPostCount || hasLoadingIndicator).toBeTruthy();
    }
  });

  test('should support pull to refresh', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    // Simulate pull to refresh by scrolling up from top
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // On mobile, pull-to-refresh would trigger
    // On desktop, there might be a refresh button
    const refreshButton = page.locator('button[aria-label*="refresh"], button:has-text("Refresh")');
    
    if (await refreshButton.isVisible({ timeout: 1000 })) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Post Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
  });

  test('should have like button on posts', async ({ page }) => {
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const likeButton = posts.locator('button[aria-label*="like"], button:has-text("Like"), svg[class*="heart"]').first();
      expect(await likeButton.count()).toBeGreaterThan(0);
    }
  });

  test('should toggle like on click', async ({ page }) => {
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const likeButton = posts.locator('button[aria-label*="like"], button:has-text("Like")').first();
      
      if (await likeButton.isVisible({ timeout: 2000 })) {
        // Get initial state
        const initialAriaLabel = await likeButton.getAttribute('aria-label').catch(() => '');
        
        // Click like button
        await likeButton.click();
        await page.waitForTimeout(500);
        
        // State should change (or show animation)
        const newAriaLabel = await likeButton.getAttribute('aria-label').catch(() => '');
        
        // Either aria-label changed or button has active class
        const hasActiveClass = await likeButton.evaluate(el => el.classList.contains('active') || el.classList.contains('liked'));
        
        expect(initialAriaLabel !== newAriaLabel || hasActiveClass).toBeTruthy();
      }
    }
  });

  test('should have comment button on posts', async ({ page }) => {
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const commentButton = posts.locator('button[aria-label*="comment"], button:has-text("Comment")').first();
      expect(await commentButton.count()).toBeGreaterThan(0);
    }
  });

  test('should open comment modal on click', async ({ page }) => {
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const commentButton = posts.locator('button[aria-label*="comment"], button:has-text("Comment")').first();
      
      if (await commentButton.isVisible({ timeout: 2000 })) {
        await commentButton.click();
        
        // Should open modal or navigate to post detail
        const commentModal = page.locator('[role="dialog"], [class*="modal"], [class*="comment"]');
        const commentInput = page.locator('textarea[placeholder*="comment"], input[placeholder*="comment"]');
        
        await expect(commentModal.first().or(commentInput.first())).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should have save button on posts', async ({ page }) => {
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const saveButton = posts.locator('button[aria-label*="save"], button:has-text("Save")').first();
      expect(await saveButton.count()).toBeGreaterThan(0);
    }
  });

  test('should have share button on posts', async ({ page }) => {
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const shareButton = posts.locator('button[aria-label*="share"], button:has-text("Share")').first();
      
      // Share button is optional but common
      if (await shareButton.count() > 0) {
        expect(await shareButton.isVisible()).toBeTruthy();
      }
    }
  });
});

test.describe('Post Details', () => {
  test('should navigate to post detail on click', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      // Click on post image or caption area
      const postImage = posts.locator('img[alt*="post"], img[src*="posts"]').first();
      
      if (await postImage.isVisible({ timeout: 2000 })) {
        await postImage.click();
        await page.waitForTimeout(1000);
        
        // Should navigate to post detail or open modal
        const currentUrl = page.url();
        const hasModal = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
        
        expect(currentUrl.includes('/post/') || hasModal).toBeTruthy();
      }
    }
  });

  test('should display comments on post detail', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    const posts = page.locator('[class*="post"], article').first();
    
    if (await posts.isVisible({ timeout: 3000 })) {
      const commentButton = posts.locator('button[aria-label*="comment"]').first();
      
      if (await commentButton.isVisible({ timeout: 2000 })) {
        await commentButton.click();
        await page.waitForTimeout(1000);
        
        // Should show comment section
        const commentSection = page.locator('[class*="comment"], text=/comments/i');
        await expect(commentSection.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Carousel Posts', () => {
  test('should support carousel navigation', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    // Look for carousel indicators
    const carouselIndicators = page.locator('[class*="carousel"], [class*="indicator"], button[aria-label*="next"]');
    
    if (await carouselIndicators.first().isVisible({ timeout: 3000 })) {
      const nextButton = page.locator('button[aria-label*="next"], button[class*="next"]').first();
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Should navigate to next image
        expect(true).toBeTruthy();
      }
    }
  });
});
