const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ManualGuideTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        completionRate: 0
      },
      features: {},
      report: null
    };
  }

  async runCompleteTest() {
    console.log('🧪 Running Complete Manual Testing Guide Validation...\n');

    try {
      // Run the comprehensive test
      console.log('📋 Executing Cypress tests for all Manual Guide features...');
      
      const cypressCommand = 'npx cypress run --spec "cypress/e2e/manual-guide-complete.cy.js" --reporter json';
      
      try {
        const output = execSync(cypressCommand, {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 300000 // 5 minutes
        });
        
        this.processCypressResults(JSON.parse(output));
      } catch (error) {
        this.processCypressError(error);
      }

      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
    }
  }

  processCypressResults(results) {
    console.log('📊 Processing test results...');
    
    if (results.runs && results.runs.length > 0) {
      const run = results.runs[0];
      
      this.results.summary.totalTests = run.stats.tests || 0;
      this.results.summary.passedTests = run.stats.passes || 0;
      this.results.summary.failedTests = run.stats.failures || 0;
      this.results.summary.completionRate = this.results.summary.totalTests > 0 
        ? Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100)
        : 0;

      // Process individual tests
      if (run.tests) {
        this.categorizeTests(run.tests);
      }
    }
  }

  categorizeTests(tests) {
    const categories = {
      'Authentication': [],
      'Posts': [],
      'Boltz': [],
      'Flash Stories': [],
      'Messaging': [],
      'Audio/Video Calls': [],
      'Search & Discovery': [],
      'Profile Management': [],
      'Accessibility': [],
      'Performance': [],
      'Error Handling': []
    };

    tests.forEach(test => {
      const title = test.title[0] || 'Unknown';
      const category = this.getCategoryFromTitle(title);
      
      if (categories[category]) {
        categories[category].push({
          name: test.title[test.title.length - 1],
          status: test.state,
          duration: test.duration,
          error: test.err ? test.err.message : null
        });
      }
    });

    this.results.features = categories;
  }

  getCategoryFromTitle(title) {
    if (title.includes('Authentication')) return 'Authentication';
    if (title.includes('Posts')) return 'Posts';
    if (title.includes('Boltz')) return 'Boltz';
    if (title.includes('Flash')) return 'Flash Stories';
    if (title.includes('Messaging')) return 'Messaging';
    if (title.includes('Calls')) return 'Audio/Video Calls';
    if (title.includes('Search') || title.includes('Discovery')) return 'Search & Discovery';
    if (title.includes('Profile')) return 'Profile Management';
    if (title.includes('Accessibility')) return 'Accessibility';
    if (title.includes('Performance')) return 'Performance';
    if (title.includes('Error')) return 'Error Handling';
    return 'Other';
  }

  processCypressError(error) {
    console.log('⚠️ Test execution encountered issues');
    
    const errorOutput = error.stdout || error.stderr || error.message;
    
    if (errorOutput.includes('ECONNREFUSED')) {
      console.log('❌ Application server not running. Please start with: npm start');
    } else if (errorOutput.includes('spec files')) {
      console.log('❌ Test files not found');
    } else {
      console.log('❌ Test execution failed:', errorOutput.substring(0, 200));
    }
    
    this.results.summary.totalTests = 1;
    this.results.summary.failedTests = 1;
  }

  async generateReport() {
    console.log('📄 Generating comprehensive report...');

    // Create reports directory
    const reportsDir = path.join(this.projectRoot, 'cypress', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate JSON report
    const jsonReport = path.join(reportsDir, 'manual-guide-validation.json');
    fs.writeFileSync(jsonReport, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlReportPath = path.join(reportsDir, 'manual-guide-validation.html');
    fs.writeFileSync(htmlReportPath, htmlReport);

    // Print summary
    this.printSummary();

    console.log(`\n📄 Reports generated:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  generateHTMLReport() {
    const { summary, features } = this.results;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual Testing Guide - Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9rem; }
        .passed { color: #27ae60; }
        .failed { color: #e74c3c; }
        .completion { color: #3498db; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .feature-group { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .feature-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .feature-header h3 { margin: 0; color: #2c3e50; }
        .feature-list { padding: 0; }
        .feature-item { padding: 15px 20px; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: between; align-items: center; }
        .feature-item:last-child { border-bottom: none; }
        .feature-name { flex: 1; }
        .feature-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-pending { background: #fff3cd; color: #856404; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Manual Testing Guide Validation</h1>
            <p>Complete feature validation report for Focus App</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value completion">${summary.completionRate}%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${summary.passedTests}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${summary.failedTests}</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
        </div>

        <div class="features">
            ${Object.entries(features).map(([category, tests]) => `
                <div class="feature-group">
                    <div class="feature-header">
                        <h3>${category}</h3>
                    </div>
                    <div class="feature-list">
                        ${tests.length > 0 ? tests.map(test => `
                            <div class="feature-item">
                                <div class="feature-name">${test.name}</div>
                                <div class="feature-status status-${test.status || 'pending'}">
                                    ${(test.status || 'pending').toUpperCase()}
                                </div>
                            </div>
                        `).join('') : '<div class="feature-item"><div class="feature-name">No tests found</div></div>'}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Focus App - Manual Testing Guide Validation Complete</p>
        </div>
    </div>
</body>
</html>`;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 MANUAL TESTING GUIDE VALIDATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Completion Rate: ${this.results.summary.completionRate}%`);
    console.log(`✅ Tests Passed: ${this.results.summary.passedTests}`);
    console.log(`❌ Tests Failed: ${this.results.summary.failedTests}`);
    console.log(`📝 Total Tests: ${this.results.summary.totalTests}`);
    
    if (this.results.summary.completionRate >= 90) {
      console.log('\n🎉 Excellent! Your app passes most Manual Testing Guide requirements.');
    } else if (this.results.summary.completionRate >= 70) {
      console.log('\n👍 Good progress! Address failing tests to improve compliance.');
    } else {
      console.log('\n⚠️ Several features need attention to meet Manual Testing Guide requirements.');
    }
    
    console.log('\n📋 Feature Categories:');
    Object.entries(this.results.features).forEach(([category, tests]) => {
      const passed = tests.filter(t => t.status === 'passed').length;
      const total = tests.length;
      console.log(`   ${category}: ${passed}/${total} tests passed`);
    });
    
    console.log('='.repeat(60));
  }
}

// CLI execution
if (require.main === module) {
  const tester = new ManualGuideTester();
  tester.runCompleteTest().catch(console.error);
}

module.exports = ManualGuideTester;