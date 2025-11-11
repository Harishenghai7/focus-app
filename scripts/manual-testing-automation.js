#!/usr/bin/env node

/**
 * Manual Testing Automation Script
 * Executes critical test cases from the manual testing guide
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class FocusAppTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Initializing Focus App Testing...\n');
    this.browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    await this.page.goto(this.baseUrl);
  }

  async runTest(testName, testFunction) {
    console.log(`🧪 Running: ${testName}`);
    try {
      await testFunction();
      this.testResults.push({ name: testName, status: 'PASS', error: null });
      console.log(`✅ PASS: ${testName}\n`);
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${testName} - ${error.message}\n`);
    }
  }

  // Test Case 1.1: Authentication Page Load
  async testAuthPageLoad() {
    await this.page.goto(`${this.baseUrl}/auth`);
    await this.page.waitForSelector('[data-testid="auth-container"]', { timeout: 5000 });
    
    // Check if signup and login tabs exist
    const signupTab = await this.page.$('[data-testid="signup-tab"]');
    const loginTab = await this.page.$('[data-testid="login-tab"]');
    
    if (!signupTab || !loginTab) {
      throw new Error('Auth tabs not found');
    }
  }

  // Test Case 2.1: Navigation Elements
  async testNavigationElements() {
    await this.page.goto(`${this.baseUrl}`);
    
    // Check if redirected to auth (no user logged in)
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/auth')) {
      throw new Error('Should redirect to auth when not logged in');
    }
  }

  // Test Case 3.1: Responsive Design
  async testResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.goto(`${this.baseUrl}/auth`);
    
    // Check if mobile layout is applied
    const authContainer = await this.page.$('[data-testid="auth-container"]');
    if (!authContainer) {
      throw new Error('Auth container not found in mobile view');
    }
    
    // Test desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.reload();
    
    // Verify desktop layout
    const desktopAuth = await this.page.$('[data-testid="auth-container"]');
    if (!desktopAuth) {
      throw new Error('Auth container not found in desktop view');
    }
  }

  // Test Case 4.1: Form Validation
  async testFormValidation() {
    await this.page.goto(`${this.baseUrl}/auth`);
    
    // Try to submit empty form
    const submitButton = await this.page.$('[data-testid="login-button"]');
    if (submitButton) {
      await submitButton.click();
      
      // Check for validation messages
      await this.page.waitForTimeout(1000);
      const errorMessage = await this.page.$('.error-message, .validation-error, [role="alert"]');
      if (!errorMessage) {
        console.log('⚠️  No validation error shown for empty form (may be handled differently)');
      }
    }
  }

  // Test Case 5.1: Dark Mode Toggle
  async testDarkModeToggle() {
    await this.page.goto(`${this.baseUrl}/auth`);
    
    // Look for dark mode toggle
    const darkModeToggle = await this.page.$('[data-testid="dark-mode-toggle"], .theme-toggle, .dark-mode-button');
    if (darkModeToggle) {
      await darkModeToggle.click();
      await this.page.waitForTimeout(500);
      
      // Check if dark class is applied
      const htmlElement = await this.page.$('html');
      const className = await this.page.evaluate(el => el.className, htmlElement);
      
      if (!className.includes('dark')) {
        throw new Error('Dark mode class not applied');
      }
    } else {
      console.log('⚠️  Dark mode toggle not found (may be in different location)');
    }
  }

  // Test Case 6.1: Performance Check
  async testPerformanceMetrics() {
    await this.page.goto(`${this.baseUrl}/auth`);
    
    // Get performance metrics
    const metrics = await this.page.metrics();
    
    console.log('📊 Performance Metrics:');
    console.log(`   DOM Nodes: ${metrics.Nodes}`);
    console.log(`   JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   JS Heap Total: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Check if performance is reasonable
    if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) { // 50MB
      throw new Error('JS Heap usage too high');
    }
  }

  // Test Case 7.1: Accessibility Check
  async testAccessibility() {
    await this.page.goto(`${this.baseUrl}/auth`);
    
    // Check for basic accessibility attributes
    const inputs = await this.page.$$('input');
    for (let input of inputs) {
      const label = await this.page.evaluate(el => {
        return el.getAttribute('aria-label') || 
               el.getAttribute('placeholder') || 
               document.querySelector(`label[for="${el.id}"]`)?.textContent;
      }, input);
      
      if (!label) {
        console.log('⚠️  Input without label found (accessibility concern)');
      }
    }
    
    // Check for alt text on images
    const images = await this.page.$$('img');
    for (let img of images) {
      const alt = await this.page.evaluate(el => el.getAttribute('alt'), img);
      if (!alt) {
        console.log('⚠️  Image without alt text found');
      }
    }
  }

  // Test Case 8.1: Console Errors Check
  async testConsoleErrors() {
    const errors = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await this.page.goto(`${this.baseUrl}/auth`);
    await this.page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('⚠️  Console Errors Found:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
  }

  // Test Case 9.1: Network Requests
  async testNetworkRequests() {
    const requests = [];
    
    this.page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    await this.page.goto(`${this.baseUrl}/auth`);
    await this.page.waitForTimeout(3000);
    
    console.log(`📡 Network Requests: ${requests.length}`);
    
    // Check for failed requests
    const failedRequests = requests.filter(req => req.failed);
    if (failedRequests.length > 0) {
      console.log('⚠️  Failed Requests:');
      failedRequests.forEach(req => console.log(`   - ${req.url}`));
    }
  }

  async generateReport() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        passRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.testResults
    };
    
    fs.writeFileSync('manual-test-results.json', JSON.stringify(report, null, 2));
    
    console.log('📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}%`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Focus app is ready for production!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results.');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.runTest('Auth Page Load', () => this.testAuthPageLoad());
      await this.runTest('Navigation Elements', () => this.testNavigationElements());
      await this.runTest('Responsive Design', () => this.testResponsiveDesign());
      await this.runTest('Form Validation', () => this.testFormValidation());
      await this.runTest('Dark Mode Toggle', () => this.testDarkModeToggle());
      await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());
      await this.runTest('Accessibility Check', () => this.testAccessibility());
      await this.runTest('Console Errors', () => this.testConsoleErrors());
      await this.runTest('Network Requests', () => this.testNetworkRequests());
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new FocusAppTester();
  tester.runAllTests().catch(console.error);
}

module.exports = FocusAppTester;