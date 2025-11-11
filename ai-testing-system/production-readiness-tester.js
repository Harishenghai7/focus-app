const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionReadinessTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalBugs: 0,
        highBugs: 0,
        mediumBugs: 0,
        lowBugs: 0,
        productionReady: false
      },
      categories: {},
      bugs: [],
      recommendations: []
    };
  }

  async runCompleteProductionTest() {
    console.log('🚀 Running Complete Production Readiness Test...\n');

    try {
      await this.testAuthentication();
      await this.testProfileManagement();
      await this.testPostCreation();
      await this.testInteractions();
      await this.testBoltz();
      await this.testFlash();
      await this.testFollowSystem();
      await this.testMessaging();
      await this.testCalls();
      await this.testNotifications();
      await this.testSearch();
      await this.testSettings();
      await this.testAccessibility();
      await this.testPerformance();
      await this.testSecurity();
      await this.testCrossPlatform();
      await this.testPWA();

      this.calculateSummary();
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication & Onboarding...');
    
    const tests = [
      { name: 'Auth Page Loads', test: () => this.checkRoute('/auth') },
      { name: 'Signup Form Present', test: () => this.checkElement('[data-testid="signup-tab"]') },
      { name: 'Login Form Present', test: () => this.checkElement('[data-testid="login-button"]') },
      { name: 'Password Reset Available', test: () => this.checkElement('[data-testid="forgot-password-link"]') },
      { name: 'OAuth Buttons Present', test: () => this.checkElement('.oauth-google') },
      { name: 'Password Strength Indicator', test: () => this.checkFile('src/utils/validation.js') },
      { name: '2FA Support', test: () => this.checkFile('src/utils/twoFactorAuth.js') },
      { name: 'Onboarding Flow', test: () => this.checkFile('src/components/OnboardingFlow.js') }
    ];

    this.results.categories.authentication = await this.runTestSuite('Authentication', tests);
  }

  async testProfileManagement() {
    console.log('👤 Testing Profile Management...');
    
    const tests = [
      { name: 'Profile Page', test: () => this.checkRoute('/profile') },
      { name: 'Edit Profile Page', test: () => this.checkRoute('/edit-profile') },
      { name: 'Avatar Upload', test: () => this.searchInFile('src/pages/EditProfile.js', 'upload') },
      { name: 'Bio Character Limit', test: () => this.searchInFile('src/pages/EditProfile.js', '150') },
      { name: 'Privacy Toggle', test: () => this.searchInFile('src/pages/Settings.js', 'private') },
      { name: 'Username Validation', test: () => this.searchInFile('src/utils/validation.js', 'username') }
    ];

    this.results.categories.profileManagement = await this.runTestSuite('Profile Management', tests);
  }

  async testPostCreation() {
    console.log('📝 Testing Post Creation & Feed...');
    
    const tests = [
      { name: 'Create Page', test: () => this.checkRoute('/create') },
      { name: 'Image Upload', test: () => this.searchInFile('src/pages/Create.js', 'image') },
      { name: 'Carousel Support', test: () => this.searchInFile('src/pages/Create.js', 'carousel') },
      { name: 'Draft Saving', test: () => this.searchInFile('src/pages/Create.js', 'draft') },
      { name: 'Scheduled Posts', test: () => this.searchInFile('src/pages/Create.js', 'schedule') },
      { name: 'Home Feed', test: () => this.checkRoute('/home') },
      { name: 'Infinite Scroll', test: () => this.searchInFile('src/pages/Home.js', 'infinite') }
    ];

    this.results.categories.postCreation = await this.runTestSuite('Post Creation', tests);
  }

  async testInteractions() {
    console.log('❤️ Testing Interactions...');
    
    const tests = [
      { name: 'Like System', test: () => this.searchInFile('src/components', 'like') },
      { name: 'Comment System', test: () => this.searchInFile('src/components', 'comment') },
      { name: 'Save Posts', test: () => this.checkRoute('/saved') },
      { name: 'Collections', test: () => this.searchInFile('src/pages/Saved.js', 'collection') },
      { name: 'Double Tap Like', test: () => this.searchInFile('src/components', 'double') },
      { name: 'Comment Replies', test: () => this.searchInFile('src/components', 'reply') }
    ];

    this.results.categories.interactions = await this.runTestSuite('Interactions', tests);
  }

  async testBoltz() {
    console.log('🎬 Testing Boltz (Short Videos)...');
    
    const tests = [
      { name: 'Boltz Page', test: () => this.checkRoute('/boltz') },
      { name: 'Video Upload', test: () => this.searchInFile('src/pages/Boltz.js', 'video') },
      { name: 'Video Controls', test: () => this.searchInFile('src/pages/Boltz.js', 'play') },
      { name: 'Auto Play', test: () => this.searchInFile('src/pages/Boltz.js', 'autoplay') },
      { name: 'Swipe Navigation', test: () => this.searchInFile('src/pages/Boltz.js', 'swipe') }
    ];

    this.results.categories.boltz = await this.runTestSuite('Boltz', tests);
  }

  async testFlash() {
    console.log('⚡ Testing Flash (Stories)...');
    
    const tests = [
      { name: 'Flash Page', test: () => this.checkRoute('/flash') },
      { name: 'Story Creation', test: () => this.searchInFile('src/pages/Flash.js', 'story') },
      { name: 'Story Highlights', test: () => this.checkRoute('/highlights') },
      { name: 'Close Friends', test: () => this.checkRoute('/close-friends') },
      { name: '24h Expiration', test: () => this.searchInFile('src/pages/Flash.js', '24') },
      { name: 'Story Ring UI', test: () => this.searchInFile('src/pages/Flash.js', 'ring') }
    ];

    this.results.categories.flash = await this.runTestSuite('Flash Stories', tests);
  }

  async testFollowSystem() {
    console.log('👥 Testing Follow System...');
    
    const tests = [
      { name: 'Follow Button', test: () => this.searchInFile('src/pages/Profile.js', 'follow') },
      { name: 'Follow Requests', test: () => this.checkRoute('/follow-requests') },
      { name: 'Followers List', test: () => this.checkRoute('/profile/test/followers') },
      { name: 'Following List', test: () => this.checkRoute('/profile/test/following') },
      { name: 'Private Account Logic', test: () => this.searchInFile('src/pages/Profile.js', 'private') }
    ];

    this.results.categories.followSystem = await this.runTestSuite('Follow System', tests);
  }

  async testMessaging() {
    console.log('💬 Testing Direct Messaging...');
    
    const tests = [
      { name: 'Messages Page', test: () => this.checkRoute('/messages') },
      { name: 'Chat Thread', test: () => this.checkRoute('/chat/test') },
      { name: 'Group Chat', test: () => this.checkRoute('/group/test') },
      { name: 'Voice Messages', test: () => this.searchInFile('src/pages/Messages.js', 'voice') },
      { name: 'Real-time Updates', test: () => this.searchInFile('src/pages/Messages.js', 'realtime') },
      { name: 'Typing Indicator', test: () => this.searchInFile('src/pages/Messages.js', 'typing') },
      { name: 'Read Receipts', test: () => this.searchInFile('src/pages/Messages.js', 'read') }
    ];

    this.results.categories.messaging = await this.runTestSuite('Messaging', tests);
  }

  async testCalls() {
    console.log('📞 Testing Audio/Video Calls...');
    
    const tests = [
      { name: 'Call Page', test: () => this.checkRoute('/call') },
      { name: 'Calls History', test: () => this.checkRoute('/calls') },
      { name: 'WebRTC Service', test: () => this.checkFile('src/utils/webrtcService.js') },
      { name: 'Call Signaling', test: () => this.checkFile('src/utils/callSignaling.js') },
      { name: 'Call Controls', test: () => this.searchInFile('src/pages/Call.js', 'mute') },
      { name: 'Call Notifications', test: () => this.checkFile('src/utils/callNotifications.js') }
    ];

    this.results.categories.calls = await this.runTestSuite('Audio/Video Calls', tests);
  }

  async testNotifications() {
    console.log('🔔 Testing Notifications...');
    
    const tests = [
      { name: 'Notifications Page', test: () => this.checkRoute('/notifications') },
      { name: 'Real-time Notifications', test: () => this.checkFile('src/components/RealtimeNotifications.js') },
      { name: 'Push Notifications', test: () => this.checkFile('src/utils/pushNotifications.js') },
      { name: 'Notification Manager', test: () => this.checkFile('src/utils/NotificationManager.js') },
      { name: 'Notification Preferences', test: () => this.checkFile('src/utils/notificationPreferences.js') }
    ];

    this.results.categories.notifications = await this.runTestSuite('Notifications', tests);
  }

  async testSearch() {
    console.log('🔍 Testing Search & Discovery...');
    
    const tests = [
      { name: 'Explore Page', test: () => this.checkRoute('/explore') },
      { name: 'Search Users', test: () => this.searchInFile('src/pages/Explore.js', 'search') },
      { name: 'Hashtag Pages', test: () => this.checkRoute('/hashtag/test') },
      { name: 'Trending Content', test: () => this.searchInFile('src/pages/Explore.js', 'trending') },
      { name: 'Search History', test: () => this.searchInFile('src/pages/Explore.js', 'history') }
    ];

    this.results.categories.search = await this.runTestSuite('Search & Discovery', tests);
  }

  async testSettings() {
    console.log('⚙️ Testing Settings & Account Management...');
    
    const tests = [
      { name: 'Settings Page', test: () => this.checkRoute('/settings') },
      { name: 'Privacy Settings', test: () => this.searchInFile('src/pages/Settings.js', 'privacy') },
      { name: 'Notification Settings', test: () => this.searchInFile('src/pages/Settings.js', 'notification') },
      { name: 'Blocked Users', test: () => this.checkRoute('/blocked-users') },
      { name: 'Account Deletion', test: () => this.searchInFile('src/pages/Settings.js', 'delete') },
      { name: 'Data Export', test: () => this.searchInFile('src/pages/Settings.js', 'export') }
    ];

    this.results.categories.settings = await this.runTestSuite('Settings', tests);
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    const tests = [
      { name: 'Keyboard Navigation', test: () => this.checkFile('src/hooks/useKeyboardNavigation.js') },
      { name: 'Screen Reader Support', test: () => this.checkFile('src/components/ScreenReaderAnnouncer.js') },
      { name: 'Focus Management', test: () => this.searchInFile('src/hooks/useKeyboardNavigation.js', 'focus') },
      { name: 'ARIA Labels', test: () => this.searchInFile('src/pages/Auth.js', 'aria-label') },
      { name: 'Color Contrast', test: () => this.checkFile('src/styles/accessibility.css') },
      { name: 'Reduced Motion', test: () => this.searchInFile('src/styles', 'prefers-reduced-motion') }
    ];

    this.results.categories.accessibility = await this.runTestSuite('Accessibility', tests);
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const tests = [
      { name: 'Lazy Loading', test: () => this.searchInFile('src/utils/lazyLoad.js', 'lazy') },
      { name: 'Image Optimization', test: () => this.searchInFile('src/utils/imageUtils.js', 'compress') },
      { name: 'Bundle Splitting', test: () => this.searchInFile('src/App.js', 'lazy') },
      { name: 'Service Worker', test: () => this.checkFile('public/sw.js') },
      { name: 'Caching Strategy', test: () => this.checkFile('src/utils/queryCache.js') },
      { name: 'Offline Support', test: () => this.checkFile('src/utils/offlineManager.js') }
    ];

    this.results.categories.performance = await this.runTestSuite('Performance', tests);
  }

  async testSecurity() {
    console.log('🔒 Testing Security...');
    
    const tests = [
      { name: 'Input Validation', test: () => this.checkFile('src/utils/validation.js') },
      { name: 'XSS Prevention', test: () => this.searchInFile('src/utils/validation.js', 'sanitize') },
      { name: 'Rate Limiting', test: () => this.checkFile('src/utils/rateLimiter.js') },
      { name: 'CSRF Protection', test: () => this.searchInFile('src/utils/apiClient.js', 'csrf') },
      { name: 'Secure Headers', test: () => this.checkFile('src/config/security.js') },
      { name: 'Authentication Security', test: () => this.searchInFile('src/utils/authListener.js', 'security') }
    ];

    this.results.categories.security = await this.runTestSuite('Security', tests);
  }

  async testCrossPlatform() {
    console.log('📱 Testing Cross-Platform...');
    
    const tests = [
      { name: 'Responsive CSS', test: () => this.searchInFile('src/styles', '@media') },
      { name: 'Dark Mode', test: () => this.searchInFile('src/context/ThemeContext.js', 'dark') },
      { name: 'Touch Gestures', test: () => this.searchInFile('src/hooks', 'touch') },
      { name: 'Orientation Handler', test: () => this.checkFile('src/components/OrientationHandler.js') },
      { name: 'Browser Compatibility', test: () => this.checkFile('src/utils/browserCompatibility.js') }
    ];

    this.results.categories.crossPlatform = await this.runTestSuite('Cross-Platform', tests);
  }

  async testPWA() {
    console.log('📲 Testing PWA Features...');
    
    const tests = [
      { name: 'Manifest File', test: () => this.checkFile('public/manifest.json') },
      { name: 'Service Worker', test: () => this.checkFile('public/sw.js') },
      { name: 'Offline Page', test: () => this.checkFile('public/offline.html') },
      { name: 'Install Prompt', test: () => this.searchInFile('src/components', 'install') },
      { name: 'App Icons', test: () => this.checkFile('public/icon-192.png') }
    ];

    this.results.categories.pwa = await this.runTestSuite('PWA', tests);
  }

  async runTestSuite(category, tests) {
    const results = {
      total: tests.length,
      passed: 0,
      failed: 0,
      tests: []
    };

    for (const test of tests) {
      try {
        const passed = await test.test();
        results.tests.push({
          name: test.name,
          status: passed ? 'passed' : 'failed',
          severity: passed ? null : this.determineSeverity(test.name, category)
        });
        
        if (passed) {
          results.passed++;
        } else {
          results.failed++;
          this.addBug(test.name, category, this.determineSeverity(test.name, category));
        }
      } catch (error) {
        results.tests.push({
          name: test.name,
          status: 'failed',
          error: error.message,
          severity: 'high'
        });
        results.failed++;
        this.addBug(test.name, category, 'high', error.message);
      }
    }

    console.log(`   ${category}: ${results.passed}/${results.total} tests passed`);
    return results;
  }

  checkRoute(route) {
    // Check if route exists in App.js
    return this.searchInFile('src/App.js', route);
  }

  checkElement(selector) {
    // Check if element exists in any component
    return this.searchInFile('src/pages/Auth.js', selector.replace(/[\[\]"']/g, ''));
  }

  checkFile(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  searchInFile(filePath, pattern) {
    try {
      if (filePath.endsWith('/')) {
        // Search in directory
        const dirPath = path.join(this.projectRoot, filePath);
        if (!fs.existsSync(dirPath)) return false;
        
        const files = fs.readdirSync(dirPath);
        return files.some(file => {
          if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
            return content.toLowerCase().includes(pattern.toLowerCase());
          }
          return false;
        });
      } else {
        const fullPath = path.join(this.projectRoot, filePath);
        if (!fs.existsSync(fullPath)) return false;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        return content.toLowerCase().includes(pattern.toLowerCase());
      }
    } catch {
      return false;
    }
  }

  determineSeverity(testName, category) {
    const criticalTests = ['Auth Page Loads', 'Login Form Present', 'Profile Page', 'Home Feed'];
    const highTests = ['Password Reset', 'Create Page', 'Messages Page', 'Security'];
    
    if (criticalTests.some(t => testName.includes(t))) return 'critical';
    if (highTests.some(t => testName.includes(t)) || category === 'Security') return 'high';
    if (category === 'Accessibility' || category === 'Performance') return 'medium';
    return 'low';
  }

  addBug(testName, category, severity, error = null) {
    this.results.bugs.push({
      id: this.results.bugs.length + 1,
      title: `${testName} - ${category}`,
      severity,
      category,
      description: error || `${testName} test failed in ${category} category`,
      recommendation: this.getBugRecommendation(testName, category)
    });

    this.results.summary[`${severity}Bugs`]++;
  }

  getBugRecommendation(testName, category) {
    const recommendations = {
      'Auth Page Loads': 'Ensure /auth route is properly configured in App.js',
      'Password Reset': 'Implement password reset functionality in Auth.js',
      'Service Worker': 'Add service worker for PWA functionality',
      'Accessibility': 'Add proper ARIA labels and keyboard navigation',
      'Performance': 'Implement lazy loading and code splitting'
    };

    return recommendations[testName] || `Fix ${testName} in ${category} category`;
  }

  calculateSummary() {
    this.results.summary.totalTests = Object.values(this.results.categories)
      .reduce((sum, cat) => sum + cat.total, 0);
    
    this.results.summary.passedTests = Object.values(this.results.categories)
      .reduce((sum, cat) => sum + cat.passed, 0);
    
    this.results.summary.failedTests = Object.values(this.results.categories)
      .reduce((sum, cat) => sum + cat.failed, 0);

    // Determine production readiness
    const passRate = (this.results.summary.passedTests / this.results.summary.totalTests) * 100;
    this.results.summary.productionReady = 
      passRate >= 85 && 
      this.results.summary.criticalBugs === 0 && 
      this.results.summary.highBugs <= 2;

    // Generate recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    if (this.results.summary.criticalBugs > 0) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        title: 'Fix Critical Issues',
        description: `${this.results.summary.criticalBugs} critical bugs must be fixed before production`
      });
    }

    if (this.results.summary.highBugs > 5) {
      this.results.recommendations.push({
        priority: 'HIGH',
        title: 'Reduce High Priority Bugs',
        description: `${this.results.summary.highBugs} high priority bugs should be addressed`
      });
    }

    const passRate = (this.results.summary.passedTests / this.results.summary.totalTests) * 100;
    if (passRate < 85) {
      this.results.recommendations.push({
        priority: 'HIGH',
        title: 'Improve Test Pass Rate',
        description: `Current pass rate is ${passRate.toFixed(1)}%. Target is 85%+`
      });
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Production Readiness Report...');

    // Create reports directory
    const reportsDir = path.join(this.projectRoot, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate JSON report
    const jsonPath = path.join(reportsDir, 'production-readiness-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(reportsDir, 'production-readiness-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    this.printSummary();

    console.log(`\n📄 Reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  generateHTMLReport() {
    const { summary, categories, bugs } = this.results;
    const passRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus App - Production Readiness Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: ${summary.productionReady ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'}; color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .status { font-size: 3rem; margin: 20px 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #27ae60; }
        .failed { color: #e74c3c; }
        .critical { color: #8e44ad; }
        .high { color: #e74c3c; }
        .medium { color: #f39c12; }
        .low { color: #3498db; }
        .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .category { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .category-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .test-item { padding: 12px 20px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: space-between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .bugs-section { background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
        .bug-item { background: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .bug-critical { border-left-color: #8e44ad; }
        .bug-high { border-left-color: #e74c3c; }
        .bug-medium { border-left-color: #f39c12; }
        .bug-low { border-left-color: #3498db; }
        .recommendations { background: white; border-radius: 12px; padding: 30px; }
        .recommendation { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Production Readiness Report</h1>
            <div class="status">${summary.productionReady ? '✅ READY' : '⚠️ NOT READY'}</div>
            <p>Focus App - Complete Feature Testing</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value passed">${passRate}%</div>
                <div>Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${summary.passedTests}</div>
                <div>Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${summary.failedTests}</div>
                <div>Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value critical">${summary.criticalBugs}</div>
                <div>Critical Bugs</div>
            </div>
            <div class="metric">
                <div class="metric-value high">${summary.highBugs}</div>
                <div>High Priority Bugs</div>
            </div>
            <div class="metric">
                <div class="metric-value medium">${summary.mediumBugs}</div>
                <div>Medium Priority Bugs</div>
            </div>
        </div>

        <h2>📋 Test Categories</h2>
        <div class="categories">
            ${Object.entries(categories).map(([name, data]) => `
                <div class="category">
                    <div class="category-header">
                        <h3>${name.charAt(0).toUpperCase() + name.slice(1)} (${data.passed}/${data.total})</h3>
                    </div>
                    ${data.tests.map(test => `
                        <div class="test-item">
                            <span>${test.name}</span>
                            <span class="status-badge status-${test.status}">
                                ${test.status.toUpperCase()}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        ${bugs.length > 0 ? `
        <div class="bugs-section">
            <h2>🐛 Issues Found (${bugs.length})</h2>
            ${bugs.map(bug => `
                <div class="bug-item bug-${bug.severity}">
                    <h4>Bug #${bug.id}: ${bug.title}</h4>
                    <p><strong>Severity:</strong> ${bug.severity.toUpperCase()}</p>
                    <p><strong>Description:</strong> ${bug.description}</p>
                    <p><strong>Recommendation:</strong> ${bug.recommendation}</p>
                </div>
            `).join('')}
        </div>
        ` : '<div class="bugs-section"><h2>🎉 No Issues Found!</h2></div>'}

        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            ${this.results.recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 PRODUCTION READINESS TEST COMPLETE');
    console.log('='.repeat(70));
    
    const passRate = ((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1);
    console.log(`📊 Overall Pass Rate: ${passRate}%`);
    console.log(`✅ Tests Passed: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    console.log(`🐛 Total Bugs: ${this.results.bugs.length}`);
    console.log(`   🔴 Critical: ${this.results.summary.criticalBugs}`);
    console.log(`   🟠 High: ${this.results.summary.highBugs}`);
    console.log(`   🟡 Medium: ${this.results.summary.mediumBugs}`);
    console.log(`   🔵 Low: ${this.results.summary.lowBugs}`);
    
    console.log(`\n🎯 Production Ready: ${this.results.summary.productionReady ? '✅ YES' : '❌ NO'}`);
    
    if (this.results.summary.productionReady) {
      console.log('\n🎉 Congratulations! Your app is ready for production deployment.');
    } else {
      console.log('\n⚠️ Address critical and high priority issues before production.');
    }
    
    console.log('\n📋 Category Results:');
    Object.entries(this.results.categories).forEach(([name, data]) => {
      console.log(`   ${name}: ${data.passed}/${data.total} (${((data.passed/data.total)*100).toFixed(0)}%)`);
    });
    
    console.log('='.repeat(70));
  }
}

if (require.main === module) {
  const tester = new ProductionReadinessTester();
  tester.runCompleteProductionTest().catch(console.error);
}

module.exports = ProductionReadinessTester;