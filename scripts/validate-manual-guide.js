const fs = require('fs');
const path = require('path');

class ManualGuideValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeatures: 34,
        implementedFeatures: 0,
        completionRate: 0
      },
      categories: {}
    };
  }

  validateAllFeatures() {
    console.log('🔍 Validating all Manual Testing Guide features...\n');

    const categories = [
      { name: 'Authentication', features: this.validateAuthentication() },
      { name: 'Posts', features: this.validatePosts() },
      { name: 'Boltz', features: this.validateBoltz() },
      { name: 'Flash Stories', features: this.validateFlash() },
      { name: 'Messaging', features: this.validateMessaging() },
      { name: 'Audio/Video Calls', features: this.validateCalls() },
      { name: 'Search & Discovery', features: this.validateSearch() },
      { name: 'Profile Management', features: this.validateProfile() },
      { name: 'Accessibility', features: this.validateAccessibility() }
    ];

    let totalImplemented = 0;

    categories.forEach(category => {
      const implemented = category.features.filter(f => f.implemented).length;
      totalImplemented += implemented;
      
      this.results.categories[category.name] = {
        total: category.features.length,
        implemented,
        features: category.features
      };

      console.log(`✅ ${category.name}: ${implemented}/${category.features.length} features`);
    });

    this.results.summary.implementedFeatures = totalImplemented;
    this.results.summary.completionRate = Math.round((totalImplemented / this.results.summary.totalFeatures) * 100);

    this.generateReport();
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  searchInFile(filePath, pattern) {
    if (!this.fileExists(filePath)) return false;
    try {
      const content = fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8');
      return content.includes(pattern);
    } catch {
      return false;
    }
  }

  validateAuthentication() {
    return [
      {
        name: 'User Registration',
        implemented: this.fileExists('src/pages/Auth.js') && this.searchInFile('src/pages/Auth.js', 'signUp'),
        file: 'src/pages/Auth.js'
      },
      {
        name: 'User Login',
        implemented: this.fileExists('src/pages/Auth.js') && this.searchInFile('src/pages/Auth.js', 'signIn'),
        file: 'src/pages/Auth.js'
      },
      {
        name: 'Password Reset',
        implemented: this.searchInFile('src/pages/Auth.js', 'resetPassword') || this.searchInFile('src/pages/Auth.js', 'forgot'),
        file: 'src/pages/Auth.js'
      },
      {
        name: 'Social Login',
        implemented: this.searchInFile('src/pages/Auth.js', 'OAuth') || this.searchInFile('src/pages/Auth.js', 'google'),
        file: 'src/pages/Auth.js'
      },
      {
        name: 'Logout Functionality',
        implemented: this.fileExists('src/utils/logout.js'),
        file: 'src/utils/logout.js'
      }
    ];
  }

  validatePosts() {
    return [
      {
        name: 'Create Post Page',
        implemented: this.fileExists('src/pages/Create.js') || this.fileExists('src/pages/CreateMultiType.js'),
        file: 'src/pages/Create.js'
      },
      {
        name: 'Photo Upload',
        implemented: this.searchInFile('src/pages/Create.js', 'image') || this.searchInFile('src/pages/CreateMultiType.js', 'image'),
        file: 'src/pages/Create.js'
      },
      {
        name: 'Video Upload',
        implemented: this.searchInFile('src/pages/Create.js', 'video') || this.searchInFile('src/pages/CreateMultiType.js', 'video'),
        file: 'src/pages/Create.js'
      },
      {
        name: 'Carousel Posts',
        implemented: this.searchInFile('src/pages/Create.js', 'carousel') || this.searchInFile('src/pages/CreateMultiType.js', 'multiple'),
        file: 'src/pages/Create.js'
      },
      {
        name: 'Like Posts',
        implemented: this.searchInFile('src/components/Post.js', 'like') || this.searchInFile('src/pages/Home.js', 'like'),
        file: 'src/components/'
      },
      {
        name: 'Comment on Posts',
        implemented: this.searchInFile('src/components/Post.js', 'comment') || this.searchInFile('src/pages/Home.js', 'comment'),
        file: 'src/components/'
      }
    ];
  }

  validateBoltz() {
    return [
      {
        name: 'Boltz Page',
        implemented: this.fileExists('src/pages/Boltz.js'),
        file: 'src/pages/Boltz.js'
      },
      {
        name: 'Record Video',
        implemented: this.searchInFile('src/pages/Boltz.js', 'record') || this.searchInFile('src/pages/Boltz.js', 'camera'),
        file: 'src/pages/Boltz.js'
      },
      {
        name: 'Video Controls',
        implemented: this.searchInFile('src/pages/Boltz.js', 'play') || this.searchInFile('src/pages/Boltz.js', 'pause'),
        file: 'src/pages/Boltz.js'
      }
    ];
  }

  validateFlash() {
    return [
      {
        name: 'Flash Stories Page',
        implemented: this.fileExists('src/pages/Flash.js'),
        file: 'src/pages/Flash.js'
      },
      {
        name: 'Create Story',
        implemented: this.searchInFile('src/pages/Flash.js', 'story'),
        file: 'src/pages/Flash.js'
      },
      {
        name: 'Story Highlights',
        implemented: this.fileExists('src/pages/Highlights.js'),
        file: 'src/pages/Highlights.js'
      }
    ];
  }

  validateMessaging() {
    return [
      {
        name: 'Messages Page',
        implemented: this.fileExists('src/pages/Messages.js'),
        file: 'src/pages/Messages.js'
      },
      {
        name: 'Direct Messages',
        implemented: this.searchInFile('src/pages/Messages.js', 'message'),
        file: 'src/pages/Messages.js'
      },
      {
        name: 'Group Chat',
        implemented: this.fileExists('src/pages/GroupChat.js'),
        file: 'src/pages/GroupChat.js'
      },
      {
        name: 'Voice Messages',
        implemented: this.searchInFile('src/pages/Messages.js', 'voice') || this.searchInFile('src/pages/Messages.js', 'audio'),
        file: 'src/pages/Messages.js'
      }
    ];
  }

  validateCalls() {
    return [
      {
        name: 'Call Pages',
        implemented: this.fileExists('src/pages/Call.js') && this.fileExists('src/pages/Calls.js'),
        file: 'src/pages/Call.js'
      },
      {
        name: 'WebRTC Integration',
        implemented: this.fileExists('src/utils/webrtcService.js') && this.fileExists('src/hooks/useWebRTCCall.js'),
        file: 'src/utils/webrtcService.js'
      },
      {
        name: 'Call Signaling',
        implemented: this.fileExists('src/utils/callSignaling.js'),
        file: 'src/utils/callSignaling.js'
      }
    ];
  }

  validateSearch() {
    return [
      {
        name: 'Explore Page',
        implemented: this.fileExists('src/pages/Explore.js'),
        file: 'src/pages/Explore.js'
      },
      {
        name: 'Search Users',
        implemented: this.searchInFile('src/pages/Explore.js', 'search'),
        file: 'src/pages/Explore.js'
      },
      {
        name: 'Hashtag Support',
        implemented: this.fileExists('src/pages/HashtagPage.js'),
        file: 'src/pages/HashtagPage.js'
      }
    ];
  }

  validateProfile() {
    return [
      {
        name: 'Profile Page',
        implemented: this.fileExists('src/pages/Profile.js'),
        file: 'src/pages/Profile.js'
      },
      {
        name: 'Edit Profile',
        implemented: this.fileExists('src/pages/EditProfile.js'),
        file: 'src/pages/EditProfile.js'
      },
      {
        name: 'Settings Page',
        implemented: this.fileExists('src/pages/Settings.js'),
        file: 'src/pages/Settings.js'
      },
      {
        name: 'Privacy Settings',
        implemented: this.searchInFile('src/pages/Settings.js', 'privacy'),
        file: 'src/pages/Settings.js'
      }
    ];
  }

  validateAccessibility() {
    return [
      {
        name: 'Keyboard Navigation',
        implemented: this.fileExists('src/hooks/useKeyboardNavigation.js'),
        file: 'src/hooks/useKeyboardNavigation.js'
      },
      {
        name: 'Screen Reader Support',
        implemented: this.fileExists('src/components/ScreenReaderAnnouncer.js'),
        file: 'src/components/ScreenReaderAnnouncer.js'
      },
      {
        name: 'Focus Management',
        implemented: this.searchInFile('src/hooks/useKeyboardNavigation.js', 'focus'),
        file: 'src/hooks/'
      }
    ];
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 MANUAL TESTING GUIDE VALIDATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Feature Completion: ${this.results.summary.completionRate}%`);
    console.log(`✅ Implemented: ${this.results.summary.implementedFeatures}/${this.results.summary.totalFeatures}`);
    
    if (this.results.summary.completionRate === 100) {
      console.log('\n🎉 Perfect! All Manual Testing Guide features are implemented!');
    } else if (this.results.summary.completionRate >= 90) {
      console.log('\n🌟 Excellent! Almost all features are implemented.');
    } else {
      console.log('\n👍 Good progress! Continue implementing remaining features.');
    }

    console.log('\n📋 Feature Categories:');
    Object.entries(this.results.categories).forEach(([category, data]) => {
      console.log(`   ${category}: ${data.implemented}/${data.total} ✅`);
    });

    // Generate detailed HTML report
    const htmlReport = this.generateHTMLReport();
    const reportsDir = path.join(this.projectRoot, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const htmlPath = path.join(reportsDir, 'manual-guide-validation.html');
    const jsonPath = path.join(reportsDir, 'manual-guide-validation.json');
    
    fs.writeFileSync(htmlPath, htmlReport);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    console.log('\n📄 Detailed reports generated:');
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   JSON: ${jsonPath}`);
    console.log('='.repeat(60));
  }

  generateHTMLReport() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual Testing Guide - Feature Validation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .completion-rate { font-size: 4rem; font-weight: bold; margin: 20px 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2rem; font-weight: bold; color: #27ae60; }
        .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .category { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .category-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .feature { padding: 15px 20px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: space-between; align-items: center; }
        .feature:last-child { border-bottom: none; }
        .status { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .implemented { background: #d4edda; color: #155724; }
        .missing { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Manual Testing Guide Validation</h1>
            <div class="completion-rate">${this.results.summary.completionRate}%</div>
            <p>Feature Implementation Complete</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.results.summary.implementedFeatures}</div>
                <div>Features Implemented</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.summary.totalFeatures}</div>
                <div>Total Features</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Object.keys(this.results.categories).length}</div>
                <div>Categories</div>
            </div>
        </div>

        <div class="categories">
            ${Object.entries(this.results.categories).map(([name, data]) => `
                <div class="category">
                    <div class="category-header">
                        <h3>${name} (${data.implemented}/${data.total})</h3>
                    </div>
                    ${data.features.map(feature => `
                        <div class="feature">
                            <span>${feature.name}</span>
                            <span class="status ${feature.implemented ? 'implemented' : 'missing'}">
                                ${feature.implemented ? '✅ IMPLEMENTED' : '❌ MISSING'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
}

if (require.main === module) {
  const validator = new ManualGuideValidator();
  validator.validateAllFeatures();
}

module.exports = ManualGuideValidator;