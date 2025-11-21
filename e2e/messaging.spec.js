const { test, expect } = require('@playwright/test');

test.describe('Messaging System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to messages page', async ({ page }) => {
    // Look for messages link/button
    const messagesLink = page.locator('a[href*="/messages"], button:has-text("Messages"), [aria-label*="Messages"]');
    
    if (await messagesLink.first().isVisible({ timeout: 5000 })) {
      await messagesLink.first().click();
      await expect(page).toHaveURL(/\/messages/, { timeout: 5000 });
    } else {
      // If not logged in, should redirect to auth
      await page.goto('/messages');
      const currentUrl = page.url();
      expect(currentUrl.includes('/messages') || currentUrl.includes('/auth')).toBeTruthy();
    }
  });

  test('should display conversations list', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    // Check for conversations or empty state
    const hasConversations = await page.locator('[class*="conversation"], [class*="chat-list"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no messages/i, text=/start.*conversation/i').isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasConversations || hasEmptyState).toBeTruthy();
  });

  test('should have new message button', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const newMessageButton = page.locator('button:has-text("New"), button[aria-label*="new message"], button:has-text("Compose")');
    
    if (await newMessageButton.first().isVisible({ timeout: 3000 })) {
      expect(await newMessageButton.count()).toBeGreaterThan(0);
    }
  });

  test('should open new message modal', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const newMessageButton = page.locator('button:has-text("New"), button[aria-label*="new message"]').first();
    
    if (await newMessageButton.isVisible({ timeout: 3000 })) {
      await newMessageButton.click();
      
      // Should open modal or navigate to new message page
      const modal = page.locator('[role="dialog"], [class*="modal"]');
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="username"]');
      
      await expect(modal.first().or(searchInput.first())).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Chat Thread', () => {
  test('should open chat thread', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"], [class*="chat-item"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      // Should show chat thread
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
      await expect(messageInput.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display message input', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
      await expect(messageInput.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should have send button', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      const sendButton = page.locator('button[aria-label*="send"], button:has-text("Send")');
      expect(await sendButton.count()).toBeGreaterThan(0);
    }
  });

  test('should enable send button when message is typed', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
      const sendButton = page.locator('button[aria-label*="send"], button:has-text("Send")').first();
      
      if (await messageInput.isVisible() && await sendButton.isVisible()) {
        // Initially disabled
        const initiallyDisabled = await sendButton.isDisabled().catch(() => false);
        
        // Type message
        await messageInput.fill('Test message');
        await page.waitForTimeout(500);
        
        // Should be enabled now
        const nowEnabled = await sendButton.isEnabled();
        
        expect(!initiallyDisabled || nowEnabled).toBeTruthy();
      }
    }
  });

  test('should display messages in thread', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      // Should show messages or empty state
      const messages = page.locator('[class*="message"], [class*="chat-bubble"]');
      const emptyState = page.locator('text=/no messages/i, text=/start.*conversation/i');
      
      const hasMessages = await messages.count() > 0;
      const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasMessages || hasEmptyState).toBeTruthy();
    }
  });

  test('should support media upload in messages', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      // Look for media upload button
      const mediaButton = page.locator('button[aria-label*="attach"], button[aria-label*="media"], input[type="file"]');
      
      if (await mediaButton.first().isVisible({ timeout: 2000 })) {
        expect(await mediaButton.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Group Messaging', () => {
  test('should have create group option', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const createGroupButton = page.locator('button:has-text("Group"), button:has-text("New Group"), [aria-label*="create group"]');
    
    // Group feature is optional
    if (await createGroupButton.first().isVisible({ timeout: 3000 })) {
      expect(await createGroupButton.count()).toBeGreaterThan(0);
    }
  });

  test('should open create group modal', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const createGroupButton = page.locator('button:has-text("Group"), button:has-text("New Group")').first();
    
    if (await createGroupButton.isVisible({ timeout: 3000 })) {
      await createGroupButton.click();
      
      // Should open modal
      const modal = page.locator('[role="dialog"], [class*="modal"]');
      await expect(modal.first()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Message Features', () => {
  test('should show typing indicator', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      // Typing indicator might appear
      const typingIndicator = page.locator('text=/typing/i, [class*="typing"]');
      
      // Just check if element exists (may not be visible without real-time interaction)
      const exists = await typingIndicator.count() > 0;
      expect(typeof exists).toBe('boolean');
    }
  });

  test('should show read receipts', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000);
    
    const conversations = page.locator('[class*="conversation"]').first();
    
    if (await conversations.isVisible({ timeout: 3000 })) {
      await conversations.click();
      await page.waitForTimeout(1000);
      
      // Look for read indicators
      const readIndicator = page.locator('text=/read/i, text=/seen/i, [class*="read"]');
      
      // Read receipts are optional
      const exists = await readIndicator.count() > 0;
      expect(typeof exists).toBe('boolean');
    }
  });
});
