/**
 * E2E Test Helper Functions
 * Common utilities for Playwright tests
 */

/**
 * Generate unique test user credentials
 */
function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `e2etest${timestamp}@example.com`,
    password: 'TestPass123!',
    username: `e2euser${timestamp}`,
    fullName: 'E2E Test User',
  };
}

/**
 * Login helper function
 */
async function login(page, email, password) {
  await page.goto('/auth');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(2000);
}

/**
 * Signup helper function
 */
async function signup(page, userData) {
  await page.goto('/auth');
  await page.click('text=Sign Up');
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.click('button:has-text("Sign Up")');
  await page.waitForTimeout(3000);
}

/**
 * Complete onboarding helper
 */
async function completeOnboarding(page, username, fullName) {
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="full_name"]', fullName);
  
  const completeButton = page.locator('button:has-text("Complete"), button:has-text("Continue"), button:has-text("Next")');
  await completeButton.first().click();
  await page.waitForTimeout(2000);
}

/**
 * Navigate to a specific page
 */
async function navigateTo(page, route) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for element to be visible
 */
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is logged in
 */
async function isLoggedIn(page) {
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  return !currentUrl.includes('/auth');
}

/**
 * Logout helper
 */
async function logout(page) {
  // Look for logout button in various locations
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log Out"), a:has-text("Logout")');
  
  if (await logoutButton.first().isVisible({ timeout: 3000 })) {
    await logoutButton.first().click();
    await page.waitForTimeout(1000);
  } else {
    // Try opening settings/menu first
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="settings"]').first();
    if (await menuButton.isVisible({ timeout: 2000 })) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      const logoutInMenu = page.locator('button:has-text("Logout"), a:has-text("Logout")');
      if (await logoutInMenu.first().isVisible({ timeout: 2000 })) {
        await logoutInMenu.first().click();
        await page.waitForTimeout(1000);
      }
    }
  }
}

/**
 * Create a test post
 */
async function createPost(page, caption, mediaPath = null) {
  await page.goto('/create');
  await page.waitForTimeout(2000);
  
  if (mediaPath) {
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(mediaPath);
      await page.waitForTimeout(1000);
    }
  }
  
  const captionInput = page.locator('textarea[placeholder*="caption"], textarea[name="caption"]').first();
  if (await captionInput.isVisible({ timeout: 3000 })) {
    await captionInput.fill(caption);
  }
  
  const submitButton = page.locator('button:has-text("Post"), button:has-text("Share"), button:has-text("Publish")').first();
  if (await submitButton.isVisible({ timeout: 3000 })) {
    await submitButton.click();
    await page.waitForTimeout(2000);
  }
}

/**
 * Like a post
 */
async function likePost(page, postIndex = 0) {
  const posts = page.locator('[class*="post"], article');
  const post = posts.nth(postIndex);
  
  if (await post.isVisible({ timeout: 3000 })) {
    const likeButton = post.locator('button[aria-label*="like"], button:has-text("Like")').first();
    if (await likeButton.isVisible({ timeout: 2000 })) {
      await likeButton.click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Comment on a post
 */
async function commentOnPost(page, commentText, postIndex = 0) {
  const posts = page.locator('[class*="post"], article');
  const post = posts.nth(postIndex);
  
  if (await post.isVisible({ timeout: 3000 })) {
    const commentButton = post.locator('button[aria-label*="comment"], button:has-text("Comment")').first();
    if (await commentButton.isVisible({ timeout: 2000 })) {
      await commentButton.click();
      await page.waitForTimeout(1000);
      
      const commentInput = page.locator('textarea[placeholder*="comment"], input[placeholder*="comment"]').first();
      if (await commentInput.isVisible({ timeout: 2000 })) {
        await commentInput.fill(commentText);
        
        const submitButton = page.locator('button:has-text("Post"), button:has-text("Comment"), button[aria-label*="submit"]').first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  }
}

/**
 * Send a message
 */
async function sendMessage(page, recipientUsername, messageText) {
  await page.goto('/messages');
  await page.waitForTimeout(2000);
  
  // Open new message
  const newMessageButton = page.locator('button:has-text("New"), button[aria-label*="new message"]').first();
  if (await newMessageButton.isVisible({ timeout: 3000 })) {
    await newMessageButton.click();
    await page.waitForTimeout(1000);
    
    // Search for recipient
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="username"]').first();
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill(recipientUsername);
      await page.waitForTimeout(1000);
      
      // Select recipient
      const recipient = page.locator(`text=${recipientUsername}`).first();
      if (await recipient.isVisible({ timeout: 2000 })) {
        await recipient.click();
        await page.waitForTimeout(500);
      }
    }
  }
  
  // Send message
  const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
  if (await messageInput.isVisible({ timeout: 3000 })) {
    await messageInput.fill(messageText);
    
    const sendButton = page.locator('button[aria-label*="send"], button:has-text("Send")').first();
    if (await sendButton.isVisible({ timeout: 2000 })) {
      await sendButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Take a screenshot with a descriptive name
 */
async function takeScreenshot(page, name) {
  const timestamp = Date.now();
  await page.screenshot({ path: `screenshots/${name}-${timestamp}.png`, fullPage: true });
}

/**
 * Check for console errors
 */
async function checkConsoleErrors(page) {
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Wait for network to be idle
 */
async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Scroll to bottom of page
 */
async function scrollToBottom(page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);
}

/**
 * Scroll to top of page
 */
async function scrollToTop(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

/**
 * Get current URL
 */
async function getCurrentUrl(page) {
  return page.url();
}

/**
 * Check if element exists
 */
async function elementExists(page, selector) {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Get element text
 */
async function getElementText(page, selector) {
  const element = page.locator(selector).first();
  if (await element.isVisible({ timeout: 2000 })) {
    return await element.textContent();
  }
  return null;
}

/**
 * Clear local storage
 */
async function clearLocalStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Clear session storage
 */
async function clearSessionStorage(page) {
  await page.evaluate(() => {
    sessionStorage.clear();
  });
}

/**
 * Set viewport size
 */
async function setViewport(page, width, height) {
  await page.setViewportSize({ width, height });
}

module.exports = {
  generateTestUser,
  login,
  signup,
  completeOnboarding,
  navigateTo,
  waitForElement,
  isLoggedIn,
  logout,
  createPost,
  likePost,
  commentOnPost,
  sendMessage,
  takeScreenshot,
  checkConsoleErrors,
  waitForNetworkIdle,
  scrollToBottom,
  scrollToTop,
  getCurrentUrl,
  elementExists,
  getElementText,
  clearLocalStorage,
  clearSessionStorage,
  setViewport,
};
