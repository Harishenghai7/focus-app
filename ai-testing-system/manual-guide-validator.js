const fs = require('fs');
const path = require('path');

class ManualGuideValidator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeatures: 0,
        implementedFeatures: 0,
        missingFeatures: 0,
        partialFeatures: 0,
        bugs: 0,
        errors: 0
      },
      features: [],
      missing: [],
      bugs: [],
      errors: []
    };
  }

  // Check if file exists
  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  // Check if component exists in source
  componentExists(componentName) {
    const possiblePaths = [
      `src/components/${componentName}.js`,
      `src/pages/${componentName}.js`,
      `src/components/${componentName}/index.js`,
      `src/pages/${componentName}/index.js`
    ];
    return possiblePaths.some(p => this.fileExists(p));
  }

  // Search for code patterns
  searchInFiles(pattern, directory = 'src') {
    const results = [];
    const searchDir = path.join(this.projectRoot, directory);
    
    if (!fs.existsSync(searchDir)) return results;

    const searchRecursive = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          searchRecursive(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(pattern)) {
              results.push(path.relative(this.projectRoot, filePath));
            }
          } catch (e) {
            // Skip files that can't be read
          }
        }
      });
    };

    searchRecursive(searchDir);
    return results;
  }

  // Validate authentication features
  validateAuthentication() {
    const features = [
      {
        name: 'User Registration',
        check: () => this.searchInFiles('signUp').length > 0 || this.searchInFiles('register').length > 0,
        files: ['src/pages/Auth.js']
      },
      {
        name: 'User Login',
        check: () => this.searchInFiles('signIn').length > 0 || this.searchInFiles('login').length > 0,
        files: ['src/pages/Auth.js']
      },
      {
        name: 'Password Reset',
        check: () => this.searchInFiles('resetPassword').length > 0 || this.searchInFiles('forgot').length > 0,
        files: ['src/pages/Auth.js']
      },
      {
        name: 'Social Login',
        check: () => this.searchInFiles('google').length > 0 || this.searchInFiles('github').length > 0,
        files: ['src/pages/Auth.js']
      },
      {
        name: 'Logout Functionality',
        check: () => this.searchInFiles('signOut').length > 0 || this.searchInFiles('logout').length > 0,
        files: ['src/utils/logout.js']
      }
    ];

    return this.validateFeatureGroup('Authentication', features);
  }

  // Validate posts features
  validatePosts() {
    const features = [
      {
        name: 'Create Text Post',
        check: () => this.componentExists('Create') || this.componentExists('CreatePost'),
        files: ['src/pages/Create.js', 'src/pages/CreateMultiType.js']
      },
      {
        name: 'Create Photo Post',
        check: () => this.searchInFiles('image').length > 0 && this.searchInFiles('upload').length > 0,
        files: ['src/pages/Create.js']
      },
      {
        name: 'Create Video Post',
        check: () => this.searchInFiles('video').length > 0 && this.searchInFiles('upload').length > 0,
        files: ['src/pages/Create.js']
      },
      {
        name: 'Carousel Posts',
        check: () => this.searchInFiles('carousel').length > 0 || this.searchInFiles('multiple').length > 0,
        files: ['src/pages/Create.js']
      },
      {
        name: 'Like Posts',
        check: () => this.searchInFiles('like').length > 0,
        files: ['src/components/', 'src/pages/']
      },
      {
        name: 'Comment on Posts',
        check: () => this.searchInFiles('comment').length > 0,
        files: ['src/components/', 'src/pages/']
      }
    ];

    return this.validateFeatureGroup('Posts', features);
  }

  // Validate Boltz features
  validateBoltz() {
    const features = [
      {
        name: 'Boltz Page',
        check: () => this.componentExists('Boltz'),
        files: ['src/pages/Boltz.js']
      },
      {
        name: 'Record Boltz Video',
        check: () => this.searchInFiles('record').length > 0 || this.searchInFiles('camera').length > 0,
        files: ['src/pages/Boltz.js']
      },
      {
        name: 'Video Controls',
        check: () => this.searchInFiles('play').length > 0 || this.searchInFiles('pause').length > 0,
        files: ['src/pages/Boltz.js']
      }
    ];

    return this.validateFeatureGroup('Boltz', features);
  }

  // Validate Flash Stories
  validateFlash() {
    const features = [
      {
        name: 'Flash Stories Page',
        check: () => this.componentExists('Flash'),
        files: ['src/pages/Flash.js']
      },
      {
        name: 'Create Story',
        check: () => this.searchInFiles('story').length > 0,
        files: ['src/pages/Flash.js']
      },
      {
        name: 'Story Highlights',
        check: () => this.componentExists('Highlights') || this.searchInFiles('highlight').length > 0,
        files: ['src/pages/Highlights.js']
      }
    ];

    return this.validateFeatureGroup('Flash Stories', features);
  }

  // Validate messaging features
  validateMessaging() {
    const features = [
      {
        name: 'Messages Page',
        check: () => this.componentExists('Messages'),
        files: ['src/pages/Messages.js']
      },
      {
        name: 'Direct Messages',
        check: () => this.searchInFiles('message').length > 0,
        files: ['src/pages/Messages.js']
      },
      {
        name: 'Group Chat',
        check: () => this.componentExists('GroupChat'),
        files: ['src/pages/GroupChat.js']
      },
      {
        name: 'Voice Messages',
        check: () => this.searchInFiles('voice').length > 0 || this.searchInFiles('audio').length > 0,
        files: ['src/pages/Messages.js']
      }
    ];

    return this.validateFeatureGroup('Messaging', features);
  }

  // Validate calls features
  validateCalls() {
    const features = [
      {
        name: 'Audio/Video Calls',
        check: () => this.componentExists('Call') || this.componentExists('Calls'),
        files: ['src/pages/Call.js', 'src/pages/Calls.js']
      },
      {
        name: 'WebRTC Integration',
        check: () => this.searchInFiles('webrtc').length > 0 || this.searchInFiles('peer').length > 0,
        files: ['src/utils/webrtcService.js', 'src/hooks/useWebRTCCall.js']
      },
      {
        name: 'Call Signaling',
        check: () => this.fileExists('src/utils/callSignaling.js'),
        files: ['src/utils/callSignaling.js']
      }
    ];

    return this.validateFeatureGroup('Audio/Video Calls', features);
  }

  // Validate search and discovery
  validateSearch() {
    const features = [
      {
        name: 'Explore Page',
        check: () => this.componentExists('Explore'),
        files: ['src/pages/Explore.js']
      },
      {
        name: 'Search Users',
        check: () => this.searchInFiles('search').length > 0,
        files: ['src/pages/Explore.js']
      },
      {
        name: 'Hashtag Support',
        check: () => this.searchInFiles('hashtag').length > 0 || this.componentExists('HashtagPage'),
        files: ['src/pages/HashtagPage.js']
      }
    ];

    return this.validateFeatureGroup('Search & Discovery', features);
  }

  // Validate profile management
  validateProfile() {
    const features = [
      {
        name: 'Profile Page',
        check: () => this.componentExists('Profile'),
        files: ['src/pages/Profile.js']
      },
      {
        name: 'Edit Profile',
        check: () => this.componentExists('EditProfile'),
        files: ['src/pages/EditProfile.js']
      },
      {
        name: 'Settings Page',
        check: () => this.componentExists('Settings'),
        files: ['src/pages/Settings.js']
      },
      {
        name: 'Privacy Settings',
        check: () => this.searchInFiles('privacy').length > 0,
        files: ['src/pages/Settings.js']
      }
    ];

    return this.validateFeatureGroup('Profile Management', features);
  }

  // Validate accessibility features
  validateAccessibility() {
    const features = [
      {
        name: 'Keyboard Navigation',
        check: () => this.searchInFiles('keyboard').length > 0 || this.searchInFiles('tabIndex').length > 0,
        files: ['src/hooks/useKeyboardNavigation.js']
      },
      {
        name: 'Screen Reader Support',
        check: () => this.searchInFiles('aria-').length > 0 || this.searchInFiles('ScreenReader').length > 0,
        files: ['src/components/ScreenReaderAnnouncer.js']
      },
      {
        name: 'Focus Management',
        check: () => this.searchInFiles('focus').length > 0,
        files: ['src/components/', 'src/hooks/']
      }
    ];

    return this.validateFeatureGroup('Accessibility', features);
  }

  // Validate feature group
  validateFeatureGroup(groupName, features) {
    const groupResult = {
      name: groupName,
      total: features.length,
      implemented: 0,
      missing: 0,
      features: []
    };

    features.forEach(feature => {
      const isImplemented = feature.check();
      const status = isImplemented ? 'implemented' : 'missing';
      
      const featureResult = {
        name: feature.name,
        status,
        files: feature.files,
        exists: isImplemented
      };

      groupResult.features.push(featureResult);
      
      if (isImplemented) {
        groupResult.implemented++;
      } else {
        groupResult.missing++;
        this.results.missing.push({
          feature: feature.name,
          group: groupName,
          expectedFiles: feature.files
        });
      }
    });

    return groupResult;
  }

  // Check for common bugs and errors
  checkForBugs() {
    const bugs = [];

    // Check for missing error boundaries
    if (!this.componentExists('ErrorBoundary')) {
      bugs.push({
        type: 'Missing Component',
        severity: 'High',
        message: 'ErrorBoundary component not found',
        recommendation: 'Add error boundary for better error handling'
      });
    }

    // Check for missing offline support
    if (!this.searchInFiles('offline').length) {
      bugs.push({
        type: 'Missing Feature',
        severity: 'Medium',
        message: 'Offline support not implemented',
        recommendation: 'Add offline functionality for better UX'
      });
    }

    // Check for missing service worker
    if (!this.fileExists('public/sw.js') && !this.searchInFiles('serviceWorker').length) {
      bugs.push({
        type: 'Missing PWA Feature',
        severity: 'Medium',
        message: 'Service Worker not found',
        recommendation: 'Add service worker for PWA functionality'
      });
    }

    // Check for missing environment variables
    if (!this.fileExists('.env') && !this.fileExists('.env.local')) {
      bugs.push({
        type: 'Configuration Issue',
        severity: 'High',
        message: 'Environment configuration file missing',
        recommendation: 'Create .env file with required variables'
      });
    }

    return bugs;
  }

  // Generate comprehensive report
  async generateReport() {
    console.log('🔍 Validating Focus app against Manual Testing Guide...\n');

    // Validate all feature groups
    const featureGroups = [
      this.validateAuthentication(),
      this.validatePosts(),
      this.validateBoltz(),
      this.validateFlash(),
      this.validateMessaging(),
      this.validateCalls(),
      this.validateSearch(),
      this.validateProfile(),
      this.validateAccessibility()
    ];

    // Check for bugs
    const bugs = this.checkForBugs();

    // Calculate summary
    let totalFeatures = 0;
    let implementedFeatures = 0;

    featureGroups.forEach(group => {
      totalFeatures += group.total;
      implementedFeatures += group.implemented;
      this.results.features.push(group);
    });

    this.results.summary = {
      totalFeatures,
      implementedFeatures,
      missingFeatures: totalFeatures - implementedFeatures,
      partialFeatures: 0,
      bugs: bugs.length,
      errors: 0,
      completionRate: Math.round((implementedFeatures / totalFeatures) * 100)
    };

    this.results.bugs = bugs;

    return this.results;
  }

  // Generate HTML report
  generateHTMLReport(results) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Manual Guide Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .feature-group { margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; }
        .group-header { background: #f1f5f9; padding: 15px; font-weight: bold; }
        .feature { padding: 10px 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
        .implemented { color: #059669; }
        .missing { color: #dc2626; }
        .bug { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Manual Testing Guide Validation Report</h1>
        <p>Generated: ${results.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${results.summary.completionRate}%</div>
            <div>Completion Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${results.summary.implementedFeatures}</div>
            <div>Implemented Features</div>
        </div>
        <div class="metric">
            <div class="metric-value">${results.summary.missingFeatures}</div>
            <div>Missing Features</div>
        </div>
        <div class="metric">
            <div class="metric-value">${results.summary.bugs}</div>
            <div>Issues Found</div>
        </div>
    </div>

    ${results.features.map(group => `
    <div class="feature-group">
        <div class="group-header">
            ${group.name} (${group.implemented}/${group.total})
        </div>
        ${group.features.map(feature => `
        <div class="feature">
            <span>${feature.name}</span>
            <span class="${feature.status}">${feature.status.toUpperCase()}</span>
        </div>
        `).join('')}
    </div>
    `).join('')}

    ${results.bugs.length > 0 ? `
    <h2>🐛 Issues Found</h2>
    ${results.bugs.map(bug => `
    <div class="bug">
        <strong>${bug.type}</strong> (${bug.severity}): ${bug.message}
        <br><em>Recommendation: ${bug.recommendation}</em>
    </div>
    `).join('')}
    ` : '<h2>✅ No Issues Found</h2>'}

</body>
</html>`;

    return html;
  }
}

module.exports = ManualGuideValidator;