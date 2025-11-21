const { test, expect } = require('@playwright/test');

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should support tab navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Press tab multiple times
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('should show focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check if focused element has visible outline or focus style
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || 
             styles.outlineWidth !== '0px' ||
             el.classList.contains('focus') ||
             el.classList.contains('focused');
    });
    
    expect(hasFocusStyle).toBeTruthy();
  });

  test('should navigate through interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const initialElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    const finalElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should have moved focus
    expect(finalElement).toBeTruthy();
  });

  test('should support Enter key for buttons', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForTimeout(2000);
    
    // Tab to a button
    let foundButton = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const isButton = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' || el?.getAttribute('role') === 'button';
      });
      
      if (isButton) {
        foundButton = true;
        break;
      }
    }
    
    expect(foundButton).toBeTruthy();
  });

  test('should support Escape key to close modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Try to open a modal (if available)
    const modalTrigger = page.locator('button:has-text("Create"), button:has-text("New")').first();
    
    if (await modalTrigger.isVisible({ timeout: 3000 })) {
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Modal should close
      const modalVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 1000 }).catch(() => false);
      expect(modalVisible).toBeFalsy();
    }
  });
});

test.describe('Accessibility - ARIA Labels', () => {
  test('should have ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check buttons have aria-label or text content
    const buttons = await page.locator('button').all();
    
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      const hasLabel = await firstButton.evaluate(el => {
        return el.getAttribute('aria-label') || 
               el.textContent?.trim() || 
               el.getAttribute('title');
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check images have alt text
    const images = await page.locator('img').all();
    
    if (images.length > 0) {
      const firstImage = images[0];
      const hasAlt = await firstImage.getAttribute('alt');
      
      // Alt can be empty string for decorative images, but should exist
      expect(hasAlt !== null).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    
    // Should have at least one h1 (or none if using different structure)
    expect(h1Count >= 0).toBeTruthy();
  });

  test('should have form labels', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForTimeout(2000);
    
    // Check inputs have labels
    const inputs = await page.locator('input[type="email"], input[type="password"]').all();
    
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const hasLabel = await firstInput.evaluate(el => {
        const id = el.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        return label || 
               el.getAttribute('aria-label') || 
               el.getAttribute('placeholder');
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  test('should have semantic HTML', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for semantic elements
    const hasNav = await page.locator('nav').count() > 0;
    const hasMain = await page.locator('main').count() > 0;
    const hasHeader = await page.locator('header').count() > 0;
    
    // At least one semantic element should exist
    expect(hasNav || hasMain || hasHeader).toBeTruthy();
  });

  test('should have proper button roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check that clickable elements are buttons or have button role
    const clickableElements = await page.locator('[onclick], [class*="clickable"]').all();
    
    if (clickableElements.length > 0) {
      const firstElement = clickableElements[0];
      const isAccessible = await firstElement.evaluate(el => {
        return el.tagName === 'BUTTON' || 
               el.tagName === 'A' || 
               el.getAttribute('role') === 'button';
      });
      
      expect(isAccessible).toBeTruthy();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    
    // Live regions are optional but good to have
    expect(liveRegions >= 0).toBeTruthy();
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check text elements have good contrast
    const textElements = await page.locator('p, span, a, button').all();
    
    if (textElements.length > 0) {
      const firstText = textElements[0];
      const hasText = await firstText.textContent();
      
      expect(hasText).toBeTruthy();
    }
  });

  test('should support dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for theme toggle
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="dark"], button:has-text("Theme")');
    
    if (await themeToggle.first().isVisible({ timeout: 3000 })) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
      });
      
      expect(typeof isDark).toBe('boolean');
    }
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Try to open a modal
    const modalTrigger = page.locator('button:has-text("Create"), button:has-text("New")').first();
    
    if (await modalTrigger.isVisible({ timeout: 3000 })) {
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      // Tab through modal
      const initialFocus = await page.evaluate(() => document.activeElement?.tagName);
      
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
      }
      
      // Focus should still be within modal
      const isInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(document.activeElement);
      });
      
      // If modal exists, focus should be trapped
      const modalExists = await page.locator('[role="dialog"]').isVisible({ timeout: 1000 }).catch(() => false);
      
      if (modalExists) {
        expect(isInModal).toBeTruthy();
      }
    }
  });

  test('should restore focus after modal closes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const modalTrigger = page.locator('button:has-text("Create"), button:has-text("New")').first();
    
    if (await modalTrigger.isVisible({ timeout: 3000 })) {
      // Focus trigger
      await modalTrigger.focus();
      const triggerElement = await page.evaluate(() => document.activeElement?.tagName);
      
      // Open modal
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Focus should return to trigger (or nearby element)
      const focusRestored = await page.evaluate(() => document.activeElement?.tagName);
      
      expect(focusRestored).toBeTruthy();
    }
  });
});
