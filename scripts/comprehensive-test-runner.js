#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ComprehensiveTestRunner {
  constructor() {
    this.projectRoot = process.cwd();
    this.devServerProcess = null;
    this.serverPort = 3000;
    this.serverUrl = `http://localhost:${this.serverPort}`;
    this.maxStartupTime = 60000; // 60 seconds
    this.testResults = {
      serverStarted: false,
      fixesApplied: false,
      testsRun: false,
      passed: 0,
      failed: 0,
      total: 0,
      errors: []
    };
  }

  async runCompleteTestSuite() {
    console.log('🚀 Starting comprehensive test suite...\n');

    try {
      // Step 1: Apply fixes
      console.log('📋 Step 1: Applying automated fixes...');
      await this.applyFixes();

      // Step 2: Start development server
      console.log('\n📋 Step 2: Starting development server...');
      await this.startDevServer();

      // Step 3: Wait for server to be ready
      console.log('\n📋 Step 3: Waiting for server to be ready...');
      await this.waitForServer();

      // Step 4: Run tests
      console.log('\n📋 Step 4: Running Cypress tests...');
      await this.runCypressTests();

      // Step 5: Generate report
      console.log('\n📋 Step 5: Generating comprehensive report...');
      await this.generateReport();

    } catch (error) {
      console.error('❌ Error in test suite:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      // Cleanup
      await this.cleanup();
    }

    console.log('\n🎉 Comprehensive test suite completed!');
  }

  async applyFixes() {
    try {
      const CypressTestFixer = require('./cypress-test-fixer');
      const fixer = new CypressTestFixer();
      await fixer.fixAllTests();
      this.testResults.fixesApplied = true;
      console.log('✅ Fixes applied successfully');
    } catch (error) {
      console.error('❌ Error applying fixes:', error.message);
      this.testResults.errors.push(`Fix error: ${error.message}`);
    }
  }

  async startDevServer() {
    return new Promise((resolve, reject) => {
      console.log(`Starting React development server on port ${this.serverPort}...`);
      
      // Check if server is already running
      this.checkServerRunning().then(isRunning => {
        if (isRunning) {
          console.log('✅ Development server is already running');
          this.testResults.serverStarted = true;
          resolve();
          return;
        }

        // Start the server
        this.devServerProcess = spawn('npm', ['start'], {
          cwd: this.projectRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true
        });

        let serverOutput = '';
        let serverReady = false;

        this.devServerProcess.stdout.on('data', (data) => {
          const output = data.toString();
          serverOutput += output;
          
          // Check for server ready indicators
          if (output.includes('webpack compiled') || 
              output.includes('Local:') || 
              output.includes('compiled successfully') ||
              output.includes('ready on')) {
            if (!serverReady) {
              serverReady = true;
              this.testResults.serverStarted = true;
              console.log('✅ Development server started successfully');
              resolve();
            }
          }
        });

        this.devServerProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.warn('Server warning:', error);
        });

        this.devServerProcess.on('error', (error) => {
          console.error('❌ Failed to start development server:', error.message);
          this.testResults.errors.push(`Server start error: ${error.message}`);
          reject(error);
        });

        // Timeout after maxStartupTime
        setTimeout(() => {
          if (!serverReady) {
            console.error('❌ Server startup timeout');
            this.testResults.errors.push('Server startup timeout');
            reject(new Error('Server startup timeout'));
          }
        }, this.maxStartupTime);
      });
    });
  }

  async checkServerRunning() {
    return new Promise((resolve) => {
      const req = http.get(this.serverUrl, (res) => {
        resolve(true);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async waitForServer() {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let waitTime = 0;

    while (waitTime < maxWaitTime) {
      const isRunning = await this.checkServerRunning();
      if (isRunning) {
        console.log('✅ Server is ready and responding');
        return true;
      }
      
      console.log(`⏳ Waiting for server... (${waitTime/1000}s)`);
      await this.sleep(checkInterval);
      waitTime += checkInterval;
    }

    throw new Error('Server failed to respond within timeout period');
  }

  async runCypressTests() {
    const testFiles = [
      'cypress/e2e/auth.cy.js',
      'cypress/e2e/basic-integration.cy.js'
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    for (const testFile of testFiles) {
      console.log(`\n  🧪 Running ${testFile}...`);
      
      try {
        const result = await this.runSingleTest(testFile);
        if (result.success) {
          console.log(`  ✅ ${testFile} passed`);
          totalPassed++;
        } else {
          console.log(`  ❌ ${testFile} failed`);
          totalFailed++;
          this.testResults.errors.push(`Test failed: ${testFile}`);
        }
      } catch (error) {
        console.log(`  ❌ ${testFile} error: ${error.message}`);
        totalFailed++;
        this.testResults.errors.push(`Test error: ${testFile} - ${error.message}`);
      }
    }

    this.testResults.passed = totalPassed;
    this.testResults.failed = totalFailed;
    this.testResults.total = testFiles.length;
    this.testResults.testsRun = true;

    console.log(`\n📊 Test Results: ${totalPassed} passed, ${totalFailed} failed`);
  }

  async runSingleTest(testFile) {
    return new Promise((resolve) => {
      const cypressProcess = spawn('npx', ['cypress', 'run', '--spec', testFile, '--headless'], {
        cwd: this.projectRoot,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let errorOutput = '';

      cypressProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      cypressProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      cypressProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          error: errorOutput,
          exitCode: code
        });
      });

      // Timeout after 2 minutes per test
      setTimeout(() => {
        cypressProcess.kill();
        resolve({
          success: false,
          output,
          error: 'Test timeout',
          exitCode: -1
        });
      }, 120000);
    });
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        serverStarted: this.testResults.serverStarted,
        fixesApplied: this.testResults.fixesApplied,
        testsRun: this.testResults.testsRun,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        total: this.testResults.total,
        successRate: this.testResults.total > 0 ? 
          Math.round((this.testResults.passed / this.testResults.total) * 100) : 0
      },
      errors: this.testResults.errors,
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps()
    };

    const reportPath = path.join(this.projectRoot, 'comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.displayReport(report);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.testResults.serverStarted) {
      recommendations.push('Fix development server startup issues');
      recommendations.push('Check for port conflicts on port 3000');
      recommendations.push('Verify all dependencies are installed');
    }

    if (this.testResults.failed > 0) {
      recommendations.push('Debug failing tests individually using Cypress GUI');
      recommendations.push('Check browser console for JavaScript errors');
      recommendations.push('Verify Supabase configuration and connectivity');
    }

    if (this.testResults.passed === 0 && this.testResults.testsRun) {
      recommendations.push('All tests are failing - check basic app functionality');
      recommendations.push('Verify environment variables are set correctly');
      recommendations.push('Check if database is accessible and properly configured');
    }

    return recommendations;
  }

  generateNextSteps() {
    const steps = [];

    if (this.testResults.passed > 0) {
      steps.push(`${this.testResults.passed} tests are now passing!`);
      steps.push('Continue fixing remaining test failures');
    }

    if (this.testResults.failed > 0) {
      steps.push('Run failing tests individually to debug specific issues');
      steps.push('Use "npm run cypress:open" for interactive debugging');
    }

    steps.push('Consider setting up continuous integration');
    steps.push('Add more comprehensive test coverage');

    return steps;
  }

  displayReport(report) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPREHENSIVE TEST EXECUTION REPORT');
    console.log('='.repeat(70));
    console.log(`Server Started: ${report.summary.serverStarted ? '✅' : '❌'}`);
    console.log(`Fixes Applied: ${report.summary.fixesApplied ? '✅' : '❌'}`);
    console.log(`Tests Run: ${report.summary.testsRun ? '✅' : '❌'}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Total: ${report.summary.total}`);

    if (report.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      report.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

    console.log('\n📋 Next Steps:');
    report.nextSteps.forEach(step => {
      console.log(`  • ${step}`);
    });

    console.log('\n📄 Full report saved to: comprehensive-test-report.json');
    console.log('='.repeat(70));
  }

  async cleanup() {
    if (this.devServerProcess) {
      console.log('\n🧹 Cleaning up development server...');
      this.devServerProcess.kill();
      
      // Wait a bit for graceful shutdown
      await this.sleep(2000);
      
      // Force kill if still running
      try {
        process.kill(this.devServerProcess.pid, 'SIGKILL');
      } catch (error) {
        // Process already terminated
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Quick test mode - just run basic tests without full server startup
  async runQuickTests() {
    console.log('⚡ Running quick test mode...\n');

    await this.applyFixes();
    
    // Check if server is already running
    const serverRunning = await this.checkServerRunning();
    
    if (!serverRunning) {
      console.log('❌ Development server is not running');
      console.log('Please start the server with "npm start" and try again');
      return false;
    }

    console.log('✅ Server is running, proceeding with tests...');
    await this.runCypressTests();
    await this.generateReport();

    return this.testResults.passed > 0;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new ComprehensiveTestRunner();

  if (args.includes('--quick') || args.includes('-q')) {
    await runner.runQuickTests();
  } else {
    await runner.runCompleteTestSuite();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;