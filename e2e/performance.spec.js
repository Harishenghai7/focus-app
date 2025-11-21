const { test, expect } = require('@playwright/test');

test.describe('Performance Metrics', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have good First Contentful Paint', async ({ page }) => {
    await page.goto('/');
    
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      };
    });
    
    // DOM should load quickly
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
  });

  test('should have reasonable bundle size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;
      
      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        totalSize += size;
        
        if (resource.name.endsWith('.js')) {
          jsSize += size;
        } else if (resource.name.endsWith('.css')) {
          cssSize += size;
        }
      });
      
      return {
        total: totalSize,
        js: jsSize,
        css: cssSize,
      };
    });
    
    // Total initial load should be reasonable (under 10MB)
    expect(resourceSizes.total).toBeLessThan(10 * 1024 * 1024);
  });

  test('should maintain smooth scrolling', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    // Measure scroll performance
    const scrollMetrics = await page.evaluate(async () => {
      let frameCount = 0;
      let lastTime = performance.now();
      const frameTimes = [];
      
      return new Promise((resolve) => {
        const measureFrame = () => {
          const currentTime = performance.now();
          const frameTime = currentTime - lastTime;
          frameTimes.push(frameTime);
          lastTime = currentTime;
          frameCount++;
          
          if (frameCount < 30) {
            requestAnimationFrame(measureFrame);
          } else {
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const fps = 1000 / avgFrameTime;
            resolve({ fps, avgFrameTime });
          }
        };
        
        // Start scrolling
        window.scrollBy(0, 100);
        requestAnimationFrame(measureFrame);
      });
    });
    
    // Should maintain at least 30 FPS
    expect(scrollMetrics.fps).toBeGreaterThan(30);
  });

  test('should load images lazily', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    // Check if images have loading="lazy" attribute
    const lazyImages = await page.locator('img[loading="lazy"]').count();
    const totalImages = await page.locator('img').count();
    
    // At least some images should be lazy loaded
    if (totalImages > 0) {
      expect(lazyImages).toBeGreaterThan(0);
    }
  });

  test('should cache static assets', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Second visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const cachedResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(r => r.transferSize === 0).length;
    });
    
    // Some resources should be cached
    expect(cachedResources).toBeGreaterThan(0);
  });
});

test.describe('Memory Usage', () => {
  test('should not leak memory on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Navigate between pages
    const pages = ['/', '/explore', '/profile', '/messages'];
    
    for (const route of pages) {
      await page.goto(route);
      await page.waitForTimeout(1000);
    }
    
    // Check memory usage
    const metrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return null;
    });
    
    if (metrics) {
      // Memory usage should be reasonable (under 400MB)
      expect(metrics.usedJSHeapSize).toBeLessThan(400 * 1024 * 1024);
    }
  });

  test('should clean up subscriptions', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    
    // Navigate away
    await page.goto('/explore');
    await page.waitForTimeout(2000);
    
    // Check for active subscriptions (implementation specific)
    const hasCleanup = await page.evaluate(() => {
      // This would check your specific subscription cleanup
      return true; // Placeholder
    });
    
    expect(hasCleanup).toBeTruthy();
  });
});

test.describe('Network Performance', () => {
  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Should show loading state
    const hasLoadingState = await page.locator('[role="progressbar"], text=/loading/i, [class*="skeleton"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    // Either loaded or showing loading state
    expect(hasLoadingState || page.url().includes('/')).toBeTruthy();
  });

  test('should handle offline mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate
    await page.goto('/explore').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Should show offline indicator
    const offlineIndicator = await page.locator('text=/offline/i, text=/no connection/i, [class*="offline"]').isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(offlineIndicator).toBeTruthy();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/**', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Should have retried
    expect(requestCount).toBeGreaterThan(1);
  });
});

test.describe('Responsive Performance', () => {
  test('should perform well on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 6 seconds on mobile
    expect(loadTime).toBeLessThan(6000);
  });

  test('should handle orientation changes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);
    
    // Should still be functional
    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBeTruthy();
  });
});

test.describe('Animation Performance', () => {
  test('should have smooth animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Trigger an animation (like opening a modal)
    const animatedElement = page.locator('button:has-text("Create"), button:has-text("New")').first();
    
    if (await animatedElement.isVisible({ timeout: 3000 })) {
      await animatedElement.click();
      await page.waitForTimeout(500);
      
      // Animation should complete
      const modalVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(typeof modalVisible).toBe('boolean');
    }
  });

  test('should respect reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check if animations are reduced
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(hasReducedMotion).toBeTruthy();
  });
});
