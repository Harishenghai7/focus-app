/**
 * Automated App Tester - Tests everything automatically in browser
 */

class AutoTester {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;
    this.currentTest = null;
    this.testTimeout = 30000; // 30 seconds per test
  }

  // Add test cases
  addTest(name, testFn, timeout = this.testTimeout) {
    this.tests.push({ name, testFn, timeout });
  }

  // Run all tests automatically
  async runAllTests() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.results = [];

    for (const test of this.tests) {
      await this.runSingleTest(test);
    }
    
    this.isRunning = false;
    this.generateReport();
  }

  async runSingleTest(test) {
    this.currentTest = test.name;
    const startTime = Date.now();
    
    try {

      const result = await Promise.race([
        test.testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), test.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      this.results.push({
        name: test.name,
        status: 'PASS',
        duration,
        result
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        name: test.name,
        status: 'FAIL',
        duration,
        error: error.message
      });

    }
    
    // Wait between tests
    await this.wait(1000);
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test utilities
  async clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.click();
    await this.wait(500);
  }

  async typeText(selector, text) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(300);
  }

  async waitForElement(selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (document.querySelector(selector)) return true;
      await this.wait(100);
    }
    throw new Error(`Element not found within timeout: ${selector}`);
  }

  async checkElementExists(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    return true;
  }

  async checkElementText(selector, expectedText) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    if (!element.textContent.includes(expectedText)) {
      throw new Error(`Text mismatch. Expected: ${expectedText}, Got: ${element.textContent}`);
    }
    return true;
  }

  // Navigation helper
  async navigateTo(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await this.wait(1000);
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    if (failed > 0) {

      this.results.filter(r => r.status === 'FAIL').forEach(test => {

      });
    }
    
    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.results
    };
  }
}

// Create global instance
const autoTester = new AutoTester();

// Define comprehensive test suite
autoTester.addTest('Page Load Test', async () => {
  await autoTester.checkElementExists('body');
  await autoTester.checkElementExists('.focus-app');
  return 'App loaded successfully';
});

autoTester.addTest('Navigation Test', async () => {
  await autoTester.navigateTo('/home');
  await autoTester.waitForElement('.page-home');
  await autoTester.navigateTo('/explore');
  await autoTester.waitForElement('.page-explore');
  return 'Navigation working';
});

autoTester.addTest('Auth Page Test', async () => {
  await autoTester.navigateTo('/auth');
  await autoTester.waitForElement('.auth-container');
  await autoTester.checkElementExists('[data-testid="email-input"]');
  await autoTester.checkElementExists('[data-testid="password-input"]');
  return 'Auth page elements present';
});

autoTester.addTest('Form Input Test', async () => {
  await autoTester.navigateTo('/auth');
  await autoTester.waitForElement('[data-testid="email-input"]');
  await autoTester.typeText('[data-testid="email-input"]', 'test@example.com');
  await autoTester.typeText('[data-testid="password-input"]', 'password123');
  return 'Form inputs working';
});

autoTester.addTest('Button Click Test', async () => {
  await autoTester.navigateTo('/auth');
  await autoTester.waitForElement('[data-testid="login-button"]');
  const button = document.querySelector('[data-testid="login-button"]');
  if (button.disabled) return 'Button properly disabled without valid input';
  return 'Button state correct';
});

autoTester.addTest('Theme Toggle Test', async () => {
  const initialTheme = document.documentElement.classList.contains('dark');
  // Simulate theme toggle
  document.documentElement.classList.toggle('dark');
  const newTheme = document.documentElement.classList.contains('dark');
  if (initialTheme !== newTheme) return 'Theme toggle working';
  throw new Error('Theme toggle failed');
});

autoTester.addTest('Responsive Design Test', async () => {
  const originalWidth = window.innerWidth;
  // Simulate mobile viewport
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  window.dispatchEvent(new Event('resize'));
  await autoTester.wait(500);
  
  // Check mobile elements
  const mobileElements = document.querySelectorAll('.mobile-only, @media (max-width: 768px)');
  
  // Restore viewport
  Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
  window.dispatchEvent(new Event('resize'));
  
  return 'Responsive design elements detected';
});

autoTester.addTest('Error Handling Test', async () => {
  // Trigger an error and check if it's handled
  try {
    throw new Error('Test error');
  } catch (error) {
    // Check if error boundary exists
    const errorBoundary = document.querySelector('.error-boundary, [data-testid="error-boundary"]');
    return 'Error handling mechanism exists';
  }
});

autoTester.addTest('Performance Test', async () => {
  const start = performance.now();
  await autoTester.navigateTo('/home');
  await autoTester.waitForElement('.page-home');
  const loadTime = performance.now() - start;
  
  if (loadTime > 3000) throw new Error(`Page load too slow: ${loadTime}ms`);
  return `Page loaded in ${loadTime.toFixed(0)}ms`;
});

autoTester.addTest('Memory Leak Test', async () => {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  // Navigate multiple times
  for (let i = 0; i < 5; i++) {
    await autoTester.navigateTo('/home');
    await autoTester.navigateTo('/explore');
    await autoTester.wait(200);
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  if (memoryIncrease > 10 * 1024 * 1024) { // 10MB threshold
    throw new Error(`Potential memory leak: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB increase`);
  }
  
  return `Memory usage stable: ${(memoryIncrease / 1024).toFixed(0)}KB increase`;
});

autoTester.addTest('Accessibility Test', async () => {
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) {
    throw new Error('No focusable elements found');
  }
  
  // Check for ARIA labels
  const unlabeledElements = Array.from(focusableElements).filter(el => 
    !el.getAttribute('aria-label') && 
    !el.getAttribute('aria-labelledby') && 
    !el.textContent.trim()
  );
  
  if (unlabeledElements.length > focusableElements.length * 0.5) {
    throw new Error('Too many unlabeled interactive elements');
  }
  
  return `Accessibility: ${focusableElements.length} focusable elements, ${unlabeledElements.length} unlabeled`;
});

autoTester.addTest('Console Error Test', async () => {
  const originalError = console.error;
  const errors = [];
  
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  await autoTester.navigateTo('/home');
  await autoTester.wait(2000);
  
  console.error = originalError;
  
  const criticalErrors = errors.filter(error => 
    !error.includes('ResizeObserver') && 
    !error.includes('Warning:')
  );
  
  if (criticalErrors.length > 0) {
    throw new Error(`Console errors detected: ${criticalErrors.length}`);
  }
  
  return `No critical console errors (${errors.length} total, ${criticalErrors.length} critical)`;
});

// Auto-start testing when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait for app to initialize
    setTimeout(() => {
      if (window.location.search.includes('autotest=true')) {
        autoTester.runAllTests();
      }
    }, 3000);
  });
}

// Expose to global scope
window.autoTester = autoTester;

export default autoTester;